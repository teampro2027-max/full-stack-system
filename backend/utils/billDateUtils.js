const toDateOrFallback = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
};

const resolveBillDates = ({ dueDate, notificationDate, startDate, now = new Date(), existingDueDate }) => {
  const resolvedStartDate = toDateOrFallback(startDate, now);
  const resolvedNotificationDate = toDateOrFallback(notificationDate, null);
  const fallbackDueDate = existingDueDate ?? resolvedNotificationDate ?? resolvedStartDate;
  const resolvedDueDate = toDateOrFallback(dueDate, fallbackDueDate);

  return {
    startDate: resolvedStartDate,
    dueDate: resolvedDueDate,
    notificationDate: resolvedNotificationDate,
  };
};

module.exports = { resolveBillDates };
