import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeNetBalances } from "@/lib/balances";

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

  const byId = Object.fromEntries(users.map((u) => [u.id, u.name]));
  return NextResponse.json(
    net.map((b) => ({ userId: b.userId, name: byId[b.userId] ?? "Unknown", net: b.net })),
  );
}
