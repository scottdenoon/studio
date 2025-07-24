
"use client"

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "market-momentum-xm3tl",
  "appId": "1:238114226305:web:a3df500e4077af1759cd80",
  "storageBucket": "market-momentum-xm3tl.firebasestorage.app",
  "apiKey": "AIzaSyAFlClLEI2vML6kauzAZxbDVi_ArWIZd6s",
  "authDomain": "market-momentum-xm3tl.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "238114226305"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
