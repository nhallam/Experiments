import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { jsonError } from "@/lib/api-helpers";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return jsonError("No file provided.", 400);
    }
    const filename = (form.get("filename") as string | null) ?? `receipt-${Date.now()}.jpg`;
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return jsonError("Blob storage not configured.", 500);
    }
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return jsonError(msg, 500);
  }
}
