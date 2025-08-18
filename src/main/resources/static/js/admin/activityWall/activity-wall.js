// ====== ADMIN ACTIVITY WALL - CORE ======
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

        this.init();
    }

    // ===== ИНИЦИАЛИЗАЦИЯ =====

    init() {
        if (!this.checkRequiredElements()) {
            console.error('❌ Activity Wall: Required elements missing');
            return;
        }

        this.setupEventListeners();
        this.loadInitialActivities();
        this.startLiveStream();
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

    // ===== EVENT LISTENERS =====

    setupEventListeners() {
        // ===== LIVE TOGGLE =====
        const toggleBtn = document.getElementById('activity-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleLiveStatus());
        }

        // ===== REFRESH BUTTON =====
        const refreshBtn = document.getElementById('activity-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.manualRefresh());
        }

        // ===== CLEAR BUTTON =====
        const clearBtn = document.getElementById('activity-clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearActivities());
        }

        // ===== EXPORT BUTTON =====
        const exportBtn = document.getElementById('activity-export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportActivities());
        }

        // ===== TIME RANGE BUTTONS =====
        const timeButtons = document.querySelectorAll('.time-btn');
        timeButtons.forEach(btn => {
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

        this.filters.timeRange = range;
        this.applyFilters();
    }

    applyCustomDateRange() {
        const startInput = document.getElementById('date-start-input');
        const endInput = document.getElementById('date-end-input');

        if (!startInput || !endInput) return;

        const startValue = startInput.value;
        const endValue = endInput.value;

        if (!startValue || !endValue) {
            this.showToast('Моля въведете и двете дати', 'warning');
            return;
        }

        this.filters.dateStart = new Date(startValue);
        this.filters.dateEnd = new Date(endValue);
        this.filters.timeRange = 'custom';

        this.applyFilters();
        this.showToast('Персонализиран период приложен', 'success');
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

    startLiveStream() {
        this.isLive = true;
        this.isPaused = false;
        this.updateLiveStatusUI();
        this.setupWebSocket();
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

    // ===== WEBSOCKET CONNECTION =====

    setupWebSocket() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
            const hostname = window.location.hostname;
            const port = window.location.port;

            let wsUrl;
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                const wsPort = port === '2662' ? '2662' : (port || '2662');
                wsUrl = `${protocol}//${hostname}:${wsPort}/ws/admin/activity`;
            } else {
                wsUrl = `${protocol}//${window.location.host}/ws/admin/activity`;
            }

            this.websocket = new SockJS(wsUrl);

            this.websocket.onopen = () => {
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

            this.websocket.onclose = () => {
                setTimeout(() => {
                    if (this.isLive && !this.isPaused) {
                        this.setupWebSocket();
                    }
                }, 5000);
            };

            this.websocket.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
            };

        } catch (error) {
            console.error('❌ Failed to setup WebSocket:', error);
        }
    }

    sendWebSocketMessage(type, data = {}) {
        if (this.websocket && this.websocket.readyState === 1) {
            const message = {
                type: type,
                data: data,
                timestamp: new Date().toISOString()
            };
            this.websocket.send(JSON.stringify(message));
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

    // ===== DATA LOADING =====

    async loadInitialActivities() {
        try {
            this.showLoading();

            const response = await fetch('/admin/api/activities', {
                headers: { 'X-XSRF-TOKEN': this.getCsrfToken() }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.activities) {
                this.activities = data.activities;
                this.applyFilters();
            }

        } catch (error) {
            console.error('❌ Error loading activities:', error);
            this.showError('Грешка при зареждането на активностите');
        }
    }

    async loadRecentActivities() {
        if (!this.isLive || this.isPaused) return;

        try {
            const lastId = this.activities.length > 0 ? this.activities[0].id : 0;

            const response = await fetch(`/admin/api/activities/since/${lastId}`, {
                headers: { 'X-XSRF-TOKEN': this.getCsrfToken() }
            });

            if (!response.ok) return;

            const data = await response.json();
            const newActivities = data.activities || [];

            if (newActivities.length > 0) {
                newActivities.reverse().forEach(activity => {
                    this.addNewActivity(activity, false);
                });
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
    }

    async manualRefresh() {
        const refreshBtn = document.getElementById('activity-refresh-btn');
        if (refreshBtn) {
            refreshBtn.classList.add('spin');
        }

        await this.loadInitialActivities();

        if (refreshBtn) {
            setTimeout(() => {
                refreshBtn.classList.remove('spin');
            }, 500);
        }

        this.showToast('Активностите са обновени', 'success');
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

        tableBody.innerHTML = pageActivities.map(activity => this.renderActivityRow(activity)).join('');
    }

    renderActivityRow(activity) {
        const timeFormatted = this.formatTime(activity.timestamp);
        const userDisplay = this.formatUser(activity);
        const actionDisplay = this.formatAction(activity.action);
        const entityDisplay = this.formatEntity(activity);

        return `
            <tr data-activity-id="${activity.id}" class="activity-row">
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
            </tr>
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
        const actionMap = {
            // ===== ПУБЛИКАЦИИ =====
            'CREATE_PUBLICATION': 'Създаде публикация',
            'UPDATE_PUBLICATION': 'Редактира публикация',
            'DELETE_PUBLICATION': 'Изтри публикация',
            'VIEW_PUBLICATION': 'Прегледа публикация',

            // ===== ОПРОСТЕН ВИД СЪБИТИЕ =====
            'CREATE_SIMPLE_EVENT': 'Създаде опростен вид събитие',
            'UPDATE_SIMPLE_EVENT': 'Редактира опростен вид събитие',
            'DELETE_SIMPLE_EVENT': 'Изтри опростен вид събитие',
            'VOTE_SIMPLE_EVENT': 'Гласува в опростен вид събитие',
            'CHANGE_VOTE_SIMPLE_EVENT': 'Промени гласа в опростен вид събитие',
            'VIEW_SIMPLE_EVENT': 'Прегледа опростен вид събитие',

            // ===== РЕФЕРЕНДУМИ =====
            'CREATE_REFERENDUM': 'Създаде референдум',
            'UPDATE_REFERENDUM': 'Редактира референдум',
            'DELETE_REFERENDUM': 'Изтри референдум',
            'VOTE_REFERENDUM': 'Гласува в референдум',
            'CHANGE_VOTE_REFERENDUM': 'Промени гласа в референдум',
            'VIEW_REFERENDUM': 'Прегледа референдум',

            // ===== АНКЕТИ С МНОЖЕСТВЕН ИЗБОР =====
            'CREATE_MULTI_POLL': 'Създаде анкета с множествен избор',
            'UPDATE_MULTI_POLL': 'Редактира анкета с множествен избор',
            'DELETE_MULTI_POLL': 'Изтри анкета с множествен избор',
            'VOTE_MULTI_POLL': 'Гласува в анкета с множествен избор',
            'CHANGE_VOTE_MULTI_POLL': 'Промени гласа в анкета с множествен избор',
            'VIEW_MULTI_POLL': 'Прегледа анкета с множествен избор',

            // ===== СИГНАЛИ =====
            'CREATE_SIGNAL': 'Подаде сигнал',
            'UPDATE_SIGNAL': 'Редактира сигнал',
            'DELETE_SIGNAL': 'Изтри сигнал',
            'VIEW_SIGNAL': 'Прегледа сигнал',
            'RESOLVE_SIGNAL': 'Реши сигнала',
            'ASSIGN_SIGNAL': 'Назначи сигнала',

            // ===== КОМЕНТАРИ =====
            'CREATE_COMMENT': 'Коментира',
            'UPDATE_COMMENT': 'Редактира коментар',
            'DELETE_COMMENT': 'Изтри коментар',
            'REPLY_COMMENT': 'Отговори на коментар',

            // ===== РЕАКЦИИ =====
            'LIKE_CONTENT': 'Хареса съдържание',
            'UNLIKE_CONTENT': 'Премахна харесване',
            'DISLIKE_CONTENT': 'Не хареса съдържание',
            'REMOVE_DISLIKE': 'Премахна нехаресване',

            // ===== АВТЕНТИКАЦИЯ =====
            'LOGIN': 'Влезе в системата',
            'LOGOUT': 'Излезе от системата',
            'REGISTER': 'Регистрира се',
            'FAILED_LOGIN': 'Неуспешен опит за вход',
            'PASSWORD_RESET_REQUEST': 'Заяви смяна на парола',
            'PASSWORD_RESET_COMPLETE': 'Смени паролата',
            'EMAIL_VERIFICATION': 'Потвърди имейла',
            'RESEND_VERIFICATION': 'Изпрати отново потвърждение',

            // ===== ПРОФИЛ =====
            'UPDATE_PROFILE': 'Обнови профила',
            'CHANGE_AVATAR': 'Смени снимката',
            'CHANGE_PASSWORD': 'Смени паролата',
            'UPDATE_EMAIL': 'Смени имейла',
            'DEACTIVATE_ACCOUNT': 'Деактивира профила',
            'REACTIVATE_ACCOUNT': 'Активира профила',

            // ===== ФАЙЛОВЕ =====
            'UPLOAD_IMAGE': 'Качи снимка',
            'DELETE_IMAGE': 'Изтри снимка',
            'UPLOAD_DOCUMENT': 'Качи документ',
            'DELETE_DOCUMENT': 'Изтри документ',

            // ===== АДМИН ДЕЙСТВИЯ =====
            'ADMIN_LOGIN': 'Админ вход',
            'BAN_USER': 'Блокира потребител',
            'UNBAN_USER': 'Разблокира потребител',
            'DELETE_USER_CONTENT': 'Изтри съдържание на потребител',
            'MODERATE_CONTENT': 'Модерира съдържание',
            'APPROVE_CONTENT': 'Одобри съдържание',
            'REJECT_CONTENT': 'Отхвърли съдържание',
            'WARN_USER': 'Предупреди потребител',
            'PROMOTE_USER': 'Повиши потребител',
            'DEMOTE_USER': 'Понижи потребител',

            // ===== НАВИГАЦИЯ =====
            'SEARCH_CONTENT': 'Търси съдържание',
            'VIEW_HOMEPAGE': 'Посети началната страница',
            'VIEW_PROFILE': 'Прегледа профил',
            'VIEW_ADMIN_DASHBOARD': 'Отвори админ панела',

            // ===== СИСТЕМНИ =====
            'SYSTEM_BACKUP': 'Системно резервно копие',
            'SYSTEM_MAINTENANCE': 'Системна поддръжка',
            'DATABASE_CLEANUP': 'Почистване на базата данни',
            'CACHE_CLEAR': 'Изчистване на кеша',
            'EMAIL_SENT': 'Изпрати имейл',
            'EMAIL_FAILED': 'Неуспешен имейл',

            // ===== СИГУРНОСТ =====
            'SUSPICIOUS_ACTIVITY': 'Подозрителна активност',
            'BLOCKED_REQUEST': 'Блокирана заявка',
            'CSRF_ATTACK_BLOCKED': 'Блокирана CSRF атака',
            'SPAM_DETECTED': 'Открит спам',
            'BOT_DETECTED': 'Открит бот',

            // ===== ДРУГИ =====
            'EXPORT_DATA': 'Експорт на данни',
            'IMPORT_DATA': 'Импорт на данни',
            'GENERATE_REPORT': 'Генерира отчет',
            'SCHEDULE_TASK': 'Планира задача',
            'COMPLETE_TASK': 'Завърши задача'
        };

        const actionText = actionMap[action] || action;
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

        // Reset UI
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

        this.applyFilters();
        this.showToast('Филтрите са нулирани', 'info');
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
        const modal = new bootstrap.Modal(document.getElementById('activity-details-modal'));
        modal.show();
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
        if (window.showToast) {
            window.showToast(message, type);
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

        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
    }

    destroy() {
        this.cleanup();
    }
}

// ===== GLOBAL INITIALIZATION =====

let activityWallInstance = null;

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('activity-wall')) {
        activityWallInstance = new ActivityWall();
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