import type { Expense } from "../types";

//This component will be responsible for calculating the total expenses incurred
const TotalExpense = ({ totalExp }: { totalExp: Expense[] }) => {
  const total =
    totalExp?.reduce((sum, exp) => sum + parseFloat(String(exp.amount)), 0) ??
    0;
  return (
    <div className="bg-neutral-900 rounded-xl px-6 py-5 flex items-center justify-between">
      <span className="text-neutral-400 font-medium">Total Expenses</span>
      <span className="text-2xl font-semibold text-white">
        ${total.toFixed(2)}
      </span>
    </div>
  );
};

export default TotalExpense;
