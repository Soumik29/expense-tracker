export type Expense = {
    id: number;
    category: "Groceries" | "Food" | "Mobile_Bill" | "Travel" | "Shopping" | "Games" | "Subscription" | "EMI" ;
    amount: number;
    description: string;
    date: Date;
}

export type newExpense = Omit<Expense, "id">;