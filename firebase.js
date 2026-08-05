// CDN版のFirebase SDKから読み込み
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBQyvZ7BPAttBd5tty9oquiX5vCz_m3Ad0",
  authDomain: "studytime-8d240.firebaseapp.com",
  projectId: "studytime-8d240",
  storageBucket: "studytime-8d240.firebasestorage.app",
  messagingSenderId: "686516235281",
  appId: "1:686516235281:web:0717f2e4be39931cc3d5b0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
