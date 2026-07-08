import { useState } from "react";
import type { newExpense, Category, PaymentMethod } from "../types";
import { MAX_DESCRIPTION_LENGTH } from "../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateRight, faCamera } from "@fortawesome/free-solid-svg-icons";
import ReceiptScanner from "./ReceiptScanner";

type expenseProps = {
  onAddExpense: (expense: newExpense) => Promise<{ success: boolean } | void>;
};

const AddExpenseForm = ({ onAddExpense }: expenseProps) => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState<Category>("Food");
  const [showToast, setShowToast] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  const [showScanner, setShowScanner] = useState(false);

  const amt = Number(amount);
  const isValid =
    amount.trim() !== "" &&
    !Number.isNaN(amt) &&
    amt > 0 &&
    date !== "" &&
    desc.length <= MAX_DESCRIPTION_LENGTH;

  const handleScanComplete = (scannedAmount: number) => {
    setAmount(scannedAmount.toString());
    setShowScanner(false);
    if (!desc) setDesc("Scanned Receipt");
  };

  const handleSubmit = async (e: React.FormEvent<Element>) => {
    e.preventDefault();
    if (!isValid || isSubmitting) {
      return;
    }
    const expenseData = {
      amount: parseFloat(amount),
      date: date,
      description: desc.trim(),
      category: category,
      isRecurring: isRecurring,
      paymentMethod: paymentMethod,
    };
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      // Only clear the form and show success once the server confirms —
      // previously the toast fired even when the request failed.
      await onAddExpense(expenseData);
      setAmount("");
      setDate(new Date().toISOString().slice(0, 10));
      setDesc("");
      setCategory("Food");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1500);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to add expense. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = (e: React.FormEvent<Element>) => {
    e.preventDefault();
    setAmount("");
    setDate(new Date().toISOString().slice(0, 10));
    setDesc("");
    setCategory("Food");
    setPaymentMethod("CASH");
    setIsRecurring(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-8 transition-colors duration-200">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-8 tracking-tight">
          Add New Expense
        </h2>

        <button
          type="button"
          onClick={() => setShowScanner(!showScanner)}
          className={`p-2 rounded-lg transition-colors ${
            showScanner
              ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
          }`}
          title="Scan Receipt"
        >
          <FontAwesomeIcon icon={faCamera} />
        </button>

        {showScanner && (
          <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <ReceiptScanner onScanComplete={handleScanComplete} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/**Category Data */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Category
            </label>
            <select
              id="category"
              name="Expense Category"
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition-all"
              value={category}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setCategory(e.target.value as Category)
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
          {/**Amount Data */}
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Amount
            </label>
            <input
              type="number"
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition-all"
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
          {/**Description Data*/}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="desc"
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
              id="desc"
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition-all resize-none"
              name="Expense Description"
              rows={3}
              maxLength={MAX_DESCRIPTION_LENGTH}
              value={desc}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDesc(e.target.value)
              }
              required
              placeholder="e.g., Coffee with friends"
            ></textarea>
          </div>
          {/**Date */}
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Date
            </label>
            <input
              type="date"
              id="date"
              name="Expense Date"
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition-all"
              value={date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDate(e.target.value)
              }
              required
            />
          </div>
          {/**Payment Method */}
          <div>
            <label
              htmlFor="paymentMethod"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Payment Method
            </label>
            <select
              id="paymentMethod"
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
          {/**Recurring Checkbox */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isRecurring"
              name="Expense Date"
              className="w-5 h-5 rounded border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:ring-2 cursor-pointer"
              checked={isRecurring}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setIsRecurring(e.target.checked)
              }
            />
            <label
              htmlFor="isRecurring"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              Recurring Expense{" "}
              <span className="text-zinc-400 dark:text-zinc-500 font-normal">
                (auto-repeats monthly)
              </span>
            </label>
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium py-3 px-6 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:ring-offset-2 dark:focus:ring-offset-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding..." : "Add Expense"}
            </button>
            <button
              className="px-6 py-3 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:ring-offset-2 dark:focus:ring-offset-zinc-800"
              onClick={handleReset}
            >
              <FontAwesomeIcon icon={faRotateRight} />
            </button>
          </div>
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
        {showToast && (
          <div
            className="flex items-center gap-3 mt-6 p-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl"
            role="alert"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-sm font-medium">
              Expense Added Successfully
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddExpenseForm;
