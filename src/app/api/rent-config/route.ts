import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { rentConfigSchema } from "@/lib/validators";
import { getRentConfig, saveRentConfig } from "@/lib/rent";
import { handleZod, jsonError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const config = await getRentConfig();
    return NextResponse.json(config);
  } catch {
    return jsonError("Failed to load rent config.", 500);
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const input = rentConfigSchema.parse(body);
    await saveRentConfig(input);
    return NextResponse.json(input);
  } catch (e) {
    if (e instanceof ZodError) return handleZod(e);
    return jsonError("Failed to save rent config.", 500);
  }
}
