# Playbook — Step 1: Define Agent Tools

**Parent plan:** `AGENTIC_RAG_UPGRADE_PLAN.md`
**Status:** ✅ Done
**File added:** `src/backend/src/services/financialAssistant.tools.ts`
**File fixed as a side effect:** `src/backend/src/middlewares/validation.middleware.ts`

## Goal

Give the RAG assistant four tools it can call at its own discretion, instead of the old design where application code always pre-fetched a fixed context window (5 recent + 5 semantic-search records) regardless of what was actually asked.

## What was verified before writing any code

`createAgent` and `tool` were assumed to exist based on the plan doc, but assumptions weren't trusted — the installed package was inspected directly:

```bash
node -e "console.log(Object.keys(require('langchain')))"
```

This confirmed `createAgent` and `tool` are real exports of the installed `langchain@1.2.25`, and the exact signature was read from `node_modules/langchain/dist/agents/index.d.ts`:

```ts
import { createAgent, tool } from "langchain";
import { z } from "zod";

const search = tool(
  ({ query }) => `Results for: ${query}`,
  {
    name: "search",
    description: "Search for information",
    schema: z.object({ query: z.string().describe("The search query") })
  }
);

const agent = createAgent({ llm: "openai:gpt-4o", tools: [search] });
```

This is the pattern the four tools below follow.

## The four tools implemented

All tools are created by a factory function `createFinancialAssistantTools(userId, clients)` — **`userId` is a closure variable, never an LLM-controllable argument.** This is the load-bearing security property: even if the model hallucinates or is prompt-injected into asking for "user 5's data," there is no parameter through which it could pass a different `userId` to any tool. This preserves the same per-user isolation guarantee the old Pinecone-metadata-filtering design had, but now for every data path, not just semantic search.

| Tool | Purpose | Backing query |
|---|---|---|
| `getRecentTransactions(type, limit)` | Recency questions ("latest", "most recent", "last") | `prisma.expense/income.findMany({ orderBy: [{date:"desc"},{id:"desc"}], take })` |
| `getCategoryTotal(category, type, startDate?, endDate?)` | Exact sums — the gap the old design couldn't fill | `prisma.expense/income.aggregate({ _sum: { amount: true }, _count: true })` |
| `getBalance(startDate?, endDate?)` | Net income − expenses over a period | Two parallel aggregate queries |
| `searchTransactions(query)` | Fuzzy/open-ended questions with no exact filter | Existing Pinecone `similaritySearch`, unchanged |

Each tool's `description` field is written as an instruction to the model about *when* to call it (e.g. `getCategoryTotal`'s description explicitly says "never estimate this from a handful of retrieved records") — in a tool-calling agent, the description is doing the job the old regex/prompt-instruction hybrid used to do, except the model reasons about it instead of application code pattern-matching keywords.


## Problems hit during implementation (and why they happened)

### 1. Importing `langchain`'s agent module broke unrelated files

After adding `import { tool } from "langchain"`, running `npx tsc --noEmit` produced two errors in `src/backend/src/routes/auth.routes.ts` — a file that was never touched:

```
error TS2379: Argument of type 'ZodObject<...>' is not assignable to parameter of type
'ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>, unknown>' with 'exactOptionalPropertyTypes: true'.
Property 'langgraph' is missing in type 'ZodObject<...>' but required in type 'ZodType<...>'.
```

**Root cause:** LangChain's agent typings do global TypeScript declaration-merging on zod's internal types to support interop between zod v3 and v4 schemas (the `langgraph` branding property). Once *any* file in the compiled program imports from `langchain`'s agents module, this augmented type applies to the *entire* compilation — including files that only ever used plain, unbranded `z.object(...)` schemas and had nothing to do with LangChain.

This was confirmed to be a real side effect and not pre-existing breakage by checking `git diff` on `auth.routes.ts` (empty — the file was untouched) before and after adding the import.

**Fix:** `validation.middleware.ts`'s `validateBody(schema: ZodType)` was changed to depend on a minimal structural type instead of zod's own `ZodType`:

```ts
type ParsableSchema = { parse: (data: unknown) => unknown };
static validateBody(schema: ParsableSchema) { ... }
```

This works because the middleware only ever calls `.parse()` on the schema — it never needed the full `ZodType` interface, just this one method. Depending on a locally-defined structural type instead of the (possibly globally-augmented) `zod` type sidesteps the conflict entirely, and is immune to whatever else LangChain's type system does in the future.

**Takeaway for future work:** if another library import unexpectedly breaks typechecking in a file you didn't touch, check whether the new import does global declaration merging before assuming the error is unrelated noise. `git diff` on the "broken" file is the fastest way to rule out an actual edit.

### 2. `exactOptionalPropertyTypes` rejected conditionally-spread date filters

The backend's `tsconfig.json` has `exactOptionalPropertyTypes: true`. The first attempt at building a Prisma date-range filter used the conditional-spread idiom:

```ts
const dateFilter = {
  ...(parseDateArg(startDate) ? { gte: parseDateArg(startDate) } : {}),
  ...(parseDateArg(endDate) ? { lte: parseDateArg(endDate) } : {}),
};
```

This type-checks as `{ gte?: Date | undefined; lte?: Date | undefined }` — note `| undefined` is present in the *value* type, not just optionality — which Prisma's generated `DateTimeFilter` type rejects under `exactOptionalPropertyTypes` (it wants the key *absent*, not present-with-`undefined`).

**Fix:** replaced the conditional-spread idiom with imperative assignment to a locally-typed mutable object:

```ts
function buildDateFilter(startDate: string | undefined, endDate: string | undefined): { gte?: Date; lte?: Date } {
  const filter: { gte?: Date; lte?: Date } = {};
  const start = parseDateArg(startDate);
  const end = parseDateArg(endDate);
  if (start) filter.gte = start;
  if (end) filter.lte = end;
  return filter;
}
```

Conditionally attaching the whole `date` key to the Prisma `where` object had the same problem one level up, and was fixed the same way — imperative `if (...) where.date = dateFilter` instead of a ternary spread — combined with typing `where` as `Record<string, unknown>` rather than fighting Prisma's generated `ExpenseWhereInput`/`IncomeWhereInput` types directly. This matches an existing convention already in the codebase (`category as never` casts elsewhere) rather than introducing a new pattern.

**Takeaway:** under `exactOptionalPropertyTypes`, conditional-spread (`...(cond ? {k: v} : {})`) is not equivalent to "key present only when true" from the type checker's point of view when the branches don't unify cleanly — prefer imperative assignment to a pre-typed mutable object when building optional filter objects for strict external types like Prisma's.

### 3. Prisma `aggregate()`'s `_sum` is typed as possibly `undefined`

`result._sum.amount` failed with `'result._sum' is possibly 'undefined'`. Fixed with optional chaining: `result._sum?.amount ?? 0`. Minor, no deeper cause — just needed handling.

## Verification

`npx tsc --noEmit` from `src/backend` — clean, no errors, across the whole backend (not just the new file).

## What's intentionally NOT done yet

- The tools are not wired into `RagService` yet — `createFinancialAssistantTools` is exported but unused until Step 2.
- No benchmark coverage yet for `getCategoryTotal`/`getBalance` — that's Step 3's job, and is the actual proof this upgrade does something the old design couldn't.
