
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, query, orderBy, limit, onSnapshot, where, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAxk-19S_g7Ad9PMydLmLsRDIf-va5ZsNg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "farahaty-nice-events.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "farahaty-nice-events",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "farahaty-nice-events.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "975596848066",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:975596848066:web:d58f45564abebcb31acc5b"
};

let db: any = null;
let storage: any = null;

try {
  if (firebaseConfig.projectId !== "PLACEHOLDER") {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);

    // Enable IndexedDB persistence for offline support
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support all of the features required to enable persistence');
      }
    });

// تهيئة الجداول المطلوبة في Firebase
initializeFirebaseCollections().catch(console.error);
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

// Firebase Auto-Initialization Feature
async function initializeFirebaseCollections() {
  if (!db) return;

  console.log('🔥 Starting Firebase Auto-Initialization...');

  try {
    // 1. Check and initialize app_settings/main document
    const appSettingsRef = doc(db, 'app_settings', 'main');
    const appSettingsDoc = await getDoc(appSettingsRef);

    if (!appSettingsDoc.exists()) {
      // Create default app settings
      const defaultSettings = {
        sar_to_yer: 140,
        sar_to_usd: 0.27,
        maintenance_mode: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await setDoc(appSettingsRef, defaultSettings);
      console.log('✅ Default app settings initialized in Firebase.');
    } else {
      console.log('✅ App settings document exists.');
    }

    // 2. Initialize required collections (ensure they exist)
    const requiredCollections = [
      'products',
      'categories',
      'bookings',
      'customer_codes',
      'chat_messages',
      'analytics_events',
      'coupons',
      'notifications',
    ];

    for (const col of requiredCollections) {
      try {
        // Check if collection exists by trying to get documents
        const snap = await getDocs(collection(db, col));
        if (snap.empty) {
          // Add initialization document to create the collection
          await setDoc(doc(db, col, '__init__'), {
            created_at: new Date().toISOString(),
            init: true
          });
          console.log(`✅ Collection '${col}' initialized in Firebase.`);
        } else {
          console.log(`✅ Collection '${col}' exists.`);
        }
      } catch (err) {
        console.error(`❌ Error initializing collection '${col}':`, err);
      }
    }

    console.log('🎉 Firebase Auto-Initialization completed successfully!');
    console.log('📊 Database structure verified and ready.');

  } catch (error) {
    console.error('❌ Firebase Auto-Initialization failed:', error);
    console.warn('⚠️ App will continue with local fallback mode.');
  }
}
