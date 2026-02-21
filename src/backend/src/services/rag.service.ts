import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { StringOutputParser } from "@langchain/core/output_parsers";
import type { Expense } from "@prisma/client";
import { Document } from "@langchain/core/documents";
import { PromptTemplate } from "@langchain/core/prompts";

const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text",
});

const model = new ChatOllama({ model: "llama3", temperature: 0.2 });

const getVectorStore = async () => {
  return new Chroma(embeddings, { collectionName: "user_expenses" });
};

class RagService {
  static async indexExpense(expense: Expense) {
    const vectorStore = await getVectorStore();

    const semanticText = `On ${expense.date.toISOString().split("T")[0]}, I spent $${expense.amount} on ${expense.category}. Payment method: ${expense.paymentMethod}. ${expense.description ? `Description: ${expense.description}.` : ""} ${expense.isRecurring ? "This is a recurring expense." : ""}`;
    const doc = new Document({
      pageContent: semanticText,
      metadata: {
        expenseId: expense.id,
        userId: expense.userId,
      },
      id: expense.id.toString(),
    });
    await vectorStore.addDocuments([doc], { ids: [expense.id.toString()] });
  }

  static async deleteIndexedExpense(expenseId: number) {
    const vectorStore = await getVectorStore();
    await vectorStore.delete({ ids: [expenseId.toString()] });
  }

  static async askFinancialAssistant(userId: number, question: string) {
    const vectorStore = await getVectorStore();

    const results = await vectorStore.similaritySearch(question, 5, {
      userId: userId,
    });

    if (results.length === 0) {
      return "I couldn't find any relevant expenses to answer your question.";
    }

    const context = results.map((r) => r.pageContent).join("\n");

    const prompt = PromptTemplate.fromTemplate(`
      You are a helpful financial assistant analyzing a user's expense tracker data. 
      Answer the user's question using ONLY the provided context. If the answer is not in the context, say you don't know.
      
      Context (User's Expenses):
      {context}
      
      Question: {question}
      Answer:
    `);

    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    return await chain.invoke({context, question});
  }
}

export default RagService;
