# Housemate Expense Tracker

A private Splitwise for a household of three. Record shared purchases, see who owes whom, and settle up.

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

## Identity

No login. The app stores the current housemate's id in `localStorage` under `currentUserId`. The identity picker on `/` lets anyone switch — trusted-household threat model.

## Money

All amounts are stored as **integer cents**. Display formatting happens in `src/lib/money.ts`. Uneven-split remainders distribute deterministically to the first N participants sorted by name — see `splitEqual` in `src/lib/money.ts`.

## Tests

```bash
pnpm test
```

Covers the balance algorithm (`src/lib/balances.ts`): net balances, simplification, circular debts, post-settlement zero-sum.

## Deploy (Vercel)

1. Push this branch to GitHub.
2. Connect the repo in Vercel.
3. Create a Neon Postgres instance; copy the pooled and direct URLs into Vercel env vars as `DATABASE_URL` and `DIRECT_URL`.
4. Create a Vercel Blob store; copy `BLOB_READ_WRITE_TOKEN`.
5. In Vercel build settings, the `build` script runs `prisma generate && next build`. Add `prisma migrate deploy` as a pre-build command if you want migrations to run automatically.

## Future

- `v2`: PWA install, activity log, recurring expenses, monthly summary, dark mode.
- `v3`: Twilio/SMS webhook at `/api/twilio/webhook` that reuses the same Zod validators and service layer.
