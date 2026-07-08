# Simple Guide: What Changed, Why, and How to Make the AI Chat Like ChatGPT

This document explains everything in plain English — no coding knowledge needed.

## Part 1: What was the problem?

Your expense tracker has an AI assistant you can ask questions like "what's my latest expense?" or "how much did I spend on food?" Before these changes, it worked in a fairly rigid way:

Every single time you asked a question — *any* question — the app did the exact same thing behind the scenes:
1. Go grab your 5 most recent expenses and 5 most recent incomes from the database.
2. Also search for "similar-sounding" transactions using AI search (called "semantic search").
3. Dump all of that into one big pile of text.
4. Hand that pile of text to the AI and say "answer the question using only this."

This caused two real problems:

**Problem A — it sometimes told you the wrong "latest" expense.** If you had an old expense whose description happened to contain words like "latest" or "recent," the AI search step could accidentally pull that one up and the AI would get confused about which one was actually newest. (We already partially fixed this earlier in a previous round of changes.)

**Problem B — it could never give you an exact total.** If you asked "how much did I spend on Food in total?", the app could only ever look at a small handful of recent transactions (at most 10-15). If you had spent money on food many times across many months, most of those transactions were simply never shown to the AI at all — so it was mathematically impossible for it to give you a correct total. It wasn't a bug exactly — the app was never built to be capable of adding things up. It could only "peek" at a small window of your data, never look at everything.

## Part 2: What we changed (in plain English)

Instead of always doing the same fixed steps every time, we gave the AI a set of **tools** — think of them like buttons the AI is allowed to press when it needs specific information, instead of us shoving all the information at it whether it needs it or not.

The AI now decides for itself, based on your question, which button(s) to press:

- **"Get my recent transactions" button** — presses this when you ask about your "latest" or "most recent" transaction.
- **"Get my exact total for a category" button** — presses this when you ask "how much did I spend/earn on X in total." This one actually asks the database to add up *every single matching transaction*, not just a handful — this is the fix for Problem B.
- **"Get my balance" button** — presses this when you ask "am I positive or negative" or "what's my balance." It adds up all your income, subtracts all your expenses, and gives you the real number.
- **"Search my transactions" button** — presses this for fuzzy, open-ended questions like "what did I buy at that electronics store."

This is a much smarter design because the AI only fetches the information it actually needs for your specific question, and — critically — it can now do real math (totals, sums, balances) instead of just glancing at a handful of records and guessing.

### Which files changed, and why

| File | What it is | What we did to it |
|---|---|---|
| `src/backend/src/services/financialAssistant.tools.ts` | **Brand new file.** This is where the 4 "buttons" (tools) described above are defined. | Created from scratch. Each tool is locked to only ever look at *your* data — there's no way for the AI to accidentally see another user's transactions, because your account ID is baked into each tool before the AI ever touches it. |
| `src/backend/src/services/rag.service.ts` | The main "brain" that handles your questions to the AI assistant. | Rewrote the core function so that, instead of always doing the same fixed steps, it now hands the AI the 4 tools and lets the AI decide what to do. Also had to try 3 different AI models before finding one that could reliably use the tools without making mistakes (explained more below). |
| `src/backend/src/rag-benchmark.ts` | A test script that asks the AI a bunch of practice questions and checks if the answers are correct. | Added new test questions specifically designed to check the "add everything up" feature — for example, seeding 3 separate food purchases and checking whether the AI correctly says the total is $102.50. |
| `src/backend/src/middlewares/validation.middleware.ts` | Unrelated-looking file that checks incoming web requests are formatted correctly. | Had to make a small, unrelated-seeming fix here because adding the new AI tool feature accidentally broke this file's type-checking due to a technical quirk in one of the AI libraries we use. Nothing about how it actually works changed for users — this was purely a "make the code compile again" fix. |
| `docs/AGENTIC_RAG_UPGRADE_PLAN.md` and the 4 `docs/AGENTIC_RAG_PLAYBOOK_STEP*.md` files | Documentation only — no effect on how the app runs. | Written to record exactly what was tried, what failed, why it failed, and what finally worked — like a lab notebook, so anyone (including future-you) can understand the reasoning later without having to redo the investigation. |

### The bumpy part: picking the right AI model

Not every AI model is equally good at using "tools." We first tried the model that was already being used (a smaller, faster one called `llama-3.1-8b-instant`). It kept messing up the formatting of its tool requests, causing errors, and sometimes it would get stuck repeatedly asking for information without ever actually answering. We tried a bigger model next (`llama-3.3-70b-versatile`), which helped a little but still had the same formatting problem. Eventually we switched to a different model entirely (`openai/gpt-oss-20b`), which uses a more standard, reliable way of making tool requests — and that's the one that finally worked well.

### The end result

We built an automatic test that asks the AI 15 practice questions (including "add up all my food spending" and "what's my balance") and checks every single answer against the correct, hand-calculated value. The final score: **15 out of 15 correct**, including the two "add everything up" questions that were completely impossible to answer correctly under the old design.

---

## Part 3: Why can't I just chat with it normally, like ChatGPT?

This is a completely reasonable thing to notice, and the reason is simple: **we deliberately built this AI to only ever talk about your money.**

Right now, the AI is given a strict instruction (in plain English, this is roughly what it's told behind the scenes):

> "You are a financial assistant. Always answer using the tools provided. Never guess or use your own general knowledge. If the tools don't have the answer, say you don't know."

This is intentional and, honestly, a good safety choice for a finance app — you don't want your expense tracker's AI confidently making up numbers about your money, or wandering off into unrelated chit-chat when you're trying to check your spending. That instruction is exactly what stops it from hallucinating fake transactions.

But it also means: if you ask it something that has nothing to do with your expenses — like "what's the capital of France" or "help me write an email" — it will either refuse or awkwardly try to answer using its expense tools, which obviously won't work.

Tools like ChatGPT, Claude, Gemini, and DeepSeek don't have this restriction. They're built to talk about *anything*, and they only use "tools" (like web search) occasionally, as a bonus — not as the only thing they're allowed to do.

## Part 4: What would need to change to make it chat like ChatGPT?

Here's the good news: this is genuinely possible, and it wouldn't require throwing away any of the work we just did. It's really about **loosening the restriction**, not rebuilding anything. Here's what that would look like, in plain terms:

1. **Change the instruction we give the AI.** Right now it's told "you may ONLY use the tools, never your own knowledge." We'd change this to something like: *"You can chat about anything normally. But if the user asks about their expenses, income, or spending, use the financial tools to get accurate real numbers instead of guessing."* This one change is the biggest piece — it flips the AI from "finance-only robot" to "helpful general assistant that also happens to be really good with your money questions."

2. **Let it answer general trend questions.** You mentioned wanting to know about your spending "trends" — like "am I spending more this month than last month" or "what category do I spend the most on." Right now, the tools we built are good at exact lookups (totals, recent transactions) but don't yet have a specific tool for "compare this month to last month" or "rank my categories by how much I spend." We'd want to add 1-2 more tools specifically for that kind of trend/comparison question — this is a small, natural extension of what already exists, not a redesign.

3. **Add "memory" of the conversation.** Right now, every question you ask is treated as brand new — the AI doesn't remember what you asked 30 seconds ago. ChatGPT-style apps keep a running conversation so you can say "what about last month?" right after asking about this month, and it understands what "what about" refers to. This would need the chat screen and the backend to start keeping track of the last several messages in your conversation and sending that history along with each new question.

4. **Think about cost and safety guardrails.** If the AI can now answer literally anything, you'll want to double check it isn't being used to run up a huge bill (each question costs a small amount of money to the AI provider) or being misused for something unrelated to your app entirely. This is a "nice to think about," not a blocker — most apps just set a reasonable limit on how long conversations can get.

None of this is a big rebuild. The hard part — teaching the AI to reliably fetch real numbers instead of guessing — is already done and tested. Making it also able to chat generally is really just: change a paragraph of instructions, add a couple more tools for trend questions, and let it remember the conversation. If you want, this could be scoped out and documented the same careful way as the changes above, before touching any code.
