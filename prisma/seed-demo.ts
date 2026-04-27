/**
 * Demo seeder. Wipes the target database and replaces it with a small but
 * realistic dataset for showing the app off. Safe to re-run.
 *
 * Run against the demo Neon database, never your production one:
 *
 *   DATABASE_URL=...demo...        \
 *   DATABASE_URL_UNPOOLED=...demo... \
 *   pnpm tsx prisma/seed-demo.ts
 *
 * Bail-out: refuses to run unless DEMO_SEED_OK=1 is set, so a stray invocation
 * with the wrong DATABASE_URL can't accidentally wipe real data.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_CATEGORIES = [
  { name: "Groceries", icon: "🛒" },
  { name: "Bills", icon: "💡" },
  { name: "Rent", icon: "🏠" },
  { name: "Household", icon: "🧻" },
  { name: "Takeout", icon: "🥡" },
  { name: "Transport", icon: "🚗" },
  { name: "Other", icon: "📦" },
];

function ymd(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayOfMonth(d: Date, monthOffset: number, day: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + monthOffset, day);
}

async function wipe() {
  // Order matters because of FKs.
  await prisma.expenseShare.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.recurringExpense.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  if (process.env.DEMO_SEED_OK !== "1") {
    console.error(
      "Refusing to run. Set DEMO_SEED_OK=1 to confirm you're targeting the demo DB.",
    );
    process.exit(1);
  }

  const today = ymd(new Date());
  console.log("Wiping…");
  await wipe();

  console.log("Seeding categories…");
  const categoryRows = await Promise.all(
    SEED_CATEGORIES.map((c) => prisma.category.create({ data: c })),
  );
  const cat = Object.fromEntries(categoryRows.map((c) => [c.name, c]));

  console.log("Seeding users…");
  const alex = await prisma.user.create({ data: { name: "Alex" } });
  const bailey = await prisma.user.create({ data: { name: "Bailey" } });
  const cory = await prisma.user.create({ data: { name: "Cory" } });

  // Equal 3-way rent: 33.33 / 33.33 / 33.34 (sums to 10000 bp).
  console.log("Seeding rent config…");
  const rentShares = { [alex.id]: 3333, [bailey.id]: 3333, [cory.id]: 3334 };
  await prisma.setting.createMany({
    data: [
      { key: "rent.total", value: "320000" }, // $3,200.00
      { key: "rent.shares", value: JSON.stringify(rentShares) },
      { key: "rent.defaultPayerId", value: alex.id },
      { key: "currency", value: "USD" },
    ],
  });

  console.log("Seeding recurring templates…");
  const internet = await prisma.recurringExpense.create({
    data: {
      name: "Internet",
      kind: "fixed",
      defaultCents: 8000,
      currency: "USD",
      categoryId: cat.Bills.id,
      defaultPayerId: bailey.id,
      dueDay: 5,
      sharesBp: JSON.stringify({
        [alex.id]: 3333,
        [bailey.id]: 3333,
        [cory.id]: 3334,
      }),
      sortOrder: 0,
    },
  });
  const cleaner = await prisma.recurringExpense.create({
    data: {
      name: "Cleaner",
      kind: "fixed",
      defaultCents: 15000,
      currency: "USD",
      categoryId: cat.Household.id,
      defaultPayerId: cory.id,
      dueDay: 15,
      sharesBp: JSON.stringify({
        [alex.id]: 3333,
        [bailey.id]: 3333,
        [cory.id]: 3334,
      }),
      sortOrder: 1,
    },
  });

  console.log("Seeding expenses…");
  type ExpenseSeed = {
    date: Date;
    payerId: string;
    categoryId?: string;
    recurringExpenseId?: string;
    note: string;
    amount: number;
    shares: Record<string, number>;
  };

  const rentSplit3200 = { [alex.id]: 106667, [bailey.id]: 106667, [cory.id]: 106666 };
  const split80 = { [alex.id]: 2667, [bailey.id]: 2667, [cory.id]: 2666 };
  const split150 = { [alex.id]: 5000, [bailey.id]: 5000, [cory.id]: 5000 };
  const split87 = { [alex.id]: 2900, [bailey.id]: 2900, [cory.id]: 2900 };
  const split94 = { [alex.id]: 3134, [bailey.id]: 3133, [cory.id]: 3133 };
  const split112 = { [alex.id]: 3734, [bailey.id]: 3733, [cory.id]: 3733 };
  const splitAB52 = { [alex.id]: 2600, [bailey.id]: 2600 };
  const splitAC28 = { [alex.id]: 1400, [cory.id]: 1400 };
  const split34 = { [alex.id]: 1134, [bailey.id]: 1133, [cory.id]: 1133 };

  const expenses: ExpenseSeed[] = [
    { date: dayOfMonth(today, -1, 1), payerId: alex.id, categoryId: cat.Rent.id, note: "Rent", amount: 320000, shares: rentSplit3200 },
    { date: dayOfMonth(today, -1, 5), payerId: bailey.id, categoryId: cat.Bills.id, recurringExpenseId: internet.id, note: "Internet", amount: 8000, shares: split80 },
    { date: dayOfMonth(today, -1, 15), payerId: cory.id, categoryId: cat.Household.id, recurringExpenseId: cleaner.id, note: "Cleaner", amount: 15000, shares: split150 },
    { date: dayOfMonth(today, 0, 1), payerId: alex.id, categoryId: cat.Rent.id, note: "Rent", amount: 320000, shares: rentSplit3200 },
    { date: dayOfMonth(today, 0, 5), payerId: bailey.id, categoryId: cat.Bills.id, recurringExpenseId: internet.id, note: "Internet", amount: 8000, shares: split80 },
    { date: dayOfMonth(today, -1, 8), payerId: alex.id, categoryId: cat.Groceries.id, note: "Trader Joe's", amount: 8700, shares: split87 },
    { date: dayOfMonth(today, -1, 18), payerId: bailey.id, categoryId: cat.Groceries.id, note: "Whole Foods", amount: 9400, shares: split94 },
    { date: dayOfMonth(today, 0, 4), payerId: cory.id, categoryId: cat.Groceries.id, note: "Costco run", amount: 11200, shares: split112 },
    { date: dayOfMonth(today, 0, 7), payerId: bailey.id, categoryId: cat.Takeout.id, note: "Thai night", amount: 5200, shares: splitAB52 },
    { date: dayOfMonth(today, 0, 12), payerId: cory.id, categoryId: cat.Household.id, note: "Paper towels + soap", amount: 3400, shares: split34 },
    { date: dayOfMonth(today, 0, 14), payerId: alex.id, categoryId: cat.Transport.id, note: "Uber to airport", amount: 2800, shares: splitAC28 },
  ];

  for (const e of expenses) {
    await prisma.expense.create({
      data: {
        date: e.date,
        payerId: e.payerId,
        categoryId: e.categoryId ?? null,
        recurringExpenseId: e.recurringExpenseId ?? null,
        note: e.note,
        amount: e.amount,
        currency: "USD",
        createdById: e.payerId,
        shares: {
          create: Object.entries(e.shares).map(([userId, amount]) => ({
            userId,
            amount,
          })),
        },
      },
    });
  }

  console.log("Seeding settlements…");
  await prisma.settlement.create({
    data: {
      fromId: bailey.id,
      toId: alex.id,
      amount: 10000,
      currency: "USD",
      date: dayOfMonth(today, 0, Math.max(1, today.getDate() - 7)),
      note: "Venmo for rent",
    },
  });

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
