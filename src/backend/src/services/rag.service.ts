import { ChatGroq } from "@langchain/groq";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import type { Expense } from "@prisma/client";
import { prisma } from "../db.js";

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
    model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama-3.1-8b-instant",
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

  static async askFinancialAssistant(userId: number, question: string) {
    const { pineconeIndex: idx, embeddings: emb, model: llm } = getClients();

    // Always fetch the 5 most recent expenses and incomes directly from the
    // database so the LLM has accurate recency data. Semantic search alone
    // cannot answer "latest / most recent" questions correctly because it
    // ranks by meaning similarity, not by date. `id: "desc"` is a tiebreaker
    // for same-day entries, since MySQL doesn't guarantee ordering among rows
    // with an identical `date` value otherwise.
    const [recentExpenses, recentIncomes] = await Promise.all([
      prisma.expense.findMany({
        where: { userId },
        orderBy: [{ date: "desc" }, { id: "desc" }],
        take: 5,
      }),
      prisma.income.findMany({
        where: { userId },
        orderBy: [{ date: "desc" }, { id: "desc" }],
        take: 5,
      }),
    ]);

    // If the question is explicitly about recency, skip semantic search
    // entirely instead of relying on the LLM to prefer the recent-transactions
    // block over it. Semantic search embeds the literal question text, which
    // shares no meaningful similarity with "recency" as a concept — an older
    // but topically-similar-sounding record can easily outrank the true
    // latest one and get answered from instead.
    const isRecencyQuestion = /\b(latest|most recent|last|newest)\b/i.test(question);

    let results: Awaited<ReturnType<typeof PineconeStore.prototype.similaritySearch>> = [];
    if (!isRecencyQuestion) {
      const vectorStore = await PineconeStore.fromExistingIndex(emb, {
        pineconeIndex: idx,
        textKey: "text",
      });

      // Retrieve top 5 semantically similar records
      results = await vectorStore.similaritySearch(question, 5, {
        userId: { $eq: userId },
      });
    }

    const recentExpenseText = recentExpenses.map(
      (e) =>
        `On ${e.date.toISOString().split("T")[0]}, I spent $${e.amount} on ${e.category}. Payment method: ${e.paymentMethod}.${e.description ? ` Description: ${e.description}.` : ""}`,
    );

    const recentIncomeText = recentIncomes.map(
      (i) =>
        `On ${i.date.toISOString().split("T")[0]}, I earned $${i.amount} from ${i.category}. Payment method: ${i.paymentMethod}.${i.description ? ` Description: ${i.description}.` : ""}`,
    );

    const semanticContext = results.map((r) => r.pageContent).join("\n");
    const recentContext = [...recentExpenseText, ...recentIncomeText].join("\n");

    if (!semanticContext && !recentContext) {
      return "I couldn't find any relevant expenses or incomes to answer your question.";
    }

    // The "Most Recent Transactions" block is placed last, immediately before
    // the question, since LLMs tend to weight text nearer the end of the
    // prompt more heavily — this reinforces the instruction below instead of
    // competing against it.
    const context = `Additional Relevant Records:
${semanticContext}

Most Recent Transactions (sorted by date, newest first):
${recentContext}`;

    const prompt = PromptTemplate.fromTemplate(`
      You are a helpful financial assistant analyzing a user's income and expense tracker data.
      Answer the user's question using ONLY the provided context. If the answer is not in the context, say you don't know.
      When the user asks about their "latest", "most recent", or "last" expense or income, you MUST use the "Most Recent Transactions" section, which is sorted newest-first — ignore any other section for those questions.

      Context (User's Expenses and Incomes):
      {context}

      Question: {question}
      Answer:
    `);

    const chain = prompt.pipe(llm).pipe(new StringOutputParser());

    return await chain.invoke({ context, question });
  }
}

export default RagService;
