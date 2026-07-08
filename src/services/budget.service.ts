import api from "./api";
import type { Budget, Category } from "../types";

interface BudgetResponse {
  budget: Budget;
}

// Prisma Decimal serializes to a string in JSON — normalize to number
const normalize = (budget: Budget): Budget => ({
  ...budget,
  amount: Number(budget.amount),
});

export const budgetService = {
  async getAll(): Promise<Budget[]> {
    const response = await api.get<Budget[]>("/budgets");
    const budgets = Array.isArray(response.data) ? response.data : [];
    return budgets.map(normalize);
  },

  // One budget per category — the server upserts
  async save(category: Category, amount: number): Promise<Budget> {
    const response = await api.post<BudgetResponse>("/budgets", {
      category,
      amount,
    });
    const saved = response.data?.budget;
    if (!saved) {
      throw new Error("Server response missing budget data");
    }
    return normalize(saved);
  },

  async remove(category: Category): Promise<void> {
    await api.delete(`/budgets/${category}`);
  },
};

export default budgetService;
