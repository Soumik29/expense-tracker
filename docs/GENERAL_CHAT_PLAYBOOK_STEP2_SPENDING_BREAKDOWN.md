# Playbook — Step 2: Add the `getSpendingBreakdown` Trend/Comparison Tool

**Parent plan:** `GENERAL_CHAT_UPGRADE_PLAN.md`
**Status:** ✅ Done and smoke-tested.
**File changed:** `src/backend/src/services/financialAssistant.tools.ts` (new tool + export list)

## What was added

A fifth tool, `getSpendingBreakdown({ type, startDate?, endDate? })`, using Prisma's native `groupBy`:

```ts
const groups = await prisma.expense.groupBy({
  by: ["category"],
  where,
  _sum: { amount: true },
  _count: true,
  orderBy: { _sum: { amount: "desc" } },
});
```

This returns every category the user has spent (or earned) in, with an exact total and transaction count each, sorted highest to lowest, optionally scoped to a date range.

## Why one tool, not a dedicated "compare two periods" tool

The plan doc's Step 2 deliberately scoped this as a single composable building block rather than a narrow tool for one specific question shape. The tool's own description tells the model: *"For 'compare this month to last month'-style questions, call this tool twice — once per period — and compare the results yourself."* This mirrors the existing tools' philosophy from the previous upgrade (`AGENTIC_RAG_UPGRADE_PLAN.md`) — give the model flexible building blocks and let it reason about how to combine them, rather than pre-baking every possible phrasing of a question into its own bespoke tool. One `groupBy`-based tool now answers "what do I spend the most on," "break down my spending," and (via two calls) "how did this month compare to last."

## Verification

A throwaway smoke test (`spending-breakdown-smoketest.ts`, written, run, then deleted) seeded a tiny, hand-picked dataset directly into MySQL — no Pinecone indexing needed, since this tool only ever reads MySQL directly:

- Food: $50 + $30 = $80 across 2 transactions
- Travel: $100 across 1 transaction
- Games: $10 across 1 transaction

Asked: *"What do I spend the most on? Break it down by category."* The assistant correctly called `getSpendingBreakdown` and returned exact, correctly-summed, correctly-sorted totals (Travel $100.00, Food $80.00 across 2, Games $10.00) — confirming both the Prisma `groupBy` query and the model's tool selection work correctly before moving on to conversation memory.

## Verification

`npx tsc --noEmit` clean. Smoke test run once, output matched hand-calculated expected values exactly, no hallucination or miscounted transactions.
