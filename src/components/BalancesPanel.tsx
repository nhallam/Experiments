"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useCurrentUserId } from "@/lib/identity";
import { formatMoney, formatSigned } from "@/lib/money";
import type { NetBalance, SimplifiedTransfer } from "@/types";

export function BalancesPanel() {
  const [currentId] = useCurrentUserId();
  const [nets, setNets] = useState<NetBalance[] | null>(null);
  const [transfers, setTransfers] = useState<SimplifiedTransfer[] | null>(null);

  useEffect(() => {
    let cancel = false;
    Promise.all([
      api.get<NetBalance[]>("/api/balances"),
      api.get<SimplifiedTransfer[]>("/api/balances/simplified"),
    ])
      .then(([n, t]) => {
        if (cancel) return;
        setNets(n);
        setTransfers(t);
      })
      .catch(() => {
        if (cancel) return;
        setNets([]);
        setTransfers([]);
      });
    return () => {
      cancel = true;
    };
  }, [currentId]);

  if (nets === null || transfers === null) {
    return <div className="card p-5 text-sm text-neutral-500">Loading balances…</div>;
  }

  const myNet = nets.find((n) => n.userId === currentId);
  const myOwes = transfers.filter((t) => t.from === currentId);
  const myOwed = transfers.filter((t) => t.to === currentId);

  return (
    <div className="space-y-3">
      <div className="card p-5">
        <p className="text-sm text-neutral-500">Your balance</p>
        <p
          className={
            "mt-1 text-3xl font-semibold " +
            (myNet && myNet.net > 0
              ? "text-green-600"
              : myNet && myNet.net < 0
                ? "text-red-600"
                : "text-neutral-700")
          }
        >
          {formatSigned(myNet?.net ?? 0)}
        </p>
        <p className="text-sm text-neutral-500">
          {myNet && myNet.net > 0
            ? "You are owed overall"
            : myNet && myNet.net < 0
              ? "You owe overall"
              : "All settled up"}
        </p>
      </div>

      {(myOwes.length > 0 || myOwed.length > 0) && (
        <div className="card divide-y divide-neutral-100 p-0">
          {myOwes.map((t) => (
            <div key={`owe-${t.to}`} className="flex items-center justify-between px-5 py-3">
              <span>
                You owe <strong>{t.toName}</strong>
              </span>
              <span className="font-semibold text-red-600">{formatMoney(t.amount)}</span>
            </div>
          ))}
          {myOwed.map((t) => (
            <div key={`owed-${t.from}`} className="flex items-center justify-between px-5 py-3">
              <span>
                <strong>{t.fromName}</strong> owes you
              </span>
              <span className="font-semibold text-green-600">{formatMoney(t.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {nets.length > 0 && (
        <details className="card p-5">
          <summary className="cursor-pointer text-sm font-medium text-neutral-600">
            Full house balances
          </summary>
          <ul className="mt-3 space-y-1 text-sm">
            {nets.map((n) => (
              <li key={n.userId} className="flex justify-between">
                <span>{n.name}</span>
                <span
                  className={
                    n.net > 0
                      ? "text-green-600"
                      : n.net < 0
                        ? "text-red-600"
                        : "text-neutral-500"
                  }
                >
                  {formatSigned(n.net)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
