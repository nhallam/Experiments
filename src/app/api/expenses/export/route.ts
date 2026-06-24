import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api-helpers";
import { csvField, dollars, ymd } from "@/lib/csv";

export async function GET() {
  try {
    const [users, expenses] = await Promise.all([
      prisma.user.findMany({ orderBy: { name: "asc" } }),
      prisma.expense.findMany({
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
