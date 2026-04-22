import type { RecurringExpense as PrismaRecurring, Category } from "@prisma/client";

type WithCategory = PrismaRecurring & { category?: Category | null };

export function serializeRecurring(r: WithCategory) {
  let sharesBp: Record<string, number> = {};
  try {
    sharesBp = JSON.parse(r.sharesBp) as Record<string, number>;
  } catch {
    sharesBp = {};
  }
  return {
    id: r.id,
    name: r.name,
    kind: r.kind as "fixed" | "variable",
    defaultCents: r.defaultCents,
    currency: r.currency,
    categoryId: r.categoryId,
    defaultPayerId: r.defaultPayerId,
    dueDay: r.dueDay,
    sharesBp,
    sortOrder: r.sortOrder,
    archived: r.archived,
    createdAt: r.createdAt.toISOString(),
    category: r.category ?? null,
  };
}
