import { initializeApp } from 'firebase/app';
import { 
  getDatabase, 
  connectDatabaseEmulator, 
  enableLogging 
} from 'firebase/database';

// NOTE: Replace with your actual Firebase Config
// We safely check for process.env to avoid ReferenceError in browser
const apiKey = (typeof process !== 'undefined' && process.env?.REACT_APP_FIREBASE_API_KEY) || "demo-key";

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: "fm-wms-demo.firebaseapp.com",
  databaseURL: "https://fm-wms-demo-default-rtdb.firebaseio.com",
  projectId: "fm-wms-demo",
  storageBucket: "fm-wms-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// In a real app, we would enable offline persistence here.
// Web SDK v9+ handles offline caching automatically for RTDB 
// if defined correctly, but explicit `enableIndexedDbPersistence` 
// is for Firestore. RTDB uses `keepSynced` on refs.

export { db };