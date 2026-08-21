/**
 * Cloud Settings, Firebase Auth & Gemini API Key Modal
 * Allows connecting Firebase project, Google Sign-In, Cloud Sync, and Gemini AI credentials
 */

import { firebaseService } from '../core/firebase.js';
import { storage, STORES } from '../core/storage.js';

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
    const geminiKey = localStorage.getItem('kp_gemini_api_key') || '';
    const user = firebaseService.currentUser;
    const isCloudActive = firebaseService.isSyncActive();

    this.modalEl.innerHTML = `
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.3rem;">⚙️</span>
            <h3 class="modal-title">Pengaturan Cloud Sync & Asisten AI</h3>
          </div>
          <button class="modal-close-btn" id="close-settings-btn">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Cloud Sync Status Card -->
          <div style="background: var(--bg-hover); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
              <div style="flex: 1; min-width: 200px;">
                <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                  ${isCloudActive ? '☁️ Cloud Sync Aktif (Multi-Device)' : '💾 Mode Penyimpanan Lokal (Offline)'}
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                  ${user ? `Terhubung sebagai: <strong>${user.displayName || user.email}</strong>` : 'Masuk dengan Google untuk sinkronisasi otomatis antar laptop & HP.'}
                </div>
                ${!firebaseService.isInitialized ? `
                  <div style="font-size: 0.76rem; color: #D97706; margin-top: 4px; font-weight: 600;">
                    ⚠️ Konfigurasi Firebase belum aktif di perangkat ini.
                  </div>
                ` : ''}
              </div>

              <div>
                ${user ? `
                  <button type="button" class="btn btn-outline btn-sm" id="google-logout-btn">
                    Keluar (Logout)
                  </button>
                ` : `
                  <button type="button" class="btn btn-primary btn-sm" id="google-login-btn">
                    🔑 Masuk dengan Google
                  </button>
                `}
              </div>
            </div>

            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color); display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
              ${isCloudActive ? `
                <button type="button" class="btn btn-sm btn-success" id="push-to-cloud-btn">
                  ⬆️ Unggah Data Lokal ke Cloud
                </button>
                <button type="button" class="btn btn-sm btn-outline" id="pull-from-cloud-btn">
                  ⬇️ Ambil Data dari Cloud ke Device Ini
                </button>
              ` : ''}
              ${savedConfig ? `
                <button type="button" class="btn btn-sm btn-outline" id="share-setup-btn" title="Salin tautan setup untuk langsung membuka konfigurasi di HP tanpa mengetik manual">
                  📲 Salin Link Setup untuk HP
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Gemini AI API Key Section -->
          <div class="form-group" style="margin-top: 4px;">
            <label class="form-label" style="display: flex; justify-content: space-between;">
              <span>🤖 Gemini AI API Key (Google AI Studio)</span>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color: var(--accent-primary); font-size: 0.78rem; text-decoration: none;">
                Dapatkan API Key Gratis ↗
              </a>
            </label>
            <input type="password" id="gemini-key-input" class="form-input" placeholder="AIzaSy..." value="${geminiKey}">
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">
              API key ini digunakan untuk fitur <strong>Asisten AI Chatbot</strong> (penjadwalan & evaluasi otomatis lewat obrolan). Disimpan privat di browser Anda.
            </div>
          </div>

          <!-- Gemini Model Selector -->
          <div class="form-group" style="margin-top: 4px;">
            <label class="form-label">
              <span>🧠 Model Gemini</span>
            </label>
            <select id="gemini-model-select" class="form-input">
              <option value="" ${!localStorage.getItem('kp_gemini_model_name') ? 'selected' : ''}>⚡ Otomatis (Rekomendasi: Gemini 3.5 Flash Lite - 500 RPD)</option>
              <option value="gemini-3.5-flash-lite" ${localStorage.getItem('kp_gemini_model_name') === 'gemini-3.5-flash-lite' ? 'selected' : ''}>gemini-3.5-flash-lite (500 Request/Hari • Cepat & Ringan)</option>
              <option value="gemini-3.1-flash-lite" ${localStorage.getItem('kp_gemini_model_name') === 'gemini-3.1-flash-lite' ? 'selected' : ''}>gemini-3.1-flash-lite (500 Request/Hari)</option>
              <option value="gemini-3.6-flash" ${localStorage.getItem('kp_gemini_model_name') === 'gemini-3.6-flash' ? 'selected' : ''}>gemini-3.6-flash (20 Request/Hari • Penalaran Penuh)</option>
              <option value="gemini-3.7-flash" ${localStorage.getItem('kp_gemini_model_name') === 'gemini-3.7-flash' ? 'selected' : ''}>gemini-3.7-flash (20 Request/Hari)</option>
              <option value="gemini-3.5-flash" ${localStorage.getItem('kp_gemini_model_name') === 'gemini-3.5-flash' ? 'selected' : ''}>gemini-3.5-flash (20 Request/Hari)</option>
              <option value="gemini-2.5-flash" ${localStorage.getItem('kp_gemini_model_name') === 'gemini-2.5-flash' ? 'selected' : ''}>gemini-2.5-flash (20 Request/Hari)</option>
              <option value="gemini-2.5-flash-lite" ${localStorage.getItem('kp_gemini_model_name') === 'gemini-2.5-flash-lite' ? 'selected' : ''}>gemini-2.5-flash-lite (20 Request/Hari)</option>
            </select>
          </div>

          <!-- Firebase Project Config JSON -->
          <div class="form-group" style="margin-top: 4px;">
            <label class="form-label" style="display: flex; justify-content: space-between;">
              <span>🔥 Konfigurasi Firebase (firebaseConfig)</span>
              <a href="https://console.firebase.google.com" target="_blank" style="color: var(--accent-primary); font-size: 0.78rem; text-decoration: none;">
                Buka Firebase Console ↗
              </a>
            </label>
            <textarea id="firebase-config-input" class="form-textarea" rows="6" placeholder='{\n  "apiKey": "AIzaSy...",\n  "authDomain": "project-id.firebaseapp.com",\n  "projectId": "project-id",\n  "storageBucket": "project-id.appspot.com",\n  "messagingSenderId": "...",\n  "appId": "..."\n}'>${configJson}</textarea>
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">
              Tempel (*paste*) objek <code>firebaseConfig</code> dari Project Settings di Firebase Console. Pastikan <strong>Authentication (Google Provider)</strong> dan <strong>Cloud Firestore</strong> sudah diaktifkan di console.
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="cancel-settings-btn">Tutup</button>
          <button type="button" class="btn btn-primary" id="save-settings-btn">💾 Simpan Konfigurasi</button>
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
    const shareSetupBtn = this.modalEl.querySelector('#share-setup-btn');

    closeBtn?.addEventListener('click', () => this.close());
    cancelBtn?.addEventListener('click', () => this.close());

    // Share Setup Link to Mobile
    shareSetupBtn?.addEventListener('click', () => {
      const cfg = firebaseService.getSavedConfig();
      const geminiKey = localStorage.getItem('kp_gemini_api_key') || '';
      const geminiModel = localStorage.getItem('kp_gemini_model_name') || '';

      if (!cfg) {
        alert('Simpan konfigurasi Firebase terlebih dahulu sebelum membagikan link setup.');
        return;
      }

      const payload = { fc: cfg };
      if (geminiKey) payload.gk = geminiKey;
      if (geminiModel) payload.gm = geminiModel;

      const encoded = encodeURIComponent(btoa(JSON.stringify(payload)));
      const url = `${window.location.origin}${window.location.pathname}#setup=${encoded}`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          alert('✅ Link Setup HP Berhasil Disalin!\n\nKirim link ini ke WhatsApp/Telegram, lalu buka di browser HP Anda (Chrome/Safari). Konfigurasi Firebase & AI akan langsung terpasang otomatis dan Anda bisa langsung login Google!');
        }).catch(() => {
          prompt('Salin link setup berikut dan buka di browser HP Anda:', url);
        });
      } else {
        prompt('Salin link setup berikut dan buka di browser HP Anda:', url);
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
          alert('⚠️ Konfigurasi Firebase belum diisi di perangkat ini!\n\nCara mudah mengaktifkan login Google di HP:\n1. Buka Kalender di Laptop tempat Anda sudah setup, buka menu "Cloud & AI", klik "📲 Salin Link Setup untuk HP", lalu kirim & buka link tersebut di HP ini; ATAU\n2. Tempel objek firebaseConfig di kolom bawah ini lalu klik "Simpan Konfigurasi".');
          configInput?.focus();
          configInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          configInput?.classList.add('highlight-pulse');
          setTimeout(() => configInput?.classList.remove('highlight-pulse'), 2500);
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
      alert('Berhasil keluar. Aplikasi kembali ke mode lokal.');
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
      if (confirm('Data dari cloud akan digabungkan ke penyimpanan lokal device ini. Lanjutkan?')) {
        const res = await storage.pullAllFromCloud();
        if (res) {
          alert(`Sukses menarik ${res.eventsCount} jadwal dari Firestore!`);
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

      // Save Firebase Config
      if (configStr) {
        try {
          // Handle object assignment syntax like "const firebaseConfig = { ... };"
          let jsonClean = configStr;
          if (jsonClean.includes('=')) {
            jsonClean = jsonClean.substring(jsonClean.indexOf('{'), jsonClean.lastIndexOf('}') + 1);
          }
          const parsed = JSON.parse(jsonClean);
          const success = await firebaseService.init(parsed);
          if (success) {
            alert('Konfigurasi Firebase & Gemini berhasil disimpan!');
          } else {
            alert('Konfigurasi Firebase tersimpan, namun inisialisasi gagal. Periksa format API Key & Project ID.');
          }
        } catch (e) {
          alert('Format JSON Firebase tidak valid. Pastikan formatnya adalah JSON objek yang benar.');
          return;
        }
      } else {
        firebaseService.saveConfig(null);
        alert('Pengaturan berhasil diperbarui.');
      }

      this.close();
      if (this.onStateChange) this.onStateChange();
    });
  }
}
