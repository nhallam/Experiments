import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { updateExpenseSchema } from "@/lib/validators";
import { handleZod, jsonError, requireUserId } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: {
      payer: true,
      category: true,
      shares: { include: { user: true } },
    },
  });
  if (!expense) return jsonError("Not found", 404);
  return NextResponse.json(expense);
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();
    const input = updateExpenseSchema.parse(body);
    const createdById = requireUserId(req) ?? input.createdById ?? null;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.expenseShare.deleteMany({ where: { expenseId: id } });
      return tx.expense.update({
        where: { id },
        data: {
          amount: input.amount,
          currency: input.currency,
          payerId: input.payerId,
          categoryId: input.categoryId ?? null,
          note: input.note ?? null,
          receiptUrl: input.receiptUrl ?? null,
          date: input.date,
          createdById,
          shares: {
            create: input.shares.map((s) => ({
              userId: s.userId,
              amount: s.amount,
            })),
          },
        },
        include: { shares: true, payer: true, category: true },
      });
    });

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof ZodError) return handleZod(e);
    return jsonError("Failed to update expense.", 500);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("Failed to delete expense.", 500);
  }
}
