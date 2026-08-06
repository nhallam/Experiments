import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { createHouseholdSchema } from "@/lib/validators";
import { ensureLegacyHousehold, householdLabel } from "@/lib/household";
import { handleZod, jsonError } from "@/lib/api-helpers";

export async function GET() {
  try {
    await ensureLegacyHousehold();
    const households = await prisma.household.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        users: {
          orderBy: { createdAt: "asc" },
          select: { id: true, name: true },
        },
      },
    });
    return NextResponse.json(households);
  } catch {
    return jsonError("Failed to list households.", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = createHouseholdSchema.parse(body);

    const household = await prisma.$transaction(async (tx) => {
      const created = await tx.household.create({
        data: { name: input.name?.trim() || householdLabel(input.names) },
      });
      for (const name of input.names) {
        await tx.user.create({ data: { name, householdId: created.id } });
      }
      return tx.household.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          users: {
            orderBy: { createdAt: "asc" },
            select: { id: true, name: true },
          },
        },
      });
    });

    return NextResponse.json(household, { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) return handleZod(e);
    return jsonError("Failed to create household.", 500);
  }
}
