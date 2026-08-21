/**
 * Weekly Review Entity Model
 * Aggregates stats, completion rates, and qualitative reflections for a given week
 */

export class WeeklyReview {
  constructor(data = {}) {
    this.weekId = data.weekId || ''; // e.g. "2026-W34"
    this.startDate = data.startDate || '';
    this.endDate = data.endDate || '';
    
    // Quantitative stats
    this.totalPlannedEvents = Number(data.totalPlannedEvents) || 0;
    this.totalPlannedMinutes = Number(data.totalPlannedMinutes) || 0;
    this.totalExecutedMinutes = Number(data.totalExecutedMinutes) || 0;
    
    this.onTimeCount = Number(data.onTimeCount) || 0;
    this.earlierCount = Number(data.earlierCount) || 0;
    this.delayedCount = Number(data.delayedCount) || 0;
    this.rescheduledCount = Number(data.rescheduledCount) || 0;
    this.cancelledCount = Number(data.cancelledCount) || 0;
    
    // Category Breakdown (hours and percentages)
    this.categoryHours = data.categoryHours || {
      productive: 0,
      rest: 0,
      flexible: 0
    };
    this.categoryPercentages = data.categoryPercentages || {
      productive: 0,
      rest: 0,
      flexible: 0
    };

    // Qualitative Reflections
    this.reflections = data.reflections || {
      wins: '',
      bottlenecks: '',
      improvementsNextWeek: '',
      notes: ''
    };

    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  get onTimeRate() {
    const evaluated = this.onTimeCount + this.earlierCount + this.delayedCount + this.rescheduledCount + this.cancelledCount;
    if (evaluated === 0) return 0;
    return Math.round(((this.onTimeCount + this.earlierCount) / evaluated) * 100);
  }

  toJSON() {
    return {
      weekId: this.weekId,
      startDate: this.startDate,
      endDate: this.endDate,
      totalPlannedEvents: this.totalPlannedEvents,
      totalPlannedMinutes: this.totalPlannedMinutes,
      totalExecutedMinutes: this.totalExecutedMinutes,
      onTimeCount: this.onTimeCount,
      earlierCount: this.earlierCount,
      delayedCount: this.delayedCount,
      rescheduledCount: this.rescheduledCount,
      cancelledCount: this.cancelledCount,
      onTimeRate: this.onTimeRate,
      categoryHours: this.categoryHours,
      categoryPercentages: this.categoryPercentages,
      reflections: this.reflections,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromJSON(json) {
    return new WeeklyReview(json);
  }
}
