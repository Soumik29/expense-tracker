import { tool } from "langchain";
import { z } from "zod";
import type { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import type { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { prisma } from "../db.js";

type PineconeIndex = ReturnType<InstanceType<typeof PineconeClient>["Index"]>;

// Accepts `null` as well as `undefined` — models that follow OpenAI's tool-
// calling convention (e.g. openai/gpt-oss-20b) tend to include every schema
// property in every call, using `null` for "not provided" rather than
// omitting the key. Rejecting `null` at the schema level caused real
// `tool_use_failed` errors in practice (see AGENTIC_RAG_PLAYBOOK_STEP3).
function parseDateArg(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

// Builds a Prisma date-range filter without ever assigning an explicit
// `undefined` value — under `exactOptionalPropertyTypes`, Prisma's filter
// types reject `{ gte: undefined }`, so unset bounds must be omitted
// entirely rather than present-with-undefined.
function buildDateFilter(startDate: string | null | undefined, endDate: string | null | undefined): { gte?: Date; lte?: Date } {
  const filter: { gte?: Date; lte?: Date } = {};
  const start = parseDateArg(startDate);
  const end = parseDateArg(endDate);
  if (start) filter.gte = start;
  if (end) filter.lte = end;
  return filter;
}

function formatTransaction(kind: "expense" | "income", row: {
  date: Date;
  amount: unknown;
  category: string;
  paymentMethod: string;
  description: string | null;
}): string {
  const verb = kind === "expense" ? "spent" : "earned";
  const prep = kind === "expense" ? "on" : "from";
  return `On ${row.date.toISOString().split("T")[0]}, I ${verb} $${row.amount} ${prep} ${row.category}. Payment method: ${row.paymentMethod}.${row.description ? ` Description: ${row.description}.` : ""}`;
}

/**
 * All tools close over `userId` at construction time — the LLM never
 * supplies it as an argument — so a compromised or confused tool call can
 * never cross into another user's financial data.
 */
export function createFinancialAssistantTools(
  userId: number,
  clients: { pineconeIndex: PineconeIndex; embeddings: GoogleGenerativeAIEmbeddings },
) {
  const getRecentTransactions = tool(
    async ({ type, limit }: { type: "expense" | "income" | "both"; limit: number }) => {
      const take = Math.min(Math.max(limit, 1), 20);
      const [expenses, incomes] = await Promise.all([
        type === "income"
          ? []
          : prisma.expense.findMany({ where: { userId }, orderBy: [{ date: "desc" }, { id: "desc" }], take }),
        type === "expense"
          ? []
          : prisma.income.findMany({ where: { userId }, orderBy: [{ date: "desc" }, { id: "desc" }], take }),
      ]);

      const lines = [
        ...expenses.map((e) => formatTransaction("expense", e)),
        ...incomes.map((i) => formatTransaction("income", i)),
      ];

      return lines.length > 0
        ? lines.join("\n")
        : "No transactions found.";
    },
    {
      name: "getRecentTransactions",
      description:
        "Get the user's most recent expenses and/or incomes, sorted newest first. Use this for any question about the 'latest', 'most recent', 'last', or 'newest' transaction — never guess this from search results.",
      schema: z.object({
        type: z.enum(["expense", "income", "both"]).default("both").describe("Which kind of transaction to fetch"),
        limit: z.number().int().min(1).max(20).default(5).describe("How many records to return"),
      }),
    },
  );

  const getCategoryTotal = tool(
    async ({
      category,
      type,
      startDate,
      endDate,
    }: {
      category: string;
      type: "expense" | "income";
      startDate?: string | null;
      endDate?: string | null;
    }) => {
      const dateFilter = buildDateFilter(startDate, endDate);

      const where: Record<string, unknown> = { userId, category: category as never };
      if (Object.keys(dateFilter).length > 0) where.date = dateFilter;

      const result =
        type === "expense"
          ? await prisma.expense.aggregate({ where, _sum: { amount: true }, _count: true })
          : await prisma.income.aggregate({ where, _sum: { amount: true }, _count: true });

      const total = Number(result._sum?.amount ?? 0);
      return `Total ${type === "expense" ? "spent on" : "earned from"} ${category}${startDate || endDate ? ` (${startDate ?? "the beginning"} to ${endDate ?? "now"})` : ""}: $${total.toFixed(2)} across ${result._count} transaction(s).`;
    },
    {
      name: "getCategoryTotal",
      description:
        "Get the EXACT sum of all expenses or incomes in a specific category, optionally within a date range. Use this for any question asking for a total, sum, or 'how much did I spend/earn on X' — never estimate this from a handful of retrieved records. Expense categories: Food, Groceries, Mobile_Bill, Travel, Shopping, Games, Subscription, EMI. Income categories: Salary, Freelance, Investment, Gift, Other.",
      schema: z.object({
        category: z.string().describe("Exact category name, e.g. 'Food' or 'Salary'"),
        type: z.enum(["expense", "income"]).describe("Whether to sum expenses or incomes"),
        startDate: z.string().nullable().optional().describe("ISO date YYYY-MM-DD, inclusive lower bound, or null/omitted if not specified"),
        endDate: z.string().nullable().optional().describe("ISO date YYYY-MM-DD, inclusive upper bound, or null/omitted if not specified"),
      }),
    },
  );

  const getBalance = tool(
    async ({ startDate, endDate }: { startDate?: string | null; endDate?: string | null }) => {
      const dateFilter = buildDateFilter(startDate, endDate);
      const where: Record<string, unknown> = { userId };
      if (Object.keys(dateFilter).length > 0) where.date = dateFilter;

      const [expenseTotal, incomeTotal] = await Promise.all([
        prisma.expense.aggregate({ where, _sum: { amount: true } }),
        prisma.income.aggregate({ where, _sum: { amount: true } }),
      ]);

      const spent = Number(expenseTotal._sum?.amount ?? 0);
      const earned = Number(incomeTotal._sum?.amount ?? 0);
      const balance = earned - spent;

      return `Total earned: $${earned.toFixed(2)}. Total spent: $${spent.toFixed(2)}. Balance: $${balance.toFixed(2)} (${balance >= 0 ? "positive" : "negative"}).`;
    },
    {
      name: "getBalance",
      description:
        "Get the exact total income, total expenses, and net balance (income minus expenses), optionally within a date range. Use this for 'am I positive/negative', 'what's my balance', or 'how much do I have left' questions.",
      schema: z.object({
        startDate: z.string().nullable().optional().describe("ISO date YYYY-MM-DD, inclusive lower bound, or null/omitted if not specified"),
        endDate: z.string().nullable().optional().describe("ISO date YYYY-MM-DD, inclusive upper bound, or null/omitted if not specified"),
      }),
    },
  );

  const searchTransactions = tool(
    async ({ query }: { query: string }) => {
      const vectorStore = await PineconeStore.fromExistingIndex(clients.embeddings, {
        pineconeIndex: clients.pineconeIndex,
        textKey: "text",
      });

      const results = await vectorStore.similaritySearch(query, 5, {
        userId: { $eq: userId },
      });

      return results.length > 0
        ? results.map((r) => r.pageContent).join("\n")
        : "No relevant transactions found.";
    },
    {
      name: "searchTransactions",
      description:
        "Semantically search the user's transaction history for records related to a topic, merchant, or description when no exact category/date filter applies — e.g. 'what did I buy at that electronics store'. Do NOT use this for totals/sums or recency questions; use getCategoryTotal, getBalance, or getRecentTransactions instead.",
      schema: z.object({
        query: z.string().describe("A natural-language description of what to search for"),
      }),
    },
  );

  return [getRecentTransactions, getCategoryTotal, getBalance, searchTransactions];
}
