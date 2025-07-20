// Firebase 配置文件
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// 環境變數配置 (從 .env 檔案或環境中讀取)
const getEnvVar = (name, defaultValue = '') => {
    // 在瀏覽器環境中，我們需要在構建時注入這些變數
    // 或者使用 meta 標籤在 HTML 中定義
    if (typeof window !== 'undefined' && window.ENV) {
        return window.ENV[name] || defaultValue;
    }
    
    // Node.js 環境 (如果使用構建工具)
    if (typeof process !== 'undefined' && process.env) {
        return process.env[name] || defaultValue;
    }
    
    return defaultValue;
};

// Firebase 配置
const firebaseConfig = {
    apiKey: getEnvVar('VITE_FIREBASE_API_KEY', 'your-api-key-here'),
    authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', 'your-project.firebaseapp.com'),
    projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', 'your-project-id'),
    storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', 'your-project.appspot.com'),
    messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', '123456789'),
    appId: getEnvVar('VITE_FIREBASE_APP_ID', 'your-app-id-here')
};

// 檢查是否使用 LocalStorage 模式
// 如果沒有設定 Firebase 配置或明確設定使用 LocalStorage，則使用離線模式
const useLocalStorage = getEnvVar('USE_LOCAL_STORAGE', 'false') === 'true' || 
                       !firebaseConfig.apiKey || 
                       firebaseConfig.apiKey === 'your-api-key-here';

let app, auth, db, storage;

if (!useLocalStorage) {
    try {
        // 初始化 Firebase
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
        
        console.log('Firebase 初始化成功');
    } catch (error) {
        console.error('Firebase 初始化失敗:', error);
        console.log('將使用本地存儲作為後備方案');
        useLocalStorage = true;
    }
} else {
    console.log('使用本地存儲模式（請配置 Firebase 以啟用雲端功能）');
}

// 創建本地存儲管理器實例
const localStorageManager = new LocalStorageManager();

// 導出配置和服務
export { 
    app, 
    auth, 
    db, 
    storage, 
    useLocalStorage, 
    localStorageManager 
};

// 全域變數（供非模組腳本使用）
window.firebaseConfig = {
    app,
    auth,
    db,
    storage,
    useLocalStorage,
    localStorageManager
};