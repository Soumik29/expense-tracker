import { useState, useEffect } from "react";
import type { Expense } from "../types";
import useDate from "./useDate";
type groupingMode = "day" | "week" | "month";

const useAccordion = (expense: Expense[]) => {
  const { getDayKey, getMonthKey, getWeekKey } = useDate();
  const [activeIndex, setActiveIndex] = useState<string>("");
  const [groupMode, setGroupMode] = useState<groupingMode>("day");
  const groupedExpenses: { [key: string]: Expense[] } = {};

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
  const expensesToTotal = activeIndex ? groupedExpenses[activeIndex] : expense;
  //index is the date string
  const handleExpandItem = (index: string) => {
    setActiveIndex(activeIndex === index ? "" : index);
  };
  const handleGrouping = (group: groupingMode) => {
    setGroupMode(group);
  };
  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expense));
    setActiveIndex("");
  }, [expense]);
  useEffect(() => {
    setActiveIndex("");
  }, [groupMode]);
  return {
    activeIndex,
    groupMode,
    handleGrouping,
    expenseDate,
    handleExpandItem,
    expensesToTotal,
    groupedExpenses,
  };
};
export default useAccordion;
