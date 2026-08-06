import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    !firebaseConfig.apiKey.includes("placeholder") &&
    !firebaseConfig.projectId.includes("placeholder")
);

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let analyticsInstance: Analytics | null = null;
let authInstance: Auth | null = null;

export function getFirebaseDb(): Firestore | null {
  if (!isFirebaseConfigured) {
    return null;
  }
  if (!dbInstance) {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    dbInstance = getFirestore(appInstance);
  }
  return dbInstance;
}

export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured) {
    return null;
  }
  if (typeof window === "undefined") {
    return null;
  }
  if (!authInstance) {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
  }
  return authInstance;
}

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (!isFirebaseConfigured) {
    return null;
  }
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const supported = await isSupported();
    if (!supported) {
      return null;
    }
    if (!analyticsInstance) {
      appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      analyticsInstance = getAnalytics(appInstance);
    }
    return analyticsInstance;
  } catch (err) {
    console.warn("Firebase Analytics initialization error:", err);
    return null;
  }
}
