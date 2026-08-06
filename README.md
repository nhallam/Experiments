# Housemate Expense Tracker

A private Splitwise for households of three. Record shared purchases, see who owes whom, and settle up. Multiple households can live side by side — each keeps its own housemates, expenses, rent config and recurring bills, so when the lineup changes you start a fresh household without losing the old one's history.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **Prisma** + **Neon Postgres**
- **Vercel Blob** for receipt photos
- **Zod** for validation (shared with future SMS bot)
- **Vitest** for unit tests

## Local development

```bash
pnpm install
cp .env.example .env                    # fill in DATABASE_URL, DIRECT_URL, BLOB_READ_WRITE_TOKEN
pnpm db:migrate                         # create schema on Neon
pnpm db:seed                            # seed default categories
pnpm dev                                # http://localhost:3000
```

On first load, visit `/onboarding` to enter the three housemate names. After that, `/` shows balances and the feed.

## Households

`/households` lists every household and is where you pick yours (or create a new one via `/onboarding`, e.g. after housemates move out). The chosen household id is stored in `localStorage` under `currentHouseholdId` and sent on every API call as `x-household-id`; all queries are scoped to it. Requests without the header fall back to the oldest household, which is what pre-household clients expect.

Databases created before the `Household` model existed are upgraded lazily: the first request after deploy folds existing users, recurring bills and the legacy rent settings into a household named after its members (see `ensureLegacyHousehold` in `src/lib/household.ts`).

## Identity

No login. The app stores the current housemate's id in `localStorage` under `currentUserId`. The identity picker on `/` lets anyone switch — trusted-household threat model.

## Money

All amounts are stored as **integer cents**. Display formatting happens in `src/lib/money.ts`. Uneven-split remainders distribute deterministically to the first N participants sorted by name — see `splitEqual` in `src/lib/money.ts`.

## Tests

```bash
pnpm test
```

Covers the balance algorithm (`src/lib/balances.ts`): net balances, simplification, circular debts, post-settlement zero-sum.

## Deploy (Vercel, phone-friendly)

The build script runs `prisma db push` automatically on every deploy, so the
schema gets created on first build without you touching a terminal. Default
categories are seeded lazily on the first `/api/categories` request.

1. In Vercel, click **Add New → Project** and import `nhallam/vs-code`.
   Select the `claude/housemate-expense-tracker-GWg6W` branch.
2. In the project's **Storage** tab, click **Create Database → Neon
   (Postgres)**. This injects `DATABASE_URL` and `DATABASE_URL_UNPOOLED`
   automatically.
3. Still in **Storage**, click **Create Store → Blob**. This injects
   `BLOB_READ_WRITE_TOKEN`.
4. Click **Deploy**. On first build, `prisma db push` creates the tables in
   Neon, Next.js builds, and you land on the onboarding screen.
5. Open the deployed URL on your phone, enter the three housemates' names,
   and you're done.

## Future

- `v2`: PWA install, activity log, recurring expenses, monthly summary, dark mode.
- `v3`: Twilio/SMS webhook at `/api/twilio/webhook` that reuses the same Zod validators and service layer.
