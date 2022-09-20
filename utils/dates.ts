// get all dates of the current week from Mo to Su
export const getWeekDates = () => {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
  return [...Array(7)].map((_, i) => {
    const newDate = new Date(date.setDate(diff + i));
    return newDate.toISOString().slice(0, 10);
  });
};
