"use client";

import { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { FileInput } from "@astryxdesign/core/FileInput";
import { FieldStatus } from "@astryxdesign/core/FieldStatus";

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
      {value ? (
        <div>
          <span className="label">Receipt (optional)</span>
          <div className="flex items-start gap-3">
            {/* Plain img — receipts are Vercel Blob URLs; no need for Next/Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Receipt"
              className="h-24 w-24 rounded-lg border border-neutral-200 object-cover"
            />
            <Button label="Remove" variant="ghost" onClick={() => onChange(null)} />
          </div>
        </div>
      ) : (
        <FileInput
          label="Receipt (optional)"
          accept="image/*"
          value={null}
          isLoading={uploading}
          onChange={(files) => {
            const f = Array.isArray(files) ? files[0] : files;
            if (f) upload(f);
          }}
        />
      )}
      {error && <FieldStatus type="error" message={error} />}
    </div>
  );
}
