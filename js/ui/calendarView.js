/**
 * Calendar View Component
 * Handles rendering of Weekly Timegrid (7 Days), Daily Focused View, and Agenda View
 */

import { CATEGORIES, EXECUTION_STATUS } from '../config/constants.js';
import { getWeekDays, formatDate, timeToMinutes, minutesToTime, formatIndonesianDate, isSameDay } from '../utils/dateUtils.js';
import { calculatePrayerTimes } from '../core/prayerEngine.js';

export class CalendarView {
  constructor(containerElement, onEventClick, onEventEdit) {
    this.container = containerElement;
    this.onEventClick = onEventClick;
    this.onEventEdit = onEventEdit;
    this.currentViewMode = 'week'; // 'week' | 'day' | 'agenda'
    this.selectedDate = new Date();
    this.events = [];
    this.activeCategoryFilter = 'all';

    this.startHour = 3;  // 03:00
    this.endHour = 23;   // 23:00
    this.hourHeight = 54; // px per 60 minutes
  }

  setEvents(events) {
    this.events = events || [];
    this.render();
  }

  setViewMode(mode) {
    this.currentViewMode = mode;
    this.render();
  }

  setSelectedDate(date) {
    this.selectedDate = typeof date === 'string' ? new Date(date) : date;
    this.render();
  }

  setCategoryFilter(category) {
    this.activeCategoryFilter = category;
    this.render();
  }

  render() {
    if (!this.container) return;

    if (this.currentViewMode === 'week') {
      this.renderWeeklyTimegrid();
    } else if (this.currentViewMode === 'day') {
      this.renderDailyFocusView();
    } else if (this.currentViewMode === 'agenda') {
      this.renderAgendaView();
    }
  }

  /**
   * Filter events by active category
   */
  getFilteredEvents() {
    if (this.activeCategoryFilter === 'all') return this.events;
    return this.events.filter(e => e.category.toLowerCase() === this.activeCategoryFilter.toLowerCase());
  }

  /**
   * Render 7-Day Weekly Timegrid
   */
  renderWeeklyTimegrid() {
    const weekDays = getWeekDays(this.selectedDate);
    const filteredEvents = this.getFilteredEvents();
    const todayStr = formatDate(new Date());

    const totalHours = this.endHour - this.startHour;
    const gridTotalHeight = totalHours * this.hourHeight;

    let html = `
      <div class="calendar-scroll-wrapper">
        <div class="weekly-timegrid" style="min-height: ${gridTotalHeight + 60}px;">
          <!-- Header Row -->
          <div class="timegrid-header-row">
            <div class="timegrid-header-cell time-axis-header">
              <span class="day-header-title">WAKTU</span>
            </div>
    `;

    // 7 Day Headers
    weekDays.forEach(day => {
      const isToday = day.dateStr === todayStr;
      const isSelected = isSameDay(day.date, this.selectedDate);
      const prayerTimes = calculatePrayerTimes(day.date);

      html += `
        <div class="timegrid-header-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}" data-date="${day.dateStr}">
          <div class="day-header-title">${day.dayName}</div>
          <div class="day-header-date">${day.dayNumber}</div>
        </div>
      `;
    });

    html += `</div><!-- End Header Row -->`;

    // Left Time Axis Column
    html += `
      <div class="time-axis-col" style="height: ${gridTotalHeight}px;">
    `;
    for (let h = this.startHour; h < this.endHour; h++) {
      const timeLabel = `${String(h).padStart(2, '0')}:00`;
      html += `
        <div class="time-slot-label" style="height: ${this.hourHeight}px;">
          ${timeLabel}
        </div>
      `;
    }
    html += `</div><!-- End Time Axis Col -->`;

    // 7 Day Columns
    weekDays.forEach(day => {
      const isToday = day.dateStr === todayStr;
      const dayEvents = filteredEvents.filter(e => e.date === day.dateStr);

      html += `
        <div class="day-column ${isToday ? 'is-today' : ''}" data-date="${day.dateStr}" style="height: ${gridTotalHeight}px;">
      `;

      // Current time line if today
      if (isToday) {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = this.startHour * 60;
        if (nowMinutes >= startMinutes && nowMinutes <= this.endHour * 60) {
          const currentTop = ((nowMinutes - startMinutes) / 60) * this.hourHeight;
          html += `<div class="current-time-line" style="top: ${currentTop}px;" title="Sekarang: ${minutesToTime(nowMinutes)}"></div>`;
        }
      }

      // Render Event Cards
      dayEvents.forEach(evt => {
        const topPx = this.calculateTopPx(evt.startMinutes);
        const heightPx = Math.max(22, (evt.durationMinutes / 60) * this.hourHeight - 2);
        const catObj = CATEGORIES[evt.category.toUpperCase()] || CATEGORIES.HABIT;
        const bgCol = evt.color || catObj.color;
        const isDuty = evt.isDynamicPrayer && evt.title.includes('Tugas');
        const statusObj = EXECUTION_STATUS[evt.status];

        let statusBadgeHtml = '';
        if (evt.status && evt.status !== 'PLANNED' && statusObj) {
          let varText = '';
          if (evt.status === 'DELAYED' && evt.varianceMinutes > 0) {
            varText = `+${evt.varianceMinutes}m`;
          } else if (evt.status === 'EARLIER' && evt.varianceMinutes < 0) {
            varText = `${evt.varianceMinutes}m`;
          }
          statusBadgeHtml = `
            <span class="status-pill-badge ${statusObj.badgeClass}">
              ${statusObj.shortLabel} ${varText}
            </span>
          `;
        }

        html += `
          <div class="event-card ${isDuty ? 'is-prayer-duty' : ''}"
               data-event-id="${evt.id}"
               data-date="${evt.date}"
               style="top: ${topPx}px; height: ${heightPx}px; background-color: ${bgCol};"
               title="${evt.title} (${evt.startTime} - ${evt.endTime})">
            <div class="event-card-header">
              <span class="event-time-range">${evt.startTime} - ${evt.endTime}</span>
            </div>
            <div class="event-title">${evt.title}</div>
            ${statusBadgeHtml}
          </div>
        `;
      });

      html += `</div><!-- End Day Column -->`;
    });

    html += `
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  /**
   * Render Daily Focus View
   */
  renderDailyFocusView() {
    const dateStr = formatDate(this.selectedDate);
    const dayEvents = this.getFilteredEvents()
      .filter(e => e.date === dateStr)
      .sort((a, b) => a.startMinutes - b.startMinutes);
    const prayerTimes = calculatePrayerTimes(this.selectedDate);

    let html = `
      <div class="daily-focus-container">
        <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="font-size: 1.25rem; font-weight: 800;">${formatIndonesianDate(this.selectedDate)}</h2>
          <span style="font-size: 0.85rem; color: var(--text-muted);">${dayEvents.length} Jadwal Hari Ini</span>
        </div>
    `;

    if (dayEvents.length === 0) {
      html += `
        <div style="text-align: center; padding: 48px; color: var(--text-muted);">
          <p>Belum ada jadwal untuk hari ini.</p>
        </div>
      `;
    } else {
      dayEvents.forEach(evt => {
        const catObj = CATEGORIES[evt.category.toUpperCase()] || CATEGORIES.HABIT;
        const statusObj = EXECUTION_STATUS[evt.status];

        let statusText = 'Belum Dinilai';
        let badgeClass = 'btn-outline';
        if (statusObj) {
          statusText = statusObj.label;
          if (evt.varianceMinutes && evt.status === 'DELAYED') statusText += ` (+${evt.varianceMinutes}m)`;
          if (evt.varianceMinutes && evt.status === 'EARLIER') statusText += ` (${evt.varianceMinutes}m)`;
        }

        html += `
          <div class="daily-timeline-item" data-event-id="${evt.id}">
            <div class="daily-item-time" style="border-left: 4px solid ${evt.color || catObj.color}; padding-left: 8px;">
              ${evt.startTime} - ${evt.endTime}
              <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">${evt.durationMinutes} menit</div>
            </div>
            <div class="daily-item-body">
              <div class="daily-item-title">${evt.title}</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px;">
                <span style="background: ${catObj.color}; color: #FFF; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600;">
                  ${catObj.name}
                </span>
                ${evt.description ? `<span style="margin-left: 8px;">${evt.description}</span>` : ''}
              </div>
              ${evt.notes ? `<div style="font-size: 0.78rem; font-style: italic; color: var(--text-muted); background: var(--bg-hover); padding: 4px 8px; border-radius: 4px; margin-top: 4px;">Catatan: "${evt.notes}"</div>` : ''}
              <div class="daily-item-actions">
                <button class="btn btn-sm btn-primary log-btn" data-event-id="${evt.id}">
                  ⚡ Catat Eksekusi (${statusText})
                </button>
              </div>
            </div>
          </div>
        `;
      });
    }

    html += `</div>`;
    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  /**
   * Render Agenda List View
   */
  renderAgendaView() {
    const weekDays = getWeekDays(this.selectedDate);
    const filteredEvents = this.getFilteredEvents();

    let html = `
      <div class="daily-focus-container">
        <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 16px;">Agenda 7 Hari</h2>
    `;

    weekDays.forEach(day => {
      const dayEvents = filteredEvents
        .filter(e => e.date === day.dateStr)
        .sort((a, b) => a.startMinutes - b.startMinutes);

      html += `
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 1rem; font-weight: 700; color: var(--accent-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 6px; margin-bottom: 10px;">
            ${day.dayName}, ${day.dayNumber} ${formatIndonesianDate(day.date, false)} (${dayEvents.length} Kegiatan)
          </h3>
      `;

      if (dayEvents.length === 0) {
        html += `<p style="font-size: 0.85rem; color: var(--text-muted); padding-left: 8px;">Tidak ada agenda.</p>`;
      } else {
        dayEvents.forEach(evt => {
          const catObj = CATEGORIES[evt.category.toUpperCase()] || CATEGORIES.HABIT;
          html += `
            <div class="daily-timeline-item" data-event-id="${evt.id}" style="margin-bottom: 8px; padding: 8px 12px;">
              <div class="daily-item-time" style="font-size: 0.85rem; min-width: 85px;">
                ${evt.startTime} - ${evt.endTime}
              </div>
              <div class="daily-item-body">
                <div style="font-weight: 600; font-size: 0.9rem;">${evt.title}</div>
                <span style="font-size: 0.72rem; color: var(--text-muted);">${catObj.name}</span>
              </div>
            </div>
          `;
        });
      }

      html += `</div>`;
    });

    html += `</div>`;
    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  /**
   * Helper: calculate top px relative to grid start hour
   */
  calculateTopPx(minutesFromMidnight) {
    const gridStartMinutes = this.startHour * 60;
    const offsetMinutes = Math.max(0, minutesFromMidnight - gridStartMinutes);
    return (offsetMinutes / 60) * this.hourHeight;
  }

  /**
   * Attach click event listeners for cards and log buttons
   */
  attachEventListeners() {
    const eventCards = this.container.querySelectorAll('.event-card, .daily-timeline-item');
    eventCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const eventId = card.getAttribute('data-event-id');
        const evt = this.events.find(item => item.id === eventId);
        if (evt && this.onEventClick) {
          this.onEventClick(evt);
        }
      });
    });

    const headerCells = this.container.querySelectorAll('.timegrid-header-cell[data-date]');
    headerCells.forEach(cell => {
      cell.addEventListener('click', () => {
        const dateStr = cell.getAttribute('data-date');
        if (dateStr) {
          this.selectedDate = new Date(dateStr);
          this.setViewMode('day');
        }
      });
    });
  }
}
