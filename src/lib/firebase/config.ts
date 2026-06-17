import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check if Firebase configuration is using placeholder values or is missing
export const isMock = 
  !firebaseConfig.apiKey || 
  firebaseConfig.apiKey === "" || 
  firebaseConfig.apiKey.includes("your_api_key");

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Prevent re-initialization crashes during Next.js HMR by caching db on globalThis
let firestoreDb: any;
if (typeof window !== "undefined") {
  const g = globalThis as any;
  if (!g.firestoreDb) {
    try {
      g.firestoreDb = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch (e) {
      console.warn("initializeFirestore failed, using getFirestore fallback:", e);
      g.firestoreDb = getFirestore(app);
    }
  }
  firestoreDb = g.firestoreDb;
} else {
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;
export const storage = getStorage(app);
export default app;
