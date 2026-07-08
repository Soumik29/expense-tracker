import { useState } from "react";
import type { IncomeCategory, PaymentMethod, newIncome } from "../types";
import { MAX_DESCRIPTION_LENGTH } from "../types";

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amt = Number(amount);
  const isValid =
    amount.trim() !== "" &&
    !Number.isNaN(amt) &&
    amt > 0 &&
    date !== "" &&
    desc.length <= MAX_DESCRIPTION_LENGTH;

  const handleSubmit = async (e: React.FormEvent<Element>) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    const incomeData: newIncome = {
      amount: parseFloat(amount),
      date,
      description: desc.trim(),
      category,
      isRecurring,
      paymentMethod,
    };

    setIsSubmitting(true);
    setErrorMessage(null);
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
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to add income. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
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
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="income-desc"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Description
              </label>
              <span
                className={`text-xs ${
                  desc.length >= MAX_DESCRIPTION_LENGTH
                    ? "text-red-500"
                    : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                {desc.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
            <textarea
              id="income-desc"
              maxLength={MAX_DESCRIPTION_LENGTH}
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
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-6 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Adding..." : "Add Income"}
          </button>
        </form>
        {errorMessage && (
          <div
            className="flex items-center gap-3 mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl"
            role="alert"
          >
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddIncomeForm;

