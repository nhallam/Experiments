import { z } from "zod";

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Name required")
  .max(40, "Name too long");

export const createUserSchema = z.object({
  name: nameSchema,
});

export const createHouseholdSchema = z
  .object({
    name: nameSchema.optional(),
    names: z.array(nameSchema).length(3, "Enter all three names."),
  })
  .refine((d) => new Set(d.names).size === d.names.length, {
    message: "Names must be unique.",
    path: ["names"],
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
    recurringExpenseId: z.string().min(1).optional().nullable(),
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

export const BP_TOTAL = 10000;
export const RENT_BP_TOTAL = BP_TOTAL;

const sharesBpSchema = z.record(
  z.string().min(1),
  z.number().int().nonnegative().max(BP_TOTAL),
);

export const rentConfigSchema = z
  .object({
    totalCents: z.number().int().nonnegative(),
    shares: sharesBpSchema,
    defaultPayerId: z.string().min(1).nullable(),
  })
  .refine(
    (d) => Object.values(d.shares).reduce((s, n) => s + n, 0) === BP_TOTAL,
    { message: "Percentages must add up to 100%.", path: ["shares"] },
  );

export const recurringExpenseSchema = z
  .object({
    name: z.string().trim().min(1).max(40),
    kind: z.enum(["fixed", "variable"]).default("fixed"),
    defaultCents: z.number().int().nonnegative(),
    currency: z.string().length(3).default("USD"),
    categoryId: z.string().min(1).nullable().optional(),
    defaultPayerId: z.string().min(1).nullable().optional(),
    dueDay: z.number().int().min(1).max(31).nullable().optional(),
    sharesBp: sharesBpSchema,
    sortOrder: z.number().int().default(0),
  })
  .refine(
    (d) => Object.values(d.sharesBp).reduce((s, n) => s + n, 0) === BP_TOTAL,
    { message: "Percentages must add up to 100%.", path: ["sharesBp"] },
  );

export const updateRecurringExpenseSchema = recurringExpenseSchema;

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
export type RentConfigInput = z.infer<typeof rentConfigSchema>;
export type RecurringExpenseInput = z.infer<typeof recurringExpenseSchema>;
