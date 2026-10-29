import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

// Firebase config — from environment variables (see .env.example).
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)'
};

// Initialize single Firebase App instance
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firestore transport: several Indonesian ISPs and corporate networks break
// the SDK's default gRPC/WebSocket watch channel ("client is offline" while
// the rest of the internet works). Long polling survives those networks.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});
export const auth = getAuth(app);

// Anonymous auth: app is browsable without login, but Firestore rules require
// request.auth to exist. Sign in anonymously at startup so every client gets a
// uid (used as ownerId on cloud_albums / ldr_rooms writes).
signInAnonymously(auth).catch((err) => {
  console.warn('Anonymous auth failed (Firestore writes will be denied):', err?.code || err);
});

// Standard error handler for Firestore operations
export function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null
    },
    operationType,
    path
  };
  console.warn('Firestore Operation:', errInfo);
}
