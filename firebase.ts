
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 最佳實踐：優先從環境變數讀取，如果沒有則使用 Hard code 的值 (方便測試)
// 在 React 專案中，通常需要在專案根目錄建立 .env 檔案，內容如下：
// REACT_APP_FIREBASE_API_KEY=你的Key
// REACT_APP_FIREBASE_APP_ID=你的AppID

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAo9M5pF0Hm-VuSasad72iaI0oJIuyVzkg",
  authDomain: "oneshoot-a0a66.firebaseapp.com",
  projectId: "oneshoot-a0a66",
  storageBucket: "oneshoot-a0a66.firebasestorage.app",
  messagingSenderId: "651940578330",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:651940578330:web:768c511a162dc977f1fda3",
  measurementId: "G-J81H4CMEGC"
};

// 檢查是否還在使用預設的佔位符
const isConfigured = !firebaseConfig.apiKey.includes("PASTE_") && !firebaseConfig.appId.includes("PASTE_");

if (!isConfigured) {
  console.warn("⚠️ Firebase 尚未完全配置！");
  console.warn("請在 .env 檔案中設定 REACT_APP_FIREBASE_API_KEY 和 REACT_APP_FIREBASE_APP_ID");
  console.warn("或者直接在 firebase.ts 中填入您的 API Key 和 App ID。");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
