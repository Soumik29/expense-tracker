import api from "./api";
import type { Expense, newExpense } from "../types";

interface ExpenseResponse {
  expense: Expense;
}

export const expenseService = {
  async getAll(): Promise<Expense[]> {
    const response = await api.get<Expense[]>("/expenses");
    const expenses = Array.isArray(response.data) ? response.data : [];

    // Convert date strings to Date objects
    return expenses.map((exp) => ({
      ...exp,
      date: new Date(exp.date).toISOString(),
    }));
  },

  async create(expense: newExpense): Promise<Expense> {
    const response = await api.post<ExpenseResponse>("/expenses", expense);
    const created = response.data?.expense || response.data;

    if (!created) {
      throw new Error("Server response missing expense data");
    }

    return {
      ...created,
      date: new Date((created as Expense).date).toISOString(),
    } as Expense;
  },

  async update(expense: Expense): Promise<Expense> {
    const response = await api.put<ExpenseResponse>(
      `/expenses/${expense.id}`,
      expense,
    );
    const updated = response.data?.expense || response.data;

    return {
      ...updated,
      date: new Date((updated as Expense).date).toISOString(),
    } as Expense;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },
};

export default expenseService;
