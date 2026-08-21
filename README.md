# Kalender Pribadi Dinamis & Evaluasi Mingguan (Al-Bayan Goalpara)

Aplikasi Web Kalender Produktivitas Pribadi berbasis **Vanilla JavaScript (ES6+)** dan **Offline-First**, dirancang khusus dengan sinkronisasi waktu sholat otomatis (SMA Albayan Goalpara, Sukabumi), alokasi jadwal mengambang berbasis rasio waktu produktivitas 80:10:10, pencatatan varians eksekusi harian (*On Time, Earlier, Delayed, Rescheduled, Cancelled*), serta dashboard evaluasi retrospektif mingguan.

---

## 🌟 Fitur Utama

1. **Dynamic Prayer-Time Anchoring (SMA Albayan Goalpara)**:
   - Hisab astronomi posisi matahari *offline* 100% (standar Kemenag RI / SIHAT: Subuh 20°, Isya 18°, Ihtiyat 2 menit).
   - Sinkronisasi tugas khusus:
     - **Imam Subuh:** Senin & Kamis (Adzan + 15m, 30m).
     - **Imam Maghrib:** Selasa (Adzan + 15m, 30m).
     - **Imam Isya:** Ahad (Adzan + 5m, 15m).
     - **Muadzin Maghrib:** Ahad (Adzan - 5m, 10m).
     - **Muadzin Ashar:** Sabtu (Adzan - 5m, 10m).

2. **Smart Slot Generator (Rasio Waktu 80 : 10 : 10)**:
   - Penempatan otomatis kebiasaan harian (*Qur'an Muraja'ah & Ziyadah*, *Bayyinah 60m*, *Coding 2x40m*, *Chess 2x20m*, *Kurikulum 20m*, dan *Prepare Slots*) di jeda waktu kosong tanpa tabrakan waktu (*0 Collisions*).
   - Indikator pemantau rasio waktu mingguan (*Productive*, *Rest*, *Flexible*).

3. **Fast Execution & Variance Logger**:
   - Modal interaktif 1-klik untuk mencatat status riil:
     - `[✓] Tepat Waktu`
     - `[⚡] Lebih Cepat (-X menit)`
     - `[⏰] Terlambat / Molor (+X menit)`
     - `[🔄] Reschedule`
     - `[✕] Batal / Skip` (+ pilihan alasan cepat & catatan khusus)

4. **Weekly Retrospective & Evaluation Dashboard**:
   - Analisis kepatuhan jadwal (*On-Time Rate %*, kegiatan lebih cepat, telat, dan batal).
   - Form refleksi kualitatif mingguan (*Wins*, *Bottlenecks*, *Penyesuaian Minggu Depan*).
   - Tombol *Apply / Clone Schedule to Next Week*.

5. **3 Mode Tampilan & Kategori Interaktif**:
   - **Mingguan (Grid 7 Kolom)** dengan *real-time red indicator line*.
   - **Harian (Fokus)** untuk kemudahan pencatatan eksekusi.
   - **Agenda (List)** untuk ringkasan terstruktur.
   - Filter cepat kategori & Mode Gelap / Terang.

6. **Offline-First & Zero-Backend**:
   - Penyimpanan lokal via `IndexedDB` & `localStorage`.
   - Backup & Restore penuh melalui format berkas JSON.

---

## 🚀 Cara Menjalankan

Aplikasi ini tidak memerlukan build tools (Webpack/Vite/dll.) dan langsung dapat dijalankan di browser apa pun:

```bash
# Clone repositori
git clone https://github.com/fakhri24/kalender-pribadi.git
cd kalender-pribadi

# Jalankan server lokal sederhana
python3 -m http.server 8000
# atau
npx serve
```

Buka peramban di `http://localhost:8000`.

---

## 📁 Struktur Berkas

```text
kalender-pribadi/
├── index.html              # Single Page Application
├── AGENTS.md               # System & development guidelines
├── PLAN.md                 # Implementation specifications & roadmap
├── README.md               # Dokumentasi proyek
├── css/
│   ├── main.css            # Base styles, navbar, toolbar
│   ├── calendar.css        # Timegrid, day/week views, event blocks
│   ├── modal.css           # Logger popup, event editor, evaluation modals
│   └── theme.css           # CSS variables, colors, glassmorphism
└── js/
    ├── app.js              # Coordinator & initialization
    ├── config/             # Constants & Goalpara coordinates
    ├── core/               # Prayer engine, smart scheduler, storage
    ├── models/             # Event, ExecutionLog, WeeklyReview
    ├── ui/                 # CalendarView, LoggerModal, EventEditor, ReviewView
    └── utils/              # Date utilities & JSON backup/restore
```

---

## 📄 Lisensi

MIT License © 2026 Fakhri
