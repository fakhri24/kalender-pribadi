/**
 * Firebase Modular SDK Integration Layer (Auth & Cloud Firestore with Offline Persistence)
 * Supports Google Authentication and Real-Time Multi-Device Sync
 */

import {
  initializeApp,
  getApps,
  getApp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

class FirebaseService {
  constructor() {
    this.app = null;
    this.auth = null;
    this.db = null;
    this.currentUser = null;
    this.isInitialized = false;
    this.authCallbacks = [];

    this.loadSavedConfig();
  }

  /**
   * Load Firebase config from localStorage
   */
  getSavedConfig() {
    try {
      const raw = localStorage.getItem('kp_firebase_config');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Gagal membaca saved firebase config', e);
      return null;
    }
  }

  saveConfig(config) {
    if (!config) {
      localStorage.removeItem('kp_firebase_config');
    } else {
      localStorage.setItem('kp_firebase_config', JSON.stringify(config));
    }
  }

  /**
   * Initialize Firebase with provided config or saved config
   */
  async init(customConfig = null) {
    const config = customConfig || this.getSavedConfig();
    if (!config || !config.apiKey || !config.projectId) {
      console.log('Firebase config belum dikonfigurasi. Berjalan dalam mode lokal.');
      this.isInitialized = false;
      return false;
    }

    try {
      if (getApps().length === 0) {
        this.app = initializeApp(config);
      } else {
        this.app = getApp();
      }

      // Initialize Auth
      this.auth = getAuth(this.app);

      // Initialize Firestore with Persistent Multi-Tab Offline Cache
      try {
        this.db = initializeFirestore(this.app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
          })
        });
      } catch (cacheErr) {
        // If already initialized, get standard instance
        this.db = getFirestore(this.app);
      }

      this.isInitialized = true;
      this.saveConfig(config);

      // Check redirect result (for mobile Google Sign-In redirect flow)
      getRedirectResult(this.auth)
        .then((result) => {
          if (result && result.user) {
            this.currentUser = result.user;
            this.authCallbacks.forEach(cb => cb(result.user));
          }
        })
        .catch((redirectErr) => {
          console.warn('Firebase getRedirectResult error:', redirectErr);
        });

      // Listen for auth changes
      onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user;
        this.authCallbacks.forEach(cb => cb(user));
      });

      return true;
    } catch (err) {
      console.error('Gagal inisialisasi Firebase:', err);
      this.isInitialized = false;
      return false;
    }
  }

  onAuthChange(callback) {
    if (typeof callback === 'function') {
      this.authCallbacks.push(callback);
      if (this.isInitialized && this.auth && this.currentUser) {
        callback(this.currentUser);
      }
    }
  }

  /**
   * Login with Google (Popup with automatic mobile redirect fallback)
   */
  async loginWithGoogle() {
    if (!this.isInitialized || !this.auth) {
      throw new Error('Firebase belum diinisialisasi. Silakan masukkan Firebase Config di Pengaturan.');
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const userAgent = navigator.userAgent || '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    try {
      // Try popup first (works on desktop and some modern mobile browsers)
      const result = await signInWithPopup(this.auth, provider);
      this.currentUser = result.user;
      return result.user;
    } catch (popupErr) {
      console.warn('Google signInWithPopup failed, inspecting fallback:', popupErr);

      // If popup is blocked, cancelled, or running on mobile, fallback to redirect
      const isPopupBlockedOrMobile = isMobile || [
        'auth/popup-blocked',
        'auth/popup-closed-by-user',
        'auth/cancelled-popup-request',
        'auth/operation-not-supported-in-this-environment'
      ].includes(popupErr.code);

      if (isPopupBlockedOrMobile) {
        console.log('Menggunakan signInWithRedirect untuk autentikasi mobile...');
        await signInWithRedirect(this.auth, provider);
        return null;
      }

      throw popupErr;
    }
  }

  /**
   * Sign out current user
   */
  async logout() {
    if (this.auth) {
      await signOut(this.auth);
      this.currentUser = null;
    }
  }

  /**
   * Check if cloud sync is currently active
   */
  isSyncActive() {
    return Boolean(this.isInitialized && this.db && this.currentUser);
  }

  getUserCollectionPath(subCollection) {
    if (!this.currentUser) return null;
    return `users/${this.currentUser.uid}/${subCollection}`;
  }

  // ==========================================
  // FIRESTORE CRUD OPERATIONS
  // ==========================================

  /**
   * Save an item to user's Firestore subcollection
   */
  async saveDoc(subCollection, id, data) {
    if (!this.isSyncActive()) return null;
    try {
      const docRef = doc(this.db, 'users', this.currentUser.uid, subCollection, id);
      const cleanData = { ...data, updatedAt: new Date().toISOString() };
      await setDoc(docRef, cleanData, { merge: true });
      return cleanData;
    } catch (err) {
      console.error(`Firestore saveDoc error [${subCollection}/${id}]:`, err);
      return null;
    }
  }

  /**
   * Save multiple items in a batch
   */
  async saveBulkDocs(subCollection, items) {
    if (!this.isSyncActive() || !items || items.length === 0) return items;
    try {
      const batch = writeBatch(this.db);
      items.forEach(item => {
        const id = item.id || item.weekId || item.key;
        if (id) {
          const docRef = doc(this.db, 'users', this.currentUser.uid, subCollection, id);
          batch.set(docRef, { ...item, updatedAt: new Date().toISOString() }, { merge: true });
        }
      });
      await batch.commit();
      return items;
    } catch (err) {
      console.error(`Firestore saveBulkDocs error [${subCollection}]:`, err);
      return items;
    }
  }

  /**
   * Get all documents from a user's Firestore subcollection
   */
  async getDocs(subCollection) {
    if (!this.isSyncActive()) return [];
    try {
      const colRef = collection(this.db, 'users', this.currentUser.uid, subCollection);
      const snapshot = await getDocs(colRef);
      const docs = [];
      snapshot.forEach(docSnap => {
        docs.push(docSnap.data());
      });
      return docs;
    } catch (err) {
      console.error(`Firestore getDocs error [${subCollection}]:`, err);
      return [];
    }
  }

  /**
   * Delete a document
   */
  async deleteDoc(subCollection, id) {
    if (!this.isSyncActive()) return false;
    try {
      const docRef = doc(this.db, 'users', this.currentUser.uid, subCollection, id);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.error(`Firestore deleteDoc error [${subCollection}/${id}]:`, err);
      return false;
    }
  }

  /**
   * Delete multiple documents in a batch
   */
  async deleteBulkDocs(subCollection, ids) {
    if (!this.isSyncActive() || !ids || ids.length === 0) return true;
    try {
      const batch = writeBatch(this.db);
      ids.forEach(id => {
        if (id) {
          const docRef = doc(this.db, 'users', this.currentUser.uid, subCollection, id);
          batch.delete(docRef);
        }
      });
      await batch.commit();
      return true;
    } catch (err) {
      console.error(`Firestore deleteBulkDocs error [${subCollection}]:`, err);
      return false;
    }
  }

  /**
   * Sync all local data into Cloud Firestore
   */
  async syncLocalToCloud(localData = {}) {
    if (!this.isSyncActive()) {
      throw new Error('Anda harus login dengan akun Google terlebih dahulu untuk sinkronisasi cloud.');
    }

    const { events = [], logs = [], reviews = [] } = localData;

    if (events.length > 0) await this.saveBulkDocs('events', events);
    if (logs.length > 0) await this.saveBulkDocs('execution_logs', logs);
    if (reviews.length > 0) await this.saveBulkDocs('weekly_reviews', reviews);

    return {
      syncedEvents: events.length,
      syncedLogs: logs.length,
      syncedReviews: reviews.length
    };
  }

  loadSavedConfig() {
    const config = this.getSavedConfig();
    if (config) {
      this.init(config);
    }
  }
}

export const firebaseService = new FirebaseService();
