export function toCents(dollars: number | string): number {
  const n = typeof dollars === "string" ? parseFloat(dollars) : dollars;
  if (!Number.isFinite(n)) throw new Error("Invalid amount");
  return Math.round(n * 100);
}

export function formatMoney(cents: number, currency = "USD"): string {
  const dollars = cents / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(dollars);
  } catch {
    return `$${dollars.toFixed(2)}`;
  }
}

export function formatSigned(cents: number, currency = "USD"): string {
  const sign = cents < 0 ? "-" : "";
  return sign + formatMoney(Math.abs(cents), currency);
}

/**
 * Split `totalCents` equally across participants. Remainder cents go to the
 * first N participants in the provided order (sort by name before calling for
 * deterministic, alphabetical distribution).
 */
export function splitEqual(totalCents: number, participantIds: string[]): Record<string, number> {
  if (participantIds.length === 0) throw new Error("No participants");
  const base = Math.floor(totalCents / participantIds.length);
  const remainder = totalCents - base * participantIds.length;
  const shares: Record<string, number> = {};
  participantIds.forEach((id, i) => {
    shares[id] = base + (i < remainder ? 1 : 0);
  });
  return shares;
}

export function splitByWeights(
  totalCents: number,
  weights: { id: string; weight: number }[],
): Record<string, number> {
  const totalWeight = weights.reduce((s, w) => s + w.weight, 0);
  if (totalWeight <= 0) throw new Error("Total weight must be positive");
  const shares: Record<string, number> = {};
  let allocated = 0;
  weights.forEach((w, i) => {
    if (i === weights.length - 1) {
      shares[w.id] = totalCents - allocated;
    } else {
      const amt = Math.round((totalCents * w.weight) / totalWeight);
      shares[w.id] = amt;
      allocated += amt;
    }
  });
  return shares;
}
