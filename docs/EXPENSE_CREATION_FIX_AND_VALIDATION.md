# Expense Creation Fix & Input Validation Hardening

**Date:** 2026-07-08
**Branch:** `fix/ai-latest-expense-context`
**Status:** Implemented, verified end-to-end against the live local API

---

## 1. The Problem

> "When adding expenses with long descriptions, it doesn't get added. It is inconsistent when adding expenses."

Adding an expense sometimes worked and sometimes silently didn't. The trigger was the **length of the description**, which is why it felt random.

### Root cause #1 — the database column was capped at 191 characters

In `src/backend/prisma/schema.prisma`, `description` was declared as a plain
`String?`. On MySQL, Prisma maps a plain `String` to **`VARCHAR(191)`** by
default. Any description longer than 191 characters made the `INSERT` fail
with Prisma error **P2000** ("The provided value for the column is too long").

The API caught that error and returned a generic `500 – Failed to create
expense`, so nothing explained *why* it failed.

### Root cause #2 — the UI lied about success

`AddExpenseForm.handleSubmit` called `onAddExpense(expenseData)` **without
awaiting it**, then immediately cleared the form and showed the
**"Expense Added Successfully"** toast. When the server rejected the request,
the user still saw a success message and an empty form — but the expense never
appeared in the list. This is what made the bug feel "inconsistent" instead of
like a plain error.

### Root cause #3 — no input validation on the expense/income endpoints

Auth routes had zod validation, but `POST/PUT /api/expenses` and
`POST/PUT /api/incomes` had only a `!amount || !date || !category` check.
Consequences:

- Oversized descriptions reached the database and blew up there (500 instead of a helpful 422).
- A non-numeric amount became `NaN`, an unparseable date became `Invalid Date` — both crashed inside Prisma as 500s.
- `PUT` had **no** required-field check at all: updating with a missing amount produced `NaN` and a 500.
- Amounts outside `DECIMAL(10,2)` range (> 99,999,999.99) also failed as 500s.

### Bonus issue found while verifying — dev database wouldn't start

`docker-compose.yaml` pinned `mysql:8.0`, but the `db_data` volume had been
initialized by a MySQL **9.4** server. MySQL refuses to open newer data files
with an older server ("Invalid MySQL server downgrade"), so the container
crash-looped and nothing could reach `localhost:3306`.

---

## 2. The Fix

### 2.1 Database: widen the description columns

`src/backend/prisma/schema.prisma` — both `Expense.description` and
`Income.description` are now:

```prisma
description     String?         @db.VarChar(500)
```

Applied to the database with `npx prisma db push` (non-destructive column
widening) and the Prisma client was regenerated.

**500 characters** was chosen as the canonical limit. It is enforced in three
places that are deliberately kept in sync:

| Layer | Location | Constant |
|---|---|---|
| Database | `schema.prisma` | `@db.VarChar(500)` |
| API validation | `src/backend/src/validations/transaction.schema.ts` | `MAX_DESCRIPTION_LENGTH = 500` |
| Frontend | `src/types.ts` | `MAX_DESCRIPTION_LENGTH = 500` |

If you ever change the limit, change **all three**.

### 2.2 Backend: a real validation layer (zod)

New file: `src/backend/src/validations/transaction.schema.ts`

Validation rules now enforced on `POST` and `PUT` for **both** expenses and
incomes:

| Field | Rule | Error behaviour |
|---|---|---|
| `amount` | number (numeric strings coerced), `> 0`, `≤ 99,999,999.99` (the `DECIMAL(10,2)` ceiling), rounded to 2 decimals | 422 with `"Amount must be a number"` / `"Amount must be greater than 0"` / max message |
| `date` | must parse to a real date, year 1900–2200 | 422 `"Date must be a valid date"` |
| `category` | must be one of the enum values (expense and income each have their own set) | 422 `"Invalid expense category"` / `"Invalid income category"` |
| `description` | optional, trimmed, ≤ 500 chars | 422 `"Description cannot exceed 500 characters"` |
| `paymentMethod` | `CASH \| CREDIT_CARD \| DEBIT_CARD \| UPI`, defaults to `CASH` | 422 `"Invalid payment method"` |
| `isRecurring` | boolean, defaults to `false` | 422 if not boolean |

Wired into the routers (`expense.routes.ts`, `income.routes.ts`) via the
existing `ValidateMiddleware.validateBody(...)`, which was upgraded to
**write the parsed result back to `req.body`** — so controllers now receive
trimmed strings, coerced types, applied defaults, and no unknown keys
(zod strips extras like `id`/`userId` that the frontend's update call sends).

Controllers additionally translate a residual Prisma **P2000** into a
`400 "One of the values is too long"` instead of a generic 500 — a safety net
in case a value ever slips past validation.

### 2.3 Frontend: honest feedback + guardrails

**`src/components/AddExpenseForm.tsx`**
- `handleSubmit` now **awaits** `onAddExpense`. The success toast and form
  reset only happen after the server confirms. On failure, the entered data
  stays in the form and a red error banner shows the server's message.
- The description textarea has `maxLength={500}` and a live `N/500` character
  counter that turns red at the limit.
- The submit button disables and shows "Adding..." while the request is in
  flight (prevents double submits).
- Client-side validity now also requires `amount > 0`.

**`src/components/AddIncomeForm.tsx`** — same treatment (it previously
swallowed errors with only a `console.error`).

**`src/components/ModalFormExpense.tsx`** (edit dialog) — description capped
at 500 with the same live counter.

**`src/services/api.ts`** — when the server returns a 422 with per-field
`errors`, the thrown `Error` now carries the first field message (e.g.
*"Description cannot exceed 500 characters"*) instead of the generic
*"Validation error"*, so the form banners show something actionable.

### 2.4 Infrastructure fixes made along the way

- **`docker-compose.yaml`**: `db` image bumped `mysql:8.0` → `mysql:9.4` to
  match the existing `db_data` volume (see "Bonus issue" above). A comment in
  the file explains why it must not be downgraded.
- **`src/backend/prisma.config.ts`**: when a `prisma.config.ts` exists, the
  Prisma CLI **stops auto-loading `.env`**. The config now loads the
  project-root `.env` itself using `dotenv` + `dotenv-expand` (identical to
  how `src/index.ts` does it), so CLI commands like `prisma db push` work
  again without manually exporting `DATABASE_URL`.

> ⚠️ Note for anyone running the full stack via `docker compose up`: compose
> prints warnings about unset variables because some values in `.env` contain
> literal `$` characters, which compose tries to interpolate. If you use the
> compose-run backend (not the local `npm run dev` one), escape `$` as `$$`
> in `.env` values, or those values will be silently mangled.

---

## 3. Files Changed

Backend:
- `src/backend/prisma/schema.prisma` — `@db.VarChar(500)` on both description columns
- `src/backend/prisma.config.ts` — loads root `.env` for the Prisma CLI
- `src/backend/src/validations/transaction.schema.ts` — **new**, zod schemas for expense & income
- `src/backend/src/middlewares/validation.middleware.ts` — parsed body written back to `req.body`
- `src/backend/src/routes/expense.routes.ts` — validation on POST/PUT
- `src/backend/src/routes/income.routes.ts` — validation on POST/PUT
- `src/backend/src/controllers/expenses.controller.ts` — P2000 → 400 with message
- `src/backend/src/controllers/income.controller.ts` — P2000 → 400 with message

Frontend:
- `src/types.ts` — shared `MAX_DESCRIPTION_LENGTH`
- `src/services/api.ts` — surfaces field-level 422 messages
- `src/components/AddExpenseForm.tsx` — awaited submit, error banner, counter, submitting state
- `src/components/AddIncomeForm.tsx` — same
- `src/components/ModalFormExpense.tsx` — description cap + counter

Infra:
- `docker-compose.yaml` — `mysql:9.4`

---

## 4. Verification (run live on 2026-07-08)

Backend typecheck (`tsc --noEmit`), frontend typecheck + production build
(`tsc -b && vite build`): **clean**.

End-to-end against the running local API with a fresh test user
(`cc_test_user@example.com`; test records were deleted afterwards):

| # | Scenario | Result |
|---|---|---|
| 1 | `POST /api/expenses` with a **480-character** description | ✅ 200, stored with all 480 chars (previously failed at >191) |
| 2 | `POST /api/expenses` with a **600-character** description | ✅ 422 `"Description cannot exceed 500 characters"` |
| 3 | `POST /api/expenses` with `amount: "abc"` | ✅ 422 `"Amount must be a number"` |
| 4 | `POST /api/expenses` with `date: "not-a-date"` | ✅ 422 `"Date must be a valid date"` |
| 5 | `POST /api/incomes` with a 480-character description | ✅ 200 |

### Deploying this to a hosted environment (Railway/Render/etc.)

**No manual step needed (as of 2026-07-08).** The backend now brings the
database schema up to date automatically at startup via
`src/backend/src/utils/schema-bootstrap.ts` — it checks `information_schema`
and applies only the missing DDL before the server accepts traffic. This was
added because the live Render service starts `node dist/index.js` directly
(dashboard config), bypassing `package.json`, so neither the CLI nor the
start-script `prisma db push` runs there.

Verified live on 2026-07-08: a 480-character description stored on the
production API at `expense-tracker-nf1e.onrender.com`, a 600-character one was
rejected with a 422. Widening `VARCHAR(191)` → `VARCHAR(500)` is
non-destructive; existing rows are untouched.

---

## 5. Roadmap: toward a fully-fledged financial tracker

The items below are **not implemented yet** — they are the prioritized list of
what a production-grade personal finance app would add next.

### Correctness & robustness
1. **Adopt real migrations.** The migration history only covers the original
   User/Expense tables; Income, `isRecurring`, `paymentMethod`, and this fix
   all live only in `db push` state. Baseline the current schema with
   `prisma migrate dev` so production changes become reviewable and reversible.
2. **Store money as integer cents** (or keep `DECIMAL` but never `Number()`
   round-trip it) to avoid floating-point drift in totals.
3. **Backend test suite** (Vitest + supertest): the five scenarios in §4
   should be an automated regression suite, not a one-off manual check.
4. **Pagination** on `GET /api/expenses` / `GET /api/incomes` — currently the
   entire history loads on every page view.
5. **Rate limiting & security headers** (express-rate-limit, helmet) on the
   API, especially the auth endpoints.

### Product features
6. ~~**Budgets**: per-category monthly budgets with progress bars and
   over-budget alerts~~ — ✅ **done**, see `BUDGETS_AND_RECURRING_TRANSACTIONS.md`.
7. ~~**Recurring transactions that actually recur**~~ — ✅ **done**, see
   `BUDGETS_AND_RECURRING_TRANSACTIONS.md`.
8. **Income editing UI**: the backend `PUT /api/incomes/:id` exists, but the
   frontend has no edit dialog for income (`updateIncome` is commented out in
   `ExpenseTracker.tsx`).
9. **Custom categories** instead of hard-coded enums (requires a `Category`
   table keyed by user; the enum approach forces a schema change per category).
10. **Monthly summary dashboard**: net cash flow (income − expenses),
    month-over-month trends, top merchants.
11. **CSV/Excel export & import** for interoperability with bank statements.
12. **Multi-currency support** with a per-user default currency.
13. **Attachment of receipt images** to expenses (the OCR scanner already
    exists — persist the image alongside the transaction, e.g. object storage).

### Polish
14. Code-split the frontend bundle (826 kB main chunk; vite already warns).
15. Toast system unification — success/error toasts are currently ad-hoc per
    form; a shared toast context would keep the UX consistent.
16. Dark-mode styles for `ModalFormExpense` (it is light-mode-only today).
