"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import { formatMoney } from "@/lib/money";
import type { Expense, RecurringExpense } from "@/types";

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function ThisMonthsBills() {
  const period = currentPeriod();
  const [items, setItems] = useState<RecurringExpense[] | null>(null);
  const [loggedIds, setLoggedIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    api
      .get<RecurringExpense[]>("/api/recurring")
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    const [y, m] = period.split("-").map(Number);
    const from = new Date(y, m - 1, 1).toISOString();
    const to = new Date(y, m, 1).toISOString();
    api
      .get<{ items: Expense[] }>(
        `/api/expenses?from=${encodeURIComponent(from)}&to=${encodeURIComponent(
          to,
        )}&limit=100`,
      )
      .then((r) => {
        const ids = new Set<string>();
        for (const e of r.items) {
          if (e.recurringExpenseId) ids.add(e.recurringExpenseId);
        }
        setLoggedIds(ids);
      })
      .catch(() => setLoggedIds(new Set()));
  }, [period]);

  const rows = useMemo(() => {
    if (!items || !loggedIds) return null;
    return items.map((r) => ({ template: r, logged: loggedIds.has(r.id) }));
  }, [items, loggedIds]);

  if (rows === null) return null;
  if (rows.length === 0) return null;

  const allLogged = rows.every((r) => r.logged);

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-600">
          This month&apos;s bills
        </p>
        {allLogged && (
          <span className="text-xs text-green-700">All logged ✓</span>
        )}
      </div>
      <ul className="divide-y divide-neutral-100">
        {rows.map(({ template, logged }) => (
          <li
            key={template.id}
            className="flex items-center justify-between gap-3 py-2"
          >
            <div className="min-w-0">
              <p className="font-medium">{template.name}</p>
              <p className="text-xs text-neutral-500">
                {formatMoney(template.defaultCents)}
                {template.dueDay && ` · due ${template.dueDay}${ordinalSuffix(template.dueDay)}`}
              </p>
            </div>
            {logged ? (
              <span className="text-xs text-green-700">Logged ✓</span>
            ) : (
              <Link
                href={`/recurring/${template.id}/log?period=${period}`}
                className="btn-secondary px-3 py-1 text-sm"
              >
                Log
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}
