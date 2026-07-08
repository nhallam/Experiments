"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { api } from "@/lib/api-client";
import { useCurrentUserId } from "@/lib/identity";
import { toCents } from "@/lib/money";
import { todayISO } from "@/lib/format";
import {
  computeShares,
  initParticipants,
  SplitEditor,
  type ParticipantState,
  type SplitMode,
} from "./SplitEditor";
import { ReceiptUploader } from "./ReceiptUploader";
import type { Category, Expense, User } from "@/types";

type FormValues = {
  amount: string;
  payerId: string;
  categoryId: string | null;
  note: string;
  date: string;
  receiptUrl: string | null;
  mode: SplitMode;
  participants: ParticipantState[];
};

function valuesFromExpense(expense: Expense, users: User[]): FormValues {
  const participants = initParticipants(users).map((p) => {
    const share = expense.shares?.find((s) => s.userId === p.userId);
    return share
      ? {
          ...p,
          included: true,
          exact: (share.amount / 100).toFixed(2),
        }
      : { ...p, included: false };
  });
  return {
    amount: (expense.amount / 100).toFixed(2),
    payerId: expense.payerId,
    categoryId: expense.categoryId,
    note: expense.note ?? "",
    date: expense.date.slice(0, 10),
    receiptUrl: expense.receiptUrl,
    mode: "exact",
    participants,
  };
}

type Props = {
  users: User[];
  categories: Category[];
  existing?: Expense;
  onSaved: (expense: Expense) => void;
  onCancel?: () => void;
};

export function ExpenseForm({ users, categories, existing, onSaved, onCancel }: Props) {
  const [currentId] = useCurrentUserId();

  const [values, setValues] = useState<FormValues>(() =>
    existing
      ? valuesFromExpense(existing, users)
      : {
          amount: "",
          payerId: currentId ?? users[0]?.id ?? "",
          categoryId: null,
          note: "",
          date: todayISO(),
          receiptUrl: null,
          mode: "equal",
          participants: initParticipants(users),
        },
  );

  useEffect(() => {
    if (!existing && currentId && !values.payerId) {
      setValues((v) => ({ ...v, payerId: currentId }));
    }
  }, [currentId, existing, values.payerId]);

  const totalCents = useMemo(() => {
    if (values.amount === "") return 0;
    try {
      return toCents(values.amount);
    } catch {
      return 0;
    }
  }, [values.amount]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    if (totalCents <= 0) return setError("Enter an amount.");
    if (!values.payerId) return setError("Pick a payer.");

    const { shares, error: splitError } = computeShares(
      totalCents,
      values.mode,
      values.participants,
      users,
    );
    if (splitError) return setError(splitError);

    const payload = {
      amount: totalCents,
      currency: "USD",
      payerId: values.payerId,
      categoryId: values.categoryId,
      note: values.note || null,
      receiptUrl: values.receiptUrl,
      date: new Date(values.date).toISOString(),
      shares: Object.entries(shares)
        .filter(([, amt]) => amt > 0 || values.mode === "exact")
        .map(([userId, amount]) => ({ userId, amount })),
    };

    setSubmitting(true);
    try {
      const saved = existing
        ? await api.patch<Expense>(`/api/expenses/${existing.id}`, payload)
        : await api.post<Expense>("/api/expenses", payload);
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div>
        <label className="label">Amount</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
            $
          </span>
          <input
            className="input pl-7 text-2xl"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            value={values.amount}
            onChange={(e) => setValues((v) => ({ ...v, amount: e.target.value }))}
            autoFocus={!existing}
          />
        </div>
      </div>

      <div>
        <label className="label">Paid by</label>
        <div className="flex flex-wrap gap-2">
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              className={clsx("chip", values.payerId === u.id && "chip-active")}
              onClick={() => setValues((v) => ({ ...v, payerId: u.id }))}
            >
              {u.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Category</label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={clsx("chip", values.categoryId === null && "chip-active")}
            onClick={() => setValues((v) => ({ ...v, categoryId: null }))}
          >
            None
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={clsx("chip", values.categoryId === c.id && "chip-active")}
              onClick={() => setValues((v) => ({ ...v, categoryId: c.id }))}
            >
              {c.icon ? `${c.icon} ` : ""}
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date</label>
          <input
            className="input"
            type="date"
            value={values.date}
            onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Note</label>
          <input
            className="input"
            type="text"
            placeholder="e.g. Tesco run"
            value={values.note}
            onChange={(e) => setValues((v) => ({ ...v, note: e.target.value }))}
          />
        </div>
      </div>

      <SplitEditor
        users={users}
        mode={values.mode}
        onModeChange={(m) => setValues((v) => ({ ...v, mode: m }))}
        participants={values.participants}
        onParticipantsChange={(p) => setValues((v) => ({ ...v, participants: p }))}
        totalCents={totalCents}
      />

      <ReceiptUploader
        value={values.receiptUrl}
        onChange={(url) => setValues((v) => ({ ...v, receiptUrl: url }))}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        {onCancel && (
          <button type="button" className="btn-ghost flex-1" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary flex-1" disabled={submitting}>
          {submitting ? "Saving…" : existing ? "Save changes" : "Add expense"}
        </button>
      </div>
    </form>
  );
}
