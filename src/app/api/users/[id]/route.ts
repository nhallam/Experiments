import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { updateUserSchema, MIN_HOUSEHOLD_SIZE } from "@/lib/validators";
import { handleZod, jsonError } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();
    const input = updateUserSchema.parse(body);
    const user = await prisma.user.update({ where: { id }, data: { name: input.name } });
    return NextResponse.json(user);
  } catch (e) {
    if (e instanceof ZodError) return handleZod(e);
    if (e instanceof Error && e.message.includes("Unique")) {
      return jsonError("That name is already taken.", 409);
    }
    return jsonError("Failed to update user.", 500);
  }
}

const RENT_SHARES_KEY = "rent.shares";
const RENT_PAYER_KEY = "rent.defaultPayerId";

function stripKey(json: string, id: string): string | null {
  try {
    const map = JSON.parse(json) as Record<string, number>;
    if (!(id in map)) return null;
    delete map[id];
    return JSON.stringify(map);
  } catch {
    return null;
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return jsonError("No such housemate.", 404);

    const [expenses, shares, settlements, remaining] = await Promise.all([
      prisma.expense.count({ where: { payerId: id } }),
      prisma.expenseShare.count({ where: { userId: id } }),
      prisma.settlement.count({ where: { OR: [{ fromId: id }, { toId: id }] } }),
      prisma.user.count({ where: { householdId: user.householdId, NOT: { id } } }),
    ]);
    if (expenses + shares + settlements > 0) {
      return jsonError(
        `${user.name} is part of logged expenses or settlements and can't be removed. Rename them instead.`,
        409,
      );
    }
    if (remaining < MIN_HOUSEHOLD_SIZE) {
      return jsonError(
        `A household needs at least ${MIN_HOUSEHOLD_SIZE} housemates.`,
        400,
      );
    }

    await prisma.$transaction(async (tx) => {
      // Drop the leaving housemate from split configs so Settings shows the
      // remainder as unallocated instead of silently keeping stale shares.
      const recurring = await tx.recurringExpense.findMany({
        where: { householdId: user.householdId },
      });
      for (const r of recurring) {
        const stripped = stripKey(r.sharesBp, id);
        const clearPayer = r.defaultPayerId === id;
        if (stripped !== null || clearPayer) {
          await tx.recurringExpense.update({
            where: { id: r.id },
            data: {
              ...(stripped !== null && { sharesBp: stripped }),
              ...(clearPayer && { defaultPayerId: null }),
            },
          });
        }
      }
      if (user.householdId) {
        const rentSettings = await tx.householdSetting.findMany({
          where: {
            householdId: user.householdId,
            key: { in: [RENT_SHARES_KEY, RENT_PAYER_KEY] },
          },
        });
        for (const s of rentSettings) {
          if (s.key === RENT_SHARES_KEY) {
            const stripped = stripKey(s.value, id);
            if (stripped !== null) {
              await tx.householdSetting.update({
                where: { id: s.id },
                data: { value: stripped },
              });
            }
          } else if (s.value === id) {
            await tx.householdSetting.update({
              where: { id: s.id },
              data: { value: "" },
            });
          }
        }
      }
      await tx.user.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("Failed to remove housemate.", 500);
  }
}
