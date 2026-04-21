"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { ExpenseForm } from "@/components/ExpenseForm";
import type { Category, User } from "@/types";

export default function NewExpensePage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[] | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<User[]>("/api/users"),
      api.get<Category[]>("/api/categories"),
    ])
      .then(([u, c]) => {
        setUsers(u);
        setCategories(c);
      })
      .catch(() => {
        setUsers([]);
        setCategories([]);
      });
  }, []);

  if (!users || !categories) {
    return <main className="flex-1 p-6 text-neutral-500">Loading…</main>;
  }

  return (
    <main className="flex-1 p-4">
      <header className="mb-4 flex items-center justify-between pt-2">
        <h1 className="text-2xl font-semibold">New expense</h1>
        <button className="btn-ghost" onClick={() => router.back()}>
          Cancel
        </button>
      </header>

      <ExpenseForm
        users={users}
        categories={categories}
        onSaved={() => router.push("/")}
        onCancel={() => router.back()}
      />
    </main>
  );
}
