const useDate = () => {
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
  return { getDayKey, getMonthKey, getWeekKey };
};

export default useDate;
