export type Expense = {
    id: number;
    category: "Groceries" | "Food" | "Mobile_Bill" | "Travel" | "Shopping" | "Games" | "Subscription" | "EMI" ;
    amount: number;
    description: string;
    date: string;
    isRecurring: boolean;
    paymentMethod: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "UPI";
}

export type newExpense = Omit<Expense, "id">;