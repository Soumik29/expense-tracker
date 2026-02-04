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
