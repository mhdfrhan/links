import * as admin from 'firebase-admin';

let isConfigured = false;

if (!admin.apps.length) {
  try {
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const serviceAccount = serviceAccountStr ? JSON.parse(serviceAccountStr) : {};
    
    if (Object.keys(serviceAccount).length === 0) {
      console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is missing or empty. Server-side admin features will not work.");
      admin.initializeApp(); // Initialize empty to prevent build crash
    } else {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      isConfigured = true;
    }
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
    if (!admin.apps.length) {
      admin.initializeApp();
    }
  }
} else {
  isConfigured = true; // Already initialized correctly if apps.length > 0
}

export const isAdminConfigured = isConfigured;
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
