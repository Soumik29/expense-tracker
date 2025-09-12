import ExpenseCard from "./ExpenseCard";
import TotalExpense from "./TotalExpense";
import AddExpenseForm from "./AddExpenseForm";
import ModalFormExpense from "./ModalFormExpense";
import useCrud from "./utils/useCrud";
import useAccordion from "./utils/useAccordion";
import useModal from "./utils/useModal";

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
  const {onEditExpense, isOpen, editExpense, setIsOpen} = useModal();

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
          onClick={() => handleGrouping("day")}
        >
          Day
        </button>
        <button
          className={
            groupMode === "week"
              ? "bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
              : "bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600"
          }
          onClick={() => handleGrouping("week")}
        >
          Week
        </button>
        <button
          className={
            groupMode === "month"
              ? "bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
              : "bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600"
          }
          onClick={() => handleGrouping("month")}
        >
          Month
        </button>
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
