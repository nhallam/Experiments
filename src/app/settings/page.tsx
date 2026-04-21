"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useCurrentUserId } from "@/lib/identity";
import type { Category, User } from "@/types";

export default function SettingsPage() {
  const [currentId, setCurrentId] = useCurrentUserId();
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    Promise.all([
      api.get<User[]>("/api/users"),
      api.get<Category[]>("/api/categories"),
    ]).then(([u, c]) => {
      setUsers(u);
      setCategories(c);
    });
  };

  useEffect(refresh, []);

  const startEdit = (u: User) => {
    setEditingId(u.id);
    setEditName(u.name);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setError(null);
    try {
      await api.patch<User>(`/api/users/${editingId}`, { name: editName });
      setEditingId(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    }
  };

  const addCategory = async () => {
    setError(null);
    if (!newCategory.trim()) return;
    try {
      await api.post<Category>("/api/categories", {
        name: newCategory.trim(),
        icon: newIcon.trim() || undefined,
      });
      setNewCategory("");
      setNewIcon("");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add.");
    }
  };

  return (
    <main className="flex-1 space-y-6 p-4">
      <header className="pt-2">
        <h1 className="text-2xl font-semibold">Settings</h1>
      </header>

      <section className="card p-5">
        <h2 className="mb-3 text-lg font-semibold">Housemates</h2>
        <ul className="divide-y divide-neutral-100">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between py-3">
              {editingId === u.id ? (
                <>
                  <input
                    className="input mr-2"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <button className="btn-primary px-3 py-1" onClick={saveEdit}>
                    Save
                  </button>
                  <button
                    className="btn-ghost px-2 py-1"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <p className="font-medium">{u.name}</p>
                    {currentId === u.id && (
                      <p className="text-xs text-neutral-500">That&apos;s you</p>
                    )}
                  </div>
                  <button className="btn-ghost" onClick={() => startEdit(u)}>
                    Rename
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 text-lg font-semibold">Your identity</h2>
        <p className="mb-3 text-sm text-neutral-600">
          You are currently signed in as{" "}
          <strong>{users.find((u) => u.id === currentId)?.name ?? "unknown"}</strong>.
        </p>
        <button className="btn-secondary" onClick={() => setCurrentId(null)}>
          Switch user
        </button>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 text-lg font-semibold">Categories</h2>
        <ul className="mb-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <li key={c.id} className="chip">
              {c.icon ? `${c.icon} ` : ""}
              {c.name}
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="New category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <input
            className="input w-20"
            placeholder="🙂"
            maxLength={4}
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
          />
          <button className="btn-primary" onClick={addCategory}>
            Add
          </button>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </main>
  );
}
