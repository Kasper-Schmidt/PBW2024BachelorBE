import { fetchTaskTimeEntries } from "../services/clickup.service";

// Funktion til at hente starten og slutningen af den nuværende uge
export const getCurrentWeek = () => {
  const currentDate = new Date();
  const currentDay = currentDate.getDay();

  // Beregn offset for mandag (1) og juster for søndag (7)
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const sundayOffset = currentDay === 0 ? 0 : 7 - currentDay;

  // Sætter starten af ugen til mandag
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() + mondayOffset);

  // Sæt slutningen af ugen til søndag
  const endOfWeek = new Date(currentDate);
  endOfWeek.setDate(currentDate.getDate() + sundayOffset);

  // Formater datoen til 'YYYY-MM-DD'
  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  return {
    startOfWeek: formatDate(startOfWeek),
    endOfWeek: formatDate(endOfWeek),
  };
};

// Funktion til at udtrække tid brugt på en opgave fra tidsregistreringsdata
export const extractTrackedTimeInfo = (timeEntry: any) => {
  if (!timeEntry || !timeEntry.intervals || timeEntry.intervals.length === 0)
    return null;

  // Calculate total time spent in hours and minutes
  const totalMinutes = Math.floor(timeEntry.time / 60000); // Convert ms to minutes
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Use `date_added` from the first interval as the logged date
  const dateLogged = new Date(parseInt(timeEntry.intervals[0].date_added));

  // Convert the date to ISO format
  const isoDate = dateLogged.toISOString();

  return {
    taskHours: hours,
    taskMinutes: minutes,
    formattedDate: isoDate, // Return the ISO format date instead of formatted string
    dateLogged: timeEntry.intervals[0].date_added, // Original date_added (timestamp)
    loggedBy: timeEntry.user.email,
    taskTitle: timeEntry.title,
  };
};
export const formatDateForAccess = (
  date: string | Date
): { isoDate: string; isoTime: string } => {
  const d = new Date(date);

  // Ensure the date is valid
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }

  // Format the date as #YYYY-MM-DD#
  const isoDate = `#${d.getFullYear()}-${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}#`;

  // Format the time as #HH:MM:SS#
  const isoTime = `#${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}#`;

  return { isoDate, isoTime };
};

// Henter tiden for en specifik opgave
export const getTaskTimeEntries = async (taskID: string) => {
  try {
    const data = await fetchTaskTimeEntries(taskID);
    return data.data || [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

module.exports = {
  getCurrentWeek,
  extractTrackedTimeInfo,
  formatDateForAccess,
  getTaskTimeEntries,
};
