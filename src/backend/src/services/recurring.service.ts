import { prisma } from "../db.js";
import RagService from "./rag.service.js";

// How often the scheduler re-checks for due recurring transactions. It also
// runs once at server startup, so a server that was off for weeks catches up
// immediately.
const CHECK_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours

// Hard cap on occurrences generated per template per run — bounds the work if
// a template is years in the past.
const MAX_OCCURRENCES_PER_RUN = 24;

// Add one month, clamping the day so e.g. Jan 31 -> Feb 28 -> (stays 28) Mar 28.
// Uses UTC parts since transaction dates are stored as date-only instants.
export const addOneMonthClamped = (date: Date): Date => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const lastDayOfNextMonth = new Date(Date.UTC(year, month + 2, 0)).getUTCDate();
  return new Date(
    Date.UTC(year, month + 1, Math.min(day, lastDayOfNextMonth)),
  );
};

type TransactionKind = "expense" | "income";

class RecurringService {
  private static timer: NodeJS.Timeout | null = null;

  static startScheduler() {
    if (this.timer) return;
    // Run once at startup (fire and forget), then on the interval.
    void this.processAll();
    this.timer = setInterval(() => void this.processAll(), CHECK_INTERVAL_MS);
    // Don't keep the process alive just for the scheduler.
    this.timer.unref();
  }

  static async processAll() {
    try {
      const [expenses, incomes] = await Promise.all([
        this.processKind("expense"),
        this.processKind("income"),
      ]);
      if (expenses + incomes > 0) {
        console.log(
          `[recurring] Generated ${expenses} expense(s) and ${incomes} income(s)`,
        );
      }
    } catch (error) {
      console.error("[recurring] Failed to process recurring transactions:", error);
    }
  }

  // For every template (a transaction with isRecurring=true), generate one
  // occurrence per elapsed month since the template's date (or since the last
  // generated occurrence). Occurrences are plain transactions with
  // isRecurring=false; lastRecurredAt on the template tracks progress, so
  // deleting a generated occurrence never causes it to be re-created.
  private static async processKind(kind: TransactionKind): Promise<number> {
    // prisma.expense and prisma.income share the shape this service needs.
    const delegate = (kind === "expense" ? prisma.expense : prisma.income) as
      typeof prisma.expense;

    const templates = await delegate.findMany({
      where: { isRecurring: true },
    });

    const now = new Date();
    let created = 0;

    for (const template of templates) {
      try {
        let anchor = template.lastRecurredAt ?? template.date;

        for (let i = 0; i < MAX_OCCURRENCES_PER_RUN; i++) {
          const next = addOneMonthClamped(anchor);
          if (next > now) break;

          const occurrence = await delegate.create({
            data: {
              amount: template.amount,
              date: next,
              category: template.category,
              description: template.description,
              userId: template.userId,
              isRecurring: false,
              paymentMethod: template.paymentMethod,
            },
          });
          await delegate.update({
            where: { id: template.id },
            data: { lastRecurredAt: next },
          });

          try {
            if (kind === "expense") {
              await RagService.indexExpense(occurrence);
            } else {
              await RagService.indexIncome(occurrence);
            }
          } catch (aiError) {
            console.error(
              `[recurring] Failed to index generated ${kind} for AI:`,
              aiError,
            );
          }

          anchor = next;
          created++;
        }
      } catch (error) {
        // One broken template must not stop the rest.
        console.error(
          `[recurring] Failed processing ${kind} template #${template.id}:`,
          error,
        );
      }
    }

    return created;
  }
}

export default RecurringService;
