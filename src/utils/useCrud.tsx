import type { Expense } from "../types";
import { useEffect, useState } from "react";
// import useSaveExpense from "./useSaveExpense";

const API_URL = "http://localhost:3000/expenses";

const useCrud = () => {
  // const getSavedExpense = useSaveExpense();
  const [expense, setExpense] = useState<Expense[]>([]);
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Failed to fetch expense");
        const data = await response.json();
        setExpense(data);
      } catch (error) {
        console.log("Error fetching expenses: ", error);
      }
    };
    fetchExpenses();
  }, []);
  const addExpense = (expense: Expense) => {
    const addNewExpense = async () => {
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(expense),
        });
        if (!res.ok)
          throw new Error(
            `Something went wrong. Please try again! ${res.status}`
          );
        const data = await res.json();
        setExpense((prev) => [...prev, data]);
      } catch (error) {
        console.log("Failed to POST the new expense: ", error);
      }
    };
    addNewExpense();
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
  return { expense, addExpense, deleteExpense, updateExpenses };
};

export default useCrud;
