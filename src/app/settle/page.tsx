"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { api } from "@/lib/api-client";
import { useCurrentUserId } from "@/lib/identity";
import { toCents, formatMoney } from "@/lib/money";
import { formatDate, todayISO } from "@/lib/format";
import type { Settlement, SimplifiedTransfer, User } from "@/types";

export default function SettlePage() {
  const router = useRouter();
  const [currentId] = useCurrentUserId();
  const [users, setUsers] = useState<User[]>([]);
  const [transfers, setTransfers] = useState<SimplifiedTransfer[]>([]);
  const [history, setHistory] = useState<Settlement[]>([]);

  const [fromId, setFromId] = useState<string>("");
  const [toId, setToId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(todayISO());
  const [note, setNote] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<User[]>("/api/users"),
      api.get<SimplifiedTransfer[]>("/api/balances/simplified"),
      api.get<Settlement[]>("/api/settlements"),
    ]).then(([u, t, s]) => {
      setUsers(u);
      setTransfers(t);
      setHistory(s);
      if (currentId) setFromId(currentId);
    });
  }, [currentId]);

  const applySuggestion = (t: SimplifiedTransfer) => {
    setFromId(t.from);
    setToId(t.to);
    setAmount((t.amount / 100).toFixed(2));
  };

  const submit = async () => {
    setError(null);
    if (!fromId || !toId) return setError("Pick both people.");
    if (fromId === toId) return setError("From and to must differ.");
    let cents = 0;
    try {
      cents = toCents(amount);
    } catch {
      return setError("Enter a valid amount.");
    }
    if (cents <= 0) return setError("Enter a valid amount.");

    setSubmitting(true);
    try {
      await api.post("/api/settlements", {
        fromId,
        toId,
        amount: cents,
        currency: "USD",
        date: new Date(date).toISOString(),
        note: note || null,
      });
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1 space-y-4 p-4">
      <header className="pt-2">
        <h1 className="text-2xl font-semibold">Settle up</h1>
        <p className="text-sm text-neutral-600">Record a payment between housemates.</p>
      </header>

      {transfers.length > 0 && (
        <div className="card p-4">
          <p className="mb-2 text-sm font-medium text-neutral-700">Suggested payments</p>
          <ul className="space-y-2">
            {transfers.map((t, i) => (
              <li key={i} className="flex items-center justify-between">
                <span className="text-sm">
                  <strong>{t.fromName}</strong> → <strong>{t.toName}</strong>{" "}
                  <span className="text-neutral-500">{formatMoney(t.amount)}</span>
                </span>
                <button className="btn-ghost text-xs" onClick={() => applySuggestion(t)}>
                  Use
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form
        className="card space-y-3 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div>
          <p className="label">From (who paid)</p>
          <div className="flex flex-wrap gap-2">
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                className={clsx("chip", fromId === u.id && "chip-active")}
                onClick={() => setFromId(u.id)}
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="label">To (who received)</p>
          <div className="flex flex-wrap gap-2">
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                className={clsx("chip", toId === u.id && "chip-active")}
                onClick={() => setToId(u.id)}
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Amount</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              $
            </span>
            <input
              className="input pl-7"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date</label>
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Note</label>
            <input
              className="input"
              type="text"
              placeholder="e.g. Venmo"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button className="btn-primary w-full" disabled={submitting}>
          {submitting ? "Saving…" : "Record payment"}
        </button>
      </form>

      {history.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Payment history</h2>
          <ul className="space-y-2">
            {history.map((s) => (
              <li key={s.id} className="card flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">
                    {s.from?.name ?? "?"} → {s.to?.name ?? "?"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {formatDate(s.date)}
                    {s.note ? ` · ${s.note}` : ""}
                  </p>
                </div>
                <p className="font-semibold">{formatMoney(s.amount, s.currency)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
