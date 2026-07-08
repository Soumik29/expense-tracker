// Keep in sync with the backend zod schema (transaction.schema.ts) and the
// @db.VarChar(500) columns in schema.prisma.
export const MAX_DESCRIPTION_LENGTH = 500;

// Category and PaymentMethod types matching Prisma schema
export type Category =
  | "Food"
  | "Groceries"
  | "Mobile_Bill"
  | "Travel"
  | "Shopping"
  | "Games"
  | "Subscription"
  | "EMI";
export type PaymentMethod = "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "UPI";

export type IncomeCategory =
  | "Salary"
  | "Freelance"
  | "Investment"
  | "Gift"
  | "Other";

export type Expense = {
  id: number;
  category: Category;
  amount: number;
  description: string;
  date: string;
  isRecurring: boolean;
  paymentMethod: PaymentMethod;
  userId?: number;
};

export type newExpense = Omit<Expense, "id">;

export type Income = {
  id: number;
  category: IncomeCategory;
  amount: number;
  description: string;
  date: string;
  isRecurring: boolean;
  paymentMethod: PaymentMethod;
  userId?: number;
};

export type newIncome = Omit<Income, "id">;

// Monthly spending limit for one expense category (one per category per user)
export type Budget = {
  id: number;
  category: Category;
  amount: number;
  userId?: number;
};

export const EXPENSE_CATEGORIES: Category[] = [
  "Food",
  "Groceries",
  "Mobile_Bill",
  "Travel",
  "Shopping",
  "Games",
  "Subscription",
  "EMI",
];
