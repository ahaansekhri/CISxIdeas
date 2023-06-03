// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCEH510Hknyh2bAgNCl6noswzRHzYC0x80",
  authDomain: "cisxideas-6b22b.firebaseapp.com",
  projectId: "cisxideas-6b22b",
  storageBucket: "cisxideas-6b22b.appspot.com",
  messagingSenderId: "83265506626",
  appId: "1:83265506626:web:d353e649d217b7c88d0cdb",
  measurementId: "G-JGRZNP4SMT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
