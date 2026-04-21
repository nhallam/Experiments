import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { createExpenseSchema, expenseFilterSchema } from "@/lib/validators";
import { handleZod, jsonError, requireUserId } from "@/lib/api-helpers";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = expenseFilterSchema.parse(Object.fromEntries(searchParams));

    const where: Record<string, unknown> = {};
    if (filter.categoryId) where.categoryId = filter.categoryId;
    if (filter.userId) {
      where.OR = [
        { payerId: filter.userId },
        { shares: { some: { userId: filter.userId } } },
      ];
    }
    if (filter.from || filter.to) {
      where.date = {
        ...(filter.from && { gte: filter.from }),
        ...(filter.to && { lte: filter.to }),
      };
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: filter.limit + 1,
      ...(filter.cursor && { cursor: { id: filter.cursor }, skip: 1 }),
      include: {
        payer: true,
        category: true,
        shares: { include: { user: true } },
      },
    });

    const hasMore = expenses.length > filter.limit;
    const items = hasMore ? expenses.slice(0, filter.limit) : expenses;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({ items, nextCursor });
  } catch (e) {
    if (e instanceof ZodError) return handleZod(e);
    return jsonError("Failed to list expenses.", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = createExpenseSchema.parse(body);
    const createdById = requireUserId(req) ?? input.createdById ?? null;

    const expense = await prisma.$transaction(async (tx) => {
      return tx.expense.create({
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

    return NextResponse.json(expense, { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) return handleZod(e);
    return jsonError("Failed to create expense.", 500);
  }
}
