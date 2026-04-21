"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { formatDateShort } from "@/lib/format";
import { useCurrentUserId } from "@/lib/identity";
import type { Expense } from "@/types";

export function ExpenseCard({ expense }: { expense: Expense }) {
  const [currentId] = useCurrentUserId();
  const myShare = expense.shares?.find((s) => s.userId === currentId);
  const payerIsMe = expense.payerId === currentId;

  let myLine = "";
  if (payerIsMe && myShare) {
    const lent = expense.amount - myShare.amount;
    myLine = lent > 0 ? `You lent ${formatMoney(lent)}` : "You paid for yourself";
  } else if (myShare) {
    myLine = `You owe ${formatMoney(myShare.amount)}`;
  } else {
    myLine = "Not involved";
  }

  return (
    <Link
      href={`/expenses/${expense.id}`}
      className="card block p-4 transition-colors hover:bg-neutral-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {expense.category?.icon && (
              <span className="text-lg" aria-hidden>
                {expense.category.icon}
              </span>
            )}
            <p className="truncate font-medium">
              {expense.note || expense.category?.name || "Expense"}
            </p>
          </div>
          <p className="mt-0.5 truncate text-sm text-neutral-500">
            {expense.payer?.name ?? "Unknown"} paid · {formatDateShort(expense.date)}
            {expense.category && !expense.note ? "" : expense.category ? ` · ${expense.category.name}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold">{formatMoney(expense.amount, expense.currency)}</p>
          <p className="text-xs text-neutral-500">{myLine}</p>
        </div>
      </div>
    </Link>
  );
}
