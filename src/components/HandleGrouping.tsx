import type { groupingMode } from "../utils/useAccordion";
interface handleGroupingProps {
  groupMode: "day" | "week" | "month";
  handleGrouping: (group: groupingMode) => void;
}

const HandleGrouping = (props: handleGroupingProps) => {
  const { groupMode, handleGrouping } = props;
  return (
    <div className="flex gap-2 p-1 bg-neutral-100 rounded-xl w-fit">
      <button
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
          groupMode === "day"
            ? "bg-white text-neutral-900 shadow-sm"
            : "text-neutral-500 hover:text-neutral-900"
        }`}
        onClick={() => handleGrouping("day")}
      >
        Day
      </button>
      <button
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
          groupMode === "week"
            ? "bg-white text-neutral-900 shadow-sm"
            : "text-neutral-500 hover:text-neutral-900"
        }`}
        onClick={() => handleGrouping("week")}
      >
        Week
      </button>
      <button
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
          groupMode === "month"
            ? "bg-white text-neutral-900 shadow-sm"
            : "text-neutral-500 hover:text-neutral-900"
        }`}
        onClick={() => handleGrouping("month")}
      >
        Month
      </button>
    </div>
  );
};

export default HandleGrouping;
