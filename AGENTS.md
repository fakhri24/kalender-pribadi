# AGENTS.md - System & Development Guidelines

Dokumen ini berisi panduan arsitektur, prinsip desain, konvensi kode, dan standar implementasi untuk proyek **Kalender Pribadi Dinamis, Evaluasi Mingguan & Asisten AI Copilot (Al-Bayan Goalpara)**.

---

## 1. Project Overview & Core Philosophy

Aplikasi ini adalah **Kalender Produktivitas Pribadi Berbasis Web (Offline-First & Multi-Device Cloud Sync)** yang dirancang untuk:
1. **Dynamic Prayer-Time Anchoring**: Sinkronisasi jadwal otomatis terhadap 5 waktu sholat harian berdasarkan koordinat astronomi matahari (SMA Albayan Goalpara, Sukabumi):
   - **Aturan Khusus Ashar**: Senin–Jum'at adzan Ashar tepat pukul **15:40 WIB** (ba'da KBM selesai), Sabtu–Ahad mengikuti astronomis normal.
   - **Standarisasi Maghrib**: Durasi sholat & dzikir petang disetarakan dengan Subuh (**30 menit**).
   - **Tugas Khusus Masjid**:
     - *Tugas Imam* (Subuh 30m, Maghrib 30m, Isya 25m): Mulai tepat adzan dengan durasi sholat berjamaah & dzikir.
     - *Tugas Muadzin* (Ashar Sabtu 30m, Maghrib Ahad 35m): Mulai Adzan - 5 menit mencakup persiapan/adzan dan sholat berjamaah.
2. **Hybrid Scheduling**: Menggabungkan *Fixed Anchors* (mengajar MTU/PM, KBM Tahfidz, Privat Matematika, tidur, makan, kelas malam) dengan *Floating Habits* (Qur'an, Bayyinah, Coding, Chess, Kurikulum, dll.) berdasarkan target rasio waktu:
   - **80% Waktu Produktif**
   - **10% Waktu Istirahat (Rest)**
   - **10% Waktu Fleksibel (Buffer, mobilitas, refleksi)**
3. **Real-time Execution & Variance Logging**: Pencatatan riil eksekusi harian (Tepat waktu, Lebih cepat -Xm, Terlambat +Xm, Reschedule, Batal + alasan).
4. **Weekly Retrospective & Adaptive Feedback**: Evaluasi mingguan untuk meninjau ketercapaian, menganalisis pola keterlambatan/batal, dan merefleksikan penyesuaian jadwal minggu berikutnya.
5. **Conversational AI Assistant (Copilot)**: Asisten AI interaktif (Google Gemini dengan *Function Calling/Tools*) untuk membaca jadwal, mengecek agenda terdekat real-time WIB, memodifikasi slot, mencatat eksekusi, dan melakukan coaching produktivitas langsung dari chat.
6. **Multi-Device Cloud Sync**: Sinkronisasi instan antar-perangkat (Laptop, Tablet, Smartphone) menggunakan Cloud Firestore dengan *Persistent Offline Cache* dan Google Authentication.

---

## 2. Tech Stack & Architectural Principles

- **Core Framework**: Pure **Vanilla JavaScript (ES6+ Modules)**, Semantic HTML5, dan Modern CSS (Clean Glassmorphism UI dengan Dark/Light Theme).
- **Zero-Build Mandatory**: Aplikasi berjalan langsung di browser tanpa build pipeline wajib (dapat di-host statis melalui GitHub Pages / Firebase Hosting).
- **Storage & Synchronization Layer**:
  - `localStorage` & `IndexedDB` untuk state persisten lokal offline.
  - **Firebase Modular SDK (v10+)**: Firebase Authentication (Google Sign-In dengan *Popup + Mobile Redirect Fallback*) & Cloud Firestore (`users/{uid}/events`, `users/{uid}/execution_logs`, `users/{uid}/weekly_reviews`).
  - **Firestore Persistent Multi-Tab Cache**: Tetap bekerja 100% tanpa internet dan otomatis sinkron saat online.
  - **Cross-Device Instant Setup**: Enkripsi payload konfigurasi URL `#setup=...` untuk kemudahan sinkronisasi laptop ke HP tanpa ketik manual.
  - Full **Export/Import JSON** untuk backup, migrasi offline, dan arsip riwayat mingguan.
- **Cache-Buster & Version Management Engine**:
  - **Single Source of Truth (`version.json`)**: Deteksi update otomatis membaca `version.json` langsung dari server tanpa duplikasi string hardcode di file JS (`getAppVersion()`).
  - **Query-String Versioning**: Tag aset CSS & JS dinamis (`?v=1.0.9`) untuk memotong cache usang browser.
  - **One-Click Cache Purge**: Pembersihan `CacheStorage` dan *force reload* instan dari UI Pengaturan.
- **AI Intelligence & Tool Calling Engine**:
  - **Google Gemini API (v1beta)**: Model default `gemini-3.5-flash-lite` (kuota 500 RPD), `gemini-3.1-flash-lite`, dan `gemini-3.6-flash`.
  - **Function Calling Tools**: `get_current_and_upcoming_schedule`, `get_daily_schedule`, `update_event_time`, `add_custom_event`, `delete_event`, `log_event_execution`, `get_weekly_productivity_summary`.
  - **Real-time WIB Clock Lock**: Jam real-time presisi WIB (Asia/Jakarta, UTC+7) disuntikkan di setiap giliran prompt.
- **Prayer Calculation Engine**:
  - Perhitungan matematis astronomi offline (rumus standar Kemenag RI / SIHAT: Subuh 20°, Isya 18°, zona waktu WIB / UTC+7).
  - Koordinat Default: **SMA Albayan Goalpara, Sukabumi** (Lat: `-6.877°`, Long: `106.965°`, Elevasi: ~800m dpl).
- **Offline & PWA Ready**: Berjalan 100% tanpa internet.

---

## 3. Directory Structure

```text
kalender-pribadi/
├── index.html              # Single Page Application entry point (anti-cache headers & query versioning)
├── version.json            # Version release tracking metadata for auto-update detection
├── firebase.json           # Firebase Hosting anti-cache headers configuration
├── AGENTS.md               # Development & system guidelines
├── PLAN.md                 # Detailed implementation phases & specifications
├── README.md               # User & project documentation
├── css/
│   ├── main.css            # Base design system, update banner, typography, resets, ribbons
│   ├── calendar.css        # Timegrid, day/week views, compact cards, time clipping
│   ├── modal.css           # Event edit, logger popup, evaluation, settings modals (mobile touch scroll)
│   ├── aiDrawer.css        # AI Copilot floating button & slide-over chat drawer
│   └── theme.css           # Colors, dark/light theme, category badges
├── js/
│   ├── app.js              # Main application coordinator, update listener & state initialization
│   ├── config/
│   │   ├── constants.js    # Master schedule templates, category configs
│   │   └── coordinates.js  # Location data (Albayan Goalpara)
│   ├── core/
│   │   ├── prayerEngine.js # Mathematical calculation of dynamic prayer times
│   │   ├── scheduler.js    # Rule-based auto-placement & overlap resolver
│   │   ├── storage.js      # Hybrid IndexedDB + Firestore sync data layer
│   │   ├── firebase.js     # Firebase Auth (Popup + Redirect fallback) & Cloud Firestore layer
│   │   └── aiAssistant.js  # Gemini API client, tool declarations & execution
│   ├── models/
│   │   ├── Event.js        # Event entity & recurrence definitions
│   │   ├── ExecutionLog.js # Daily actual log (variance, status, notes)
│   │   └── WeeklyReview.js # Retrospective evaluation structure
│   ├── ui/
│   │   ├── calendarView.js # Weekly / daily / agenda grid renderer
│   │   ├── loggerModal.js  # Fast execution status & note modal
│   │   ├── eventEditor.js  # Create/edit/delete event modal
│   │   ├── reviewView.js   # Weekly evaluation & analytics dashboard
│   │   ├── settingsModal.js# Firebase config, Google Auth, Share HP Link, Gemini Key & Cache purge modal
│   │   └── aiChatDrawer.js # AI Copilot chat drawer & interactive prompt UI
│   └── utils/
│       ├── dateUtils.js    # Date math, formatting, WIB calculations
│       ├── exportImport.js # JSON export, import, migration helper
│       └── versionChecker.js# Auto-update detector & cache-buster engine
└── assets/
    └── icons/              # SVG icons
```

---

## 4. Code Quality & Agent Rules

1. **Modular & Single Responsibility**: Setiap modul JS hanya bertanggung jawab atas satu domain (misal: `prayerEngine.js` kalkulasi sholat, `aiAssistant.js` interaksi LLM & tools, `firebase.js` cloud sync, `versionChecker.js` deteksi update).
2. **State Immutability & Rehydration**: Objek yang dibaca dari `IndexedDB`/Firestore harus selalu direhidrasi melalui constructor model (misal `CalendarEvent.fromJSON(e)`).
3. **Deterministic Event IDs**: Seluruh event hasil auto-generate wajib menggunakan ID deterministik (`evt_YYYY-MM-DD_templateId` / `flt_YYYY-MM-DD_habitId`) untuk mencegah duplikasi data pada sinkronisasi.
4. **Time & Precision**: Semua manipulasi waktu internal menggunakan format menit sejak tengah malam (*minutes from midnight: 0–1439*) dan dikonversi dengan zona waktu WIB (*Asia/Jakarta*).
5. **Mobile & Desktop Responsive**: Kalender nyaman dilihat di smartphone (tampilan Harian / Agenda / Chat Drawer full) maupun di laptop/desktop (Time Grid 7 Kolom).
6. **Zero-Stale-Cache Guarantee**: Setiap rilis baru wajib menaikkan versi pada `version.json` dan query string aset di `index.html`. Engine `versionChecker.js` menggunakan `version.json` sebagai *Single Source of Truth* tanpa duplikasi hardcode di JS.
