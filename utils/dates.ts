import getISODay from "date-fns/getISODay";
import sub from "date-fns/sub";
import add from "date-fns/add";

// get all dates of the current week from Mo to Su
export const getWeekDates = () => {
  const isoWeekday = getISODay(new Date());
  const monday = sub(new Date(), { days: isoWeekday - 1 });

  return Array.from(
    { length: 7 },
    (_, i) => add(monday, { days: i }).toISOString().split("T")[0]
  );
};
