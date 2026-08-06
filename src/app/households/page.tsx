"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import {
  useCurrentHouseholdId,
  readCurrentUserId,
  writeCurrentUserId,
} from "@/lib/identity";
import type { Household } from "@/types";

export default function HouseholdsPage() {
  const router = useRouter();
  const [, setHouseholdId] = useCurrentHouseholdId();
  const [households, setHouseholds] = useState<Household[] | null>(null);

  useEffect(() => {
    api
      .get<Household[]>("/api/households")
      .then(setHouseholds)
      .catch(() => setHouseholds([]));
  }, []);

  const choose = (h: Household) => {
    setHouseholdId(h.id);
    const uid = readCurrentUserId();
    if (uid && !h.users.some((u) => u.id === uid)) {
      writeCurrentUserId(null);
    }
    router.replace("/");
  };

  return (
    <main className="flex-1 p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Choose your household</h1>
        <p className="text-neutral-600">
          Each household keeps its own expenses, rent and bills.
        </p>
      </header>

      {households === null ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : (
        <div className="space-y-3">
          {households.map((h) => (
            <button
              key={h.id}
              className="card block w-full p-5 text-left transition hover:shadow-md"
              onClick={() => choose(h)}
            >
              <p className="font-semibold">{h.name}</p>
              <p className="mt-1 text-sm text-neutral-600">
                {h.users.map((u) => u.name).join(" · ")}
              </p>
            </button>
          ))}

          <Link
            href="/onboarding"
            className="card block w-full border-dashed p-5 text-center text-neutral-600 transition hover:shadow-md"
          >
            + New household
          </Link>
        </div>
      )}
    </main>
  );
}
