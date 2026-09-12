import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAP_AtvkjJwAOXGVJcJYpWtnDaFVowhvek",
  authDomain: "dash-ff36f.firebaseapp.com",
  projectId: "dash-ff36f",
  storageBucket: "dash-ff36f.firebasestorage.app",
  messagingSenderId: "734724800536",
  appId: "1:734724800536:web:d9ea26f62cea62bbdd436d",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = typeof window !== "undefined" ? getMessaging(app) : null;