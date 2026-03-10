import { useState } from "react";
import type { IncomeCategory, PaymentMethod, newIncome } from "../types";

type IncomeFormProps = {
  onAddIncome: (income: newIncome) => Promise<{ success: boolean } | void>;
};

const AddIncomeForm = ({ onAddIncome }: IncomeFormProps) => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState<IncomeCategory>("Salary");
  const [isRecurring, setIsRecurring] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  const amt = Number(amount);
  const isValid = amount.trim() !== "" && !Number.isNaN(amt) && date !== "";

  const handleSubmit = async (e: React.FormEvent<Element>) => {
    e.preventDefault();
    if (!isValid) return;

    const incomeData: newIncome = {
      amount: parseFloat(amount),
      date,
      description: desc,
      category,
      isRecurring,
      paymentMethod,
    };

    try {
      await onAddIncome(incomeData);
      setAmount("");
      setDate(new Date().toISOString().slice(0, 10));
      setDesc("");
      setCategory("Salary");
      setPaymentMethod("CASH");
      setIsRecurring(false);
    } catch (err) {
      console.error("Failed to submit income:", err);
      // Optional: surface a toast or inline error here if you’d like
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-8 transition-colors duration-200">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6 tracking-tight">
          Add New Income
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="income-category"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Category
            </label>
            <select
              id="income-category"
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition-all"
              value={category}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setCategory(e.target.value as IncomeCategory)
              }
            >
              <option value="Salary">Salary</option>
              <option value="Freelance">Freelance</option>
              <option value="Investment">Investment</option>
              <option value="Gift">Gift</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="income-amount"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Amount
            </label>
            <input
              type="number"
              id="income-amount"
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition-all"
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
              htmlFor="income-desc"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Description
            </label>
            <textarea
              id="income-desc"
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition-all resize-none"
              rows={3}
              value={desc}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDesc(e.target.value)
              }
              required
              placeholder="e.g., Monthly salary"
            />
          </div>

          <div>
            <label
              htmlFor="income-date"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Date
            </label>
            <input
              type="date"
              id="income-date"
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition-all"
              value={date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDate(e.target.value)
              }
              required
            />
          </div>

          <div>
            <label
              htmlFor="income-paymentMethod"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Payment Method
            </label>
            <select
              id="income-paymentMethod"
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition-all"
              value={paymentMethod}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setPaymentMethod(e.target.value as PaymentMethod)
              }
            >
              <option value="CASH">Cash</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="DEBIT_CARD">Debit Card</option>
              <option value="UPI">UPI</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="income-isRecurring"
              className="w-5 h-5 rounded border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:ring-2 cursor-pointer"
              checked={isRecurring}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setIsRecurring(e.target.checked)
              }
            />
            <label
              htmlFor="income-isRecurring"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              Recurring Income
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-6 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
          >
            Add Income
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddIncomeForm;

