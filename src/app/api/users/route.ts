import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { createUserSchema } from "@/lib/validators";
import { handleZod, jsonError } from "@/lib/api-helpers";

export async function GET() {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = createUserSchema.parse(body);
    const existing = await prisma.user.count();
    if (existing >= 3) {
      return jsonError("This household is full (3 users max).", 400);
    }
    const user = await prisma.user.create({ data: { name: input.name } });
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) return handleZod(e);
    if (e instanceof Error && e.message.includes("Unique")) {
      return jsonError("That name is already taken.", 409);
    }
    return jsonError("Failed to create user.", 500);
  }
}
