import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { createCategorySchema } from "@/lib/validators";
import { handleZod, jsonError } from "@/lib/api-helpers";

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = createCategorySchema.parse(body);
    const cat = await prisma.category.create({ data: input });
    return NextResponse.json(cat, { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) return handleZod(e);
    if (e instanceof Error && e.message.includes("Unique")) {
      return jsonError("That category already exists.", 409);
    }
    return jsonError("Failed to create category.", 500);
  }
}
