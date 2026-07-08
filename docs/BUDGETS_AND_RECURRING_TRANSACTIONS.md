# Budgets & Recurring Transactions

**Date:** 2026-07-08
**Branch:** `fix/ai-latest-expense-context`
**Status:** Implemented, verified end-to-end against the live local API

Two features from the "real financial tracker" roadmap
(`EXPENSE_CREATION_FIX_AND_VALIDATION.md` §5, items 6 and 7).

---

## 1. Monthly Budgets

Set a monthly spending limit per expense category and see, at a glance, how
much of it the current month has consumed.

### Data model

New `Budget` table (`schema.prisma`):

```prisma
model Budget{
  id        Int      @id @default(autoincrement())
  category  Category
  amount    Decimal  @db.Decimal(10, 2)
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, category])
}
```

One budget per (user, category); the same limit applies to every calendar
month. Applied with `prisma db push`.

### API

| Method | Route | Behaviour |
|---|---|---|
| `GET` | `/api/budgets` | All budgets for the signed-in user |
| `POST` | `/api/budgets` | Upsert `{ category, amount }` — setting a category that already has a budget overwrites it |
| `DELETE` | `/api/budgets/:category` | Remove the budget for a category (404 if none, 400 on an unknown category) |

`POST` is validated with the same zod building blocks as expenses
(`transaction.schema.ts`): valid category enum, positive amount within the
`DECIMAL(10,2)` range. Bad input returns a per-field 422.

### UI

New **Monthly Budgets** card (`src/components/BudgetManager.tsx`), placed
between the expense and income forms:

- Every category shows current-month spend; type an amount and press Enter
  (or the ✓ button) to set its budget.
- Budgeted categories get a progress bar: **green** under 80%, **amber**
  80–100%, **red** over 100% with an "Over budget by $X" callout.
- The × button removes a budget. Errors surface in a banner, same pattern as
  the forms.
- Spending is computed client-side from the already-loaded expense list
  (`useMemo` over the current calendar month), so the card updates instantly
  when you add or delete an expense.

Supporting pieces: `src/services/budget.service.ts` (normalizes Prisma's
Decimal-as-string to `number`), `src/utils/useBudgets.tsx` (state hook),
`Budget` type + `EXPENSE_CATEGORIES` list in `src/types.ts`.

---

## 2. Recurring Transactions That Actually Recur

Previously `isRecurring` was a stored flag with no behaviour. Now a
transaction marked recurring acts as a **monthly template**: the server
automatically creates a real copy of it each month.

### How it works

`src/backend/src/services/recurring.service.ts`:

- `App.start()` calls `RecurringService.startScheduler()`, which processes all
  recurring templates **once at startup** and then **every 12 hours**
  (`setInterval`, `unref()`ed so it never keeps the process alive).
- For each expense/income with `isRecurring: true`, the service walks forward
  one month at a time from `lastRecurredAt ?? date`, creating an occurrence
  for every month boundary that has passed, and stamping the template's
  `lastRecurredAt` (new nullable column on both tables) after each one.
- Generated occurrences are **plain transactions** (`isRecurring: false`) with
  the template's amount/category/description/payment method, dated exactly one
  month after the previous occurrence. They're indexed into the AI assistant's
  vector store like any other transaction (failures there are logged, never
  fatal).

Design choices worth knowing:

- **Deleting a generated occurrence never resurrects it.** Progress is tracked
  by `lastRecurredAt` on the template, not by scanning for existing children.
- **Unchecking "recurring" on the template stops future generation**; deleting
  the template does too. Already-generated months stay.
- **Month-end days clamp**: a template dated Jan 31 generates Feb 28 (or 29),
  then Mar 28 — standard "same day next month, clamped" semantics
  (`addOneMonthClamped`, exported for testability).
- **A server that was off for weeks catches up at startup** (capped at 24
  generated occurrences per template per run as a runaway guard).
- Each template is processed in its own try/catch, so one bad row can't stall
  the rest; the run logs `[recurring] Generated N expense(s)...` when it
  creates anything.

The expense/income forms now label the checkbox
"Recurring (auto-repeats monthly)" so the behaviour is discoverable.

---

## 3. Files Changed

Backend:
- `src/backend/prisma/schema.prisma` — `Budget` model; `lastRecurredAt` on `Expense` and `Income`; `budgets` relation on `User`
- `src/backend/src/services/recurring.service.ts` — **new**, the recurring engine + scheduler
- `src/backend/src/controllers/budget.controller.ts` — **new**
- `src/backend/src/routes/budget.routes.ts` — **new**
- `src/backend/src/validations/transaction.schema.ts` — `budget` schema
- `src/backend/src/app.ts` — `/api/budgets` routes; scheduler start

Frontend:
- `src/components/BudgetManager.tsx` — **new**
- `src/services/budget.service.ts` — **new**
- `src/utils/useBudgets.tsx` — **new**
- `src/types.ts` — `Budget` type, `EXPENSE_CATEGORIES`
- `src/components/ExpenseTracker.tsx` — Budget card wired in
- `src/components/AddExpenseForm.tsx`, `AddIncomeForm.tsx` — recurring checkbox copy

---

## 4. Verification (run live on 2026-07-08)

Backend `tsc --noEmit` and frontend `tsc -b && vite build`: **clean**.

Against the running local API (test user, all records cleaned up after):

| # | Scenario | Result |
|---|---|---|
| B1 | `POST /api/budgets` Food = 300 | ✅ created |
| B2 | `POST` Food = 450.50 again | ✅ upserted (amount overwritten, still one row) |
| B3 | `GET /api/budgets` | ✅ lists the single budget |
| B4 | `POST` with category "Rent" | ✅ 422 `"Invalid expense category"` |
| B5 | `POST` with amount −5 | ✅ 422 `"Amount must be greater than 0"` |
| B6 | `DELETE /api/budgets/Food` | ✅ 204, list empty |
| R1 | Create recurring expense dated 2026-04-23 | ✅ template created |
| R2 | Restart server | ✅ occurrences auto-generated for 2026-05-23 and 2026-06-23; future 2026-07-23 correctly **not** created |
| R3 | Restart server again | ✅ still exactly 3 records — no duplicates (idempotent) |

### Deployment note

**No manual migration needed.** The in-app schema bootstrap
(`src/backend/src/utils/schema-bootstrap.ts`, see
`EXPENSE_CREATION_FIX_AND_VALIDATION.md`) creates the `Budget` table and the
`lastRecurredAt` columns automatically at startup. Verified live on
2026-07-08: budget create/list/delete worked on the production Render API
right after deploy.

---

## 5. Known limitations / next steps

- Only a **monthly** cadence is supported. Weekly/yearly would need a
  `recurrenceInterval` column and a generalized `addInterval` step.
- Budgets are the same amount every month; per-month overrides (e.g. a bigger
  December budget) would need a `month` column and a different unique key.
- Budget progress counts **all** current-month expenses in the category,
  including auto-generated recurring ones — by design.
- The scheduler is in-process. If the app ever runs as multiple backend
  instances, generation should move to a single cron worker or use a
  transaction-level guard to avoid double-generation.
