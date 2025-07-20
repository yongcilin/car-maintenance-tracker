// 認證管理模組
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import { auth, useLocalStorage, localStorageManager } from './firebase-config.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authStateListeners = [];
        this.initializeAuth();
    }
    
    initializeAuth() {
        if (useLocalStorage) {
            // 使用本地存儲
            this.currentUser = localStorageManager.getCurrentUser();
            this.notifyAuthStateChange();
        } else {
            // 使用 Firebase Auth
            onAuthStateChanged(auth, (user) => {
                this.currentUser = user;
                this.notifyAuthStateChange();
            });
        }
    }
    
    // 註冊監聽器
    onAuthStateChanged(callback) {
        this.authStateListeners.push(callback);
        // 立即調用一次以獲取當前狀態
        callback(this.currentUser);
    }
    
    // 通知所有監聽器
    notifyAuthStateChange() {
        this.authStateListeners.forEach(callback => {
            callback(this.currentUser);
        });
    }
    
    // 註冊新使用者
    async register(email, password, displayName) {
        try {
            if (useLocalStorage) {
                const user = localStorageManager.registerUser(email, password, { displayName });
                this.currentUser = user;
                this.notifyAuthStateChange();
                return user;
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName: displayName });
                return userCredential.user;
            }
        } catch (error) {
            console.error('註冊失敗:', error);
            throw this.handleAuthError(error);
        }
    }
    
    // 登入
    async login(email, password) {
        try {
            if (useLocalStorage) {
                const user = localStorageManager.loginUser(email, password);
                this.currentUser = user;
                this.notifyAuthStateChange();
                return user;
            } else {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                return userCredential.user;
            }
        } catch (error) {
            console.error('登入失敗:', error);
            throw this.handleAuthError(error);
        }
    }
    
    // 登出
    async logout() {
        try {
            if (useLocalStorage) {
                localStorageManager.logoutUser();
                this.currentUser = null;
                this.notifyAuthStateChange();
            } else {
                await signOut(auth);
            }
        } catch (error) {
            console.error('登出失敗:', error);
            throw this.handleAuthError(error);
        }
    }
    
    // 重設密碼
    async resetPassword(email) {
        try {
            if (useLocalStorage) {
                // 本地存儲模式下的密碼重設（簡化版）
                const users = JSON.parse(localStorage.getItem('carMaintenance_users'));
                if (!users[email]) {
                    throw new Error('找不到此電子郵件帳號');
                }
                // 在實際應用中，這裡應該發送重設密碼的郵件
                alert('密碼重設功能在本地模式下不可用。請聯繫管理員或使用 Firebase 配置。');
                return;
            } else {
                await sendPasswordResetEmail(auth, email);
            }
        } catch (error) {
            console.error('密碼重設失敗:', error);
            throw this.handleAuthError(error);
        }
    }
    
    // 獲取當前使用者
    getCurrentUser() {
        return this.currentUser;
    }
    
    // 檢查是否已登入
    isAuthenticated() {
        return this.currentUser !== null;
    }
    
    // 錯誤處理
    handleAuthError(error) {
        const errorMessages = {
            'auth/user-not-found': '找不到此使用者帳號',
            'auth/wrong-password': '密碼錯誤',
            'auth/email-already-in-use': '此電子郵件已被註冊',
            'auth/weak-password': '密碼強度不足（至少6個字元）',
            'auth/invalid-email': '電子郵件格式不正確',
            'auth/user-disabled': '此帳號已被停用',
            'auth/too-many-requests': '嘗試次數過多，請稍後再試',
            'auth/network-request-failed': '網路連線失敗',
            'auth/requires-recent-login': '請重新登入後再試'
        };
        
        const message = errorMessages[error.code] || error.message || '發生未知錯誤';
        return new Error(message);
    }
}

// 創建認證管理器實例
const authManager = new AuthManager();

// UI 控制函數
function initializeAuthUI() {
    // 監聽認證狀態變化
    authManager.onAuthStateChanged((user) => {
        updateUIForAuthState(user);
    });
    
    // 設置表單事件監聽器
    setupFormListeners();
}

function updateUIForAuthState(user) {
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    
    if (user) {
        // 使用者已登入
        loginBtn.style.display = 'none';
        userMenu.style.display = 'block';
        userName.textContent = user.displayName || user.email;
        
        // 顯示主要功能頁面
        if (window.location.hash === '' || window.location.hash === '#login') {
            showPage('dashboard');
        }
    } else {
        // 使用者未登入
        loginBtn.style.display = 'block';
        userMenu.style.display = 'none';
        
        // 顯示登入頁面
        showPage('login');
    }
}

function setupFormListeners() {
    // 登入表單
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                showLoading(true);
                await authManager.login(email, password);
                showToast('登入成功！', 'success');
            } catch (error) {
                showToast(error.message, 'error');
            } finally {
                showLoading(false);
            }
        });
    }
    
    // 註冊表單
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                showToast('密碼確認不符', 'error');
                return;
            }
            
            try {
                showLoading(true);
                await authManager.register(email, password, name);
                showToast('註冊成功！', 'success');
            } catch (error) {
                showToast(error.message, 'error');
            } finally {
                showLoading(false);
            }
        });
    }
}

// 全域函數
window.logout = async function() {
    try {
        showLoading(true);
        await authManager.logout();
        showToast('已成功登出', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        showLoading(false);
    }
};

window.resetPassword = async function() {
    const email = document.getElementById('loginEmail').value;
    
    if (!email) {
        showToast('請先輸入電子郵件', 'error');
        return;
    }
    
    try {
        showLoading(true);
        await authManager.resetPassword(email);
        showToast('密碼重設郵件已發送', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        showLoading(false);
    }
};

// 工具函數
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.classList.toggle('d-none', !show);
    }
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toastId = 'toast_' + Date.now();
    const iconClass = {
        'success': 'bi-check-circle-fill',
        'error': 'bi-exclamation-triangle-fill',
        'warning': 'bi-exclamation-triangle-fill',
        'info': 'bi-info-circle-fill'
    }[type] || 'bi-info-circle-fill';
    
    const bgClass = {
        'success': 'bg-success',
        'error': 'bg-danger',
        'warning': 'bg-warning',
        'info': 'bg-info'
    }[type] || 'bg-info';
    
    const toastHTML = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${bgClass} text-white">
                <i class="bi ${iconClass} me-2"></i>
                <strong class="me-auto">系統通知</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // 自動移除 toast 元素
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// 頁面切換函數
window.showPage = function(pageId) {
    // 隱藏所有頁面
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => {
        page.style.display = 'none';
    });
    
    // 顯示指定頁面
    const targetPage = document.getElementById(pageId + 'Page');
    if (targetPage) {
        targetPage.style.display = 'block';
        
        // 更新導航列活動狀態
        updateNavigation(pageId);
        
        // 載入頁面特定數據
        loadPageData(pageId);
    }
};

function updateNavigation(activePageId) {
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // 這裡可以添加更複雜的導航邏輯
}

function loadPageData(pageId) {
    // 根據頁面載入相應數據
    switch(pageId) {
        case 'dashboard':
            if (typeof loadDashboardData === 'function') {
                loadDashboardData();
            }
            break;
        case 'vehicles':
            if (typeof loadVehicles === 'function') {
                loadVehicles();
            }
            break;
        case 'history':
            if (typeof loadHistory === 'function') {
                loadHistory();
            }
            break;
        case 'reports':
            if (typeof loadReports === 'function') {
                loadReports();
            }
            break;
    }
}

// 導出認證管理器
export { authManager, initializeAuthUI };

// 當 DOM 載入完成時初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeAuthUI();
});