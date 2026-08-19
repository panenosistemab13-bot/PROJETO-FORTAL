import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration provided from project "Passagem de Turno" (ID: passagem-de-turno-1d855)
export const firebaseConfig = {
  apiKey: "AIzaSyAznTSG6GCX9CPsrT6_eDsRtY86pdyykA4",
  authDomain: "passagem-de-turno-1d855.firebaseapp.com",
  databaseURL: "https://passagem-de-turno-1d855-default-rtdb.firebaseio.com",
  projectId: "passagem-de-turno-1d855",
  storageBucket: "passagem-de-turno-1d855.firebasestorage.app",
  messagingSenderId: "1037482488405",
  appId: "1:1037482488405:web:e19efa9332a5139232dadc",
  measurementId: "G-TP9FJV6WB9"
};

// Initialize Firebase App instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Realtime Database with explicit URL
export const rtdb: Database = getDatabase(app, firebaseConfig.databaseURL);

// Initialize Firebase Auth
export const auth: Auth = getAuth(app);

export default app;
