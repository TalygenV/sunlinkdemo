// Import from 'firebase/app' is correct for v9+
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage"; // Add this import
import { getFirestore } from "firebase/firestore"; // Add Firestore import
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  // apiKey: "AIzaSyB0N8rgHlFytsr4fm7BHozWH10JpYGzQXo",
  // authDomain: "sunlink-21942.firebaseapp.com",
  // projectId: "sunlink-21942",
  // storageBucket: "sunlink-21942.firebasestorage.app",
  // messagingSenderId: "551161290824",
  // appId: "1:551161290824:web:1ab25527313d164f30f87d",
  // databaseURL:
  //   "https://sunlink-21942-default-rtdb.asia-southeast1.firebasedatabase.app",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};
// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app); // Add this export
export const firestore = getFirestore(app); // Add this line

// Initialize Firebase Functions
export const functions = getFunctions(app, "us-central1");
