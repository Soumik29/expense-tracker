import { ChatGroq } from "@langchain/groq";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
// import { Document } from "@langchain/core/documents";
import type { Expense } from "@prisma/client";

// 1. Initialize Cloud Clients
const pinecone = new PineconeClient({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Target the custom index you created on the Pinecone website
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);

// Use Google's free embedding model (outputs 768 dimensions)
const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001"
  // @ts-expect-ignore - We use this flag just in case your local LangChain TypeScript definitions haven't caught up to this new feature yet 
});

// Use Groq's lightning-fast Llama 3 hosting
const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY!,
  model: "llama3-8b-8192",
  temperature: 0.2,
});

class RagService {
  /**
   * Converts an expense into a semantic string and saves it to Pinecone.
   */
  static async indexExpense(expense: Expense) {
    const semanticText = `On ${expense.date.toISOString().split('T')[0]}, I spent $${expense.amount} on ${expense.category}. Payment method: ${expense.paymentMethod}. ${expense.description ? `Description: ${expense.description}.` : ''}`;

    const vectorValues = await embeddings.embedQuery(semanticText);
    if (!vectorValues || vectorValues.length === 0){
      throw new Error(`Google Gemini blocked or failed to generate an embedding.`);
    }

    await pineconeIndex.upsert({
      records: [{id: expense.id.toString(),
      values: vectorValues,
      metadata: {
        expenseId: expense.id,
        userId: expense.userId,
        text: semanticText
      }}]
    })
  }

  /**
   * Removes an expense from Pinecone if a user deletes it.
   */
  static async deleteIndexedExpense(expenseId: number) {
    await pineconeIndex.deleteOne({id: expenseId.toString()});
  }

  /**
   * Retrieves relevant expenses from Pinecone and asks Groq the user's question.
   */
  static async askFinancialAssistant(userId: number, question: string) {
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex });
    
    // Retrieve top 5 expenses, strictly filtering by userId for security
    const results = await vectorStore.similaritySearch(question, 5, { userId: userId });
    
    if (results.length === 0) {
      return "I couldn't find any relevant expenses to answer your question.";
    }

    const context = results.map(r => r.pageContent).join('\n');

    const prompt = PromptTemplate.fromTemplate(`
      You are a helpful financial assistant analyzing a user's expense tracker data. 
      Answer the user's question using ONLY the provided context. If the answer is not in the context, say you don't know.
      
      Context (User's Expenses):
      {context}
      
      Question: {question}
      Answer:
    `);

    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
    // Wait for the full answer from Groq
    return await chain.invoke({ context, question });
  }
}

export default RagService;