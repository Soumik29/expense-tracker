import { prisma } from "./db.js";
import RagService from "./services/rag.service.js";

async function seedVectors() {
  console.log("Fetching all expenses from MySQL...");
  
  try {
    // Fetch every expense in the database
    const expenses = await prisma.expense.findMany();
    console.log(`Found ${expenses.length} expenses. Starting index process...`);

    let successCount = 0;
    let errorCount = 0;

    // Loop through and index each one
    for (const expense of expenses) {
      try {
        await RagService.indexExpense(expense);
        successCount++;
        process.stdout.write(`\rSuccessfully indexed: ${successCount}/${expenses.length}`);
      } catch (err) {
        console.error(`\nFailed to index expense ID ${expense.id}:`, err);
        errorCount++;
      }
    }

    console.log("\n\n✅ Vector indexing complete!");
    console.log(`Total Indexed: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
  } catch (error) {
    console.error("Fatal error during vector seeding:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

seedVectors();