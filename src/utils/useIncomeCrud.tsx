import { useEffect, useState } from "react";
import type { Income, newIncome } from "../types";
import { incomeService } from "../services/income.service";

const useIncomeCrud = () => {
  const [income, setIncome] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIncomes = async () => {
      try {
        setLoading(true);
        const incomes = await incomeService.getAll();
        setIncome(
          incomes.map((inc) => ({
            ...inc,
            date:
              typeof inc.date === "string"
                ? inc.date
                : new Date(inc.date).toISOString(),
          })),
        );
      } catch (err: unknown) {
        console.error("Error fetching incomes: ", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch incomes",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchIncomes();
  }, []);

  const addIncome = async (newIncomeData: newIncome) => {
    try {
      const createdIncome = await incomeService.create(newIncomeData);
      const incomeWithFormattedDate: Income = {
        ...createdIncome,
        date:
          typeof createdIncome.date === "string"
            ? createdIncome.date
            : new Date(createdIncome.date).toISOString(),
      };
      setIncome((prev) => [...prev, incomeWithFormattedDate]);
      return { success: true };
    } catch (err: unknown) {
      console.error("Failed to add income:", err);
      throw err;
    }
  };

  const deleteIncome = async (id: number) => {
    try {
      await incomeService.delete(id);
      setIncome((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Something went wrong. Failed to delete income!", err);
    }
  };

  const updateIncome = async (incomeToUpdate: Income) => {
    try {
      const updatedIncome = await incomeService.update(incomeToUpdate);
      const incomeWithDate: Income = {
        ...updatedIncome,
        date:
          typeof updatedIncome.date === "string"
            ? updatedIncome.date
            : new Date(updatedIncome.date).toISOString(),
      };

      setIncome((prev) =>
        prev.map((item) => (item.id === updatedIncome.id ? incomeWithDate : item)),
      );
    } catch (err) {
      console.error("Failed to update income: ", err);
    }
  };

  return { income, addIncome, deleteIncome, updateIncome, loading, error };
};

export default useIncomeCrud;

