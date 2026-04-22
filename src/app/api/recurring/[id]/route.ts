import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { updateRecurringExpenseSchema } from "@/lib/validators";
import { serializeRecurring } from "@/lib/recurring";
import { handleZod, jsonError } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const row = await prisma.recurringExpense.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!row) return jsonError("Not found", 404);
  return NextResponse.json(serializeRecurring(row));
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Small patch: unarchive only.
    if (body && typeof body === "object" && body.archived === false && Object.keys(body).length === 1) {
      const restored = await prisma.recurringExpense.update({
        where: { id },
        data: { archived: false },
        include: { category: true },
      });
      return NextResponse.json(serializeRecurring(restored));
    }

    const input = updateRecurringExpenseSchema.parse(body);

    const updated = await prisma.recurringExpense.update({
      where: { id },
      data: {
        name: input.name,
        kind: input.kind,
        defaultCents: input.defaultCents,
        currency: input.currency,
        categoryId: input.categoryId ?? null,
        defaultPayerId: input.defaultPayerId ?? null,
        dueDay: input.dueDay ?? null,
        sharesBp: JSON.stringify(input.sharesBp),
        sortOrder: input.sortOrder,
      },
      include: { category: true },
    });
    return NextResponse.json(serializeRecurring(updated));
  } catch (e) {
    if (e instanceof ZodError) return handleZod(e);
    return jsonError("Failed to update recurring expense.", 500);
  }
}

/**
 * Soft delete (archive). Use ?hard=1 for a true delete, which is only
 * allowed when nothing is linked to it.
 */
export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    if (searchParams.get("hard") === "1") {
      const linked = await prisma.expense.count({
        where: { recurringExpenseId: id },
      });
      if (linked > 0) {
        return jsonError(
          "Can't hard-delete — expenses are linked. Archive instead.",
          409,
        );
      }
      await prisma.recurringExpense.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }
    const updated = await prisma.recurringExpense.update({
      where: { id },
      data: { archived: true },
      include: { category: true },
    });
    return NextResponse.json(serializeRecurring(updated));
  } catch {
    return jsonError("Failed to archive recurring expense.", 500);
  }
}
