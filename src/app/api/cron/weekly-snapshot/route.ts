import { NextResponse } from "next/server";
import { storeWeeklySnapshot } from "@/lib/snapshot";
import { appTimeZone } from "@/lib/week";
import { jsonError } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Weekly snapshot job. Invoked by Vercel Cron (see vercel.json) at the end of
 * each week. If CRON_SECRET is set, Vercel sends it as a Bearer token and we
 * require a match; locally you can hit this route directly when no secret is set.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return jsonError("Unauthorized.", 401);
    }
  }

  try {
    const stored = await storeWeeklySnapshot(new Date(), appTimeZone());
    return NextResponse.json({ ok: true, snapshot: stored });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Snapshot failed.";
    return jsonError(msg, 500);
  }
}
