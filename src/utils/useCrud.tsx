import type { Expense, newExpense } from "../types";
import { useEffect, useState } from "react";

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
          date: new Date(exp.date),
        }));
        
        setExpense(expensesWithDates);
      } catch (error) {
        console.log("Error fetching expenses: ", error);
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
        if (res.status === 400) {
          throw new Error('Validation error occurred');
        }
        throw new Error(`Failed to add expense (${res.status})`);
      }

      const jsonResponse = await res.json();

      // === FIX IS HERE ===
      // Access .data.expense because your controller returns { expense: createExpense }
      const createdExpense = jsonResponse.data.expense; 

      if (!createdExpense) {
        console.error("Unexpected response structure:", jsonResponse);
        return;
      }

      const newExpenseWithFormattedDate = {
        ...createdExpense,
        date: new Date(createdExpense.date)
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
        throw new Error(`Failed to delete data! ${res.status}`);
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
      
      // Check if update returns the same nested structure or just the object
      // Assuming it might be consistent with create:
      const updatedData = jsonResponse.data.expense || jsonResponse.data;

      const expenseWithDate = {
        ...updatedData,
        date: new Date(updatedData.date),
      };

      setExpense((prev) =>
        prev.map((expenditure) =>
          expenditure.id === updatedData.id ? expenseWithDate : expenditure
        )
      );
    } catch (err) {
      console.log("Failed to update expenses: ", err);
    }
  };

  return { expense, addExpense, deleteExpense, updateExpenses };
};

export default useCrud;