import { useState, useEffect } from "react";
import useDateRange, {
  type DatePreset,
  type DateRangeValue,
} from "../utils/useDateRange";
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
}

const DateRangeFilter = ({
  startDate,
  endDate,
  onDateChange,
}: DateRangeFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [localRange, setLocalRange] = useState<DateRangeValue>({
    start: startDate,
    end: endDate,
    preset: "all",
  });

  const {
    datePresets,
    quickPresets,
    applyPreset,
    applyCustomRange,
    getRangeLabel,
    detectPreset,
  } = useDateRange({ onRangeChange: onDateChange });

  // Sync with external props
  useEffect(() => {
    const preset = detectPreset(startDate, endDate);
    setLocalRange({ start: startDate, end: endDate, preset });
    setShowCustom(preset === "custom");
  }, [startDate, endDate, detectPreset]);

  const handlePresetClick = (presetId: DatePreset) => {
    const newRange = applyPreset(presetId);
    setLocalRange(newRange);
    setShowCustom(false);
    if (presetId !== "custom") {
      setIsOpen(false);
    }
  };

  const handleCustomClick = () => {
    setShowCustom(true);
    setLocalRange((prev) => ({ ...prev, preset: "custom" }));
  };

  const handleCustomDateChange = (start: string, end: string) => {
    const newRange = applyCustomRange(start, end);
    setLocalRange(newRange);
  };

  const handleClear = () => {
    const newRange = applyPreset("all");
    setLocalRange(newRange);
    setShowCustom(false);
    setIsOpen(false);
  };

  const hasActiveFilter = startDate !== "" || endDate !== "";

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
          hasActiveFilter
            ? "bg-zinc-900 text-white"
            : "bg-zinc-50 text-zinc-700 border border-zinc-200 hover:bg-zinc-100"
        }`}
      >
        <CalendarDaysIcon className="w-4 h-4" />
        <span className="max-w-[150px] truncate">
          {getRangeLabel(localRange)}
        </span>
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute top-full left-0 mt-2 z-20 bg-white rounded-2xl border border-zinc-200 shadow-lg p-4 min-w-[320px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-900">
                Select Date Range
              </h3>
              {hasActiveFilter && (
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900"
                >
                  <XMarkIcon className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>

            {/* Quick Presets */}
            <div className="mb-4">
              <p className="text-xs text-zinc-500 mb-2">Quick Select</p>
              <div className="flex flex-wrap gap-2">
                {quickPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetClick(preset.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      localRange.preset === preset.id
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* All Presets */}
            <div className="mb-4">
              <p className="text-xs text-zinc-500 mb-2">All Presets</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePresetClick("all")}
                  className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                    localRange.preset === "all"
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  All Time
                </button>
                {datePresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetClick(preset.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                      localRange.preset === preset.id
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Range Toggle */}
            <div className="border-t border-zinc-200 pt-4">
              <button
                onClick={handleCustomClick}
                className={`w-full px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                  showCustom || localRange.preset === "custom"
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                📅 Custom Date Range
              </button>

              {/* Custom Date Inputs */}
              {showCustom && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={localRange.start}
                      onChange={(e) =>
                        handleCustomDateChange(e.target.value, localRange.end)
                      }
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={localRange.end}
                      onChange={(e) =>
                        handleCustomDateChange(localRange.start, e.target.value)
                      }
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Apply Button for Custom */}
            {showCustom && (
              <div className="mt-4 pt-4 border-t border-zinc-200">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors"
                >
                  Apply Range
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DateRangeFilter;
