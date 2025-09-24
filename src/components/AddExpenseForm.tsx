import { useState } from "react";
import type {newExpense } from "../types";
export type ExpenseCategory =
  | "Food"
  | "Groceries"
  | "Mobile_Bill"
  | "Travel"
  | "Shopping"
  | "Games"
  | "Subscription"
  | "EMI";

type expenseProps = {
  onAddExpense: (expense: newExpense) => void;
};

const AddExpenseForm = ({ onAddExpense }: expenseProps) => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Food");
  const handleSubmit = (e: React.FormEvent<Element>) => {
    e.preventDefault();
    const amt = Number(amount);
    const isValid = amount.trim() !== "" && !Number.isNaN(amt) && date !== "";
    if (!isValid) return "Can't have empty fields";
    const expenseData = {
      amount: parseFloat(amount),
      date: date,
      description: desc,
      category: category,
    };
    onAddExpense(expenseData);
    setAmount("");
    setDate("");
    setDesc("");
    setCategory("Food");
  };

  return (
    <div className="h-full w-full max-w-md mx-auto p-6 bg-gray-900 rounded-2xl shadow-xl border border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">
        Add New Expense
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-400 mb-2"
          >
            Category
          </label>
          <select
            id="category"
            name="Expense Category"
            className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={category}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setCategory(e.target.value as ExpenseCategory)
            }
          >
            <option value="Food">Food</option>
            <option value="Groceries">Groceries</option>
            <option value="Mobile_Bill">Mobile Bill</option>
            <option value="Travel">Travel</option>
            <option value="Shopping">Shopping</option>
            <option value="Games">Games</option>
            <option value="Subscription">Subscription</option>
            <option value="EMI">EMI</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-400 mb-2"
          >
            Amount
          </label>
          <input
            type="number"
            className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="amount"
            name="Expense Amount"
            step="0.01"
            value={amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setAmount(e.target.value)
            }
            required
            placeholder="0.00"
          />
        </div>
        <div>
          <label
            htmlFor="desc"
            className="block text-sm font-medium text-gray-400 mb-2"
          >
            Description
          </label>
          <textarea
            id="desc"
            className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            name="Expense Description"
            rows={4}
            value={desc}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setDesc(e.target.value)
            }
            required
            placeholder="e.g., Coffee with friends"
          ></textarea>
        </div>
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-400 mb-2"
          >
            Date
          </label>
          <input
            type="date"
            id="date"
            name="Expense Date"
            className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDate(e.target.value)
            }
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Add Expense
        </button>
      </form>
    </div>
  );
};

export default AddExpenseForm;
