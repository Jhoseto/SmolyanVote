// ====== ADMIN ACTIVITY WALL - CORE ======
// Файл: js/activityWall/activity-wall.js

class ActivityWall {
    constructor() {
        this.isLive = true;
        this.isPaused = false;
        this.autoScroll = true;
        this.activities = [];
        this.filteredActivities = [];
        this.maxActivities = 500; // Максимален брой активности в паметта
        this.refreshInterval = null;
        this.websocket = null;

        this.filters = {
            types: new Set(['create', 'interact', 'moderate', 'auth', 'other']),
            user: ''
        };

        this.init();
    }

    // ===== INITIALIZATION =====

    init() {
        if (!this.checkElements()) return;

        this.setupEventListeners();
        this.startLiveStream();
        this.loadInitialActivities();

        console.log('✅ Activity Wall initialized');
    }

    checkElements() {
        const required = [
            'activity-stream-body',
            'activity-pause-btn',
            'activity-clear-btn',
            'liveIndicator'
        ];

        for (const id of required) {
            if (!document.getElementById(id)) {
                console.error(`❌ Activity Wall: Element #${id} not found`);
                return false;
            }
        }
        return true;
    }

    setupEventListeners() {
        // Control buttons
        document.getElementById('activity-pause-btn')?.addEventListener('click', () => this.togglePause());
        document.getElementById('activity-clear-btn')?.addEventListener('click', () => this.clearActivities());
        document.getElementById('activity-export-btn')?.addEventListener('click', () => this.exportActivities());
        document.getElementById('refresh-activities-btn')?.addEventListener('click', () => this.manualRefresh());

        // Filter buttons - FIXED
        document.querySelectorAll('.activity-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleFilter(e));
        });

        // User filter - IMPROVED for instant filtering
        const userFilter = document.getElementById('activity-user-filter');
        const clearUserFilter = document.getElementById('clear-user-filter');

        if (userFilter) {
            userFilter.addEventListener('input', (e) => {
                this.filters.user = e.target.value.toLowerCase().trim();
                this.applyFilters(); // Мигновенно филтриране

                // Показваме/скриваме clear бутона
                if (clearUserFilter) {
                    clearUserFilter.style.display = this.filters.user ? 'inline-block' : 'none';
                }

                // Highlight search results
                this.highlightSearchResults(this.filters.user);
            });

            // Clear filter with X button
            userFilter.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.clearUserFilter();
                }
            });
        }

        // Clear user filter button
        if (clearUserFilter) {
            clearUserFilter.addEventListener('click', () => this.clearUserFilter());
        }

        // Auto scroll toggle
        document.getElementById('auto-scroll-btn')?.addEventListener('click', () => this.toggleAutoScroll());
        document.getElementById('scroll-to-top-btn')?.addEventListener('click', () => this.scrollToTop());

        // Table row clicks for details
        document.getElementById('activity-stream-body')?.addEventListener('click', (e) => {
            const row = e.target.closest('tr[data-activity-id]');
            if (row) {
                this.showActivityDetails(row.dataset.activityId);
            }
        });

        // Modal buttons
        document.getElementById('copy-activity-details')?.addEventListener('click', () => this.copyActivityDetails());
    }

    // ===== WEBSOCKET MANAGEMENT =====

    startLiveStream() {
        this.setupWebSocket();
        this.setupRefreshInterval();
    }

    setupWebSocket() {
        try {
            // Определяваме протокола - WSS за HTTPS, WS за HTTP
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const hostname = window.location.hostname;
            const port = window.location.port;

            let wsUrl;

            // Environment detection и URL construction
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                // ===== DEVELOPMENT ENVIRONMENT =====
                const wsPort = port === '2662' ? '2662' : (port || '2662');
                wsUrl = `${protocol}//${hostname}:${wsPort}/ws/admin/activity/websocket`;
                console.log(`🛠 Development mode detected`);
            } else {
                // ===== PRODUCTION ENVIRONMENT =====
                wsUrl = `${protocol}//${window.location.host}/ws/admin/activity/websocket`;
                console.log(`🚀 Production mode detected`);
            }

            console.log(`🔌 Connecting to SockJS WebSocket: ${wsUrl}`);
            console.log(`📍 Environment: ${hostname === 'localhost' || hostname === '127.0.0.1' ? 'Development' : 'Production'}`);

            // Създаваме WebSocket връзката
            this.websocket = new WebSocket(wsUrl);

            // Event handlers
            this.websocket.onopen = () => {
                console.log('✅ SockJS WebSocket connected successfully');
                this.updateLiveStatus(true);

                // Request recent activities след успешна връзка
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
                console.log(`⚠️ SockJS WebSocket disconnected (Code: ${event.code}, Reason: ${event.reason || 'Unknown'})`);
                console.log('🔄 Falling back to polling mode');
                this.updateLiveStatus(false);

                // Reconnect след 5 секунди
                setTimeout(() => {
                    console.log('🔄 Attempting SockJS WebSocket reconnection...');
                    this.setupWebSocket();
                }, 5000);
            };

            this.websocket.onerror = (error) => {
                console.error('❌ SockJS WebSocket connection error:', error);
                console.log('🔍 Check: 1) Server running 2) Admin logged in 3) SockJS endpoint available');
            };

        } catch (error) {
            console.error('❌ Failed to setup SockJS WebSocket:', error);
            console.log('🔄 Falling back to polling mode');
            this.updateLiveStatus(false);
            this.startPolling();
        }
    }

    sendWebSocketMessage(type, data = {}) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            try {
                const message = {
                    type: type,
                    data: data,
                    timestamp: new Date().toISOString().slice(0, -1)
                };

                this.websocket.send(JSON.stringify(message));
                console.log(`📤 Sent WebSocket message: ${type}`);

            } catch (error) {
                console.error('❌ Failed to send WebSocket message:', error);
            }
        } else {
            console.warn('⚠️ WebSocket not ready, message not sent:', type);
        }
    }

    handleWebSocketMessage(message) {
        try {
            console.log(`📥 Received WebSocket message: ${message.type}`);

            switch (message.type) {
                case 'pong':
                    console.log('🏓 Pong received from server');
                    break;

                case 'recent_activities':
                    if (message.data && Array.isArray(message.data)) {
                        this.activities = message.data;
                        this.applyFilters();
                        this.renderActivities();
                        console.log(`📊 Loaded ${message.data.length} recent activities`);
                    }
                    break;

                case 'new_activity':
                    if (message.data) {
                        this.addNewActivity(message.data);
                        console.log('🆕 New activity added');
                    }
                    break;

                case 'statistics':
                    if (message.data) {
                        this.updateStatistics(message.data);
                        console.log('📈 Statistics updated');
                    }
                    break;

                case 'stats_update':
                    if (message.data) {
                        this.updateStatistics(message.data);
                        console.log('📈 Stats update received');
                    }
                    break;

                case 'welcome':
                    console.log('👋 Welcome message received');
                    break;

                case 'system_message':
                    if (message.data && message.data.message) {
                        console.log(`📢 System message: ${message.data.message}`);
                        if (window.ActivityWallUtils) {
                            window.ActivityWallUtils.showToast(message.data.message, message.data.level || 'info');
                        }
                    }
                    break;

                default:
                    console.log(`❓ Unknown message type: ${message.type}`);
            }

        } catch (error) {
            console.error('❌ Error handling WebSocket message:', error);
        }
    }

    setupRefreshInterval() {
        // Fallback polling ако WebSocket не работи
        this.refreshInterval = setInterval(() => {
            if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
                if (!this.isPaused) {
                    this.loadRecentActivities();
                }
            }
        }, 5000); // Всеки 5 секунди
    }

    // ===== DATA MANAGEMENT =====

    async loadInitialActivities() {
        this.showLoading();
        try {
            const response = await fetch('/admin/api/activities/recent?limit=50', {
                headers: { 'X-XSRF-TOKEN': this.getCsrfToken() }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            this.activities = data.activities || [];
            this.applyFilters();
            this.renderActivities();
            this.updateStats();

            console.log(`📊 Loaded ${this.activities.length} initial activities`);

        } catch (error) {
            console.error('❌ Error loading initial activities:', error);
            this.showError('Грешка при зареждането на активностите');
        }
    }

    async loadRecentActivities() {
        try {
            const lastId = this.activities.length > 0 ? this.activities[0].id : 0;
            const response = await fetch(`/admin/api/activities/since/${lastId}`, {
                headers: { 'X-XSRF-TOKEN': this.getCsrfToken() }
            });

            if (!response.ok) return;

            const data = await response.json();
            const newActivities = data.activities || [];

            newActivities.reverse().forEach(activity => {
                this.addNewActivity(activity, false);
            });

        } catch (error) {
            console.error('Error loading recent activities:', error);
        }
    }

    addNewActivity(activity, isRealTime = true) {
        if (this.isPaused) return;

        // Добавяме в началото на масива
        this.activities.unshift(activity);

        // Ограничаваме размера
        if (this.activities.length > this.maxActivities) {
            this.activities = this.activities.slice(0, this.maxActivities);
        }

        // ВАЖНО: Прилагаме филтри веднага
        this.applyFilters();

        // Show toast for real-time activities
        if (isRealTime && window.ActivityWallUtils) {
            window.ActivityWallUtils.showToast(`Нова активност от ${activity.username}: ${this.formatAction(activity)}`, 'info');
        }

        this.updateStats();
    }

    showToast(message, type = 'info') {
        if (window.ActivityWallUtils) {
            window.ActivityWallUtils.showToast(message, type);
        } else {
            console.log(`Toast: ${message}`);
        }
    }

    // ===== FILTERING =====

    toggleFilter(event) {
        const btn = event.target.closest('.activity-filter-btn');
        if (!btn) return;

        const filterType = btn.dataset.filter;

        if (this.filters.types.has(filterType)) {
            this.filters.types.delete(filterType);
            btn.classList.remove('active');
        } else {
            this.filters.types.add(filterType);
            btn.classList.add('active');
        }

        this.applyFilters();
    }

    applyFilters() {
        this.filteredActivities = this.activities.filter(activity => {
            // Type filter
            const activityType = this.determineActivityType(activity.action);
            if (!this.filters.types.has(activityType)) {
                return false;
            }

            // User filter
            if (this.filters.user) {
                const username = (activity.username || '').toLowerCase();
                const action = (activity.action || '').toLowerCase();
                const details = (activity.details || '').toLowerCase();

                return username.includes(this.filters.user) ||
                    action.includes(this.filters.user) ||
                    details.includes(this.filters.user);
            }

            return true;
        });

        this.renderActivities();
        this.updateStats();
    }

    determineActivityType(action) {
        if (!action) return 'other';
        const actionLower = action.toLowerCase();

        if (actionLower.includes('create')) return 'create';
        if (actionLower.includes('like') || actionLower.includes('vote') || actionLower.includes('share')) return 'interact';
        if (actionLower.includes('delete') || actionLower.includes('report') || actionLower.includes('moderate')) return 'moderate';
        if (actionLower.includes('login') || actionLower.includes('logout') || actionLower.includes('register')) return 'auth';

        return 'other';
    }

    clearUserFilter() {
        this.filters.user = '';
        const userFilter = document.getElementById('activity-user-filter');
        const clearUserFilter = document.getElementById('clear-user-filter');

        if (userFilter) {
            userFilter.value = '';
        }
        if (clearUserFilter) {
            clearUserFilter.style.display = 'none';
        }

        this.applyFilters();
        this.highlightSearchResults('');
    }

    highlightSearchResults(searchTerm) {
        const rows = document.querySelectorAll('#activity-stream-body tr');
        rows.forEach(row => {
            const textElements = row.querySelectorAll('td');
            textElements.forEach(element => {
                element.classList.remove('highlight');
                if (searchTerm && element.textContent.toLowerCase().includes(searchTerm)) {
                    element.classList.add('highlight');
                }
            });
        });
    }

    // ===== RENDERING =====

    renderActivities() {
        const tbody = document.getElementById('activity-stream-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.filteredActivities.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center" style="padding: 2rem; color: #6b7280;">
                        <i class="bi bi-search" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                        <div>Няма активности съответстващи на филтрите</div>
                        <small class="text-muted mt-2">Общо активности: ${this.activities.length}</small>
                    </td>
                </tr>
            `;
            return;
        }

        this.filteredActivities.forEach(activity => {
            this.addActivityToTable(activity, false);
        });
    }

    addActivityToTable(activity, isNewEntry = false) {
        const tbody = document.getElementById('activity-stream-body');
        if (!tbody) return;

        // Премахваме placeholder ако има
        const placeholder = tbody.querySelector('td[colspan="6"]');
        if (placeholder) {
            placeholder.closest('tr').remove();
        }

        const row = this.createActivityRow(activity);

        if (isNewEntry) {
            row.classList.add('new-entry');
            tbody.insertBefore(row, tbody.firstChild);

            // Автоматично скролиране
            if (this.autoScroll) {
                setTimeout(() => {
                    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        } else {
            tbody.appendChild(row);
        }
    }

    createActivityRow(activity) {
        const row = document.createElement('tr');
        row.dataset.activityId = activity.id;

        const timeFormatted = this.formatTime(activity.timestamp);
        const iconHtml = this.getActivityIcon(this.determineActivityType(activity.action), activity.action);
        const userHtml = this.createUserCell(activity);
        const actionHtml = this.formatAction(activity);
        const detailsHtml = this.formatDetails(activity);

        row.innerHTML = `
            <td class="activity-time">${timeFormatted}</td>
            <td>${iconHtml}</td>
            <td>${userHtml}</td>
            <td class="activity-action">${actionHtml}</td>
            <td class="activity-details">${detailsHtml}</td>
            <td class="activity-ip">${activity.ipAddress || '--'}</td>
        `;

        return row;
    }

    // ===== UTILITY METHODS =====

    getActivityIcon(type, action) {
        const icons = {
            create: 'bi-plus-circle',
            interact: 'bi-hand-thumbs-up',
            moderate: 'bi-shield-exclamation',
            auth: 'bi-person-check',
            other: 'bi-three-dots'
        };

        const icon = icons[type] || 'bi-circle';
        return `<div class="activity-icon ${type}"><i class="bi ${icon}"></i></div>`;
    }

    createUserCell(activity) {
        const avatar = activity.userImageUrl ?
            `<img src="${activity.userImageUrl}" class="activity-user-avatar" alt="${activity.username}">` :
            `<div class="activity-user-avatar">${(activity.username || 'A').charAt(0).toUpperCase()}</div>`;

        return `
            <div class="activity-user">
                ${avatar}
                <span class="activity-user-name">${this.escapeHtml(activity.username || 'Неизвестен')}</span>
            </div>
        `;
    }

    formatAction(activity) {
        const actionTexts = {
            'CREATE_PUBLICATION': 'Създаде публикация',
            'CREATE_SIMPLE_EVENT': 'Създаде събитие',
            'CREATE_REFERENDUM': 'Създаде референдум',
            'CREATE_MULTI_POLL': 'Създаде анкета',
            'CREATE_COMMENT': 'Коментира',
            'CREATE_SIGNAL': 'Създаде сигнал',
            'LIKE_PUBLICATION': 'Хареса публикация',
            'DISLIKE_PUBLICATION': 'Не хареса публикация',
            'LIKE_COMMENT': 'Хареса коментар',
            'DISLIKE_COMMENT': 'Не хареса коментар',
            'VOTE_SIMPLE_EVENT': 'Гласува в събитие',
            'VOTE_REFERENDUM': 'Гласува в референдум',
            'VOTE_MULTI_POLL': 'Гласува в анкета',
            'SHARE_PUBLICATION': 'Сподели публикация',
            'SHARE_EVENT': 'Сподели събитие',
            'SHARE_REFERENDUM': 'Сподели референдум',
            'BOOKMARK_CONTENT': 'Добави в отметки',
            'FOLLOW_USER': 'Последва потребител',
            'UNFOLLOW_USER': 'Спря да следва потребител',
            'VIEW_PUBLICATION': 'Прегледа публикация',
            'VIEW_EVENT': 'Прегледа събитие',
            'VIEW_REFERENDUM': 'Прегледа референдум',
            'VIEW_PROFILE': 'Прегледа профил',
            'SEARCH_CONTENT': 'Търсене в съдържанието',
            'FILTER_CONTENT': 'Филтриране на съдържание',
            'EDIT_PUBLICATION': 'Редактира публикация',
            'EDIT_EVENT': 'Редактира събитие',
            'EDIT_REFERENDUM': 'Редактира референдум',
            'EDIT_COMMENT': 'Редактира коментар',
            'EDIT_PROFILE': 'Редактира профил',
            'DELETE_PUBLICATION': 'Изтри публикация',
            'DELETE_EVENT': 'Изтри събитие',
            'DELETE_REFERENDUM': 'Изтри референдум',
            'DELETE_COMMENT': 'Изтри коментар',
            'DELETE_SIGNAL': 'Изтри сигнал',
            'REPORT_PUBLICATION': 'Докладва публикация',
            'REPORT_EVENT': 'Докладва събитие',
            'REPORT_REFERENDUM': 'Докладва референдум',
            'REPORT_COMMENT': 'Докладва коментар',
            'REPORT_USER': 'Докладва потребител',
            'ADMIN_REVIEW_REPORT': 'Прегледа доклад',
            'ADMIN_DELETE_CONTENT': 'Изтри съдържание (админ)',
            'ADMIN_BAN_USER': 'Блокира потребител',
            'ADMIN_UNBAN_USER': 'Отблокира потребител',
            'ADMIN_PROMOTE_USER': 'Повиши потребител',
            'ADMIN_DEMOTE_USER': 'Понижи потребител',
            'USER_REGISTER': 'Регистрация',
            'USER_LOGIN': 'Вход в системата',
            'USER_LOGOUT': 'Изход от системата',
            'USER_PASSWORD_CHANGE': 'Смяна на парола',
            'USER_EMAIL_VERIFY': 'Потвърждение на имейл',
            'USER_PASSWORD_RESET': 'Нулиране на парола',
            'UPDATE_NOTIFICATIONS': 'Актуализира нотификации',
            'UPDATE_PRIVACY': 'Актуализира поверителност',
            'EXPORT_DATA': 'Експортира данни',
            'DELETE_ACCOUNT': 'Изтриване на акаунт',
            'SYSTEM_BACKUP': 'Системен backup',
            'SYSTEM_MAINTENANCE': 'Системна поддръжка',
            'API_ACCESS': 'API достъп'
        };


        return actionTexts[activity.action] || activity.action;
    }

    formatDetails(activity) {
        let details = activity.details || '';

        // Ограничаваме дължината
        if (details.length > 100) {
            details = details.substring(0, 97) + '...';
        }

        return this.escapeHtml(details);
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Сега';
        if (diffMins < 60) return `${diffMins}м`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}ч`;

        return date.toLocaleDateString('bg-BG') + ' ' +
            date.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
    }

    // ===== CONTROLS =====

    togglePause() {
        this.isPaused = !this.isPaused;
        const btn = document.getElementById('activity-pause-btn');
        const indicator = document.getElementById('liveIndicator');

        if (this.isPaused) {
            btn.innerHTML = '<i class="bi bi-play-fill"></i> Възобнови';
            btn.classList.add('btn-success');
            btn.classList.remove('btn-warning');
            indicator.classList.add('paused');
            indicator.querySelector('span').textContent = 'Пауза';
        } else {
            btn.innerHTML = '<i class="bi bi-pause-fill"></i> Пауза';
            btn.classList.add('btn-warning');
            btn.classList.remove('btn-success');
            indicator.classList.remove('paused');
            indicator.querySelector('span').textContent = 'Live';
        }
    }

    updateLiveStatus(isConnected) {
        const indicator = document.getElementById('liveIndicator');
        if (isConnected && !this.isPaused) {
            indicator.classList.remove('paused');
            indicator.querySelector('span').textContent = 'Live';
        } else {
            indicator.classList.add('paused');
            indicator.querySelector('span').textContent = this.isPaused ? 'Пауза' : 'Offline';
        }
    }

    clearActivities() {
        if (!confirm('Сигурни ли сте, че искате да изчистите всички активности?')) return;

        this.activities = [];
        this.filteredActivities = [];
        this.renderActivities();
        this.updateStats();

        this.showToast('Активностите са изчистени', 'success');
    }

    manualRefresh() {
        const btn = document.getElementById('refresh-activities-btn');
        const icon = btn?.querySelector('i');

        if (icon) {
            icon.classList.add('spin');
        }

        this.loadInitialActivities().finally(() => {
            if (icon) {
                icon.classList.remove('spin');
            }
            this.showToast('Активностите са обновени', 'success');
        });
    }

    toggleAutoScroll() {
        this.autoScroll = !this.autoScroll;
        const btn = document.getElementById('auto-scroll-btn');

        if (btn) {
            btn.classList.toggle('active', this.autoScroll);
            btn.title = this.autoScroll ? 'Изключи автоматичното скролиране' : 'Включи автоматичното скролиране';
        }
    }

    scrollToTop() {
        const table = document.getElementById('activity-stream-body');
        if (table) {
            table.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    updateStats() {
        // Основни статистики
        const totalCount = this.activities.length;
        const filteredCount = this.filteredActivities.length;

        const totalActivitiesEl = document.getElementById('total-activities');
        const filteredActivitiesEl = document.getElementById('filtered-activities');

        if (totalActivitiesEl) totalActivitiesEl.textContent = totalCount;
        if (filteredActivitiesEl) filteredActivitiesEl.textContent = filteredCount;

        // Последна активност
        if (this.activities.length > 0) {
            const lastActivity = this.activities[0];
            const lastActivityTime = this.formatTime(lastActivity.timestamp);
            const lastActivityTimeEl = document.getElementById('last-activity-time');
            if (lastActivityTimeEl) lastActivityTimeEl.textContent = lastActivityTime;
        }
    }

    // Методи за Advanced и Utils компонентите
    showActivityDetails(activityId) {
        // Ще се имплементира в activity-wall-advanced.js
        if (window.ActivityWallAdvanced) {
            window.ActivityWallAdvanced.showActivityDetails.call(this, activityId);
        }
    }

    exportActivities() {
        // Ще се имплементира в activity-wall-advanced.js
        if (window.ActivityWallAdvanced) {
            window.ActivityWallAdvanced.exportActivities.call(this);
        }
    }

    copyActivityDetails() {
        // Ще се имплементира в activity-wall-advanced.js
        if (window.ActivityWallAdvanced) {
            window.ActivityWallAdvanced.copyActivityDetails.call(this);
        }
    }

    updateStatistics(data) {
        // Ще се имплементира в activity-wall-advanced.js
        if (window.ActivityWallAdvanced) {
            window.ActivityWallAdvanced.updateStatistics.call(this, data);
        }
    }

    // ===== UTILITY HELPERS =====

    showLoading() {
        const tbody = document.getElementById('activity-stream-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center activity-loading">
                        <i class="bi bi-arrow-clockwise"></i>
                        <div>Зареждане на активности...</div>
                    </td>
                </tr>
            `;
        }
    }

    showError(message) {
        const tbody = document.getElementById('activity-stream-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center" style="padding: 2rem; color: #dc3545;">
                        <i class="bi bi-exclamation-triangle" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                        <div>${this.escapeHtml(message)}</div>
                    </td>
                </tr>
            `;
        }
    }

    getCsrfToken() {
        return document.querySelector('meta[name="_csrf"]')?.getAttribute('content') || '';
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===== CLEANUP =====

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        if (this.websocket) {
            this.websocket.close();
        }

        console.log('Activity Wall destroyed');
    }
}

// ===== INITIALIZATION =====

let activityWallInstance = null;

// Инициализиране когато документът е готов
document.addEventListener('DOMContentLoaded', function() {
    // Проверяваме дали сме в админ dashboard
    if (document.getElementById('activity-wall')) {
        activityWallInstance = new ActivityWall();
    }
});

// Cleanup при напускане на страницата
window.addEventListener('beforeunload', function() {
    if (activityWallInstance) {
        activityWallInstance.destroy();
    }
});

// Export за използване в други модули
window.ActivityWall = ActivityWall;
window.activityWallInstance = activityWallInstance;

// Add required CSS animations if not present
if (!document.querySelector('#activity-wall-animations')) {
    const style = document.createElement('style');
    style.id = 'activity-wall-animations';
    style.textContent = `
        .spin {
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .highlight {
            background: rgba(255, 235, 59, 0.6) !important;
            font-weight: bold !important;
            border-radius: 3px;
            padding: 1px 3px;
        }
    `;
    document.head.appendChild(style);
}