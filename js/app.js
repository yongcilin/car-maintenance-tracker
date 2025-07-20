// 主應用程式邏輯
import { authManager } from './auth.js';
import { databaseManager, MAINTENANCE_CATEGORIES } from './database.js';

class CarMaintenanceApp {
    constructor() {
        this.currentVehicles = [];
        this.currentRecords = [];
        this.currentServiceShops = [];
        this.charts = {};
        this.init();
    }
    
    async init() {
        // 等待認證狀態確定
        authManager.onAuthStateChanged((user) => {
            if (user) {
                this.loadInitialData();
            }
        });
        
        // 設置事件監聽器
        this.setupEventListeners();
        
        // 設置今天的日期為預設值
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('maintenanceDate');
        if (dateInput) {
            dateInput.value = today;
        }
    }
    
    async loadInitialData() {
        try {
            await this.loadVehicles();
            await this.loadServiceShops();
            await this.loadDashboardData();
        } catch (error) {
            console.error('載入初始資料失敗:', error);
            this.showToast('載入資料失敗', 'error');
        }
    }
    
    setupEventListeners() {
        // 車輛表單
        const addVehicleForm = document.getElementById('addVehicleForm');
        if (addVehicleForm) {
            addVehicleForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveVehicle();
            });
        }
        
        // 保養廠表單
        const addServiceShopForm = document.getElementById('addServiceShopForm');
        if (addServiceShopForm) {
            addServiceShopForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveServiceShop();
            });
        }
        
        // 保養記錄表單
        const maintenanceForm = document.getElementById('maintenanceForm');
        if (maintenanceForm) {
            maintenanceForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveMaintenanceRecord();
            });
        }
        
        // 篩選事件
        const filterInputs = ['filterVehicle', 'filterDateFrom', 'filterDateTo'];
        filterInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.filterHistory());
            }
        });
    }
    
    // 儀表板功能
    async loadDashboardData() {
        try {
            const stats = await databaseManager.getStatistics();
            
            // 更新統計卡片
            document.getElementById('totalVehicles').textContent = stats.totalVehicles;
            document.getElementById('totalRecords').textContent = stats.totalRecords;
            document.getElementById('totalCost').textContent = `NT$ ${stats.totalCost.toLocaleString()}`;
            document.getElementById('avgCost').textContent = `NT$ ${Math.round(stats.avgCost).toLocaleString()}`;
            
            // 載入最近記錄
            await this.loadRecentRecords();
            
        } catch (error) {
            console.error('載入儀表板資料失敗:', error);
        }
    }
    
    async loadRecentRecords() {
        try {
            const records = await databaseManager.getMaintenanceRecords(null, 10);
            const vehicles = await databaseManager.getVehicles();
            const vehicleMap = {};
            vehicles.forEach(v => vehicleMap[v.id] = v);
            
            const container = document.getElementById('recentRecords');
            if (!container) return;
            
            if (records.length === 0) {
                container.innerHTML = '<p class="text-muted">暫無保養記錄</p>';
                return;
            }
            
            const recordsHTML = records.map(record => {
                const vehicle = vehicleMap[record.vehicleId];
                const vehicleName = vehicle ? vehicle.nickname : '未知車輛';
                const date = new Date(record.date).toLocaleDateString('zh-TW');
                
                return `
                    <div class="border-bottom pb-2 mb-2" style="cursor: pointer;" onclick="app.showRecordDetail('${record.id}')">
                        <div class="d-flex justify-content-between">
                            <div>
                                <strong>${vehicleName}</strong>
                                <small class="text-muted d-block">${date} | ${record.mileage.toLocaleString()} 公里</small>
                            </div>
                            <div class="text-end">
                                <strong class="text-success">NT$ ${record.totalAmount.toLocaleString()}</strong>
                                <small class="text-muted d-block">點擊查看詳情</small>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = recordsHTML;
            
        } catch (error) {
            console.error('載入最近記錄失敗:', error);
        }
    }
    
    // 車輛管理功能
    async loadVehicles() {
        try {
            this.currentVehicles = await databaseManager.getVehicles();
            this.renderVehicles();
            this.updateVehicleSelects();
        } catch (error) {
            console.error('載入車輛失敗:', error);
            this.showToast('載入車輛失敗', 'error');
        }
    }
    
    renderVehicles() {
        const container = document.getElementById('vehiclesList');
        if (!container) return;
        
        if (this.currentVehicles.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="text-center py-5">
                        <i class="bi bi-car-front display-1 text-muted"></i>
                        <h4 class="text-muted mt-3">尚未新增車輛</h4>
                        <p class="text-muted">點擊上方按鈕新增您的第一台車輛</p>
                    </div>
                </div>
            `;
            return;
        }
        
        const vehiclesHTML = this.currentVehicles.map(vehicle => `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card vehicle-card">
                    <div class="card-img-top d-flex align-items-center justify-content-center" style="height: 150px; background: linear-gradient(135deg, #007bff, #0056b3);">
                        <i class="bi bi-car-front-fill text-white" style="font-size: 3rem;"></i>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${vehicle.nickname}</h5>
                        <div class="vehicle-info">
                            <p class="mb-1"><i class="bi bi-credit-card"></i> ${vehicle.licensePlate}</p>
                            ${vehicle.brand ? `<p class="mb-1"><i class="bi bi-tag"></i> ${vehicle.brand} ${vehicle.model || ''}</p>` : ''}
                            ${vehicle.year ? `<p class="mb-1"><i class="bi bi-calendar"></i> ${vehicle.year} 年</p>` : ''}
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-sm btn-outline-primary me-2" onclick="app.editVehicle('${vehicle.id}')">
                                <i class="bi bi-pencil"></i> 編輯
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="app.deleteVehicle('${vehicle.id}')">
                                <i class="bi bi-trash"></i> 刪除
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = vehiclesHTML;
    }
    
    updateVehicleSelects() {
        const selects = ['vehicleSelect', 'filterVehicle'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) return;
            
            // 保存當前選擇
            const currentValue = select.value;
            
            // 清空並重新填充選項
            if (selectId === 'vehicleSelect') {
                select.innerHTML = '<option value="">請選擇車輛</option>';
            } else {
                select.innerHTML = '<option value="">所有車輛</option>';
            }
            
            this.currentVehicles.forEach(vehicle => {
                const option = document.createElement('option');
                option.value = vehicle.id;
                option.textContent = `${vehicle.nickname} (${vehicle.licensePlate})`;
                select.appendChild(option);
            });
            
            // 恢復選擇
            select.value = currentValue;
        });
    }
    
    showAddVehicleModal() {
        const modal = new bootstrap.Modal(document.getElementById('addVehicleModal'));
        
        // 清空表單
        document.getElementById('addVehicleForm').reset();
        
        modal.show();
    }
    
    async saveVehicle() {
        try {
            const formData = {
                nickname: document.getElementById('vehicleNickname').value,
                licensePlate: document.getElementById('licensePlate').value,
                brand: document.getElementById('vehicleBrand').value,
                model: document.getElementById('vehicleModel').value,
                year: parseInt(document.getElementById('vehicleYear').value) || null
            };
            
            await databaseManager.addVehicle(formData);
            
            // 關閉模態框
            const modal = bootstrap.Modal.getInstance(document.getElementById('addVehicleModal'));
            modal.hide();
            
            // 重新載入車輛列表
            await this.loadVehicles();
            await this.loadDashboardData();
            
            this.showToast('車輛新增成功！', 'success');
            
        } catch (error) {
            console.error('儲存車輛失敗:', error);
            this.showToast('儲存車輛失敗', 'error');
        }
    }
    
    async editVehicle(vehicleId) {
        // 這裡可以實作編輯功能
        this.showToast('編輯功能開發中', 'info');
    }
    
    async deleteVehicle(vehicleId) {
        if (!confirm('確定要刪除這台車輛嗎？相關的保養記錄也會一併刪除。')) {
            return;
        }
        
        try {
            await databaseManager.deleteVehicle(vehicleId);
            await this.loadVehicles();
            await this.loadDashboardData();
            this.showToast('車輛刪除成功', 'success');
        } catch (error) {
            console.error('刪除車輛失敗:', error);
            this.showToast('刪除車輛失敗', 'error');
        }
    }
    
    // 保養廠管理功能
    async loadServiceShops() {
        try {
            this.currentServiceShops = await databaseManager.getServiceShops();
            this.renderServiceShops();
            this.updateServiceShopSelects();
        } catch (error) {
            console.error('載入保養廠失敗:', error);
            this.showToast('載入保養廠失敗', 'error');
        }
    }
    
    renderServiceShops() {
        const container = document.getElementById('serviceShopsList');
        if (!container) return;
        
        if (this.currentServiceShops.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="text-center py-5">
                        <i class="bi bi-shop display-1 text-muted"></i>
                        <h4 class="text-muted mt-3">尚未新增保養廠</h4>
                        <p class="text-muted">點擊上方按鈕新增您的第一家保養廠</p>
                    </div>
                </div>
            `;
            return;
        }
        
        const shopsHTML = this.currentServiceShops.map(shop => `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card service-shop-card">
                    <div class="card-img-top d-flex align-items-center justify-content-center" style="height: 150px; background: linear-gradient(135deg, #28a745, #20c997);">
                        <i class="bi bi-shop text-white" style="font-size: 3rem;"></i>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${shop.name}</h5>
                        <div class="shop-info">
                            ${shop.address ? `<p class="mb-1"><i class="bi bi-geo-alt"></i> ${shop.address}</p>` : ''}
                            ${shop.phone ? `<p class="mb-1"><i class="bi bi-telephone"></i> ${shop.phone}</p>` : ''}
                            ${shop.notes ? `<p class="mb-1 text-muted"><i class="bi bi-chat-text"></i> ${shop.notes}</p>` : ''}
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-sm btn-outline-primary me-2" onclick="app.editServiceShop('${shop.id}')">
                                <i class="bi bi-pencil"></i> 編輯
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="app.deleteServiceShop('${shop.id}')">
                                <i class="bi bi-trash"></i> 刪除
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = shopsHTML;
    }
    
    updateServiceShopSelects() {
        const select = document.getElementById('serviceShopSelect');
        if (!select) return;
        
        // 保存當前選擇
        const currentValue = select.value;
        
        // 清空並重新填充選項
        select.innerHTML = '<option value="">請選擇保養廠</option>';
        
        this.currentServiceShops.forEach(shop => {
            const option = document.createElement('option');
            option.value = shop.id;
            option.textContent = shop.name;
            select.appendChild(option);
        });
        
        // 恢復選擇
        select.value = currentValue;
    }
    
    showAddServiceShopModal() {
        const modal = new bootstrap.Modal(document.getElementById('addServiceShopModal'));
        
        // 清空表單
        document.getElementById('addServiceShopForm').reset();
        
        modal.show();
    }
    
    async saveServiceShop() {
        try {
            const formData = {
                name: document.getElementById('shopName').value,
                address: document.getElementById('shopAddress').value,
                phone: document.getElementById('shopPhone').value,
                notes: document.getElementById('shopNotes').value
            };
            
            if (!formData.name) {
                this.showToast('請輸入保養廠名稱', 'error');
                return;
            }
            
            await databaseManager.addServiceShop(formData);
            
            // 關閉模態框
            const modal = bootstrap.Modal.getInstance(document.getElementById('addServiceShopModal'));
            modal.hide();
            
            // 重新載入保養廠列表
            await this.loadServiceShops();
            
            this.showToast('保養廠新增成功！', 'success');
            
        } catch (error) {
            console.error('儲存保養廠失敗:', error);
            this.showToast('儲存保養廠失敗', 'error');
        }
    }
    
    async editServiceShop(shopId) {
        // 這裡可以實作編輯功能
        this.showToast('編輯功能開發中', 'info');
    }
    
    async deleteServiceShop(shopId) {
        if (!confirm('確定要刪除這家保養廠嗎？')) {
            return;
        }
        
        try {
            await databaseManager.deleteServiceShop(shopId);
            await this.loadServiceShops();
            this.showToast('保養廠刪除成功', 'success');
        } catch (error) {
            console.error('刪除保養廠失敗:', error);
            this.showToast('刪除保養廠失敗', 'error');
        }
    }
    
    // 保養記錄功能
    addMaintenanceItem() {
        const container = document.getElementById('maintenanceItems');
        const itemIndex = container.children.length;
        
        const itemHTML = `
            <div class="maintenance-item" data-index="${itemIndex}">
                <div class="row">
                    <div class="col-md-3 mb-2">
                        <label class="form-label">分類</label>
                        <select class="form-select category-select" onchange="app.updateItemOptions(${itemIndex})">
                            <option value="">選擇分類</option>
                            ${Object.entries(MAINTENANCE_CATEGORIES).map(([key, category]) => 
                                `<option value="${key}">${category.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="col-md-3 mb-2">
                        <label class="form-label">項目</label>
                        <select class="form-select item-select" onchange="app.updateItemNotes(${itemIndex})">
                            <option value="">選擇項目</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-2">
                        <label class="form-label">備註</label>
                        <div class="input-group">
                            <select class="form-select note-select" style="max-width: 200px;">
                                <option value="">常用備註</option>
                            </select>
                            <input type="text" class="form-control item-note" placeholder="自訂備註">
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-3 mb-2">
                        <label class="form-label">數量</label>
                        <input type="number" class="form-control item-quantity" min="1" step="1" value="1" onchange="app.calculateItemTotal(${itemIndex})">
                    </div>
                    <div class="col-md-3 mb-2">
                        <label class="form-label">單價 (NT$)</label>
                        <input type="number" class="form-control item-price" min="0" onchange="app.calculateItemTotal(${itemIndex})">
                    </div>
                    <div class="col-md-3 mb-2">
                        <label class="form-label">總額 (NT$)</label>
                        <input type="number" class="form-control item-total" readonly>
                    </div>
                    <div class="col-md-3 mb-2 d-flex align-items-end">
                        <button type="button" class="btn btn-outline-danger w-100" onclick="app.removeMaintenanceItem(${itemIndex})">
                            <i class="bi bi-trash"></i> 移除
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', itemHTML);
    }
    
    updateItemOptions(itemIndex) {
        const item = document.querySelector(`[data-index="${itemIndex}"]`);
        const categorySelect = item.querySelector('.category-select');
        const itemSelect = item.querySelector('.item-select');
        const noteSelect = item.querySelector('.note-select');
        
        const categoryKey = categorySelect.value;
        
        // 清空項目選擇
        itemSelect.innerHTML = '<option value="">選擇項目</option>';
        noteSelect.innerHTML = '<option value="">常用備註</option>';
        
        if (categoryKey && MAINTENANCE_CATEGORIES[categoryKey]) {
            const category = MAINTENANCE_CATEGORIES[categoryKey];
            category.items.forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                itemSelect.appendChild(option);
            });
        }
    }
    
    updateItemNotes(itemIndex) {
        const item = document.querySelector(`[data-index="${itemIndex}"]`);
        const itemSelect = item.querySelector('.item-select');
        const noteSelect = item.querySelector('.note-select');
        
        const itemName = itemSelect.value;
        
        // 清空備註選擇
        noteSelect.innerHTML = '<option value="">常用備註</option>';
        
        if (itemName) {
            const commonNotes = databaseManager.getCommonNotes(itemName);
            commonNotes.forEach(note => {
                const option = document.createElement('option');
                option.value = note;
                option.textContent = note;
                noteSelect.appendChild(option);
            });
        }
        
        // 設置備註選擇事件
        noteSelect.onchange = () => {
            if (noteSelect.value) {
                const noteInput = item.querySelector('.item-note');
                noteInput.value = noteSelect.value;
            }
        };
    }
    
    calculateItemTotal(itemIndex) {
        const item = document.querySelector(`[data-index="${itemIndex}"]`);
        const quantity = parseFloat(item.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(item.querySelector('.item-price').value) || 0;
        const total = quantity * price;
        
        item.querySelector('.item-total').value = total;
        
        // 計算總金額
        this.calculateTotalAmount();
    }
    
    calculateTotalAmount() {
        const items = document.querySelectorAll('.maintenance-item');
        let total = 0;
        
        items.forEach(item => {
            const itemTotal = parseFloat(item.querySelector('.item-total').value) || 0;
            total += itemTotal;
        });
        
        document.getElementById('totalAmount').value = total;
    }
    
    removeMaintenanceItem(itemIndex) {
        const item = document.querySelector(`[data-index="${itemIndex}"]`);
        if (item) {
            item.remove();
            this.calculateTotalAmount();
        }
    }
    
    async saveMaintenanceRecord() {
        try {
            const vehicleId = document.getElementById('vehicleSelect').value;
            const serviceShopId = document.getElementById('serviceShopSelect').value;
            const date = document.getElementById('maintenanceDate').value;
            const mileage = parseInt(document.getElementById('currentMileage').value);
            const notes = document.getElementById('maintenanceNotes').value;
            
            if (!vehicleId) {
                this.showToast('請選擇車輛', 'error');
                return;
            }
            
            // 收集保養項目
            const items = [];
            const itemElements = document.querySelectorAll('.maintenance-item');
            
            itemElements.forEach(item => {
                const categorySelect = item.querySelector('.category-select');
                const itemSelect = item.querySelector('.item-select');
                const noteInput = item.querySelector('.item-note');
                const quantity = parseFloat(item.querySelector('.item-quantity').value) || 0;
                const price = parseFloat(item.querySelector('.item-price').value) || 0;
                const total = parseFloat(item.querySelector('.item-total').value) || 0;
                
                if (itemSelect.value && quantity > 0) {
                    items.push({
                        category: categorySelect.value,
                        name: itemSelect.value,
                        note: noteInput.value,
                        quantity: quantity,
                        unitPrice: price,
                        totalPrice: total
                    });
                }
            });
            
            if (items.length === 0) {
                this.showToast('請至少新增一個保養項目', 'error');
                return;
            }
            
            const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
            
            const recordData = {
                vehicleId,
                serviceShopId: serviceShopId || null,
                date: new Date(date),
                mileage,
                items,
                totalAmount,
                notes
            };
            
            if (this.editingRecordId) {
                // 修改模式
                await databaseManager.updateMaintenanceRecord(this.editingRecordId, recordData);
                this.showToast('保養記錄修改成功！', 'success');
                this.editingRecordId = null; // 清除編輯狀態
            } else {
                // 新增模式
                await databaseManager.addMaintenanceRecord(recordData);
                this.showToast('保養記錄儲存成功！', 'success');
            }
            
            // 清空表單
            document.getElementById('maintenanceForm').reset();
            document.getElementById('maintenanceItems').innerHTML = '';
            
            // 重新載入資料
            await this.loadDashboardData();
            
            // 切換到歷史頁面
            showPage('history');
            
        } catch (error) {
            console.error('儲存保養記錄失敗:', error);
            this.showToast('儲存保養記錄失敗', 'error');
        }
    }
    
    // 歷史查詢功能
    async loadHistory() {
        try {
            this.currentRecords = await databaseManager.getMaintenanceRecords();
            this.renderHistory(this.currentRecords);
        } catch (error) {
            console.error('載入歷史記錄失敗:', error);
            this.showToast('載入歷史記錄失敗', 'error');
        }
    }
    
    async filterHistory() {
        const vehicleId = document.getElementById('filterVehicle').value;
        const dateFrom = document.getElementById('filterDateFrom').value;
        const dateTo = document.getElementById('filterDateTo').value;
        
        let filteredRecords = [...this.currentRecords];
        
        if (vehicleId) {
            filteredRecords = filteredRecords.filter(record => record.vehicleId === vehicleId);
        }
        
        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            filteredRecords = filteredRecords.filter(record => new Date(record.date) >= fromDate);
        }
        
        if (dateTo) {
            const toDate = new Date(dateTo);
            filteredRecords = filteredRecords.filter(record => new Date(record.date) <= toDate);
        }
        
        this.renderHistory(filteredRecords);
        
        // 如果選擇了特定車輛，顯示切換到總表的按鈕
        const toggleBtn = document.getElementById('toggleViewBtn');
        if (vehicleId && toggleBtn) {
            toggleBtn.style.display = 'block';
            this.currentFilteredRecords = filteredRecords;
            this.currentSelectedVehicleId = vehicleId;
            
            // 如果目前在總表檢視模式，更新總表
            const summaryTable = document.getElementById('maintenanceSummaryTable');
            if (summaryTable && summaryTable.style.display === 'block') {
                this.generateMaintenanceSummary();
            }
        } else if (toggleBtn) {
            toggleBtn.style.display = 'none';
            // 如果沒有選擇車輛，隱藏總表並顯示記錄列表
            const summaryTable = document.getElementById('maintenanceSummaryTable');
            const historyResults = document.querySelector('#historyResults').closest('.row');
            if (summaryTable && summaryTable.style.display === 'block') {
                summaryTable.style.display = 'none';
                historyResults.style.display = 'block';
            }
        }
    }
    
    renderHistory(records) {
        const container = document.getElementById('historyResults');
        if (!container) return;
        
        if (records.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-clock-history display-1 text-muted"></i>
                    <h4 class="text-muted mt-3">沒有找到保養記錄</h4>
                    <p class="text-muted">調整篩選條件或新增保養記錄</p>
                </div>
            `;
            return;
        }
        
        const vehicleMap = {};
        this.currentVehicles.forEach(v => vehicleMap[v.id] = v);
        
        const recordsHTML = records.map(record => {
            const vehicle = vehicleMap[record.vehicleId];
            const vehicleName = vehicle ? vehicle.nickname : '未知車輛';
            const date = new Date(record.date).toLocaleDateString('zh-TW');
            
            const itemsHTML = record.items.map(item => `
                <div class="item-row">
                    <div>
                        <span class="item-name">${item.name}</span>
                        ${item.note ? `<div class="item-note">${item.note}</div>` : ''}
                        <small class="text-muted">${item.quantity} × NT$ ${item.unitPrice}</small>
                    </div>
                    <div class="item-price">NT$ ${item.totalPrice.toLocaleString()}</div>
                </div>
            `).join('');
            
            return `
                <div class="history-record">
                    <div class="record-header">
                        <div>
                            <div class="record-date">${vehicleName} - ${date}</div>
                            <small class="text-muted">${record.mileage.toLocaleString()} 公里</small>
                        </div>
                    </div>
                    ${record.notes ? `<div class="mb-2"><small class="text-muted">${record.notes}</small></div>` : ''}
                    <div class="record-items">
                        ${itemsHTML}
                        <div class="item-row total-row">
                            <div>
                                <span class="item-name"><strong>總計</strong></span>
                            </div>
                            <div class="item-price"><strong>NT$ ${record.totalAmount.toLocaleString()}</strong></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = recordsHTML;
    }
    
    // 保養項目總表功能
    toggleMaintenanceView() {
        const summaryTable = document.getElementById('maintenanceSummaryTable');
        const historyResults = document.querySelector('#historyResults').closest('.row');
        
        if (summaryTable.style.display === 'none' || summaryTable.style.display === '') {
            // 切換到總表檢視
            summaryTable.style.display = 'block';
            historyResults.style.display = 'none';
            this.generateMaintenanceSummary();
        } else {
            // 切換到記錄列表檢視
            summaryTable.style.display = 'none';
            historyResults.style.display = 'block';
        }
    }
    
    generateMaintenanceSummary() {
        if (!this.currentSelectedVehicleId || !this.currentFilteredRecords) {
            return;
        }
        
        // 獲取當前車輛的最新里程
        const vehicle = this.currentVehicles.find(v => v.id === this.currentSelectedVehicleId);
        const latestRecord = this.currentFilteredRecords[0]; // 最新記錄
        const currentMileage = latestRecord ? latestRecord.mileage : 0;
        
        // 建立保養項目摘要
        const itemSummary = {};
        
        // 遍歷所有記錄，找出每個項目的最後更換記錄
        this.currentFilteredRecords.forEach(record => {
            if (record.items && Array.isArray(record.items)) {
                record.items.forEach(item => {
                    if (!itemSummary[item.name] || new Date(record.date) > new Date(itemSummary[item.name].date)) {
                        itemSummary[item.name] = {
                            name: item.name,
                            lastMileage: record.mileage,
                            lastDate: record.date,
                            category: this.getItemCategory(item.name)
                        };
                    }
                });
            }
        });
        
        // 預設保養週期設定
        const maintenanceIntervals = this.getMaintenanceIntervals();
        
        // 生成表格內容
        const tbody = document.getElementById('maintenanceSummaryBody');
        const summaryHTML = Object.values(itemSummary).map(item => {
            const interval = maintenanceIntervals[item.name] || 10000; // 預設10000公里
            const mileageDiff = currentMileage - item.lastMileage;
            const nextMileage = item.lastMileage + interval;
            const status = this.getMaintenanceStatus(mileageDiff, interval);
            const lastDate = new Date(item.lastDate).toLocaleDateString('zh-TW');
            
            return `
                <tr class="${status.class}">
                    <td>
                        <strong>${item.name}</strong>
                        <br><small class="text-muted">${this.getCategoryName(item.category)}</small>
                    </td>
                    <td>${item.lastMileage.toLocaleString()} km</td>
                    <td>${lastDate}</td>
                    <td>${mileageDiff.toLocaleString()} km</td>
                    <td>${interval.toLocaleString()} km</td>
                    <td>${nextMileage.toLocaleString()} km</td>
                    <td>
                        <span class="badge ${status.badgeClass}">
                            <i class="bi ${status.icon}"></i> ${status.text}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
        
        tbody.innerHTML = summaryHTML;
    }
    
    getItemCategory(itemName) {
        for (const [categoryKey, category] of Object.entries(MAINTENANCE_CATEGORIES)) {
            if (category.items.some(item => item.name === itemName)) {
                return categoryKey;
            }
        }
        return 'other';
    }
    
    getCategoryName(categoryKey) {
        return MAINTENANCE_CATEGORIES[categoryKey]?.name || '其他項目';
    }
    
    getMaintenanceIntervals() {
        // 預設保養週期設定（公里）
        return {
            '機油': 5000,
            '機油芯': 5000,
            '空氣濾芯': 10000,
            '汽油濾芯': 20000,
            '冷氣濾芯': 10000,
            '火星塞': 20000,
            '煞車來令片': 30000,
            '煞車油': 40000,
            '變速箱油': 60000,
            '冷卻水': 40000,
            '正時皮帶': 80000,
            '發電機皮帶': 40000,
            '水幫浦皮帶': 40000,
            '冷氣皮帶': 40000,
            '輪胎更換': 50000,
            '電瓶': 60000,
            '避震器': 80000,
            '雨刷片': 20000
        };
    }
    
    getMaintenanceStatus(mileageDiff, interval) {
        const percentage = (mileageDiff / interval) * 100;
        
        if (percentage >= 100) {
            return {
                class: 'table-danger',
                badgeClass: 'bg-danger',
                icon: 'bi-exclamation-triangle-fill',
                text: '已逾期'
            };
        } else if (percentage >= 80) {
            return {
                class: 'table-warning',
                badgeClass: 'bg-warning',
                icon: 'bi-exclamation-triangle',
                text: '即將到期'
            };
        } else {
            return {
                class: '',
                badgeClass: 'bg-success',
                icon: 'bi-check-circle',
                text: '正常'
            };
        }
    }
    
    // 報表功能
    async loadReports() {
        try {
            const stats = await databaseManager.getStatistics();
            
            // 載入圖表
            this.renderMonthlyChart(stats.monthlyStats);
            this.renderCategoryChart(stats.categoryStats);
            
        } catch (error) {
            console.error('載入報表失敗:', error);
            this.showToast('載入報表失敗', 'error');
        }
    }
    
    renderMonthlyChart(monthlyStats) {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;
        
        // 銷毀現有圖表
        if (this.charts.monthly) {
            this.charts.monthly.destroy();
        }
        
        const months = Object.keys(monthlyStats).sort();
        const amounts = months.map(month => monthlyStats[month].amount);
        
        this.charts.monthly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: '月度花費',
                    data: amounts,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'NT$ ' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
    
    renderCategoryChart(categoryStats) {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;
        
        // 銷毀現有圖表
        if (this.charts.category) {
            this.charts.category.destroy();
        }
        
        const categories = Object.keys(categoryStats);
        const amounts = categories.map(cat => categoryStats[cat].amount);
        const labels = categories.map(cat => MAINTENANCE_CATEGORIES[cat]?.name || cat);
        
        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: amounts,
                    backgroundColor: [
                        '#007bff', '#28a745', '#ffc107', '#dc3545',
                        '#6f42c1', '#fd7e14', '#20c997', '#6c757d'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': NT$ ' + context.parsed.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
    
    // 匯出功能
    exportToPDF() {
        this.showToast('PDF 匯出功能開發中', 'info');
    }
    
    exportToExcel() {
        this.showToast('Excel 匯出功能開發中', 'info');
    }
    
    // 顯示保養記錄詳情
    async showRecordDetail(recordId) {
        try {
            // 從當前記錄中找到指定記錄
            let record = this.currentRecords.find(r => r.id === recordId);
            
            // 如果當前記錄中沒有，則重新載入
            if (!record) {
                const allRecords = await databaseManager.getMaintenanceRecords();
                record = allRecords.find(r => r.id === recordId);
            }
            
            if (!record) {
                this.showToast('找不到保養記錄', 'error');
                return;
            }
            
            // 找到對應的車輛
            const vehicle = this.currentVehicles.find(v => v.id === record.vehicleId);
            const vehicleName = vehicle ? vehicle.nickname : '未知車輛';
            
            // 找到對應的保養廠
            const serviceShop = this.currentServiceShops.find(s => s.id === record.serviceShopId);
            const serviceShopName = serviceShop ? serviceShop.name : '';
            
            // 建立詳情內容
            const date = new Date(record.date).toLocaleDateString('zh-TW');
            const itemsHTML = record.items.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.note || '-'}</td>
                    <td>${item.quantity}</td>
                    <td>NT$ ${item.unitPrice.toLocaleString()}</td>
                    <td>NT$ ${item.totalPrice.toLocaleString()}</td>
                </tr>
            `).join('');
            
            const modalHTML = `
                <div class="modal fade" id="recordDetailModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">保養記錄詳情</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <strong>車輛：</strong>${vehicleName}
                                    </div>
                                    <div class="col-md-6">
                                        <strong>日期：</strong>${date}
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <strong>里程數：</strong>${record.mileage.toLocaleString()} 公里
                                    </div>
                                    <div class="col-md-6">
                                        <strong>總金額：</strong>NT$ ${record.totalAmount.toLocaleString()}
                                    </div>
                                </div>
                                ${serviceShopName ? `
                                <div class="row mb-3">
                                    <div class="col-12">
                                        <strong>保養廠：</strong>${serviceShopName}
                                    </div>
                                </div>
                                ` : ''}
                                ${record.notes ? `
                                <div class="row mb-3">
                                    <div class="col-12">
                                        <strong>備註：</strong>${record.notes}
                                    </div>
                                </div>
                                ` : ''}
                                <div class="table-responsive">
                                    <table class="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>項目</th>
                                                <th>備註</th>
                                                <th>數量</th>
                                                <th>單價</th>
                                                <th>總額</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${itemsHTML}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-warning me-2" onclick="app.editRecord('${recordId}')" data-bs-dismiss="modal">
                                    <i class="bi bi-pencil"></i> 修改
                                </button>
                                <button type="button" class="btn btn-danger me-2" onclick="app.deleteRecord('${recordId}')" data-bs-dismiss="modal">
                                    <i class="bi bi-trash"></i> 刪除
                                </button>
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // 移除舊的模態框
            const existingModal = document.getElementById('recordDetailModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // 加入新的模態框
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // 顯示模態框
            const modal = new bootstrap.Modal(document.getElementById('recordDetailModal'));
            modal.show();
            
        } catch (error) {
            console.error('顯示記錄詳情失敗:', error);
            this.showToast('顯示記錄詳情失敗', 'error');
        }
    }
    
    // 修改保養記錄
    async editRecord(recordId) {
        try {
            // 找到要修改的記錄
            let record = this.currentRecords.find(r => r.id === recordId);
            if (!record) {
                const allRecords = await databaseManager.getMaintenanceRecords();
                record = allRecords.find(r => r.id === recordId);
            }
            
            if (!record) {
                this.showToast('找不到保養記錄', 'error');
                return;
            }
            
            // 切換到保養記錄頁面
            showPage('maintenance');
            
            // 等待頁面載入
            setTimeout(() => {
                // 填入現有資料
                document.getElementById('vehicleSelect').value = record.vehicleId;
                document.getElementById('serviceShopSelect').value = record.serviceShopId || '';
                document.getElementById('maintenanceDate').value = new Date(record.date).toISOString().split('T')[0];
                document.getElementById('currentMileage').value = record.mileage;
                document.getElementById('maintenanceNotes').value = record.notes || '';
                
                // 清空現有項目
                document.getElementById('maintenanceItems').innerHTML = '';
                
                // 重新建立項目
                record.items.forEach((item, index) => {
                    this.addMaintenanceItem();
                    
                    // 填入項目資料
                    const itemElement = document.querySelector(`[data-index="${index}"]`);
                    if (itemElement) {
                        // 找到對應的分類
                        let categoryKey = '';
                        for (const [key, category] of Object.entries(MAINTENANCE_CATEGORIES)) {
                            if (category.items.some(catItem => catItem.name === item.name)) {
                                categoryKey = key;
                                break;
                            }
                        }
                        
                        if (categoryKey) {
                            itemElement.querySelector('.category-select').value = categoryKey;
                            this.updateItemOptions(index);
                            
                            setTimeout(() => {
                                itemElement.querySelector('.item-select').value = item.name;
                                this.updateItemNotes(index);
                                
                                setTimeout(() => {
                                    itemElement.querySelector('.item-note').value = item.note || '';
                                    itemElement.querySelector('.item-quantity').value = item.quantity;
                                    itemElement.querySelector('.item-price').value = item.unitPrice;
                                    this.calculateItemTotal(index);
                                }, 100);
                            }, 100);
                        }
                    }
                });
                
                // 儲存原始記錄ID以便更新
                this.editingRecordId = recordId;
                
                this.showToast('記錄已載入，修改後請儲存', 'info');
            }, 500);
            
        } catch (error) {
            console.error('載入記錄失敗:', error);
            this.showToast('載入記錄失敗', 'error');
        }
    }
    
    // 刪除保養記錄
    async deleteRecord(recordId) {
        if (!confirm('確定要刪除這筆保養記錄嗎？此操作無法復原。')) {
            return;
        }
        
        try {
            await databaseManager.deleteMaintenanceRecord(recordId);
            
            // 重新載入資料
            await this.loadDashboardData();
            if (this.currentRecords) {
                this.currentRecords = this.currentRecords.filter(r => r.id !== recordId);
            }
            
            this.showToast('保養記錄已刪除', 'success');
            
        } catch (error) {
            console.error('刪除記錄失敗:', error);
            this.showToast('刪除記錄失敗', 'error');
        }
    }
    
    // 工具函數
    showToast(message, type = 'info') {
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
}

// 全域函數
window.showAddVehicleModal = function() {
    app.showAddVehicleModal();
};

window.saveVehicle = function() {
    app.saveVehicle();
};

window.addMaintenanceItem = function() {
    app.addMaintenanceItem();
};

window.loadDashboardData = function() {
    app.loadDashboardData();
};

window.loadVehicles = function() {
    app.loadVehicles();
};

window.loadHistory = function() {
    app.loadHistory();
};

window.loadReports = function() {
    app.loadReports();
};

window.filterHistory = function() {
    app.filterHistory();
};

window.exportToPDF = function() {
    app.exportToPDF();
};

window.exportToExcel = function() {
    app.exportToExcel();
};

window.showAddServiceShopModal = function() {
    app.showAddServiceShopModal();
};

window.saveServiceShop = function() {
    app.saveServiceShop();
};

window.toggleMaintenanceView = function() {
    app.toggleMaintenanceView();
};

// 創建應用程式實例
const app = new CarMaintenanceApp();
window.app = app;

// 導出
export { CarMaintenanceApp };