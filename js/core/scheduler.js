/**
 * Smart Auto-Scheduler & Floating Slot Distributor Engine
 * Places fixed anchors, resolves prayer times dynamically, and fits floating habits
 */

import { MASTER_SCHEDULE_TEMPLATES, FLOATING_HABITS_POOL, CATEGORIES } from '../config/constants.js';
import { calculatePrayerTimes } from './prayerEngine.js';
import { CalendarEvent } from '../models/Event.js';
import { getWeekDays, formatDate, timeToMinutes, minutesToTime } from '../utils/dateUtils.js';

export class SchedulerEngine {
  constructor() {
    this.wakingStartMinutes = timeToMinutes('03:45'); // 03:45
    this.wakingEndMinutes = timeToMinutes('20:45');   // 20:45
  }

  /**
   * Generate a complete resolved schedule for a full 7-day week
   * @param {Date|string} dateInWeek
   * @returns {Array<CalendarEvent>}
   */
  generateWeeklySchedule(dateInWeek) {
    const weekDays = getWeekDays(dateInWeek);
    const allEvents = [];

    // Step 1: Place all fixed template events & resolve dynamic prayer times for each day
    weekDays.forEach(dayInfo => {
      const dayEvents = this.generateDayFixedSchedule(dayInfo.date, dayInfo.dayOfWeek);
      allEvents.push(...dayEvents);
    });

    // Step 1.5: Resolve any minute overlaps between fixed school periods & prayer times
    this.resolveFixedOverlaps(allEvents);

    // Step 2: Auto-distribute floating habits into available free slots for each day
    weekDays.forEach(dayInfo => {
      const dayEvents = allEvents.filter(e => e.date === dayInfo.dateStr);
      const floatingEvents = this.allocateFloatingHabitsForDay(dayInfo.date, dayInfo.dayOfWeek, dayEvents);
      allEvents.push(...floatingEvents);
    });

    // Sort chronologically by date, then by start time
    return allEvents.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startMinutes - b.startMinutes;
    });
  }

  /**
   * Generate fixed events + dynamic prayer times for a single date
   * @param {Date} date
   * @param {number} dayOfWeek (0..6)
   * @returns {Array<CalendarEvent>}
   */
  generateDayFixedSchedule(date, dayOfWeek) {
    const dateStr = formatDate(date);
    const prayerTimes = calculatePrayerTimes(date);
    const dayTemplates = MASTER_SCHEDULE_TEMPLATES.filter(tpl => tpl.dayOfWeek === dayOfWeek);
    
    const events = [];

    dayTemplates.forEach(tpl => {
      const evt = new CalendarEvent({
        templateId: tpl.templateId,
        title: tpl.title,
        category: tpl.category,
        date: dateStr,
        dayOfWeek: dayOfWeek,
        startTime: tpl.startTime || '08:00',
        endTime: tpl.endTime || '09:00',
        durationMinutes: tpl.durationMinutes || 60,
        isDynamicPrayer: tpl.isDynamicPrayer || false,
        prayerAnchor: tpl.prayerAnchor || null,
        isLocked: tpl.isLocked !== undefined ? tpl.isLocked : true,
        description: tpl.description || '',
        color: CATEGORIES[tpl.category.toUpperCase()]?.color || '#3B82F6'
      });

      // Resolve dynamic prayer times if applicable
      if (evt.isDynamicPrayer && evt.prayerAnchor) {
        evt.resolvePrayerTimes(prayerTimes);
      }

      events.push(evt);
    });

    return events;
  }

  /**
   * Resolve any small overlaps between fixed events (e.g. teaching ends at 12:00 vs Dzuhur starts at 11:58)
   */
  resolveFixedOverlaps(events) {
    const byDate = {};
    events.forEach(e => {
      byDate[e.date] = byDate[e.date] || [];
      byDate[e.date].push(e);
    });

    Object.values(byDate).forEach(dayEvents => {
      // Sort day events by priority and start time
      dayEvents.sort((a, b) => a.startMinutes - b.startMinutes);

      for (let i = 0; i < dayEvents.length; i++) {
        for (let j = 0; j < dayEvents.length; j++) {
          if (i === j) continue;
          const a = dayEvents[i];
          const b = dayEvents[j];

          // Check overlap
          if (Math.max(a.startMinutes, b.startMinutes) < Math.min(a.endMinutes, b.endMinutes)) {
            // Case 1: Teaching/Class ending at 12:00 vs Dzuhur starting at ~11:57
            if ((a.category === 'teaching' || a.category === 'class') && b.category === 'prayer' && b.title.includes('Dzuhur')) {
              if (a.endMinutes > b.startMinutes) {
                const shift = a.endMinutes - b.startMinutes;
                b.startTime = minutesToTime(b.startMinutes + shift);
                b.endTime = minutesToTime(b.endMinutes + shift);
              }
            } else if (a.category === 'prayer' && b.title.includes('Champion Squad')) {
              // Case 2: Prayer duty vs Champion Squad
              if (a.endMinutes > b.startMinutes) {
                const shift = a.endMinutes - b.startMinutes;
                b.startTime = minutesToTime(b.startMinutes + shift);
                b.endTime = minutesToTime(b.endMinutes + shift);
              }
            } else if (a.category === 'class' && a.title.includes('Mentoring Sesi 1') && b.category === 'prayer' && b.title.includes('Jum\'at')) {
              // Case 3: Friday Mentoring 1 vs Sholat Jum'at
              b.startTime = '12:00';
              b.endTime = '12:45';
              b.durationMinutes = 45;
            }
          }
        }
      }
    });
  }

  /**
   * Find free time gaps in a day's schedule
   * @param {Array<CalendarEvent>} existingEvents
   * @param {number} [startBound] minutes from midnight (default 03:45)
   * @param {number} [endBound] minutes from midnight (default 20:45)
   * @returns {Array<{start: number, end: number, duration: number}>}
   */
  findFreeGaps(existingEvents, startBound = this.wakingStartMinutes, endBound = this.wakingEndMinutes) {
    // Filter events overlapping with waking bounds
    const sorted = [...existingEvents]
      .filter(e => e.endMinutes > startBound && e.startMinutes < endBound)
      .sort((a, b) => a.startMinutes - b.startMinutes);

    // Merge overlapping/adjacent intervals
    const busyIntervals = [];
    sorted.forEach(evt => {
      const s = Math.max(startBound, evt.startMinutes);
      const e = Math.min(endBound, evt.endMinutes);
      if (s >= e) return;

      if (busyIntervals.length === 0) {
        busyIntervals.push({ start: s, end: e });
      } else {
        const last = busyIntervals[busyIntervals.length - 1];
        if (s <= last.end) {
          last.end = Math.max(last.end, e);
        } else {
          busyIntervals.push({ start: s, end: e });
        }
      }
    });

    // Compute gaps
    const gaps = [];
    let current = startBound;

    busyIntervals.forEach(interval => {
      if (interval.start > current) {
        gaps.push({
          start: current,
          end: interval.start,
          duration: interval.start - current
        });
      }
      current = Math.max(current, interval.end);
    });

    if (current < endBound) {
      gaps.push({
        start: current,
        end: endBound,
        duration: endBound - current
      });
    }

    return gaps;
  }

  /**
   * Allocate daily floating habits smartly into free gaps
   * @param {Date} date
   * @param {number} dayOfWeek
   * @param {Array<CalendarEvent>} dayExistingEvents
   * @returns {Array<CalendarEvent>}
   */
  allocateFloatingHabitsForDay(date, dayOfWeek, dayExistingEvents) {
    const dateStr = formatDate(date);
    const prayerTimes = calculatePrayerTimes(date);
    const allocated = [];
    const currentEvents = [...dayExistingEvents];

    // Priority floating habits to allocate for every day:
    // 1. Bayyinah Time (60m) - ideal: 04.30 - 05.30 (or morning)
    // 2. Qur'an Muraja'ah (30m) - ideal: ba'da Subuh (~05.15 - 05.45)
    // 3. Kurikulum Time (20m) - ideal: siang/sore (13.30 - 13.50)
    // 4. Prepare Slots (if any for this day, e.g. Prep Math, Prep Chess, Prep Teaching)
    // 5. Coding Vibe Code 1 (40m) - afternoon (15.30 - 16.10)
    // 6. Chess Practice 1 (20m) - break time (12.20 - 12.40)
    // 7. Qur'an Ziyadah (30m) - ba'da Maghrib / ba'da Isya (18.30 - 19.00 or 19.30)
    // 8. Coding Vibe Code 2 (40m) - malam (19.00 - 19.40 or 20.00)
    // 9. Chess Practice 2 (20m) - sore/malam

    const habitsToPlace = [];

    // 1. Bayyinah
    // If Sunday 05.30 has Takhosus, place Bayyinah at 04.30-05.30
    habitsToPlace.push({
      id: `flt_${dateStr}_bayyinah`,
      title: 'Bayyinah Time (Belajar Bahasa Arab/Tafsir)',
      category: 'habit',
      durationMinutes: 60,
      targetWindow: { start: timeToMinutes('04:30'), end: timeToMinutes('06:00') }
    });

    // 2. Qur'an Muraja'ah
    const subuhEndMinutes = prayerTimes.rawMinutes.fajr + 30; // after subuh dzikir
    habitsToPlace.push({
      id: `flt_${dateStr}_quran_murajaah`,
      title: 'Qur\'an Time (Muraja\'ah)',
      category: 'habit',
      durationMinutes: 30,
      targetWindow: { start: subuhEndMinutes, end: timeToMinutes('07:00') }
    });

    // 3. Day Specific Preparations
    if (dayOfWeek === 1) { // Senin
      habitsToPlace.push({
        id: `flt_${dateStr}_prep_chess`,
        title: 'Prepare Chess Club',
        category: 'prep',
        durationMinutes: 30,
        targetWindow: { start: timeToMinutes('15:15'), end: timeToMinutes('16:15') }
      });
      habitsToPlace.push({
        id: `flt_${dateStr}_prep_teaching_mon`,
        title: 'Prepare Teaching (Senin)',
        category: 'prep',
        durationMinutes: 30,
        targetWindow: { start: timeToMinutes('06:30'), end: timeToMinutes('07:30') }
      });
    } else if (dayOfWeek === 2) { // Selasa
      habitsToPlace.push({
        id: `flt_${dateStr}_prep_math_tue`,
        title: 'Prepare Math Olympiad (Selasa)',
        category: 'prep',
        durationMinutes: 60,
        targetWindow: { start: timeToMinutes('14:30'), end: timeToMinutes('16:15') }
      });
    } else if (dayOfWeek === 4) { // Kamis
      habitsToPlace.push({
        id: `flt_${dateStr}_prep_teaching_thu`,
        title: 'Prepare Teaching (Kamis)',
        category: 'prep',
        durationMinutes: 30,
        targetWindow: { start: timeToMinutes('06:30'), end: timeToMinutes('07:00') }
      });
    } else if (dayOfWeek === 5) { // Jum'at
      habitsToPlace.push({
        id: `flt_${dateStr}_prep_teaching_fri`,
        title: 'Prepare Teaching (Jum\'at)',
        category: 'prep',
        durationMinutes: 30,
        targetWindow: { start: timeToMinutes('06:30'), end: timeToMinutes('07:30') }
      });
    } else if (dayOfWeek === 6) { // Sabtu
      habitsToPlace.push({
        id: `flt_${dateStr}_prep_math_sat`,
        title: 'Prepare Math Olympiad (Sabtu)',
        category: 'prep',
        durationMinutes: 60,
        targetWindow: { start: timeToMinutes('14:30'), end: timeToMinutes('16:15') }
      });
      habitsToPlace.push({
        id: `flt_${dateStr}_prep_teaching_sat`,
        title: 'Prepare Teaching (Sabtu)',
        category: 'prep',
        durationMinutes: 30,
        targetWindow: { start: timeToMinutes('06:30'), end: timeToMinutes('07:00') }
      });
    }

    // 4. Kurikulum Time (20m daily)
    habitsToPlace.push({
      id: `flt_${dateStr}_kurikulum`,
      title: 'Kurikulum Time + Incidental',
      category: 'habit',
      durationMinutes: 20,
      targetWindow: { start: timeToMinutes('13:30'), end: timeToMinutes('15:00') }
    });

    // 5. Chess Time 1 (20m) - midday refresh
    habitsToPlace.push({
      id: `flt_${dateStr}_chess_1`,
      title: 'Chess Time Sesi 1',
      category: 'habit',
      durationMinutes: 20,
      targetWindow: { start: timeToMinutes('12:20'), end: timeToMinutes('13:00') }
    });

    // 6. Coding Vibe Code 1 (40m) - afternoon / early evening
    habitsToPlace.push({
      id: `flt_${dateStr}_code_1`,
      title: 'Coding / Vibe Code Sesi 1',
      category: 'habit',
      durationMinutes: 40,
      targetWindow: { start: timeToMinutes('13:30'), end: timeToMinutes('16:00') }
    });

    // 7. Qur'an Ziyadah (30m) - ba'da Maghrib
    const maghribEnd = prayerTimes.rawMinutes.maghrib + 25;
    habitsToPlace.push({
      id: `flt_${dateStr}_quran_ziyadah`,
      title: 'Qur\'an Time (Ziyadah)',
      category: 'habit',
      durationMinutes: 30,
      targetWindow: { start: maghribEnd, end: prayerTimes.rawMinutes.isha }
    });

    // 8. Coding Vibe Code 2 (40m) - night
    habitsToPlace.push({
      id: `flt_${dateStr}_code_2`,
      title: 'Coding / Vibe Code Sesi 2',
      category: 'habit',
      durationMinutes: 40,
      targetWindow: { start: timeToMinutes('19:00'), end: timeToMinutes('20:45') }
    });

    // 9. Chess Time 2 (20m) - evening
    habitsToPlace.push({
      id: `flt_${dateStr}_chess_2`,
      title: 'Chess Time Sesi 2',
      category: 'habit',
      durationMinutes: 20,
      targetWindow: { start: timeToMinutes('18:20'), end: timeToMinutes('20:45') }
    });

    // Fit each habit into available gaps
    habitsToPlace.forEach(habit => {
      const gaps = this.findFreeGaps(currentEvents);
      const slot = this.findBestFitSlot(gaps, habit.durationMinutes, habit.targetWindow);

      if (slot) {
        const newEvt = new CalendarEvent({
          id: habit.id,
          title: habit.title,
          category: habit.category,
          date: dateStr,
          dayOfWeek: dayOfWeek,
          startTime: minutesToTime(slot.start),
          endTime: minutesToTime(slot.end),
          durationMinutes: habit.durationMinutes,
          isLocked: false,
          color: CATEGORIES[habit.category.toUpperCase()]?.color || '#D97706'
        });

        allocated.push(newEvt);
        currentEvents.push(newEvt);
      }
    });

    return allocated;
  }

  /**
   * Find best fitting slot inside gaps considering target preference window
   */
  findBestFitSlot(gaps, requiredDuration, targetWindow = null) {
    if (!gaps || gaps.length === 0) return null;

    // Filter gaps that have at least required duration
    const validGaps = gaps.filter(g => g.duration >= requiredDuration);
    if (validGaps.length === 0) return null;

    // If target window is specified, try to find an overlapping gap
    if (targetWindow) {
      for (const gap of validGaps) {
        const candidateStart = Math.max(gap.start, targetWindow.start);
        const candidateEnd = candidateStart + requiredDuration;

        if (candidateEnd <= gap.end && candidateStart < targetWindow.end) {
          return {
            start: candidateStart,
            end: candidateEnd
          };
        }
      }
    }

    // Fallback to first available valid gap
    const firstGap = validGaps[0];
    return {
      start: firstGap.start,
      end: firstGap.start + requiredDuration
    };
  }

  /**
   * Calculate weekly time ratio balance (Productive, Rest, Flexible)
   * @param {Array<CalendarEvent>} weeklyEvents
   * @returns {{productivePercent: number, restPercent: number, flexiblePercent: number, details: Object}}
   */
  calculateTimeRatios(weeklyEvents) {
    const totalWakingMinutesPerWeek = 7 * (this.wakingEndMinutes - this.wakingStartMinutes); // 7 x 17h = 119h = 7140m
    
    let productiveMins = 0;
    let restMins = 0;

    weeklyEvents.forEach(evt => {
      // Exclude night sleep (outside waking bounds)
      if (evt.title.includes('Tidur')) return;

      const catObj = CATEGORIES[evt.category.toUpperCase()];
      const catType = catObj?.type || 'productive';

      if (catType === 'productive') {
        productiveMins += evt.durationMinutes;
      } else if (catType === 'rest') {
        restMins += evt.durationMinutes;
      }
    });

    const usedMins = productiveMins + restMins;
    const flexibleMins = Math.max(0, totalWakingMinutesPerWeek - usedMins);

    const productivePercent = Math.round((productiveMins / totalWakingMinutesPerWeek) * 1000) / 10;
    const restPercent = Math.round((restMins / totalWakingMinutesPerWeek) * 1000) / 10;
    const flexiblePercent = Math.round((flexibleMins / totalWakingMinutesPerWeek) * 1000) / 10;

    return {
      totalWakingHours: totalWakingMinutesPerWeek / 60,
      productiveHours: Math.round((productiveMins / 60) * 10) / 10,
      restHours: Math.round((restMins / 60) * 10) / 10,
      flexibleHours: Math.round((flexibleMins / 60) * 10) / 10,
      productivePercent,
      restPercent,
      flexiblePercent
    };
  }
}

export const scheduler = new SchedulerEngine();
