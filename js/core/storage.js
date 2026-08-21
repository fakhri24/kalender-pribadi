/**
 * Unified Storage Layer (IndexedDB with localStorage Fallback)
 * Offline-First & Zero-Backend Storage Engine
 */

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
   * Save item to store
   */
  async put(storeName, data) {
    try {
      const db = await this.initDB();
      if (db) {
        return new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          const req = store.put(data);
          req.onsuccess = () => resolve(data);
          req.onerror = () => reject(req.error);
        });
      }
    } catch (e) {
      console.warn('IndexedDB put error, using localStorage', e);
    }

    // LocalStorage Fallback
    const key = `kp_${storeName}_${data.id || data.weekId || data.key}`;
    localStorage.setItem(key, JSON.stringify(data));
    return data;
  }

  /**
   * Put multiple items in batch
   */
  async putBulk(storeName, items) {
    try {
      const db = await this.initDB();
      if (db) {
        return new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          items.forEach(item => store.put(item));
          tx.oncomplete = () => resolve(items);
          tx.onerror = () => reject(tx.error);
        });
      }
    } catch (e) {
      console.warn('IndexedDB bulk error', e);
    }

    // LocalStorage Fallback
    items.forEach(item => {
      const key = `kp_${storeName}_${item.id || item.weekId || item.key}`;
      localStorage.setItem(key, JSON.stringify(item));
    });
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
        return new Promise((resolve, reject) => {
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
    return true;
  }

  /**
   * Delete events in a specific date range (inclusive)
   */
  async deleteEventsInRange(startDate, endDate) {
    const allEvents = await this.getAll(STORES.EVENTS);
    const toDelete = allEvents.filter(e => e.date >= startDate && e.date <= endDate);
    
    for (const evt of toDelete) {
      await this.delete(STORES.EVENTS, evt.id);
    }
    return toDelete.length;
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
