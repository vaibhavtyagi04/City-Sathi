// Import the functions you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBZQbKuKmNioVYkghhWldIhTD-cqSK2TwE",
  authDomain: "citysathi-e9e50.firebaseapp.com",
  databaseURL: "https://citysathi-e9e50-default-rtdb.firebaseio.com",
  projectId: "citysathi-e9e50",
  storageBucket: "citysathi-e9e50.firebasestorage.app",
  messagingSenderId: "858363067329",
  appId: "1:858363067329:web:f8742be201d047a4b8cd40",
  measurementId: "G-CC59M94L66"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
