/**
 * Event Entity Model
 */

import { CATEGORIES, EXECUTION_STATUS } from '../config/constants.js';
import { timeToMinutes, minutesToTime } from '../utils/dateUtils.js';

export class CalendarEvent {
  constructor(data = {}) {
    this.id = data.id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.templateId = data.templateId || null;
    this.title = data.title || 'Untitled Event';
    this.category = data.category || 'habit';
    this.date = data.date || ''; // "YYYY-MM-DD"
    this.dayOfWeek = data.dayOfWeek !== undefined ? Number(data.dayOfWeek) : 0;
    
    this.isDynamicPrayer = Boolean(data.isDynamicPrayer);
    this.prayerAnchor = data.prayerAnchor || null; // e.g. { prayer: 'fajr', offset: 15, duration: 30 }
    
    this.startTime = data.startTime || '08:00';
    this.endTime = data.endTime || '09:00';
    this.durationMinutes = Number(data.durationMinutes) || (timeToMinutes(this.endTime) - timeToMinutes(this.startTime)) || 60;
    
    this.isLocked = Boolean(data.isLocked);
    this.description = data.description || '';
    this.color = data.color || (CATEGORIES[this.category.toUpperCase()]?.color || '#3B82F6');
    
    // Execution State
    this.status = data.status || 'PLANNED'; // PLANNED | ON_TIME | EARLIER | DELAYED | RESCHEDULED | CANCELLED
    this.actualStartTime = data.actualStartTime || null;
    this.actualEndTime = data.actualEndTime || null;
    this.varianceMinutes = Number(data.varianceMinutes) || 0; // -10 (earlier), +15 (delayed)
    this.reason = data.reason || '';
    this.notes = data.notes || '';
    this.rescheduledTo = data.rescheduledTo || null; // { date, startTime, endTime }
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  get startMinutes() {
    return timeToMinutes(this.startTime);
  }

  get endMinutes() {
    return timeToMinutes(this.endTime);
  }

  /**
   * Recalculate start and end times based on dynamic prayer time calculation for this event's date
   * @param {Object} prayerTimes - calculated prayer times object from prayerEngine
   */
  resolvePrayerTimes(prayerTimes) {
    if (!this.isDynamicPrayer || !this.prayerAnchor || !prayerTimes?.rawMinutes) {
      return;
    }

    const { prayer, offset = 0, duration = 30 } = this.prayerAnchor;
    const baseMinutes = prayerTimes.rawMinutes[prayer.toLowerCase()];
    if (baseMinutes === undefined) return;

    const startMins = Math.max(0, Math.min(1439, baseMinutes + offset));
    const endMins = Math.min(1439, startMins + duration);

    this.startTime = minutesToTime(startMins);
    this.endTime = minutesToTime(endMins);
    this.durationMinutes = duration;
  }

  /**
   * Check if this event collides with another event on the same day
   * @param {CalendarEvent} other
   * @returns {boolean}
   */
  overlapsWith(other) {
    if (this.id === other.id) return false;
    if (this.date && other.date && this.date !== other.date) return false;
    if (this.dayOfWeek !== other.dayOfWeek) return false;

    const startA = this.startMinutes;
    const endA = this.endMinutes;
    const startB = other.startMinutes;
    const endB = other.endMinutes;

    return Math.max(startA, startB) < Math.min(endA, endB);
  }

  /**
   * Set execution status and variance
   */
  setExecutionStatus(status, { varianceMinutes = 0, reason = '', notes = '', actualStartTime = null, actualEndTime = null, rescheduledTo = null } = {}) {
    this.status = status;
    this.varianceMinutes = varianceMinutes;
    this.reason = reason;
    this.notes = notes;
    this.actualStartTime = actualStartTime || (status === 'ON_TIME' ? this.startTime : this.actualStartTime);
    this.actualEndTime = actualEndTime || (status === 'ON_TIME' ? this.endTime : this.actualEndTime);
    this.rescheduledTo = rescheduledTo;
    this.updatedAt = new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      templateId: this.templateId,
      title: this.title,
      category: this.category,
      date: this.date,
      dayOfWeek: this.dayOfWeek,
      startTime: this.startTime,
      endTime: this.endTime,
      startMinutes: this.startMinutes,
      endMinutes: this.endMinutes,
      durationMinutes: this.durationMinutes,
      isDynamicPrayer: this.isDynamicPrayer,
      prayerAnchor: this.prayerAnchor,
      isLocked: this.isLocked,
      description: this.description,
      color: this.color,
      status: this.status,
      actualStartTime: this.actualStartTime,
      actualEndTime: this.actualEndTime,
      varianceMinutes: this.varianceMinutes,
      reason: this.reason,
      notes: this.notes,
      rescheduledTo: this.rescheduledTo,
      updatedAt: this.updatedAt
    };
  }

  static fromJSON(json) {
    return new CalendarEvent(json);
  }
}
