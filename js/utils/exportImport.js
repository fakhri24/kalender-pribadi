/**
 * JSON Export / Import Helper
 * Enables cross-device sync, local backups, and weekly archive downloads
 */

import { storage, STORES } from '../core/storage.js';
import { getAppVersion } from './versionChecker.js';

/**
 * Export all application data as a JSON file download
 */
export async function exportAllData() {
  const events = await storage.getAll(STORES.EVENTS);
  const logs = await storage.getAll(STORES.LOGS);
  const reviews = await storage.getAll(STORES.REVIEWS);
  const settings = await storage.getAll(STORES.SETTINGS);

  const backupData = {
    appName: 'Kalender Pribadi Al-Bayan',
    version: getAppVersion(),
    exportedAt: new Date().toISOString(),
    data: {
      events,
      logs,
      reviews,
      settings
    }
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `kalender_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return backupData;
}

/**
 * Import data from a JSON file
 * @param {File} file
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function importDataFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed.data) {
          throw new Error('Format file JSON tidak valid.');
        }

        const { events = [], logs = [], reviews = [], settings = [] } = parsed.data;

        if (events.length > 0) await storage.putBulk(STORES.EVENTS, events);
        if (logs.length > 0) await storage.putBulk(STORES.LOGS, logs);
        if (reviews.length > 0) await storage.putBulk(STORES.REVIEWS, reviews);
        if (settings.length > 0) await storage.putBulk(STORES.SETTINGS, settings);

        resolve({
          success: true,
          message: `Berhasil mengimpor: ${events.length} jadwal, ${logs.length} catatan eksekusi, ${reviews.length} evaluasi.`
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file.'));
    reader.readAsText(file);
  });
}
