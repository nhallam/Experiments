import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { updateUserSchema } from "@/lib/validators";
import { handleZod, jsonError } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();
    const input = updateUserSchema.parse(body);
    const user = await prisma.user.update({ where: { id }, data: { name: input.name } });
    return NextResponse.json(user);
  } catch (e) {
    if (e instanceof ZodError) return handleZod(e);
    if (e instanceof Error && e.message.includes("Unique")) {
      return jsonError("That name is already taken.", 409);
    }
    return jsonError("Failed to update user.", 500);
  }
}
