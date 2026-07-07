"use client";

import {
  SegmentedControl,
  SegmentedControlItem,
} from "@astryxdesign/core/SegmentedControl";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { FieldStatus } from "@astryxdesign/core/FieldStatus";
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

/** Parse a string field into NumberInput's number|null model. */
function toNumberValue(s: string): number | null {
  if (s === "") return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

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
      <SegmentedControl
        label="Split"
        value={mode}
        onChange={(v) => onModeChange(v as SplitMode)}
      >
        {modes.map((m) => (
          <SegmentedControlItem key={m.key} value={m.key} label={m.label} />
        ))}
      </SegmentedControl>

      <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
        {users.map((u) => {
          const p = participants.find((x) => x.userId === u.id);
          if (!p) return null;
          const shareCents = shares[u.id];
          return (
            <li key={u.id} className="flex items-center gap-3 p-3">
              <CheckboxInput
                label={u.name}
                isLabelHidden
                value={p.included}
                onChange={(checked) => updateParticipant(u.id, { included: checked })}
              />
              <span className="flex-1 font-medium">{u.name}</span>

              {mode === "exact" && p.included && (
                <NumberInput
                  label={`${u.name} exact amount`}
                  isLabelHidden
                  hasClear
                  min={0}
                  step={0.01}
                  units="$"
                  width={96}
                  value={toNumberValue(p.exact)}
                  onChange={(v) =>
                    updateParticipant(u.id, { exact: v === null ? "" : String(v) })
                  }
                />
              )}
              {mode === "percent" && p.included && (
                <NumberInput
                  label={`${u.name} percent`}
                  isLabelHidden
                  hasClear
                  min={0}
                  max={100}
                  step={0.01}
                  units="%"
                  width={88}
                  value={toNumberValue(p.percent)}
                  onChange={(v) =>
                    updateParticipant(u.id, { percent: v === null ? "" : String(v) })
                  }
                />
              )}
              {mode === "shares" && p.included && (
                <NumberInput
                  label={`${u.name} shares`}
                  isLabelHidden
                  hasClear
                  isIntegerOnly
                  min={0}
                  step={1}
                  width={80}
                  value={toNumberValue(p.shares)}
                  onChange={(v) =>
                    updateParticipant(u.id, { shares: v === null ? "" : String(v) })
                  }
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
        <FieldStatus type="error" message={error} />
      ) : (
        <FieldStatus type="success" message="Shares add up correctly." />
      )}
    </div>
  );
}
