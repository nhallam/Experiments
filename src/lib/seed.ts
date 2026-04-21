import { prisma } from "./prisma";

const DEFAULT_CATEGORIES = [
  { name: "Groceries", icon: "🛒" },
  { name: "Bills", icon: "💡" },
  { name: "Rent", icon: "🏠" },
  { name: "Household", icon: "🧻" },
  { name: "Takeout", icon: "🥡" },
  { name: "Transport", icon: "🚗" },
  { name: "Other", icon: "📦" },
];

/**
 * Seeds default categories if the table is empty. Safe to call on every
 * categories GET — the count check skips the write path in steady state.
 */
export async function ensureDefaultCategories(): Promise<void> {
  const count = await prisma.category.count();
  if (count > 0) return;
  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES,
    skipDuplicates: true,
  });
}
