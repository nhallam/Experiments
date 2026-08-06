import { prisma } from "@/lib/prisma";
import { jsonError, resolveHouseholdId } from "@/lib/api-helpers";

function csvField(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function dollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export async function GET(req: Request) {
  try {
    const householdId = await resolveHouseholdId(req);
    const [users, expenses] = await Promise.all([
      prisma.user.findMany({
        where: householdId ? { householdId } : undefined,
        orderBy: { name: "asc" },
      }),
      prisma.expense.findMany({
        where: householdId ? { payer: { householdId } } : undefined,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        include: {
          payer: true,
          category: true,
          recurringExpense: true,
          shares: true,
        },
      }),
    ]);

    const header = [
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
    ];

    const rows: string[] = [header.map(csvField).join(",")];
    for (const e of expenses) {
      const sharesByUser = new Map(
        e.shares.map((s) => [s.userId, s.amount]),
      );
      const row = [
        ymd(e.date),
        e.note ?? "",
        e.category?.name ?? "",
        e.recurringExpense?.name ?? "",
        e.payer?.name ?? "",
        dollars(e.amount),
        e.currency,
        ...users.map((u) => dollars(sharesByUser.get(u.id) ?? 0)),
        e.createdAt.toISOString(),
        e.id,
      ];
      rows.push(row.map(csvField).join(","));
    }

    const csv = rows.join("\r\n") + "\r\n";
    const today = ymd(new Date());
    return new Response(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="splitty-expenses-${today}.csv"`,
        "cache-control": "no-store",
      },
    });
  } catch {
    return jsonError("Failed to export expenses.", 500);
  }
}
