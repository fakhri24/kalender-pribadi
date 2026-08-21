/**
 * Unified Storage Layer (IndexedDB with localStorage Fallback)
 * Offline-First & Zero-Backend Storage Engine
 */

import { firebaseService } from './firebase.js';

const DB_NAME = 'KalenderPribadiDB';
const DB_VERSION = 1;
const STORES = {
  EVENTS: 'events',
  LOGS: 'execution_logs',
  REVIEWS: 'weekly_reviews',
  SETTINGS: 'settings'
};

class StorageEngine {
  constructor() {
    this.db = null;
    this.isIndexedDBSupported = typeof window !== 'undefined' && 'indexedDB' in window;
  }

  /**
   * Initialize IndexedDB instance
   */
  async initDB() {
    if (this.db) return this.db;
    if (!this.isIndexedDBSupported) return null;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Events Store (keyed by id, indexed by date, dayOfWeek, weekId)
        if (!db.objectStoreNames.contains(STORES.EVENTS)) {
          const eventStore = db.createObjectStore(STORES.EVENTS, { keyPath: 'id' });
          eventStore.createIndex('date', 'date', { unique: false });
          eventStore.createIndex('dayOfWeek', 'dayOfWeek', { unique: false });
        }

        // Execution Logs Store (keyed by id, indexed by date, eventId)
        if (!db.objectStoreNames.contains(STORES.LOGS)) {
          const logStore = db.createObjectStore(STORES.LOGS, { keyPath: 'id' });
          logStore.createIndex('date', 'date', { unique: false });
          logStore.createIndex('eventId', 'eventId', { unique: false });
        }

        // Weekly Reviews Store (keyed by weekId)
        if (!db.objectStoreNames.contains(STORES.REVIEWS)) {
          db.createObjectStore(STORES.REVIEWS, { keyPath: 'weekId' });
        }

        // Settings Store (keyed by key)
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.warn('IndexedDB failed to open, fallback to localStorage', event);
        resolve(null);
      };
    });
  }

  /**
   * Save item to store (Local + Cloud Firestore if active)
   */
  async put(storeName, data) {
    // 1. Local Persistence (IndexedDB / localStorage)
    try {
      const db = await this.initDB();
      if (db) {
        await new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          const req = store.put(data);
          req.onsuccess = () => resolve(data);
          req.onerror = () => reject(req.error);
        });
      }
    } catch (e) {
      console.warn('IndexedDB put error, using localStorage', e);
      const key = `kp_${storeName}_${data.id || data.weekId || data.key}`;
      localStorage.setItem(key, JSON.stringify(data));
    }

    // 2. Background Cloud Sync (Firestore)
    if (firebaseService.isSyncActive()) {
      const docId = data.id || data.weekId || data.key;
      if (docId) {
        firebaseService.saveDoc(storeName, docId, data).catch(err => {
          console.warn('Cloud sync error in put:', err);
        });
      }
    }

    return data;
  }

  /**
   * Put multiple items in batch (Local + Cloud Firestore if active)
   */
  async putBulk(storeName, items) {
    if (!items || items.length === 0) return items;

    // 1. Local Persistence
    try {
      const db = await this.initDB();
      if (db) {
        await new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          items.forEach(item => store.put(item));
          tx.oncomplete = () => resolve(items);
          tx.onerror = () => reject(tx.error);
        });
      }
    } catch (e) {
      console.warn('IndexedDB bulk error', e);
      items.forEach(item => {
        const key = `kp_${storeName}_${item.id || item.weekId || item.key}`;
        localStorage.setItem(key, JSON.stringify(item));
      });
    }

    // 2. Background Cloud Sync
    if (firebaseService.isSyncActive()) {
      firebaseService.saveBulkDocs(storeName, items).catch(err => {
        console.warn('Cloud sync error in putBulk:', err);
      });
    }

    return items;
  }

  /**
   * Get all items in a store
   */
  async getAll(storeName) {
    try {
      const db = await this.initDB();
      if (db) {
        return new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });
      }
    } catch (e) {
      console.warn('IndexedDB getAll error, checking localStorage', e);
    }

    // LocalStorage fallback
    const prefix = `kp_${storeName}_`;
    const results = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        try {
          results.push(JSON.parse(localStorage.getItem(k)));
        } catch (err) {
          // ignore corrupted entry
        }
      }
    }
    return results;
  }

  /**
   * Get single item by key
   */
  async get(storeName, key) {
    try {
      const db = await this.initDB();
      if (db) {
        return new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => reject(req.error);
        });
      }
    } catch (e) {
      console.warn('IndexedDB get error', e);
    }

    const lsKey = `kp_${storeName}_${key}`;
    const raw = localStorage.getItem(lsKey);
    return raw ? JSON.parse(raw) : null;
  }

  /**
   * Delete item by key
   */
  async delete(storeName, key) {
    try {
      const db = await this.initDB();
      if (db) {
        await new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          const req = store.delete(key);
          req.onsuccess = () => resolve(true);
          req.onerror = () => reject(req.error);
        });
      }
    } catch (e) {
      console.warn('IndexedDB delete error', e);
    }

    localStorage.removeItem(`kp_${storeName}_${key}`);

    if (firebaseService.isSyncActive()) {
      firebaseService.deleteDoc(storeName, key).catch(err => {
        console.warn('Cloud delete error:', err);
      });
    }

    return true;
  }

  /**
   * Delete multiple items in batch (Local + Cloud Firestore if active)
   */
  async deleteBulk(storeName, keys) {
    if (!keys || keys.length === 0) return true;

    // 1. Local Persistence (IndexedDB)
    try {
      const db = await this.initDB();
      if (db) {
        await new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          keys.forEach(key => store.delete(key));
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => reject(tx.error);
        });
      }
    } catch (e) {
      console.warn('IndexedDB deleteBulk error', e);
    }

    // LocalStorage cleanup
    keys.forEach(key => {
      localStorage.removeItem(`kp_${storeName}_${key}`);
    });

    // 2. Background Cloud Sync
    if (firebaseService.isSyncActive()) {
      firebaseService.deleteBulkDocs(storeName, keys).catch(err => {
        console.warn('Cloud delete error in deleteBulk:', err);
      });
    }

    return true;
  }

  /**
   * Delete events in a specific date range (inclusive) in batch
   */
  async deleteEventsInRange(startDate, endDate) {
    const allEvents = await this.getAll(STORES.EVENTS);
    const toDelete = allEvents.filter(e => e.date >= startDate && e.date <= endDate);
    if (toDelete.length === 0) return 0;

    const keys = toDelete.map(e => e.id);
    await this.deleteBulk(STORES.EVENTS, keys);
    return keys.length;
  }

  /**
   * Pull all records from Cloud Firestore into local storage
   */
  async pullAllFromCloud() {
    if (!firebaseService.isSyncActive()) return false;

    try {
      const cloudEvents = await firebaseService.getDocs(STORES.EVENTS);
      const cloudLogs = await firebaseService.getDocs(STORES.LOGS);
      const cloudReviews = await firebaseService.getDocs(STORES.REVIEWS);

      if (cloudEvents.length > 0) await this.putBulk(STORES.EVENTS, cloudEvents);
      if (cloudLogs.length > 0) await this.putBulk(STORES.LOGS, cloudLogs);
      if (cloudReviews.length > 0) await this.putBulk(STORES.REVIEWS, cloudReviews);

      return {
        eventsCount: cloudEvents.length,
        logsCount: cloudLogs.length,
        reviewsCount: cloudReviews.length
      };
    } catch (err) {
      console.error('Gagal menarik data dari cloud:', err);
      return false;
    }
  }

  /**
   * Clear an entire store
   */
  async clear(storeName) {
    try {
      const db = await this.initDB();
      if (db) {
        return new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          const req = store.clear();
          req.onsuccess = () => resolve(true);
          req.onerror = () => reject(req.error);
        });
      }
    } catch (e) {
      console.warn('IndexedDB clear error', e);
    }

    const prefix = `kp_${storeName}_`;
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) keysToRemove.push(k);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    return true;
  }
}

export const storage = new StorageEngine();
export { STORES };
