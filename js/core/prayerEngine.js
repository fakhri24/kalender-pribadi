/**
 * Prayer Time Calculation Engine (Offline Astronomy Engine)
 * Implements Kemenag RI / SIHAT calculation standard
 */

import { DEFAULT_LOCATION } from '../config/coordinates.js';
import { minutesToTime, timeToMinutes } from '../utils/dateUtils.js';

// Trigonometric helpers with degree inputs/outputs
const d2r = (deg) => (deg * Math.PI) / 180.0;
const r2d = (rad) => (rad * 180.0) / Math.PI;

const sinD = (deg) => Math.sin(d2r(deg));
const cosD = (deg) => Math.cos(d2r(deg));
const tanD = (deg) => Math.tan(d2r(deg));
const asinD = (val) => r2d(Math.asin(Math.max(-1, Math.min(1, val))));
const acosD = (val) => r2d(Math.acos(Math.max(-1, Math.min(1, val))));
const atan2D = (y, x) => r2d(Math.atan2(y, x));

/**
 * Fix angle to [0, 360)
 */
function fixAngle(angle) {
  return ((angle % 360) + 360) % 360;
}

/**
 * Fix hour to [0, 24)
 */
function fixHour(hour) {
  return ((hour % 24) + 24) % 24;
}

/**
 * Calculate Julian Day from Gregorian Date
 */
function getJulianDay(year, month, day) {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

/**
 * Calculate Sun coordinates (Declination and Equation of Time)
 */
function getSunCoordinates(jd, timezone) {
  const D = jd - 2451545.0; // days since J2000.0
  const g = fixAngle(357.529 + 0.98560028 * D); // Sun mean anomaly
  const q = fixAngle(280.459 + 0.98564736 * D); // Sun mean longitude
  const L = fixAngle(q + 1.915 * sinD(g) + 0.020 * sinD(2 * g)); // Sun apparent longitude

  const e = 23.439 - 0.00000036 * D; // Obliquity of ecliptic
  const declination = asinD(sinD(e) * sinD(L)); // Sun declination

  const RA = fixAngle(atan2D(cosD(e) * sinD(L), cosD(L))) / 15.0; // Right Ascension in hours
  const EqT = q / 15.0 - RA; // Equation of time in hours

  return { declination, EqT: fixHour(EqT + 12) - 12 };
}

/**
 * Calculate hour angle for a given solar altitude angle
 */
function getHourAngle(lat, declination, altitude) {
  const cosH = (sinD(altitude) - sinD(lat) * sinD(declination)) / (cosD(lat) * cosD(declination));
  if (cosH > 1) return 0; // Sun never reaches altitude (polar night)
  if (cosH < -1) return 180; // Sun always above altitude (midnight sun)
  return acosD(cosH);
}

/**
 * Calculate 5 Daily Prayer Times + Imsak + Dhuha + Sunrise for a given date and location
 * @param {Date} date
 * @param {Object} [customLocation]
 * @returns {Object} Prayer times with time strings (HH:mm) and minutes from midnight
 */
export function calculatePrayerTimes(date = new Date(), customLocation = {}) {
  const loc = { ...DEFAULT_LOCATION, ...customLocation };
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  const jd = getJulianDay(year, month, day);
  const { declination, EqT } = getSunCoordinates(jd, loc.timezone);

  // Solar Noon (Transit / Dzuhur astronomis)
  const solarNoonHours = 12 + loc.timezone - loc.longitude / 15.0 - EqT;

  // Elevation dip correction in degrees
  const elevationDip = 0.0347 * Math.sqrt(Math.max(0, loc.elevation || 0));

  // Altitudes (in degrees)
  // Subuh: -20° (Kemenag standard)
  const fajrAltitude = -(loc.fajrAngle || 20.0);
  // Sunrise/Sunset: center of sun -0.833° - dip
  const sunriseAltitude = -0.8333 - elevationDip;
  // Dhuha: ~4.5°
  const dhuhaAltitude = 4.5;
  // Ashar: Shadow length = object length + shadow at noon (Shafi'i / Standard)
  const asrAltitude = 90 - r2d(Math.atan(1 + Math.tan(d2r(Math.abs(loc.latitude - declination)))));
  // Isya: -18° (Kemenag standard)
  const ishaAltitude = -(loc.ishaAngle || 18.0);

  // Hour angles (in degrees, convert to hours by dividing by 15)
  const fajrHA = getHourAngle(loc.latitude, declination, fajrAltitude) / 15.0;
  const sunriseHA = getHourAngle(loc.latitude, declination, sunriseAltitude) / 15.0;
  const dhuhaHA = getHourAngle(loc.latitude, declination, dhuhaAltitude) / 15.0;
  const asrHA = getHourAngle(loc.latitude, declination, asrAltitude) / 15.0;
  const ishaHA = getHourAngle(loc.latitude, declination, ishaAltitude) / 15.0;

  const ihtiyatMinutes = loc.ihtiyatMinutes || 2;
  const ihtiyatHours = ihtiyatMinutes / 60.0;

  // Times in decimal hours
  const fajrDec = solarNoonHours - fajrHA + ihtiyatHours;
  const sunriseDec = solarNoonHours - sunriseHA;
  const dhuhaDec = solarNoonHours - dhuhaHA + ihtiyatHours;
  const dhuhrDec = solarNoonHours + ihtiyatHours;
  const asrDec = solarNoonHours + asrHA + ihtiyatHours;
  const maghribDec = solarNoonHours + sunriseHA + ihtiyatHours;
  const ishaDec = solarNoonHours + ishaHA + ihtiyatHours;
  const imsakDec = fajrDec - (10 / 60.0);

  // SMA Albayan Goalpara special rule:
  // Senin - Jum'at (dayOfWeek 1..5): KBM selesai jam 15.40, maka adzan Ashar tepat 15.40 (940 menit)
  // Sabtu (6) & Ahad (0): Mengikuti perhitungan astronomis matahari normal
  const dayOfWeek = d.getDay();
  const isMonToFri = dayOfWeek >= 1 && dayOfWeek <= 5;
  const asrMinutes = isMonToFri ? (15 * 60 + 40) : Math.round(fixHour(asrDec) * 60);

  // Convert to minutes from midnight
  const timesInMinutes = {
    imsak: Math.round(fixHour(imsakDec) * 60),
    fajr: Math.round(fixHour(fajrDec) * 60),
    sunrise: Math.round(fixHour(sunriseDec) * 60),
    dhuha: Math.round(fixHour(dhuhaDec) * 60),
    dhuhr: Math.round(fixHour(dhuhrDec) * 60),
    asr: asrMinutes,
    maghrib: Math.round(fixHour(maghribDec) * 60),
    isha: Math.round(fixHour(ishaDec) * 60)
  };

  return {
    date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    location: loc.name,
    rawMinutes: timesInMinutes,
    times: {
      imsak: minutesToTime(timesInMinutes.imsak),
      fajr: minutesToTime(timesInMinutes.fajr),
      sunrise: minutesToTime(timesInMinutes.sunrise),
      dhuha: minutesToTime(timesInMinutes.dhuha),
      dhuhr: minutesToTime(timesInMinutes.dhuhr),
      asr: minutesToTime(timesInMinutes.asr),
      maghrib: minutesToTime(timesInMinutes.maghrib),
      isha: minutesToTime(timesInMinutes.isha)
    }
  };
}

/**
 * Get prayer time for a specific prayer name on a given date
 * @param {string} prayerName - 'fajr'|'dhuhr'|'asr'|'maghrib'|'isha'|'imsak'|'sunrise'|'dhuha'
 * @param {Date} date
 * @param {Object} [customLocation]
 * @returns {number} minutes from midnight
 */
export function getPrayerMinutes(prayerName, date = new Date(), customLocation = {}) {
  const result = calculatePrayerTimes(date, customLocation);
  return result.rawMinutes[prayerName.toLowerCase()] || 0;
}
