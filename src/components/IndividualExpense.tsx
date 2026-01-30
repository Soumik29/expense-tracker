import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPen,
  faTrash,
  faRepeat,
  faCreditCard,
  faMoneyBill,
  faMobileScreen,
} from "@fortawesome/free-solid-svg-icons";
import { type Expense } from "../types.ts";

// Define the props for a single expense card
type IndividualExpenseProps = {
  expense: Expense;
  onDeleteExpense: (id: number) => void;
  onEditExpense: (expense: Expense) => void;
};

// A new component to render each card individually
// This component manages its own "expanded" state for the description
const IndividualExpense = ({
  expense,
  onDeleteExpense,
  onEditExpense,
}: IndividualExpenseProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongDescription = expense.description.length > 100;

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "CREDIT_CARD":
      case "DEBIT_CARD":
        return faCreditCard;
      case "UPI":
        return faMobileScreen;
      case "CASH":
      default:
        return faMoneyBill;
    }
  };

  const formatPaymentMethod = (method: string) => {
    return method
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div
      key={expense.id}
      className="relative bg-gray-800/10 shadow-lg p-5 transition-all duration-300 hover:border-blue-500 hover:shadow-blue-500/20"
    >
      <div className="flex justify-between items-start gap-4">
        {/* Left Side: Category, Description */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-3">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md">
              {expense.category}
            </span>
            <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
              <FontAwesomeIcon icon={getPaymentIcon(expense.paymentMethod)} />
              {formatPaymentMethod(expense.paymentMethod)}
            </span>
            {expense.isRecurring && (
              <span className="bg-purple-900/50 text-purple-300 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 border border-purple-500/30">
                <FontAwesomeIcon icon={faRepeat} />
                Recurring
              </span>
            )}
          </div>
          <div className="mb-2">
            <span className="text-3xl font-bold text-green-400">
              ${Number(expense.amount).toFixed(2)}
            </span>
          </div>

          <p
            className={`text-gray-300 text-md transition-all duration-300 ${
              !isExpanded && "line-clamp-2"
            }`}
          >
            {expense.description}
          </p>

          {isLongDescription && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-400 hover:text-blue-300 text-sm font-semibold mt-2"
            >
              {isExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {/* Right Side: Actions & Date */}
        <div className="flex flex-col items-end justify-between h-full">
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => onEditExpense(expense)}
              className="p-2 w-10 h-10 rounded-full bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <FontAwesomeIcon icon={faPen} />
            </button>
            <button
              onClick={() => onDeleteExpense(expense.id)}
              className="p-2 w-10 h-10 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-colors"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </div>
      </div>
      {/* Footer: Date */}
      {/* <div className="mt-4 pt-4 border-t border-gray-700 text-right text-sm text-gray-400">
          <span>{new Date(expense.date).toLocaleDateString()}</span>
        </div> */}
    </div>
  );
};

export default IndividualExpense;
