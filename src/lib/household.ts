import { prisma } from "./prisma";

const LEGACY_RENT_KEYS = ["rent.total", "rent.shares", "rent.defaultPayerId"];

/** "Nick, Matt & Jakob" from member names, in creation order. */
export function householdLabel(names: string[]): string {
  if (names.length === 0) return "Household";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

/**
 * Folds pre-household data into a Household row. The schema upgrade leaves
 * existing users/recurring expenses with householdId = null and the rent
 * config in the legacy Setting table; the first request after deploy lands
 * here and adopts all of it. Safe to call on every households GET — the
 * count check skips the write path in steady state.
 */
export async function ensureLegacyHousehold(): Promise<void> {
  const orphans = await prisma.user.findMany({
    where: { householdId: null },
    orderBy: { createdAt: "asc" },
  });
  if (orphans.length === 0) return;

  await prisma.$transaction(async (tx) => {
    const household = await tx.household.create({
      data: { name: householdLabel(orphans.map((u) => u.name)) },
    });
    await tx.user.updateMany({
      where: { householdId: null },
      data: { householdId: household.id },
    });
    await tx.recurringExpense.updateMany({
      where: { householdId: null },
      data: { householdId: household.id },
    });
    const legacy = await tx.setting.findMany({
      where: { key: { in: LEGACY_RENT_KEYS } },
    });
    for (const s of legacy) {
      await tx.householdSetting.upsert({
        where: {
          householdId_key: { householdId: household.id, key: s.key },
        },
        create: { householdId: household.id, key: s.key, value: s.value },
        update: { value: s.value },
      });
    }
  });
}
