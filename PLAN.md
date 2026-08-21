# PLAN.md - Rencana Implementasi & Spesifikasi Kalender Pribadi

Dokumen ini memuat spesifikasi jadwal terperinci, model data, algoritma penjadwalan dinamis, serta tahapan implementasi aplikasi kalender pribadi.

---

## 1. Spesifikasi Master Jadwal (Al-Bayan Goalpara)

### A. Lokasi & Waktu Sholat (Dynamic Anchors)
- **Lokasi**: SMA Albayan Goalpara, Desa Sukamekar, Kec. Sukaraja, Kab. Sukabumi
- **Koordinat**: `Latitude: -6.877°`, `Longitude: 106.965°`, `Timezone: Asia/Jakarta (UTC+7)`
- **Metode**: Kemenag RI (Subuh 20°, Isya 18°, Ihtiyat 2 menit)
- **Tugas Khusus Masjid**:
  - **Imam Subuh**: Senin & Kamis (Mulai = Waktu Adzan Subuh + 15 menit, durasi 30 menit)
  - **Imam Maghrib**: Selasa (Mulai = Waktu Adzan Maghrib + 15 menit, durasi 30 menit)
  - **Imam Isya**: Ahad (Mulai = Waktu Adzan Isya + 5 menit, durasi 15 menit)
  - **Muadzin Maghrib**: Ahad (Mulai = Waktu Adzan Maghrib - 5 menit, durasi 10 menit)
  - **Muadzin Ashar**: Sabtu (Mulai = Waktu Adzan Ashar - 5 menit, durasi 10 menit)
  - **Sholat 5 Waktu Harian**: Slot otomatis sholat berjamaah & dzikir/rawatib (~20-25 menit tiap waktu).

---

### B. Rutinitas Tetap (Fixed Daily Anchors)
- **Tidur (Sleep)**: **20.45 – 03.45** (Konsisten 7 jam setiap hari).
- **Bangun & Mandi Pagi**: **03.45 – 04.10** (Mandi 04.00, 10 menit).
- **Mandi Sore**: **17.15 – 17.25** (10 menit).
- **Makan (Eating)**: 3x sehari masing-masing 20 menit:
  - Pagi: **06.00 – 06.20**
  - Siang: **13.00 – 13.20**
  - Sore: **17.30 – 17.50**
- **Champion Squad (7x5x10 menit)**:
  - Titik dasar: 06.00, 09.00, 12.00, 15.00, 18.00.
  - *Penyesuaian saat jam mengajar*:
    - **Senin**: 06.00, **10.20** (ba'da X-1), 12.00, 15.00, 18.00
    - **Kamis**: 06.00, **09.40** (ba'da X-3), 12.00, 15.00, 18.00
    - **Sabtu**: 06.00, **09.40** (ba'da X-1), 12.00, 15.00, 18.00
    - Hari lain: 06.00, 09.00, 12.00, 15.00, 18.00

---

### C. Jadwal Mengajar, Kelas & Mentoring (Fixed Academic/Club Slots)
- **Senin**:
  - 07.40 – 09.00: X-3 MTU (80m)
  - 09.00 – 10.20: X-1 MTU (80m)
  - 10.40 – 12.00: X-2 MTU (80m)
  - 14.20 – 15.00: X-3 PM (40m)
  - 16.15 – 17.15: Chess Club (60m)
  - 20.00 – 20.45: Additional Night Class (45m)
- **Selasa**:
  - 16.15 – 17.15: Math Olympiad (60m)
- **Rabu**:
  - 16.15 – 17.15: Additional Evening Class (60m)
  - 19.45 – 20.45: Takhosus Tahfidz (60m)
- **Kamis**:
  - 07.00 – 08.20: X-2 MTU (80m)
  - 08.20 – 09.40: X-3 MTU (80m)
  - 10.40 – 12.00: X-1 MTU (80m)
  - 20.00 – 20.15: Takhosus Tahfidz (15m)
- **Jum'at**:
  - 07.40 – 08.20: X-2 PM (40m)
  - 10.40 – 11.20: X-1 PM (40m)
  - 11.20 – 12.00 & 12.45 – 13.25: Mentoring Time (2x40m)
  - 16.15 – 17.15: Matriculation Numeration Class (60m)
  - 20.00 – 20.45: Additional Night Class (45m)
- **Sabtu**:
  - 07.00 – 07.40: X-3 MTU (40m)
  - 08.20 – 09.00: X-2 MTU (40m)
  - 09.00 – 09.40: X-1 MTU (40m)
  - 10.20 – 12.00: AI Coder Time (100m)
  - 16.15 – 17.15: Math Olympiad (60m)
  - 19.45 – 20.00: Takhosus Tahfidz (15m)
- **Ahad**:
  - 05.30 – 06.30: Takhosus Tahfidz (60m)

---

### D. Rekomendasi Alokasi Floating Habit & Prep Slots
Target alokasi mingguan untuk slot fleksibel/mandiri:
1. **Prepare Teaching Time**: 20–30 menit per hari aktif mengajar (Senin, Kamis, Jum'at, Sabtu + Minggu malam) = ~120–150 menit/minggu.
2. **Prepare Chess Club**: 30 menit (Senin 15.30 – 16.00).
3. **Prepare Math Olympiad**: 2x60 menit (Selasa & Sabtu sebelum kelas atau di slot pagi).
4. **Kurikulum Time + Incidental**: 7x20 menit (20 menit setiap hari).
5. **Qur'an Time (Muraja'ah + Ziyadah)**: 7x2x30 menit (Ba'da Subuh & Ba'da Maghrib/Isya).
6. **Bayyinah Time**: 7x60 menit (Slot belajar terfokus harian, misal 04.30–05.30 pagi).
7. **Coding Time / Vibe Code**: 7x2x40 menit (Siang / Sore / Malam).
8. **Chess Time**: 7x2x20 menit (Jeda produktif / refresh otak).
9. **Flexible / Buffer Time**: 10% dari total waking hours (~12 jam seminggu untuk mobilitas, istirahat tak terduga, dan jeda antar-aktivitas).

---

## 2. Struktur Data & Model

### Event Model (Template / Recurring / Custom)
```javascript
{
  id: "evt_101",
  title: "X-3 MTU Teaching",
  category: "teaching", // "teaching" | "prayer" | "habit" | "prep" | "class" | "routine" | "rest" | "flexible"
  dayOfWeek: 1,         // 0: Ahad, 1: Senin, ..., 6: Sabtu
  startTime: "07:40",   // "HH:mm" atau dinamis "{fajr}+15"
  endTime: "09:00",
  durationMinutes: 80,
  isDynamicPrayer: false,
  prayerAnchor: null,   // null | { prayer: "fajr"|"dhuhr"|"asr"|"maghrib"|"isha", offset: 15 }
  color: "#3B82F6",
  isLocked: true        // true jika fixed anchor, false jika floating
}
```

### Execution Log Model (Daily Actual Tracker)
```javascript
{
  id: "log_20260821_evt_101",
  date: "2026-08-21",
  eventId: "evt_101",
  eventTitle: "X-3 MTU Teaching",
  plannedStartTime: "07:40",
  plannedEndTime: "09:00",
  status: "ON_TIME",    // "ON_TIME" | "EARLIER" | "DELAYED" | "RESCHEDULED" | "CANCELLED"
  varianceMinutes: 0,   // -10 (10 menit lebih cepat), +5 (5 menit telat), 0
  reason: "",           // Alasan jika batal, terlambat, lebih cepat, atau reschedule
  rescheduledTo: null,  // { date, startTime, endTime }
  evaluatedAt: "2026-08-21T09:05:00Z"
}
```

### Weekly Retrospective Model
```javascript
{
  weekId: "2026-W34",
  startDate: "2026-08-17",
  endDate: "2026-08-23",
  totalPlannedMinutes: 4200,
  totalExecutedMinutes: 3950,
  onTimeCount: 42,
  delayedCount: 4,
  earlierCount: 2,
  cancelledCount: 1,
  rescheduledCount: 3,
  categoryBreakdown: {
    productivePercent: 78.5,
    restPercent: 11.0,
    flexiblePercent: 10.5
  },
  reflections: {
    wins: "Target coding dan mengajar terlaksana 100%.",
    bottlenecks: "Senin siang sering kehabisan energi di slot PM.",
    improvementsNextWeek: "Tambahkan jeda nafas 10 menit sebelum kelas PM."
  }
}
```

---

## 3. Tahapan Pengembangan (Phased Roadmap)

### Phase 1: Core Engine & Prayer Calculations
- [ ] Implementasi algoritma perhitungan waktu sholat offline (Adhan calculation Kemenag).
- [ ] Pengujian presisi koordinat Sukabumi (Goalpara).
- [ ] Konfigurasi default master schedule (Fixed, Floating, Rutinitas, Sholat, Imam & Muadzin).

### Phase 2: Calendar UI & Smart Slot Distribution
- [ ] Timegrid Kalender (Tampilan Mingguan 7 Hari & Tampilan Harian Fokus).
- [ ] Smart Slot Generator: menyebar floating habit secara proporsional di slot kosong.
- [ ] Indikator visual warna kategori (Mengajar, Ibadah, Coding, Belajar, Istirahat, Fleksibel).
- [ ] Drag-and-drop & Manual Edit untuk penyesuaian cepat jadwal.

### Phase 3: Real-time Execution & Variance Logger
- [ ] Modal interaktif 1-klik untuk status eksekusi:
  - `[✓] Tepat Waktu`
  - `[⚡] Lebih Cepat (-X menit)`
  - `[⏰] Terlambat (+X menit)`
  - `[🔄] Reschedule (Ganti slot)`
  - `[✕] Batal / Skip (Wajib isi alasan)`
- [ ] Slot keterangan / log refleksi instan di setiap card jadwal.

### Phase 4: Weekly Review & Retrospective Dashboard
- [ ] Kalkulator rasio waktu riil (Productive % vs Rest % vs Flexible %).
- [ ] Ringkasan statistik kepatuhan jadwal mingguan (On-Time Rate, Top Delay Reasons).
- [ ] Form Refleksi Mingguan (Wins, Bottlenecks, Next Week Adjustments).
- [ ] Tombol *Apply / Clone Schedule to Next Week*.

### Phase 5: Persistence, Offline Support & Polish
- [ ] Penyimpanan lokal otomatis (`IndexedDB` & `localStorage`).
- [ ] Fitur Export JSON & Import JSON (Backup & Restore).
- [ ] Dark Mode / Light Mode toggle.
- [ ] Responsive styling (Desktop & Mobile view).
