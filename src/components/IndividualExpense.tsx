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
      className="bg-white px-5 py-5 transition-all duration-200 hover:bg-neutral-50"
    >
      <div className="flex justify-between items-start gap-6">
        {/* Left Side: Category, Description */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="bg-neutral-900 text-white px-3 py-1 rounded-lg text-xs font-medium">
              {expense.category}
            </span>
            <span className="bg-neutral-100 text-neutral-600 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5">
              <FontAwesomeIcon
                icon={getPaymentIcon(expense.paymentMethod)}
                className="text-neutral-400"
              />
              {formatPaymentMethod(expense.paymentMethod)}
            </span>
            {expense.isRecurring && (
              <span className="bg-neutral-100 text-neutral-600 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5">
                <FontAwesomeIcon icon={faRepeat} className="text-neutral-400" />
                Recurring
              </span>
            )}
          </div>

          <div className="mb-2">
            <span className="text-2xl font-semibold text-neutral-900">
              ${Number(expense.amount).toFixed(2)}
            </span>
          </div>

          <p
            className={`text-neutral-600 text-sm leading-relaxed ${
              !isExpanded && "line-clamp-2"
            }`}
          >
            {expense.description}
          </p>

          {isLongDescription && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-neutral-900 hover:text-neutral-600 text-xs font-medium mt-2 underline underline-offset-2"
            >
              {isExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditExpense(expense)}
            className="p-2.5 w-10 h-10 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <FontAwesomeIcon icon={faPen} className="text-sm" />
          </button>
          <button
            onClick={() => onDeleteExpense(expense.id)}
            className="p-2.5 w-10 h-10 rounded-xl bg-neutral-100 hover:bg-neutral-900 text-neutral-600 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faTrash} className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IndividualExpense;
