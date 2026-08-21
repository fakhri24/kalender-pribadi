/**
 * Global Constants & Master Schedule Configuration
 */

export const CATEGORIES = {
  TEACHING: {
    id: 'teaching',
    name: 'Mengajar (MTU / PM)',
    color: '#2563EB',      // Blue
    textColor: '#FFFFFF',
    type: 'productive',
    icon: 'chalkboard-teacher'
  },
  CLASS: {
    id: 'class',
    name: 'Kelas / Club / Mentoring',
    color: '#7C3AED',      // Violet
    textColor: '#FFFFFF',
    type: 'productive',
    icon: 'users'
  },
  PREP: {
    id: 'prep',
    name: 'Persiapan (Prep)',
    color: '#0891B2',      // Cyan
    textColor: '#FFFFFF',
    type: 'productive',
    icon: 'book-open'
  },
  PRAYER: {
    id: 'prayer',
    name: 'Sholat & Tugas Masjid',
    color: '#059669',      // Emerald Green
    textColor: '#FFFFFF',
    type: 'productive',    // Spiritual productive
    icon: 'mosque'
  },
  HABIT: {
    id: 'habit',
    name: 'Floating Habits (Qur\'an, Bayyinah, Code, Chess)',
    color: '#D97706',      // Amber / Orange
    textColor: '#FFFFFF',
    type: 'productive',
    icon: 'star'
  },
  ROUTINE: {
    id: 'routine',
    name: 'Rutinitas Fisik (Makan, Mandi, Tidur)',
    color: '#4B5563',      // Slate / Grey
    textColor: '#FFFFFF',
    type: 'rest',
    icon: 'clock'
  },
  REST: {
    id: 'rest',
    name: 'Istirahat (Rest)',
    color: '#6B7280',      // Cool Grey
    textColor: '#FFFFFF',
    type: 'rest',
    icon: 'moon'
  },
  FLEXIBLE: {
    id: 'flexible',
    name: 'Waktu Fleksibel (Buffer / Refleksi)',
    color: '#10B981',      // Teal / Mint
    textColor: '#FFFFFF',
    type: 'flexible',
    icon: 'compass'
  }
};

export const EXECUTION_STATUS = {
  ON_TIME: {
    id: 'ON_TIME',
    label: 'Tepat Waktu',
    shortLabel: 'Tepat',
    color: '#10B981',
    badgeClass: 'status-ontime',
    icon: 'check-circle'
  },
  EARLIER: {
    id: 'EARLIER',
    label: 'Lebih Cepat',
    shortLabel: 'Cepat',
    color: '#3B82F6',
    badgeClass: 'status-earlier',
    icon: 'zap'
  },
  DELAYED: {
    id: 'DELAYED',
    label: 'Terlambat / Molor',
    shortLabel: 'Telat',
    color: '#F59E0B',
    badgeClass: 'status-delayed',
    icon: 'alert-circle'
  },
  RESCHEDULED: {
    id: 'RESCHEDULED',
    label: 'Di-reschedule',
    shortLabel: 'Pindah',
    color: '#8B5CF6',
    badgeClass: 'status-rescheduled',
    icon: 'refresh-cw'
  },
  CANCELLED: {
    id: 'CANCELLED',
    label: 'Batal / Skip',
    shortLabel: 'Batal',
    color: '#EF4444',
    badgeClass: 'status-cancelled',
    icon: 'x-circle'
  }
};

/**
 * Master Schedule Template definitions based on user's exact specification
 * dayOfWeek: 0: Ahad, 1: Senin, 2: Selasa, 3: Rabu, 4: Kamis, 5: Jum'at, 6: Sabtu
 */
export const MASTER_SCHEDULE_TEMPLATES = [
  // ==========================================
  // DAILY RECURRING FIXED ANCHORS (Everyday 0..6)
  // ==========================================
  // Sleep (20.45 - 03.45 next day)
  ...[0, 1, 2, 3, 4, 5, 6].map(day => ({
    templateId: `tpl_sleep_${day}`,
    title: 'Tidur Malam (7 Jam)',
    category: 'routine',
    dayOfWeek: day,
    startTime: '20:45',
    endTime: '23:59',
    durationMinutes: 195,
    isLocked: true,
    description: 'Waktu istirahat utama konsisten 7 jam'
  })),
  ...[0, 1, 2, 3, 4, 5, 6].map(day => ({
    templateId: `tpl_sleep_early_${day}`,
    title: 'Tidur Malam (Lanjutan)',
    category: 'routine',
    dayOfWeek: day,
    startTime: '00:00',
    endTime: '03:45',
    durationMinutes: 225,
    isLocked: true,
    description: 'Lanjutan tidur malam'
  })),

  // Bath Time (Pagi 04.00, Sore 17.15)
  ...[0, 1, 2, 3, 4, 5, 6].map(day => ({
    templateId: `tpl_bath_morning_${day}`,
    title: 'Mandi Pagi & Persiapan Subuh',
    category: 'routine',
    dayOfWeek: day,
    startTime: '04:00',
    endTime: '04:15',
    durationMinutes: 15,
    isLocked: true
  })),
  ...[0, 1, 2, 3, 4, 5, 6].map(day => ({
    templateId: `tpl_bath_afternoon_${day}`,
    title: 'Mandi Sore & Bersih Diri',
    category: 'routine',
    dayOfWeek: day,
    startTime: '17.15'.replace('.', ':'),
    endTime: '17:30',
    durationMinutes: 15,
    isLocked: true
  })),

  // Eating Time (06.00, 13.00, 17.30 - with Sunday & Friday overrides)
  ...[1, 2, 3, 4, 5, 6].map(day => ({
    templateId: `tpl_eat_breakfast_${day}`,
    title: 'Sarapan Pagi',
    category: 'routine',
    dayOfWeek: day,
    startTime: '06:00',
    endTime: '06:20',
    durationMinutes: 20,
    isLocked: true
  })),
  // Sunday Breakfast (after Takhosus Tahfidz 05.30 - 06.30)
  {
    templateId: 'tpl_eat_breakfast_0',
    title: 'Sarapan Pagi',
    category: 'routine',
    dayOfWeek: 0,
    startTime: '06:30',
    endTime: '06:50',
    durationMinutes: 20,
    isLocked: true
  },
  // Lunch (Senin, Selasa, Rabu, Kamis, Sabtu, Ahad: 13.00 - 13.20)
  ...[0, 1, 2, 3, 4, 6].map(day => ({
    templateId: `tpl_eat_lunch_${day}`,
    title: 'Makan Siang',
    category: 'routine',
    dayOfWeek: day,
    startTime: '13:00',
    endTime: '13:20',
    durationMinutes: 20,
    isLocked: true
  })),
  // Friday Lunch (12.25 - 12.45, ba'da Sholat Jum'at, sebelum Mentoring Sesi 2)
  {
    templateId: 'tpl_eat_lunch_5',
    title: 'Makan Siang',
    category: 'routine',
    dayOfWeek: 5,
    startTime: '12:25',
    endTime: '12:45',
    durationMinutes: 20,
    isLocked: true
  },
  // Dinner (17.30 - 17.50)
  ...[0, 1, 2, 3, 4, 5, 6].map(day => ({
    templateId: `tpl_eat_dinner_${day}`,
    title: 'Makan Sore / Malam',
    category: 'routine',
    dayOfWeek: day,
    startTime: '17:30',
    endTime: '17:50',
    durationMinutes: 20,
    isLocked: true
  })),

  // Champion Squad (5x10m per day, adjusted dynamically for teaching & prayer times)
  // Senin: 06.20, 10.20 (ba'da X-1), 12.30 (ba'da Dzuhur), 15.00, 18.25 (ba'da Maghrib)
  { templateId: 'tpl_cs_1_1', title: 'Champion Squad 1', category: 'habit', dayOfWeek: 1, startTime: '06:20', endTime: '06:30', durationMinutes: 10 },
  { templateId: 'tpl_cs_1_2', title: 'Champion Squad 2 (Ba\'da X-1)', category: 'habit', dayOfWeek: 1, startTime: '10:20', endTime: '10:30', durationMinutes: 10 },
  { templateId: 'tpl_cs_1_3', title: 'Champion Squad 3 (Ba\'da Dzuhur)', category: 'habit', dayOfWeek: 1, startTime: '12:30', endTime: '12:40', durationMinutes: 10 },
  { templateId: 'tpl_cs_1_4', title: 'Champion Squad 4', category: 'habit', dayOfWeek: 1, startTime: '15:00', endTime: '15:10', durationMinutes: 10 },
  { templateId: 'tpl_cs_1_5', title: 'Champion Squad 5 (Ba\'da Maghrib)', category: 'habit', dayOfWeek: 1, startTime: '18:25', endTime: '18:35', durationMinutes: 10 },

  // Kamis: 06.20, 09.40 (ba'da X-3), 12.30 (ba'da Dzuhur), 15.00, 18.25 (ba'da Maghrib)
  { templateId: 'tpl_cs_4_1', title: 'Champion Squad 1', category: 'habit', dayOfWeek: 4, startTime: '06.20'.replace('.', ':'), endTime: '06:30', durationMinutes: 10 },
  { templateId: 'tpl_cs_4_2', title: 'Champion Squad 2 (Ba\'da X-3)', category: 'habit', dayOfWeek: 4, startTime: '09:40', endTime: '09:50', durationMinutes: 10 },
  { templateId: 'tpl_cs_4_3', title: 'Champion Squad 3 (Ba\'da Dzuhur)', category: 'habit', dayOfWeek: 4, startTime: '12:30', endTime: '12:40', durationMinutes: 10 },
  { templateId: 'tpl_cs_4_4', title: 'Champion Squad 4', category: 'habit', dayOfWeek: 4, startTime: '15:00', endTime: '15:10', durationMinutes: 10 },
  { templateId: 'tpl_cs_4_5', title: 'Champion Squad 5 (Ba\'da Maghrib)', category: 'habit', dayOfWeek: 4, startTime: '18:25', endTime: '18:35', durationMinutes: 10 },

  // Sabtu: 06.20, 09.40 (ba'da X-1), 12.30 (ba'da Dzuhur), 15.00, 18.25 (ba'da Maghrib)
  { templateId: 'tpl_cs_6_1', title: 'Champion Squad 1', category: 'habit', dayOfWeek: 6, startTime: '06:20', endTime: '06:30', durationMinutes: 10 },
  { templateId: 'tpl_cs_6_2', title: 'Champion Squad 2 (Ba\'da X-1)', category: 'habit', dayOfWeek: 6, startTime: '09:40', endTime: '09:50', durationMinutes: 10 },
  { templateId: 'tpl_cs_6_3', title: 'Champion Squad 3 (Ba\'da Dzuhur)', category: 'habit', dayOfWeek: 6, startTime: '12:30', endTime: '12:40', durationMinutes: 10 },
  { templateId: 'tpl_cs_6_4', title: 'Champion Squad 4', category: 'habit', dayOfWeek: 6, startTime: '15:00', endTime: '15:10', durationMinutes: 10 },
  { templateId: 'tpl_cs_6_5', title: 'Champion Squad 5 (Ba\'da Maghrib)', category: 'habit', dayOfWeek: 6, startTime: '18:25', endTime: '18:35', durationMinutes: 10 },

  // Ahad: 06.50 (ba'da sarapan), 09.00, 12.30, 15.00, 18.25
  { templateId: 'tpl_cs_0_1', title: 'Champion Squad 1', category: 'habit', dayOfWeek: 0, startTime: '06:50', endTime: '07:00', durationMinutes: 10 },
  { templateId: 'tpl_cs_0_2', title: 'Champion Squad 2', category: 'habit', dayOfWeek: 0, startTime: '09:00', endTime: '09:10', durationMinutes: 10 },
  { templateId: 'tpl_cs_0_3', title: 'Champion Squad 3 (Ba\'da Dzuhur)', category: 'habit', dayOfWeek: 0, startTime: '12:30', endTime: '12:40', durationMinutes: 10 },
  { templateId: 'tpl_cs_0_4', title: 'Champion Squad 4', category: 'habit', dayOfWeek: 0, startTime: '15:00', endTime: '15:10', durationMinutes: 10 },
  { templateId: 'tpl_cs_0_5', title: 'Champion Squad 5 (Ba\'da Maghrib)', category: 'habit', dayOfWeek: 0, startTime: '18:25', endTime: '18:35', durationMinutes: 10 },

  // Selasa & Rabu
  ...[2, 3].flatMap(day => [
    { templateId: `tpl_cs_${day}_1`, title: 'Champion Squad 1', category: 'habit', dayOfWeek: day, startTime: '06:20', endTime: '06:30', durationMinutes: 10 },
    { templateId: `tpl_cs_${day}_2`, title: 'Champion Squad 2', category: 'habit', dayOfWeek: day, startTime: '09:00', endTime: '09:10', durationMinutes: 10 },
    { templateId: `tpl_cs_${day}_3`, title: 'Champion Squad 3 (Ba\'da Dzuhur)', category: 'habit', dayOfWeek: day, startTime: '12:30', endTime: '12:40', durationMinutes: 10 },
    { templateId: `tpl_cs_${day}_4`, title: 'Champion Squad 4', category: 'habit', dayOfWeek: day, startTime: '15:00', endTime: '15:10', durationMinutes: 10 },
    { templateId: `tpl_cs_${day}_5`, title: 'Champion Squad 5 (Ba\'da Maghrib)', category: 'habit', dayOfWeek: day, startTime: '18:25', endTime: '18:35', durationMinutes: 10 }
  ]),

  // Jum'at (CS 3 after Mentoring 2 at 13.25)
  { templateId: 'tpl_cs_5_1', title: 'Champion Squad 1', category: 'habit', dayOfWeek: 5, startTime: '06:20', endTime: '06:30', durationMinutes: 10 },
  { templateId: 'tpl_cs_5_2', title: 'Champion Squad 2', category: 'habit', dayOfWeek: 5, startTime: '09:00', endTime: '09:10', durationMinutes: 10 },
  { templateId: 'tpl_cs_5_3', title: 'Champion Squad 3 (Ba\'da Mentoring 2)', category: 'habit', dayOfWeek: 5, startTime: '13:25', endTime: '13:35', durationMinutes: 10 },
  { templateId: 'tpl_cs_5_4', title: 'Champion Squad 4', category: 'habit', dayOfWeek: 5, startTime: '15:00', endTime: '15:10', durationMinutes: 10 },
  { templateId: 'tpl_cs_5_5', title: 'Champion Squad 5 (Ba\'da Maghrib)', category: 'habit', dayOfWeek: 5, startTime: '18:25', endTime: '18:35', durationMinutes: 10 },

  // ==========================================
  // DYNAMIC PRAYER ANCHORS & SPECIAL DUTIES
  // ==========================================
  // Subuh: If has Imam duty on Mon & Thu, the duty takes precedence
  ...[0, 2, 3, 5, 6].map(day => ({
    templateId: `tpl_prayer_fajr_${day}`,
    title: 'Sholat Subuh & Dzikir Pagi',
    category: 'prayer',
    dayOfWeek: day,
    isDynamicPrayer: true,
    prayerAnchor: { prayer: 'fajr', offset: 0, duration: 30 },
    isLocked: true
  })),

  // Dzuhur / Sholat Jum'at (on Friday, 25 minutes duration)
  ...[0, 1, 2, 3, 4, 6].map(day => ({
    templateId: `tpl_prayer_dhuhr_${day}`,
    title: 'Sholat Dzuhur Berjamaah',
    category: 'prayer',
    dayOfWeek: day,
    isDynamicPrayer: true,
    prayerAnchor: { prayer: 'dhuhr', offset: 0, duration: 25 },
    isLocked: true
  })),
  {
    templateId: 'tpl_prayer_jumat_5',
    title: '🕌 Sholat Jum\'at Berjamaah',
    category: 'prayer',
    dayOfWeek: 5,
    isDynamicPrayer: true,
    prayerAnchor: { prayer: 'dhuhr', offset: 0, duration: 25 },
    isLocked: true
  },

  // Ashar: On Saturday, Muadzin duty takes precedence (10m before adzan + sholat)
  ...[0, 1, 2, 3, 4, 5].map(day => ({
    templateId: `tpl_prayer_asr_${day}`,
    title: 'Sholat Ashar Berjamaah',
    category: 'prayer',
    dayOfWeek: day,
    isDynamicPrayer: true,
    prayerAnchor: { prayer: 'asr', offset: 0, duration: 25 },
    isLocked: true
  })),

  // Maghrib: Tuesday has Imam duty, Sunday has Muadzin duty
  ...[1, 3, 4, 5, 6].map(day => ({
    templateId: `tpl_prayer_maghrib_${day}`,
    title: 'Sholat Maghrib Berjamaah',
    category: 'prayer',
    dayOfWeek: day,
    isDynamicPrayer: true,
    prayerAnchor: { prayer: 'maghrib', offset: 0, duration: 25 },
    isLocked: true
  })),

  // Isya: Sunday has Imam duty
  ...[1, 2, 3, 4, 5, 6].map(day => ({
    templateId: `tpl_prayer_isha_${day}`,
    title: 'Sholat Isya Berjamaah',
    category: 'prayer',
    dayOfWeek: day,
    isDynamicPrayer: true,
    prayerAnchor: { prayer: 'isha', offset: 0, duration: 25 },
    isLocked: true
  })),

  // Special Duties (Imam & Muadzin)
  // Imam Subuh: Senin & Kamis (Adzan + 15m, 30m)
  {
    templateId: 'tpl_duty_imam_subuh_mon',
    title: '🕌 Tugas Imam Subuh',
    category: 'prayer',
    dayOfWeek: 1,
    isDynamicPrayer: true,
    prayerAnchor: { prayer: 'fajr', offset: 15, duration: 30 },
    isLocked: true
  },
  {
    templateId: 'tpl_duty_imam_subuh_thu',
    title: '🕌 Tugas Imam Subuh',
    category: 'prayer',
    dayOfWeek: 4,
    isDynamicPrayer: true,
    prayerAnchor: { prayer: 'fajr', offset: 15, duration: 30 },
    isLocked: true
  },
  // Imam Maghrib: Selasa (Adzan + 15m, 30m)
  {
    templateId: 'tpl_duty_imam_maghrib_tue',
    title: '🕌 Tugas Imam Maghrib',
    category: 'prayer',
    dayOfWeek: 2,
    isDynamicPrayer: true,
    prayerAnchor: { prayer: 'maghrib', offset: 15, duration: 30 },
    isLocked: true
  },
  // Imam Isya: Ahad (Adzan + 5m, 15m)
  {
    templateId: 'tpl_duty_imam_isha_sun',
    title: '🕌 Tugas Imam Isya',
    category: 'prayer',
    dayOfWeek: 0,
    isDynamicPrayer: true,
    prayerAnchor: { prayer: 'isha', offset: 5, duration: 15 },
    isLocked: true
  },
  // Muadzin Ashar: Sabtu (Adzan - 5m, 10m)
  {
    templateId: 'tpl_duty_muadzin_asr_sat',
    title: '📢 Tugas Muadzin Ashar',
    category: 'prayer',
    dayOfWeek: 6,
    isDynamicPrayer: true,
    prayerAnchor: { prayer: 'asr', offset: -5, duration: 10 },
    isLocked: true
  },
  // Muadzin Maghrib: Ahad (Adzan - 5m, 10m)
  {
    templateId: 'tpl_duty_muadzin_maghrib_sun',
    title: '📢 Tugas Muadzin Maghrib',
    category: 'prayer',
    dayOfWeek: 0,
    isDynamicPrayer: true,
    prayerAnchor: { prayer: 'maghrib', offset: -5, duration: 10 },
    isLocked: true
  },

  // ==========================================
  // FIXED TEACHING & CLASSES
  // ==========================================
  // SENIN (1)
  { templateId: 'tpl_teach_mon_1', title: 'Mengajar X-3 MTU', category: 'teaching', dayOfWeek: 1, startTime: '07:40', endTime: '09:00', durationMinutes: 80, isLocked: true },
  { templateId: 'tpl_teach_mon_2', title: 'Mengajar X-1 MTU', category: 'teaching', dayOfWeek: 1, startTime: '09:00', endTime: '10:20', durationMinutes: 80, isLocked: true },
  { templateId: 'tpl_teach_mon_3', title: 'Mengajar X-2 MTU', category: 'teaching', dayOfWeek: 1, startTime: '10:40', endTime: '12:00', durationMinutes: 80, isLocked: true },
  { templateId: 'tpl_teach_mon_4', title: 'Mengajar X-3 PM', category: 'teaching', dayOfWeek: 1, startTime: '14:20', endTime: '15:00', durationMinutes: 40, isLocked: true },
  { templateId: 'tpl_class_mon_chess', title: 'Chess Club', category: 'class', dayOfWeek: 1, startTime: '16:15', endTime: '17:15', durationMinutes: 60, isLocked: true },
  { templateId: 'tpl_class_mon_night', title: 'Additional Night Class', category: 'class', dayOfWeek: 1, startTime: '20:00', endTime: '20:45', durationMinutes: 45, isLocked: true },

  // SELASA (2)
  { templateId: 'tpl_class_tue_math', title: 'Math Olympiad', category: 'class', dayOfWeek: 2, startTime: '16:15', endTime: '17:15', durationMinutes: 60, isLocked: true },

  // RABU (3)
  { templateId: 'tpl_class_wed_eve', title: 'Additional Evening Class', category: 'class', dayOfWeek: 3, startTime: '16:15', endTime: '17:15', durationMinutes: 60, isLocked: true },
  { templateId: 'tpl_class_wed_takhosus', title: 'Takhosus Tahfidz', category: 'class', dayOfWeek: 3, startTime: '19:45', endTime: '20:45', durationMinutes: 60, isLocked: true },

  // KAMIS (4)
  { templateId: 'tpl_teach_thu_1', title: 'Mengajar X-2 MTU', category: 'teaching', dayOfWeek: 4, startTime: '07:00', endTime: '08:20', durationMinutes: 80, isLocked: true },
  { templateId: 'tpl_teach_thu_2', title: 'Mengajar X-3 MTU', category: 'teaching', dayOfWeek: 4, startTime: '08:20', endTime: '09:40', durationMinutes: 80, isLocked: true },
  { templateId: 'tpl_teach_thu_3', title: 'Mengajar X-1 MTU', category: 'teaching', dayOfWeek: 4, startTime: '10:40', endTime: '12:00', durationMinutes: 80, isLocked: true },
  { templateId: 'tpl_class_thu_takhosus', title: 'Takhosus Tahfidz', category: 'class', dayOfWeek: 4, startTime: '20:00', endTime: '20:15', durationMinutes: 15, isLocked: true },

  // JUM'AT (5)
  { templateId: 'tpl_teach_fri_1', title: 'Mengajar X-2 PM', category: 'teaching', dayOfWeek: 5, startTime: '07:40', endTime: '08:20', durationMinutes: 40, isLocked: true },
  { templateId: 'tpl_teach_fri_2', title: 'Mengajar X-1 PM', category: 'teaching', dayOfWeek: 5, startTime: '10:40', endTime: '11:20', durationMinutes: 40, isLocked: true },
  { templateId: 'tpl_class_fri_mentor_1', title: 'Mentoring Sesi 1', category: 'class', dayOfWeek: 5, startTime: '11:20', endTime: '12:00', durationMinutes: 40, isLocked: true },
  { templateId: 'tpl_class_fri_mentor_2', title: 'Mentoring Sesi 2', category: 'class', dayOfWeek: 5, startTime: '12:45', endTime: '13:25', durationMinutes: 40, isLocked: true },
  { templateId: 'tpl_class_fri_matriculation', title: 'Matriculation Numeration Class', category: 'class', dayOfWeek: 5, startTime: '16:15', endTime: '17:15', durationMinutes: 60, isLocked: true },
  { templateId: 'tpl_class_fri_night', title: 'Additional Night Class', category: 'class', dayOfWeek: 5, startTime: '20:00', endTime: '20:45', durationMinutes: 45, isLocked: true },

  // SABTU (6)
  { templateId: 'tpl_teach_sat_1', title: 'Mengajar X-3 MTU', category: 'teaching', dayOfWeek: 6, startTime: '07:00', endTime: '07:40', durationMinutes: 40, isLocked: true },
  { templateId: 'tpl_teach_sat_2', title: 'Mengajar X-2 MTU', category: 'teaching', dayOfWeek: 6, startTime: '08:20', endTime: '09:00', durationMinutes: 40, isLocked: true },
  { templateId: 'tpl_teach_sat_3', title: 'Mengajar X-1 MTU', category: 'teaching', dayOfWeek: 6, startTime: '09:00', endTime: '09:40', durationMinutes: 40, isLocked: true },
  { templateId: 'tpl_class_sat_aicoder', title: 'AI Coder Time', category: 'class', dayOfWeek: 6, startTime: '10:20', endTime: '12:00', durationMinutes: 100, isLocked: true },
  { templateId: 'tpl_class_sat_math', title: 'Math Olympiad', category: 'class', dayOfWeek: 6, startTime: '16:15', endTime: '17:15', durationMinutes: 60, isLocked: true },
  { templateId: 'tpl_class_sat_takhosus', title: 'Takhosus Tahfidz', category: 'class', dayOfWeek: 6, startTime: '19:45', endTime: '20:00', durationMinutes: 15, isLocked: true },

  // AHAD (0)
  { templateId: 'tpl_class_sun_takhosus', title: 'Takhosus Tahfidz', category: 'class', dayOfWeek: 0, startTime: '05:30', endTime: '06:30', durationMinutes: 60, isLocked: true }
];

/**
 * Floating habits template pool to be distributed smartly across empty slots
 */
export const FLOATING_HABITS_POOL = [
  // Qur'an Time (7x 2x 30m: Ba'da Subuh & Ba'da Maghrib/Isya)
  { id: 'flt_quran_1', title: 'Qur\'an Time (Muraja\'ah)', category: 'habit', durationMinutes: 30, preferredTime: 'morning', countPerWeek: 7 },
  { id: 'flt_quran_2', title: 'Qur\'an Time (Ziyadah)', category: 'habit', durationMinutes: 30, preferredTime: 'evening', countPerWeek: 7 },

  // Bayyinah Time (7x 60m)
  { id: 'flt_bayyinah', title: 'Bayyinah Time', category: 'habit', durationMinutes: 60, preferredTime: 'morning_early', countPerWeek: 7 },

  // Kurikulum Time (7x 20m)
  { id: 'flt_kurikulum', title: 'Kurikulum Time + Incidental', category: 'habit', durationMinutes: 20, preferredTime: 'afternoon', countPerWeek: 7 },

  // Coding / Vibe Code Time (7x 2x 40m)
  { id: 'flt_code_1', title: 'Coding / Vibe Code Sesi 1', category: 'habit', durationMinutes: 40, preferredTime: 'afternoon', countPerWeek: 7 },
  { id: 'flt_code_2', title: 'Coding / Vibe Code Sesi 2', category: 'habit', durationMinutes: 40, preferredTime: 'night', countPerWeek: 7 },

  // Chess Practice Time (7x 2x 20m)
  { id: 'flt_chess_1', title: 'Chess Time Sesi 1', category: 'habit', durationMinutes: 20, preferredTime: 'break', countPerWeek: 7 },
  { id: 'flt_chess_2', title: 'Chess Time Sesi 2', category: 'habit', durationMinutes: 20, preferredTime: 'break', countPerWeek: 7 },

  // Preparations
  { id: 'flt_prep_chess', title: 'Prepare Chess Club', category: 'prep', durationMinutes: 30, preferredDay: 1, preferredTime: 'before_class', countPerWeek: 1 },
  { id: 'flt_prep_math_1', title: 'Prepare Math Olympiad (Selasa)', category: 'prep', durationMinutes: 60, preferredDay: 2, countPerWeek: 1 },
  { id: 'flt_prep_math_2', title: 'Prepare Math Olympiad (Sabtu)', category: 'prep', durationMinutes: 60, preferredDay: 6, countPerWeek: 1 },
  { id: 'flt_prep_teaching_mon', title: 'Prepare Teaching (Senin)', category: 'prep', durationMinutes: 30, preferredDay: 1, countPerWeek: 1 },
  { id: 'flt_prep_teaching_thu', title: 'Prepare Teaching (Kamis)', category: 'prep', durationMinutes: 30, preferredDay: 4, countPerWeek: 1 },
  { id: 'flt_prep_teaching_fri', title: 'Prepare Teaching (Jum\'at)', category: 'prep', durationMinutes: 30, preferredDay: 5, countPerWeek: 1 },
  { id: 'flt_prep_teaching_sat', title: 'Prepare Teaching (Sabtu)', category: 'prep', durationMinutes: 30, preferredDay: 6, countPerWeek: 1 }
];
