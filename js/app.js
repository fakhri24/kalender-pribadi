/**
 * Main Application Coordinator & Entrypoint
 * Coordinates state, storage, scheduler, prayer calculations, and UI modals
 */

import { storage, STORES } from './core/storage.js';
import { scheduler } from './core/scheduler.js';
import { calculatePrayerTimes } from './core/prayerEngine.js';
import { CalendarView } from './ui/calendarView.js';
import { LoggerModal } from './ui/loggerModal.js';
import { EventEditorModal } from './ui/eventEditor.js';
import { ReviewViewModal } from './ui/reviewView.js';
import { CalendarEvent } from './models/Event.js';
import { ExecutionLog } from './models/ExecutionLog.js';
import { exportAllData, importDataFromFile } from './utils/exportImport.js';
import {
  getWeekDays,
  getStartOfWeek,
  getEndOfWeek,
  getWeekId,
  formatDate,
  formatIndonesianDate,
  addDays
} from './utils/dateUtils.js';

class App {
  constructor() {
    this.selectedDate = new Date();
    this.currentViewMode = 'week';
    this.events = [];
    this.currentTheme = localStorage.getItem('kp_theme') || 'light';

    this.initDOM();
    this.initComponents();
    this.initTheme();
    this.bindGlobalEvents();
  }

  initDOM() {
    this.dom = {
      themeToggleBtn: document.getElementById('theme-toggle-btn'),
      currentWeekLabel: document.getElementById('current-week-label'),
      prevBtn: document.getElementById('nav-prev-btn'),
      nextBtn: document.getElementById('nav-next-btn'),
      todayBtn: document.getElementById('nav-today-btn'),
      autoGenBtn: document.getElementById('auto-gen-btn'),
      addEventBtn: document.getElementById('add-event-btn'),
      reviewBtn: document.getElementById('weekly-review-btn'),
      exportBtn: document.getElementById('export-btn'),
      importBtn: document.getElementById('import-btn'),
      importFileInput: document.getElementById('import-file-input'),
      prayerRibbon: document.getElementById('prayer-ribbon'),
      ratioBar: document.getElementById('ratio-bar'),
      ratioLegend: document.getElementById('ratio-legend'),
      viewTabBtns: document.querySelectorAll('.tab-btn[data-view]'),
      densityBtns: document.querySelectorAll('.tab-btn[data-density]'),
      filterChips: document.querySelectorAll('.filter-chip[data-cat]'),
      calendarContainer: document.getElementById('calendar-view-container'),
      loggerModalEl: document.getElementById('logger-modal'),
      editorModalEl: document.getElementById('editor-modal'),
      reviewModalEl: document.getElementById('review-modal')
    };
  }

  initComponents() {
    // 1. Calendar View
    this.calendarView = new CalendarView(
      this.dom.calendarContainer,
      (event) => this.handleEventClick(event),
      (event) => this.handleEventEdit(event)
    );

    // 2. Modals
    this.loggerModal = new LoggerModal(
      this.dom.loggerModalEl,
      (event, executionData) => this.handleSaveExecution(event, executionData),
      (event) => this.handleEventEdit(event)
    );

    this.eventEditorModal = new EventEditorModal(
      this.dom.editorModalEl,
      (event, isNew) => this.handleSaveEvent(event, isNew),
      (eventId) => this.handleDeleteEvent(eventId)
    );

    this.reviewModal = new ReviewViewModal(
      this.dom.reviewModalEl,
      (reviewData) => this.handleSaveReview(reviewData),
      (selectedDate) => this.handleApplyNextWeek(selectedDate)
    );
  }

  initTheme() {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    if (this.dom.themeToggleBtn) {
      this.dom.themeToggleBtn.textContent = this.currentTheme === 'dark' ? '☀️ Terang' : '🌙 Gelap';
    }
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('kp_theme', this.currentTheme);
    this.initTheme();
  }

  async start() {
    await this.loadWeekEvents();
    this.updateHeaderUI();
    this.updatePrayerRibbon();
    this.updateRatioBar();
    this.calendarView.setSelectedDate(this.selectedDate);
    this.calendarView.setEvents(this.events);
  }

  /**
   * Load events for current week from storage or auto-generate if empty
   */
  async loadWeekEvents() {
    const startOfWeek = formatDate(getStartOfWeek(this.selectedDate));
    const endOfWeek = formatDate(getEndOfWeek(this.selectedDate));
    const allStoredEvents = await storage.getAll(STORES.EVENTS);

    // Filter events belonging to current week and deserialize as CalendarEvent instances
    let weekEvents = allStoredEvents
      .filter(e => e.date >= startOfWeek && e.date <= endOfWeek)
      .map(e => (e instanceof CalendarEvent ? e : CalendarEvent.fromJSON(e)));

    // If no events found for this week, generate smart schedule
    if (weekEvents.length === 0) {
      weekEvents = scheduler.generateWeeklySchedule(this.selectedDate);
      await storage.putBulk(STORES.EVENTS, weekEvents.map(e => e.toJSON ? e.toJSON() : e));
    }

    this.events = weekEvents;
  }

  /**
   * Update header labels and date range
   */
  updateHeaderUI() {
    const weekDays = getWeekDays(this.selectedDate);
    const startStr = formatIndonesianDate(weekDays[0].date, false).replace(` ${weekDays[0].date.getFullYear()}`, '');
    const endStr = formatIndonesianDate(weekDays[6].date, false);
    const weekId = getWeekId(this.selectedDate);

    if (this.dom.currentWeekLabel) {
      this.dom.currentWeekLabel.textContent = `${weekId} (${startStr} - ${endStr})`;
    }
  }

  /**
   * Update Prayer Times Ribbon
   */
  updatePrayerRibbon() {
    if (!this.dom.prayerRibbon) return;

    const prayerData = calculatePrayerTimes(this.selectedDate);
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();

    const prayerList = [
      { name: 'Subuh', time: prayerData.times.fajr, mins: prayerData.rawMinutes.fajr },
      { name: 'Terbit', time: prayerData.times.sunrise, mins: prayerData.rawMinutes.sunrise },
      { name: 'Dzuhur', time: prayerData.times.dhuhr, mins: prayerData.rawMinutes.dhuhr },
      { name: 'Ashar', time: prayerData.times.asr, mins: prayerData.rawMinutes.asr },
      { name: 'Maghrib', time: prayerData.times.maghrib, mins: prayerData.rawMinutes.maghrib },
      { name: 'Isya', time: prayerData.times.isha, mins: prayerData.rawMinutes.isha }
    ];

    let html = '';
    prayerList.forEach((p, idx) => {
      const nextP = prayerList[idx + 1];
      const isActive = (nextP && nowMins >= p.mins && nowMins < nextP.mins) || (!nextP && nowMins >= p.mins);

      html += `
        <div class="prayer-pill ${isActive ? 'active' : ''}">
          <span class="prayer-name">${p.name}</span>
          <span class="prayer-time">${p.time}</span>
        </div>
      `;
    });

    this.dom.prayerRibbon.innerHTML = html;
  }

  /**
   * Update Productive vs Rest vs Flexible target ratio bar
   */
  updateRatioBar() {
    if (!this.dom.ratioBar) return;

    const ratios = scheduler.calculateTimeRatios(this.events);
    this.dom.ratioBar.innerHTML = `
      <div class="ratio-segment productive" style="width: ${ratios.productivePercent}%;" title="Produktif: ${ratios.productiveHours} jam (${ratios.productivePercent}%)"></div>
      <div class="ratio-segment rest" style="width: ${ratios.restPercent}%;" title="Istirahat: ${ratios.restHours} jam (${ratios.restPercent}%)"></div>
      <div class="ratio-segment flexible" style="width: ${ratios.flexiblePercent}%;" title="Fleksibel: ${ratios.flexibleHours} jam (${ratios.flexiblePercent}%)"></div>
    `;

    if (this.dom.ratioLegend) {
      this.dom.ratioLegend.innerHTML = `
        <div class="legend-item"><span class="legend-dot productive"></span> Produktif: <strong>${ratios.productiveHours}j (${ratios.productivePercent}%)</strong> <small style="color:var(--text-muted);">Target: 80%</small></div>
        <div class="legend-item"><span class="legend-dot rest"></span> Istirahat: <strong>${ratios.restHours}j (${ratios.restPercent}%)</strong> <small style="color:var(--text-muted);">Target: 10%</small></div>
        <div class="legend-item"><span class="legend-dot flexible"></span> Fleksibel: <strong>${ratios.flexibleHours}j (${ratios.flexiblePercent}%)</strong> <small style="color:var(--text-muted);">Target: 10%</small></div>
      `;
    }
  }

  /**
   * Event Handlers
   */
  handleEventClick(event) {
    this.loggerModal.open(event);
  }

  handleEventEdit(event) {
    this.eventEditorModal.open(event);
  }

  async handleSaveExecution(event, executionData) {
    event.setExecutionStatus(executionData.status, executionData);
    await storage.put(STORES.EVENTS, event.toJSON ? event.toJSON() : event);

    // Save historical Execution Log
    const log = new ExecutionLog({
      eventId: event.id,
      date: event.date,
      eventTitle: event.title,
      category: event.category,
      plannedStartTime: event.startTime,
      plannedEndTime: event.endTime,
      durationMinutes: event.durationMinutes,
      status: executionData.status,
      varianceMinutes: executionData.varianceMinutes,
      reason: executionData.reason,
      notes: executionData.notes
    });
    await storage.put(STORES.LOGS, log.toJSON());

    await this.refreshUI();
  }

  async handleSaveEvent(event, isNew) {
    await storage.put(STORES.EVENTS, event.toJSON ? event.toJSON() : event);
    await this.refreshUI();
  }

  async handleDeleteEvent(eventId) {
    await storage.delete(STORES.EVENTS, eventId);
    await this.refreshUI();
  }

  async handleSaveReview(reviewData) {
    await storage.put(STORES.REVIEWS, reviewData.toJSON ? reviewData.toJSON() : reviewData);
  }

  async handleApplyNextWeek(selectedDate) {
    const nextWeekDate = addDays(selectedDate, 7);
    const startOfWeek = formatDate(getStartOfWeek(nextWeekDate));
    const endOfWeek = formatDate(getEndOfWeek(nextWeekDate));

    await storage.deleteEventsInRange(startOfWeek, endOfWeek);
    const newEvents = scheduler.generateWeeklySchedule(nextWeekDate);
    await storage.putBulk(STORES.EVENTS, newEvents.map(e => e.toJSON ? e.toJSON() : e));
    this.selectedDate = nextWeekDate;
    await this.refreshUI();
    alert('Jadwal berhasil diterapkan untuk minggu berikutnya!');
  }

  async refreshUI() {
    await this.loadWeekEvents();
    this.updateHeaderUI();
    this.updatePrayerRibbon();
    this.updateRatioBar();
    this.calendarView.setSelectedDate(this.selectedDate);
    this.calendarView.setEvents(this.events);
  }

  bindGlobalEvents() {
    // Theme Toggle
    this.dom.themeToggleBtn?.addEventListener('click', () => this.toggleTheme());

    // Navigation
    this.dom.prevBtn?.addEventListener('click', async () => {
      const days = this.currentViewMode === 'day' ? 1 : 7;
      this.selectedDate = addDays(this.selectedDate, -days);
      await this.refreshUI();
    });

    this.dom.nextBtn?.addEventListener('click', async () => {
      const days = this.currentViewMode === 'day' ? 1 : 7;
      this.selectedDate = addDays(this.selectedDate, days);
      await this.refreshUI();
    });

    this.dom.todayBtn?.addEventListener('click', async () => {
      this.selectedDate = new Date();
      await this.refreshUI();
    });

    // Auto-Generate / Reset Smart Schedule to Default
    this.dom.autoGenBtn?.addEventListener('click', async () => {
      if (confirm('Jadwal minggu ini akan di-reset dan di-generate ulang sesuai template master default (Al-Bayan Goalpara) & rasio 80:10:10. Lanjutkan?')) {
        const startOfWeek = formatDate(getStartOfWeek(this.selectedDate));
        const endOfWeek = formatDate(getEndOfWeek(this.selectedDate));

        // Clean old events for this week first to prevent duplication
        await storage.deleteEventsInRange(startOfWeek, endOfWeek);

        // Generate clean master schedule
        const generated = scheduler.generateWeeklySchedule(this.selectedDate);
        await storage.putBulk(STORES.EVENTS, generated.map(e => e.toJSON ? e.toJSON() : e));

        await this.refreshUI();
        alert('Jadwal minggu ini berhasil dikembalikan ke template master default!');
      }
    });

    // Add Event Button
    this.dom.addEventBtn?.addEventListener('click', () => {
      this.eventEditorModal.open(null, this.selectedDate);
    });

    // Weekly Review Dashboard Button
    this.dom.reviewBtn?.addEventListener('click', async () => {
      const weekId = getWeekId(this.selectedDate);
      const existingReview = await storage.get(STORES.REVIEWS, weekId);
      this.reviewModal.open(this.events, this.selectedDate, existingReview);
    });

    // View Mode Tabs
    this.dom.viewTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.dom.viewTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const viewMode = btn.getAttribute('data-view');
        this.currentViewMode = viewMode;
        this.calendarView.setViewMode(viewMode);
      });
    });

    // Zoom Density Switcher
    const currentDensity = localStorage.getItem('kp_hour_height') || '80';
    this.dom.densityBtns.forEach(btn => {
      if (btn.getAttribute('data-density') === currentDensity) {
        this.dom.densityBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
      btn.addEventListener('click', () => {
        this.dom.densityBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const density = Number(btn.getAttribute('data-density')) || 80;
        this.calendarView.setHourHeight(density);
      });
    });

    // Category Filter Chips
    this.dom.filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.dom.filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const cat = chip.getAttribute('data-cat');
        this.calendarView.setCategoryFilter(cat);
      });
    });

    // Export Data JSON
    this.dom.exportBtn?.addEventListener('click', async () => {
      await exportAllData();
    });

    // Import Data JSON
    this.dom.importBtn?.addEventListener('click', () => {
      this.dom.importFileInput?.click();
    });

    this.dom.importFileInput?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          const res = await importDataFromFile(file);
          alert(res.message);
          await this.refreshUI();
        } catch (err) {
          alert(`Gagal mengimpor data: ${err.message}`);
        }
      }
    });
  }
}

// Instantiate and start app on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.start();
});
