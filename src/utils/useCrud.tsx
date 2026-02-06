import type { Expense, newExpense } from "../types";
import { useEffect, useState } from "react";
import { expenseService } from "../services/expense.service";

const useCrud = () => {
  const [expense, setExpense] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        const expenses = await expenseService.getAll();
        // Ensure dates are ISO strings as expected by Expense type
        setExpense(
          expenses.map((exp) => ({
            ...exp,
            date:
              typeof exp.date === "string"
                ? exp.date
                : new Date(exp.date).toISOString(),
          })),
        );
      } catch (err: unknown) {
        console.error("Error fetching expenses: ", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch expenses",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, []);

  const addExpense = async (newExpenseData: newExpense) => {
    try {
      const createdExpense = await expenseService.create(newExpenseData);
      const newExpenseWithFormattedDate: Expense = {
        ...createdExpense,
        date:
          typeof createdExpense.date === "string"
            ? createdExpense.date
            : new Date(createdExpense.date).toISOString(),
      };
      setExpense((prev) => [...prev, newExpenseWithFormattedDate]);
      return { success: true };
    } catch (err: unknown) {
      console.error("Failed to add expense:", err);
      throw err;
    }
  };

  const deleteExpense = async (id: number) => {
    try {
      await expenseService.delete(id);
      setExpense((prev) => prev.filter((expense) => expense.id !== id));
    } catch (err) {
      console.log("Something went wrong. Failed to delete!", err);
    }
  };

  const updateExpenses = async (expenseToUpdate: Expense) => {
    try {
      const updatedExpense = await expenseService.update(expenseToUpdate);
      const expenseWithDate: Expense = {
        ...updatedExpense,
        date:
          typeof updatedExpense.date === "string"
            ? updatedExpense.date
            : new Date(updatedExpense.date).toISOString(),
      };

      setExpense((prev) =>
        prev.map((expenditure) =>
          expenditure.id === updatedExpense.id ? expenseWithDate : expenditure,
        ),
      );
    } catch (err) {
      console.log("Failed to update expense: ", err);
    }
  };

  return { expense, addExpense, deleteExpense, updateExpenses, loading, error };
};

export default useCrud;
