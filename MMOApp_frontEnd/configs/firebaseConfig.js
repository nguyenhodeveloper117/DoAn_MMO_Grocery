// configs/firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC6gO9kcU535gwAWFwQsIO6MyUn93sUqQA",
  authDomain: "mmoapp-5e9a6.firebaseapp.com",
  databaseURL: "https://mmoapp-5e9a6-default-rtdb.firebaseio.com",
  projectId: "mmoapp-5e9a6",
  storageBucket: "mmoapp-5e9a6.firebasestorage.app",
  messagingSenderId: "593548698582",
  appId: "1:593548698582:web:b357173332d6dcb4ac7a77",
  measurementId: "G-SKDDLTVLBN"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const rtdb = getDatabase(app);

console.log("[firebase] RTDB initialized");
export { app, rtdb };
