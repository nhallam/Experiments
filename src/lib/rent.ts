import { prisma } from "./prisma";
import { splitByWeights } from "./money";

export const RENT_CATEGORY_NAME = "Rent";
export const RENT_BP_TOTAL = 10000;
const KEY_TOTAL = "rent.total";
const KEY_SHARES = "rent.shares";
const KEY_DEFAULT_PAYER = "rent.defaultPayerId";

export type RentShareMap = Record<string, number>;

export type RentConfig = {
  totalCents: number;
  shares: RentShareMap;
  defaultPayerId: string | null;
};

export function periodKeyFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function monthLabel(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function periodRange(period: string): { start: Date; end: Date } {
  const [y, m] = period.split("-").map(Number);
  return {
    start: new Date(y, m - 1, 1),
    end: new Date(y, m, 1),
  };
}

export async function getRentConfig(householdId: string): Promise<RentConfig> {
  const rows = await prisma.householdSetting.findMany({
    where: {
      householdId,
      key: { in: [KEY_TOTAL, KEY_SHARES, KEY_DEFAULT_PAYER] },
    },
  });
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const totalCents = byKey[KEY_TOTAL] ? Number(byKey[KEY_TOTAL]) : 0;
  const shares: RentShareMap = byKey[KEY_SHARES]
    ? (JSON.parse(byKey[KEY_SHARES]) as RentShareMap)
    : {};
  return {
    totalCents: Number.isFinite(totalCents) ? totalCents : 0,
    shares,
    defaultPayerId: byKey[KEY_DEFAULT_PAYER] || null,
  };
}

export async function saveRentConfig(
  householdId: string,
  config: RentConfig,
): Promise<void> {
  const entries: [string, string][] = [
    [KEY_TOTAL, String(config.totalCents)],
    [KEY_SHARES, JSON.stringify(config.shares)],
    [KEY_DEFAULT_PAYER, config.defaultPayerId ?? ""],
  ];
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.householdSetting.upsert({
        where: { householdId_key: { householdId, key } },
        create: { householdId, key, value },
        update: { value },
      }),
    ),
  );
}

/**
 * Turn stored basis-point shares into cents for a given total. Any rounding
 * drift lands on the last user in the provided order — sort users by name
 * for a deterministic result.
 */
export function rentCentsFromBp(
  totalCents: number,
  bpShares: RentShareMap,
  orderedUserIds: string[],
): Record<string, number> {
  const weights = orderedUserIds
    .filter((id) => (bpShares[id] ?? 0) > 0)
    .map((id) => ({ id, weight: bpShares[id] }));
  if (weights.length === 0) return {};
  return splitByWeights(totalCents, weights);
}

export async function getRentCategoryId(): Promise<string | null> {
  const c = await prisma.category.findUnique({
    where: { name: RENT_CATEGORY_NAME },
    select: { id: true },
  });
  return c?.id ?? null;
}
