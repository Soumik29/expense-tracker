# Expense Tracker — Complete Technical Deep-Dive

**Purpose of this document:** a single, comprehensive reference covering the entire project end-to-end — what it is, why it was built the way it was, every architectural decision, every bug found and fixed, and every real metric produced along the way. Written to be saved and referenced later (resume writing, interview prep, or just remembering what was actually done and why).

Every number in this document is a real, measured result from an actual benchmark run or live test recorded during development — not an estimate.

---

## 1. What This Project Is

A full-stack personal finance tracker — but the core engineering story isn't the CRUD app, it's the AI assistant layered on top of it. What started as a simple "chat with your expenses" feature went through a full architectural rebuild (single-shot retrieval → tool-calling agent), a capability expansion (finance-only bot → general assistant with memory), and a round of real bug-hunting via live browser testing that caught issues no amount of unit testing would have found. The project also has automated, reproducible benchmarks for both AI features — not just "it seems to work," but a specific, citable accuracy number backed by a script anyone can re-run.

### Why it was built this way

The AI assistant's evolution is the most technically interesting part of this project, and it happened in a specific order for a reason:

1. First, a working (but structurally limited) RAG chatbot — proves the pipeline end-to-end.
2. Then, a bug is found in production-like testing (wrong "latest" expense) — fixed with a targeted patch.
3. Then, a deeper structural gap is identified (can't answer "how much did I spend on Food *in total*") — this isn't fixable with a patch, it requires rearchitecting from a fixed-context-window chain into a tool-calling agent.
4. Then, the agent is deliberately made more capable (general conversation, trend questions, multi-turn memory) — because a finance-only bot that can't hold a conversation is a weaker product than one that can.
5. Then, and only then, the whole thing is tested by actually using the app as a real user would — which is what caught the auth bugs that every backend script had missed.
6. Finally, the UI itself gets a pass — because a great AI answer formatted as raw markdown symbols is still a bad user experience.

Each of these stages is documented as its own step-by-step "playbook" in `docs/`, with the real errors hit and how they were diagnosed — not just the end state.

---

## 2. High-Level Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────┐
│  React Frontend  │◄────►│  Express Backend  │◄────►│    MySQL    │
│  (Vite, TS)      │ HTTP │  (Node.js, TS)    │Prisma│  (Docker)   │
└─────────────────┘      └──────────┬────────┘      └─────────────┘
                                     │
                          ┌──────────┴──────────┐
                          │   RagService (agent)  │
                          └──────────┬──────────┘
                     ┌───────────────┼───────────────┐
                     ▼               ▼               ▼
              ┌───────────┐  ┌─────────────┐  ┌─────────────┐
              │   Groq    │  │   Gemini    │  │  Pinecone   │
              │ (LLM inf.)│  │ (embeddings)│  │ (vector DB) │
              └───────────┘  └─────────────┘  └─────────────┘
```

- **Frontend and backend are separate processes** (Vite dev server on `:5173`, Express on `:3000`), talking over HTTP with a Vite dev proxy for `/api`.
- **Auth is cookie-based**, not token-in-header — httpOnly `accessToken`/`refreshToken` cookies set by the backend, sent automatically by the browser on every request.
- **The AI assistant is a separate service layer** (`RagService`) that the chat controller delegates to — it owns its own client initialization (Groq, Gemini, Pinecone), independent of the rest of the app's request/response cycle.
- **MySQL is the single source of truth** for all financial data. Pinecone holds vector embeddings of that same data for semantic search — it's a derived index, not a second source of truth (every write to MySQL triggers a corresponding upsert to Pinecone, wrapped in error handling so a Pinecone outage never blocks a user's actual expense from saving).

---

## 3. Tech Stack

### Frontend
| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite 7 |
| Styling | Tailwind CSS 4 |
| Routing | React Router 7 |
| Charts | Chart.js |
| OCR | Tesseract.js |
| Markdown rendering | react-markdown + remark-gfm |
| Icons | Heroicons, Font Awesome |

### Backend
| Layer | Choice |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 5 |
| Database | MySQL (via Docker Compose locally) |
| ORM | Prisma 6 |
| Auth | JWT (jsonwebtoken) + bcrypt, httpOnly cookies |
| Validation | Zod |

### AI / RAG Stack
| Layer | Choice |
|---|---|
| Agent orchestration | LangChain.js (`createAgent`, the v1 tool-calling agent API) |
| LLM | Groq — `openai/gpt-oss-20b` (see §8.3 for why this specific model) |
| Embeddings | Google Gemini — `gemini-embedding-001` |
| Vector database | Pinecone |

### DevOps
| Layer | Choice |
|---|---|
| Containerization | Docker (multi-stage builds for frontend + backend), Docker Compose for local dev |
| CI | GitHub Actions (lint + build on push/PR to `main`, weekly scheduled run) |
| Deployment targets | Vercel (frontend), Render (backend), Railway (alternative all-in-one) |

---

## 4. Database Schema (Prisma)

Four models: `User`, `Expense`, `Income`, plus enums for categories and payment methods.

- `Expense` / `Income` — `amount` (Decimal 10,2), `date`, `category` (enum), `description`, `isRecurring` (boolean), `paymentMethod` (enum: CASH/CREDIT_CARD/DEBIT_CARD/UPI), `userId` (FK, cascade delete).
- Expense categories: `Food, Groceries, Mobile_Bill, Travel, Shopping, Games, Subscription, EMI`
- Income categories: `Salary, Freelance, Investment, Gift, Other`
- `User` — `username`, `email` (both unique), `password` (bcrypt hash), `refreshToken` (bcrypt-hashed, nullable), timestamps.

No `budget` model, no multi-currency field — these are known, honest gaps, not oversights (see §15).

---

## 5. Authentication System

Custom-built, not a third-party provider (Auth.js packages are installed as dependencies but unused — a leftover from an earlier exploration, worth cleaning up eventually).

- **Password hashing:** bcrypt, cost factor 10.
- **Tokens:** short-lived access token (default 15m) + longer-lived refresh token (default 7d), both JWTs signed with separate secrets.
- **Storage:** httpOnly cookies (`accessToken`, `refreshToken`) — never exposed to client-side JS, mitigating XSS token theft.
- **Refresh token rotation:** the refresh token itself is bcrypt-hashed before being stored in the `User.refreshToken` column, so a leaked database doesn't directly hand out valid refresh tokens.
- **Registration issues a session immediately** — `register` and `login` both call a shared `issueSession()` helper (this wasn't always true; see §10.4, a real bug found and fixed this session).

### A subtle bug worth understanding: ESM import ordering broke login entirely

`auth.config.ts` originally read `process.env.AUTH_SECRET` etc. into a **plain object, evaluated once at module-import time**:

```ts
const authConfig = {
  secret: process.env.JWT_SECRET ?? process.env.AUTH_SECRET,
  // ...
};
```

Under ES modules, every `import` declaration in a file is fully resolved and evaluated **before** that file's own top-level code runs — regardless of where the import is textually written. `index.ts` wrote its `.env`-loading call *before* `import App from "./app.js"` in the source, but because static imports are always evaluated ahead of the importing module's own body, `app.js` (and everything it pulls in transitively, including `auth.config.ts`) was actually evaluated **first**, reading `process.env.AUTH_SECRET` while it was still `undefined`. The `.env` file only finished loading afterward — by which point `authConfig.secret` had already been frozen as `undefined` for the rest of the process's life. Every login attempt threw `secretOrPrivateKey must have a value`.

**Fix:** converted every property to a getter, so each access reads `process.env` fresh, on demand:

```ts
const authConfig = {
  get secret() {
    return process.env.JWT_SECRET ?? process.env.AUTH_SECRET;
  },
  // ...
};
```

This is a genuinely subtle class of bug — the kind that's invisible reading the code top-to-bottom, and only surfaces by actually running the app. Full write-up: `docs/LIVE_APP_TESTING_PLAYBOOK.md`.

---

## 6. Core Expense/Income Tracking Features

- Full CRUD for both expenses and income, with ownership verification on every update/delete (a user can only modify their own records — checked server-side, not just hidden client-side).
- **Search & filter:** text search (description/category), category filter, payment-method filter, amount range, date range, recurring-only toggle — all client-side, memoized with `useMemo`/`useCallback` to avoid recomputation on every keystroke.
- **Date range presets:** 9 options (Today, Yesterday, Last 7/30 Days, This/Last Week/Month, This Year).
- **Grouping:** by Day, Week, or Month, with computed totals per group.
- **Charts:** Chart.js bar charts, togglable between category-breakdown and payment-method-breakdown views. Chart instances are explicitly destroyed on re-render (a real, if small, technical detail — avoids the classic "canvas is already in use" Chart.js bug).

---

## 7. Receipt OCR Scanning

Client-side OCR via Tesseract.js — no server round-trip needed to extract a total from a photographed receipt.

**The parsing logic** (`receiptParser.ts`) handles:
- Multiple currency symbols (`$`, `€`, `£`)
- Both US (`1,200.50`) and European (`1.200,50`) number formats
- Distinguishing "Total" from "Subtotal" (regex-guarded) and from tax lines (`Tax: $5.00` is skipped, but `Total (incl. tax) $5.50` is not — a subtle but important distinction)
- Falling back to the largest number on the receipt when no "Total" keyword is found at all
- Scanning bottom-up so a later "Grand Total" line correctly overrides an earlier partial "Total"

### Benchmark: 93.5% accuracy (29/31 test cases)

A dataset of 31 realistic receipt formats — fast food, grocery, gas station, hotel, rideshare, e-commerce, international (German/European formatting), and deliberately adversarial OCR-noise cases — is run against the parser with `npm run bench:receipts`. Two documented, honest failures:
- **Refunds with negative totals** — the parser has no minus-sign handling, so a `-$15.00` refund comes back as `$15.00`.
- **Whole-dollar totals with no cents** (`Total 45` instead of `Total 45.00`) — the regex requires exactly 2 decimal digits.

Both are known limitations, explicitly documented rather than silently wrong.

---

## 8. The AI Financial Assistant — Full Evolution Story

This is the core engineering narrative of the project. It happened in four distinct phases, each with its own real numbers.

### 8.1 Original design: single-shot RAG chain

The first version, on every question, unconditionally:
1. Fetched the 5 most recent expenses + 5 most recent incomes directly from MySQL.
2. Ran a Pinecone semantic similarity search on the literal question text.
3. Concatenated both into one big context block.
4. Sent that block + the question to the LLM in a single call.

This worked for simple lookups but had a **structural ceiling**: it could never compute an exact sum across more than ~10 records, because that's all it ever saw. Asking "how much did I spend on Food *in total*" was mathematically impossible to answer correctly if Food purchases existed outside that 10-record window.

### 8.2 The recency bug (fixed before the bigger rebuild)

**Symptom:** the assistant would sometimes name an *older* expense as "the latest." **Root cause:** the semantic-search step embedded the literal question text ("what's my latest expense") and searched for similar-sounding *content* — not recency. An older expense whose description happened to contain words like "latest" or "recent" could rank highly in that search and get surfaced as if it were the answer, even though the correct recency-sorted data was *also* in context — the LLM sometimes trusted the wrong section.

**Fix (three changes together):**
1. Skip semantic search entirely when the question matches recency phrasing (`/\b(latest|most recent|last|newest)\b/i`).
2. Add an `id: "desc"` tiebreaker to the recency sort, since MySQL doesn't guarantee ordering among rows with an identical `date` value otherwise.
3. Reorder the prompt so the recency-sorted data sits closer to the actual question (LLMs weight text nearer the end of the prompt more heavily).

**Verification:** an adversarial benchmark case was added specifically to catch a regression — an old expense worded *"my latest and most recent big purchase — a brand new iPhone"* seeded alongside the real latest expense, asserting the answer never cites the decoy. Result: **100% (13/13)** on the full benchmark after the fix.

### 8.3 The Agentic Upgrade: from fixed-context-window to tool-calling agent

**The actual goal:** fix the structural ceiling from §8.1 — make exact aggregation ("total spent on Food") possible at all, not just more reliable.

**The design:** replace the hand-rolled retrieval logic with `createAgent` from LangChain, giving the model four tools instead of a pre-fetched context block:

| Tool | Purpose |
|---|---|
| `getRecentTransactions(type, limit)` | Recency questions |
| `getCategoryTotal(category, type, startDate?, endDate?)` | **Exact sums** — the actual fix for the structural gap |
| `getBalance(startDate?, endDate?)` | Net income − expenses over a period |
| `searchTransactions(query)` | Fuzzy/open-ended semantic questions |

Every tool closes over `userId` at construction time — the LLM never controls it, so there's no way for a tool call to cross into another user's data, regardless of what the model is prompted or tricked into asking for.

#### The model-selection debugging story

The first live benchmark run after wiring the agent came back at **23.1% accuracy, 67.7s average latency** — using the same model (`llama-3.1-8b-instant`) that had worked fine for the old single-shot design. Three real problems, diagnosed one at a time rather than guessed at:

1. **Groq rate limits (TPM)**: a multi-turn tool-calling agent resends the full conversation + tool schemas on every turn — far more tokens per question than the old 1-call design. Hit the free-tier per-minute budget repeatedly.
2. **Runaway recursion**: the agent looped on tool calls without ever converging, for some questions — hit LangGraph's default 25-step recursion limit.
3. **Malformed tool-call generations**: Groq's parser rejected outputs like `<function=getRecentTransactions{"type": "income"}</function>` — missing the `>` that should close the function-name tag. A known quirk of Llama models' "pythonic tag" tool-calling format on Groq.

Swapping to `llama-3.3-70b-versatile` (Groq's own recommended model for tool use) fixed the latency but **not** the malformed-tag problem — same errors persisted. Disabling `parallel_tool_calls` helped a little (30.8%) but didn't fix the root cause either. The actual fix: reading `node_modules/@langchain/groq/dist/profiles.js` directly revealed `openai/gpt-oss-20b` — an OpenAI open-weight model hosted on Groq that uses **OpenAI's native JSON tool-calling convention** instead of Llama's pythonic-tag format. Switching to it: **76.9% accuracy, zero tool-format errors, zero recursion timeouts.**

#### Proving the aggregation fix actually works

A benchmark case was added specifically designed to be **impossible under the old design**: 3 Food expenses seeded, 2 of which fall outside the old top-5-recent retrieval window. Asked *"How much did I spend on Food in total?"* — the new agent correctly sums all 3 ($45 + $35 + $22.50 = **$102.50**) via `getCategoryTotal`, something the old single-shot chain could not have answered correctly even in principle.

Along the way, two more real bugs were found and fixed by the benchmark itself:
- A **nullable-schema mismatch**: `openai/gpt-oss-20b` follows OpenAI's convention of sending `null` for unset optional arguments rather than omitting them; the Zod schemas only allowed `undefined`, causing legitimate tool calls to fail validation. Fixed with `.nullable().optional()`.
- A **Unicode smart-quote grading bug**: the model's decline responses (*"I couldn't find any..."*) used typographic apostrophes (`'`, U+2019) while the benchmark's hardcoded check strings used plain ASCII (`'`) — a byte-level mismatch that silently failed grading even when the model's answer was correct. Fixed by normalizing both sides before comparison.

Final tuning: raising `recursionLimit` from 8 to 12 fixed one remaining flaky failure and, counter-intuitively, *reduced* average latency (giving the graph headroom let it terminate more efficiently instead of grinding toward a tighter ceiling).

**End state of this phase: 100% (15/15)** on the full benchmark.

### 8.4 The General Chat Upgrade: from finance-only bot to general assistant

**The problem:** the system prompt explicitly forbade the model from ever answering without a tool call — correct for preventing financial hallucination, but it also meant the assistant refused or mishandled anything that wasn't a direct money question.

**Four changes, each verified in isolation before moving to the next:**

1. **Loosened the system prompt** — split into "chat about anything" + "but use tools for financial questions, never guess." Verified with a free general-chat smoke test (no data seeding needed), then the full 15-question financial benchmark to confirm no regression in tool-calling discipline: **93.3% (14/15)**, the one failure being another benchmark-wording gap, not a real regression.
2. **Added `getSpendingBreakdown(type, startDate?, endDate?)`** — a Prisma `groupBy`-based tool returning exact per-category totals, sorted descending. Deliberately a single composable building block rather than a narrow "compare two periods" tool: the agent can call it twice (once per period) to answer trend questions itself. Verified with a hand-seeded smoke test: Food $80 (2 records), Travel $100 (1 record), Games $10 (1 record) — all returned exactly right, correctly sorted.
3. **Added conversation memory** — the frontend already held a `messages` array for UI display; it just wasn't being sent to the backend. Wired it through (`api.ts` → `chat.controller.ts` → `RagService`), capped at 10 messages **both client- and server-side** as a cost guardrail (a multi-turn agent is already token-hungry per §8.3; unbounded history would compound that on every turn).

   **The memory test had to be redesigned once already-in-progress**, which is itself a useful lesson: the first version asked "How much did I spend on Food?" then, with history, "What about Travel?" — but "Travel" is a real category name, so the model answered correctly **even with an empty history array**, proving nothing about memory specifically. Redesigned around a genuine pronoun with no other referent: *"What was my most recent expense?"* → *"$150 on Travel"* → *"How much was that, exactly?"* With history: **"$150.00."** Without history, same question: **"I'm not sure which transaction you're referring to."** That contrast — correct with memory, correctly declines without it — is real proof, not just a passing test.

4. **Final integration**: all new capabilities (general chat, trends, memory) added directly into the main benchmark suite alongside the existing financial questions. **Result: 90.5% (19/21)** — critically, all 6 new test cases passed; the 2 failures were a likely non-deterministic flake (a question that had passed in every prior run) and the same recurring benchmark-phrasing pattern from earlier, both explained rather than chased with more re-runs given diminishing returns on real API cost.

### 8.5 Final tool set (5 tools)

`getRecentTransactions`, `getCategoryTotal`, `getBalance`, `getSpendingBreakdown`, `searchTransactions` — each with a description written as an instruction to the model about *when* to call it, which is what actually replaced the old hand-coded keyword-matching logic (`isRecencyQuestion` regex, retired entirely once the agent had a proper `getRecentTransactions` tool with a clear description).

---

## 9. Testing & Benchmark Infrastructure

Two independent, reproducible benchmark scripts — committed to the repo, not one-off scratch scripts:

- **`npm run bench:receipts`** (root) — no external services needed, runs instantly, 31 receipt formats, writes results to `benchmarks/receipt-parser/`.
- **`npm run bench:rag`** (in `src/backend`) — seeds deterministic test data through the *actual production indexing path* (`RagService.indexExpense`/`indexIncome`), runs 21 questions against the live Groq/Gemini/Pinecone stack, grades answers with rule-based checks (not another LLM judge — deterministic, reproducible, free), writes results to `benchmarks/rag-assistant/`, and cleans up all seeded data afterward.

Every number cited in this document came from actually running one of these two scripts — not estimated.

---

## 10. Live End-to-End Testing & Bugs Found

Every benchmark above calls `RagService` directly from a Node script — real AI calls, but skipping the entire HTTP/auth/cookie layer entirely. A dedicated session was spent actually running the app (both dev servers, a real browser via Playwright, an actual registered account) to close that gap. It found **4 real bugs** invisible to every prior benchmark:

1. **Test-script bug** (not the app): a generated username exceeded the 20-character schema limit — caught immediately as a false alarm, fixed in the test script.
2. **`DATABASE_URL` never expanded in the real server**: `index.ts` and `seed-vectors.ts` used plain `dotenv.config()`, which doesn't resolve `${MYSQL_USER}`/`${MYSQL_PASSWORD}` template syntax — a bug already fixed in the benchmark scripts earlier, but never applied to the actual server entrypoint. Fixed with `dotenv-expand` in both files.
3. **The ESM import-ordering bug breaking login** — see §5 for the full explanation. The single most subtle bug found this entire project.
4. **Registration never issued session cookies** — `register` created the user but never called the cookie-setting logic that `login` did, so a freshly-registered user was shown the dashboard as if authenticated while every subsequent API call 401'd until they explicitly logged in. Fixed by extracting a shared `issueSession()` helper used by both.

Final verification: a Playwright script registered a real account, seeded expenses via authenticated API calls, and drove the actual chat widget through general conversation, trend questions, and multi-turn memory — with screenshots at each step, not just a script asserting on returned strings.

---

## 11. Chat UI/UX Redesign

Two problems noticed only after the AI logic was working: the assistant's markdown-formatted answers (bold, tables, bullet lists — confirmed via the live-testing screenshots) were rendered as raw text, showing literal `**`/`|` symbols; and the chat widget was a small 320-384px box pinned to a corner, visually inconsistent with the rest of the app's design language.

- **Markdown rendering**: `react-markdown` + `remark-gfm`, with every element (`p`, `strong`, lists, tables, code, links) mapped to custom Tailwind-styled components matching the app's existing zinc-based design tokens — not a generic typography plugin, but exact control matching the rest of the UI.
- **Full-screen layout**: replaced the corner box with a `fixed inset-0` overlay, centered message column (`max-w-3xl`, avoiding unreadably long lines on wide screens), header/input bars styled to match the rest of the app, and the floating action button recolored from an inconsistent blue to the app's actual monochrome button style.
- Verified with live screenshots in both light and dark mode, including a markdown-table-triggering question and a mixed bold/bullet-list question — actually looked at the rendered output, not just confirmed the code compiled.

---

## 12. DevOps: Docker, CI/CD, Deployment

- **Docker**: multi-stage builds for both frontend (Nginx-served static build) and backend (compiled TypeScript, production `npm ci --omit=dev`), orchestrated locally via Docker Compose (MySQL + backend + frontend, health-check-gated startup).
- **CI**: GitHub Actions, lint + build on every push/PR to `main`, plus a weekly scheduled run.
  - **A real, easy-to-miss problem**: GitHub automatically disables *any* workflow (not just scheduled ones) after 60 days of repository inactivity — and it does **not** automatically re-enable itself once new commits resume. This workflow had silently stopped running months prior; none of several recent merged PRs had actually triggered CI at all. Found via `gh workflow list` showing `disabled_inactivity`, fixed with `gh workflow enable`, and verified by manually triggering a run that passed in 32s.
  - Also bumped from Node 20 to Node 22 on the runner, since Node 20 is deprecated on GitHub Actions and was already being silently forced onto Node 24 with a warning on every run.
- **Deployment targets**: Vercel (frontend), Render (backend), with an alternative all-in-one Railway path documented for simpler setups.

---

## 13. Engineering Practices Demonstrated

- **Benchmark-driven development**: every AI-facing claim ("the assistant can now do X") is backed by a specific, reproducible, versioned number — not asserted.
- **Regression-first debugging**: when a bug was found (recency, aggregation gap, auth), the fix was always paired with a test case specifically designed to fail under the *old* behavior and pass under the *new* one — proof the fix addresses the actual root cause, not just the symptom observed once.
- **Documented dead ends**: model attempts that didn't work (`llama-3.1-8b-instant`, `llama-3.3-70b-versatile`, `parallel_tool_calls: false`) are recorded alongside what did — the debugging path is treated as part of the engineering artifact, not discarded once a fix is found.
- **Honest failure reporting**: benchmark runs that came back below 100% were reported and explained, not silently re-run until a clean number appeared. Two specific failures in the final general-chat benchmark were explicitly diagnosed as "likely non-deterministic flake" and "known benchmark-wording gap" rather than glossed over.
- **Full-stack verification, not just unit-level**: the decision to actually run the app end-to-end (§10) after weeks of backend-script-only verification directly caught 3 real bugs that no amount of additional backend testing would have found.
- **Step-by-step playbook documentation**: every non-trivial change is documented as its own file in `docs/`, written *during* the work (root cause, what was tried, what worked, verification), not reconstructed from memory afterward.

---

## 14. Key Metrics Summary (for resume/portfolio citation)

| Metric | Value | Source |
|---|---|---|
| Receipt OCR extraction accuracy | **93.5%** (29/31 formats) | `npm run bench:receipts` |
| RAG assistant accuracy (final, full suite) | **90.5%** (19/21, incl. general chat/trends/memory) | `npm run bench:rag` |
| RAG assistant accuracy (financial questions only, final tuning) | **100%** (15/15) | `AGENTIC_RAG_PLAYBOOK_STEP4_TUNING.md` |
| Models evaluated for tool-calling reliability | 3 (`llama-3.1-8b-instant`, `llama-3.3-70b-versatile`, `openai/gpt-oss-20b`) | `AGENTIC_RAG_PLAYBOOK_STEP2` |
| Real bugs found via live end-to-end testing | 4 | `LIVE_APP_TESTING_PLAYBOOK.md` |
| AI assistant tools (agentic, composable) | 5 | `financialAssistant.tools.ts` |

---

## 15. Known Limitations (honest, not hidden)

- No budgeting feature (no `budget` model in the schema).
- No multi-currency support (payment *method* is tracked, not currency).
- No pagination on expense/income list queries — `findMany` fetches everything for a user.
- Test coverage outside the two benchmark suites is thin (only the receipt-parser utility has traditional unit tests).
- Some unused dependencies remain installed (`@auth/core`, `@auth/express`, `@auth/prisma-adapter`, `@langchain/community`, `@langchain/ollama`, `chromadb`, `@cubejs-client/core`) — remnants of earlier architecture explorations, not wired into any active feature.
- No rate-limiting on the `/api/chat` endpoint — a real cost-control gap given each question can trigger multiple LLM calls.
- The refund-negative-amount and whole-dollar-total-without-cents limitations in the receipt parser (§7).

---

## 16. File Map (where everything actually lives)

```
src/
├── components/FinancialAssistant.tsx      # Chat UI (full-screen, markdown rendering)
├── services/api.ts                         # askFinancialAssistant() + conversation history
├── utils/receiptParser.ts                  # OCR text → total extraction logic
├── utils/receiptParser.bench.dataset.ts    # 31-case receipt benchmark dataset
├── utils/receiptParser.bench.test.ts       # Receipt benchmark runner
└── backend/src/
    ├── config/auth.config.ts               # Lazy-getter env config (see §5)
    ├── controllers/auth.controller.ts       # login/register, shared issueSession()
    ├── controllers/chat.controller.ts       # /api/chat endpoint
    ├── services/rag.service.ts              # The agent itself (createAgent, system prompt)
    ├── services/financialAssistant.tools.ts # The 5 tools
    └── rag-benchmark.ts                     # 21-question RAG benchmark runner

docs/
├── AGENTIC_RAG_UPGRADE_PLAN.md + STEP1-4    # Single-shot chain → tool-calling agent
├── GENERAL_CHAT_UPGRADE_PLAN.md + STEP1-4   # Finance-only bot → general assistant
├── LIVE_APP_TESTING_PLAYBOOK.md             # The 4 bugs found via real browser testing
├── CHAT_UI_REDESIGN_PLAYBOOK.md             # Markdown rendering + full-screen layout
└── SIMPLE_GUIDE_RAG_CHANGES_AND_GENERAL_CHAT.md  # Plain-English version of all of the above

benchmarks/
├── receipt-parser/results.md + .json
└── rag-assistant/results.md + .json
```
