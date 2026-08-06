"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useCurrentUserId, useCurrentHouseholdId } from "@/lib/identity";
import type { Household } from "@/types";

export default function OnboardingPage() {
  const router = useRouter();
  const [, setCurrentId] = useCurrentUserId();
  const [, setHouseholdId] = useCurrentHouseholdId();
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
      const household = await api.post<Household>("/api/households", {
        names: cleaned,
      });
      setHouseholdId(household.id);
      const me = household.users.find((u) => u.name === cleaned[0]);
      setCurrentId(me?.id ?? null);
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
          Set up a household with its three housemates. Start with your own
          name — you can rename anyone later.
        </p>
      </header>

      <div className="card space-y-4 p-5">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <label className="label">
              {i === 0 ? "Housemate 1 (you)" : `Housemate ${i + 1}`}
            </label>
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
