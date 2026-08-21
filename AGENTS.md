# AGENTS.md - System & Development Guidelines

Dokumen ini berisi panduan arsitektur, prinsip desain, konvensi kode, dan standar implementasi untuk proyek **Kalender Pribadi Dinamis & Evaluasi Mingguan (Al-Bayan Goalpara)**.

---

## 1. Project Overview & Core Philosophy

Aplikasi ini adalah **Kalender Produktivitas Pribadi Berbasis Web (Offline-First)** yang dirancang untuk:
1. **Dynamic Prayer-Time Anchoring**: Sinkronisasi jadwal otomatis terhadap 5 waktu sholat harian berdasarkan koordinat geografis (SMA Albayan Goalpara, Sukabumi).
2. **Hybrid Scheduling**: Menggabungkan *Fixed Anchors* (mengajar, tidur, makan, kelas malam) dengan *Floating Habits* (Qur'an, Bayyinah, Coding, Chess, Kurikulum, dll.) berdasarkan target rasio waktu:
   - **80% Waktu Produktif**
   - **10% Waktu Istirahat (Rest)**
   - **10% Waktu Fleksibel (Buffer, mobilitas, refleksi)**
3. **Real-time Execution & Variance Logging**: Pencatatan riil eksekusi harian (Tepat waktu, Lebih cepat -Xm, Terlambat +Xm, Reschedule, Batal + alasan).
4. **Weekly Retrospective & Adaptive Feedback**: Evaluasi mingguan untuk meninjau ketercapaian, menganalisis pola keterlambatan/batal, dan merefleksikan penyesuaian jadwal minggu berikutnya.

---

## 2. Tech Stack & Architectural Principles

- **Core Framework**: Pure **Vanilla JavaScript (ES6+ Modules)**, Semantic HTML5, dan Modern CSS (Clean, Modern UI with Dark/Light Theme).
- **Zero-Build / Zero-Backend Mandatory**: Aplikasi berjalan langsung di browser tanpa build pipeline wajib (dapat di-host statis melalui GitHub Pages / Firebase Hosting).
- **Storage Layer**:
  - `localStorage` & `IndexedDB` untuk state persisten lokal.
  - Full **Export/Import JSON** untuk backup, migrasi antar perangkat, dan arsip riwayat mingguan.
- **Prayer Calculation Engine**:
  - Perhitungan matematis astronomi offline (rumus standar Kemenag / SIHAT: Subuh 20°, Isya 18°, zona waktu WIB / UTC+7).
  - Koordinat Default: **SMA Albayan Goalpara, Sukabumi** (Lat: `-6.877°`, Long: `106.965°`, Elevasi: ~800m dpl).
- **Offline & PWA Ready**: Berjalan 100% tanpa internet.

---

## 3. Directory Structure

```text
kalender-pribadi/
├── index.html              # Single Page Application entry point
├── AGENTS.md               # Development & system guidelines
├── PLAN.md                 # Detailed implementation phases & specifications
├── css/
│   ├── main.css            # Base design system, typography, resets
│   ├── calendar.css        # Timegrid, day/week views, event blocks
│   ├── modal.css           # Event edit, logger popup, evaluation modals
│   └── theme.css           # Colors, dark/light theme, category badges
├── js/
│   ├── app.js              # Main application coordinator & initialization
│   ├── config/
│   │   ├── constants.js    # Default schedule templates, category configs
│   │   └── coordinates.js  # Location data (Albayan Goalpara)
│   ├── core/
│   │   ├── prayerEngine.js # Mathematical calculation of dynamic prayer times
│   │   ├── scheduler.js    # Rule-based auto-placement for floating slots
│   │   └── storage.js      # IndexedDB / localStorage data access layer
│   ├── models/
│   │   ├── Event.js        # Event entity & recurrence definitions
│   │   ├── ExecutionLog.js # Daily actual log (variance, status, notes)
│   │   └── WeeklyReview.js # Retrospective evaluation structure
│   ├── ui/
│   │   ├── calendarView.js # Weekly / daily grid renderer
│   │   ├── loggerModal.js  # Fast execution status & note modal
│   │   ├── eventEditor.js  # Create/edit/drag event handler
│   │   └── reviewView.js   # Weekly evaluation & analytics dashboard
│   └── utils/
│       ├── dateUtils.js    # Date math, formatting, week calculations
│       └── exportImport.js # JSON export, import, migration helper
└── assets/
    └── icons/              # SVG icons
```

---

## 4. Code Quality & Agent Rules

1. **Modular & Single Responsibility**: Setiap modul JS hanya bertanggung jawab atas satu domain (misal: `prayerEngine.js` murni kalkulasi waktu sholat, `scheduler.js` murni alokasi slot).
2. **State Immutability**: Mutasi state jadwal dan execution log harus melalui method model atau store terpusat agar riwayat log tidak rusak.
3. **No External CDN Dependency at Runtime (Offline-First)**: Logika kalkulasi sholat, rendering kalender, dan ikon di-bundle lokal tanpa ketergantungan CDN eksternal.
4. **Time & Precision**: Semua manipulasi waktu menggunakan format menit sejak tengah malam (*minutes from midnight: 0–1439*) untuk memudahkan komparasi matematis dan deteksi tabrakan slot (*collision detection*).
5. **Mobile & Desktop Responsive**: Kalender harus nyaman dilihat di smartphone (tampilan Harian / Agenda) maupun di laptop/desktop (tampilan Mingguan / Time Grid 7 Kolom).
