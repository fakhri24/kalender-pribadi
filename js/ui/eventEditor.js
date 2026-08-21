/**
 * Event Editor Modal Component
 * Allows creating new events or updating existing events, prayer anchors, and categories
 */

import { CATEGORIES } from '../config/constants.js';
import { CalendarEvent } from '../models/Event.js';
import { formatDate, timeToMinutes } from '../utils/dateUtils.js';

export class EventEditorModal {
  constructor(modalElement, onSaveCallback, onDeleteCallback) {
    this.modalEl = modalElement;
    this.onSave = onSaveCallback;
    this.onDelete = onDeleteCallback;
    this.currentEvent = null;
    this.isNew = false;
  }

  open(event = null, defaultDate = null) {
    if (event) {
      this.currentEvent = event;
      this.isNew = false;
    } else {
      this.isNew = true;
      const d = defaultDate ? formatDate(defaultDate) : formatDate(new Date());
      this.currentEvent = new CalendarEvent({
        date: d,
        dayOfWeek: new Date(d).getDay(),
        startTime: '08:00',
        endTime: '09:00',
        durationMinutes: 60,
        category: 'habit',
        title: ''
      });
    }
    this.render();
    this.modalEl.classList.add('open');
  }

  close() {
    this.modalEl.classList.remove('open');
  }

  render() {
    const evt = this.currentEvent;
    const isNew = this.isNew;

    let categoryOptions = '';
    Object.values(CATEGORIES).forEach(cat => {
      categoryOptions += `<option value="${cat.id}" ${evt.category === cat.id ? 'selected' : ''}>${cat.name}</option>`;
    });

    this.modalEl.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">${isNew ? 'Tambah Jadwal Baru' : 'Edit Detail Jadwal'}</h3>
          <button class="modal-close-btn" id="close-editor-btn">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Nama Kegiatan / Pelajaran</label>
            <input type="text" id="evt-title-input" class="form-input" placeholder="Contoh: Mengajar X-3 MTU" value="${evt.title || ''}" required>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Kategori</label>
              <select id="evt-cat-select" class="form-select">
                ${categoryOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Tanggal</label>
              <input type="date" id="evt-date-input" class="form-input" value="${evt.date || formatDate(new Date())}">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Jam Mulai (HH:mm)</label>
              <input type="time" id="evt-start-input" class="form-input" value="${evt.startTime}">
            </div>
            <div class="form-group">
              <label class="form-label">Jam Selesai (HH:mm)</label>
              <input type="time" id="evt-end-input" class="form-input" value="${evt.endTime}">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Deskripsi / Keterangan</label>
            <textarea id="evt-desc-input" class="form-textarea" rows="2" placeholder="Catatan lokasi ruang kelas, materi, atau topik...">${evt.description || ''}</textarea>
          </div>

          <div class="form-group" style="display: flex; flex-direction: row; gap: 10px; align-items: center; background: var(--bg-hover); padding: 10px; border-radius: var(--radius-md);">
            <input type="checkbox" id="evt-locked-check" ${evt.isLocked ? 'checked' : ''} style="width: 18px; height: 18px;">
            <div>
              <label for="evt-locked-check" style="font-weight: 600; font-size: 0.85rem; cursor: pointer;">Kunci Jadwal (Fixed Anchor)</label>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Jadwal terkunci tidak akan otomatis digeser oleh generator smart slot.</div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          ${!isNew ? `
            <button type="button" class="btn btn-danger btn-sm" id="delete-evt-btn" style="margin-right: auto;">
              🗑️ Hapus
            </button>
          ` : ''}
          <button type="button" class="btn btn-outline" id="cancel-editor-btn">Batal</button>
          <button type="button" class="btn btn-primary" id="save-editor-btn">💾 Simpan Perubahan</button>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const closeBtn = this.modalEl.querySelector('#close-editor-btn');
    const cancelBtn = this.modalEl.querySelector('#cancel-editor-btn');
    const saveBtn = this.modalEl.querySelector('#save-editor-btn');
    const deleteBtn = this.modalEl.querySelector('#delete-evt-btn');

    closeBtn?.addEventListener('click', () => this.close());
    cancelBtn?.addEventListener('click', () => this.close());

    deleteBtn?.addEventListener('click', () => {
      if (confirm(`Apakah Anda yakin ingin menghapus jadwal "${this.currentEvent.title}"?`)) {
        if (this.onDelete && this.currentEvent) {
          this.onDelete(this.currentEvent.id);
        }
        this.close();
      }
    });

    saveBtn?.addEventListener('click', () => {
      const title = this.modalEl.querySelector('#evt-title-input')?.value.trim();
      if (!title) {
        alert('Mohon masukkan nama kegiatan!');
        return;
      }

      const category = this.modalEl.querySelector('#evt-cat-select')?.value;
      const date = this.modalEl.querySelector('#evt-date-input')?.value;
      const startTime = this.modalEl.querySelector('#evt-start-input')?.value;
      const endTime = this.modalEl.querySelector('#evt-end-input')?.value;
      const description = this.modalEl.querySelector('#evt-desc-input')?.value.trim();
      const isLocked = this.modalEl.querySelector('#evt-locked-check')?.checked;

      const durationMinutes = timeToMinutes(endTime) - timeToMinutes(startTime);

      this.currentEvent.title = title;
      this.currentEvent.category = category;
      this.currentEvent.date = date;
      this.currentEvent.dayOfWeek = new Date(date).getDay();
      this.currentEvent.startTime = startTime;
      this.currentEvent.endTime = endTime;
      this.currentEvent.durationMinutes = Math.max(5, durationMinutes);
      this.currentEvent.description = description;
      this.currentEvent.isLocked = isLocked;
      this.currentEvent.color = CATEGORIES[category.toUpperCase()]?.color || '#2563EB';

      if (this.onSave) {
        this.onSave(this.currentEvent, this.isNew);
      }
      this.close();
    });
  }
}
