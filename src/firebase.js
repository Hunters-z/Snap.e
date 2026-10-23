import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

// Locked directly to user's Firebase project: snap-e-55144
export const firebaseConfig = {
  apiKey: "AIzaSyClayvri2RwofR_wpJVP0g8ZMlpAFV48RE",
  authDomain: "snap-e-55144.firebaseapp.com",
  projectId: "snap-e-55144",
  storageBucket: "snap-e-55144.firebasestorage.app",
  messagingSenderId: "618885882194",
  appId: "1:618885882194:web:d971e380ded9f6559e5a8b",
  measurementId: "G-T2PZ1X4XB7",
  firestoreDatabaseId: "(default)"
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
