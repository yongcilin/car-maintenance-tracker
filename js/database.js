// 資料庫管理模組
import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    getDocs, 
    getDoc,
    query, 
    where, 
    orderBy, 
    limit 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { db, useLocalStorage, localStorageManager } from './firebase-config.js';
import { authManager } from './auth.js';

// 保養項目分類和預設項目
const MAINTENANCE_CATEGORIES = {
    engine: {
        name: '🔧 引擎系統',
        items: [
            { name: '機油', commonNotes: ['0W/20', '5W/30', '5W/40', '10W/40', '全合成', '半合成', '礦物油'] },
            { name: '機油芯', commonNotes: ['原廠', '副廠', 'Bosch', 'Mann', 'Mahle'] },
            { name: '火星塞', commonNotes: ['銥合金', '白金', '銅芯', 'NGK', 'Denso', 'Bosch'] },
            { name: '點火線圈', commonNotes: ['原廠', '副廠'] },
            { name: '正時皮帶', commonNotes: ['原廠', '副廠', 'Gates', 'Dayco'] },
            { name: '發電機皮帶', commonNotes: ['原廠', '副廠'] },
            { name: '水幫浦皮帶', commonNotes: ['原廠', '副廠', 'Gates', 'Dayco'] },
            { name: '冷卻水幫浦', commonNotes: ['原廠', '副廠'] },
            { name: '節溫器', commonNotes: ['原廠', '副廠'] },
            { name: '引擎腳墊', commonNotes: ['原廠', '副廠', '橡膠', '液壓'] },
            { name: '汽缸床墊片', commonNotes: ['原廠', '副廠'] },
            { name: '油底殼放油塞墊片', commonNotes: ['原廠', '副廠', '銅墊片', '鋁墊片'] },
            { name: '汽門室墊片', commonNotes: ['原廠', '副廠', '橡膠', '矽膠'] },
            { name: '引擎機油添加劑', commonNotes: ['抗磨劑', '密封劑', '清潔劑', '黏度改進劑'] }
        ]
    },
    filter: {
        name: '🌪️ 濾芯系統',
        items: [
            { name: '空氣濾芯', commonNotes: ['原廠', '副廠', 'K&N', 'Bosch', 'Mann'] },
            { name: '汽油濾芯', commonNotes: ['原廠', '副廠', 'Bosch', 'Mann'] },
            { name: '冷氣濾芯', commonNotes: ['原廠', '副廠', '活性碳', '一般型'] },
            { name: '冷氣活性碳濾網', commonNotes: ['原廠', '副廠', '活性碳', '抗菌型', 'PM2.5'] },
            { name: '機油濾芯', commonNotes: ['原廠', '副廠', 'Bosch', 'Mann', 'Mahle'] }
        ]
    },
    fluid: {
        name: '🛢️ 油品系統',
        items: [
            { name: '煞車油', commonNotes: ['DOT 3', 'DOT 4', 'DOT 5.1'] },
            { name: '動力方向機油', commonNotes: ['ATF', 'PSF', '原廠規格'] },
            { name: '冷卻水', commonNotes: ['長效型', '一般型', '原廠規格'] },
            { name: '雨刷精', commonNotes: ['濃縮型', '稀釋型', '防凍型'] },
            { name: '差速器油', commonNotes: ['75W-90', '80W-90', '85W-140'] },
            { name: '齒輪油', commonNotes: ['75W-90', '80W-90'] },
            { name: '液壓油', commonNotes: ['原廠規格'] }
        ]
    },
    tire: {
        name: '🛞 輪胎系統',
        items: [
            { name: '輪胎更換', commonNotes: ['195/65R15', '205/55R16', '225/45R17', 'Michelin', 'Bridgestone', 'Continental'] },
            { name: '輪胎平衡', commonNotes: ['動態平衡', '靜態平衡'] },
            { name: '四輪定位', commonNotes: ['前輪定位', '四輪定位'] },
            { name: '輪胎調位', commonNotes: ['前後調位', '對角調位'] },
            { name: '輪胎調胎', commonNotes: ['前後調胎', '對角調胎', '十字調胎'] },
            { name: '胎壓檢查', commonNotes: ['標準胎壓', '調整胎壓'] },
            { name: '補胎', commonNotes: ['內補', '外補', '蘑菇釘'] }
        ]
    },
    brake: {
        name: '🛑 煞車系統',
        items: [
            { name: '煞車來令片', commonNotes: ['前輪', '後輪', '原廠', '副廠', 'Brembo'] },
            { name: '煞車碟盤', commonNotes: ['前輪', '後輪', '原廠', '副廠'] },
            { name: '煞車鼓', commonNotes: ['後輪', '原廠', '副廠'] },
            { name: '煞車來令片', commonNotes: ['後輪', '原廠', '副廠'] },
            { name: '煞車油管', commonNotes: ['前輪', '後輪', '不鏽鋼'] },
            { name: '煞車卡鉗', commonNotes: ['前輪', '後輪', '原廠', '副廠'] },
            { name: '手煞車調整', commonNotes: ['調整', '更換拉線'] }
        ]
    },
    electrical: {
        name: '⚡ 電系統',
        items: [
            { name: '電瓶', commonNotes: ['55D23L', '75D23L', '80D26L', '免保養', '加水式'] },
            { name: '發電機', commonNotes: ['原廠', '副廠', '重建品'] },
            { name: '啟動馬達', commonNotes: ['原廠', '副廠', '重建品'] },
            { name: '大燈燈泡', commonNotes: ['H1', 'H4', 'H7', 'LED', 'HID'] },
            { name: '方向燈燈泡', commonNotes: ['一般型', 'LED'] },
            { name: '煞車燈燈泡', commonNotes: ['一般型', 'LED'] },
            { name: '保險絲', commonNotes: ['10A', '15A', '20A', '30A'] },
            { name: '電瓶樁頭清潔', commonNotes: ['清潔', '防鏽處理'] }
        ]
    },
    suspension: {
        name: '🏃 懸吊系統',
        items: [
            { name: '避震器', commonNotes: ['前輪', '後輪', '原廠', 'KYB', 'Bilstein'] },
            { name: '彈簧', commonNotes: ['前輪', '後輪', '原廠', '副廠'] },
            { name: '防傾桿', commonNotes: ['前', '後', '原廠', '副廠'] },
            { name: '防傾桿連桿', commonNotes: ['前', '後', '原廠', '副廠'] },
            { name: '球接頭', commonNotes: ['上', '下', '原廠', '副廠'] },
            { name: '三角架', commonNotes: ['上', '下', '原廠', '副廠'] },
            { name: '襯套', commonNotes: ['橡膠', 'PU', '原廠', '副廠'] }
        ]
    },
    ac: {
        name: '❄️ 空調系統',
        items: [
            { name: '冷媒補充', commonNotes: ['R134a', 'R1234yf'] },
            { name: '壓縮機', commonNotes: ['原廠', '副廠', '重建品'] },
            { name: '冷凝器', commonNotes: ['原廠', '副廠'] },
            { name: '蒸發器', commonNotes: ['原廠', '副廠'] },
            { name: '膨脹閥', commonNotes: ['原廠', '副廠'] },
            { name: '乾燥瓶', commonNotes: ['原廠', '副廠'] },
            { name: '冷氣皮帶', commonNotes: ['原廠', '副廠', 'Gates', 'Dayco'] },
            { name: '空調管路清洗', commonNotes: ['殺菌', '除臭'] },
            { name: '空調系統除菌劑', commonNotes: ['泡沫型', '噴霧型', '臭氧除菌', '銀離子除菌'] }
        ]
    },
    cleaning: {
        name: '🧽 清潔保養',
        items: [
            { name: '噴油嘴清洗劑', commonNotes: ['3M', 'Liqui Moly', 'STP'] },
            { name: '引擎清洗劑', commonNotes: ['內部清洗', '外部清洗'] },
            { name: '冷卻系統清洗', commonNotes: ['水箱清洗', '管路清洗'] },
            { name: '節氣門清洗', commonNotes: ['化油器清洗劑', '專用清洗劑'] },
            { name: '進氣系統清洗', commonNotes: ['進氣道清洗', '積碳清除'] },
            { name: '車身打蠟', commonNotes: ['固蠟', '液蠟', '鍍膜'] },
            { name: '內裝清潔', commonNotes: ['皮革保養', '塑膠保養'] },
            { name: '引擎室清洗', commonNotes: ['蒸氣清洗', '泡沫清洗'] },
            { name: '積碳清除劑', commonNotes: ['汽油添加劑', '專業清洗'] },
            { name: '油路清洗劑', commonNotes: ['汽油系統', '柴油系統'] },
            { name: '汽油管路拔水劑', commonNotes: ['異丙醇型', '乙醇型', '防凍型'] },
            { name: '煞車系統及零件清洗劑', commonNotes: ['脫脂清洗', '除鏽清洗', '專用清洗劑'] }
        ]
    },
    gearbox: {
        name: '⚙️ 變速箱系統',
        items: [
            { name: '變速箱油', commonNotes: ['ATF', 'CVT', '手排油', '原廠規格'] },
            { name: '變速箱濾芯', commonNotes: ['原廠', '副廠'] },
            { name: '變速箱清洗', commonNotes: ['ATF清洗', 'CVT清洗'] },
            { name: '變速箱維修', commonNotes: ['大修', '小修', '調整'] },
            { name: '自動變速箱油底殼放油塞', commonNotes: ['原廠', '副廠', '磁性', '一般型'] },
            { name: '變速箱卸油塞墊片', commonNotes: ['原廠', '副廠', '銅墊片', '鋁墊片', '橡膠墊片'] },
            { name: '變速箱油冷卻器', commonNotes: ['原廠', '副廠'] },
            { name: '變速箱電磁閥', commonNotes: ['原廠', '副廠'] },
            { name: '變速箱油管', commonNotes: ['高壓管', '回油管', '原廠', '副廠'] }
        ]
    },
    transmission: {
        name: '🔩 傳動系統',
        items: [
            { name: '離合器片', commonNotes: ['原廠', '副廠', '強化型'] },
            { name: '離合器壓板', commonNotes: ['原廠', '副廠'] },
            { name: '離合器分離軸承', commonNotes: ['原廠', '副廠'] },
            { name: '傳動軸', commonNotes: ['前', '後', '原廠', '副廠'] },
            { name: '萬向接頭', commonNotes: ['原廠', '副廠'] },
            { name: 'CV接頭', commonNotes: ['內', '外', '原廠', '副廠'] }
        ]
    },
    body: {
        name: '🪟 車身外觀',
        items: [
            { name: '雨刷片', commonNotes: ['前擋', '後擋', 'Bosch', 'Valeo'] },
            { name: '後視鏡', commonNotes: ['左', '右', '原廠', '副廠'] },
            { name: '車窗玻璃', commonNotes: ['前擋', '後擋', '側窗'] },
            { name: '車身鈑金', commonNotes: ['修復', '更換'] },
            { name: '烤漆', commonNotes: ['局部', '全車'] },
            { name: '保險桿', commonNotes: ['前', '後', '修復', '更換'] },
            { name: '車門把手', commonNotes: ['內', '外', '原廠', '副廠'] }
        ]
    },
    safety: {
        name: '🛡️ 安全檢查',
        items: [
            { name: '年度驗車', commonNotes: ['定期檢驗', '臨時檢驗'] },
            { name: '排氣檢驗', commonNotes: ['廢氣檢測', '噪音檢測'] },
            { name: '安全帶檢查', commonNotes: ['前座', '後座'] },
            { name: '喇叭檢查', commonNotes: ['音量檢測', '功能檢測'] },
            { name: '燈光檢查', commonNotes: ['大燈', '方向燈', '煞車燈'] },
            { name: '後視鏡調整', commonNotes: ['角度調整', '功能檢查'] }
        ]
    },
    other: {
        name: '🔧 其他項目',
        items: [
            { name: '工資', commonNotes: ['基本工資', '技師工資', '專業工資', '加班工資'] },
            { name: '自訂項目', commonNotes: [] },
            { name: '緊急維修', commonNotes: ['道路救援', '臨時修復'] },
            { name: '拖吊費用', commonNotes: ['一般拖吊', '事故拖吊'] },
            { name: '檢查費用', commonNotes: ['電腦診斷', '目視檢查'] },
            { name: '其他雜項', commonNotes: [] }
        ]
    }
};

class DatabaseManager {
    constructor() {
        this.useLocal = useLocalStorage;
    }
    
    // 保養廠管理
    async addServiceShop(shopData) {
        try {
            if (this.useLocal) {
                return await localStorageManager.addServiceShop(shopData);
            } else {
                const user = authManager.getCurrentUser();
                if (!user) throw new Error('請先登入');
                
                const docRef = await addDoc(collection(db, 'serviceShops'), {
                    ...shopData,
                    userId: user.uid,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                
                return { id: docRef.id, ...shopData };
            }
        } catch (error) {
            console.error('新增保養廠失敗:', error);
            throw error;
        }
    }
    
    async getServiceShops() {
        try {
            if (this.useLocal) {
                return await localStorageManager.getServiceShops();
            } else {
                const user = authManager.getCurrentUser();
                if (!user) return [];
                
                const q = query(
                    collection(db, 'serviceShops'),
                    where('userId', '==', user.uid),
                    orderBy('createdAt', 'desc')
                );
                
                const querySnapshot = await getDocs(q);
                return querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            }
        } catch (error) {
            console.error('獲取保養廠列表失敗:', error);
            throw error;
        }
    }
    
    async updateServiceShop(shopId, updateData) {
        try {
            if (this.useLocal) {
                return await localStorageManager.updateServiceShop(shopId, updateData);
            } else {
                const shopRef = doc(db, 'serviceShops', shopId);
                await updateDoc(shopRef, {
                    ...updateData,
                    updatedAt: new Date()
                });
                return { id: shopId, ...updateData };
            }
        } catch (error) {
            console.error('更新保養廠失敗:', error);
            throw error;
        }
    }
    
    async deleteServiceShop(shopId) {
        try {
            if (this.useLocal) {
                return await localStorageManager.deleteServiceShop(shopId);
            } else {
                await deleteDoc(doc(db, 'serviceShops', shopId));
                return true;
            }
        } catch (error) {
            console.error('刪除保養廠失敗:', error);
            throw error;
        }
    }

    // 車輛管理
    async addVehicle(vehicleData) {
        try {
            if (this.useLocal) {
                return await localStorageManager.addVehicle(vehicleData);
            } else {
                const user = authManager.getCurrentUser();
                if (!user) throw new Error('請先登入');
                
                const docRef = await addDoc(collection(db, 'vehicles'), {
                    ...vehicleData,
                    userId: user.uid,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                
                return { id: docRef.id, ...vehicleData };
            }
        } catch (error) {
            console.error('新增車輛失敗:', error);
            throw error;
        }
    }
    
    async getVehicles() {
        try {
            if (this.useLocal) {
                return await localStorageManager.getVehicles();
            } else {
                const user = authManager.getCurrentUser();
                if (!user) return [];
                
                const q = query(
                    collection(db, 'vehicles'),
                    where('userId', '==', user.uid),
                    orderBy('createdAt', 'desc')
                );
                
                const querySnapshot = await getDocs(q);
                return querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            }
        } catch (error) {
            console.error('獲取車輛列表失敗:', error);
            throw error;
        }
    }
    
    async updateVehicle(vehicleId, updateData) {
        try {
            if (this.useLocal) {
                return await localStorageManager.updateVehicle(vehicleId, updateData);
            } else {
                const vehicleRef = doc(db, 'vehicles', vehicleId);
                await updateDoc(vehicleRef, {
                    ...updateData,
                    updatedAt: new Date()
                });
                return { id: vehicleId, ...updateData };
            }
        } catch (error) {
            console.error('更新車輛失敗:', error);
            throw error;
        }
    }
    
    async deleteVehicle(vehicleId) {
        try {
            if (this.useLocal) {
                return await localStorageManager.deleteVehicle(vehicleId);
            } else {
                await deleteDoc(doc(db, 'vehicles', vehicleId));
                return true;
            }
        } catch (error) {
            console.error('刪除車輛失敗:', error);
            throw error;
        }
    }
    
    // 保養記錄管理
    async addMaintenanceRecord(recordData) {
        try {
            if (this.useLocal) {
                return await localStorageManager.addMaintenanceRecord(recordData);
            } else {
                const user = authManager.getCurrentUser();
                if (!user) throw new Error('請先登入');
                
                const docRef = await addDoc(collection(db, 'maintenanceRecords'), {
                    ...recordData,
                    userId: user.uid,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                
                return { id: docRef.id, ...recordData };
            }
        } catch (error) {
            console.error('新增保養記錄失敗:', error);
            throw error;
        }
    }
    
    async getMaintenanceRecords(vehicleId = null, limit_count = null) {
        try {
            if (this.useLocal) {
                return await localStorageManager.getMaintenanceRecords(vehicleId);
            } else {
                const user = authManager.getCurrentUser();
                if (!user) return [];
                
                let q = query(
                    collection(db, 'maintenanceRecords'),
                    where('userId', '==', user.uid),
                    orderBy('date', 'asc')
                );
                
                if (vehicleId) {
                    q = query(q, where('vehicleId', '==', vehicleId), orderBy('date', 'asc'));
                }
                
                const querySnapshot = await getDocs(q);
                let records = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    date: doc.data().date.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
                }));
                
                // 在應用程式層面按日期降序排序（最新的在前面）
                records.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                // 如果有限制數量，取前面的記錄
                if (limit_count) {
                    records = records.slice(0, limit_count);
                }
                
                return records;
            }
        } catch (error) {
            console.error('獲取保養記錄失敗:', error);
            throw error;
        }
    }
    
    async updateMaintenanceRecord(recordId, updateData) {
        try {
            if (this.useLocal) {
                return await localStorageManager.updateMaintenanceRecord(recordId, updateData);
            } else {
                const recordRef = doc(db, 'maintenanceRecords', recordId);
                await updateDoc(recordRef, {
                    ...updateData,
                    updatedAt: new Date()
                });
                return { id: recordId, ...updateData };
            }
        } catch (error) {
            console.error('更新保養記錄失敗:', error);
            throw error;
        }
    }
    
    async deleteMaintenanceRecord(recordId) {
        try {
            if (this.useLocal) {
                return await localStorageManager.deleteMaintenanceRecord(recordId);
            } else {
                await deleteDoc(doc(db, 'maintenanceRecords', recordId));
                return true;
            }
        } catch (error) {
            console.error('刪除保養記錄失敗:', error);
            throw error;
        }
    }
    
    // 統計功能
    async getStatistics() {
        try {
            const records = await this.getMaintenanceRecords();
            const vehicles = await this.getVehicles();
            
            const totalRecords = records.length;
            const totalCost = records.reduce((sum, record) => sum + (record.totalAmount || 0), 0);
            const avgCost = totalRecords > 0 ? totalCost / totalRecords : 0;
            
            // 月度統計
            const monthlyStats = this.calculateMonthlyStats(records);
            
            // 分類統計
            const categoryStats = this.calculateCategoryStats(records);
            
            return {
                totalVehicles: vehicles.length,
                totalRecords,
                totalCost,
                avgCost,
                monthlyStats,
                categoryStats
            };
        } catch (error) {
            console.error('獲取統計資料失敗:', error);
            throw error;
        }
    }
    
    calculateMonthlyStats(records) {
        const monthlyData = {};
        
        records.forEach(record => {
            const date = new Date(record.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { count: 0, amount: 0 };
            }
            
            monthlyData[monthKey].count++;
            monthlyData[monthKey].amount += record.totalAmount || 0;
        });
        
        return monthlyData;
    }
    
    calculateCategoryStats(records) {
        const categoryData = {};
        
        records.forEach(record => {
            if (record.items && Array.isArray(record.items)) {
                record.items.forEach(item => {
                    const category = this.getItemCategory(item.name);
                    
                    if (!categoryData[category]) {
                        categoryData[category] = { count: 0, amount: 0 };
                    }
                    
                    categoryData[category].count++;
                    categoryData[category].amount += item.totalPrice || 0;
                });
            }
        });
        
        return categoryData;
    }
    
    getItemCategory(itemName) {
        for (const [categoryKey, category] of Object.entries(MAINTENANCE_CATEGORIES)) {
            if (category.items.some(item => item.name === itemName)) {
                return categoryKey;
            }
        }
        return 'other';
    }
    
    // 獲取保養項目分類
    getMaintenanceCategories() {
        return MAINTENANCE_CATEGORIES;
    }
    
    // 獲取常用備註
    getCommonNotes(itemName) {
        for (const category of Object.values(MAINTENANCE_CATEGORIES)) {
            const item = category.items.find(item => item.name === itemName);
            if (item) {
                return item.commonNotes || [];
            }
        }
        return [];
    }
}

// 創建資料庫管理器實例
const databaseManager = new DatabaseManager();

// 導出
export { databaseManager, MAINTENANCE_CATEGORIES };

// 全域變數
window.databaseManager = databaseManager;
window.MAINTENANCE_CATEGORIES = MAINTENANCE_CATEGORIES;