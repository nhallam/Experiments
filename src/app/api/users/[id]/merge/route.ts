import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { mergeUserSchema } from "@/lib/validators";
import { handleZod, jsonError } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

function mergeBpMaps(json: string, fromId: string, intoId: string): string | null {
  try {
    const map = JSON.parse(json) as Record<string, number>;
    if (!(fromId in map)) return null;
    map[intoId] = (map[intoId] ?? 0) + map[fromId];
    delete map[fromId];
    return JSON.stringify(map);
  } catch {
    return null;
  }
}

const RENT_SHARES_KEY = "rent.shares";
const RENT_PAYER_KEY = "rent.defaultPayerId";

/**
 * Folds one housemate's entire history into another — for a couple that
 * shares money and wants to appear as a single account. Balances are
 * preserved exactly: expenses, shares and settlements are reassigned, and
 * settlements between the two (now internal) are dropped, which nets to
 * zero by definition.
 */
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();
    const input = mergeUserSchema.parse(body);
    if (input.intoId === id) {
      return jsonError("Pick a different housemate to merge into.", 400);
    }

    const [from, into] = await Promise.all([
      prisma.user.findUnique({ where: { id } }),
      prisma.user.findUnique({ where: { id: input.intoId } }),
    ]);
    if (!from || !into) return jsonError("No such housemate.", 404);
    if (from.householdId !== into.householdId) {
      return jsonError("Housemates must be in the same household.", 400);
    }

    await prisma.$transaction(async (tx) => {
      // Shares: where both people already share the same expense, combine
      // the amounts; otherwise just reassign.
      const fromShares = await tx.expenseShare.findMany({
        where: { userId: from.id },
      });
      const intoShares = await tx.expenseShare.findMany({
        where: {
          userId: into.id,
          expenseId: { in: fromShares.map((s) => s.expenseId) },
        },
      });
      const intoByExpense = new Map(intoShares.map((s) => [s.expenseId, s]));
      for (const s of fromShares) {
        const existing = intoByExpense.get(s.expenseId);
        if (existing) {
          await tx.expenseShare.update({
            where: { id: existing.id },
            data: { amount: existing.amount + s.amount },
          });
          await tx.expenseShare.delete({ where: { id: s.id } });
        } else {
          await tx.expenseShare.update({
            where: { id: s.id },
            data: { userId: into.id },
          });
        }
      }

      await tx.expense.updateMany({
        where: { payerId: from.id },
        data: { payerId: into.id },
      });
      await tx.expense.updateMany({
        where: { createdById: from.id },
        data: { createdById: into.id },
      });

      // Settlements between the pair become self-payments — net zero, drop.
      await tx.settlement.deleteMany({
        where: {
          OR: [
            { fromId: from.id, toId: into.id },
            { fromId: into.id, toId: from.id },
          ],
        },
      });
      await tx.settlement.updateMany({
        where: { fromId: from.id },
        data: { fromId: into.id },
      });
      await tx.settlement.updateMany({
        where: { toId: from.id },
        data: { toId: into.id },
      });

      const recurring = await tx.recurringExpense.findMany({
        where: { householdId: from.householdId },
      });
      for (const r of recurring) {
        const merged = mergeBpMaps(r.sharesBp, from.id, into.id);
        const movePayer = r.defaultPayerId === from.id;
        if (merged !== null || movePayer) {
          await tx.recurringExpense.update({
            where: { id: r.id },
            data: {
              ...(merged !== null && { sharesBp: merged }),
              ...(movePayer && { defaultPayerId: into.id }),
            },
          });
        }
      }

      if (from.householdId) {
        const rentSettings = await tx.householdSetting.findMany({
          where: {
            householdId: from.householdId,
            key: { in: [RENT_SHARES_KEY, RENT_PAYER_KEY] },
          },
        });
        for (const s of rentSettings) {
          if (s.key === RENT_SHARES_KEY) {
            const merged = mergeBpMaps(s.value, from.id, into.id);
            if (merged !== null) {
              await tx.householdSetting.update({
                where: { id: s.id },
                data: { value: merged },
              });
            }
          } else if (s.value === from.id) {
            await tx.householdSetting.update({
              where: { id: s.id },
              data: { value: into.id },
            });
          }
        }
      }

      await tx.user.delete({ where: { id: from.id } });
    });

    return NextResponse.json({ ok: true, intoId: into.id });
  } catch (e) {
    if (e instanceof ZodError) return handleZod(e);
    return jsonError("Failed to merge housemates.", 500);
  }
}
