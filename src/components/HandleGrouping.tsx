import type { groupingMode } from "../utils/useAccordion";
interface handleGroupingProps {
  groupMode: "day" | "week" | "month";
  handleGrouping: (group: groupingMode) => void;
}

const HandleGrouping = (props: handleGroupingProps) => {
  const { groupMode, handleGrouping } = props;
  return (
    <div>
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
    </div>
  );
};

export default HandleGrouping;
