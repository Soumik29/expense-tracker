# Plan: Upgrading the Assistant from "Finance-Only Bot" to a General Chat Assistant

**Status:** Proposed / not yet implemented. Written before touching any code, same process as `AGENTIC_RAG_UPGRADE_PLAN.md`.

## 1. Why

The assistant currently refuses (or awkwardly mishandles) anything that isn't a direct financial lookup, because its system prompt explicitly forbids answering from its own knowledge: *"Always answer by calling the appropriate tool(s) first — never guess, estimate, or answer from memory."* That instruction was the right call while the goal was "never hallucinate a number about the user's money" (see `AGENTIC_RAG_UPGRADE_PLAN.md`), but it also means the assistant can't chat generally like ChatGPT/Claude/Gemini, and can't answer trend-style questions ("am I spending more this month than last?") since no tool currently computes that.

## 2. Current state (verified by reading the real code, not assumed)

- `src/components/FinancialAssistant.tsx` already keeps a local `messages: {role, content}[]` array for the chat UI — but only ever sends the latest `question` string to the backend (`askFinancialAssistant(userMessage)` in `src/services/api.ts`), never the prior turns. Conversation memory is almost free to add — the shape already exists on the frontend, it just isn't transmitted.
- `src/backend/src/controllers/chat.controller.ts`'s `askQuestion` reads `req.body.question` only, and calls `RagService.askFinancialAssistant(userId, question)` — no history parameter exists anywhere in the backend chain.
- `RagService.askFinancialAssistant` (`src/backend/src/services/rag.service.ts`) builds a single-turn `messages: [{ role: "user", content: question }]` array for `agent.invoke()` — no memory of prior turns.
- The 4 existing tools (`getRecentTransactions`, `getCategoryTotal`, `getBalance`, `searchTransactions`, all in `src/backend/src/services/financialAssistant.tools.ts`) cover exact lookups and sums, but nothing does trend/comparison ("which category do I spend most on," "how did this month compare to last").

## 3. Scope — four steps, same cadence as the last upgrade

### Step 1: Loosen the system prompt to allow general conversation

Change the instruction from "you may ONLY answer via tools" to something like: *"You're a helpful general-purpose assistant built into a personal expense tracker. Chat about anything the user asks. When they ask about their own expenses, income, spending, or balance, use the provided tools to get exact numbers instead of guessing — financial answers must come from tool results, not memory. For everything else, answer directly using your own knowledge."*

This is the cheapest, safest, most foundational change — it should be done and verified in isolation before anything else, since every later step builds on top of a working general-chat prompt.

**Risk to watch:** loosening the prompt could make the model less disciplined about calling tools for financial questions (the exact problem the strict prompt was originally preventing). This needs to be checked against the existing 15-question financial benchmark (`npm run bench:rag`) before moving on — a regression here would undo Step 2-4 of the previous upgrade.

### Step 2: Add a trend/comparison tool

One new tool, `getSpendingBreakdown({ type, startDate?, endDate? })`, using Prisma's native `groupBy` (`prisma.expense.groupBy({ by: ["category"], _sum: { amount: true }, _count: true, where })`) to return per-category totals for a given period, sorted by amount descending. This is deliberately a single, composable building block rather than a narrow "compare two periods" tool — the agent can call it twice (once per period) and reason about the difference itself, consistent with the existing tools' philosophy of "give building blocks, let the model reason" rather than pre-baking every possible question shape into its own tool.

This answers "what do I spend the most on," "how does this month compare to last month," "which category grew" — all via the same one tool, called once or twice depending on the question.

### Step 3: Add conversation memory

- Frontend: `askFinancialAssistant()` in `src/services/api.ts` gets a second parameter for prior messages; `FinancialAssistant.tsx` passes its existing `messages` state (trimmed to the last N turns) instead of just the latest question.
- Backend: `chat.controller.ts` reads `history` from the request body; `RagService.askFinancialAssistant` gains a `history` parameter and prepends it to the `messages` array passed to `agent.invoke()`.
- **Guardrail, decided now rather than left as an afterthought:** history is capped (both client-side before sending, and server-side regardless of what's sent) to the last 10 messages, to bound token usage/cost per request. An unbounded, ever-growing conversation history sent on every turn is a real, easy-to-hit cost problem for a tool-calling agent that already makes multiple model calls per question.

### Step 4: Extend the benchmark and verify nothing regressed

- Add general-chat test questions (e.g., "what's 2+2", "give me a one-sentence definition of inflation") to confirm the assistant now answers them instead of refusing.
- Add trend-question test cases exercising the new `getSpendingBreakdown` tool with a known, hand-calculated expected answer (same rigor as the aggregation tests in the previous upgrade — no claiming a tool "works" without a benchmark case that would fail if it didn't).
- Add a multi-turn test case (ask a financial question, then a follow-up that only makes sense with memory of the first, e.g. "How much did I spend on Food?" then "What about Travel?") to confirm history is actually being used.
- Re-run the full existing 15-question financial benchmark to confirm the loosened prompt from Step 1 didn't regress financial-question tool-calling discipline.

## 4. What's explicitly out of scope for this round

- A dedicated rate-limiting/abuse-prevention layer on the `/api/chat` endpoint — flagged as a real cost-control gap worth doing, but a separate concern from "can it chat generally," and not blocking this upgrade.
- Persisting conversation history server-side (a `ChatMessage` database table). This round uses client-side history (the frontend already holds it for display) re-sent per request — simpler, no migration needed, sufficient for a single-device chat widget. Server-side persistence would matter if conversations needed to survive a page refresh or sync across devices, which isn't a current requirement.
