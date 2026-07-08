# Playbook — Step 2: Wire `createAgent` into `RagService`

**Parent plan:** `AGENTIC_RAG_UPGRADE_PLAN.md`
**Status:** ✅ Wiring done and empirically validated at 76.9% (10/13) on the pre-existing 13-question benchmark. Two genuine reasoning gaps remain, tracked for a later prompt-tuning pass; one "failure" is actually a benchmark grading gap.
**File changed:** `src/backend/src/services/rag.service.ts`

## What changed

`askFinancialAssistant` no longer does any retrieval itself. The entire hand-rolled block — fetch 5 recent expenses/incomes, regex-check for recency keywords, conditionally run Pinecone search, concatenate two context blocks, template-fill a prompt — was deleted and replaced with:

```ts
const tools = createFinancialAssistantTools(userId, { pineconeIndex: idx, embeddings: emb });
const modelWithConfig = llm.withConfig({ parallel_tool_calls: false });
const agent = createAgent({ model: modelWithConfig, tools, systemPrompt: "..." });
const result = await agent.invoke({ messages: [{ role: "user", content: question }] }, { recursionLimit: 8 });
```

The `isRecencyQuestion` regex from the previous fix is gone — the model now has a `getRecentTransactions` tool with a description that tells it when to use it, and it reasons about that itself rather than the code pattern-matching keywords.

## This step turned into model-selection debugging, not just wiring

The code wired up cleanly and typechecked on the first attempt (once the correct `CreateAgentParams` field names were confirmed from the installed types — see "API surface corrections" below). But the first real benchmark run against the live stack was **23.1% accuracy with 67-second average latency** — a severe regression from the old design's 100%/2.1s. This is the actual story of this step: diagnosing why, empirically, one experiment at a time, without guessing blindly and without assuming the plan doc's anticipated risk ("Model Risk," `llama-3.1-8b-instant` may be unreliable at tool selection) was automatically the full answer.

### Attempt 1 — llama-3.1-8b-instant (baseline, same model as before): 23.1%, avg 67.7s

Raw errors seen:
- `413 ... tokens per minute (TPM): Limit 6000, Requested 7460` — Groq free-tier rate limit. A multi-turn tool-calling agent resends the full conversation + tool schemas on every turn, burning through the per-minute budget far faster than the old design's 1-call-per-question.
- `Recursion limit of 25 reached without hitting a stop condition` — the agent looped on tool calls without ever converging, for 2 of 13 questions.
- `400 ... tool_use_failed ... failed_generation: "<function=getCategoryTotal>{\"category\": \"EMI\", \"type\": \"expense\"}"` — a syntactically-plausible tool call rejected outright by Groq's parser.

**Response:** two safety nets were added regardless of which model was ultimately chosen, since they're correct defensive engineering either way:
- `recursionLimit: 8` in the `invoke()` call config — fail fast instead of grinding through 25 steps.
- A 3-second delay between benchmark questions (`RAG_BENCH_QUESTION_DELAY_MS` in `rag-benchmark.ts`), mirroring the existing indexing delay, to respect per-minute token budgets.

### Attempt 2 — llama-3.3-70b-versatile (Groq's own recommended model for tool use): 23.1%, avg 3.3s

Latency improved enormously (recursion cap + no more runaway loops), but accuracy stayed flat. Almost every failure was now the **same error shape**:

```
"failed_generation":"<function=getRecentTransactions{\"type\": \"income\", \"limit\": 1}</function>"
```

Note the malformed tag: `<function=NAME{...}</function>` — missing the `>` that should close the function-name tag before the JSON payload. It should read `<function=NAME>{...}</function>`. This is a generation-formatting defect from the model itself, not a schema or logic issue on the tool-definition side.

**Hypothesis:** this "pythonic tag" tool-call format is specifically associated with parallel/multi-tool-call generation in Llama models on Groq. Tried forcing sequential single-tool-calls via `llm.withConfig({ parallel_tool_calls: false })` (confirmed from `@langchain/groq`'s own docstring that this is a *call option*, not a constructor field — `ChatGroqInput` rejected it as a constructor arg, `.withConfig()` is the documented way to pass it).

### Attempt 3 — llama-3.3-70b-versatile + parallel_tool_calls: false: 30.8%, avg 4.1s

Small improvement, but the *same* malformed-tag error persisted on most questions — disproving the parallel-tool-calls hypothesis as the root cause. One new data point: a tool call that *did* have well-formed tag syntax still failed validation —

```
"tool call validation failed: parameters for tool getRecentTransactions did not match schema: errors: [`/limit`: expected integer, but got string]"
"failed_generation":"<function=getRecentTransactions>{\"limit\": \"1\", \"type\": \"expense\"}</function>"
```

— the model passed `"limit": "1"` as a string instead of an integer. Combined with the persistent malformed tags, this pointed to the pythonic tag tool-calling format itself being unreliable on Groq's Llama models generally, independent of the parallel-calls setting — not something fixable via a `@langchain/groq` call option (`grep`-ing the full `ChatGroqCallOptions` key list confirmed there's no exposed "strict mode" or "tool format" toggle).

### The actual fix — switch to a model with native (non-pythonic) tool calling

Rather than keep guessing, `node_modules/@langchain/groq/dist/profiles.js` was read directly — it lists per-model capability flags (`toolCalling`, `structuredOutput`, context window, etc.) for every model this SDK supports on Groq, including `openai/gpt-oss-20b` and `openai/gpt-oss-120b`. These are OpenAI's open-weight models, which use OpenAI's standard JSON tool-calling convention — the format most of this tooling ecosystem is actually built around — rather than Llama's pythonic tag format.

### Attempt 4 — openai/gpt-oss-20b: **76.9% (10/13), avg 5.4s, zero tool-format errors, zero recursion timeouts**

This is the model that shipped. `temperature: 0.2` was kept unchanged; only the `model` string changed.

## Remaining 3 failures — genuine reasoning gaps, not infrastructure

1. **"How much was my June salary?"** — the model answered "no salary income recorded for June" when a $3,900 June 4th salary record exists. Likely called `getCategoryTotal` without passing `startDate`/`endDate` for June, or misjudged the date range. Worth revisiting the tool description or system prompt to more strongly nudge date-range usage for month-specific questions.
2. **"How much cashback reward did I get?"** — the model asked the user to clarify the category name instead of calling `searchTransactions`, even though that tool's description explicitly says to use it for exactly this kind of fuzzy lookup. The model chose to ask a clarifying question instead of trying the fallback tool first.
3. **"How much did I spend on rent last year?"** — this is **not actually a bug**. The model correctly declined to hallucinate a rent expense ("Rent isn't a recognized category in your tracker") — the intended behavior. It failed the benchmark's grading criteria only because the accepted-phrase list (`"don't know"`, `"couldn't find"`, etc.) didn't anticipate this exact phrasing. This is a benchmark wording gap, to be widened in Step 3, not a model or code defect.

## API surface corrections found by reading the installed types (not guessed)

The plan doc's assumptions, written before any code existed, turned out to have two small inaccuracies once checked against the actual installed `langchain@1.2.25` types:
- `createAgent`'s model parameter is named **`model`**, not `llm` (`llm` is documented in the top-level JSDoc example as an alternative form, but the concrete `CreateAgentParams` type only accepts `model: string | LanguageModelLike`).
- The system-prompt parameter is named **`systemPrompt`**, not `prompt` (the top-level `createAgent` JSDoc example says `options.prompt`, but this is stale/inconsistent with the actual `CreateAgentParams` type, which only recognizes `systemPrompt`).

Both were caught immediately by `tsc`'s overload-resolution errors and fixed by reading `node_modules/langchain/dist/agents/types.d.ts` directly rather than trusting doc comments.

## Verification

`npx tsc --noEmit` clean throughout. `npm run bench:rag` run four times against the live Groq/Gemini/Pinecone stack (one per model/config attempt above), each result recorded here rather than only keeping the final number — the debugging path is the actual engineering artifact, not just the final score.

## Deliberately deferred to later steps

- Fixing the two genuine reasoning gaps (June salary date-filtering, cashback search-fallback) — needs targeted system-prompt iteration, best done alongside Step 3's benchmark expansion so there's a stable, wider test set to tune against instead of re-tuning per individual question.
- Widening the benchmark's accepted-decline-phrases list so correct "I don't know" behavior isn't marked as a failure over wording alone.
