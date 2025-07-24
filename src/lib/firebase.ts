// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
