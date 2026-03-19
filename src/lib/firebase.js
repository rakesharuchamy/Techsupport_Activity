// 🔥 REPLACE THESE VALUES WITH YOUR FIREBASE PROJECT CREDENTIALS
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD-FHNiCgUWRDWHw2Tg31euBnWSWzVKWK8",
  authDomain: "team-activity-tracker-f8583.firebaseapp.com",
  projectId: "team-activity-tracker-f8583",
  storageBucket: "team-activity-tracker-f8583.firebasestorage.app",
  messagingSenderId: "1076729168991",
  appId: "1:1076729168991:web:1dedd669444ba85bfd87ea"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const apiKey = firebaseConfig.apiKey;
