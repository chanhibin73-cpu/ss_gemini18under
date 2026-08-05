// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBQyvZ7BPAttBd5tty9oquiX5vCz_m3Ad0",
  authDomain: "studytime-8d240.firebaseapp.com",
  projectId: "studytime-8d240",
  storageBucket: "studytime-8d240.firebasestorage.app",
  messagingSenderId: "686516235281",
  appId: "1:686516235281:web:0717f2e4be39931cc3d5b0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
