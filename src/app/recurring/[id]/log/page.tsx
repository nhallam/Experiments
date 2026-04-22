"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { formatMoney, splitByWeights } from "@/lib/money";
import { todayISO } from "@/lib/format";
import { BP_TOTAL } from "@/lib/validators";
import type { Expense, RecurringExpense, User } from "@/types";

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

function defaultLogDate(period: string, dueDay: number | null): string {
  const [y, m] = period.split("-").map(Number);
  const lastOfMonth = new Date(y, m, 0).getDate();
  const day = dueDay ? Math.min(dueDay, lastOfMonth) : 1;
  const d = new Date(y, m - 1, day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default function LogRecurringPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params.id;
  const period = searchParams.get("period") ?? currentPeriod();

  const [users, setUsers] = useState<User[] | null>(null);
  const [template, setTemplate] = useState<RecurringExpense | null>(null);
  const [existing, setExisting] = useState<Expense[] | null>(null);

  const [payerId, setPayerId] = useState<string | null>(null);
  const [date, setDate] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<User[]>("/api/users"),
      api.get<RecurringExpense>(`/api/recurring/${id}`),
    ])
      .then(([u, t]) => {
        setUsers(u);
        setTemplate(t);
        setPayerId(t.defaultPayerId ?? u[0]?.id ?? null);
        setDate(defaultLogDate(period, t.dueDay));
      })
      .catch(() => {
        setUsers([]);
        setTemplate(null);
      });
  }, [id, period]);

  useEffect(() => {
    const [y, m] = period.split("-").map(Number);
    const from = new Date(y, m - 1, 1).toISOString();
    const to = new Date(y, m, 1).toISOString();
    api
      .get<{ items: Expense[] }>(
        `/api/expenses?from=${encodeURIComponent(from)}&to=${encodeURIComponent(
          to,
        )}&limit=50`,
      )
      .then((r) =>
        setExisting(r.items.filter((e) => e.recurringExpenseId === id)),
      )
      .catch(() => setExisting([]));
  }, [id, period]);

  const loading = !users || !template;

  const configValid =
    template !== null &&
    template.defaultCents > 0 &&
    Object.values(template.sharesBp).reduce((s, n) => s + n, 0) === BP_TOTAL;

  const centsByUser = useMemo(() => {
    if (!template || !users || !configValid) return {} as Record<string, number>;
    const ordered = [...users]
      .filter((u) => (template.sharesBp[u.id] ?? 0) > 0)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((u) => ({ id: u.id, weight: template.sharesBp[u.id] }));
    if (ordered.length === 0) return {};
    return splitByWeights(template.defaultCents, ordered);
  }, [template, users, configValid]);

  const submit = async () => {
    if (!template || !payerId) return;
    setError(null);
    setSubmitting(true);
    try {
      const shares = Object.entries(centsByUser)
        .filter(([, amt]) => amt > 0)
        .map(([userId, amount]) => ({ userId, amount }));
      await api.post<Expense>("/api/expenses", {
        amount: template.defaultCents,
        currency: template.currency,
        payerId,
        categoryId: template.categoryId,
        recurringExpenseId: template.id,
        note: `${monthLabel(period)} ${template.name}`,
        receiptUrl: null,
        date: new Date(date).toISOString(),
        shares,
      });
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to log.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <main className="flex-1 p-6 text-neutral-500">Loading…</main>;
  }

  if (!template) {
    return (
      <main className="flex-1 p-4">
        <p className="text-sm text-red-600">Template not found.</p>
      </main>
    );
  }

  const userById = Object.fromEntries(users!.map((u) => [u.id, u]));

  return (
    <main className="flex-1 space-y-5 p-4">
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-semibold">Log {template.name}</h1>
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
            This template isn&apos;t set up — amount is zero or splits don&apos;t
            add up to 100%.
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
                {formatMoney(template.defaultCents)}
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
                {users!.map((u) => {
                  const bp = template.sharesBp[u.id] ?? 0;
                  const pct = (bp / 100).toFixed(2).replace(/\.?0+$/, "");
                  return (
                    <li
                      key={u.id}
                      className="flex items-center justify-between px-3 py-2 text-sm"
                    >
                      <span>
                        {u.name}
                        {bp > 0 && (
                          <span className="ml-2 text-xs text-neutral-500">
                            {pct}%
                          </span>
                        )}
                      </span>
                      <span className="font-medium">
                        {formatMoney(centsByUser[u.id] ?? 0)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {existing && existing.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Heads up —{" "}
                {existing.length === 1
                  ? "a payment for this template is"
                  : `${existing.length} payments for this template are`}{" "}
                already logged for {monthLabel(period)}.
                {existing.map((ex) => (
                  <div key={ex.id} className="mt-1">
                    {formatMoney(ex.amount)} paid by{" "}
                    {userById[ex.payerId]?.name ?? "?"} on{" "}
                    {new Date(ex.date).toLocaleDateString()}.{" "}
                    <Link href={`/expenses/${ex.id}`} className="underline">
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
              {submitting
                ? "Logging…"
                : `Log ${formatMoney(template.defaultCents)}`}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
