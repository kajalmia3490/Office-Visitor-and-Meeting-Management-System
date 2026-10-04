const MS_PER_MINUTE = 60 * 1000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

export function startOfDayUTC(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function endOfDayUTC(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

export function addMinutes(date, minutes) {
  return new Date(new Date(date).getTime() + minutes * MS_PER_MINUTE);
}

export function addHours(date, hours) {
  return addMinutes(date, hours * 60);
}

export function addDays(date, days) {
  return new Date(new Date(date).getTime() + days * MS_PER_DAY);
}

export function todayRange(now = new Date()) {
  return { from: startOfDayUTC(now), to: endOfDayUTC(now) };
}

/**
 * Resolves an inclusive date range from optional `from`/`to` values.
 * Defaults to the last `defaultDays` days ending now.
 */
export function resolveDateRange({ from, to } = {}, defaultDays = 30) {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : startOfDayUTC(addDays(end, -(defaultDays - 1)));
  return { from: start, to: end };
}

export function minutesBetween(start, end) {
  return Math.max(0, Math.round((new Date(end) - new Date(start)) / MS_PER_MINUTE));
}

export function daysInRange(from, to) {
  return Math.max(1, Math.ceil((startOfDayUTC(to) - startOfDayUTC(from)) / MS_PER_DAY) + 1);
}

export function formatDateKey(date) {
  return new Date(date).toISOString().slice(0, 10).replace(/-/g, "");
}
