export function getCurrentEpoch({ startOf, endOf } = {}) {
  const now = new Date(); // Get current Date object

  if (startOf) {
    if (startOf === "day") now.setHours(0, 0, 0, 0);
    else if (startOf === "hour") now.setMinutes(0, 0, 0);
    else if (startOf === "minute") now.setSeconds(0, 0);
    else if (startOf === "month") now.setDate(1), now.setHours(0, 0, 0, 0);
    else if (startOf === "year") now.setMonth(0, 1), now.setHours(0, 0, 0, 0);
  }

  if (endOf) {
    if (endOf === "day") now.setHours(23, 59, 59, 999);
    else if (endOf === "hour") now.setMinutes(59, 59, 999);
    else if (endOf === "minute") now.setSeconds(59, 999);
    else if (endOf === "month") now.setMonth(now.getMonth() + 1, 0), now.setHours(23, 59, 59, 999);
    else if (endOf === "year") now.setMonth(11, 31), now.setHours(23, 59, 59, 999);
  }

  return Math.floor(now.getTime() / 1000); // Convert to Unix timestamp (seconds)
}