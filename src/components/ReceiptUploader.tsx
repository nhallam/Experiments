"use client";

import { useState } from "react";

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
};

export function ReceiptUploader({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large (max 5MB).");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("filename", file.name);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="label">Receipt (optional)</label>
      {value ? (
        <div className="flex items-start gap-3">
          {/* Plain img — receipts are Vercel Blob URLs; no need for Next/Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Receipt"
            className="h-24 w-24 rounded-lg border border-neutral-200 object-cover"
          />
          <button type="button" className="btn-ghost" onClick={() => onChange(null)}>
            Remove
          </button>
        </div>
      ) : (
        <label className="btn-secondary cursor-pointer w-full">
          {uploading ? "Uploading…" : "Add photo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />
        </label>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
