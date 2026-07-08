"use client";

import clsx from "clsx";
import { splitEqual, splitByWeights, toCents, formatMoney } from "@/lib/money";
import type { User } from "@/types";

export type SplitMode = "equal" | "exact" | "percent" | "shares";

export type ParticipantState = {
  userId: string;
  included: boolean;
  exact: string;   // dollars for exact mode
  percent: string; // 0-100 for percent mode
  shares: string;  // integer weights
};

export function initParticipants(users: User[]): ParticipantState[] {
  return users.map((u) => ({
    userId: u.id,
    included: true,
    exact: "",
    percent: "",
    shares: "1",
  }));
}

export function computeShares(
  totalCents: number,
  mode: SplitMode,
  participants: ParticipantState[],
  users: User[],
): { shares: Record<string, number>; error: string | null } {
  const active = participants.filter((p) => p.included);
  if (active.length === 0) {
    return { shares: {}, error: "Select at least one participant." };
  }

  // Sort by name for deterministic remainder distribution.
  const usersById = Object.fromEntries(users.map((u) => [u.id, u]));
  const sorted = [...active].sort((a, b) =>
    (usersById[a.userId]?.name ?? "").localeCompare(usersById[b.userId]?.name ?? ""),
  );

  if (mode === "equal") {
    const ids = sorted.map((p) => p.userId);
    return { shares: splitEqual(totalCents, ids), error: null };
  }

  if (mode === "exact") {
    const shares: Record<string, number> = {};
    let sum = 0;
    for (const p of sorted) {
      const c = p.exact === "" ? 0 : toCents(p.exact);
      if (c < 0) return { shares: {}, error: "Amounts cannot be negative." };
      shares[p.userId] = c;
      sum += c;
    }
    if (sum !== totalCents) {
      const diff = (totalCents - sum) / 100;
      return {
        shares,
        error: `Exact amounts must add up to the total. Off by ${formatMoney(Math.abs(totalCents - sum))} (${diff > 0 ? "missing" : "over"}).`,
      };
    }
    return { shares, error: null };
  }

  if (mode === "percent") {
    let pctSum = 0;
    const weights = sorted.map((p) => {
      const w = p.percent === "" ? 0 : parseFloat(p.percent);
      pctSum += w;
      return { id: p.userId, weight: Number.isFinite(w) ? w : 0 };
    });
    if (Math.abs(pctSum - 100) > 0.001) {
      return { shares: {}, error: `Percentages must add up to 100 (got ${pctSum.toFixed(2)}).` };
    }
    return { shares: splitByWeights(totalCents, weights), error: null };
  }

  // shares mode
  const weights = sorted.map((p) => ({
    id: p.userId,
    weight: p.shares === "" ? 0 : Math.max(0, parseInt(p.shares, 10) || 0),
  }));
  const total = weights.reduce((s, w) => s + w.weight, 0);
  if (total <= 0) return { shares: {}, error: "Total shares must be positive." };
  return { shares: splitByWeights(totalCents, weights), error: null };
}

type Props = {
  users: User[];
  mode: SplitMode;
  onModeChange: (m: SplitMode) => void;
  participants: ParticipantState[];
  onParticipantsChange: (p: ParticipantState[]) => void;
  totalCents: number;
};

export function SplitEditor({
  users,
  mode,
  onModeChange,
  participants,
  onParticipantsChange,
  totalCents,
}: Props) {
  const updateParticipant = (id: string, patch: Partial<ParticipantState>) => {
    onParticipantsChange(
      participants.map((p) => (p.userId === id ? { ...p, ...patch } : p)),
    );
  };

  const { shares, error } = computeShares(totalCents, mode, participants, users);

  const modes: { key: SplitMode; label: string }[] = [
    { key: "equal", label: "Equal" },
    { key: "exact", label: "Exact" },
    { key: "percent", label: "Percent" },
    { key: "shares", label: "Shares" },
  ];

  return (
    <div className="space-y-3">
      <div>
        <span className="label">Split</span>
        <div className="flex flex-wrap gap-2">
          {modes.map((m) => (
            <button
              key={m.key}
              type="button"
              className={clsx("chip", mode === m.key && "chip-active")}
              onClick={() => onModeChange(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
        {users.map((u) => {
          const p = participants.find((x) => x.userId === u.id);
          if (!p) return null;
          const shareCents = shares[u.id];
          return (
            <li key={u.id} className="flex items-center gap-3 p-3">
              <input
                type="checkbox"
                checked={p.included}
                onChange={(e) => updateParticipant(u.id, { included: e.target.checked })}
                className="h-5 w-5"
              />
              <span className="flex-1 font-medium">{u.name}</span>

              {mode === "exact" && p.included && (
                <div className="flex items-center gap-1">
                  <span className="text-neutral-500">$</span>
                  <input
                    className="input w-24 py-1"
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    value={p.exact}
                    onChange={(e) => updateParticipant(u.id, { exact: e.target.value })}
                  />
                </div>
              )}
              {mode === "percent" && p.included && (
                <div className="flex items-center gap-1">
                  <input
                    className="input w-20 py-1"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    inputMode="decimal"
                    value={p.percent}
                    onChange={(e) => updateParticipant(u.id, { percent: e.target.value })}
                  />
                  <span className="text-neutral-500">%</span>
                </div>
              )}
              {mode === "shares" && p.included && (
                <input
                  className="input w-20 py-1"
                  type="number"
                  step="1"
                  min="0"
                  inputMode="numeric"
                  value={p.shares}
                  onChange={(e) => updateParticipant(u.id, { shares: e.target.value })}
                />
              )}

              <span className="w-20 text-right text-sm text-neutral-600">
                {p.included ? formatMoney(shareCents ?? 0) : "—"}
              </span>
            </li>
          );
        })}
      </ul>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <p className="text-sm text-neutral-500">Shares add up correctly.</p>
      )}
    </div>
  );
}
