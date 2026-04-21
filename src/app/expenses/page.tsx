"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { api } from "@/lib/api-client";
import { ExpenseCard } from "@/components/ExpenseCard";
import type { Category, Expense, User } from "@/types";

export default function ExpensesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterUser, setFilterUser] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [items, setItems] = useState<Expense[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<User[]>("/api/users"),
      api.get<Category[]>("/api/categories"),
    ]).then(([u, c]) => {
      setUsers(u);
      setCategories(c);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "30" });
    if (filterUser) params.set("userId", filterUser);
    if (filterCategory) params.set("categoryId", filterCategory);
    api
      .get<{ items: Expense[]; nextCursor: string | null }>(
        `/api/expenses?${params.toString()}`,
      )
      .then((r) => {
        setItems(r.items);
        setCursor(r.nextCursor);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [filterUser, filterCategory]);

  const loadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    const params = new URLSearchParams({ limit: "30", cursor });
    if (filterUser) params.set("userId", filterUser);
    if (filterCategory) params.set("categoryId", filterCategory);
    try {
      const r = await api.get<{ items: Expense[]; nextCursor: string | null }>(
        `/api/expenses?${params.toString()}`,
      );
      setItems((prev) => [...prev, ...r.items]);
      setCursor(r.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <main className="flex-1 space-y-4 p-4">
      <header className="pt-2">
        <h1 className="text-2xl font-semibold">All expenses</h1>
      </header>

      <section className="space-y-2">
        <div>
          <p className="label">Person</p>
          <div className="flex flex-wrap gap-2">
            <button
              className={clsx("chip", filterUser === null && "chip-active")}
              onClick={() => setFilterUser(null)}
            >
              All
            </button>
            {users.map((u) => (
              <button
                key={u.id}
                className={clsx("chip", filterUser === u.id && "chip-active")}
                onClick={() => setFilterUser(u.id)}
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="label">Category</p>
          <div className="flex flex-wrap gap-2">
            <button
              className={clsx("chip", filterCategory === null && "chip-active")}
              onClick={() => setFilterCategory(null)}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                className={clsx("chip", filterCategory === c.id && "chip-active")}
                onClick={() => setFilterCategory(c.id)}
              >
                {c.icon ? `${c.icon} ` : ""}
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-500">No expenses match the filters.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((e) => (
            <li key={e.id}>
              <ExpenseCard expense={e} />
            </li>
          ))}
        </ul>
      )}

      {cursor && (
        <button
          className="btn-secondary w-full"
          onClick={loadMore}
          disabled={loadingMore}
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      )}
    </main>
  );
}
