import { z } from "zod";

// Keep in sync with the DB column (@db.VarChar(500) in schema.prisma) and the
// frontend MAX_DESCRIPTION_LENGTH in src/types.ts.
export const MAX_DESCRIPTION_LENGTH = 500;

// Matches DECIMAL(10, 2) in the database: 8 integer digits + 2 fraction digits.
export const MAX_AMOUNT = 99_999_999.99;

const amountSchema = z.coerce
  .number({ message: "Amount must be a number" })
  .positive("Amount must be greater than 0")
  .max(MAX_AMOUNT, `Amount cannot exceed ${MAX_AMOUNT}`)
  .refine((n) => Number.isFinite(n), "Amount must be a finite number")
  // DECIMAL(10,2) silently rounds anyway; do it explicitly so the value the
  // client gets back matches what was stored.
  .transform((n) => Math.round(n * 100) / 100);

const dateSchema = z.coerce
  .date({ message: "Date must be a valid date" })
  .refine(
    (d) => d.getFullYear() >= 1900 && d.getFullYear() <= 2200,
    "Date must be between years 1900 and 2200",
  );

const descriptionSchema = z
  .string({ message: "Description must be text" })
  .trim()
  .max(
    MAX_DESCRIPTION_LENGTH,
    `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`,
  )
  .optional()
  .default("");

const paymentMethodSchema = z
  .enum(["CASH", "CREDIT_CARD", "DEBIT_CARD", "UPI"], {
    message: "Invalid payment method",
  })
  .optional()
  .default("CASH");

const isRecurringSchema = z
  .boolean({ message: "isRecurring must be true or false" })
  .optional()
  .default(false);

const expenseCategorySchema = z.enum(
  [
    "Food",
    "Groceries",
    "Mobile_Bill",
    "Travel",
    "Shopping",
    "Games",
    "Subscription",
    "EMI",
  ],
  { message: "Invalid expense category" },
);

const incomeCategorySchema = z.enum(
  ["Salary", "Freelance", "Investment", "Gift", "Other"],
  { message: "Invalid income category" },
);

const expense = z.object({
  amount: amountSchema,
  date: dateSchema,
  category: expenseCategorySchema,
  description: descriptionSchema,
  isRecurring: isRecurringSchema,
  paymentMethod: paymentMethodSchema,
});

const income = z.object({
  amount: amountSchema,
  date: dateSchema,
  category: incomeCategorySchema,
  description: descriptionSchema,
  isRecurring: isRecurringSchema,
  paymentMethod: paymentMethodSchema,
});

export type ExpenseInput = z.infer<typeof expense>;
export type IncomeInput = z.infer<typeof income>;

const transactionSchema = {
  expense,
  income,
};

export default transactionSchema;
