"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useCurrentUserId, useCurrentHouseholdId } from "@/lib/identity";
import { MIN_HOUSEHOLD_SIZE, MAX_HOUSEHOLD_SIZE } from "@/lib/validators";
import type { Household } from "@/types";

export default function OnboardingPage() {
  const router = useRouter();
  const [, setCurrentId] = useCurrentUserId();
  const [, setHouseholdId] = useCurrentHouseholdId();
  const [names, setNames] = useState(["", ""]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setName = (i: number, v: string) => {
    setNames((cur) => cur.map((x, idx) => (idx === i ? v : x)));
  };

  const addRow = () => {
    setNames((cur) =>
      cur.length < MAX_HOUSEHOLD_SIZE ? [...cur, ""] : cur,
    );
  };

  const removeRow = (i: number) => {
    setNames((cur) =>
      cur.length > MIN_HOUSEHOLD_SIZE ? cur.filter((_, idx) => idx !== i) : cur,
    );
  };

  const submit = async () => {
    setError(null);
    const cleaned = names.map((n) => n.trim());
    if (cleaned.some((n) => !n)) return setError("Enter every name.");
    if (new Set(cleaned).size !== cleaned.length)
      return setError("Names must be unique.");

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
          Set up a household with its housemates. Start with your own name —
          you can rename anyone later, and a couple sharing money can be one
          entry (e.g. &ldquo;Shy &amp; Jas&rdquo;).
        </p>
      </header>

      <div className="card space-y-4 p-5">
        {names.map((name, i) => (
          <div key={i}>
            <label className="label">
              {i === 0 ? "Housemate 1 (you)" : `Housemate ${i + 1}`}
            </label>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(i, e.target.value)}
                autoCapitalize="words"
                autoComplete="off"
              />
              {names.length > MIN_HOUSEHOLD_SIZE && (
                <button
                  type="button"
                  className="btn-ghost px-3"
                  aria-label={`Remove housemate ${i + 1}`}
                  onClick={() => removeRow(i)}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}

        {names.length < MAX_HOUSEHOLD_SIZE && (
          <button type="button" className="btn-secondary w-full" onClick={addRow}>
            + Add another housemate
          </button>
        )}

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
