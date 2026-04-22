import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeNetBalances, simplifyDebts } from "@/lib/balances";

function parseExcluded(req: Request): string[] {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("excludeCategoryIds");
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function GET(req: Request) {
  const excluded = parseExcluded(req);
  const expenseWhere = excluded.length
    ? { categoryId: { notIn: excluded } }
    : undefined;
  const shareWhere = excluded.length
    ? { expense: { categoryId: { notIn: excluded } } }
    : undefined;

  const [users, expenses, shares, settlements] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true } }),
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
