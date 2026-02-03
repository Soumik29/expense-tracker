import type { Expense, newExpense } from "../types";
import { useEffect, useState } from "react";

// FIX 1: Update URL to include '/api' (matching your auth routes)
const API_URL = "http://localhost:3000/api/expenses";

const useCrud = () => {
  const [expense, setExpense] = useState<Expense[]>([]);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await fetch(API_URL, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch expense");
        
        const jsonResponse = await response.json();
        
        // Ensure we are getting an array. If backend sends { data: [...] } vs { data: { expenses: [...] } }
        // Adjust this line if your GET endpoint also nests data, but usually it's direct in data for lists.
        const expenseData = Array.isArray(jsonResponse.data) ? jsonResponse.data : []; 
        
        const expensesWithDates = expenseData.map((exp: any) => ({
          ...exp,
          date: new Date(exp.date), // Convert string date to Date object
        }));

        setExpense(expensesWithDates);
      } catch (error) {
        console.error("Error fetching expenses: ", error);
      }
    };
    fetchExpenses();
  }, []);

  const addExpense = async (newExpenseData: newExpense) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newExpenseData),
      });

      if (!res.ok) {
        if (res.status === 400) throw new Error("Validation error occurred");
        const errorText = await res.text();
        throw new Error(`Failed to add expense (${res.status}): ${errorText}`);
      }

      const jsonResponse = await res.json();

      // FIX 3: Unwrap the nested expense object
      // Backend Controller sends: Send.success(res, { expense: createExpense })
      // So we must access: jsonResponse.data.expense
      const createdExpense = jsonResponse.data?.expense || jsonResponse.data;

      if (!createdExpense) {
        throw new Error("Server response missing expense data");
      }

      const newExpenseWithFormattedDate = {
        ...createdExpense,
        date: new Date(createdExpense.date),
      };

      setExpense((prev) => [...prev, newExpenseWithFormattedDate]);
      return { success: true };
    } catch (error) {
      console.error("Failed to add expense:", error);
      throw error;
    }
  };

  const deleteExpense = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 204 || res.status === 200) {
        setExpense((prev) => prev.filter((expense) => expense.id !== id));
      } else {
        const err = await res.text();
        throw new Error(`Failed to delete data! ${res.status}: ${err}`);
      }
    } catch (err) {
      console.log("Something went wrong. Failed to Fetch!", err);
    }
  };

  const updateExpenses = async (expenseToUpdate: Expense) => {
    try {
      const response = await fetch(`${API_URL}/${expenseToUpdate.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(expenseToUpdate),
      });
      if (!response.ok)
        throw new Error(`Failed to update expense. ${response.status}`);

      const jsonResponse = await response.json();

      // FIX 4: Handle wrapper for updates too
      const updatedData = jsonResponse.data?.expense || jsonResponse.data;

      const expenseWithDate = {
        ...updatedData,
        date: new Date(updatedData.date),
      };

      setExpense((prev) =>
        prev.map((expenditure) =>
          expenditure.id === updatedData.id ? expenseWithDate : expenditure,
        ),
      );
    } catch (err) {
      console.log("Failed to fetch expenses: ", err);
    }
  };

  return { expense, addExpense, deleteExpense, updateExpenses };
};

export default useCrud;
