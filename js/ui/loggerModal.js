/**
 * Execution Logger Modal Component
 * Fast 1-click execution tracker for marking On Time, Earlier, Delayed, Rescheduled, or Cancelled + Notes
 */

import { EXECUTION_STATUS, CATEGORIES } from '../config/constants.js';

export class LoggerModal {
  constructor(modalElement, onSaveCallback, onEditEventCallback) {
    this.modalEl = modalElement;
    this.onSave = onSaveCallback;
    this.onEditEvent = onEditEventCallback;
    this.currentEvent = null;
    this.selectedStatus = 'ON_TIME';
    this.varianceMinutes = 0;
  }

  open(event) {
    this.currentEvent = event;
    this.selectedStatus = event.status === 'PLANNED' ? 'ON_TIME' : event.status;
    this.varianceMinutes = event.varianceMinutes || 0;
    this.render();
    this.modalEl.classList.add('open');
  }

  close() {
    this.modalEl.classList.remove('open');
  }

  render() {
    if (!this.currentEvent) return;

    const evt = this.currentEvent;
    const catObj = CATEGORIES[evt.category.toUpperCase()] || CATEGORIES.HABIT;

    this.modalEl.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${evt.color || catObj.color};"></span>
            <h3 class="modal-title">Pencatatan Eksekusi</h3>
          </div>
          <button class="modal-close-btn" id="close-logger-btn">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Event Summary Info -->
          <div style="background: var(--bg-hover); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">
              ${evt.title}
            </div>
            <div style="font-size: 0.82rem; color: var(--text-secondary); display: flex; gap: 12px; flex-wrap: wrap;">
              <span>📅 ${evt.date}</span>
              <span>⏰ ${evt.startTime} - ${evt.endTime} (${evt.durationMinutes} menit)</span>
              <span style="font-weight: 600; color: ${catObj.color};">${catObj.name}</span>
            </div>
          </div>

          <!-- Status Grid Selection -->
          <div class="form-group">
            <label class="form-label">Status Pelaksanaan Riil</label>
            <div class="status-grid">
              <button type="button" class="status-choice-btn choice-ontime ${this.selectedStatus === 'ON_TIME' ? 'active' : ''}" data-status="ON_TIME">
                <span>✓</span> Tepat Waktu
              </button>
              <button type="button" class="status-choice-btn choice-earlier ${this.selectedStatus === 'EARLIER' ? 'active' : ''}" data-status="EARLIER">
                <span>⚡</span> Lebih Cepat
              </button>
              <button type="button" class="status-choice-btn choice-delayed ${this.selectedStatus === 'DELAYED' ? 'active' : ''}" data-status="DELAYED">
                <span>⏰</span> Terlambat
              </button>
              <button type="button" class="status-choice-btn choice-rescheduled ${this.selectedStatus === 'RESCHEDULED' ? 'active' : ''}" data-status="RESCHEDULED">
                <span>🔄</span> Reschedule
              </button>
              <button type="button" class="status-choice-btn choice-cancelled ${this.selectedStatus === 'CANCELLED' ? 'active' : ''}" data-status="CANCELLED">
                <span>✕</span> Batal / Skip
              </button>
            </div>
          </div>

          <!-- Dynamic Variance Input (Only if Earlier or Delayed) -->
          <div id="variance-section" style="display: ${this.selectedStatus === 'EARLIER' || this.selectedStatus === 'DELAYED' ? 'block' : 'none'};">
            <div class="form-group">
              <label class="form-label" id="variance-label">
                ${this.selectedStatus === 'EARLIER' ? 'Mulai / Selesai Lebih Cepat (Menit)' : 'Terlambat / Molor (Menit)'}
              </label>
              <input type="number" id="variance-input" class="form-input" value="${Math.abs(this.varianceMinutes) || (this.selectedStatus === 'EARLIER' ? 10 : 15)}" min="1" max="180">
              <div class="variance-pills" style="margin-top: 6px;">
                <button type="button" class="var-pill" data-val="5">± 5 menit</button>
                <button type="button" class="var-pill" data-val="10">± 10 menit</button>
                <button type="button" class="var-pill" data-val="15">± 15 menit</button>
                <button type="button" class="var-pill" data-val="20">± 20 menit</button>
                <button type="button" class="var-pill" data-val="30">± 30 menit</button>
              </div>
            </div>
          </div>

          <!-- Reason Input (For Cancelled, Delayed, or Rescheduled) -->
          <div id="reason-section" style="display: ${this.selectedStatus !== 'ON_TIME' ? 'block' : 'none'};">
            <div class="form-group">
              <label class="form-label">Alasan / Kendala Terjadi</label>
              <select id="reason-dropdown" class="form-select" style="margin-bottom: 6px;">
                <option value="">-- Pilih Kategori Alasan Cepat --</option>
                <option value="Tugas mendadak / insidental sekolah">Tugas mendadak / insidental sekolah</option>
                <option value="Kelelahan fisik / butuh istirahat ekstra">Kelelahan fisik / butuh istirahat ekstra</option>
                <option value="Tamu / koordinasi santri & guru">Tamu / koordinasi santri & guru</option>
                <option value="Koneksi internet / kendala teknis">Koneksi internet / kendala teknis</option>
                <option value="Selesai materi lebih awal">Selesai materi lebih awal</option>
                <option value="Lainnya">Lainnya (tulis di bawah)</option>
              </select>
              <input type="text" id="reason-custom-input" class="form-input" placeholder="Tulis alasan spesifik..." value="${evt.reason || ''}">
            </div>
          </div>

          <!-- Notes / Short Reflection Field -->
          <div class="form-group">
            <label class="form-label">Catatan & Keterangan Tambahan</label>
            <textarea id="notes-input" class="form-textarea" rows="2" placeholder="Contoh: Diskusi materi trigonometri bab 2 tuntas, perlu latihan soal tambahan minggu depan...">${evt.notes || ''}</textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="edit-details-btn" style="margin-right: auto;">
            ✏️ Edit Detail Jadwal
          </button>
          <button type="button" class="btn btn-outline" id="cancel-logger-btn">Batal</button>
          <button type="button" class="btn btn-primary" id="save-logger-btn">💾 Simpan Status</button>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const closeBtn = this.modalEl.querySelector('#close-logger-btn');
    const cancelBtn = this.modalEl.querySelector('#cancel-logger-btn');
    const saveBtn = this.modalEl.querySelector('#save-logger-btn');
    const editDetailsBtn = this.modalEl.querySelector('#edit-details-btn');
    
    closeBtn?.addEventListener('click', () => this.close());
    cancelBtn?.addEventListener('click', () => this.close());

    // Status Button Switchers
    const statusBtns = this.modalEl.querySelectorAll('.status-choice-btn');
    statusBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        statusBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedStatus = btn.getAttribute('data-status');
        this.updateDynamicSections();
      });
    });

    // Variance Quick Pills
    const varPills = this.modalEl.querySelectorAll('.var-pill');
    const varInput = this.modalEl.querySelector('#variance-input');
    varPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const val = pill.getAttribute('data-val');
        if (varInput) varInput.value = val;
      });
    });

    // Reason dropdown auto-fill
    const reasonDropdown = this.modalEl.querySelector('#reason-dropdown');
    const reasonCustom = this.modalEl.querySelector('#reason-custom-input');
    reasonDropdown?.addEventListener('change', (e) => {
      if (e.target.value && e.target.value !== 'Lainnya') {
        reasonCustom.value = e.target.value;
      }
    });

    // Edit full details handler
    editDetailsBtn?.addEventListener('click', () => {
      this.close();
      if (this.onEditEvent && this.currentEvent) {
        this.onEditEvent(this.currentEvent);
      }
    });

    // Save Status Handler
    saveBtn?.addEventListener('click', () => {
      const varVal = Number(varInput?.value) || 0;
      let finalVariance = 0;
      if (this.selectedStatus === 'EARLIER') finalVariance = -Math.abs(varVal);
      if (this.selectedStatus === 'DELAYED') finalVariance = Math.abs(varVal);

      const reason = reasonCustom?.value.trim() || '';
      const notes = this.modalEl.querySelector('#notes-input')?.value.trim() || '';

      if (this.onSave && this.currentEvent) {
        this.onSave(this.currentEvent, {
          status: this.selectedStatus,
          varianceMinutes: finalVariance,
          reason,
          notes
        });
      }
      this.close();
    });
  }

  updateDynamicSections() {
    const varSection = this.modalEl.querySelector('#variance-section');
    const varLabel = this.modalEl.querySelector('#variance-label');
    const reasonSection = this.modalEl.querySelector('#reason-section');

    if (this.selectedStatus === 'EARLIER' || this.selectedStatus === 'DELAYED') {
      if (varSection) varSection.style.display = 'block';
      if (varLabel) {
        varLabel.textContent = this.selectedStatus === 'EARLIER' ? 'Mulai / Selesai Lebih Cepat (Menit)' : 'Terlambat / Molor (Menit)';
      }
    } else {
      if (varSection) varSection.style.display = 'none';
    }

    if (this.selectedStatus !== 'ON_TIME') {
      if (reasonSection) reasonSection.style.display = 'block';
    } else {
      if (reasonSection) reasonSection.style.display = 'none';
    }
  }
}
