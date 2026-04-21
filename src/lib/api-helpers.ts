import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleZod(err: ZodError) {
  const flat = err.flatten();
  const first = Object.values(flat.fieldErrors).flat().find(Boolean) ?? err.message;
  return NextResponse.json(
    { error: first, details: flat },
    { status: 400 },
  );
}

export function requireUserId(req: Request): string | null {
  return req.headers.get("x-user-id");
}
