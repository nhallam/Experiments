import { put } from "@vercel/blob";
import { prisma } from "./prisma";
import { computeNetBalances, simplifyDebts } from "./balances";
import { dollars, ymd, toCsv } from "./csv";
import { weekWindowFor, type WeekWindow } from "./week";

type Row = (string | number | null | undefined)[];

export type WeeklySnapshot = {
  week: WeekWindow;
  filename: string;
  csv: string;
  weekExpenseCount: number;
  weekTotalCents: number;
};

/**
 * Build the weekly report for the Mon–Sun week (in `timeZone`) containing `now`:
 * the simplified "who owes who", all-time net balances, and this week's new
 * expenses — all in a single CSV report file.
 */
export async function buildWeeklySnapshot(
  now: Date,
  timeZone: string,
): Promise<WeeklySnapshot> {
  const week = weekWindowFor(now, timeZone);

  const [users, weekExpenses, allExpenses, allShares, settlements] =
    await Promise.all([
      prisma.user.findMany({ orderBy: { name: "asc" } }),
      prisma.expense.findMany({
        where: { date: { gte: week.start, lte: week.end } },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
        include: { payer: true, category: true, recurringExpense: true, shares: true },
      }),
      prisma.expense.findMany({ select: { payerId: true, amount: true } }),
      prisma.expenseShare.findMany({ select: { userId: true, amount: true } }),
      prisma.settlement.findMany({ select: { fromId: true, toId: true, amount: true } }),
    ]);

  const net = computeNetBalances({
    userIds: users.map((u) => u.id),
    expenses: allExpenses,
    shares: allShares,
    settlements,
  });
  const transfers = simplifyDebts(net);
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  const rows: Row[] = [];
  rows.push([`Weekly snapshot — week of ${week.startYmd} to ${week.endYmd}`]);
  rows.push(["Generated (UTC)", now.toISOString()]);
  rows.push(["Timezone", timeZone]);
  rows.push([]);

  rows.push(["Who owes who (simplified settle-up)"]);
  rows.push(["From", "To", "Amount"]);
  if (transfers.length === 0) {
    rows.push(["", "", "All settled up"]);
  } else {
    for (const t of transfers) {
      rows.push([nameById.get(t.from) ?? "Unknown", nameById.get(t.to) ?? "Unknown", dollars(t.amount)]);
    }
  }
  rows.push([]);

  rows.push(["Net balances — all time (positive = is owed, negative = owes)"]);
  rows.push(["Housemate", "Net"]);
  for (const b of net) {
    rows.push([nameById.get(b.userId) ?? "Unknown", dollars(b.net)]);
  }
  rows.push([]);

  const weekTotalCents = weekExpenses.reduce((s, e) => s + e.amount, 0);
  rows.push([`This week's expenses (${weekExpenses.length})`]);
  rows.push([
    "Date",
    "Note",
    "Category",
    "Recurring template",
    "Payer",
    "Amount",
    "Currency",
    ...users.map((u) => `${u.name} share`),
    "Created at",
    "Expense ID",
  ]);
  if (weekExpenses.length === 0) {
    rows.push(["", "No expenses recorded this week"]);
  } else {
    for (const e of weekExpenses) {
      const shareByUser = new Map(e.shares.map((s) => [s.userId, s.amount]));
      rows.push([
        ymd(e.date),
        e.note ?? "",
        e.category?.name ?? "",
        e.recurringExpense?.name ?? "",
        e.payer?.name ?? "",
        dollars(e.amount),
        e.currency,
        ...users.map((u) => dollars(shareByUser.get(u.id) ?? 0)),
        e.createdAt.toISOString(),
        e.id,
      ]);
    }
    rows.push([]);
    rows.push([`Week total`, "", "", "", "", dollars(weekTotalCents)]);
  }

  return {
    week,
    filename: `snapshots/week-ending-${week.endYmd}.csv`,
    csv: toCsv(rows),
    weekExpenseCount: weekExpenses.length,
    weekTotalCents,
  };
}

export type StoredSnapshot = {
  url: string;
  pathname: string;
  weekStart: string;
  weekEnd: string;
  weekExpenseCount: number;
  weekTotalCents: number;
};

/** Build the weekly snapshot and persist it to Vercel Blob. */
export async function storeWeeklySnapshot(
  now: Date,
  timeZone: string,
): Promise<StoredSnapshot> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Blob storage not configured.");
  }
  const snap = await buildWeeklySnapshot(now, timeZone);
  // addRandomSuffix:false keeps a stable per-week pathname; re-running for the
  // same week overwrites it (idempotent). @vercel/blob 0.27 overwrites by default.
  const blob = await put(snap.filename, snap.csv, {
    access: "public",
    contentType: "text/csv; charset=utf-8",
    addRandomSuffix: false,
  });
  return {
    url: blob.url,
    pathname: blob.pathname,
    weekStart: snap.week.startYmd,
    weekEnd: snap.week.endYmd,
    weekExpenseCount: snap.weekExpenseCount,
    weekTotalCents: snap.weekTotalCents,
  };
}
