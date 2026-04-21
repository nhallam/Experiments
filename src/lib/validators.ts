import { z } from "zod";

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Name required")
  .max(40, "Name too long");

export const createUserSchema = z.object({
  name: nameSchema,
});

export const updateUserSchema = z.object({
  name: nameSchema,
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(30),
  icon: z.string().trim().max(8).optional(),
});

export const shareInputSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().nonnegative(),
});

export const createExpenseSchema = z
  .object({
    amount: z.number().int().positive(),
    currency: z.string().length(3).default("USD"),
    payerId: z.string().min(1),
    categoryId: z.string().min(1).optional().nullable(),
    note: z.string().max(280).optional().nullable(),
    receiptUrl: z.string().url().optional().nullable(),
    date: z.coerce.date(),
    createdById: z.string().min(1).optional().nullable(),
    shares: z.array(shareInputSchema).min(1),
  })
  .refine(
    (data) => data.shares.reduce((s, x) => s + x.amount, 0) === data.amount,
    { message: "Share amounts must sum to total amount", path: ["shares"] },
  );

export const updateExpenseSchema = createExpenseSchema;

export const createSettlementSchema = z
  .object({
    fromId: z.string().min(1),
    toId: z.string().min(1),
    amount: z.number().int().positive(),
    currency: z.string().length(3).default("USD"),
    date: z.coerce.date(),
    note: z.string().max(280).optional().nullable(),
  })
  .refine((d) => d.fromId !== d.toId, {
    message: "From and To must be different",
    path: ["toId"],
  });

export const expenseFilterSchema = z.object({
  categoryId: z.string().optional(),
  userId: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
