import { useState, useEffect } from "react";
import { type Expense } from "./types";
import ExpenseCard from "./ExpenseCard";
import TotalExpense from "./TotalExpense";
import AddExpenseForm from "./AddExpenseForm";
import ModalFormExpense from "./ModalFormExpense";
const ExpenseTracker = () => {
  const savedExpense = localStorage.getItem("expenses");
  const groupedExpenses: {[key: string]: Expense[]} = {};
  const getDayKey = (date: Date) => {
    return date.toISOString().slice(0, 10);
  }
  const returnSavedExpense = () => {
    if (savedExpense) {
      return JSON.parse(savedExpense).map((expenditure: Expense) => ({
        ...expenditure, date: new Date(expenditure.date).toISOString().slice(0, 10)
      }))
    } else {
      return [];
    }
  };
  const [expense, setExpense] = useState<Expense[]>(returnSavedExpense);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  expense.map((exp) => {
    const expenseDate = getDayKey(new Date(exp.date));
    if(expenseDate in groupedExpenses){
      groupedExpenses[expenseDate].push(exp);
    }else{
      groupedExpenses[expenseDate] = [exp];
    }
  })
  const addExpense = (expense: Expense) => {
    setExpense((prev) => [...prev, expense]);
  };
  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expense));
  }, [expense]);
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 items-stretch">
      <AddExpenseForm onAddExpense={addExpense} />
      <div className="h-full w-full max-w-xl mx-auto space-y-4">
        <div className="overflow-y-auto max-h-115">
          <ExpenseCard
            expenseList={groupedExpenses}
            onDeleteExpense={deleteExpense}
            onEditExpense={(expense) => {
              setEditExpense(expense);
              setIsOpen(true);
            }}
          />
        </div>
        {expense.length !== 0 ? <TotalExpense totalExp={expense} /> : null}
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

export default ExpenseTracker;
