import { ChatGroq } from "@langchain/groq";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { createAgent } from "langchain";
import type { Expense } from "@prisma/client";
import { createFinancialAssistantTools } from "./financialAssistant.tools.js";

type IncomeRecord = {
  id: number;
  amount: unknown;
  date: Date;
  category: string;
  description: string | null;
  userId: number;
  paymentMethod: string;
};

// Lazy-initialized clients — created on first use so missing API keys
// only fail when the AI feature is actually called, not at server startup.
let pineconeIndex: ReturnType<InstanceType<typeof PineconeClient>["Index"]> | null = null;
let embeddings: GoogleGenerativeAIEmbeddings | null = null;
let model: ChatGroq | null = null;

function getClients() {
  if (!pineconeIndex) {
    if (!process.env.PINECONE_API_KEY) throw new Error("Missing PINECONE_API_KEY");
    const pinecone = new PineconeClient({ apiKey: process.env.PINECONE_API_KEY });
    pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);
  }

  if (!embeddings) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY or GOOGLE_API_KEY");
    embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey,
      model: "gemini-embedding-001",
      // @ts-expect-ignore - taskType not yet in local LangChain type definitions
    });
  }

  if (!model) {
    if (!process.env.GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY");
    // llama-3.1-8b-instant (used by the old single-shot chain) and
    // llama-3.3-70b-versatile both proved unreliable as tool-calling agent
    // drivers on Groq: both models frequently emitted malformed pythonic-tag
    // tool calls (`<function=NAME{args}</function>`, missing the `>` after
    // the function name) that Groq's parser rejected outright, regardless of
    // `parallel_tool_calls`. openai/gpt-oss-20b uses OpenAI's native JSON
    // tool-calling convention instead of Llama's pythonic-tag format, and its
    // profile (node_modules/@langchain/groq/dist/profiles.js) confirms
    // toolCalling + structuredOutput support.
    model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "openai/gpt-oss-20b",
      temperature: 0.2,
    });
  }

  return {
    pineconeIndex: pineconeIndex!,
    embeddings: embeddings!,
    model: model!,
  };
}

class RagService {
  static async indexExpense(expense: Expense) {
    const { pineconeIndex: idx, embeddings: emb } = getClients();
    const semanticText = `On ${expense.date.toISOString().split("T")[0]}, I spent $${expense.amount} on ${expense.category}. Payment method: ${expense.paymentMethod}. ${expense.description ? `Description: ${expense.description}.` : ""}`;

    const vectorValues = await emb.embedQuery(semanticText);
    if (!vectorValues || vectorValues.length === 0) {
      throw new Error("Google Gemini blocked or failed to generate an embedding.");
    }

    await idx.upsert({
      records: [
        {
          id: expense.id.toString(),
          values: vectorValues,
          metadata: {
            expenseId: expense.id,
            userId: expense.userId,
            type: "expense",
            text: semanticText,
          },
        },
      ],
    });
  }

  static async indexIncome(income: IncomeRecord) {
    const { pineconeIndex: idx, embeddings: emb } = getClients();
    const semanticText = `On ${income.date.toISOString().split("T")[0]}, I earned $${income.amount} from ${income.category}. Payment method: ${income.paymentMethod}. ${income.description ? `Description: ${income.description}.` : ""}`;

    const vectorValues = await emb.embedQuery(semanticText);
    if (!vectorValues || vectorValues.length === 0) {
      throw new Error("Google Gemini blocked or failed to generate an embedding.");
    }

    await idx.upsert({
      records: [
        {
          id: `income:${income.id}`,
          values: vectorValues,
          metadata: {
            incomeId: income.id,
            userId: income.userId,
            type: "income",
            text: semanticText,
          },
        },
      ],
    });
  }

  static async deleteIndexedExpense(expenseId: number) {
    const { pineconeIndex: idx } = getClients();
    await idx.deleteOne({ id: expenseId.toString() });
  }

  static async deleteIndexedIncome(incomeId: number) {
    const { pineconeIndex: idx } = getClients();
    await idx.deleteOne({ id: `income:${incomeId}` });
  }

  static async askFinancialAssistant(
    userId: number,
    question: string,
    history: { role: "user" | "assistant"; content: string }[] = [],
  ) {
    const { pineconeIndex: idx, embeddings: emb, model: llm } = getClients();

    // Tools close over `userId` — the LLM never controls it — and each tool's
    // description tells the model when to call it (e.g. getRecentTransactions
    // for "latest/most recent" questions, getCategoryTotal for exact sums).
    // The model decides which tool(s) to call per-question instead of
    // application code pre-fetching a fixed context window every time.
    const tools = createFinancialAssistantTools(userId, { pineconeIndex: idx, embeddings: emb });

    // Most observed tool-call failures were malformed pythonic-tag generations
    // (`<function=NAME{args}</function>`, missing the `>` after the function
    // name) — a known Llama/Groq quirk that shows up specifically around
    // parallel tool-call generation. Forcing sequential single-tool-calls per
    // turn avoids that code path. `parallel_tool_calls` is a Groq call option,
    // not a constructor field, so it's applied via `.withConfig()`.
    const modelWithConfig = llm.withConfig({ parallel_tool_calls: false });

    const agent = createAgent({
      model: modelWithConfig,
      tools,
      systemPrompt:
        "You are a helpful, general-purpose AI assistant built into a personal expense tracker app. " +
        "You can chat about anything the user asks — general knowledge, advice, writing help, casual " +
        "conversation, whatever they need. " +
        "However, when the user asks about THEIR OWN expenses, income, spending, or balance, you MUST use " +
        "the provided financial tools to get exact numbers — never guess, estimate, or answer a financial " +
        "question from memory, since financial answers must be accurate. If no tool returns relevant " +
        "financial information for a money-related question, say you don't know rather than making " +
        "something up. " +
        "When a question references a specific month, year, or date range, always pass matching startDate " +
        "and endDate arguments to getCategoryTotal or getBalance — do not rely on their default (all-time) " +
        "range when the user asked about a specific period. " +
        "If the user mentions a category or topic you don't recognize, try searchTransactions with their " +
        "wording FIRST before asking them to clarify — only ask for clarification if that search also " +
        "returns nothing relevant.",
    });

    // Cap recursion well below the LangGraph default of 25: a well-behaved
    // answer needs at most 1-2 tool calls plus a final synthesis turn. If the
    // model is stuck looping without converging, fail fast instead of
    // grinding through 25 steps of Groq calls (which is both slow and can
    // exhaust the per-minute token budget on its own). 8 was too tight — it
    // was hit by a legitimate multi-tool-call chain on one benchmark run
    // (see AGENTIC_RAG_PLAYBOOK_STEP4_TUNING.md); 12 gives a bit more room
    // while still failing far faster than the default.
    // Cap history server-side too, regardless of what the client sends — the
    // frontend already trims to the last 10 messages, but this endpoint
    // shouldn't trust that. Bounds token usage/cost for an agent that already
    // makes multiple model calls per question.
    const MAX_HISTORY_MESSAGES = 10;
    const trimmedHistory = history.slice(-MAX_HISTORY_MESSAGES);

    const result = await agent.invoke(
      { messages: [...trimmedHistory, { role: "user", content: question }] },
      { recursionLimit: 12 },
    );

    const lastMessage = result.messages[result.messages.length - 1];
    const content = lastMessage?.content;

    return typeof content === "string" ? content : "I couldn't generate an answer to that question.";
  }
}

export default RagService;
