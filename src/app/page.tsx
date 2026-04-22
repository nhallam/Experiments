"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { BalancesPanel } from "@/components/BalancesPanel";
import { ExpenseCard } from "@/components/ExpenseCard";
import { RentCard } from "@/components/RentCard";
import { ThisMonthsBills } from "@/components/ThisMonthsBills";
import type { Expense } from "@/types";

export default function HomePage() {
  const [expenses, setExpenses] = useState<Expense[] | null>(null);

  useEffect(() => {
    api
      .get<{ items: Expense[] }>("/api/expenses?limit=10")
      .then((r) => setExpenses(r.items))
      .catch(() => setExpenses([]));
  }, []);

  return (
    <main className="flex-1 space-y-6 p-4">
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-semibold">Home</h1>
        <Link href="/expenses/new" className="btn-primary">
          Add expense
        </Link>
      </header>

      <BalancesPanel />

      <RentCard />

      <ThisMonthsBills />

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent</h2>
          <Link href="/expenses" className="text-sm text-brand-dark hover:underline">
            See all
          </Link>
        </div>
        {expenses === null ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : expenses.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No expenses yet. Add one to get started.
          </p>
        ) : (
          <ul className="space-y-2">
            {expenses.map((e) => (
              <li key={e.id}>
                <ExpenseCard expense={e} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
