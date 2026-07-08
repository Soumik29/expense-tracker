import { useEffect, useState } from "react";
import type { Budget, Category } from "../types";
import { budgetService } from "../services/budget.service";

const useBudgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        setLoading(true);
        setBudgets(await budgetService.getAll());
      } catch (err: unknown) {
        console.error("Error fetching budgets: ", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch budgets",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchBudgets();
  }, []);

  const saveBudget = async (category: Category, amount: number) => {
    const saved = await budgetService.save(category, amount);
    setBudgets((prev) => {
      const exists = prev.some((b) => b.category === category);
      return exists
        ? prev.map((b) => (b.category === category ? saved : b))
        : [...prev, saved];
    });
  };

  const removeBudget = async (category: Category) => {
    await budgetService.remove(category);
    setBudgets((prev) => prev.filter((b) => b.category !== category));
  };

  return { budgets, saveBudget, removeBudget, loading, error };
};

export default useBudgets;
