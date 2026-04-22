import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { recurringExpenseSchema } from "@/lib/validators";
import { serializeRecurring } from "@/lib/recurring";
import { handleZod, jsonError } from "@/lib/api-helpers";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("includeArchived") === "1";

    const rows = await prisma.recurringExpense.findMany({
      where: includeArchived ? undefined : { archived: false },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { category: true },
    });
    return NextResponse.json(rows.map(serializeRecurring));
  } catch {
    return jsonError("Failed to list recurring expenses.", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = recurringExpenseSchema.parse(body);

    const created = await prisma.recurringExpense.create({
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
    return NextResponse.json(serializeRecurring(created), { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) return handleZod(e);
    return jsonError("Failed to create recurring expense.", 500);
  }
}
