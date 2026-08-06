import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeNetBalances, simplifyDebts } from "@/lib/balances";
import { resolveHouseholdId } from "@/lib/api-helpers";

function parseExcluded(req: Request): string[] {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("excludeCategoryIds");
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function GET(req: Request) {
  const householdId = await resolveHouseholdId(req);
  if (!householdId) return NextResponse.json([]);

  const excluded = parseExcluded(req);
  const expenseWhere = {
    payer: { householdId },
    ...(excluded.length && { categoryId: { notIn: excluded } }),
  };
  const shareWhere = {
    user: { householdId },
    ...(excluded.length && { expense: { categoryId: { notIn: excluded } } }),
  };

  const [users, expenses, shares, settlements] = await Promise.all([
    prisma.user.findMany({
      where: { householdId },
      select: { id: true, name: true },
    }),
    prisma.expense.findMany({
      where: expenseWhere,
      select: { payerId: true, amount: true },
    }),
    prisma.expenseShare.findMany({
      where: shareWhere,
      select: { userId: true, amount: true },
    }),
    excluded.length
      ? Promise.resolve([] as { fromId: string; toId: string; amount: number }[])
      : prisma.settlement.findMany({
          where: { from: { householdId } },
          select: { fromId: true, toId: true, amount: true },
        }),
  ]);

  const net = computeNetBalances({
    userIds: users.map((u) => u.id),
    expenses,
    shares,
    settlements,
  });
  const transfers = simplifyDebts(net);
  const byId = Object.fromEntries(users.map((u) => [u.id, u.name]));
  return NextResponse.json(
    transfers.map((t) => ({
      from: t.from,
      fromName: byId[t.from] ?? "Unknown",
      to: t.to,
      toName: byId[t.to] ?? "Unknown",
      amount: t.amount,
    })),
  );
}
