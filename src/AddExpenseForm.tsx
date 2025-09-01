import { useState } from "react";
import { type Expense } from "./types";
export type ExpenseCategory =
  | "Food"
  | "Groceries"
  | "Mobile Bill"
  | "Travel"
  | "Shopping"
  | "Games"
  | "Subscription"
  | "EMI";

type expenseProps = {
  onAddExpense: (expense: Expense) => void;
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
      date: new Date(`${date}T00:00:00`),
      description: desc,
      category: category,
      id: Date.now(),
    };
    onAddExpense(expenseData);
    setAmount("");
    setDate("");
    setDesc("");
    setCategory("Food");
  };

  return (
    <div className="h-full w-full max-w-md mx-auto p-6 bg-[#FAF7F3] rounded-lg shadow-md outline outline-black/5">
      <h2 className="text-xl font-bold mb-2 text-center">Add Expense</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            Category:{" "}
          </label>
          <select
            id="category"
            name="Expense Category"
            value={category}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setCategory(e.target.value as ExpenseCategory)
            }
          >
            <option value="Groceries">Groceries</option>
            <option value="Food">Food</option>
            <option value="Mobile Bill">Mobile Bill</option>
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
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Amount
          </label>
          <input
            type="number"
            className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="amount"
            name="Expense Amount"
            step="0.01"
            value={amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setAmount(e.target.value)
            }
            required
          />
        </div>
        <div>
          <label
            htmlFor="desc"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="desc"
            className="w-full border border-gray-300 p-2 rounded-md"
            name="Expense Description"
            rows={5}
            cols={33}
            value={desc}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setDesc(e.target.value)
            }
            required
          >
            Here all the expense description will go.
          </textarea>
        </div>
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Date
          </label>
          <input
            type="date"
            id="date"
            name="Expense Date"
            value={date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDate(e.target.value)
            }
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          Add Expense
        </button>
      </form>
    </div>
  );
};

export default AddExpenseForm;
