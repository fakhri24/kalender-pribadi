/**
 * Execution Log Entity Model
 * Tracks historical execution records for individual events
 */

export class ExecutionLog {
  constructor(data = {}) {
    this.id = data.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    this.eventId = data.eventId || '';
    this.date = data.date || ''; // "YYYY-MM-DD"
    this.eventTitle = data.eventTitle || '';
    this.category = data.category || '';
    this.plannedStartTime = data.plannedStartTime || '';
    this.plannedEndTime = data.plannedEndTime || '';
    this.durationMinutes = Number(data.durationMinutes) || 0;
    
    this.status = data.status || 'ON_TIME'; // ON_TIME | EARLIER | DELAYED | RESCHEDULED | CANCELLED
    this.varianceMinutes = Number(data.varianceMinutes) || 0; // Negative for earlier, positive for delay
    this.actualStartTime = data.actualStartTime || '';
    this.actualEndTime = data.actualEndTime || '';
    this.reason = data.reason || '';
    this.notes = data.notes || '';
    this.rescheduledTo = data.rescheduledTo || null;
    this.timestamp = data.timestamp || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      eventId: this.eventId,
      date: this.date,
      eventTitle: this.eventTitle,
      category: this.category,
      plannedStartTime: this.plannedStartTime,
      plannedEndTime: this.plannedEndTime,
      durationMinutes: this.durationMinutes,
      status: this.status,
      varianceMinutes: this.varianceMinutes,
      actualStartTime: this.actualStartTime,
      actualEndTime: this.actualEndTime,
      reason: this.reason,
      notes: this.notes,
      rescheduledTo: this.rescheduledTo,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new ExecutionLog(json);
  }
}
