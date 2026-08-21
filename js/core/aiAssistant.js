/**
 * AI Assistant Engine using Google Gemini API & Function Calling
 * Empowered with calendar tools to read schedule, update events, log execution, and analyze productivity
 */

import { storage, STORES } from './storage.js';
import { scheduler } from './scheduler.js';
import { calculatePrayerTimes } from './prayerEngine.js';
import { CalendarEvent } from '../models/Event.js';
import { formatDate, minutesToTime, timeToMinutes, getWeekId, getStartOfWeek, getEndOfWeek } from '../utils/dateUtils.js';

export class AIAssistant {
  constructor(appContext) {
    this.app = appContext; // Reference to main App instance
    this.history = [];     // Conversation history for multi-turn chat
    this.modelName = 'gemini-1.5-flash';
  }

  getApiKey() {
    return localStorage.getItem('kp_gemini_api_key') || '';
  }

  /**
   * System Instruction defining the AI persona and context
   */
  getSystemInstruction() {
    const todayStr = formatDate(new Date());
    return `
Anda adalah "Asisten Produktivitas Al-Bayan", AI Coach dan asisten pribadi untuk seorang guru & pembina di SMA Albayan Goalpara, Sukabumi.
Lokasi: SMA Albayan Goalpara (Lat: -6.877°, Long: 106.965°, Elevasi: ~800m dpl, WIB UTC+7).
Tanggal Hari Ini: ${todayStr}.

Prinsip & Filosofi Jadwal:
1. Dynamic Prayer Anchoring: 5 waktu sholat harian (Subuh, Dzuhur, Ashar, Maghrib, Isya) dihitung dinamis berdasarkan posisi matahari di Goalpara.
2. Rasio Waktu 80:10:10:
   - 80% Waktu Produktif (Mengajar, Mentoring, Kurikulum, Coding, Bayyinah, Qur'an, Tugas Imam/Adzan).
   - 10% Waktu Istirahat (Tidur konsisten 20.45 - 03.45 / 7 jam, Chess break, Me-time).
   - 10% Waktu Fleksibel (Makan, Mandi, Buffer mobilitas, Refleksi).
3. Anda memiliki akses ke 'Tools' untuk membaca kalender, menggeser/menambah/menghapus kegiatan, mencatat riil eksekusi (tepat waktu, telat, batal), dan mengevaluasi mingguan.

Gaya Komunikasi:
- Ramah, disiplin, solutif, suportif, dan bernuansa Islami yang santun.
- Jika pengguna meminta perubahan jadwal atau pencatatan status, panggil fungsi/tools yang sesuai, lalu berikan konfirmasi ringkas dan jelas kepada pengguna.
- Berikan saran yang cerdas jika pengguna merasa lelah atau memiliki agenda mendadak.
`.trim();
  }

  /**
   * Tools / Function Declarations for Gemini API
   */
  getToolDeclarations() {
    return [
      {
        name: 'get_daily_schedule',
        description: 'Mendapatkan daftar lengkap kegiatan, waktu sholat, dan slot kosong pada tanggal tertentu (format YYYY-MM-DD).',
        parameters: {
          type: 'OBJECT',
          properties: {
            date: {
              type: 'STRING',
              description: 'Tanggal dalam format YYYY-MM-DD (misal: "2026-08-21"). Jika tidak diisi, gunakan hari ini.'
            }
          }
        }
      },
      {
        name: 'update_event_time',
        description: 'Mengubah jam mulai, jam selesai, atau judul dari suatu kegiatan yang ada di kalender.',
        parameters: {
          type: 'OBJECT',
          properties: {
            eventId: {
              type: 'STRING',
              description: 'ID dari event yang ingin diubah.'
            },
            newStartTime: {
              type: 'STRING',
              description: 'Jam mulai baru dalam format HH:mm (misal: "14:30").'
            },
            newEndTime: {
              type: 'STRING',
              description: 'Jam selesai baru dalam format HH:mm (misal: "15:30"). Opsional jika durationMinutes diisi.'
            },
            newTitle: {
              type: 'STRING',
              description: 'Judul baru kegiatan (opsional).'
            }
          },
          required: ['eventId', 'newStartTime']
        }
      },
      {
        name: 'add_custom_event',
        description: 'Menambahkan kegiatan baru ke kalender pada tanggal dan jam tertentu.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: {
              type: 'STRING',
              description: 'Nama kegiatan (misal: "Rapat Guru Dadakan", "Konsultasi Santri").'
            },
            category: {
              type: 'STRING',
              description: 'Kategori kegiatan: "teaching", "class", "prayer", "habit", "prep", atau "routine".',
              enum: ['teaching', 'class', 'prayer', 'habit', 'prep', 'routine']
            },
            date: {
              type: 'STRING',
              description: 'Tanggal kegiatan dalam format YYYY-MM-DD.'
            },
            startTime: {
              type: 'STRING',
              description: 'Waktu mulai dalam format HH:mm (misal: "14:00").'
            },
            durationMinutes: {
              type: 'NUMBER',
              description: 'Durasi kegiatan dalam menit (misal: 40, 60).'
            }
          },
          required: ['title', 'category', 'date', 'startTime', 'durationMinutes']
        }
      },
      {
        name: 'delete_event',
        description: 'Menghapus kegiatan dari kalender berdasarkan ID event.',
        parameters: {
          type: 'OBJECT',
          properties: {
            eventId: {
              type: 'STRING',
              description: 'ID event yang ingin dihapus.'
            }
          },
          required: ['eventId']
        }
      },
      {
        name: 'log_event_execution',
        description: 'Mencatat status eksekusi nyata dari suatu kegiatan (Tepat Waktu, Terlambat, Lebih Cepat, Batal, atau Reschedule).',
        parameters: {
          type: 'OBJECT',
          properties: {
            eventId: {
              type: 'STRING',
              description: 'ID event yang ingin dicatat eksekusinya.'
            },
            status: {
              type: 'STRING',
              description: 'Status pelaksanaan: "ON_TIME", "DELAYED", "EARLIER", "CANCELLED", atau "RESCHEDULED".',
              enum: ['ON_TIME', 'DELAYED', 'EARLIER', 'CANCELLED', 'RESCHEDULED']
            },
            varianceMinutes: {
              type: 'NUMBER',
              description: 'Selisih menit jika terlambat (positif, misal: 10) atau lebih cepat (negatif, misal: -5).'
            },
            reason: {
              type: 'STRING',
              description: 'Alasan keterlambatan atau pembatalan (opsional).'
            },
            notes: {
              type: 'STRING',
              description: 'Catatan tambahan refleksi (opsional).'
            }
          },
          required: ['eventId', 'status']
        }
      },
      {
        name: 'get_weekly_productivity_summary',
        description: 'Menganalisis keseimbangan rasio mingguan (80% Produktif, 10% Istirahat, 10% Fleksibel) dan daftar kegiatan yang terlambat atau batal.',
        parameters: {
          type: 'OBJECT',
          properties: {
            weekDate: {
              type: 'STRING',
              description: 'Salah satu tanggal di minggu yang ingin dianalisis (format YYYY-MM-DD).'
            }
          }
        }
      }
    ];
  }

  /**
   * Execute a tool call triggered by Gemini
   */
  async executeTool(name, args) {
    console.log(`[AI Tool Call] Executing: ${name}`, args);

    switch (name) {
      case 'get_daily_schedule': {
        const targetDateStr = args.date || formatDate(this.app.selectedDate);
        const targetDate = new Date(targetDateStr);
        const prayerTimes = calculatePrayerTimes(targetDate);
        const allStored = await storage.getAll(STORES.EVENTS);
        const dayEvents = allStored
          .filter(e => e.date === targetDateStr)
          .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

        return {
          date: targetDateStr,
          prayerTimes: {
            Subuh: prayerTimes.fajr,
            Terbit: prayerTimes.sunrise,
            Dzuhur: prayerTimes.dhuhr,
            Ashar: prayerTimes.asr,
            Maghrib: prayerTimes.maghrib,
            Isya: prayerTimes.isha
          },
          eventsCount: dayEvents.length,
          events: dayEvents.map(e => ({
            id: e.id,
            title: e.title,
            category: e.category,
            time: `${e.startTime} - ${e.endTime}`,
            duration: `${e.durationMinutes}m`,
            status: e.status || 'PLANNED'
          }))
        };
      }

      case 'update_event_time': {
        const allEvents = await storage.getAll(STORES.EVENTS);
        const evtData = allEvents.find(e => e.id === args.eventId);
        if (!evtData) {
          return { success: false, message: `Event dengan ID ${args.eventId} tidak ditemukan.` };
        }

        const startMins = timeToMinutes(args.newStartTime);
        let endMins;
        if (args.newEndTime) {
          endMins = timeToMinutes(args.newEndTime);
        } else {
          endMins = startMins + (evtData.durationMinutes || 60);
        }

        evtData.startTime = args.newStartTime;
        evtData.endTime = minutesToTime(endMins);
        evtData.durationMinutes = endMins - startMins;
        if (args.newTitle) evtData.title = args.newTitle;

        const updatedEvt = new CalendarEvent(evtData);
        await storage.put(STORES.EVENTS, updatedEvt.toJSON());
        await this.app.refreshUI();

        return {
          success: true,
          message: `Kegiatan "${updatedEvt.title}" berhasil diubah ke jam ${updatedEvt.startTime} - ${updatedEvt.endTime}.`,
          event: updatedEvt.toJSON()
        };
      }

      case 'add_custom_event': {
        const startMins = timeToMinutes(args.startTime);
        const endMins = startMins + args.durationMinutes;
        const targetDate = new Date(args.date);

        const newEvt = new CalendarEvent({
          id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title: args.title,
          category: args.category || 'habit',
          date: args.date,
          dayOfWeek: targetDate.getDay(),
          startTime: args.startTime,
          endTime: minutesToTime(endMins),
          durationMinutes: args.durationMinutes,
          isLocked: false,
          status: 'PLANNED'
        });

        await storage.put(STORES.EVENTS, newEvt.toJSON());
        await this.app.refreshUI();

        return {
          success: true,
          message: `Kegiatan "${newEvt.title}" (${newEvt.startTime} - ${newEvt.endTime}) berhasil ditambahkan ke kalender tanggal ${args.date}.`,
          event: newEvt.toJSON()
        };
      }

      case 'delete_event': {
        await storage.delete(STORES.EVENTS, args.eventId);
        await this.app.refreshUI();
        return {
          success: true,
          message: `Kegiatan dengan ID ${args.eventId} berhasil dihapus dari kalender.`
        };
      }

      case 'log_event_execution': {
        const allEvents = await storage.getAll(STORES.EVENTS);
        const evtData = allEvents.find(e => e.id === args.eventId);
        if (!evtData) {
          return { success: false, message: `Event dengan ID ${args.eventId} tidak ditemukan.` };
        }

        const evt = new CalendarEvent(evtData);
        evt.setExecutionStatus(args.status, {
          varianceMinutes: args.varianceMinutes || 0,
          reason: args.reason || '',
          notes: args.notes || ''
        });

        await storage.put(STORES.EVENTS, evt.toJSON());
        await this.app.refreshUI();

        return {
          success: true,
          message: `Eksekusi "${evt.title}" berhasil dicatat sebagai status [${args.status}].`,
          event: evt.toJSON()
        };
      }

      case 'get_weekly_productivity_summary': {
        const refDate = args.weekDate ? new Date(args.weekDate) : this.app.selectedDate;
        const startOfWeek = formatDate(getStartOfWeek(refDate));
        const endOfWeek = formatDate(getEndOfWeek(refDate));
        const weekId = getWeekId(refDate);

        const allEvents = await storage.getAll(STORES.EVENTS);
        const weekEvents = allEvents.filter(e => e.date >= startOfWeek && e.date <= endOfWeek);

        let prodMins = 0;
        let restMins = 0;
        let flexMins = 0;
        const issues = [];

        weekEvents.forEach(e => {
          const dur = e.durationMinutes || (timeToMinutes(e.endTime) - timeToMinutes(e.startTime)) || 0;
          if (['teaching', 'class', 'prayer', 'habit', 'prep'].includes(e.category)) {
            prodMins += dur;
          } else if (e.category === 'routine' && e.title.toLowerCase().includes('tidur')) {
            restMins += dur;
          } else {
            flexMins += dur;
          }

          if (e.status && e.status !== 'PLANNED' && e.status !== 'ON_TIME') {
            issues.push({
              title: e.title,
              date: e.date,
              status: e.status,
              variance: e.varianceMinutes,
              reason: e.reason
            });
          }
        });

        const totalMins = prodMins + restMins + flexMins || 1;
        return {
          weekId,
          dateRange: `${startOfWeek} s/d ${endOfWeek}`,
          totalEvents: weekEvents.length,
          ratios: {
            productive: `${(prodMins / 60).toFixed(1)} jam (${((prodMins / totalMins) * 100).toFixed(1)}%) - Target: 80%`,
            rest: `${(restMins / 60).toFixed(1)} jam (${((restMins / totalMins) * 100).toFixed(1)}%) - Target: 10%`,
            flexible: `${(flexMins / 60).toFixed(1)} jam (${((flexMins / totalMins) * 100).toFixed(1)}%) - Target: 10%`
          },
          varianceSummary: {
            totalDeviations: issues.length,
            issues
          }
        };
      }

      default:
        return { error: `Tool ${name} tidak dikenali.` };
    }
  }

  /**
   * Dynamically detect available models for user's API key
   */
  async getBestModelName(apiKey) {
    const savedModel = localStorage.getItem('kp_gemini_model_name');
    if (savedModel) return savedModel;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (res.ok) {
        const data = await res.json();
        const available = (data.models || [])
          .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
          .map(m => m.name.replace('models/', ''));

        console.log('[Gemini API] Available models for key:', available);

        const candidates = [
          'gemini-3.5-flash-lite',
          'gemini-3.1-flash-lite',
          'gemini-3.6-flash',
          'gemini-3.7-flash',
          'gemini-3.5-flash',
          'gemini-2.5-flash',
          'gemini-3-flash',
          'gemini-2.5-flash-lite',
          'gemini-2.0-flash',
          'gemini-1.5-flash-latest'
        ];

        for (const cand of candidates) {
          if (available.includes(cand)) {
            localStorage.setItem('kp_gemini_model_name', cand);
            return cand;
          }
        }

        if (available.length > 0) {
          localStorage.setItem('kp_gemini_model_name', available[0]);
          return available[0];
        }
      }
    } catch (e) {
      console.warn('Gagal memuat list models dari Gemini API:', e);
    }

    return 'gemini-3.5-flash-lite';
  }

  /**
   * Send message to Gemini API with Tool Calling support
   */
  async sendMessage(userText) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Gemini API Key belum dimasukkan. Silakan buka menu ⚙️ Cloud & AI di kanan atas untuk memasukkan API Key dari Google AI Studio.');
    }

    // Auto-detect best model
    let modelName = await this.getBestModelName(apiKey);

    // Add user message to history
    this.history.push({
      role: 'user',
      parts: [{ text: userText }]
    });

    let endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const requestBody = {
      systemInstruction: {
        parts: [{ text: this.getSystemInstruction() }]
      },
      contents: this.history,
      tools: [
        {
          functionDeclarations: this.getToolDeclarations()
        }
      ]
    };

    // Tool calling loop (up to 5 iterations if chained)
    let maxSteps = 5;
    while (maxSteps > 0) {
      maxSteps--;

      let response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      // If model returned error, check for deprecation / suggestion or fallback
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error?.message || '';

        // Check if error explicitly suggests another model (e.g. "Please update your code to use models/gemini-3.6-flash")
        const suggestedMatch = errMsg.match(/models\/(gemini-[\w.-]+)/);
        if (suggestedMatch && suggestedMatch[1] && suggestedMatch[1] !== modelName) {
          const suggestedModel = suggestedMatch[1];
          console.log(`[Gemini API] Auto-switching to suggested model: ${suggestedModel}`);
          localStorage.setItem('kp_gemini_model_name', suggestedModel);
          modelName = suggestedModel;
          endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${suggestedModel}:generateContent?key=${apiKey}`;

          response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          });
        } else if (response.status === 404 || response.status === 400) {
          console.warn(`Model ${modelName} returned error (${response.status}), trying fallback models...`);
          const fallbacks = ['gemini-3.6-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-pro'];
          for (const fb of fallbacks) {
            if (fb === modelName) continue;
            const fbEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${fb}:generateContent?key=${apiKey}`;
            const fbRes = await fetch(fbEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody)
            });
            if (fbRes.ok) {
              response = fbRes;
              localStorage.setItem('kp_gemini_model_name', fb);
              console.log(`Fallback succeeded with model: ${fb}`);
              break;
            }
          }
        }

        if (!response.ok) {
          throw new Error(errMsg || `HTTP ${response.status}: Gagal menghubungi Gemini API.`);
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}: Gagal menghubungi Gemini API.`);
      }

      const responseData = await response.json();
      const candidate = responseData.candidates?.[0];
      if (!candidate || !candidate.content) {
        throw new Error('Respon dari Gemini kosong.');
      }

      const modelMessage = candidate.content;
      this.history.push(modelMessage);

      // Check if model returned function calls
      const functionCalls = modelMessage.parts?.filter(p => p.functionCall);

      if (!functionCalls || functionCalls.length === 0) {
        // Normal text response
        const textParts = modelMessage.parts?.map(p => p.text).filter(Boolean).join('\n');
        return {
          text: textParts || 'Selesai.',
          toolExecutions: []
        };
      }

      // Execute each function call and prepare function responses
      const functionResponses = [];
      const executionLogs = [];

      for (const callPart of functionCalls) {
        const { name, args } = callPart.functionCall;
        const result = await this.executeTool(name, args || {});
        executionLogs.push({ name, args, result });

        functionResponses.push({
          functionResponse: {
            name: name,
            response: result
          }
        });
      }

      // Add tool responses as a user message with functionResponse parts
      const toolMessage = {
        role: 'user',
        parts: functionResponses
      };
      this.history.push(toolMessage);
      requestBody.contents = this.history;
    }

    return {
      text: 'Permintaan Anda telah selesai diproses.',
      toolExecutions: []
    };
  }

  clearHistory() {
    this.history = [];
  }
}
