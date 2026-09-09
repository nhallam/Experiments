"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { api } from "@/lib/api-client";
import { useCurrentUserId, useCurrentHouseholdId } from "@/lib/identity";
import { toCents, formatMoney } from "@/lib/money";
import { RENT_BP_TOTAL } from "@/lib/validators";
import { RecurringEditor } from "@/components/RecurringEditor";
import type { Category, Household, User } from "@/types";

type RentConfig = {
  totalCents: number;
  shares: Record<string, number>;
  defaultPayerId: string | null;
};

export default function SettingsPage() {
  const router = useRouter();
  const [currentId, setCurrentId] = useCurrentUserId();
  const [householdId, setHouseholdId] = useCurrentHouseholdId();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newHousemate, setNewHousemate] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [rent, setRent] = useState<RentConfig | null>(null);
  const [rentTotalInput, setRentTotalInput] = useState("");
  const [rentShareInputs, setRentShareInputs] = useState<Record<string, string>>({});
  const [rentPayerId, setRentPayerId] = useState<string | null>(null);
  const [rentSaving, setRentSaving] = useState(false);
  const [rentStatus, setRentStatus] = useState<string | null>(null);

  const refresh = () => {
    Promise.all([
      api.get<User[]>("/api/users"),
      api.get<Category[]>("/api/categories"),
      api.get<RentConfig>("/api/rent-config"),
      api.get<Household[]>("/api/households"),
    ]).then(([u, c, r, h]) => {
      setUsers(u);
      setCategories(c);
      setHouseholds(h);
      setRent(r);
      setRentTotalInput(r.totalCents ? (r.totalCents / 100).toFixed(2) : "");
      const shareSum = Object.values(r.shares).reduce((s, n) => s + n, 0);
      const validBp = shareSum === RENT_BP_TOTAL;
      setRentShareInputs(
        Object.fromEntries(
          u.map((user) => [
            user.id,
            validBp && r.shares[user.id]
              ? (r.shares[user.id] / 100).toString()
              : "",
          ]),
        ),
      );
      setRentPayerId(r.defaultPayerId);
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

  const addHousemate = async () => {
    const name = newHousemate.trim();
    if (!name) return;
    setError(null);
    try {
      await api.post<User>("/api/users", { name });
      setNewHousemate("");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add housemate.");
    }
  };

  const removeHousemate = async (u: User) => {
    if (
      !window.confirm(
        `Remove ${u.name} from this household? Rent and bill splits will need re-entering.`,
      )
    )
      return;
    setError(null);
    try {
      await api.delete(`/api/users/${u.id}`);
      if (currentId === u.id) setCurrentId(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove housemate.");
    }
  };

  const rentTotalCents = (() => {
    if (!rentTotalInput) return 0;
    try {
      return toCents(rentTotalInput);
    } catch {
      return 0;
    }
  })();

  const rentSharesBp: Record<string, number> = {};
  for (const u of users) {
    const v = rentShareInputs[u.id];
    if (!v) {
      rentSharesBp[u.id] = 0;
      continue;
    }
    try {
      rentSharesBp[u.id] = toCents(v);
    } catch {
      rentSharesBp[u.id] = 0;
    }
  }
  const rentBpSum = Object.values(rentSharesBp).reduce((s, n) => s + n, 0);
  const rentBpRemainder = RENT_BP_TOTAL - rentBpSum;
  const formatBp = (bp: number) => (bp / 100).toFixed(2).replace(/\.00$/, "");

  const saveRent = async () => {
    setRentStatus(null);
    if (rentTotalCents <= 0) {
      setRentStatus("Enter a rent total.");
      return;
    }
    if (rentBpRemainder !== 0) {
      setRentStatus(
        rentBpRemainder > 0
          ? `${formatBp(rentBpRemainder)}% left to allocate.`
          : `${formatBp(-rentBpRemainder)}% over 100%.`,
      );
      return;
    }
    setRentSaving(true);
    try {
      const saved = await api.put<RentConfig>("/api/rent-config", {
        totalCents: rentTotalCents,
        shares: rentSharesBp,
        defaultPayerId: rentPayerId,
      });
      setRent(saved);
      setRentStatus("Saved.");
    } catch (e) {
      setRentStatus(e instanceof Error ? e.message : "Failed to save rent.");
    } finally {
      setRentSaving(false);
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
                  <div className="flex items-center gap-1">
                    <button className="btn-ghost" onClick={() => startEdit(u)}>
                      Rename
                    </button>
                    <button
                      className="btn-ghost text-red-600"
                      onClick={() => removeHousemate(u)}
                    >
                      Remove
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <input
            className="input flex-1"
            placeholder="New housemate name"
            value={newHousemate}
            onChange={(e) => setNewHousemate(e.target.value)}
            autoCapitalize="words"
            autoComplete="off"
          />
          <button className="btn-primary" onClick={addHousemate}>
            Add
          </button>
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          A couple sharing money can be one housemate (e.g. &ldquo;Shy &amp;
          Jas&rdquo;). Someone with logged expenses can&apos;t be removed —
          rename them instead. After any change, re-check the rent and bill
          splits below.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 text-lg font-semibold">Your identity</h2>
        <p className="mb-3 text-sm text-neutral-600">
          You are currently signed in as{" "}
          <strong>{users.find((u) => u.id === currentId)?.name ?? "unknown"}</strong>
          {" "}in the{" "}
          <strong>
            {households.find((h) => h.id === householdId)?.name ?? "current"}
          </strong>{" "}
          household.
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => setCurrentId(null)}>
            Switch user
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              setHouseholdId(null);
              router.push("/households");
            }}
          >
            Switch household
          </button>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-lg font-semibold">Rent</h2>
        <p className="mb-4 text-sm text-neutral-600">
          The monthly total and how it&apos;s split. Used when you log a rent
          payment.
        </p>

        <div className="mb-4">
          <label className="label">Monthly total</label>
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
              value={rentTotalInput}
              onChange={(e) => setRentTotalInput(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="label">Split (%)</label>
          <ul className="space-y-2">
            {users.map((u) => {
              const bp = rentSharesBp[u.id] ?? 0;
              const cents = Math.round((rentTotalCents * bp) / RENT_BP_TOTAL);
              return (
                <li key={u.id} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 truncate text-sm">{u.name}</span>
                  <div className="relative w-28 shrink-0">
                    <input
                      className="input pr-7"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      inputMode="decimal"
                      placeholder="0"
                      value={rentShareInputs[u.id] ?? ""}
                      onChange={(e) =>
                        setRentShareInputs((s) => ({ ...s, [u.id]: e.target.value }))
                      }
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
                      %
                    </span>
                  </div>
                  <span className="text-sm text-neutral-500">
                    {rentTotalCents > 0 && bp > 0 ? formatMoney(cents) : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
          <p
            className={clsx(
              "mt-2 text-xs",
              rentBpRemainder === 0 ? "text-neutral-500" : "text-red-600",
            )}
          >
            {rentBpSum === 0
              ? "Enter each person's percentage."
              : rentBpRemainder === 0
                ? "Adds up to 100%."
                : rentBpRemainder > 0
                  ? `${formatBp(rentBpRemainder)}% left to allocate.`
                  : `${formatBp(-rentBpRemainder)}% over 100%.`}
          </p>
        </div>

        <div className="mb-4">
          <label className="label">Default payer</label>
          <div className="flex flex-wrap gap-2">
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                className={clsx("chip", rentPayerId === u.id && "chip-active")}
                onClick={() => setRentPayerId(u.id)}
              >
                {u.name}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Whoever pays the landlord. You can change it when logging.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn-primary"
            onClick={saveRent}
            disabled={rentSaving}
          >
            {rentSaving ? "Saving…" : "Save rent settings"}
          </button>
          {rentStatus && (
            <span
              className={clsx(
                "text-sm",
                rentStatus === "Saved." ? "text-green-600" : "text-red-600",
              )}
            >
              {rentStatus}
            </span>
          )}
        </div>

        {rent && rent.totalCents > 0 && (
          <p className="mt-3 text-xs text-neutral-500">
            Saved: {formatMoney(rent.totalCents)}/mo.
          </p>
        )}
      </section>

      <RecurringEditor users={users} categories={categories} />

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

      <section className="card p-5">
        <h2 className="mb-1 text-lg font-semibold">Export</h2>
        <p className="mb-3 text-sm text-neutral-600">
          Download every expense as a CSV — one row per expense with each
          housemate&apos;s share in its own column.
        </p>
        <a
          className="btn-secondary inline-block"
          href={
            householdId
              ? `/api/expenses/export?hh=${encodeURIComponent(householdId)}`
              : "/api/expenses/export"
          }
          download
        >
          Download CSV
        </a>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </main>
  );
}
