import * as admin from 'firebase-admin';

const globalForAdmin = globalThis as typeof globalThis & {
  __firebaseAdminConfigured?: boolean;
};

let isConfigured = globalForAdmin.__firebaseAdminConfigured === true;

if (!admin.apps.length) {
  try {
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const serviceAccount = serviceAccountStr ? JSON.parse(serviceAccountStr) : {};

    if (Object.keys(serviceAccount).length === 0) {
      console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is missing or empty. Server-side admin features will not work.");
      admin.initializeApp(); // Initialize empty to prevent build crash
      isConfigured = false;
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
    isConfigured = false;
  }
  globalForAdmin.__firebaseAdminConfigured = isConfigured;
} else if (globalForAdmin.__firebaseAdminConfigured === undefined) {
  // Apps were initialized outside this module (e.g. test or external init with cert)
  isConfigured = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  globalForAdmin.__firebaseAdminConfigured = isConfigured;
}

export const isAdminConfigured = isConfigured;
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
