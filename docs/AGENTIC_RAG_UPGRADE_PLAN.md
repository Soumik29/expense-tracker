# Plan: Upgrading the RAG Assistant to a Tool-Calling Agent

**Status:** Proposed / not yet implemented. This document captures the scoping discussion so the plan survives even if implementation happens later or by someone else.

## 1. Current State (as of the recency-bug fix)

`RagService.askFinancialAssistant` (`src/backend/src/services/rag.service.ts`) is a single-shot RAG chain, not an agent. On every question it:

1. Always fetches the 5 most recent expenses and 5 most recent incomes directly from MySQL via Prisma (`orderBy: [{ date: "desc" }, { id: "desc" }]`).
2. Conditionally runs a Pinecone semantic similarity search — skipped only when the question matches a recency-keyword regex (`/\b(latest|most recent|last|newest)\b/i`), a fix added after a production bug where semantic search could surface an older, topically-similar record and cause the LLM to misreport it as the most recent transaction.
3. Concatenates whatever it fetched into one prompt and asks Groq (`llama-3.1-8b-instant`) to answer from that fixed context.

This works — verified at 100% (13/13) on the current benchmark (`src/backend/src/rag-benchmark.ts`) — but the *code* is doing all the reasoning about what data to fetch. The LLM never decides anything about retrieval strategy; it only synthesizes an answer from whatever the code handed it.

## 2. The Gap This Doesn't Solve

The current design has no path to **exact aggregation**. It always retrieves at most 10 records (5 recent expenses + 5 recent incomes) plus up to 5 semantic matches. A question like:

> "How much did I spend on Food in total?"

cannot be answered correctly if the user has more than a handful of Food expenses — the assistant only ever sees a fixed-size window of records, never a true `SUM()`. This is a structural limitation of retrieval-based context injection, not a prompt-wording problem.

There's also a maintainability concern: the `isRecencyQuestion` regex is a band-aid. Every new "shape" of question that needs special retrieval handling (aggregation, balance, date-range filtering) would otherwise require another hand-written keyword rule in application code — that doesn't scale and is exactly the kind of brittle pattern-matching an LLM should be doing instead.

## 3. Proposed Architecture

Replace the single-shot chain (`prompt.pipe(llm).pipe(new StringOutputParser())`) with `createAgent({ model, tools, systemPrompt })` from `langchain` (confirmed available and installed at `langchain@1.2.25` — this is the real v1 agent API, not a hypothetical one). The model is given a set of tools and decides at runtime which to call based on the question, then answers from the tool results.

This also **retires the regex hack** — the model won't need a keyword list to recognize a recency question; it'll have a `getRecentTransactions` tool whose description makes that obvious, and genuinely reason about when to call it.

### Tool contracts

All tools close over `userId` server-side at construction time — `userId` is never an LLM-controllable argument, preserving the existing per-user data isolation that today's implementation enforces via Pinecone metadata filtering.

| Tool | Backs onto | Solves |
|---|---|---|
| `getRecentTransactions(type, limit)` | Existing Prisma `orderBy` query (already written) | Recency questions — replaces the regex hack |
| `getCategoryTotal(category, type, startDate?, endDate?)` | New `prisma.expense.aggregate({ _sum: { amount: true }, where: {...} })` | **The real gap** — exact sums, not retrieval-window approximations |
| `getBalance(startDate?, endDate?)` | New aggregate: income total − expense total for a period | "Am I positive or negative this month?" — currently unanswerable |
| `searchTransactions(query)` | Existing Pinecone `similaritySearch` (already written) | Fuzzy/open-ended questions with no exact filter, e.g. "what did I buy at that electronics store?" |

## 4. Model Risk

`llama-3.1-8b-instant` is a small model, and tool-selection reliability tends to degrade with model size. It's plausible the 8B model picks the wrong tool, or no tool, often enough to be a problem. The fallback plan is `llama-3.3-70b-versatile` (also hosted on Groq, still fast/cheap) for the tool-selection step specifically. This should be determined empirically via the benchmark, not assumed either way.

## 5. Validation Plan

Extend `src/backend/src/rag-benchmark.ts` with aggregation questions that are **provably impossible to answer correctly under the current design** — seed data with a known, deterministic per-category total, then ask e.g. "How much did I spend on Food in total?" with an exact expected sum as the grading check. Today's implementation should fail these (proof the gap is real and not hypothetical); the agentic version should pass them. That before/after comparison is the validation criterion for calling this upgrade done — not just "the existing 13 questions still pass."

Latency should also be measured explicitly, not assumed acceptable — multi-turn tool-calling (decide → call tool → synthesize answer) adds at least one extra model round-trip versus the current single-shot chain (currently averaging ~2.1s).

## 6. Effort Estimate

Roughly half a day of focused work:
- Tool definitions (Prisma aggregate queries + tool schemas): ~1–2h
- Agent wiring (`createAgent` replacing the current chain): ~1–2h
- Benchmark extension with aggregation cases + tuning against the live Groq model (possible 8B → 70B swap): ~1–2h

## 7. Open Questions / Decisions Deferred to Implementation

- Does `ChatGroq` from `@langchain/groq@1.1.2` support `.bindTools()` cleanly with `createAgent`, or does it need any Groq-specific tool-calling config? Needs verification against the installed version at implementation time, not assumed from general LangChain docs.
- Should `searchTransactions` remain unfiltered semantic search, or should the agent be able to pass a category/date hint into it to narrow results?
- Should tool-calling be limited to a max number of calls per question (cost/latency control), and if so, what's a sane default?
