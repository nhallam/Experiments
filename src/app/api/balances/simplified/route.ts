import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeNetBalances, simplifyDebts } from "@/lib/balances";

export async function GET() {
  const [users, expenses, shares, settlements] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true } }),
    prisma.expense.findMany({ select: { payerId: true, amount: true } }),
    prisma.expenseShare.findMany({ select: { userId: true, amount: true } }),
    prisma.settlement.findMany({ select: { fromId: true, toId: true, amount: true } }),
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
