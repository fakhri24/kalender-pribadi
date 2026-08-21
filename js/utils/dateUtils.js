/**
 * Date and Time utilities for Calendar & Scheduling
 */

export const DAY_NAMES_ID = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
export const DAY_NAMES_SHORT_ID = ['Ahd', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Convert HH:mm string to minutes from midnight (0..1439)
 * @param {string} timeStr - e.g. "07:40"
 * @returns {number}
 */
export function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Convert minutes from midnight to HH:mm string
 * @param {number} minutes - e.g. 460 -> "07:40"
 * @returns {string}
 */
export function minutesToTime(minutes) {
  const normalized = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Format Date to YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string to Date object (local timezone)
 * @param {string} dateStr
 * @returns {Date}
 */
export function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Get Monday of the week for given date
 * @param {Date|string} date
 * @returns {Date}
 */
export function getStartOfWeek(date) {
  const d = typeof date === 'string' ? parseDate(date) : new Date(date);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday
  // In our system, week starts on Monday (day 1). If Sunday (0), diff is -6
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

/**
 * Get Sunday (end of the week) for given date
 * @param {Date|string} date
 * @returns {Date}
 */
export function getEndOfWeek(date) {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

/**
 * Get 7 days array of the week starting from Monday
 * @param {Date|string} date
 * @returns {Array<{date: Date, dateStr: string, dayOfWeek: number, dayName: string}>}
 */
export function getWeekDays(date) {
  const start = getStartOfWeek(date);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = formatDate(d);
    const dayOfWeek = d.getDay(); // 0 is Sunday, 1 is Monday...
    days.push({
      date: d,
      dateStr,
      dayOfWeek,
      dayName: DAY_NAMES_ID[dayOfWeek],
      dayShort: DAY_NAMES_SHORT_ID[dayOfWeek],
      dayNumber: d.getDate(),
      monthNumber: d.getMonth() + 1
    });
  }
  return days;
}

/**
 * Generate ISO Week ID (e.g. "2026-W34")
 * @param {Date|string} date
 * @returns {string}
 */
export function getWeekId(date) {
  const d = typeof date === 'string' ? parseDate(date) : new Date(date);
  d.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Format date in Indonesian readable format
 * @param {Date|string} date
 * @param {boolean} includeDayName
 * @returns {string}
 */
export function formatIndonesianDate(date, includeDayName = true) {
  const d = typeof date === 'string' ? parseDate(date) : new Date(date);
  const dayName = DAY_NAMES_ID[d.getDay()];
  const day = d.getDate();
  const month = MONTH_NAMES_ID[d.getMonth()];
  const year = d.getFullYear();
  if (includeDayName) {
    return `${dayName}, ${day} ${month} ${year}`;
  }
  return `${day} ${month} ${year}`;
}

/**
 * Add days to a date
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Check if two dates are the same calendar day
 * @param {Date|string} d1
 * @param {Date|string} d2
 * @returns {boolean}
 */
export function isSameDay(d1, d2) {
  const date1 = typeof d1 === 'string' ? d1 : formatDate(d1);
  const date2 = typeof d2 === 'string' ? d2 : formatDate(d2);
  return date1 === date2;
}
