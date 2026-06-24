import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { storeWeeklySnapshot } from "@/lib/snapshot";
import { appTimeZone } from "@/lib/week";
import { jsonError } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** List stored weekly snapshots, newest first. */
export async function GET() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json([]);
  }
  try {
    const { blobs } = await list({ prefix: "snapshots/" });
    const items = blobs
      .map((b) => ({
        url: b.url,
        pathname: b.pathname,
        size: b.size,
        uploadedAt: b.uploadedAt,
      }))
      .sort((a, b) => String(b.uploadedAt).localeCompare(String(a.uploadedAt)));
    return NextResponse.json(items);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list snapshots.";
    return jsonError(msg, 500);
  }
}

/** Generate a snapshot for the current week right now (manual trigger). */
export async function POST() {
  try {
    const stored = await storeWeeklySnapshot(new Date(), appTimeZone());
    return NextResponse.json(stored);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Snapshot failed.";
    return jsonError(msg, 500);
  }
}
