"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { formatMoney } from "@/lib/money";
import { todayISO } from "@/lib/format";
import type { Category, Expense, User } from "@/types";

type RentConfig = {
  totalCents: number;
  shares: Record<string, number>;
  defaultPayerId: string | null;
};

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function firstOfMonth(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default function LogRentPage() {
  const router = useRouter();
  const params = useSearchParams();
  const period = params.get("period") ?? currentPeriod();

  const [users, setUsers] = useState<User[] | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [config, setConfig] = useState<RentConfig | null>(null);
  const [existing, setExisting] = useState<Expense[] | null>(null);

  const [payerId, setPayerId] = useState<string | null>(null);
  const [date, setDate] = useState<string>(firstOfMonth(period));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<User[]>("/api/users"),
      api.get<Category[]>("/api/categories"),
      api.get<RentConfig>("/api/rent-config"),
    ])
      .then(([u, c, r]) => {
        setUsers(u);
        setCategories(c);
        setConfig(r);
        setPayerId(r.defaultPayerId ?? u[0]?.id ?? null);
      })
      .catch(() => {
        setUsers([]);
        setCategories([]);
      });
  }, []);

  const rentCategory = useMemo(
    () => categories?.find((c) => c.name === "Rent") ?? null,
    [categories],
  );

  useEffect(() => {
    if (!rentCategory) return;
    const [y, m] = period.split("-").map(Number);
    const from = new Date(y, m - 1, 1).toISOString();
    const to = new Date(y, m, 1).toISOString();
    api
      .get<{ items: Expense[] }>(
        `/api/expenses?categoryId=${rentCategory.id}&from=${encodeURIComponent(
          from,
        )}&to=${encodeURIComponent(to)}&limit=10`,
      )
      .then((r) => setExisting(r.items))
      .catch(() => setExisting([]));
  }, [rentCategory, period]);

  const loading = !users || !categories || !config;

  const configValid =
    config !== null &&
    config.totalCents > 0 &&
    Object.values(config.shares).reduce((s, n) => s + n, 0) === config.totalCents;

  const submit = async () => {
    if (!config || !rentCategory || !payerId) return;
    setError(null);
    setSubmitting(true);
    try {
      const shares = Object.entries(config.shares)
        .filter(([, amt]) => amt > 0)
        .map(([userId, amount]) => ({ userId, amount }));
      const payload = {
        amount: config.totalCents,
        currency: "USD",
        payerId,
        categoryId: rentCategory.id,
        note: `${monthLabel(period)} rent`,
        receiptUrl: null,
        date: new Date(date).toISOString(),
        shares,
      };
      await api.post<Expense>("/api/expenses", payload);
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to log rent.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <main className="flex-1 p-6 text-neutral-500">Loading…</main>;
  }

  const userById = Object.fromEntries(users!.map((u) => [u.id, u]));

  return (
    <main className="flex-1 space-y-5 p-4">
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-semibold">Log rent</h1>
        <button className="btn-ghost" onClick={() => router.back()}>
          Cancel
        </button>
      </header>

      <div className="card space-y-4 p-5">
        <div>
          <p className="text-sm text-neutral-500">Month</p>
          <p className="text-lg font-semibold">{monthLabel(period)}</p>
        </div>

        {!configValid ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Rent isn&apos;t set up yet, or the splits don&apos;t add up to the total.
            <div className="mt-2">
              <Link href="/settings" className="btn-secondary">
                Open settings
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div>
              <p className="text-sm text-neutral-500">Total</p>
              <p className="text-3xl font-semibold">
                {formatMoney(config!.totalCents)}
              </p>
            </div>

            <div>
              <p className="label">Paid by</p>
              <div className="flex flex-wrap gap-2">
                {users!.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className={
                      "chip " + (payerId === u.id ? "chip-active" : "")
                    }
                    onClick={() => setPayerId(u.id)}
                  >
                    {u.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="label">Date</p>
              <input
                className="input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={todayISO()}
              />
            </div>

            <div>
              <p className="label">Split</p>
              <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
                {users!.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span>{u.name}</span>
                    <span className="font-medium">
                      {formatMoney(config!.shares[u.id] ?? 0)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {existing && existing.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Heads up — {existing.length === 1 ? "a rent expense is" : `${existing.length} rent expenses are`}{" "}
                already logged for {monthLabel(period)}.
                {existing.map((ex) => (
                  <div key={ex.id} className="mt-1">
                    {formatMoney(ex.amount)} paid by{" "}
                    {userById[ex.payerId]?.name ?? "?"}{" "}
                    on {new Date(ex.date).toLocaleDateString()}.{" "}
                    <Link
                      href={`/expenses/${ex.id}`}
                      className="underline"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              className="btn-primary w-full"
              onClick={submit}
              disabled={submitting || !payerId}
            >
              {submitting ? "Logging…" : `Log ${formatMoney(config!.totalCents)} rent`}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
