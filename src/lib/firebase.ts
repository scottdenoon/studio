// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth/web-extension";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "market-momentum-xm3tl",
  "appId": "1:238114226305:web:a3df500e4077af1759cd80",
  "storageBucket": "market-momentum-xm3tl.firebasestorage.app",
  "apiKey": "AIzaSyAFlClLEI2vML6kauzAZxbDVi_ArWIZd6s",
  "authDomain": "market-momentum-xm3tl.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "238114226305"
};

// Initialize Firebase for SSR
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };