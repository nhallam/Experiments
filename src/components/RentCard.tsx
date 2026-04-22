"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import { formatMoney } from "@/lib/money";
import type { Category, Expense } from "@/types";

type RentConfig = {
  totalCents: number;
  shares: Record<string, number>;
  defaultPayerId: string | null;
};

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function RentCard() {
  const period = currentPeriod();
  const [config, setConfig] = useState<RentConfig | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [logged, setLogged] = useState<Expense[] | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<RentConfig>("/api/rent-config"),
      api.get<Category[]>("/api/categories"),
    ])
      .then(([r, c]) => {
        setConfig(r);
        setCategories(c);
      })
      .catch(() => {
        setConfig({ totalCents: 0, shares: {}, defaultPayerId: null });
        setCategories([]);
      });
  }, []);

  const rentCategory = useMemo(
    () => categories?.find((c) => c.name === "Rent") ?? null,
    [categories],
  );

  useEffect(() => {
    if (!rentCategory) return;
    const [y, m] = period.split("-").map(Number);
    const from = new Date(y, m - 1, 1).toISOString();
    const to = new Date(y, m, 1).toISOString();
    api
      .get<{ items: Expense[] }>(
        `/api/expenses?categoryId=${rentCategory.id}&from=${encodeURIComponent(
          from,
        )}&to=${encodeURIComponent(to)}&limit=10`,
      )
      .then((r) => setLogged(r.items))
      .catch(() => setLogged([]));
  }, [rentCategory, period]);

  if (!config || !categories) return null;
  if (config.totalCents <= 0) return null;

  const alreadyLogged = logged && logged.length > 0;

  return (
    <div className="card flex items-center justify-between gap-3 p-5">
      <div className="min-w-0">
        <p className="text-sm text-neutral-500">{monthLabel(period)} rent</p>
        <p className="text-xl font-semibold">{formatMoney(config.totalCents)}</p>
        {alreadyLogged ? (
          <p className="mt-1 text-xs text-green-700">
            Logged on {new Date(logged[0].date).toLocaleDateString()}
          </p>
        ) : (
          <p className="mt-1 text-xs text-neutral-500">Not logged yet</p>
        )}
      </div>
      <Link
        href={`/rent/log?period=${period}`}
        className={alreadyLogged ? "btn-secondary" : "btn-primary"}
      >
        {alreadyLogged ? "Log again" : "Log rent"}
      </Link>
    </div>
  );
}
