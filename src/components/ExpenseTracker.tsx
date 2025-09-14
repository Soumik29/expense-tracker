import ExpenseCard from "./ExpenseCard";
import TotalExpense from "./TotalExpense";
import AddExpenseForm from "./AddExpenseForm";
import ModalFormExpense from "./ModalFormExpense";
// import Chart from "chart.js/auto";
import useCrud from "../utils/useCrud";
import useAccordion from "../utils/useAccordion";
import useModal from "../utils/useModal";
import HandleGrouping from "./HandleGrouping";

const ExpenseTracker = () => {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 items-stretch">
      <AddExpenseForm onAddExpense={addExpense} />
      <div className="h-full w-full max-w-xl mx-auto space-y-4">
        <HandleGrouping groupMode={groupMode} handleGrouping={handleGrouping} />
        <div className="overflow-y-auto max-h-115">
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
    </div>
  );
};

export default ExpenseTracker;
