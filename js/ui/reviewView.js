/**
 * Weekly Review & Retrospective Dashboard Modal
 * Provides quantitative analytics, variance tracking, and qualitative weekly reflection
 */

import { WeeklyReview } from '../models/WeeklyReview.js';
import { getWeekId, getStartOfWeek, getEndOfWeek, formatDate, formatIndonesianDate } from '../utils/dateUtils.js';
import { scheduler } from '../core/scheduler.js';

export class ReviewViewModal {
  constructor(modalElement, onSaveReviewCallback, onApplyNextWeekCallback) {
    this.modalEl = modalElement;
    this.onSaveReview = onSaveReviewCallback;
    this.onApplyNextWeek = onApplyNextWeekCallback;
    this.currentWeekEvents = [];
    this.selectedDate = new Date();
    this.reviewData = null;
  }

  open(events, selectedDate, existingReview = null) {
    this.currentWeekEvents = events || [];
    this.selectedDate = selectedDate || new Date();
    this.reviewData = existingReview || this.calculateWeeklyStats();
    this.render();
    this.modalEl.classList.add('open');
  }

  close() {
    this.modalEl.classList.remove('open');
  }

  calculateWeeklyStats() {
    const weekId = getWeekId(this.selectedDate);
    const startDate = formatDate(getStartOfWeek(this.selectedDate));
    const endDate = formatDate(getEndOfWeek(this.selectedDate));

    let onTimeCount = 0;
    let earlierCount = 0;
    let delayedCount = 0;
    let rescheduledCount = 0;
    let cancelledCount = 0;

    this.currentWeekEvents.forEach(e => {
      if (e.status === 'ON_TIME') onTimeCount++;
      else if (e.status === 'EARLIER') earlierCount++;
      else if (e.status === 'DELAYED') delayedCount++;
      else if (e.status === 'RESCHEDULED') rescheduledCount++;
      else if (e.status === 'CANCELLED') cancelledCount++;
    });

    const ratios = scheduler.calculateTimeRatios(this.currentWeekEvents);

    return new WeeklyReview({
      weekId,
      startDate,
      endDate,
      totalPlannedEvents: this.currentWeekEvents.length,
      onTimeCount,
      earlierCount,
      delayedCount,
      rescheduledCount,
      cancelledCount,
      categoryPercentages: {
        productive: ratios.productivePercent,
        rest: ratios.restPercent,
        flexible: ratios.flexiblePercent
      }
    });
  }

  render() {
    const r = this.reviewData;
    const evaluatedTotal = r.onTimeCount + r.earlierCount + r.delayedCount + r.rescheduledCount + r.cancelledCount;
    const delayedAndCancelled = this.currentWeekEvents.filter(e => e.status === 'DELAYED' || e.status === 'CANCELLED' || e.status === 'RESCHEDULED');

    this.modalEl.innerHTML = `
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">📊 Evaluasi Mingguan & Retrospektif</h3>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
              Minggu: <strong>${r.weekId}</strong> (${formatIndonesianDate(r.startDate, false)} s/d ${formatIndonesianDate(r.endDate, false)})
            </div>
          </div>
          <button class="modal-close-btn" id="close-review-btn">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Quantitative Scorecards -->
          <div class="review-kpi-grid">
            <div class="kpi-card" style="border-top: 3px solid #10B981;">
              <div class="kpi-value" style="color: #10B981;">${r.onTimeRate}%</div>
              <div class="kpi-label">Kepatuhan Jadwal</div>
            </div>
            <div class="kpi-card" style="border-top: 3px solid #2563EB;">
              <div class="kpi-value">${evaluatedTotal} / ${r.totalPlannedEvents}</div>
              <div class="kpi-label">Kegiatan Dinilai</div>
            </div>
            <div class="kpi-card" style="border-top: 3px solid #0284C7;">
              <div class="kpi-value" style="color: #0284C7;">${r.earlierCount}</div>
              <div class="kpi-label">Lebih Cepat</div>
            </div>
            <div class="kpi-card" style="border-top: 3px solid #F59E0B;">
              <div class="kpi-value" style="color: #F59E0B;">${r.delayedCount}</div>
              <div class="kpi-label">Terlambat/Molor</div>
            </div>
            <div class="kpi-card" style="border-top: 3px solid #EF4444;">
              <div class="kpi-value" style="color: #EF4444;">${r.cancelledCount}</div>
              <div class="kpi-label">Batal / Skip</div>
            </div>
          </div>

          <!-- Ratio Target vs Actual -->
          <div class="reflection-box">
            <div class="reflection-title">⚖️ Analisis Keseimbangan Waktu (Target Rasio 80 : 10 : 10)</div>
            <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-top: 4px;">
              <div style="flex: 1; min-width: 140px;">
                <div style="font-size: 0.78rem; color: var(--text-muted);">Produktif (Target 80%)</div>
                <div style="font-size: 1.1rem; font-weight: 700; color: #2563EB;">${r.categoryPercentages.productive}%</div>
              </div>
              <div style="flex: 1; min-width: 140px;">
                <div style="font-size: 0.78rem; color: var(--text-muted);">Istirahat Fisik (Target 10%)</div>
                <div style="font-size: 1.1rem; font-weight: 700; color: #64748B;">${r.categoryPercentages.rest}%</div>
              </div>
              <div style="flex: 1; min-width: 140px;">
                <div style="font-size: 0.78rem; color: var(--text-muted);">Fleksibel / Buffer (Target 10%)</div>
                <div style="font-size: 1.1rem; font-weight: 700; color: #10B981;">${r.categoryPercentages.flexible}%</div>
              </div>
            </div>
          </div>

          <!-- List of Variances & Reasons -->
          ${delayedAndCancelled.length > 0 ? `
            <div class="form-group">
              <label class="form-label">Daftar Jadwal Terlambat / Batal & Alasannya</label>
              <div style="max-height: 160px; overflow-y: auto; background: var(--bg-hover); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 8px;">
                ${delayedAndCancelled.map(e => `
                  <div style="padding: 6px 8px; border-bottom: 1px solid var(--border-color); font-size: 0.82rem; display: flex; justify-content: space-between;">
                    <div>
                      <strong>${e.title}</strong> (${e.date} ${e.startTime})
                      <div style="color: var(--text-muted); font-size: 0.75rem;">Alasan: "${e.reason || 'Tidak ada alasan'}" ${e.notes ? `| Catatan: ${e.notes}` : ''}</div>
                    </div>
                    <span style="font-weight: 700; color: ${e.status === 'CANCELLED' ? '#EF4444' : '#F59E0B'};">
                      ${e.status === 'CANCELLED' ? 'Batal' : `+${e.varianceMinutes}m`}
                    </span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Qualitative Reflections -->
          <div class="form-group">
            <label class="form-label">🌟 Kemenangan / Pencapaian Utama Minggu Ini (Wins)</label>
            <textarea id="ref-wins-input" class="form-textarea" rows="2" placeholder="Apa saja target yang berjalan sangat baik minggu ini? (misal: Coding tuntas, hafalan lancar...)">${r.reflections.wins || ''}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">🚧 Hambatan & Pola Keterlambatan (Bottlenecks)</label>
            <textarea id="ref-bottlenecks-input" class="form-textarea" rows="2" placeholder="Apa penyebab utama jadwal terlewat atau molor?">${r.reflections.bottlenecks || ''}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">🎯 Penyesuaian & Komitmen Minggu Depan (Adjustments)</label>
            <textarea id="ref-next-input" class="form-textarea" rows="2" placeholder="Penyesuaian apa yang akan dilakukan di minggu berikutnya agar jadwal lebih realistis?">${r.reflections.improvementsNextWeek || ''}</textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-success" id="apply-next-week-btn" style="margin-right: auto;">
            🔄 Terapkan Jadwal ke Minggu Depan
          </button>
          <button type="button" class="btn btn-outline" id="cancel-review-btn">Tutup</button>
          <button type="button" class="btn btn-primary" id="save-review-btn">💾 Simpan Evaluasi</button>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const closeBtn = this.modalEl.querySelector('#close-review-btn');
    const cancelBtn = this.modalEl.querySelector('#cancel-review-btn');
    const saveBtn = this.modalEl.querySelector('#save-review-btn');
    const applyNextBtn = this.modalEl.querySelector('#apply-next-week-btn');

    closeBtn?.addEventListener('click', () => this.close());
    cancelBtn?.addEventListener('click', () => this.close());

    applyNextBtn?.addEventListener('click', () => {
      if (confirm('Apakah Anda ingin menduplikasi dan menyesuaikan jadwal minggu ini untuk minggu berikutnya?')) {
        if (this.onApplyNextWeek) {
          this.onApplyNextWeek(this.selectedDate);
        }
        this.close();
      }
    });

    saveBtn?.addEventListener('click', () => {
      const wins = this.modalEl.querySelector('#ref-wins-input')?.value.trim();
      const bottlenecks = this.modalEl.querySelector('#ref-bottlenecks-input')?.value.trim();
      const improvements = this.modalEl.querySelector('#ref-next-input')?.value.trim();

      this.reviewData.reflections = {
        wins,
        bottlenecks,
        improvementsNextWeek: improvements
      };
      this.reviewData.updatedAt = new Date().toISOString();

      if (this.onSaveReview) {
        this.onSaveReview(this.reviewData);
      }
      alert('Evaluasi mingguan berhasil disimpan!');
      this.close();
    });
  }
}
