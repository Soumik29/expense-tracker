import ExpenseCard from "./ExpenseCard";
import TotalExpense from "./TotalExpense";
import AddExpenseForm from "./AddExpenseForm";
import ModalFormExpense from "./ModalFormExpense";
// import Chart from "chart.js/auto";
import useCrud from "../utils/useCrud";
import useAccordion from "../utils/useAccordion";
import useModal from "../utils/useModal";
import HandleGrouping from "./HandleGrouping";
import ExpenseChart from "./ExpenseChart";
import { useAuth } from "../utils/useAuth";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";

const ExpenseTracker = () => {
  const { user, logout } = useAuth();
  const { expense, addExpense, deleteExpense, updateExpenses } = useCrud();
  const {
    activeIndex,
    groupMode,
    handleGrouping,
    handleExpandItem,
    expensesToTotal,
    groupedExpenses,
  } = useAccordion(expense);
  const { onEditExpense, isOpen, editExpense, setIsOpen } = useModal();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header/Navbar */}
      <header className="bg-white border-b border-neutral-200 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
              Expense Tracker
            </h1>
          </div>

          <div className="flex items-center gap-6">
            {user && (
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-neutral-900">
                    {user.username}
                  </p>
                  <p className="text-xs text-neutral-500">{user.email}</p>
                </div>
                <div className="w-10 h-10 bg-neutral-900 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 text-neutral-600 rounded-xl transition-all duration-200 cursor-pointer"
                  title="Logout"
                >
                  <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-medium">
                    Logout
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <AddExpenseForm onAddExpense={addExpense} />
          <div className="space-y-6">
            <HandleGrouping
              groupMode={groupMode}
              handleGrouping={handleGrouping}
            />
            <div className="overflow-y-auto max-h-[500px]">
              <ExpenseCard
                expenseList={groupedExpenses}
                onDeleteExpense={deleteExpense}
                onEditExpense={onEditExpense}
                expandItem={handleExpandItem}
                expenseActive={activeIndex}
              />
            </div>
            {expense.length !== 0 ? (
              <TotalExpense totalExp={expensesToTotal} />
            ) : null}
          </div>
          {editExpense ? (
            <ModalFormExpense
              open={isOpen}
              close={setIsOpen}
              exp={editExpense}
              onUpdateExpense={updateExpenses}
            />
          ) : null}
          <ExpenseChart expense={expense} />
        </div>
      </main>
    </div>
  );
};

export default ExpenseTracker;
