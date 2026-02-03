import { useState } from "react";
import type { newExpense } from "../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateRight } from "@fortawesome/free-solid-svg-icons";
export type ExpenseCategory =
  | "Food"
  | "Groceries"
  | "Mobile_Bill"
  | "Travel"
  | "Shopping"
  | "Games"
  | "Subscription"
  | "EMI";

export type PaymentMethod = "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "UPI";

type expenseProps = {
  onAddExpense: (expense: newExpense) => void;
};

const AddExpenseForm = ({ onAddExpense }: expenseProps) => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Food");
  const [showToast, setShowToast] = useState<boolean>(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const amt = Number(amount);
  const isValid = amount.trim() !== "" && !Number.isNaN(amt) && date !== "";
  // console.log(isValid);
  const handleSubmit = (e: React.FormEvent<Element>) => {
    e.preventDefault();
    if (!isValid) {
      return;
    }
    const expenseData = {
      amount: parseFloat(amount),
      date: date,
      description: desc,
      category: category,
      isRecurring: isRecurring,
      paymentMethod: paymentMethod
    };
    onAddExpense(expenseData);
    setAmount("");
    setDate(new Date().toISOString().slice(0, 10));
    setDesc("");
    setCategory("Food");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);
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
    <div className="h-full w-full max-w-md mx-auto p-6 bg-gray-900 rounded-2xl shadow-xl border border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">
        Add New Expense
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/**Category Data */}
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
        {/**Amount Data */}
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
        {/**Description Data*/}
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
        {/**Date */}
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
        {/**Payment Method */}
        <div>
          <label
            htmlFor="paymentMethod"
            className="block text-sm font-medium text-gray-400 mb-2"
          >
            Payment Method
          </label>
          <select
            id="paymentMethod"
            className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={paymentMethod}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setPaymentMethod(e.target.value as PaymentMethod)
            }
          >
            <option value="CASH">CASH</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="DEBIT_CARD">Debit Card</option>
            <option value="UPI">UPI</option>
          </select>
        </div>
        {/**Recurring Checkbox */}
        <div className="flex items-center">
          <label
            htmlFor="isRecurring"
            className="ml-2 text-sm font-medium text-gray-400"
          >
            Recurring Expense
          </label>
          <input
            type="checkbox"
            id="isRecurring"
            name="Expense Date"
            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500 focus:ring-2"
            checked={isRecurring}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setIsRecurring(e.target.checked)
            }
          />
        </div>
        <div className="flex ">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 mx-5"
          >
            Add Expense
          </button>
          <button
            className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            onClick={handleReset}
          >
            Reset <FontAwesomeIcon icon={faRotateRight} />{" "}
          </button>
        </div>
      </form>
      {showToast && (
        <div
          id="toast-default"
          className="flex items-center w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow-sm dark:text-gray-400 dark:bg-gray-800 mt-5"
          role="alert"
        >
          <div className="inline-flex items-center justify-center shrink-0 w-8 h-8 text-blue-500 bg-blue-100 rounded-lg dark:bg-blue-800 dark:text-blue-200">
            <svg
              className="w-4 h-4"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 18 20"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                strokeWidth="2"
                d="M15.147 15.085a7.159 7.159 0 0 1-6.189 3.307A6.713 6.713 0 0 1 3.1 15.444c-2.679-4.513.287-8.737.888-9.548A4.373 4.373 0 0 0 5 1.608c1.287.953 6.445 3.218 5.537 10.5 1.5-1.122 2.706-3.01 2.853-6.14 1.433 1.049 3.993 5.395 1.757 9.117Z"
              />
            </svg>
          </div>
          <div className="ms-3 text-sm font-normal">
            Expense Added Successfully
          </div>
          <button
            type="button"
            className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
            data-dismiss-target="#toast-default"
            aria-label="Close"
          >
            <span className="sr-only">Close</span>
            <svg
              className="w-3 h-3"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 14 14"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                strokeWidth="2"
                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default AddExpenseForm;
