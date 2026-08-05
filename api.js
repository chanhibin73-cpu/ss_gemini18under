import { db } from "./firebase.js";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp, 
  increment 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// YYYY-MM-DD 形式の日付を取得するヘルパー関数
function getDateStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ==========================================
// 生徒用 API
// ==========================================

/**
 * サイト利用時に呼び出し、日毎の利用回数と連続ログイン日数を記録する
 * @param {string} userId - 生徒のユーザーID
 */
export async function logDailyUsage(userId) {
  const todayStr = getDateStr(0);      // 今日の日付
  const yesterdayStr = getDateStr(-1); // 昨日の日付

  // 1. 日毎の利用回数をカウントアップ
  const usageRef = doc(db, "daily_usage", `${userId}_${todayStr}`);
  await setDoc(usageRef, {
    userId: userId,
    date: todayStr,
    count: increment(1),
    lastUpdated: serverTimestamp()
  }, { merge: true });

  // 2. 連続ログイン日数の計算・更新
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data();
    const lastLoginDate = userData.lastLoginDate;
    let newStreak = userData.streakCount || 1;

    if (lastLoginDate === yesterdayStr) {
      newStreak += 1; // 昨日もログインしていれば +1
    } else if (lastLoginDate !== todayStr) {
      newStreak = 1;  // 今日でも昨日でもなければ連続ストップ（1にリセット）
    }
    
    await setDoc(userRef, {
      lastLoginDate: todayStr,
      streakCount: newStreak
    }, { merge: true });
  } else {
    // 初回利用の場合
    await setDoc(userRef, {
      userId: userId,
      lastLoginDate: todayStr,
      streakCount: 1
    });
  }
}

// ==========================================
// チューター用 API
// ==========================================

/**
 * ユーザーごとの学習データ（連続ログイン日数など）を取得
 */
export async function getUsersStats() {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * 全生徒の「日毎の利用回数」を取得
 */
export async function getDailyUsageList() {
  const q = query(collection(db, "daily_usage"), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
