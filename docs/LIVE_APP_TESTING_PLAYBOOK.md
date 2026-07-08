# Playbook — Live End-to-End Testing of the Assistant, and the Bugs It Found

**Status:** ✅ Done. The general-chat/trends/memory upgrade (`GENERAL_CHAT_UPGRADE_PLAN.md`) had been verified via backend benchmark scripts only, never through the actual running app in a browser. This session did that, and found 4 real bugs the benchmark scripts couldn't have caught — none of them related to the RAG/AI logic itself, all related to how the app boots and authenticates.
**Files fixed:** `src/backend/src/config/auth.config.ts`, `src/backend/src/controllers/auth.controller.ts`, `src/backend/src/index.ts`, `src/backend/src/seed-vectors.ts`

## Why this was necessary

Everything up to this point (`AGENTIC_RAG_UPGRADE_PLAN.md`, `GENERAL_CHAT_UPGRADE_PLAN.md`) was verified by calling `RagService.askFinancialAssistant(...)` directly from Node scripts — real, live calls to Groq/Gemini/Pinecone, but never through Express, never through the React frontend, never through an actual login. That's a real gap: a script calling a function directly skips the entire HTTP/auth/cookie layer. This session closed that gap by actually running the app — starting both dev servers, opening a browser, registering an account, and using the chat widget as a real user would.

## Setup

No project skill existed yet for running this app (checked `.claude/skills/` first — none present), so the generic browser-driven pattern was used. `chromium-cli` (the preferred tool) wasn't installed, so a minimal one-off Playwright driver was set up instead, in the scratchpad directory — not added to the project's own dependencies, since this was a one-time verification, not permanent test infrastructure:

```bash
npm init -y && npm install playwright && npx playwright install chromium
```

Both dev servers were started with the harness's native background-process tracking (not shell `&` backgrounding — see Bug 0 below for why that distinction mattered):

- Backend: `cd src/backend && npm run dev` → polled `http://localhost:3000/api/health` until ready.
- Frontend: `npm run dev:frontend` → polled `http://localhost:5173` (Vite picked a free port automatically each run).
- MySQL: already running from earlier in the session (`docker ps` confirmed the container up), untouched.

## Bug 0 (tooling, not app code): background process output wasn't being captured

The first backend launch used `(npm run dev > logfile 2>&1 &)` — plain shell backgrounding in git-bash. The log file stayed essentially empty even after real requests hit the server, and the frontend process silently died a few minutes later with no error. Switching to the Bash tool's native `run_in_background: true` support fixed both problems immediately — full nodemon/tsx output appeared in the tracked output file, and neither process died unexpectedly again. Worth remembering for next time: on this environment, prefer the tool's native background tracking over manual shell `&`, since output redirection and process lifetime aren't reliable across a detached subshell here.

## Bug 1: registration failing with "Validation error" / username too long

The test script generated usernames like `manualtest${Date.now()}` — with the schema's 20-character max (`src/backend/src/validations/auth.schema.ts`), a 10-char prefix plus a 13-digit timestamp blew past the limit. This was a test-script bug, not an app bug — fixed by shortening the generated username. Included here because it was the first failure encountered and initially looked like it might be an app-side validation issue.

## Bug 2 (real): registration failing with a generic 500, root cause `${MYSQL_USER}` never expanded

Once the username was fixed, registration failed differently — `PrismaClientInitializationError: Authentication failed against database server, the provided database credentials for `${MYSQL_USER}` are not valid`. This is the exact same class of bug found and fixed earlier this session in the benchmark scripts (`AGENTIC_RAG_PLAYBOOK` docs) — `DATABASE_URL` in the root `.env` uses `${MYSQL_USER}`/`${MYSQL_PASSWORD}` template syntax that Docker Compose expands itself, but plain `dotenv.config()` does not. That fix was applied to `rag-benchmark.ts` at the time, but **never to the actual server entrypoint** — `src/backend/src/index.ts` and `src/backend/src/seed-vectors.ts` were still using plain `dotenv.config()`, so the live app itself was still broken by this bug even though the benchmark scripts weren't.

**Fix:** added `dotenv-expand` to both files, matching the already-working pattern:

```ts
dotenvExpand.expand(dotenv.config({ path: path.resolve(__dirname, "../../../.env") }));
```

## Bug 3 (real, and the most subtle one): login failing with `secretOrPrivateKey must have a value`

With the DB connection fixed, registration succeeded via `curl`, but **login** still failed — every attempt threw `Error: secretOrPrivateKey must have a value` from inside `jsonwebtoken`'s `sign()`.

A throwaway diagnostic script confirmed `process.env.AUTH_SECRET` genuinely had a value (44 characters) when loaded in isolation — so the `.env` file itself was fine. The actual cause was in `src/backend/src/config/auth.config.ts`:

```ts
const authConfig = {
    secret: process.env.JWT_SECRET ?? process.env.AUTH_SECRET,
    // ...
}
```

This is a **plain object whose properties are computed once, at the moment the module is first imported** — not read lazily. Under ES modules, every `import` declaration in a file is fully resolved and evaluated *before* that file's own top-level code runs, **regardless of where the import is textually written relative to other statements**. `index.ts` writes its `dotenvExpand.expand(...)` call *before* `import App from "./app.js"` in the source — but because `import` declarations are always evaluated ahead of the importing module's own body, `app.js` (and everything it pulls in transitively, including `auth.config.ts` via the auth routes/middleware) actually gets evaluated **first**, reading `process.env.AUTH_SECRET` while it's still empty. The `.env` file only finishes loading afterward, by which point `authConfig.secret` has already been frozen as `undefined` for the rest of the process's life.

This is why Prisma-based routes were unaffected by the equivalent risk: `@prisma/client` reads `DATABASE_URL` lazily, at query time, not at import time. `auth.config.ts`'s plain object literal doesn't have that laziness.

**Fix:** converted every property on `authConfig` to a getter, so each access reads `process.env` fresh, on demand, rather than once at import time:

```ts
const authConfig = {
    get secret() {
        return process.env.JWT_SECRET ?? process.env.AUTH_SECRET;
    },
    // ...
}
```

This matches the lazy-initialization pattern `rag.service.ts`'s `getClients()` already used correctly (see `AGENTIC_RAG_PLAYBOOK_STEP1_TOOLS.md`) — the same defensive pattern, applied to a file that had been missing it.

Also discovered along the way: `AUTH_SECRET_EXPIRES_IN` / `AUTH_REFRESH_SECRET_EXPIRES_IN` were never added to the user's `.env` at all — an oversight from earlier in this session when only `AUTH_SECRET`/`AUTH_REFRESH_SECRET` were mentioned. Added sensible defaults (`"15m"` / `"7d"`, matching `.env.example`'s suggested values) rather than requiring the env var to exist.

## Bug 4 (real): registering a new user never actually logged them in

With login working, the full flow was re-tested from a clean registration — and a new issue surfaced: after registering, the frontend navigated straight to the dashboard (client-side state treated the user as logged in), but every subsequent API call returned 401. Comparing `auth.controller.ts`'s `login` and `register` methods showed why: `login` calls `res.cookie(...)` to issue `accessToken`/`refreshToken` after a successful password check, but `register` never did — it just created the user row and returned their profile data, with no session ever established server-side.

**Fix:** extracted the token-issuing/cookie-setting logic (previously only inside `login`) into a shared private method, `issueSession(res, user)`, called by both `login` and `register`:

```ts
private static issueSession = async (res: Response, user: {...}) => {
    // sign accessToken/refreshToken, hash+store refreshToken, set both cookies
};
```

Verified directly with `curl -i`: `POST /api/auth/register` now returns `Set-Cookie` headers for both tokens, matching what `login` already did.

## Final end-to-end verification

A Playwright script drove the real, running app through the actual UI:

1. `POST`-equivalent form fill on `/register` → immediately landed on the dashboard with a valid session (no separate login step needed after Bug 4's fix).
2. Seeded 3 expenses (Travel $300, Food $120, Games $45) via `fetch()` calls made from inside the browser page (so they reused the real session cookies, exactly as a logged-in user's own requests would) — all returned `200`, not `401`.
3. Opened the chat widget and asked, in sequence:
   - *"What is 10 times 4?"* → **"10 times 4 is 40."** (general conversation, confirmed working live)
   - *"What do I spend the most money on?"* → **"You spend the most on Travel – $300.00 in total. The next highest categories are Food ($120.00) and Games ($45.00)."** (trend/ranking, exact and correctly sorted)
   - *"What was my most recent expense?"* → **"Your most recent expense was $45 on a new video game, paid by debit card on 2026-07-08."**
   - *"How much was that, exactly?"* → **"That was exactly $45.00."** (multi-turn memory, correctly resolved the pronoun using the prior answer)

Screenshots were captured at each step (in the session scratchpad, not committed to the repo — they were verification artifacts for this conversation, not permanent project documentation).

`console --errors` showed only two benign 401s, both from `AuthProvider.tsx`'s `fetchUser()` running on the `/register` page's initial mount (checking "is there already a valid session" before one exists) — expected, pre-existing behavior, not a regression.

## What this playbook adds to the project's testing story

Every other playbook in this repo (`AGENTIC_RAG_PLAYBOOK_STEP*`, `GENERAL_CHAT_PLAYBOOK_STEP*`) verified the RAG/agent logic directly, bypassing HTTP and auth entirely. This session is the first time the full stack — registration, cookies, the Express layer, the React frontend, and the AI assistant — was exercised together as a real user would experience it, and it caught three real bugs (Bugs 2-4) that were invisible to every prior benchmark run specifically because those benchmarks never went through login at all.
