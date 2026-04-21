export type User = {
  id: string;
  name: string;
  createdAt: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string | null;
};

export type ExpenseShare = {
  id: string;
  expenseId: string;
  userId: string;
  amount: number;
  user?: User;
};

export type Expense = {
  id: string;
  amount: number;
  currency: string;
  payerId: string;
  categoryId: string | null;
  note: string | null;
  receiptUrl: string | null;
  date: string;
  createdAt: string;
  createdById: string | null;
  payer?: User;
  category?: Category | null;
  shares?: ExpenseShare[];
};

export type Settlement = {
  id: string;
  fromId: string;
  toId: string;
  amount: number;
  currency: string;
  date: string;
  note: string | null;
  createdAt: string;
  from?: User;
  to?: User;
};

export type NetBalance = {
  userId: string;
  name: string;
  net: number;
};

export type SimplifiedTransfer = {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
};
