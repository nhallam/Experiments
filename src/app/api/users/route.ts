import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { createUserSchema, MAX_HOUSEHOLD_SIZE } from "@/lib/validators";
import { handleZod, jsonError, resolveHouseholdId } from "@/lib/api-helpers";

export async function GET(req: Request) {
  const householdId = await resolveHouseholdId(req);
  if (!householdId) return NextResponse.json([]);
  const users = await prisma.user.findMany({
    where: { householdId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = createUserSchema.parse(body);
    const householdId = await resolveHouseholdId(req);
    if (!householdId) {
      return jsonError("No household yet — create one first.", 400);
    }
    const existing = await prisma.user.count({ where: { householdId } });
    if (existing >= MAX_HOUSEHOLD_SIZE) {
      return jsonError(
        `This household is full (${MAX_HOUSEHOLD_SIZE} housemates max).`,
        400,
      );
    }
    const user = await prisma.user.create({
      data: { name: input.name, householdId },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) return handleZod(e);
    if (e instanceof Error && e.message.includes("Unique")) {
      return jsonError("That name is already taken.", 409);
    }
    return jsonError("Failed to create user.", 500);
  }
}
