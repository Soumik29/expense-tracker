import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
import { prisma } from "./db.js";
import RagService from "./services/rag.service.js";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function seedVectors() {
  console.log("Fetching all expenses and incomes from MySQL...");

  try {
    // Fetch every expense and income in the database
    const expenses = await prisma.expense.findMany();
    // Use a lightweight Income-like type here to avoid tight coupling to Prisma types
    type IncomeRecord = {
      id: number;
      amount: unknown;
      date: Date;
      category: string;
      description: string | null;
      userId: number;
      paymentMethod: string;
    };
    const incomes = await (prisma as unknown as {
      income: { findMany: () => Promise<IncomeRecord[]> };
    }).income.findMany();

    console.log(
      `Found ${expenses.length} expenses and ${incomes.length} incomes. Starting index process...`,
    );

    let expenseSuccessCount = 0;
    let expenseErrorCount = 0;

    for (const expense of expenses) {
      try {
        await RagService.indexExpense(expense);
        expenseSuccessCount++;
        process.stdout.write(
          `\rSuccessfully indexed expenses: ${expenseSuccessCount}/${expenses.length}`,
        );
        await delay(4500);
      } catch (err) {
        console.error(`\nFailed to index expense ID ${expense.id}:`, err);
        expenseErrorCount++;
      }
    }

    let incomeSuccessCount = 0;
    let incomeErrorCount = 0;

    for (const income of incomes) {
      try {
        await RagService.indexIncome(income);
        incomeSuccessCount++;
        process.stdout.write(
          `\rSuccessfully indexed incomes: ${incomeSuccessCount}/${incomes.length}`,
        );
        await delay(4500);
      } catch (err) {
        console.error(`\nFailed to index income ID ${income.id}:`, err);
        incomeErrorCount++;
      }
    }

    console.log("\n\n✅ Vector indexing complete!");
    console.log(
      `Expenses Indexed: ${expenseSuccessCount}, Errors: ${expenseErrorCount}`,
    );
    console.log(
      `Incomes Indexed: ${incomeSuccessCount}, Errors: ${incomeErrorCount}`,
    );
  } catch (error) {
    console.error("Fatal error during vector seeding:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

seedVectors();