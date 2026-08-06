import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "./prisma";
import { ensureLegacyHousehold } from "./household";

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

/**
 * Which household this request is scoped to. Normally the client sends it in
 * the x-household-id header (or ?hh= for plain-link downloads); requests
 * without one — old tabs, pre-upgrade clients — fall back to the oldest
 * household, which matches the single-household behavior they expect.
 */
export async function resolveHouseholdId(req: Request): Promise<string | null> {
  const fromHeader = req.headers.get("x-household-id");
  if (fromHeader) return fromHeader;
  const fromQuery = new URL(req.url).searchParams.get("hh");
  if (fromQuery) return fromQuery;
  await ensureLegacyHousehold();
  const oldest = await prisma.household.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return oldest?.id ?? null;
}
