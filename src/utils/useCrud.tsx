import type { Expense } from "../types";
import { useState } from "react";
import useSaveExpense from "./useSaveExpense";

const useCrud = () => {
    const getSavedExpense = useSaveExpense();
    const [expense, setExpense] = useState<Expense[]>(getSavedExpense);
    const addExpense = (expense: Expense) => {
        setExpense((prev) => [...prev, expense]);
      };
      
      const deleteExpense = (id: number) => {
        setExpense((prev) => prev.filter((expense) => expense.id !== id));
      };
    
      const updateExpenses = (expense: Expense) => {
        setExpense((prev) =>
          prev.map((expenditure) =>
            expenditure.id === expense.id ? expense : expenditure
          )
        );
      };
      return {expense, addExpense, deleteExpense, updateExpenses};
}

export default useCrud;