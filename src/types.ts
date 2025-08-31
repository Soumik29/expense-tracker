export type Expense = {
    id: number;
    category: "Groceries" | "Food" | "Mobile Bill" | "Travel" | "Shopping" | "Games" | "Subscription" | "EMI" ;
    amount: number;
    description: string;
    date: Date;
}