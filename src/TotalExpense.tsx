import type { Expense } from "./types";

//This component will be responsible for calculating the total expenses incurred
const TotalExpense = ({ totalExp }: { totalExp: Expense[] }) => {
  let total = totalExp.reduce((sum, exp) => sum + exp.amount, 0);
  return (
    <div className="max-w-md flex justify-between bg-white rounded-md p-6 drop-shadow-lg drop-shadow-cyan-500/50 fill-cyan-500">
      <span className="text-red">Total Expenses: </span> ${total}
    </div>
  );
};

export default TotalExpense;
