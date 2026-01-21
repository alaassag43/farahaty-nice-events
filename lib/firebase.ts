
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, updateDoc, deleteDoc, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAxk-19S_g7Ad9PMydLmLsRDIf-va5ZsNg",
  authDomain: "farahaty-nice-events.firebaseapp.com",
  projectId: "farahaty-nice-events",
  storageBucket: "farahaty-nice-events.firebasestorage.app",
  messagingSenderId: "975596848066",
  appId: "1:975596848066:web:d58f45564abebcb31acc5b"
};

let db: any = null;
let storage: any = null;

try {
  if (firebaseConfig.projectId !== "PLACEHOLDER") {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
  }
} catch (e) {
  console.warn("Firebase initialization failed, using local mock mode.");
}

export { db, storage, collection, doc, setDoc, getDocs, updateDoc, deleteDoc, query, orderBy, limit, onSnapshot, where };

// دالة رفع الملفات المحسنة
export const uploadFile = async (file: File, folder: string = 'gallery'): Promise<string> => {
  if (!storage) {
    // محاكاة الرفع في حال عدم وجود إعدادات Firebase
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  try {
    const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error("Upload Error:", error);
    throw error;
  }
};

export const dbOperation = async (type: 'get' | 'set' | 'update' | 'delete', colName: string, data?: any, id?: string) => {
  if (!db) {
    const localData = JSON.parse(localStorage.getItem(`fb_mock_${colName}`) || '[]');
    if (type === 'get') return localData;
    if (type === 'set') {
      const newData = [...localData.filter((i:any)=>i.id !== id), { ...data, id: id || Math.random().toString() }];
      localStorage.setItem(`fb_mock_${colName}`, JSON.stringify(newData));
      return newData;
    }
    if (type === 'update') {
      const newData = localData.map((i:any) => i.id === id ? { ...i, ...data } : i);
      localStorage.setItem(`fb_mock_${colName}`, JSON.stringify(newData));
      return newData;
    }
    if (type === 'delete') {
      const newData = localData.filter((i:any) => i.id !== id);
      localStorage.setItem(`fb_mock_${colName}`, JSON.stringify(newData));
      return newData;
    }
    return localData;
  }

  try {
    const colRef = collection(db, colName);
    if (type === 'get') {
      const snap = await getDocs(colRef);
      return snap.docs.map(d => ({ ...d.data(), id: d.id }));
    }
    if (type === 'set') {
      await setDoc(doc(db, colName, id!), data);
      return data;
    }
    if (type === 'update') {
      await updateDoc(doc(db, colName, id!), data);
      return data;
    }
    if (type === 'delete') {
      await deleteDoc(doc(db, colName, id!));
      return true;
    }
  } catch (err) {
    console.error("Firestore Error:", err);
    return null;
  }
};
