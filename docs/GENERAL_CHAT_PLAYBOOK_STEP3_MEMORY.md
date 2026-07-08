# Playbook — Step 3: Add Conversation Memory

**Parent plan:** `GENERAL_CHAT_UPGRADE_PLAN.md`
**Status:** ✅ Done and smoke-tested with a genuinely conclusive before/after comparison.
**Files changed:** `src/services/api.ts`, `src/components/FinancialAssistant.tsx`, `src/backend/src/controllers/chat.controller.ts`, `src/backend/src/services/rag.service.ts`

## What changed, file by file

- **`src/services/api.ts`** — `askFinancialAssistant` gained a second parameter, `history: ChatHistoryMessage[]`, trimmed to the last 10 messages client-side before being sent in the POST body alongside `question`.
- **`src/components/FinancialAssistant.tsx`** — the component already held a local `messages` state array for rendering the chat UI; it just wasn't being sent anywhere. One line change: pass `messages` (the state as it was *before* this turn's new user message was appended — React batches `setMessages`, so the closure value at call time is exactly the prior history) into `askFinancialAssistant(userMessage, messages)`.
- **`src/backend/src/controllers/chat.controller.ts`** — reads `history` from the request body, validates its shape (must be an array of `{role: "user"|"assistant", content: string}`, anything else is filtered out — the client is never trusted blindly), and passes it through to `RagService.askFinancialAssistant`.
- **`src/backend/src/services/rag.service.ts`** — `askFinancialAssistant` gained a `history` parameter, trimmed to the last 10 messages **again server-side** (not trusting the client's own trimming), and prepended to the `messages` array passed to `agent.invoke()`.

## Why client-side history, not a database table

The plan doc considered and deliberately deferred server-side persisted conversation history (a `ChatMessage` table). The frontend already held the exact data structure needed for display; re-sending it is simpler, needs no migration, and is enough for a single-device chat widget where conversations don't need to survive a page refresh or sync across devices. If that requirement shows up later, this is the natural point to add persistence — the shape of the data wouldn't need to change, just where it's read from.

## The guardrail

Both the plan doc and this implementation treat the history cap as a first-class requirement, not an afterthought: capped at 10 messages **twice** — once in `api.ts` before the request even leaves the browser, and again in `rag.service.ts` regardless of what the request actually contains. This bounds token usage/cost for a tool-calling agent that already makes multiple model calls per question (see the earlier upgrade's latency investigation in `AGENTIC_RAG_PLAYBOOK_STEP4_TUNING.md` — this agent is not cheap per call, and an unbounded, ever-growing history would make that worse on every single turn of a long conversation).

## How memory was verified — and why the first test design was wrong

The first attempt at a smoke test asked *"How much did I spend on Food?"* then, with history, *"What about Travel?"* — this looked like a memory test but wasn't a good one: "Travel" is a real category name, so the model could (and did) answer the second question correctly **even with no history at all**, just by recognizing "Travel" as a category and calling `getCategoryTotal` directly. Running the "without history" comparison alongside it caught this immediately — both answers matched, which proves nothing about whether memory specifically was needed.

**Redesigned test:** asked *"What was my most recent expense?"* (answer: "$150 on Travel"), then *"How much was that, exactly, in dollars?"* — the word "that" has no other information to resolve to; it only makes sense by referring back to the previous answer.

- **With history:** *"It was exactly $150.00."* — correctly resolved the pronoun using the prior turn.
- **Without history (same question, empty history array):** *"I'm not sure which transaction you're referring to. Could you let me know the date, merchant, or category..."* — correctly declined, since there is genuinely nothing to resolve "that" to without the memory.

This is a much stronger proof: it shows the *presence* of history changes the outcome from "correctly declines" to "correctly answers," rather than showing the same correct answer either way. The lesson carried over from the previous upgrade's benchmark work: a test that passes regardless of the thing you're supposedly testing isn't actually testing that thing — worth designing the "without" case deliberately, not just the "with" case.

## Verification

`npx tsc --noEmit` clean in the backend; `npx tsc -b --noEmit` clean for the frontend. Smoke test (written, run, deleted — not part of the permanent codebase) showed the with/without contrast described above on the first run, no iteration needed.
