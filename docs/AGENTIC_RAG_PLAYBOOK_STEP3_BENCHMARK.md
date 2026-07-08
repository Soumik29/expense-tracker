# Playbook — Step 3: Extend the Benchmark with Aggregation Test Cases

**Parent plan:** `AGENTIC_RAG_UPGRADE_PLAN.md`
**Status:** ✅ Done — 93.3% (14/15) on the live Groq/Gemini/Pinecone stack, up from Step 2's 76.9% (10/13).
**Files changed:** `src/backend/src/rag-benchmark.ts`, `src/backend/src/services/financialAssistant.tools.ts`, `src/backend/src/services/rag.service.ts` (system prompt only)

## Goal, per the plan doc

> Extend the benchmark with aggregation questions that are provably impossible to answer correctly under the old design — seed data with a known, deterministic per-category total, then ask e.g. "How much did I spend on Food in total?" with an exact expected sum. Today's implementation should fail these; the agentic version should pass them.

This is the actual validation criterion for the whole upgrade, not just "does the agent run."

## What was added to the seed data and question set

- A third `Food` expense (`$22.50`, 60 days ago) alongside the existing two (`$45` at day 0, `$35` at day 25). Combined total: **$102.50 across 3 records**. Critically, 2 of the 3 records fall outside the old design's fixed top-5-most-recent retrieval window (`daysAgo` values in the top-5 window are 0, 1, 2, 5, 7) — so this isn't just a harder question, it's a question the old single-shot chain was **structurally incapable of answering correctly even in principle**, since it never computed a true sum, only ever saw a fixed-size context window.
- Question: *"How much did I spend on Food in total?"* — checked against the exact sum `102.50`.
- Question: *"What's my overall balance? Am I positive or negative?"* — checked against the exact computed balance. Arithmetic worked out by hand before running anything (not just trusted to the model):
  - Total expenses across all 12 seeded expense records: `45 + 120.5 + 60 + 250 + 89.99 + 15 + 12.99 + 300 + 35 + 500 + 999.99 + 22.5 = 2450.97`
  - Total income across all 6 seeded income records: `4000 + 600 + 50 + 200 + 3900 + 100 = 8850.00`
  - Balance: `8850.00 − 2450.97 = 6399.03` (positive)

Both of these passed on the final run, which is the actual proof the upgrade does something real — not the overall accuracy percentage.

## Three real bugs found and fixed while getting here

### 1. `getBalance` rejected the model's own valid tool calls — nullable schema fields

First run after adding the two new questions: Food total passed, but balance failed with

```
"Tool call validation failed: ... parameters for tool getBalance did not match schema: errors:
[`/startDate`: expected string, but got null, `/endDate`: expected string, but got null]"
"failed_generation":"{\"name\": \"getBalance\", \"arguments\": {\"startDate\":null,\"endDate\":null}}"
```

**Root cause:** `openai/gpt-oss-20b` follows OpenAI's own tool-calling convention of including every schema property on every call, using `null` for "not provided" rather than omitting the key entirely. The Zod schemas for `startDate`/`endDate` on both `getCategoryTotal` and `getBalance` were `z.string().optional()` — which permits the key being *absent*, but not present with value `null`. The model's own well-formed, intentional call was being rejected by an overly narrow schema, not a model mistake.

**Fix:** changed both fields to `z.string().nullable().optional()` on both tools, and widened `parseDateArg`/`buildDateFilter`'s parameter types from `string | undefined` to `string | null | undefined` to match. This is a real, generalizable finding: **any optional string/date parameter on a tool intended for an OpenAI-convention model should be `.nullable().optional()`, not just `.optional()`.**

### 2. A benchmark grading bug — Unicode smart-quote mismatch

The rent question ("How much did I spend on rent last year?") kept failing even though the model's actual answer — *"I couldn't find any transactions labeled 'rent' in your records..."* — visibly contains the accepted phrase `"couldn't find"`. Inspecting the raw answer text closely revealed the model outputs a typographic apostrophe (`'`, U+2019) while the benchmark's hardcoded check strings use a plain ASCII apostrophe (`'`, U+0027) — visually identical, byte-different, so `String.includes()` silently never matched.

**Fix:** added a `normalizeQuotes()` step in `containsAny()` that maps typographic single/double quotes (`' ' " "`) to their ASCII equivalents on both the haystack and the needle before comparing. This is a general robustness fix, not specific to the rent question — it would have silently caused false-negative grading on *any* future check phrase containing an apostrophe or quote mark, since LLM output routinely uses typographic punctuation.

### 3. A benchmark question that was ambiguous, not a model bug

"How much was my June salary?" used to get a hallucinated wrong answer ("no salary in June") back in Step 2. After the system-prompt tuning below, the model instead started asking *"I'm not sure which year you're referring to. Could you let me know the year?"* — which is **better** behavior (asking rather than confidently hallucinating), but the question genuinely is ambiguous without a year, and the benchmark was grading it as a hard failure either way.

**Fix:** the question was changed to name the year explicitly — computed from the actual seeded date at question-build time (`daysAgo(33).getFullYear()`), not hardcoded, so it stays correct no matter when the benchmark is run. This is a case of fixing the test, not the model — the model's new behavior was arguably correct and shouldn't have been "fixed away."

## System prompt changes (in `rag.service.ts`)

Two lines added to the agent's `systemPrompt`, targeting the two genuine reasoning gaps identified in Step 2:

1. *"When a question references a specific month, year, or date range, always pass matching startDate and endDate arguments to getCategoryTotal or getBalance — do not rely on their default (all-time) range."* — targets the June-salary date-filtering gap.
2. *"If the user mentions a category or topic you don't recognize, try searchTransactions with their wording FIRST before asking them to clarify — only ask for clarification if that search also returns nothing relevant."* — targets the cashback-reward premature-clarification-question gap.

Both gaps that motivated these lines are gone in the final run (cashback passed; June salary passes now that the question itself is unambiguous).

## Result progression this step

| Run | Accuracy | Notes |
|---|---|---|
| Step 2 baseline (13 questions, no aggregation cases) | 76.9% (10/13) | Carried over from Step 2 |
| + 2 new aggregation questions, no fixes yet | 80.0% (12/15) | New Food-total question passed immediately; balance question hit the nullable-schema bug |
| + nullable date schema fix + quote-normalization fix + unambiguous June-salary question | **93.3% (14/15)** | Final result for this step |

## Remaining failure — flaky, not systematic

*"Is my phone bill a recurring expense?"* hit `Recursion limit of 8 reached without hitting a stop condition` on the final run — but this exact question **passed** on the immediately preceding run (Step 2's second-to-last attempt) with a normal, fast response. This reads as LLM non-determinism (temperature 0.2 still has some randomness) occasionally causing the agent to loop rather than converge on this specific yes/no question shape, not a reproducible defect. Worth watching in a future run rather than chasing with an unverified fix now — bumping `recursionLimit` from 8 to something like 10-12 is the obvious next thing to try, but it wasn't tested in this session, so it isn't claimed as a fix here.

## Verification

`npx tsc --noEmit` clean after each change. `npm run bench:rag` run 3 times this step against the live stack (documented above), each result kept rather than only the final number.
