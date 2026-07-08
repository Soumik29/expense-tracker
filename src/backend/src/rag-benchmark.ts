import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import path from "path";
import fs from "node:fs";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenvExpand.expand(dotenv.config({ path: path.resolve(__dirname, "../../../.env") }));

import { prisma } from "./db.js";
import RagService from "./services/rag.service.js";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Gemini's free tier rate-limits embedding calls; seed-vectors.ts uses the
// same 4.5s spacing. Override with RAG_BENCH_DELAY_MS if you're on a paid tier.
const INDEX_DELAY_MS = Number(process.env.RAG_BENCH_DELAY_MS ?? 4500);
// The agent can make multiple Groq calls per question (tool-call turns), which
// burns through the free-tier per-minute token budget much faster than the
// old single-shot chain (1 call/question) ever did. Space questions out too.
const QUESTION_DELAY_MS = Number(process.env.RAG_BENCH_QUESTION_DELAY_MS ?? 3000);
const KEEP_DATA = process.argv.includes("--keep-data");

const BENCH_USER = {
  username: "rag_benchmark_user",
  email: "rag-benchmark@test.local",
};

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d;
}

const EXPENSE_SEED = [
  { amount: 45.0, category: "Food", daysAgo: 0, description: "Dinner at Sushi Palace", paymentMethod: "CREDIT_CARD", isRecurring: false },
  { amount: 120.5, category: "Groceries", daysAgo: 1, description: "Weekly grocery shopping at Walmart", paymentMethod: "DEBIT_CARD", isRecurring: false },
  { amount: 60.0, category: "Mobile_Bill", daysAgo: 2, description: "Monthly phone bill", paymentMethod: "UPI", isRecurring: true },
  { amount: 250.0, category: "Travel", daysAgo: 5, description: "Flight ticket to Chicago", paymentMethod: "CREDIT_CARD", isRecurring: false },
  { amount: 89.99, category: "Shopping", daysAgo: 7, description: "New running shoes", paymentMethod: "DEBIT_CARD", isRecurring: false },
  { amount: 15.0, category: "Games", daysAgo: 10, description: "Steam game purchase", paymentMethod: "CREDIT_CARD", isRecurring: false },
  { amount: 12.99, category: "Subscription", daysAgo: 14, description: "Netflix subscription", paymentMethod: "CREDIT_CARD", isRecurring: true },
  { amount: 300.0, category: "EMI", daysAgo: 20, description: "Car loan EMI payment", paymentMethod: "UPI", isRecurring: true },
  { amount: 35.0, category: "Food", daysAgo: 25, description: "Lunch with coworkers", paymentMethod: "CASH", isRecurring: false },
  { amount: 500.0, category: "Travel", daysAgo: 30, description: "Hotel booking for vacation", paymentMethod: "CREDIT_CARD", isRecurring: false },
  // Adversarial case: an OLD expense whose description echoes "latest/most recent"
  // phrasing, so it ranks highly in semantic search for a recency question even
  // though it is not actually the newest record. Regression test for the bug
  // where the assistant answered "latest expense" from semantic search instead
  // of the recency-sorted DB query.
  { amount: 999.99, category: "Shopping", daysAgo: 45, description: "My latest and most recent big purchase - a brand new iPhone", paymentMethod: "CREDIT_CARD", isRecurring: false },
  // Third Food record, deliberately far outside the top-5-most-recent window
  // (daysAgo values in this file's top 5 are 0,1,2,5,7). Combined with the
  // existing Food records at daysAgo 0 and 25, a "total Food spending"
  // question now requires summing 3 records where 2 of the 3 fall outside
  // the old design's fixed retrieval window — the old single-shot chain
  // structurally could not have answered this correctly even in principle,
  // since it only ever saw a 10-record window, not a true SUM.
  { amount: 22.5, category: "Food", daysAgo: 60, description: "Grabbed a quick breakfast sandwich", paymentMethod: "CASH", isRecurring: false },
] as const;

const INCOME_SEED = [
  { amount: 4000.0, category: "Salary", daysAgo: 0, description: "July salary deposit", paymentMethod: "UPI" },
  { amount: 600.0, category: "Freelance", daysAgo: 3, description: "Freelance web design project payment", paymentMethod: "UPI" },
  { amount: 50.0, category: "Gift", daysAgo: 8, description: "Birthday gift from parents", paymentMethod: "CASH" },
  { amount: 200.0, category: "Investment", daysAgo: 15, description: "Dividend payout from stocks", paymentMethod: "DEBIT_CARD" },
  { amount: 3900.0, category: "Salary", daysAgo: 33, description: "June salary deposit", paymentMethod: "UPI" },
  { amount: 100.0, category: "Other", daysAgo: 40, description: "Cashback reward", paymentMethod: "CREDIT_CARD" },
] as const;

type Check = string[]; // OR-matched synonyms; a question passes a check if ANY synonym is found

type BenchQuestion = {
  question: string;
  checks: Check[]; // ALL checks must match (AND of groups, OR within group)
  mustNotInclude?: string[]; // fail if the answer contains any of these
  notes: string;
};

const QUESTIONS: BenchQuestion[] = [
  {
    question: "What was my most recent expense?",
    checks: [["45", "45.00"], ["sushi", "food", "dinner"]],
    mustNotInclude: ["999.99", "iphone"],
    notes: "Recency lookup, expense side. An older $999.99 'latest iPhone purchase' expense is seeded specifically to bait semantic search into being cited instead of the true latest record.",
  },
  { question: "What was my most recent income?", checks: [["4000", "4,000"], ["salary", "july"]], notes: "Recency lookup, income side." },
  { question: "How much did I spend on my flight to Chicago?", checks: [["250"]], notes: "Specific-record recall via semantic search." },
  { question: "What did I spend on Netflix?", checks: [["12.99", "12.9"], ["netflix"]], notes: "Specific-record recall." },
  { question: "How much is my car loan EMI payment?", checks: [["300"]], notes: "Specific-record recall." },
  { question: "Did I receive any gift money recently?", checks: [["50"], ["gift", "birthday"]], notes: "Semantic category match." },
  { question: "What payment method did I use for my grocery shopping?", checks: [["debit"]], notes: "Attribute recall, not just amount." },
  {
    // "June salary" alone is genuinely ambiguous without a year — the model
    // correctly started asking "which year?" once it stopped hallucinating,
    // which is better behavior, not worse. Naming the year explicitly (computed
    // from the actual seeded date, not hardcoded, so this stays correct
    // whenever the benchmark is run) removes the ambiguity instead of
    // penalizing the model for asking a reasonable clarifying question.
    question: `How much was my salary in June ${daysAgo(33).getFullYear()}?`,
    checks: [["3900", "3,900"]],
    notes: "Exact-sum lookup for a specific month/year, disambiguated from the more recent salary deposit — requires passing startDate/endDate to getCategoryTotal.",
  },
  { question: "What did I buy running shoes for?", checks: [["89.99", "89.9"]], notes: "Specific-record recall." },
  { question: "Is my phone bill a recurring expense?", checks: [["yes", "recurring"]], notes: "Yes/no fact recall." },
  { question: "How much cashback reward did I get?", checks: [["100"]], notes: "Specific-record recall." },
  { question: "What did I spend money on for entertainment or games?", checks: [["steam", "game", "15"]], notes: "Semantic category match, ambiguous phrasing." },
  {
    question: "How much did I spend on rent last year?",
    checks: [
      [
        "don't know",
        "do not know",
        "couldn't find",
        "could not find",
        "no information",
        "not available",
        "no relevant",
        "not a recognized category",
        "isn't a recognized category",
        "is not a recognized category",
        "not a category",
      ],
    ],
    notes: "Out-of-context question — the assistant must decline rather than hallucinate a rent expense that was never recorded.",
  },
  {
    question: "How much did I spend on Food in total?",
    checks: [["102.50", "102.5"]],
    notes:
      "True aggregation across 3 Food records ($45 + $35 + $22.50), 2 of which (daysAgo 25 and 60) fall outside the old design's fixed top-5-recent retrieval window. This is the core validation case from AGENTIC_RAG_UPGRADE_PLAN.md: the old single-shot chain could not have answered this correctly even in principle, since it only ever saw a fixed-size context window, never a true SUM.",
  },
  {
    question: "What's my overall balance? Am I positive or negative?",
    checks: [["6399.03", "6,399.03"], ["positive"]],
    notes: "Exact balance = total income ($8,850.00) minus total expenses ($2,450.97), via the getBalance tool — another aggregation the old design could not do.",
  },
];

// LLM output commonly uses typographic ("smart") quotes (' U+2019, " U+201C/D)
// while hardcoded check strings use plain ASCII quotes — a straight substring
// match silently fails on phrases like "couldn't find" vs "couldn't find"
// even though they read identically. Normalize both sides before comparing.
function normalizeQuotes(text: string): string {
  return text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
}

function containsAny(haystack: string, needles: string[]): boolean {
  const lower = normalizeQuotes(haystack).toLowerCase();
  return needles.some((n) => lower.includes(normalizeQuotes(n).toLowerCase()));
}

async function main() {
  console.log("=== RAG Financial Assistant Benchmark ===\n");

  // 1. Clean slate: remove any leftover benchmark user + their data from a prior run.
  const existing = await prisma.user.findUnique({ where: { email: BENCH_USER.email } });
  if (existing) {
    console.log("Found leftover benchmark user from a previous run — cleaning up first...");
    const oldExpenses = await prisma.expense.findMany({ where: { userId: existing.id } });
    const oldIncomes = await prisma.income.findMany({ where: { userId: existing.id } });
    for (const e of oldExpenses) {
      try {
        await RagService.deleteIndexedExpense(e.id);
      } catch (err) {
        console.warn(`  (non-fatal) failed to delete old vector for expense ${e.id}:`, (err as Error).message);
      }
    }
    for (const i of oldIncomes) {
      try {
        await RagService.deleteIndexedIncome(i.id);
      } catch (err) {
        console.warn(`  (non-fatal) failed to delete old vector for income ${i.id}:`, (err as Error).message);
      }
    }
    await prisma.user.delete({ where: { id: existing.id } }); // cascades to expenses/incomes
  }

  // 2. Create a fresh dedicated benchmark user.
  const passwordHash = await bcrypt.hash("Benchmark-Only-1!", 10);
  const user = await prisma.user.create({
    data: { username: BENCH_USER.username, email: BENCH_USER.email, password: passwordHash },
  });
  console.log(`Created benchmark user id=${user.id}\n`);

  // 3. Seed deterministic expenses/incomes and index each into Pinecone.
  console.log(`Seeding ${EXPENSE_SEED.length} expenses + ${INCOME_SEED.length} incomes (indexing with ${INDEX_DELAY_MS}ms spacing to respect embedding rate limits)...`);

  let indexed = 0;
  const totalToIndex = EXPENSE_SEED.length + INCOME_SEED.length;

  for (const e of EXPENSE_SEED) {
    const expense = await prisma.expense.create({
      data: {
        amount: e.amount,
        category: e.category as never,
        date: daysAgo(e.daysAgo),
        description: e.description,
        userId: user.id,
        paymentMethod: e.paymentMethod as never,
        isRecurring: e.isRecurring,
      },
    });
    await RagService.indexExpense(expense);
    indexed++;
    process.stdout.write(`\r  Indexed ${indexed}/${totalToIndex}`);
    await delay(INDEX_DELAY_MS);
  }

  for (const i of INCOME_SEED) {
    const income = await prisma.income.create({
      data: {
        amount: i.amount,
        category: i.category as never,
        date: daysAgo(i.daysAgo),
        description: i.description,
        userId: user.id,
        paymentMethod: i.paymentMethod as never,
      },
    });
    await RagService.indexIncome(income as never);
    indexed++;
    process.stdout.write(`\r  Indexed ${indexed}/${totalToIndex}`);
    await delay(INDEX_DELAY_MS);
  }
  console.log("\nIndexing complete. Waiting 5s for Pinecone consistency...\n");
  await delay(5000);

  // 4. Ask each benchmark question and grade the answer.
  console.log(`Running ${QUESTIONS.length} benchmark questions...\n`);
  const results: Array<{
    question: string;
    answer: string;
    pass: boolean;
    latencyMs: number;
    notes: string;
    error: string | undefined;
  }> = [];

  for (const q of QUESTIONS) {
    const start = performance.now();
    let answer = "";
    let error: string | undefined;
    try {
      answer = await RagService.askFinancialAssistant(user.id, q.question);
    } catch (err) {
      error = (err as Error).message;
    }
    const latencyMs = performance.now() - start;
    const pass =
      !error &&
      q.checks.every((group) => containsAny(answer, group)) &&
      !(q.mustNotInclude && containsAny(answer, q.mustNotInclude));
    results.push({ question: q.question, answer, pass, latencyMs, notes: q.notes, error });
    console.log(`  [${pass ? "PASS" : "FAIL"}] (${latencyMs.toFixed(0)}ms) ${q.question}`);
    await delay(QUESTION_DELAY_MS);
  }

  // 5. Compute metrics + write report.
  const passCount = results.filter((r) => r.pass).length;
  const accuracy = (passCount / results.length) * 100;
  const latencies = results.map((r) => r.latencyMs);
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const maxLatency = Math.max(...latencies);
  const minLatency = Math.min(...latencies);

  const lines: string[] = [];
  lines.push("# RAG Financial Assistant Benchmark Results");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push(`**Overall accuracy: ${accuracy.toFixed(1)}% (${passCount}/${results.length} questions)**`);
  lines.push(`**Latency — avg: ${avgLatency.toFixed(0)}ms, min: ${minLatency.toFixed(0)}ms, max: ${maxLatency.toFixed(0)}ms**`);
  lines.push("");
  lines.push("Seed data: 10 expenses + 6 incomes, deterministic amounts/categories/dates, indexed via the same `RagService.indexExpense/indexIncome` path used in production.");
  lines.push("");
  lines.push("## Question-by-question results");
  lines.push("");
  lines.push("| # | Question | Pass | Latency (ms) | Answer |");
  lines.push("|---|---|---|---|---|");
  results.forEach((r, i) => {
    const shortAnswer = (r.error ? `ERROR: ${r.error}` : r.answer).replace(/\n/g, " ").slice(0, 160);
    lines.push(`| ${i + 1} | ${r.question} | ${r.pass ? "PASS" : "FAIL"} | ${r.latencyMs.toFixed(0)} | ${shortAnswer} |`);
  });

  const failures = results.filter((r) => !r.pass);
  if (failures.length > 0) {
    lines.push("");
    lines.push("## Failures");
    lines.push("");
    for (const f of failures) {
      lines.push(`- **${f.question}** — ${f.notes}`);
      lines.push(`  - Answer: ${f.error ? `ERROR: ${f.error}` : f.answer}`);
    }
  }

  const report = lines.join("\n");
  const outDir = path.resolve(__dirname, "../../../benchmarks/rag-assistant");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "results.md"), report);
  fs.writeFileSync(
    path.join(outDir, "results.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), accuracy, passCount, totalQuestions: results.length, avgLatencyMs: avgLatency, minLatencyMs: minLatency, maxLatencyMs: maxLatency, results }, null, 2),
  );

  console.log("\n" + report + "\n");
  console.log(`Report written to ${outDir}`);

  // 6. Cleanup (unless --keep-data was passed).
  if (!KEEP_DATA) {
    console.log("\nCleaning up benchmark data...");
    const expenses = await prisma.expense.findMany({ where: { userId: user.id } });
    const incomes = await prisma.income.findMany({ where: { userId: user.id } });
    for (const e of expenses) {
      try {
        await RagService.deleteIndexedExpense(e.id);
      } catch {
        // non-fatal
      }
    }
    for (const i of incomes) {
      try {
        await RagService.deleteIndexedIncome(i.id);
      } catch {
        // non-fatal
      }
    }
    await prisma.user.delete({ where: { id: user.id } }); // cascades to expenses/incomes
    console.log("Done — benchmark user, expenses, incomes, and vectors removed.");
  } else {
    console.log(`\n--keep-data passed: leaving benchmark user id=${user.id} and its data in place.`);
  }
}

main()
  .catch((err) => {
    console.error("Fatal error running RAG benchmark:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
