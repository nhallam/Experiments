import { describe, expect, it } from "vitest";
import { computeNetBalances, simplifyDebts } from "@/lib/balances";
import { splitEqual, splitByWeights, toCents } from "@/lib/money";

describe("computeNetBalances", () => {
  it("equal 3-way: payer is owed 2/3", () => {
    // $30 paid by A, split equally 3 ways
    const net = computeNetBalances({
      userIds: ["A", "B", "C"],
      expenses: [{ payerId: "A", amount: 3000 }],
      shares: [
        { userId: "A", amount: 1000 },
        { userId: "B", amount: 1000 },
        { userId: "C", amount: 1000 },
      ],
      settlements: [],
    });
    expect(net).toEqual([
      { userId: "A", net: 2000 },
      { userId: "B", net: -1000 },
      { userId: "C", net: -1000 },
    ]);
  });

  it("two expenses with different payers net out", () => {
    // A paid $30 split 3 ways ($10 each), B paid $30 split 3 ways.
    // Net: A lent 20 - owes 10 = +10; B same as A; C owes 20.
    const net = computeNetBalances({
      userIds: ["A", "B", "C"],
      expenses: [
        { payerId: "A", amount: 3000 },
        { payerId: "B", amount: 3000 },
      ],
      shares: [
        { userId: "A", amount: 1000 },
        { userId: "B", amount: 1000 },
        { userId: "C", amount: 1000 },
        { userId: "A", amount: 1000 },
        { userId: "B", amount: 1000 },
        { userId: "C", amount: 1000 },
      ],
      settlements: [],
    });
    expect(net.find((n) => n.userId === "A")?.net).toBe(1000);
    expect(net.find((n) => n.userId === "B")?.net).toBe(1000);
    expect(net.find((n) => n.userId === "C")?.net).toBe(-2000);
  });

  it("settlement zeros out a debt", () => {
    const net = computeNetBalances({
      userIds: ["A", "B"],
      expenses: [{ payerId: "A", amount: 2000 }],
      shares: [
        { userId: "A", amount: 1000 },
        { userId: "B", amount: 1000 },
      ],
      settlements: [{ fromId: "B", toId: "A", amount: 1000 }],
    });
    expect(net).toEqual([
      { userId: "A", net: 0 },
      { userId: "B", net: 0 },
    ]);
  });
});

describe("simplifyDebts", () => {
  it("produces at most N-1 transfers", () => {
    const transfers = simplifyDebts([
      { userId: "A", net: 2000 },
      { userId: "B", net: -1000 },
      { userId: "C", net: -1000 },
    ]);
    expect(transfers.length).toBeLessThanOrEqual(2);
    expect(transfers.every((t) => t.to === "A")).toBe(true);
    const total = transfers.reduce((s, t) => s + t.amount, 0);
    expect(total).toBe(2000);
  });

  it("collapses circular debts", () => {
    // A owes B 10, B owes C 10, C owes A 10 → all zero; no transfers.
    const transfers = simplifyDebts([
      { userId: "A", net: 0 },
      { userId: "B", net: 0 },
      { userId: "C", net: 0 },
    ]);
    expect(transfers).toEqual([]);
  });

  it("single creditor, multiple debtors", () => {
    const transfers = simplifyDebts([
      { userId: "A", net: 3000 },
      { userId: "B", net: -1500 },
      { userId: "C", net: -1500 },
    ]);
    expect(transfers).toHaveLength(2);
    expect(transfers.map((t) => t.amount).sort()).toEqual([1500, 1500]);
    expect(transfers.every((t) => t.to === "A")).toBe(true);
  });

  it("handles empty input", () => {
    expect(simplifyDebts([])).toEqual([]);
  });
});

describe("money splits", () => {
  it("splitEqual distributes remainder deterministically", () => {
    // $10.00 split 3 ways: 334, 333, 333 (first user gets the extra cent)
    const shares = splitEqual(1000, ["a", "b", "c"]);
    expect(Object.values(shares).reduce((s, x) => s + x, 0)).toBe(1000);
    expect(shares.a).toBe(334);
    expect(shares.b).toBe(333);
    expect(shares.c).toBe(333);
  });

  it("splitByWeights gives exact total even with rounding", () => {
    const shares = splitByWeights(1000, [
      { id: "a", weight: 1 },
      { id: "b", weight: 1 },
      { id: "c", weight: 1 },
    ]);
    expect(Object.values(shares).reduce((s, x) => s + x, 0)).toBe(1000);
  });

  it("toCents rounds correctly", () => {
    expect(toCents("10.00")).toBe(1000);
    expect(toCents("10.005")).toBe(1001);
    expect(toCents(3.33)).toBe(333);
  });
});
