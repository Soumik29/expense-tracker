import type { Expense, newExpense } from "../types";
import { useEffect, useState } from "react";

const API_URL = "http://localhost:3000/expenses";
// const token = localStorage.getItem("token");

const useCrud = () => {
  const [expense, setExpense] = useState<Expense[]>([]);
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await fetch(API_URL, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch expense");
        const data = await response.json();
        const expensesWithDates = data.map((exp: Expense) => ({
          ...exp,
          date: new Date(exp.date),
        }));
        setExpense(expensesWithDates);
      } catch (error) {
        console.log("Error fetching expenses: ", error);
      }
    };
    fetchExpenses();
  }, []);
  const addExpense = async (expense: newExpense) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(expense),
      });
      console.log(res);
      
      if (!res.ok) {
        // Handle validation errors from the server
        if (res.status === 400) {
          throw new Error('Validation error occurred');
        }
        throw new Error(`Failed to add expense (${res.status})`);
      }
      const responseData = await res.json();

      const newExpenseWithData = {
        ...responseData
      };
      
      setExpense((prev) => [...prev, newExpenseWithData]);
      return { success: true };
    } catch (error) {
      console.error("Failed to add expense:", error);
      throw error; // Re-throw to be handled by the form
    }
  };

  const deleteExpense = async (id: number) => {
    try {
      // const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        // headers: {
        //   Authorization: `Bearer ${token}`,
        // },
        credentials: "include",
      });
      if (res.status == 204) {
        setExpense((prev) => prev.filter((expense) => expense.id !== id));
      } else {
        throw new Error(`Failed to load the data! ${res.status}`);
      }
    } catch (err) {
      console.log("Something went wrong. Failed to Fetch!", err);
    }
  };

  const updateExpenses = async (expense: Expense) => {
    try {
      const response = await fetch(`${API_URL}/${expense.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(expense),
      });
      if (!response.ok)
        throw new Error(`Failed to update expense. ${response.status}`);
      const data = await response.json();
      const expenseWithDate = {
        ...data,
        date: new Date(data.date),
      };
      setExpense((prev) =>
        prev.map((expenditure) =>
          expenditure.id === data.id ? expenseWithDate : expenditure
        )
      );
    } catch (err) {
      console.log("Failed to fetch expenses: ", err);
    }
    // setExpense((prev) =>
    //   prev.map((expenditure) =>
    //     expenditure.id === expense.id ? expense : expenditure
    //   )
    // );
  };
  return { expense, addExpense, deleteExpense, updateExpenses };
};

export default useCrud;
