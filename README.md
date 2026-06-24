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

## Weekly snapshots

Every Sunday night a Vercel Cron job hits `/api/cron/weekly-snapshot`, which
writes a CSV report to Vercel Blob under `snapshots/week-ending-YYYY-MM-DD.csv`.
Each report contains this week's new expenses, the simplified who-owes-who
settle-up, and all-time net balances. Download past snapshots from
**Settings → Weekly snapshots** (or generate one on demand there).

- **Schedule** lives in `vercel.json`. Vercel Cron fires in **UTC**, so the
  time is set to `59 3 * * 1` (Monday 03:59 UTC ≈ Sunday 23:59 US Eastern). If
  your household isn't on Eastern time, change both this schedule and
  `APP_TIMEZONE` to match. `APP_TIMEZONE` (an IANA zone, default
  `America/New_York`) is what defines the Mon–Sun week boundaries.
- **`CRON_SECRET`** — set this in the Vercel project. Vercel sends it as a
  Bearer token and the endpoint rejects requests without it.
- Note: on the Vercel **Hobby** plan cron runs are limited to once per day and
  fire approximately (not to the exact minute); upgrade to Pro for precise timing.

## Future

- `v2`: PWA install, activity log, recurring expenses, monthly summary, dark mode.
- `v3`: Twilio/SMS webhook at `/api/twilio/webhook` that reuses the same Zod validators and service layer.
