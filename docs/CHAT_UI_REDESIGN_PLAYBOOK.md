# Playbook — Chat UI Redesign: Markdown Rendering + Full-Screen Layout

**Status:** ✅ Done, verified visually with live screenshots (light and dark mode).
**File changed:** `src/components/FinancialAssistant.tsx` (full rewrite)
**Dependencies added:** `react-markdown`, `remark-gfm`

## The problem

The AI assistant's answers frequently include markdown — bold text, bullet lists, and full tables (confirmed in `LIVE_APP_TESTING_PLAYBOOK.md`'s screenshots, e.g. a spending breakdown rendered as raw `| Category | Amount |` table syntax). The chat widget rendered every message as plain text (`{msg.content}` inside a `<div>`), so users saw literal `**bold**` asterisks and unparsed table pipes instead of formatted output. Separately, the widget was a small 320-384px-wide box pinned to the bottom-right corner — cramped for anything beyond a one-line answer, and visually inconsistent with the rest of the app (it used a blue/gray color scheme; every other screen in the app — `Login.tsx`, `Register.tsx`, `AddExpenseForm.tsx` — uses a monochrome zinc palette).

## Step 1: Render markdown properly

No markdown library existed in the project. `react-markdown` was chosen (the standard, actively-maintained choice for React) along with `remark-gfm` (GitHub-Flavored Markdown support — specifically needed for tables, since the assistant's breakdown answers rely on them):

```bash
npm install react-markdown remark-gfm
```

No `@tailwindcss/typography` plugin was added. Instead, `react-markdown`'s `components` prop maps each markdown element (`p`, `strong`, `ul`/`ol`/`li`, headings, `code`/`pre`, `table`/`th`/`td`, `a`, `blockquote`) directly to Tailwind-styled elements matching the app's existing design tokens (zinc borders, `rounded-xl`/`rounded-2xl`, the same focus-ring treatment used on form inputs elsewhere in the app). This was a deliberate choice over the typography plugin: it gives exact control over how each element looks without pulling in a whole prose stylesheet that would need overriding anyway to match the zinc palette.

Only assistant messages are parsed as markdown — user messages render as plain text (`whitespace-pre-wrap`), since a user's own typed question has no reason to contain markdown syntax and shouldn't be interpreted as such.

## Step 2: Full-screen layout, redesigned to match the app's existing visual language

Replaced the small fixed-size corner box with a `fixed inset-0` overlay — full viewport width and height when open, with:

- A header bar (icon + title + close button) matching the icon-in-a-rounded-square pattern already used on `Login.tsx`/`Register.tsx`.
- A scrollable message area, capped at `max-w-3xl` and centered — full-bleed on small screens, but not stretched edge-to-edge into unreadable long lines on wide monitors (the same reasoning chat apps like ChatGPT use for their centered column).
- An input bar pinned to the bottom, styled identically to the app's existing form inputs (`AddExpenseForm.tsx`'s input styling was reused directly: `rounded-xl`, zinc borders, the same focus-ring treatment).
- The floating action button (shown when the chat is closed) was recolored from blue to the app's zinc-900/zinc-100 monochrome button style, for consistency with every other primary button in the app.

Two small UX details added while doing this:
- `document.body.style.overflow = "hidden"` while the chat is open, restored on close — otherwise the dashboard underneath would still scroll behind the full-screen overlay.
- The input auto-focuses when the chat opens, and a 3-dot "thinking" indicator (animated bounce, matching the zinc palette) replaced the old plain "Thinking..." text.

## Verification — actually looked at it, not just typechecked

`npx tsc -b --noEmit` passing proves the code compiles; it proves nothing about whether a table actually renders as a table. Per the project's own testing conventions (see `LIVE_APP_TESTING_PLAYBOOK.md` for why this matters), this was verified with a live Playwright run against the real dev server:

1. Registered a fresh account, seeded 3 categorized expenses via the API.
2. Screenshotted the closed state — confirmed the floating button now matches the app's monochrome design.
3. Opened the chat (full-screen) and asked *"Break down my spending by category in a table, and tell me which is highest in bold."* — the response rendered as an actual HTML table with a shaded header row, **Travel** correctly bolded as the top category, and the closing sentence's *italic* emphasis preserved. Not raw markdown syntax on screen.
4. Asked a second question combining a plain-text answer with a bullet list (*"What is 12 times 12? Also give me a short bullet list of 3 budgeting tips."*) — bullets, bold tip labels, and the arithmetic answer all rendered correctly in one response.
5. Toggled dark mode via the app's existing theme toggle and re-asked a question — header, message bubbles, borders, and the input bar all correctly inverted to the dark zinc palette with no unstyled/white-flash elements.

All screenshots were taken in the session scratchpad (not committed to the repo, same reasoning as `LIVE_APP_TESTING_PLAYBOOK.md` — verification artifacts for this conversation, not permanent project documentation).

## What was intentionally not changed

- No changes to `ChatController`, `RagService`, or any backend code — this was purely a frontend rendering/layout change. The assistant's actual answers (content, tool usage, memory) are unaffected.
- No new dependency for the full-screen layout itself — it's plain Tailwind utility classes (`fixed inset-0`, flexbox), no modal/dialog library needed since there's no focus-trap or nested-modal requirement here.
