"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { TextInput } from "@astryxdesign/core/TextInput";
import { DateInput } from "@astryxdesign/core/DateInput";
import { ToggleButton } from "@astryxdesign/core/ToggleButton";
import { FieldStatus } from "@astryxdesign/core/FieldStatus";
import type { ISODateString } from "@astryxdesign/core/Calendar";
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
      <NumberInput
        label="Amount"
        hasClear
        min={0}
        step={0.01}
        units="$"
        placeholder="0.00"
        hasAutoFocus={!existing}
        value={values.amount === "" ? null : parseFloat(values.amount)}
        onChange={(v) =>
          setValues((val) => ({ ...val, amount: v === null ? "" : String(v) }))
        }
      />

      <div>
        <span className="label">Paid by</span>
        <div className="flex flex-wrap gap-2">
          {users.map((u) => (
            <ToggleButton
              key={u.id}
              label={u.name}
              isPressed={values.payerId === u.id}
              onPressedChange={() => setValues((v) => ({ ...v, payerId: u.id }))}
            />
          ))}
        </div>
      </div>

      <div>
        <span className="label">Category</span>
        <div className="flex flex-wrap gap-2">
          <ToggleButton
            label="None"
            isPressed={values.categoryId === null}
            onPressedChange={() => setValues((v) => ({ ...v, categoryId: null }))}
          />
          {categories.map((c) => (
            <ToggleButton
              key={c.id}
              label={c.name}
              icon={c.icon ? <span>{c.icon}</span> : undefined}
              isPressed={values.categoryId === c.id}
              onPressedChange={() => setValues((v) => ({ ...v, categoryId: c.id }))}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DateInput
          label="Date"
          value={values.date === "" ? undefined : (values.date as ISODateString)}
          onChange={(v) => setValues((val) => ({ ...val, date: v ?? "" }))}
        />
        <TextInput
          label="Note"
          placeholder="e.g. Tesco run"
          value={values.note}
          onChange={(v) => setValues((val) => ({ ...val, note: v }))}
        />
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

      {error && <FieldStatus type="error" message={error} />}

      <div className="flex gap-2">
        {onCancel && (
          <Button
            label="Cancel"
            variant="ghost"
            onClick={onCancel}
            className="flex-1"
          />
        )}
        <Button
          label={submitting ? "Saving…" : existing ? "Save changes" : "Add expense"}
          variant="primary"
          type="submit"
          isDisabled={submitting}
          className="flex-1"
        />
      </div>
    </form>
  );
}
