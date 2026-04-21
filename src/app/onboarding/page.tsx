"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useCurrentUserId } from "@/lib/identity";
import type { User } from "@/types";

export default function OnboardingPage() {
  const router = useRouter();
  const [, setCurrentId] = useCurrentUserId();
  const [names, setNames] = useState(["", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setName = (i: number, v: string) => {
    setNames((cur) => cur.map((x, idx) => (idx === i ? v : x)));
  };

  const submit = async () => {
    setError(null);
    const cleaned = names.map((n) => n.trim());
    if (cleaned.some((n) => !n)) return setError("Enter all three names.");
    if (new Set(cleaned).size !== 3) return setError("Names must be unique.");

    setSubmitting(true);
    try {
      const created: User[] = [];
      for (const name of cleaned) {
        const u = await api.post<User>("/api/users", { name });
        created.push(u);
      }
      if (created[0]) setCurrentId(created[0].id);
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1 p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Welcome home</h1>
        <p className="text-neutral-600">
          Let&apos;s set up the three housemates. You can rename them later.
        </p>
      </header>

      <div className="card space-y-4 p-5">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <label className="label">Housemate {i + 1}</label>
            <input
              className="input"
              placeholder="Name"
              value={names[i]}
              onChange={(e) => setName(i, e.target.value)}
              autoCapitalize="words"
              autoComplete="off"
            />
          </div>
        ))}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          className="btn-primary w-full"
          onClick={submit}
          disabled={submitting}
        >
          {submitting ? "Setting up…" : "Get started"}
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-neutral-500">
        Currency: USD · Categories seeded automatically
      </p>
    </main>
  );
}
