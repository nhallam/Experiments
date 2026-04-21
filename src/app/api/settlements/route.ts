import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { createSettlementSchema } from "@/lib/validators";
import { handleZod, jsonError } from "@/lib/api-helpers";

export async function GET() {
  const settlements = await prisma.settlement.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: { from: true, to: true },
  });
  return NextResponse.json(settlements);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = createSettlementSchema.parse(body);
    const settlement = await prisma.settlement.create({
      data: {
        fromId: input.fromId,
        toId: input.toId,
        amount: input.amount,
        currency: input.currency,
        date: input.date,
        note: input.note ?? null,
      },
    });
    return NextResponse.json(settlement, { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) return handleZod(e);
    return jsonError("Failed to record settlement.", 500);
  }
}
