export type NetBalance = { userId: string; net: number };
export type Transfer = { from: string; to: string; amount: number };

export type BalanceInputs = {
  userIds: string[];
  expenses: { payerId: string; amount: number }[];
  shares: { userId: string; amount: number }[];
  settlements: { fromId: string; toId: string; amount: number }[];
};

export function computeNetBalances(inp: BalanceInputs): NetBalance[] {
  const net: Record<string, number> = Object.fromEntries(inp.userIds.map((id) => [id, 0]));
  for (const e of inp.expenses) net[e.payerId] = (net[e.payerId] ?? 0) + e.amount;
  for (const s of inp.shares) net[s.userId] = (net[s.userId] ?? 0) - s.amount;
  for (const t of inp.settlements) {
    net[t.fromId] = (net[t.fromId] ?? 0) + t.amount;
    net[t.toId] = (net[t.toId] ?? 0) - t.amount;
  }
  return inp.userIds.map((userId) => ({ userId, net: net[userId] ?? 0 }));
}

/**
 * Greedy min-cashflow. Pairs the biggest creditor with the biggest debtor,
 * settles the minimum, repeats. Returns at most N-1 transfers.
 */
export function simplifyDebts(balances: NetBalance[]): Transfer[] {
  const creditors = balances.filter((b) => b.net > 0).map((b) => ({ ...b }));
  const debtors = balances.filter((b) => b.net < 0).map((b) => ({ ...b, net: -b.net }));
  creditors.sort((a, b) => b.net - a.net);
  debtors.sort((a, b) => b.net - a.net);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < creditors.length && j < debtors.length) {
    const c = creditors[i];
    const d = debtors[j];
    const amount = Math.min(c.net, d.net);
    if (amount > 0) {
      transfers.push({ from: d.userId, to: c.userId, amount });
    }
    c.net -= amount;
    d.net -= amount;
    if (c.net === 0) i += 1;
    if (d.net === 0) j += 1;
  }
  return transfers;
}

/** What does user X owe / is owed by each other user, in simplified form? */
export function transfersForUser(transfers: Transfer[], userId: string) {
  const owes = transfers.filter((t) => t.from === userId);
  const owed = transfers.filter((t) => t.to === userId);
  return { owes, owed };
}
