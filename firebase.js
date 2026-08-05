// Firebase SDK のインポート
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp, 
  increment 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase 設定
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
export const db = getFirestore(app);

// ユーザーIDの取得または生成 (ローカルストレージと同期)
export function getUserId() {
  let userId = localStorage.getItem('study_user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('study_user_id', userId);
  }
  return userId;
}

// 生徒の質問ログと利用回数を保存
export async function recordStudentActivity(subject, questionText) {
  try {
    const userId = getUserId();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // ユーザー情報の保存・更新
    const userRef = doc(db, 'students', userId);
    await setDoc(userRef, {
      lastActive: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    // 日毎の利用回数のカウントアップ
    const dailyRef = doc(db, 'students', userId, 'daily_stats', today);
    await setDoc(dailyRef, {
      date: today,
      count: increment(1),
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // 質問内容の記録
    const questionsRef = collection(db, 'students', userId, 'questions');
    await addDoc(questionsRef, {
      subject: subject || '一般',
      question: questionText || '',
      createdAt: serverTimestamp(),
      date: today
    });

  } catch (error) {
    console.error("Firebaseへの学習状況保存エラー:", error);
  }
}

// チューター用：全生徒一覧および各生徒の学習状況を取得
export async function fetchAllStudentsData() {
  try {
    const studentsSnap = await getDocs(collection(db, 'students'));
    const students = [];

    for (const studentDoc of studentsSnap.docs) {
      const studentId = studentDoc.id;
      const studentData = studentDoc.data();

      // 日毎の利用回数を取得
      const statsSnap = await getDocs(collection(db, 'students', studentId, 'daily_stats'));
      const dailyStats = [];
      statsSnap.forEach(doc => {
        dailyStats.push(doc.data());
      });

      // 質問履歴を取得
      const questionsSnap = await getDocs(collection(db, 'students', studentId, 'questions'));
      const questions = [];
      questionsSnap.forEach(doc => {
        const qData = doc.data();
        questions.push({
          id: doc.id,
          ...qData,
          createdAt: qData.createdAt ? qData.createdAt.toDate() : new Date()
        });
      });

      // 日時昇順/降順の並び替え（メモリ上処理）
      questions.sort((a, b) => b.createdAt - a.createdAt);

      students.push({
        id: studentId,
        info: studentData,
        dailyStats,
        questions
      });
    }

    return students;
  } catch (error) {
    console.error("チューターデータ取得エラー:", error);
    return [];
  }
}

