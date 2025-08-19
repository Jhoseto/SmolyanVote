// ====== ADMIN ACTIVITY WALL - CORE (ФИКСИРАН) ======
// Файл: src/main/resources/static/js/admin/activityWall/activity-wall.js

class ActivityWall {
    constructor() {
        // ===== ОСНОВНИ НАСТРОЙКИ =====
        this.isLive = true;
        this.isPaused = false;
        this.activities = [];
        this.filteredActivities = [];
        this.currentPage = 0;
        this.pageSize = 20;
        this.maxActivities = 1000;
        this.refreshInterval = null;
        this.websocket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.connectionTimeout = null;

        // ===== ФИЛТРИ =====
        this.filters = {
            timeRange: 'all',
            user: '',
            ip: '',
            action: '',
            entityType: '',
            dateStart: null,
            dateEnd: null
        };

        // ===== CALLBACKS ЗА ДРУГИ МОДУЛИ =====
        this.updateCallbacks = [];

        this.init();
    }

    async initMainTimelineChart() {
        if (window.ActivityWallCharts && window.ActivityWallCharts.isInitialized) {
            // ✅ Инициализирай горната графика с ВСИЧКИ активности
            await window.ActivityWallCharts.createMainTimelineChart(this.activities);
        }
    }

    // ===== ИНИЦИАЛИЗАЦИЯ С ПРОВЕРКИ =====

    async init() {

        if (!this.checkRequiredElements()) {
            console.error('❌ Activity Wall: Required elements missing');
            return;
        }

        if (!this.checkDependencies()) {
            console.error('❌ Activity Wall: Required dependencies missing');
            return;
        }

        this.setupEventListeners();
        await this.loadInitialActivities();
        setTimeout(() => {
            this.initMainTimelineChart();
        }, 1000);
        await this.startLiveStream();

        // ✅ Известяваме другите модули
        this.notifyInitialized();

        console.log('✅ Activity Wall: Initialized successfully');
    }

    checkRequiredElements() {
        const required = [
            'activity-wall',
            'activity-table-body',
            'live-status-indicator',
            'activity-toggle-btn'
        ];

        for (const id of required) {
            if (!document.getElementById(id)) {
                console.error(`❌ Missing element: ${id}`);
                return false;
            }
        }
        return true;
    }

    // 🔥 НОВ МЕТОД: Проверка на dependencies
    checkDependencies() {
        const dependencies = [];

        // Проверка за SockJS
        if (typeof SockJS === 'undefined') {
            dependencies.push('SockJS не е зареден');
        }

        // Проверка за Bootstrap
        if (typeof bootstrap === 'undefined') {
            dependencies.push('Bootstrap не е зареден');
        }

        if (dependencies.length > 0) {
            console.error('❌ Missing dependencies:', dependencies);
            this.showError(`Липсващи библиотеки: ${dependencies.join(', ')}`);
            return false;
        }

        return true;
    }

    // ===== EVENT LISTENERS =====

    setupEventListeners() {
        // ===== LIVE STREAM TOGGLE =====
        const toggleBtn = document.getElementById('activity-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleLiveStatus());
        }

        // ===== REFRESH BUTTON =====
        const refreshBtn = document.getElementById('activity-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadRecentActivities());
        }

        // ===== CLEAR BUTTON =====
        const clearBtn = document.getElementById('activity-clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearActivities());
        }

        // ===== TIME RANGE BUTTONS =====
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleTimeRangeClick(e));
        });

        // ===== CUSTOM DATE RANGE =====
        const applyDateBtn = document.getElementById('apply-date-range-btn');
        if (applyDateBtn) {
            applyDateBtn.addEventListener('click', () => this.applyCustomDateRange());
        }

        // ===== SEARCH FILTERS =====
        this.setupSearchFilters();

        // ===== PAGINATION =====
        const prevBtn = document.getElementById('prev-page-btn');
        const nextBtn = document.getElementById('next-page-btn');
        if (prevBtn) prevBtn.addEventListener('click', () => this.previousPage());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextPage());

        // ===== RESET FILTERS =====
        const resetBtn = document.getElementById('activity-reset-filters-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetFilters());
        }

        // ===== TABLE ROW CLICKS =====
        const tableBody = document.getElementById('activity-table-body');
        if (tableBody) {
            tableBody.addEventListener('click', (e) => {
                const row = e.target.closest('tr[data-activity-id]');
                if (row) {
                    this.showActivityDetails(row.dataset.activityId);
                }
            });
        }
    }

    setupSearchFilters() {
        // USER SEARCH
        const userInput = document.getElementById('user-search-input');
        const clearUserBtn = document.getElementById('clear-user-search');

        if (userInput) {
            userInput.addEventListener('input', (e) => {
                this.filters.user = e.target.value.trim().toLowerCase();
                this.applyFilters();
                this.toggleClearButton(clearUserBtn, this.filters.user);
            });
        }

        if (clearUserBtn) {
            clearUserBtn.addEventListener('click', () => {
                userInput.value = '';
                this.filters.user = '';
                this.applyFilters();
                clearUserBtn.style.display = 'none';
            });
        }

        // IP SEARCH
        const ipInput = document.getElementById('ip-search-input');
        const clearIpBtn = document.getElementById('clear-ip-search');

        if (ipInput) {
            ipInput.addEventListener('input', (e) => {
                this.filters.ip = e.target.value.trim();
                this.applyFilters();
                this.toggleClearButton(clearIpBtn, this.filters.ip);
            });
        }

        if (clearIpBtn) {
            clearIpBtn.addEventListener('click', () => {
                ipInput.value = '';
                this.filters.ip = '';
                this.applyFilters();
                clearIpBtn.style.display = 'none';
            });
        }

        // ACTION SELECT
        const actionSelect = document.getElementById('action-filter-select');
        if (actionSelect) {
            actionSelect.addEventListener('change', (e) => {
                this.filters.action = e.target.value;
                this.applyFilters();
            });
        }

        // ENTITY TYPE SELECT
        const entitySelect = document.getElementById('entity-filter-select');
        if (entitySelect) {
            entitySelect.addEventListener('change', (e) => {
                this.filters.entityType = e.target.value;
                this.applyFilters();
            });
        }
    }

    // ===== TIME RANGE HANDLING =====

    handleTimeRangeClick(e) {
        const btn = e.target;
        const range = btn.dataset.range;

        // Update button states
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Show/hide custom date range
        const customDateRange = document.getElementById('custom-date-range');
        if (customDateRange) {
            customDateRange.style.display = range === 'custom' ? 'block' : 'none';
        }

        // If not custom, apply the filter immediately
        if (range !== 'custom') {
            this.filters.dateStart = null;
            this.filters.dateEnd = null;
            this.filters.timeRange = range;
            this.applyFilters();

            // Clear custom date inputs
            const dateStart = document.getElementById('date-start-input');
            const dateEnd = document.getElementById('date-end-input');
            if (dateStart) dateStart.value = '';
            if (dateEnd) dateEnd.value = '';
        }
    }

    applyCustomDateRange() {
        const startInput = document.getElementById('date-start-input');
        const endInput = document.getElementById('date-end-input');

        if (!startInput || !endInput) {
            this.showToast('Грешка: Не намерих полетата за дата', 'error');
            return;
        }

        const startValue = startInput.value;
        const endValue = endInput.value;

        if (!startValue || !endValue) {
            this.showToast('Моля въведете и двете дати', 'warning');
            return;
        }

        const startDate = new Date(startValue);
        const endDate = new Date(endValue);

        // Validation
        if (startDate >= endDate) {
            this.showToast('Началната дата трябва да е преди крайната', 'warning');
            return;
        }

        const now = new Date();
        if (startDate > now) {
            this.showToast('Началната дата не може да е в бъдещето', 'warning');
            return;
        }

        // Apply the filter
        this.filters.dateStart = startDate;
        this.filters.dateEnd = endDate;
        this.filters.timeRange = 'custom';

        this.applyFilters();

        const startStr = startDate.toLocaleDateString('bg-BG');
        const endStr = endDate.toLocaleDateString('bg-BG');
        this.showToast(`Период приложен: ${startStr} - ${endStr}`, 'success');
    }

    // ===== LIVE STREAM MANAGEMENT =====

    toggleLiveStatus() {
        if (this.isLive && !this.isPaused) {
            this.pauseLiveStream();
        } else if (this.isPaused) {
            this.resumeLiveStream();
        } else {
            this.startLiveStream();
        }
    }

    async startLiveStream() {
        this.isLive = true;
        this.isPaused = false;
        this.reconnectAttempts = 0;
        this.updateLiveStatusUI();

        await this.setupWebSocket();
        this.startRefreshInterval();
    }

    pauseLiveStream() {
        this.isPaused = true;
        this.updateLiveStatusUI();
    }

    resumeLiveStream() {
        this.isPaused = false;
        this.updateLiveStatusUI();
        this.loadRecentActivities();
    }

    stopLiveStream() {
        this.isLive = false;
        this.isPaused = false;
        this.cleanup();
        this.updateLiveStatusUI();
    }

    updateLiveStatusUI() {
        const indicator = document.getElementById('live-status-indicator');
        const toggleBtn = document.getElementById('activity-toggle-btn');

        if (!indicator || !toggleBtn) return;

        indicator.classList.remove('paused', 'stopped');

        if (!this.isLive) {
            indicator.classList.add('stopped');
            indicator.querySelector('.live-text').textContent = 'Stopped';
            toggleBtn.innerHTML = '<i class="bi bi-play-fill"></i><span>Старт</span>';
        } else if (this.isPaused) {
            indicator.classList.add('paused');
            indicator.querySelector('.live-text').textContent = 'Paused';
            toggleBtn.innerHTML = '<i class="bi bi-play-fill"></i><span>Продължи</span>';
        } else {
            indicator.querySelector('.live-text').textContent = 'Live';
            toggleBtn.innerHTML = '<i class="bi bi-pause-fill"></i><span>Пауза</span>';
        }
    }

    // ===== 🔥 ФИКСИРАН WEBSOCKET CONNECTION =====

    async setupWebSocket() {
        if (typeof SockJS === 'undefined') {
            console.error('❌ SockJS не е зареден');
            this.showError('SockJS библиотеката не е достъпна');
            return;
        }

        try {
            // ✅ ПРАВИЛНА URL КОНСТРУКЦИЯ
            const wsUrl = this.buildWebSocketURL();
            console.log('🔌 Connecting to WebSocket:', wsUrl);

            this.websocket = new SockJS(wsUrl);

            // ✅ Connection timeout
            this.connectionTimeout = setTimeout(() => {
                if (this.websocket && this.websocket.readyState !== SockJS.OPEN) {
                    console.warn('⚠️ WebSocket connection timeout');
                    this.websocket.close();
                }
            }, 10000); // 10 seconds timeout

            this.websocket.onopen = () => {
                console.log('✅ WebSocket connected');
                this.reconnectAttempts = 0;

                if (this.connectionTimeout) {
                    clearTimeout(this.connectionTimeout);
                    this.connectionTimeout = null;
                }

                this.sendWebSocketMessage('get_recent', { limit: 50 });
            };

            this.websocket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleWebSocketMessage(message);
                } catch (error) {
                    console.error('❌ WebSocket message parse error:', error);
                }
            };

            this.websocket.onclose = (event) => {
                console.log('🔌 WebSocket closed:', event.code, event.reason);

                if (this.connectionTimeout) {
                    clearTimeout(this.connectionTimeout);
                    this.connectionTimeout = null;
                }

                this.attemptReconnect();
            };

            this.websocket.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.showError('WebSocket грешка: ' + (error.message || 'Неизвестна грешка'));
            };

        } catch (error) {
            console.error('❌ Failed to setup WebSocket:', error);
            this.showError('Не можах да се свържа с WebSocket сървъра');
        }
    }

    // 🔥 НОВ МЕТОД: Правилно URL построяване
    buildWebSocketURL() {
        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        const hostname = window.location.hostname;
        const port = window.location.port;

        // За localhost и development
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            const wsPort = port || '2662';
            return `${protocol}//${hostname}:${wsPort}/ws/admin/activity`;
        }

        // За production
        return `${protocol}//${window.location.host}/ws/admin/activity`;
    }

    // 🔥 НОВ МЕТОД: Автоматично reconnect
    attemptReconnect() {
        if (!this.isLive || this.isPaused) return;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Максимален брой опити за връзка достигнат');
            this.showError('Не мога да се свържа с сървъра. Моля рефрешете страницата.');
            this.stopLiveStream();
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff

        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            if (this.isLive && !this.isPaused) {
                this.setupWebSocket();
            }
        }, delay);
    }

    sendWebSocketMessage(type, data = {}) {
        if (this.websocket && this.websocket.readyState === SockJS.OPEN) {
            const message = {
                type: type,
                data: data,
                timestamp: new Date().toISOString()
            };
            this.websocket.send(JSON.stringify(message));
        } else {
            console.warn('⚠️ WebSocket не е готов за изпращане на съобщения');
        }
    }

    handleWebSocketMessage(message) {
        switch (message.type) {
            case 'new_activity':
                if (message.data && !this.isPaused) {
                    this.addNewActivity(message.data, true);
                }
                break;
            case 'recent_activities':
                if (message.data && Array.isArray(message.data)) {
                    this.activities = message.data;
                    this.applyFilters();
                }
                break;
            case 'error':
                console.error('❌ WebSocket server error:', message.data);
                this.showError('Сървърна грешка: ' + (message.data?.message || 'Неизвестна грешка'));
                break;
            default:
                console.warn('⚠️ Unknown WebSocket message type:', message.type);
        }
    }

    startRefreshInterval() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.refreshInterval = setInterval(() => {
            if (this.isLive && !this.isPaused) {
                this.loadRecentActivities();
            }
        }, 5000);
    }

    // ===== DATA LOADING С ПОДОБРЕНА ERROR HANDLING =====

    async loadInitialActivities() {
        try {
            const response = await fetch('/admin/api/activities', {
                headers: { 'X-XSRF-TOKEN': this.getCsrfToken() },
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success && data.activities) {
                this.activities = data.activities;
                this.applyFilters();

                // 🚀 ДОБАВЕНО: Инициализираме основната timeline графика
                this.initializeMainTimeline();

                console.log('✅ Initial activities loaded:', this.activities.length);
            } else {
                throw new Error(data.message || 'Неуспешно зареждане на активности');
            }

        } catch (error) {
            console.error('❌ Error loading activities:', error);

            if (error.name === 'TimeoutError') {
                this.showError('Времето за зареждане изтече');
            } else if (error.name === 'TypeError') {
                this.showError('Мрежова грешка - проверете интернет връзката');
            } else {
                this.showError('Грешка при зареждането: ' + error.message);
            }
        }
    }

    async loadRecentActivities() {
        if (!this.isLive || this.isPaused) return;

        try {
            const lastId = this.activities.length > 0 ? this.activities[0].id : 0;

            const response = await fetch(`/admin/api/activities/since/${lastId}`, {
                headers: { 'X-XSRF-TOKEN': this.getCsrfToken() },
                signal: AbortSignal.timeout(5000)
            });

            if (!response.ok) return;

            const data = await response.json();
            const newActivities = data.activities || [];

            if (newActivities.length > 0) {
                newActivities.reverse().forEach(activity => {
                    this.addNewActivity(activity, false);
                });
                console.log('✅ New activities loaded:', newActivities.length);
            }

        } catch (error) {
            console.error('❌ Error loading recent activities:', error);
        }
    }

    addNewActivity(activity, isRealTime = false) {
        this.activities.unshift(activity);

        if (this.activities.length > this.maxActivities) {
            this.activities = this.activities.slice(0, this.maxActivities);
        }

        this.applyFilters();

        // ✅ Уведомяваме други модули за новата активност
        if (isRealTime) {
            this.notifyActivityAdded(activity);
        }
    }

    async manualRefresh() {
        const refreshBtn = document.getElementById('activity-refresh-btn');
        if (refreshBtn) {
            refreshBtn.classList.add('spin');
        }

        try {
            await this.loadInitialActivities();
            this.showToast('Активностите са обновени', 'success');
        } catch (error) {
            this.showToast('Грешка при обновяването', 'error');
        } finally {
            if (refreshBtn) {
                setTimeout(() => {
                    refreshBtn.classList.remove('spin');
                }, 500);
            }
        }
    }

    // ===== FILTERING =====

    applyFilters() {
        this.filteredActivities = this.activities.filter(activity => {
            // Time range filter
            if (!this.passesTimeFilter(activity)) return false;

            // User filter
            if (this.filters.user && !activity.username?.toLowerCase().includes(this.filters.user)) {
                return false;
            }

            // IP filter
            if (this.filters.ip && !activity.ipAddress?.includes(this.filters.ip)) {
                return false;
            }

            // Action filter
            if (this.filters.action && activity.action !== this.filters.action) {
                return false;
            }

            // Entity type filter
            if (this.filters.entityType && activity.entityType !== this.filters.entityType) {
                return false;
            }

            return true;
        });

        this.currentPage = 0;
        this.renderActivities();
        this.updateStats();
        this.updatePaginationUI();
        this.updateMainTimeline();

        // ✅ Уведомяваме други модули за промяната в филтрите
        this.notifyFiltersChanged();
    }

    passesTimeFilter(activity) {
        if (this.filters.timeRange === 'all') return true;

        const activityTime = new Date(activity.timestamp);
        const now = new Date();

        switch (this.filters.timeRange) {
            case '1h':
                return activityTime > new Date(now - 60 * 60 * 1000);
            case '5h':
                return activityTime > new Date(now - 5 * 60 * 60 * 1000);
            case '12h':
                return activityTime > new Date(now - 12 * 60 * 60 * 1000);
            case '24h':
                return activityTime > new Date(now - 24 * 60 * 60 * 1000);
            case '48h':
                return activityTime > new Date(now - 48 * 60 * 60 * 1000);
            case 'custom':
                if (this.filters.dateStart && activityTime < this.filters.dateStart) return false;
                if (this.filters.dateEnd && activityTime > this.filters.dateEnd) return false;
                return true;
            default:
                return true;
        }
    }

    // ===== RENDERING =====

    renderActivities() {
        const startTime = performance.now();

        const tableBody = document.getElementById('activity-table-body');
        const emptyState = document.getElementById('empty-state');

        if (!tableBody) return;

        const startIndex = this.currentPage * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageActivities = this.filteredActivities.slice(startIndex, endIndex);

        if (pageActivities.length === 0) {
            tableBody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        // ✅ Използваме DocumentFragment за по-добра производителност
        const fragment = document.createDocumentFragment();

        pageActivities.forEach(activity => {
            const row = document.createElement('tr');
            row.className = 'activity-row';
            row.setAttribute('data-activity-id', activity.id);
            row.innerHTML = this.renderActivityRow(activity);
            fragment.appendChild(row);
        });

        tableBody.innerHTML = '';
        tableBody.appendChild(fragment);

        const endTime = performance.now();
        console.log(`✅ Rendered ${pageActivities.length} activities in ${Math.round(endTime - startTime)}ms`);
    }

    renderActivityRow(activity) {
        const timeFormatted = this.formatTime(activity.timestamp);
        const userDisplay = this.formatUser(activity);
        const actionDisplay = this.formatAction(activity.action);
        const entityDisplay = this.formatEntity(activity);

        return `
            <td class="col-time">${timeFormatted}</td>
            <td class="col-user">${userDisplay}</td>
            <td class="col-action">${actionDisplay}</td>
            <td class="col-entity">${entityDisplay}</td>
            <td class="col-ip">${activity.ipAddress || '--'}</td>
            <td class="col-actions">
                <button class="details-btn" title="Виж детайли">
                    <i class="bi bi-info-circle"></i>
                </button>
            </td>
        `;
    }

    // ===== PAGINATION =====

    previousPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.renderActivities();
            this.updatePaginationUI();
        }
    }

    nextPage() {
        const maxPage = Math.ceil(this.filteredActivities.length / this.pageSize) - 1;
        if (this.currentPage < maxPage) {
            this.currentPage++;
            this.renderActivities();
            this.updatePaginationUI();
        }
    }

    updatePaginationUI() {
        const totalPages = Math.ceil(this.filteredActivities.length / this.pageSize);
        const startItem = this.currentPage * this.pageSize + 1;
        const endItem = Math.min(startItem + this.pageSize - 1, this.filteredActivities.length);

        const paginationInfo = document.getElementById('pagination-info');
        const pageInfo = document.getElementById('page-info');
        const prevBtn = document.getElementById('prev-page-btn');
        const nextBtn = document.getElementById('next-page-btn');

        if (paginationInfo) {
            paginationInfo.textContent = `Показване ${startItem}-${endItem} от ${this.filteredActivities.length}`;
        }

        if (pageInfo) {
            pageInfo.textContent = `Страница ${this.currentPage + 1} от ${totalPages || 1}`;
        }

        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 0;
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= (totalPages - 1);
        }
    }

    // ===== FORMATTING FUNCTIONS =====

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'сега';
        if (diffInMinutes < 60) return `${diffInMinutes}м`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}ч`;

        return date.toLocaleDateString('bg-BG');
    }

    formatUser(activity) {
        const username = activity.username || 'Анонимен';
        if (activity.userId) {
            return `
                <div class="user-cell">
                    <div class="user-avatar-placeholder">${username.charAt(0).toUpperCase()}</div>
                    <a href="/profile/${username}" class="username-link" target="_blank">${username}</a>
                </div>
            `;
        }
        return `<div class="user-cell"><span>${username}</span></div>`;
    }

    formatAction(action) {

        const actionText = window.ActivityWallUtils.translateAction(action);
        const actionType = this.getActionType(action);

        return `<span class="action-badge ${actionType}">${actionText}</span>`;
    }

    formatEntity(activity) {
        if (!activity.entityType) return '--';

        const typeMap = {
            'PUBLICATION': '📄 Публикация',
            'SIMPLEEVENT': '🎪 Опростен вид събитие',
            'REFERENDUM': '🗳️ Референдум',
            'MULTI_POLL': '📊 Анкета с множествен избор',
            'SIGNAL': '🚨 Граждански сигнал',
            'COMMENT': '💬 Коментар',
            'USER': '👤 Потребител',
            'SYSTEM': '⚙️ Системна операция',
            'OTHER': '📋 Друго'
        };

        const typeText = typeMap[activity.entityType] || activity.entityType;

        return `
            <div class="entity-info">
                <div class="entity-type">${typeText}</div>
                ${activity.entityId ? `<div class="entity-id">#${activity.entityId}</div>` : ''}
            </div>
        `;
    }

    getActionType(action) {
        if (action.includes('CREATE')) return 'create';
        if (action.includes('UPDATE') || action.includes('CHANGE')) return 'update';
        if (action.includes('DELETE') || action.includes('BAN')) return 'delete';
        if (action.includes('LOGIN') || action.includes('LOGOUT') || action.includes('REGISTER') || action.includes('VERIFICATION')) return 'auth';
        if (action.includes('VOTE') || action.includes('LIKE') || action.includes('COMMENT')) return 'interact';
        if (action.includes('MODERATE') || action.includes('APPROVE') || action.includes('REJECT') || action.includes('WARN')) return 'moderate';
        return 'other';
    }

    // ===== STATISTICS =====

    updateStats() {
        const totalCount = document.getElementById('total-activities-count');
        const filteredCount = document.getElementById('filtered-activities-count');
        const activeUsersCount = document.getElementById('active-users-count');
        const lastUpdateTime = document.getElementById('last-update-time');

        if (totalCount) totalCount.textContent = this.activities.length;
        if (filteredCount) filteredCount.textContent = this.filteredActivities.length;
        if (activeUsersCount) activeUsersCount.textContent = this.getActiveUsersCount();
        if (lastUpdateTime) lastUpdateTime.textContent = new Date().toLocaleTimeString('bg-BG');
    }

    getActiveUsersCount() {
        const uniqueUsers = new Set();
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        this.activities.forEach(activity => {
            if (new Date(activity.timestamp) > oneDayAgo && activity.userId) {
                uniqueUsers.add(activity.userId);
            }
        });

        return uniqueUsers.size;
    }

    // ===== OTHER ACTIONS =====

    clearActivities() {
        if (confirm('Сигурни ли сте, че искате да изчистите всички активности?')) {
            this.activities = [];
            this.filteredActivities = [];
            this.currentPage = 0;
            this.renderActivities();
            this.updateStats();
            this.updatePaginationUI();
            this.showToast('Активностите са изчистени', 'success');
        }
    }

    resetFilters() {
        // Reset filter values
        this.filters = {
            timeRange: 'all',
            user: '',
            ip: '',
            action: '',
            entityType: '',
            dateStart: null,
            dateEnd: null
        };

        // Reset UI inputs
        const userInput = document.getElementById('user-search-input');
        const ipInput = document.getElementById('ip-search-input');
        const actionSelect = document.getElementById('action-filter-select');
        const entitySelect = document.getElementById('entity-filter-select');
        const dateStart = document.getElementById('date-start-input');
        const dateEnd = document.getElementById('date-end-input');

        if (userInput) userInput.value = '';
        if (ipInput) ipInput.value = '';
        if (actionSelect) actionSelect.value = '';
        if (entitySelect) entitySelect.value = '';
        if (dateStart) dateStart.value = '';
        if (dateEnd) dateEnd.value = '';

        // Reset time buttons
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.range === 'all') {
                btn.classList.add('active');
            }
        });

        // Hide custom date range
        const customDateRange = document.getElementById('custom-date-range');
        if (customDateRange) {
            customDateRange.style.display = 'none';
        }

        // Hide clear buttons
        const clearButtons = document.querySelectorAll('.clear-filter-btn');
        clearButtons.forEach(btn => btn.style.display = 'none');

        // Apply the reset
        this.applyFilters();
        this.showToast('Филтрите са нулирани', 'success');
    }

    async exportActivities() {
        try {
            const dataToExport = {
                activities: this.filteredActivities,
                filters: this.filters,
                exportDate: new Date().toISOString(),
                totalCount: this.activities.length,
                filteredCount: this.filteredActivities.length
            };

            const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `activity-log-${new Date().toISOString().split('T')[0]}.json`;
            a.click();

            URL.revokeObjectURL(url);
            this.showToast('Активностите са експортирани', 'success');

        } catch (error) {
            console.error('❌ Export error:', error);
            this.showToast('Грешка при експортирането', 'error');
        }
    }

    showActivityDetails(activityId) {
        const activity = this.activities.find(a => a.id == activityId);
        if (!activity) {
            this.showToast('Активността не е намерена', 'error');
            return;
        }

        // Populate modal fields
        document.getElementById('modal-activity-id').textContent = activity.id;
        document.getElementById('modal-activity-timestamp').textContent = new Date(activity.timestamp).toLocaleString('bg-BG');
        document.getElementById('modal-activity-username').textContent = activity.username || 'Анонимен';
        document.getElementById('modal-activity-action').textContent = this.formatAction(activity.action);
        document.getElementById('modal-activity-entity-type').textContent = activity.entityType || 'N/A';
        document.getElementById('modal-activity-entity-id').textContent = activity.entityId || 'N/A';
        document.getElementById('modal-activity-ip').textContent = activity.ipAddress || 'N/A';
        document.getElementById('modal-activity-user-agent').textContent = activity.userAgent || 'N/A';
        document.getElementById('modal-activity-details').textContent = activity.details || 'Няма детайли';

        // Show modal
        try {
            const modal = new bootstrap.Modal(document.getElementById('activity-details-modal'));
            modal.show();
        } catch (error) {
            console.error('❌ Error showing modal:', error);
            this.showToast('Грешка при показването на детайлите', 'error');
        }
    }

    // ===== 🔥 НОВИ NOTIFICATION МЕТОДИ =====

    // Регистриране на callback за други модули
    registerUpdateCallback(callback) {
        if (typeof callback === 'function') {
            this.updateCallbacks.push(callback);
        }
    }

    // Уведомяване за инициализация
    notifyInitialized() {
        this.updateCallbacks.forEach(callback => {
            try {
                callback('initialized', { activities: this.activities });
            } catch (error) {
                console.error('❌ Error in update callback:', error);
            }
        });
    }

    // Уведомяване за промяна в филтрите
    notifyFiltersChanged() {
        this.updateCallbacks.forEach(callback => {
            try {
                callback('filters_changed', {
                    filteredActivities: this.filteredActivities,
                    allActivities: this.activities // ✅ Подаваме и всички данни
                });
            } catch (error) {
                console.error('❌ Error in filter callback:', error);
            }
        });
    }

    // Уведомяване за нова активност
    notifyActivityAdded(activity) {
        this.updateCallbacks.forEach(callback => {
            try {
                callback('activity_added', {
                    activity: activity,
                    filteredActivities: this.filteredActivities
                });
            } catch (error) {
                console.error('❌ Error in activity callback:', error);
            }
        });
    }

    // ===== UTILITY FUNCTIONS =====

    showLoading() {
        const tableBody = document.getElementById('activity-table-body');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr id="loading-row">
                    <td colspan="6" class="loading-cell">
                        <div class="loading-content">
                            <div class="loading-spinner"></div>
                            <span>Зареждане на активности...</span>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    showError(message) {
        const tableBody = document.getElementById('activity-table-body');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger p-4">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        ${message}
                    </td>
                </tr>
            `;
        }
    }

    showToast(message, type = 'info') {
        if (window.ActivityWallUtils && window.ActivityWallUtils.showToast) {
            window.ActivityWallUtils.showToast(message, type);
        } else if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    toggleClearButton(clearButton, value) {
        if (clearButton) {
            clearButton.style.display = value ? 'block' : 'none';
        }
    }

    getCsrfToken() {
        return document.querySelector('meta[name="_csrf"]')?.getAttribute('content') || '';
    }

    // ===== CLEANUP =====

    cleanup() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }

        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }

        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
    }

    // ===== TIMELINE CHART INTEGRATION =====

    async initializeMainTimeline() {
        // Изчакваме Charts модула да се инициализира
        let attempts = 0;
        const maxAttempts = 50; // 5 секунди общо

        while (attempts < maxAttempts) {
            if (window.ActivityWallCharts && window.ActivityWallCharts.isInitialized) {
                try {
                    await window.ActivityWallCharts.createMainTimelineChart(this.filteredActivities);
                    console.log('✅ Main timeline chart initialized');
                    return;
                } catch (error) {
                    console.error('❌ Error creating main timeline chart:', error);
                    return;
                }
            }

            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        console.warn('⚠️ ActivityWallCharts not ready after 5 seconds');
    }

    updateMainTimeline() {
        if (window.ActivityWallCharts && window.ActivityWallCharts.isInitialized) {
            window.ActivityWallCharts.createMainTimelineChart(this.filteredActivities);
        }
    }

    destroy() {
        this.cleanup();
        this.updateCallbacks = [];
    }
}


// ===== GLOBAL INITIALIZATION =====

let activityWallInstance = null;

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('activity-wall')) {
        activityWallInstance = new ActivityWall();
        window.activityWallInstance = activityWallInstance;
    }
});

window.addEventListener('beforeunload', function() {
    if (activityWallInstance) {
        activityWallInstance.destroy();
    }
});

// Export for global access
window.ActivityWall = ActivityWall;
window.activityWallInstance = activityWallInstance;