import { db } from "./firebase.js";
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  increment 
} from "firebase/firestore";

// ==========================================
// 生徒用 API 関数
// ==========================================

/**
 * ユーザーの日毎の利用回数をカウント（ログイン時やページ読み込み時に呼び出し）
 * @param {string} userId - 生徒のユーザーID
 */
export async function logDailyUsage(userId) {
  const today = new Date().toISOString().split("T")[0]; // 例: "2026-08-05"
  const usageRef = doc(db, "daily_usage", `${userId}_${today}`);

  // 当日ドキュメントが存在しない場合は作成し、存在する場合は count を 1 増やす
  await setDoc(usageRef, {
    userId: userId,
    date: today,
    count: increment(1),
    lastUpdated: serverTimestamp()
  }, { merge: true });
}

/**
 * 生徒が質問を投稿する
 * @param {string} userId - 生徒のユーザーID
 * @param {string} content - 質問テキスト
 */
export async function addQuestion(userId, content) {
  await addDoc(collection(db, "questions"), {
    userId: userId,
    content: content,
    createdAt: serverTimestamp()
  });
}

// ==========================================
// チューター用 API 関数
// ==========================================

/**
 * 質問内容を取得する（特定の生徒または全体）
 * @param {string} [userId] - 指定しない場合は全生徒の質問を取得
 */
export async function getQuestions(userId = null) {
  let q;
  if (userId) {
    q = query(
      collection(db, "questions"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
  } else {
    q = query(
      collection(db, "questions"),
      orderBy("createdAt", "desc")
    );
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * 各ユーザーの日毎の利用回数を取得する
 * @param {string} [userId] - 指定しない場合は全ユーザーの日別ログを取得
 */
export async function getDailyUsage(userId = null) {
  let q;
  if (userId) {
    q = query(
      collection(db, "daily_usage"),
      where("userId", "==", userId),
      orderBy("date", "desc")
    );
  } else {
    q = query(
      collection(db, "daily_usage"),
      orderBy("date", "desc")
    );
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
