import { useState, useEffect } from "react";
import { type Expense } from "./types";
import ExpenseCard from "./ExpenseCard";
import TotalExpense from "./TotalExpense";
import AddExpenseForm from "./AddExpenseForm";
import ModalFormExpense from "./ModalFormExpense";
// import Chart from "chart.js/auto";

type groupingMode = "day" | "week" | "month";

const ExpenseTracker = () => {
  const savedExpense = localStorage.getItem("expenses");
  const groupedExpenses: { [key: string]: Expense[] } = {};

  const getDayKey = (date: Date) => {
    return date.toISOString().slice(0, 10);
  };
  const getMonthKey = (date: Date) => {
    return date.toISOString().slice(0, 7);
  };
  const getWeekKey = (date: Date) => {
    const year = date.getFullYear();
    // Create a copy of the date to avoid modifying the original
    const d = new Date(Date.UTC(year, date.getMonth(), date.getDate()));
    // Set to the nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Get first day of year
    const yearStart = new Date(Date.UTC(year, 0, 1));
    // Calculate full weeks to nearest Thursday
    const weekNo = Math.ceil(
      ((d.valueOf() - yearStart.valueOf()) / 86400000 + 1) / 7
    );
    // Return array of year and week number
    return `${year}-W${weekNo}`;
  };

  const returnSavedExpense = () => {
    if (savedExpense) {
      return JSON.parse(savedExpense).map((expenditure: Expense) => ({
        ...expenditure,
        date: new Date(expenditure.date),
      }));
    } else {
      return [];
    }
  };
  const [expense, setExpense] = useState<Expense[]>(returnSavedExpense);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [groupMode, setGroupMode] = useState<groupingMode>("day");
  const [activeIndex, setActiveIndex] = useState<string>(""); //This is the date in a string format
  //index in this case is the date of the expense
  const handleExpandItem = (index: string) => {
    setActiveIndex(activeIndex === index ? "" : index);
  };
  let expenseDate = "";
  expense.map((exp) => {
    if (groupMode === "day") {
      expenseDate = getDayKey(exp.date);
    } else if (groupMode === "week") {
      expenseDate = getWeekKey(exp.date);
    } else if (groupMode === "month") {
      expenseDate = getMonthKey(exp.date);
    }
    if (expenseDate in groupedExpenses) {
      groupedExpenses[expenseDate].push(exp);
    } else {
      groupedExpenses[expenseDate] = [exp];
    }
  });
  const addExpense = (expense: Expense) => {
    setExpense((prev) => [...prev, expense]);
  };
  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expense));
    setActiveIndex("");
  }, [expense]);
  useEffect(() => {
    setActiveIndex("");
  }, [groupMode]);
  const deleteExpense = (id: number) => {
    setExpense((prev) => prev.filter((expense) => expense.id !== id));
  };

  const updateExpenses = (expense: Expense) => {
    setExpense((prev) =>
      prev.map((expenditure) =>
        expenditure.id === expense.id ? expense : expenditure
      )
    );
  };
  const expensesToTotal = activeIndex ? groupedExpenses[activeIndex] : expense;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 items-stretch">
      <AddExpenseForm onAddExpense={addExpense} />
      <div className="h-full w-full max-w-xl mx-auto space-y-4">
        <button
          className={
            groupMode === "day"
              ? "bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
              : "bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600"
          }
          onClick={() => setGroupMode("day")}
        >
          Day
        </button>
        <button
          className={
            groupMode === "week"
              ? "bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
              : "bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600"
          }
          onClick={() => setGroupMode("week")}
        >
          Week
        </button>
        <button
          className={
            groupMode === "month"
              ? "bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
              : "bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600"
          }
          onClick={() => setGroupMode("month")}
        >
          Month
        </button>
        <div className="overflow-y-auto max-h-115">
          <ExpenseCard
            expenseList={groupedExpenses}
            onDeleteExpense={deleteExpense}
            onEditExpense={(expense) => {
              setEditExpense(expense);
              setIsOpen(true);
            }}
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
    </div>
  );
};
//testing github actions to run checks on this push.

export default ExpenseTracker;
