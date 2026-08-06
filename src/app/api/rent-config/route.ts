import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { rentConfigSchema } from "@/lib/validators";
import { getRentConfig, saveRentConfig } from "@/lib/rent";
import { handleZod, jsonError, resolveHouseholdId } from "@/lib/api-helpers";

export async function GET(req: Request) {
  try {
    const householdId = await resolveHouseholdId(req);
    if (!householdId) {
      return NextResponse.json({ totalCents: 0, shares: {}, defaultPayerId: null });
    }
    const config = await getRentConfig(householdId);
    return NextResponse.json(config);
  } catch {
    return jsonError("Failed to load rent config.", 500);
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const input = rentConfigSchema.parse(body);
    const householdId = await resolveHouseholdId(req);
    if (!householdId) {
      return jsonError("No household yet — create one first.", 400);
    }
    await saveRentConfig(householdId, input);
    return NextResponse.json(input);
  } catch (e) {
    if (e instanceof ZodError) return handleZod(e);
    return jsonError("Failed to save rent config.", 500);
  }
}
