/**
 * Cloud Settings, Firebase Auth & Gemini API Key Modal
 * Allows connecting Firebase project, Google Sign-In, Cloud Sync, and Gemini AI credentials
 */

import { firebaseService } from '../core/firebase.js';
import { storage, STORES } from '../core/storage.js';
import { getAppVersion, forceReloadApp } from '../utils/versionChecker.js';

export class SettingsModal {
  constructor(modalElement, onStateChangeCallback) {
    this.modalEl = modalElement;
    this.onStateChange = onStateChangeCallback;
  }

  open() {
    this.render();
    this.modalEl.classList.add('open');
  }

  close() {
    this.modalEl.classList.remove('open');
  }

  render() {
    const savedConfig = firebaseService.getSavedConfig();
    const configJson = savedConfig ? JSON.stringify(savedConfig, null, 2) : '';
    const geminiCustomKey = localStorage.getItem('kp_gemini_api_key') || '';
    const user = firebaseService.currentUser;
    const isCloudActive = firebaseService.isSyncActive();
    const isFirebaseInit = firebaseService.isInitialized;
    const isEmbeddedAvailable = firebaseService.isEmbeddedConfigAvailable();
    const activeProjectId = firebaseService.getProjectId();

    this.modalEl.innerHTML = `
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.3rem;">⚙️</span>
            <h3 class="modal-title">Pengaturan Cloud & Asisten AI</h3>
          </div>
          <button class="modal-close-btn" id="close-settings-btn">&times;</button>
        </div>

        <div class="modal-body">
          <!-- 1. Cloud Firestore & Google Auth Card -->
          <div style="background: var(--bg-hover); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
              <div style="flex: 1; min-width: 220px;">
                <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                  ${isCloudActive ? '☁️ Cloud Sync Aktif (Multi-Device)' : '💾 Mode Penyimpanan Lokal'}
                  ${isCloudActive ? '<span style="font-size: 0.72rem; background: rgba(16, 185, 129, 0.15); color: #10B981; padding: 2px 8px; border-radius: 999px; font-weight: 700;">LIVE SYNC</span>' : ''}
                </div>
                <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px; line-height: 1.4;">
                  ${user ? `
                    Terhubung sebagai: <strong>${user.displayName || user.email}</strong> (${user.email})
                    ${activeProjectId ? `<br><small style="color: var(--text-muted);">Firestore Project: <code>${activeProjectId}</code></small>` : ''}
                  ` : `
                    Masuk dengan akun Google untuk sinkronisasi otomatis jadwal, log eksekusi, dan evaluasi antar Laptop, Tablet, dan Smartphone.
                  `}
                </div>
                ${!isFirebaseInit ? `
                  <div style="font-size: 0.78rem; color: #D97706; margin-top: 6px; font-weight: 600;">
                    ⚠️ Konfigurasi Firebase belum terdeteksi. Silakan lengkapi <code>js/config/credentials.js</code> atau menu Lanjutan.
                  </div>
                ` : ''}
              </div>

              <div>
                ${user ? `
                  <button type="button" class="btn btn-outline btn-sm" id="google-logout-btn">
                    Keluar (Logout)
                  </button>
                ` : `
                  <button type="button" class="btn btn-primary" id="google-login-btn">
                    🔑 Masuk dengan Google
                  </button>
                `}
              </div>
            </div>

            ${isCloudActive ? `
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color); display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                <button type="button" class="btn btn-sm btn-success" id="push-to-cloud-btn">
                  ⬆️ Unggah Data Lokal ke Cloud
                </button>
                <button type="button" class="btn btn-sm btn-outline" id="pull-from-cloud-btn">
                  ⬇️ Ambil Data dari Cloud ke Device Ini
                </button>
              </div>
            ` : ''}
          </div>

          <!-- 2. Gemini AI Copilot Section -->
          <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
              <span style="font-size: 0.92rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                🤖 Asisten AI Copilot (Google Gemini)
              </span>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color: var(--accent-primary); font-size: 0.78rem; text-decoration: none; font-weight: 600;">
                Dapatkan API Key Gratis ↗
              </a>
            </div>

            <div class="form-group">
              <label class="form-label" style="display: flex; justify-content: space-between;">
                <span>API Key (Google AI Studio)</span>
                ${geminiCustomKey ? '<span style="color: #10B981; font-size: 0.74rem;">● Menggunakan Kunci Kustom</span>' : (isEmbeddedAvailable ? '<span style="color: #3B82F6; font-size: 0.74rem;">● Menggunakan Kunci Bawaan (Embedded)</span>' : '')}
              </label>
              <input type="password" id="gemini-key-input" class="form-input" placeholder="${isEmbeddedAvailable ? '•••••••••••••••• (Kunci Bawaan Aktif)' : 'AIzaSy...'}" value="${geminiCustomKey}">
              <div style="font-size: 0.74rem; color: var(--text-muted);">
                Kosongkan jika ingin menggunakan kredensial bawaan internal (<code>credentials.js</code>).
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">
                <span>Model AI</span>
              </label>
              <select id="gemini-model-select" class="form-input">
                <option value="" ${!localStorage.getItem('kp_gemini_model_name') ? 'selected' : ''}>⚡ Otomatis (Rekomendasi: Gemini 3.5 Flash Lite - Kuota 500 RPD)</option>
                <option value="gemini-3.5-flash-lite" ${localStorage.getItem('kp_gemini_model_name') === 'gemini-3.5-flash-lite' ? 'selected' : ''}>gemini-3.5-flash-lite (500 Request/Hari • Cepat & Ringan)</option>
                <option value="gemini-3.1-flash-lite" ${localStorage.getItem('kp_gemini_model_name') === 'gemini-3.1-flash-lite' ? 'selected' : ''}>gemini-3.1-flash-lite (500 Request/Hari)</option>
                <option value="gemini-3.6-flash" ${localStorage.getItem('kp_gemini_model_name') === 'gemini-3.6-flash' ? 'selected' : ''}>gemini-3.6-flash (20 Request/Hari • Penalaran Penuh)</option>
                <option value="gemini-3.7-flash" ${localStorage.getItem('kp_gemini_model_name') === 'gemini-3.7-flash' ? 'selected' : ''}>gemini-3.7-flash (20 Request/Hari)</option>
                <option value="gemini-3.5-flash" ${localStorage.getItem('kp_gemini_model_name') === 'gemini-3.5-flash' ? 'selected' : ''}>gemini-3.5-flash (20 Request/Hari)</option>
                <option value="gemini-2.5-flash" ${localStorage.getItem('kp_gemini_model_name') === 'gemini-2.5-flash' ? 'selected' : ''}>gemini-2.5-flash (20 Request/Hari)</option>
                <option value="gemini-2.5-flash-lite" ${localStorage.getItem('kp_gemini_model_name') === 'gemini-2.5-flash-lite' ? 'selected' : ''}>gemini-2.5-flash-lite (20 Request/Hari)</option>
              </select>
            </div>
          </div>

          <!-- 3. Collapsible Advanced Settings (Optional Firebase Override) -->
          <details style="background: var(--bg-hover); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 10px 14px;">
            <summary style="font-size: 0.82rem; font-weight: 600; cursor: pointer; color: var(--text-secondary); user-select: none;">
              ⚙️ Pengaturan Lanjutan (Override Firebase Config)
            </summary>
            <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 6px;">
              <textarea id="firebase-config-input" class="form-textarea" rows="4" style="font-size: 0.8rem; font-family: monospace;" placeholder='{\n  "apiKey": "AIzaSy...",\n  "projectId": "..."\n}'>${configJson}</textarea>
              <div style="font-size: 0.74rem; color: var(--text-muted);">
                Opsional: Isi kolom ini hanya jika Anda ingin menimpa (*override*) konfigurasi Firebase bawaan dengan konfigurasi kustom sendiri.
              </div>
            </div>
          </details>
        </div>

        <div class="modal-footer" style="justify-content: space-between; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <button type="button" class="btn btn-outline btn-sm" id="force-update-btn" title="Bersihkan cache browser dan muat ulang aplikasi ke versi terbaru">
              🔄 Bersihkan Cache & Update
            </button>
            <span style="font-size: 0.74rem; color: var(--text-muted); font-weight: 600;">v${getAppVersion()}</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-outline" id="cancel-settings-btn">Tutup</button>
            <button type="button" class="btn btn-primary" id="save-settings-btn">💾 Simpan Perubahan</button>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const closeBtn = this.modalEl.querySelector('#close-settings-btn');
    const cancelBtn = this.modalEl.querySelector('#cancel-settings-btn');
    const saveBtn = this.modalEl.querySelector('#save-settings-btn');
    const loginBtn = this.modalEl.querySelector('#google-login-btn');
    const logoutBtn = this.modalEl.querySelector('#google-logout-btn');
    const pushCloudBtn = this.modalEl.querySelector('#push-to-cloud-btn');
    const pullCloudBtn = this.modalEl.querySelector('#pull-from-cloud-btn');
    const forceUpdateBtn = this.modalEl.querySelector('#force-update-btn');

    closeBtn?.addEventListener('click', () => this.close());
    cancelBtn?.addEventListener('click', () => this.close());

    // Force clear cache and update app
    forceUpdateBtn?.addEventListener('click', async () => {
      if (confirm('Aplikasi akan membersihkan cache browser dan memuat ulang versi terbaru dari server. Lanjutkan?')) {
        await forceReloadApp();
      }
    });

    // Google Login
    loginBtn?.addEventListener('click', async () => {
      const configInput = this.modalEl.querySelector('#firebase-config-input');
      const configStr = configInput?.value.trim();

      // If Firebase is not yet initialized, check if config is provided in textarea
      if (!firebaseService.isInitialized) {
        if (configStr) {
          try {
            let jsonClean = configStr;
            if (jsonClean.includes('=')) {
              jsonClean = jsonClean.substring(jsonClean.indexOf('{'), jsonClean.lastIndexOf('}') + 1);
            }
            const parsed = JSON.parse(jsonClean);
            const success = await firebaseService.init(parsed);
            if (!success) {
              alert('⚠️ Konfigurasi Firebase tidak valid. Pastikan format JSON benar.');
              configInput?.focus();
              return;
            }
          } catch (e) {
            alert('⚠️ Format JSON Firebase tidak valid. Pastikan formatnya adalah JSON objek yang benar.');
            configInput?.focus();
            return;
          }
        } else {
          alert('⚠️ Konfigurasi Firebase belum terpasang!\n\nMasukkan firebaseConfig di js/config/credentials.js atau tempel di menu Lanjutan.');
          return;
        }
      }

      try {
        if (loginBtn) {
          loginBtn.disabled = true;
          loginBtn.innerHTML = '🔄 Menghubungkan...';
        }

        const user = await firebaseService.loginWithGoogle();
        if (user) {
          alert(`Berhasil masuk sebagai ${user.displayName || user.email}! Cloud Sync kini aktif.`);
          this.render();
          if (this.onStateChange) this.onStateChange();
        }
      } catch (err) {
        console.error('Google login error:', err);
        let msg = err.message || 'Terjadi kesalahan saat login.';
        if (err.code === 'auth/unauthorized-domain') {
          msg = `Domain "${window.location.hostname}" belum didaftarkan di Firebase Console (Authentication > Settings > Authorized Domains).\n\nTambahkan domain ini ke daftar Authorized Domains di Firebase Console.`;
        }
        alert(`Gagal login Google: ${msg}`);
        if (loginBtn) {
          loginBtn.disabled = false;
          loginBtn.innerHTML = '🔑 Masuk dengan Google';
        }
      }
    });

    // Google Logout
    logoutBtn?.addEventListener('click', async () => {
      await firebaseService.logout();
      alert('Berhasil keluar. Aplikasi kembali ke mode penyimpanan lokal.');
      this.render();
      if (this.onStateChange) this.onStateChange();
    });

    // Push local to cloud
    pushCloudBtn?.addEventListener('click', async () => {
      try {
        const events = await storage.getAll(STORES.EVENTS);
        const logs = await storage.getAll(STORES.LOGS);
        const reviews = await storage.getAll(STORES.REVIEWS);

        await firebaseService.syncLocalToCloud({ events, logs, reviews });
        alert(`Sinkronisasi sukses! ${events.length} jadwal berhasil diunggah ke Firestore.`);
      } catch (err) {
        alert(`Gagal sinkronisasi ke cloud: ${err.message}`);
      }
    });

    // Pull cloud to local
    pullCloudBtn?.addEventListener('click', async () => {
      if (confirm('Data dari Cloud Firestore akan ditarik dan disinkronkan ke perangkat ini. Lanjutkan?')) {
        const res = await storage.pullAllFromCloud();
        if (res) {
          alert(`Sukses menarik ${res.eventsCount} jadwal dari Cloud Firestore!`);
          if (this.onStateChange) this.onStateChange();
        } else {
          alert('Tidak dapat menarik data dari cloud atau cloud masih kosong.');
        }
      }
    });

    // Save Configs
    saveBtn?.addEventListener('click', async () => {
      const configStr = this.modalEl.querySelector('#firebase-config-input')?.value.trim();
      const geminiKey = this.modalEl.querySelector('#gemini-key-input')?.value.trim();

      // Save Gemini Key & Model
      const modelSelect = this.modalEl.querySelector('#gemini-model-select')?.value;
      if (modelSelect) {
        localStorage.setItem('kp_gemini_model_name', modelSelect);
      } else {
        localStorage.removeItem('kp_gemini_model_name');
      }

      if (geminiKey) {
        localStorage.setItem('kp_gemini_api_key', geminiKey);
      } else {
        localStorage.removeItem('kp_gemini_api_key');
      }

      // Save Firebase Config override if entered
      if (configStr) {
        try {
          let jsonClean = configStr;
          if (jsonClean.includes('=')) {
            jsonClean = jsonClean.substring(jsonClean.indexOf('{'), jsonClean.lastIndexOf('}') + 1);
          }
          const parsed = JSON.parse(jsonClean);
          const success = await firebaseService.init(parsed);
          if (success) {
            alert('Pengaturan berhasil diperbarui!');
          } else {
            alert('Konfigurasi Firebase tersimpan, namun inisialisasi gagal. Periksa format API Key & Project ID.');
          }
        } catch (e) {
          alert('Format JSON Firebase tidak valid. Pastikan formatnya adalah JSON objek yang benar.');
          return;
        }
      } else {
        firebaseService.saveConfig(null);
        firebaseService.autoInitialize();
        alert('Pengaturan berhasil diperbarui.');
      }

      this.close();
      if (this.onStateChange) this.onStateChange();
    });
  }
}
