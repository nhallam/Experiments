"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { ExpenseForm } from "@/components/ExpenseForm";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";
import type { Category, Expense, User } from "@/types";

export default function ExpenseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    api.get<Expense>(`/api/expenses/${params.id}`).then(setExpense).catch(() => setExpense(null));
  }, [params?.id]);

  useEffect(() => {
    if (editing && (!users || !categories)) {
      Promise.all([
        api.get<User[]>("/api/users"),
        api.get<Category[]>("/api/categories"),
      ]).then(([u, c]) => {
        setUsers(u);
        setCategories(c);
      });
    }
  }, [editing, users, categories]);

  const remove = async () => {
    if (!expense) return;
    if (!confirm("Delete this expense? This can't be undone.")) return;
    setDeleting(true);
    try {
      await api.delete(`/api/expenses/${expense.id}`);
      router.replace("/");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
      setDeleting(false);
    }
  };

  if (!expense) return <main className="flex-1 p-6 text-neutral-500">Loading…</main>;

  if (editing && users && categories) {
    return (
      <main className="flex-1 p-4">
        <header className="mb-4 pt-2">
          <h1 className="text-2xl font-semibold">Edit expense</h1>
        </header>
        <ExpenseForm
          users={users}
          categories={categories}
          existing={expense}
          onSaved={(e) => {
            setExpense(e);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </main>
    );
  }

  return (
    <main className="flex-1 space-y-4 p-4">
      <header className="pt-2">
        <h1 className="text-2xl font-semibold">Expense</h1>
      </header>

      <div className="card space-y-3 p-5">
        <div>
          <p className="text-sm text-neutral-500">
            {expense.category?.icon ? `${expense.category.icon} ` : ""}
            {expense.category?.name ?? "No category"} · {formatDate(expense.date)}
          </p>
          <p className="text-3xl font-semibold">{formatMoney(expense.amount, expense.currency)}</p>
        </div>
        {expense.note && <p className="text-neutral-700">{expense.note}</p>}
        <p className="text-sm">
          Paid by <strong>{expense.payer?.name ?? "Unknown"}</strong>
        </p>
        <div>
          <p className="label">Split</p>
          <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
            {expense.shares?.map((s) => (
              <li key={s.id} className="flex items-center justify-between p-3">
                <span>{s.user?.name ?? "Unknown"}</span>
                <span className="font-medium">{formatMoney(s.amount, expense.currency)}</span>
              </li>
            ))}
          </ul>
        </div>
        {expense.receiptUrl && (
          <div>
            <p className="label">Receipt</p>
            <a href={expense.receiptUrl} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={expense.receiptUrl}
                alt="Receipt"
                className="max-h-80 rounded-lg border border-neutral-200"
              />
            </a>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button className="btn-secondary flex-1" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button className="btn-danger flex-1" onClick={remove} disabled={deleting}>
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </main>
  );
}
