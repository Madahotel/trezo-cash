export const getTodayInTimezone = (offset = 0) => {
  // Crée la date en UTC
  const now = new Date();
  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth();
  const utcDate = now.getUTCDate();

  // Décalage en heures
  const todayInTimezone = new Date(Date.UTC(utcYear, utcMonth, utcDate, offset, 0, 0, 0));
  return todayInTimezone;
};

export default getTodayInTimezone;
