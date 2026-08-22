/**
 * Credentials Template Configuration
 * Salin file ini menjadi credentials.js dan masukkan kredensial Firebase & Gemini API Anda.
 * File credentials.js sudah otomatis di-ignore oleh Git (.gitignore) untuk keamanan.
 */

export const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

export const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";
