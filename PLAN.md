# PLAN.md - Rencana Implementasi & Spesifikasi Kalender Pribadi

Dokumen ini memuat spesifikasi jadwal terperinci, model data, algoritma penjadwalan dinamis, integrasi Cloud Firestore, serta arsitektur Asisten AI Copilot.

---

## 1. Spesifikasi Master Jadwal (Al-Bayan Goalpara)

### A. Lokasi & Waktu Sholat (Dynamic Anchors)
- **Lokasi**: SMA Albayan Goalpara, Desa Sukamekar, Kec. Sukaraja, Kab. Sukabumi
- **Koordinat**: `Latitude: -6.877°`, `Longitude: 106.965°`, `Timezone: Asia/Jakarta (UTC+7, WIB)`
- **Metode**: Kemenag RI (Subuh 20°, Isya 18°, Ihtiyat 2 menit)
- **Aturan Khusus Waktu Sholat Al-Bayan**:
  - **Dzuhur (Senin–Sabtu)**: Adzan dikunci minimal pukul **12:00 WIB** (ba'da KBM selesai). Jika waktu astronomis lebih dari 12:00 maka mengikuti astronomis aslinya. Hari Ahad mengikuti astronomis murni.
  - **Ashar (Senin–Jum'at)**: Adzan dikunci tepat pukul **15:40 WIB** (ba'da KBM selesai), sholat 15:40 – 16:05 (25m). Sabtu & Ahad mengikuti astronomis matahari (~15:18 WIB).
  - **Maghrib**: Durasi sholat & dzikir petang disetarakan dengan Subuh (**30 menit**).
- **Tugas Khusus Masjid**:
  - **Imam Subuh**: Senin & Kamis (Mulai = Adzan Subuh, durasi 30 menit)
  - **Imam Maghrib**: Selasa (Mulai = Adzan Maghrib, durasi 30 menit)
  - **Imam Isya**: Ahad (Mulai = Adzan Isya, durasi 25 menit)
  - **Muadzin Ashar**: Sabtu (Mulai = Adzan Ashar - 5 menit, total durasi 30 menit)
  - **Muadzin Maghrib**: Ahad (Mulai = Adzan Maghrib - 5 menit, total durasi 35 menit)
  - **Sholat 5 Waktu Harian**: Slot otomatis sholat berjamaah & dzikir/rawatib.

---

### B. Rutinitas Tetap (Fixed Daily Anchors)
- **Tidur (Sleep)**: **20.45 – 03.45** (Konsisten 7 jam setiap hari).
- **Bangun & Mandi Pagi**: **03.45 – 04.15** (Mandi 04.00, 15 menit).
- **Mandi Sore**: **17.15 – 17.30** (15 menit).
- **Makan (Eating)**:
  - Pagi: **05.40 – 06.00** (Senin, Selasa, Rabu, Jum'at, Sabtu ba'da KBM/Piket Subuh; Ahad ba'da Takhosus: **06.30 – 06.50**; Kamis: Ditiadakan karena Shaum).
  - Siang: **13.00 – 13.20** (Senin, Selasa, Rabu, Sabtu, Ahad; Jum'at: **12.25 – 12.45**; Kamis: Ditiadakan karena Shaum).
  - Sore / Malam: **17.30 – 17.50** (Ahad, Senin, Selasa, Rabu, Jum'at, Sabtu; Kamis: Buka Shaum ba'da Maghrib).
- **Champion Squad (7x5x10 menit)**:
  - **CS 1 (Pagi)**: **06.00 – 06.10** (Senin s.d. Sabtu) & **06.50 – 07.00** (Ahad)
  - **CS 2**: 09.00 / 09.40 / 10.20 (menyesuaikan sela jadwal KBM)
  - **CS 3**: 12.30 (ba'da Dzuhur) / Jum'at 13.25 (ba'da Mentoring 2)
  - **CS 4**: 15.00
  - **CS 5**: 18.30 (Senin, Rabu, Sabtu, Ahad), 18.50 (Kamis ba'da Buka Shaum), 19.30 (Selasa & Jum'at ba'da Isya)

---

### C. Jadwal Mengajar, Kelas & Mentoring (Fixed Academic/Club Slots)
- **Senin**:
  - 05.10 – 05.40: KBM Tahfidz XI.MIPA-2 (30m, Ba'da Subuh)
  - 05.40 – 06.00: Sarapan Pagi (20m)
  - 07.40 – 09.00: X-3 MTU (80m)
  - 09.00 – 10.20: X-1 MTU (80m)
  - 10.40 – 12.00: X-2 MTU (80m)
  - 14.20 – 15.00: X-3 PM (40m)
  - 16.15 – 17.15: Chess Club (60m)
  - 20.00 – 20.45: Additional Night Class (45m)
- **Selasa**:
  - 05.10 – 05.40: Piket Subuh (30m, Ba'da Subuh)
  - 05.40 – 06.00: Sarapan Pagi (20m)
  - 16.15 – 17.15: Math Olympiad (60m)
  - 18.29 – 19.05: KBM Tahfidz XI.MIPA-2 (Ba'da Maghrib s.d. Isya)
  - 19.45 – 20.45: Privat Matematika (Salma & Ghina) (60m)
- **Rabu**:
  - 05.09 – 05.39: KBM Tahfidz XI.MIPA-2 (30m, Ba'da Subuh)
  - 05.40 – 06.00: Sarapan Pagi (20m)
  - 16.15 – 17.15: Additional Evening Class (60m)
  - 19.45 – 20.45: Takhosus Tahfidz (60m)
- **Kamis (Shaum Sunnah)**:
  - 04.19 – 04.39: Sahur Shaum Sunnah (20m, 20m sebelum Adzan Subuh)
  - 04.39 – 05.09: 🕌 Tugas Imam Subuh (30m)
  - 05.09 – 05.19: Dzikir Al-Ma'tsurat Pagi (10m)
  - 07.00 – 08.20: X-2 MTU (80m)
  - 08.20 – 09.40: X-3 MTU (80m)
  - 10.40 – 12.00: X-1 MTU (80m)
  - 17.53 – 17.58: Takjil Buka Shaum (5m, saat Adzan Maghrib)
  - 17.58 – 18.28: Sholat Maghrib & Dzikir Petang (30m)
  - 18.28 – 18.48: Buka Shaum (Makan Malam) (20m)
  - 18.50 – 19.00: Champion Squad 5 (Ba'da Buka Shaum) (10m)
  - 20.00 – 20.15: Takhosus Tahfidz (15m)
- **Jum'at**:
  - 07.40 – 08.20: X-2 PM (40m)
  - 10.40 – 11.20: X-1 PM (40m)
  - 11.20 – 12.00: Mentoring Sesi 1 (40m)
  - 12.00 – 12.25: 🕌 Sholat Jum'at Berjamaah (25m)
  - 12.25 – 12.45: Makan Siang (20m)
  - 12.45 – 13.25: Mentoring Sesi 2 (40m)
  - 13.25 – 13.35: Champion Squad 3 (Ba'da Mentoring 2) (10m)
  - 16.15 – 17.15: Matriculation Numeration Class (60m)
  - 18.28 – 19.04: KBM Tahfidz XI.MIPA-2 (Ba'da Maghrib s.d. Isya)
  - 20.00 – 20.45: Additional Night Class (45m)
- **Sabtu**:
  - 05.08 – 05.38: Piket Subuh (30m, Ba'da Subuh)
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
Target alokasi mingguan untuk slot fleksibel/mandiri (Rasio 80:10:10):
1. **Prepare Teaching Time**: 20–30 menit per hari aktif mengajar (Senin, Kamis, Jum'at, Sabtu + Minggu malam) = ~120–150 menit/minggu.
2. **Prepare Chess Club**: 30 menit (Senin 15.30 – 16.00).
3. **Prepare Math Olympiad**: 2x60 menit (Selasa & Sabtu).
4. **Kurikulum Time + Incidental**: 7x20 menit (20 menit setiap hari).
5. **Qur'an Time (Muraja'ah + Ziyadah)**: 7x2x30 menit (Ba'da Subuh & Ba'da Maghrib/Isya).
6. **Bayyinah Time**: 7x60 menit (Slot belajar terfokus harian, 06.30–07.30).
7. **Coding Time / Vibe Code**: 7x2x40 menit (Sesi 1 & 2 di slot produktif).
8. **Chess Time**: 7x2x20 menit (Sesi 1 subuh & Sesi 2 malam).
9. **Flexible / Buffer Time**: ~26% alokasi jeda/istirahat tak terduga.

---

## 2. Struktur Data & Model

### Event Model
```javascript
{
  id: "evt_2026-08-21_tpl_teach_1_1",
  templateId: "tpl_teach_1_1",
  title: "Mengajar X-3 MTU",
  category: "teaching", // "teaching" | "class" | "prayer" | "habit" | "prep" | "routine"
  date: "2026-08-21",
  dayOfWeek: 5,
  startTime: "07:40",
  endTime: "08:20",
  startMinutes: 460,
  endMinutes: 500,
  durationMinutes: 40,
  isDynamicPrayer: false,
  prayerAnchor: null,
  color: "#3B82F6",
  isLocked: true,
  status: "PLANNED",   // "PLANNED" | "ON_TIME" | "EARLIER" | "DELAYED" | "RESCHEDULED" | "CANCELLED"
  varianceMinutes: 0,
  reason: "",
  notes: ""
}
```

---

## 3. Tahapan Pengembangan & Status Progres

### Phase 1: Core Engine & Prayer Calculations `[DONE]`
- [x] Implementasi algoritma perhitungan waktu sholat offline standar Kemenag RI (Goalpara Sukabumi).
- [x] Pengujian presisi koordinat Sukabumi (Lat: -6.877°, Long: 106.965°, Elevasi: ~800m dpl).
- [x] Konfigurasi master schedule templates (Fixed, Floating, Rutinitas, Sholat, Tugas Imam/Muadzin).

### Phase 2: Calendar UI & Smart Slot Distribution `[DONE]`
- [x] Timegrid Kalender Mingguan (7 Kolom) & Harian Responsif.
- [x] Rule-based Smart Scheduler: menyebar floating habit secara proporsional dengan **0 collision**.
- [x] Density Switcher (Padat: 60px, Normal: 80px, Luas: 105px) dan kartu jadwal ringkas (≤25m).
- [x] Batas potong grid visual presisi (03:00 - 24:00) agar jadwal tidur tidak melompat.

### Phase 3: Real-time Execution & Variance Logger `[DONE]`
- [x] Modal interaktif 1-klik untuk status eksekusi:
  - `[✓] Tepat Waktu`
  - `[⚡] Lebih Cepat (-X menit)`
  - `[⏰] Terlambat (+X menit)`
  - `[🔄] Reschedule`
  - `[✕] Batal (Wajib alasan)`
- [x] Badge visual warna-warni pada kartu kegiatan untuk status eksekusi.

### Phase 4: Weekly Review & Retrospective Dashboard `[DONE]`
- [x] Real-time Ratio Tracker Bar (80% Produktif, 10% Istirahat, 10% Fleksibel).
- [x] Dashboard Evaluasi Mingguan (Analisis kepatuhan, Top Issues, Form Refleksi).
- [x] Tombol *Apply / Clone Schedule to Next Week*.

### Phase 5: Storage & Clean Slate Reset `[DONE]`
- [x] Hybrid Persistence layer (`IndexedDB` + `localStorage`).
- [x] Fitur Export JSON & Import JSON untuk arsip dan backup offline.
- [x] Tombol *⚡ Reset ke Default* dengan ID deterministik anti-duplikasi.

### Phase 6: Multi-Device Cloud Sync (Firebase Firestore & Auth) `[DONE]`
- [x] Integrasi Firebase Modular SDK (ESM) dengan *Persistent Multi-Tab Offline Cache*.
- [x] Google Authentication (1-Klik Sign-In) untuk kepemilikan data privat.
- [x] Sinkronisasi instan koleksi `events`, `execution_logs`, dan `weekly_reviews` ke Cloud Firestore.
- [x] Modal ⚙️ Cloud & AI untuk konfigurasi `firebaseConfig`, Gemini API Key, dan tombol sinkronisasi.

### Phase 7: Conversational AI Copilot (Google Gemini & Tools) `[DONE]`
- [x] Widget Floating Action Button & Slide-over Chat Drawer (`aiChatDrawer.js`, `aiDrawer.css`).
- [x] Integrasi Google Gemini API dengan auto-discovery model (`gemini-3.5-flash-lite` 500 RPD, `gemini-3.6-flash`).
- [x] Function Calling / Tool Calling Engine:
  - `get_current_and_upcoming_schedule` (Jadwal terdekat real-time WIB)
  - `get_daily_schedule` (Baca seluruh jadwal hari tertentu)
  - `update_event_time` (Geser / edit jadwal via chat)
  - `add_custom_event` (Tambah agenda dadakan)
  - `delete_event` (Hapus agenda)
  - `log_event_execution` (Catat status eksekusi & alasan)
  - `get_weekly_productivity_summary` (Coaching rasio 80:10:10)
- [x] Penguncian zona waktu presisi WIB (*Asia/Jakarta*) dengan metadata real-time di setiap percakapan.

### Phase 8: Mobile UX Resilience, Setup Sharing & Auto Cache-Buster Engine `[DONE]`
- [x] **Mobile Google Auth Resilience**: Integrasi fallback otomatis `signInWithPopup` -> `signInWithRedirect` dan pemrosesan `getRedirectResult` untuk mengatasi pemblokiran popup di browser HP (iOS Safari, Android Chrome, WebView).
- [x] **Instant Mobile Setup Sharing**: Fitur `📲 Salin Link Setup untuk HP` yang mengenkripsi konfigurasi Firebase & API key ke dalam URL hash (`#setup=...`) untuk setup instan tanpa input manual di HP.
- [x] **Auto-Version Checker**: Pemantauan rilis baru via `version.json` dengan notifikasi toast *update banner* otomatis saat tab aktif.
- [x] **Cache-Busting Architecture**: Implementasi query string versioning (`?v=1.0.11`), anti-cache meta tags, dan konfigurasi `firebase.json` headers.
- [x] **One-Click Cache Purge**: Tombol *🔄 Bersihkan Cache & Update* di menu pengaturan untuk menghapus `CacheStorage` dan memuat ulang kode terkini.

### Phase 9: Special Operational Rules, Academic Slot Additions & Single-Source Versioning `[DONE]`
- [x] **Aturan Khusus Dzuhur & Ashar Al-Bayan**: Penguncian adzan Dzuhur minimal 12:00 WIB (Senin–Sabtu selesai KBM) dan adzan Ashar 15:40 WIB (Senin–Jum'at selesai KBM).
- [x] **Standarisasi Maghrib & Tugas Masjid**: Durasi Maghrib 30 menit (sholat & dzikir petang), Imam Subuh/Maghrib 30m, Muadzin 30m/35m (Adzan - 5m).
- [x] **Penambahan Slot Akademik & Rutinitas Master**:
  - *Piket Subuh*: Selasa & Sabtu ba'da Subuh (30m).
  - *Privat Matematika (Salma & Ghina)*: Selasa 19:45 – 20:45 (60m).
  - *KBM Tahfidz XI.MIPA-2 (Subuh)*: Senin & Rabu ba'da Subuh (30m).
  - *KBM Tahfidz XI.MIPA-2 (Maghrib)*: Selasa & Jum'at ba'da Maghrib s.d. Isya dengan dukungan kalkulasi dinamis `endPrayer: 'isha'`.
- [x] **Refaktor Single Source of Truth Versioning**: `version.json` sebagai sumber kebenaran tunggal versi aplikasi tanpa duplikasi string manual di JS untuk mencegah banner looping.

### Phase 10: Dynamic Breakfast Anchoring & Thursday Fasting Routine `[DONE]`
- [x] **Sinkronisasi Sarapan Pagi (05:40 – 06:00)**: Penyelarasan sarapan langsung setelah selesai KBM Tahfidz Subuh (Senin & Rabu) atau Piket Subuh (Selasa & Sabtu), serta disetarakan pada hari Jum'at.
- [x] **Rutinitas Shaum Sunnah Hari Kamis**:
  - *Sahur*: 20 menit sebelum Adzan Subuh (`prayerAnchor: { prayer: 'fajr', offset: -20, duration: 20 }`).
  - *Dzikir Al-Ma'tsurat Pagi*: 10 menit ba'da Subuh (`prayerAnchor: { prayer: 'fajr', offset: 30, duration: 10 }`).
  - *Omit Breakfast & Lunch*: Penonaktifan otomatis slot sarapan dan makan siang pada hari Kamis.
  - *Takjil*: Membatalkan shaum saat Adzan Maghrib berkumandang (`prayerAnchor: { prayer: 'maghrib', offset: -5, duration: 5 }`).
  - *Buka Shaum (Makan Malam)*: Makan besar ba'da Sholat Maghrib (`prayerAnchor: { prayer: 'maghrib', offset: 30, duration: 20 }`).
  - *Champion Squad 5 (Kamis)*: Disesuaikan menjadi pukul 18:50 – 19:00 (ba'da Buka Shaum).

### Phase 11: Native Embedded Credentials, Seamless Cloud-First Storage & Streamlined Architecture `[DONE]`
- [x] **Native Embedded Credentials (`js/config/credentials.js`)**:
  - Menyimpan `firebaseConfig` dan `GEMINI_API_KEY` langsung di file konfigurasi lokal internal.
  - Mengintegrasikan `js/config/credentials.js` untuk auto-connect konfigurasi multi-device.
  - Menyediakan `js/config/credentials.example.js` sebagai template referensi repositori.
- [x] **Zero-Setup Multi-Device Auto-Connect**:
  - Saat aplikasi dibuka di perangkat manapun (laptop/HP/tablet), konfigurasi Firebase & AI langsung terhubung otomatis tanpa perlu *copy-paste* JSON config atau membuat link hash setup.
  - Begitu login dengan akun Google, seluruh data jadwal mingguan, catatan eksekusi, dan refleksi otomatis tersinkronisasi langsung dari Cloud Firestore secara *seamless*.
- [x] **Full Cloud-First Storage & UI Streamlining**:
  - Menjadikan Cloud Firestore sebagai *Single Primary Storage Layer* (didukung *Persistent Offline Cache* bawaan Firestore yang 100% tetap bekerja offline).
  - Menghapus fitur cadangan manual lama (Export/Import JSON) dari UI dan membersihkan menu pengaturan agar lebih ringkas, elegan, dan fokus.
  - Menghentikan/menghapus fitur generator link `#setup=...` karena seluruh perangkat otomatis sudah memiliki konfigurasi bawaan.



