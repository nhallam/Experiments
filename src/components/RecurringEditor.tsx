"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { api } from "@/lib/api-client";
import { toCents, formatMoney } from "@/lib/money";
import { BP_TOTAL } from "@/lib/validators";
import type { Category, RecurringExpense, User } from "@/types";

type FormState = {
  id: string | null;
  name: string;
  amount: string;
  categoryId: string | null;
  defaultPayerId: string | null;
  dueDay: string;
  shareInputs: Record<string, string>;
};

function emptyForm(): FormState {
  return {
    id: null,
    name: "",
    amount: "",
    categoryId: null,
    defaultPayerId: null,
    dueDay: "",
    shareInputs: {},
  };
}

function fromRecurring(r: RecurringExpense, users: User[]): FormState {
  return {
    id: r.id,
    name: r.name,
    amount: (r.defaultCents / 100).toFixed(2),
    categoryId: r.categoryId,
    defaultPayerId: r.defaultPayerId,
    dueDay: r.dueDay ? String(r.dueDay) : "",
    shareInputs: Object.fromEntries(
      users.map((u) => [
        u.id,
        r.sharesBp[u.id] ? (r.sharesBp[u.id] / 100).toString() : "",
      ]),
    ),
  };
}

function formatBp(bp: number): string {
  return (bp / 100).toFixed(2).replace(/\.00$/, "");
}

type Props = {
  users: User[];
  categories: Category[];
};

export function RecurringEditor({ users, categories }: Props) {
  const [items, setItems] = useState<RecurringExpense[] | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    const qs = showArchived ? "?includeArchived=1" : "";
    api
      .get<RecurringExpense[]>(`/api/recurring${qs}`)
      .then(setItems)
      .catch(() => setItems([]));
  };

  useEffect(refresh, [showArchived]);

  const sharesBp = useMemo(() => {
    const out: Record<string, number> = {};
    if (!form) return out;
    for (const u of users) {
      const v = form.shareInputs[u.id];
      if (!v) {
        out[u.id] = 0;
        continue;
      }
      try {
        out[u.id] = toCents(v);
      } catch {
        out[u.id] = 0;
      }
    }
    return out;
  }, [form, users]);

  const bpSum = Object.values(sharesBp).reduce((s, n) => s + n, 0);
  const bpRemainder = BP_TOTAL - bpSum;

  const startNew = () => {
    setForm(emptyForm());
    setError(null);
  };

  const startEdit = (r: RecurringExpense) => {
    setForm(fromRecurring(r, users));
    setError(null);
  };

  const save = async () => {
    if (!form) return;
    setError(null);
    if (!form.name.trim()) {
      setError("Enter a name.");
      return;
    }
    let amountCents = 0;
    if (form.amount) {
      try {
        amountCents = toCents(form.amount);
      } catch {
        setError("Invalid amount.");
        return;
      }
    }
    if (amountCents < 0) {
      setError("Amount can't be negative.");
      return;
    }
    if (bpRemainder !== 0) {
      setError(
        bpRemainder > 0
          ? `${formatBp(bpRemainder)}% left to allocate.`
          : `${formatBp(-bpRemainder)}% over 100%.`,
      );
      return;
    }
    let dueDay: number | null = null;
    if (form.dueDay) {
      const n = parseInt(form.dueDay, 10);
      if (!Number.isInteger(n) || n < 1 || n > 31) {
        setError("Due day must be 1–31.");
        return;
      }
      dueDay = n;
    }

    const payload = {
      name: form.name.trim(),
      kind: "fixed",
      defaultCents: amountCents,
      currency: "USD",
      categoryId: form.categoryId,
      defaultPayerId: form.defaultPayerId,
      dueDay,
      sharesBp,
      sortOrder: 0,
    };

    setSaving(true);
    try {
      if (form.id) {
        await api.patch<RecurringExpense>(`/api/recurring/${form.id}`, payload);
      } else {
        await api.post<RecurringExpense>(`/api/recurring`, payload);
      }
      setForm(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const archive = async (id: string) => {
    await api.delete(`/api/recurring/${id}`);
    refresh();
  };

  const restore = async (id: string) => {
    await api.patch(`/api/recurring/${id}`, { archived: false });
    refresh();
  };

  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recurring expenses</h2>
        {form === null && (
          <button className="btn-secondary" onClick={startNew}>
            Add
          </button>
        )}
      </div>
      <p className="mb-4 text-sm text-neutral-600">
        Templates for bills you pay every month — Internet, Cleaner, utilities,
        etc. Log each one when it&apos;s due.
      </p>

      {items === null ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : items.length === 0 && form === null ? (
        <p className="text-sm text-neutral-500">
          No recurring expenses yet. Add one to get started.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {items.map((r) => {
            const cat = categories.find((c) => c.id === r.categoryId);
            const payer = users.find((u) => u.id === r.defaultPayerId);
            return (
              <li
                key={r.id}
                className={clsx(
                  "flex items-center justify-between gap-3 py-3",
                  r.archived && "opacity-60",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {cat?.icon ? `${cat.icon} ` : ""}
                    {r.name}
                    {r.archived && (
                      <span className="ml-2 text-xs text-neutral-500">
                        archived
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {formatMoney(r.defaultCents)}
                    {payer && ` · ${payer.name}`}
                    {r.dueDay && ` · due ${r.dueDay}${ordinalSuffix(r.dueDay)}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {r.archived ? (
                    <button
                      className="btn-ghost px-2 py-1 text-sm"
                      onClick={() => restore(r.id)}
                    >
                      Restore
                    </button>
                  ) : (
                    <>
                      <button
                        className="btn-ghost px-2 py-1 text-sm"
                        onClick={() => startEdit(r)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-ghost px-2 py-1 text-sm"
                        onClick={() => archive(r.id)}
                      >
                        Archive
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3">
        <label className="flex items-center gap-2 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Show archived
        </label>
      </div>

      {form && (
        <div className="mt-4 rounded-lg border border-neutral-200 p-4">
          <h3 className="mb-3 text-sm font-semibold">
            {form.id ? "Edit template" : "New recurring expense"}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="label">Name</label>
              <input
                className="input"
                placeholder="Internet"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => f && { ...f, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((f) => f && { ...f, amount: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="label">Due day</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  max="31"
                  inputMode="numeric"
                  placeholder="1"
                  value={form.dueDay}
                  onChange={(e) =>
                    setForm((f) => f && { ...f, dueDay: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="label">Category</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={clsx(
                    "chip",
                    form.categoryId === null && "chip-active",
                  )}
                  onClick={() =>
                    setForm((f) => f && { ...f, categoryId: null })
                  }
                >
                  None
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={clsx(
                      "chip",
                      form.categoryId === c.id && "chip-active",
                    )}
                    onClick={() =>
                      setForm((f) => f && { ...f, categoryId: c.id })
                    }
                  >
                    {c.icon ? `${c.icon} ` : ""}
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Default payer</label>
              <div className="flex flex-wrap gap-2">
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className={clsx(
                      "chip",
                      form.defaultPayerId === u.id && "chip-active",
                    )}
                    onClick={() =>
                      setForm((f) => f && { ...f, defaultPayerId: u.id })
                    }
                  >
                    {u.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Split (%)</label>
              <ul className="space-y-2">
                {users.map((u) => {
                  const bp = sharesBp[u.id] ?? 0;
                  let amountCents = 0;
                  try {
                    const total = form.amount ? toCents(form.amount) : 0;
                    amountCents = Math.round((total * bp) / BP_TOTAL);
                  } catch {
                    amountCents = 0;
                  }
                  return (
                    <li key={u.id} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 truncate text-sm">
                        {u.name}
                      </span>
                      <div className="relative w-28 shrink-0">
                        <input
                          className="input pr-7"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          inputMode="decimal"
                          placeholder="0"
                          value={form.shareInputs[u.id] ?? ""}
                          onChange={(e) =>
                            setForm(
                              (f) =>
                                f && {
                                  ...f,
                                  shareInputs: {
                                    ...f.shareInputs,
                                    [u.id]: e.target.value,
                                  },
                                },
                            )
                          }
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
                          %
                        </span>
                      </div>
                      <span className="text-sm text-neutral-500">
                        {bp > 0 && amountCents > 0 ? formatMoney(amountCents) : "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p
                className={clsx(
                  "mt-2 text-xs",
                  bpRemainder === 0 ? "text-neutral-500" : "text-red-600",
                )}
              >
                {bpSum === 0
                  ? "Enter each person's percentage."
                  : bpRemainder === 0
                    ? "Adds up to 100%."
                    : bpRemainder > 0
                      ? `${formatBp(bpRemainder)}% left to allocate.`
                      : `${formatBp(-bpRemainder)}% over 100%.`}
              </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <button
                className="btn-ghost flex-1"
                onClick={() => {
                  setForm(null);
                  setError(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary flex-1"
                onClick={save}
                disabled={saving}
              >
                {saving ? "Saving…" : form.id ? "Save changes" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}
