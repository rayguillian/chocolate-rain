import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBzjWAQcjkrXwPrr0NH4teMMnQPHbXFK78",
  authDomain: "bruv-2060f.firebaseapp.com",
  projectId: "bruv-2060f",
  storageBucket: "bruv-2060f.firebasestorage.app",
  messagingSenderId: "682233764278",
  appId: "1:682233764278:web:9c66f7443487f941f2c917",
  measurementId: "G-4V1VWP63W0"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const storage = getStorage(app);

// Storage paths
export const STORAGE_PATHS = {
  BROWN_NOISE: 'Brown Noise Stream',
  RAIN: 'Rain Makes Everything Better'
} as const;
