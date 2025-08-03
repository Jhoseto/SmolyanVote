// ====== ADMIN ACTIVITY WALL JS ======
// Файл: src/main/resources/static/js/admin/activity-wall.js

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

    // ===== LIVE STREAM MANAGEMENT =====

    startLiveStream() {
        this.setupWebSocket();
        this.setupRefreshInterval();
    }

    setupWebSocket() {
        // FIXED WebSocket URL
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws/admin/activity`;

            this.websocket = new WebSocket(wsUrl);

            this.websocket.onopen = () => {
                console.log('✅ WebSocket connected');
                this.updateLiveStatus(true);

                // Request recent activities
                this.sendWebSocketMessage('get_recent', { limit: 50 });
            };

            this.websocket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleWebSocketMessage(message);
                } catch (error) {
                    console.error('WebSocket message parse error:', error);
                }
            };

            this.websocket.onclose = () => {
                console.log('⚠️ WebSocket disconnected, falling back to polling');
                this.updateLiveStatus(false);
                // Reconnect after 5 seconds
                setTimeout(() => this.setupWebSocket(), 5000);
            };

            this.websocket.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.updateLiveStatus(false);
            };

        } catch (error) {
            console.warn('WebSocket not available, using polling fallback');
            this.updateLiveStatus(false);
        }
    }

    sendWebSocketMessage(type, data = null) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
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
                this.addNewActivity(message.data, true);
                break;
            case 'recent_activities':
                this.activities = message.data || [];
                this.applyFilters();
                break;
            case 'statistics':
                this.updateStats(message.data);
                break;
            case 'pong':
                console.log('WebSocket pong received');
                break;
            default:
                console.log('Unknown WebSocket message type:', message.type);
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

        // Update connection status indicator
        this.updateConnectionStatus(isConnected);
    }

    updateConnectionStatus(isConnected) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            if (isConnected) {
                statusElement.innerHTML = '<i class="bi bi-wifi" style="color: #28a745;"></i> Свързан';
                statusElement.classList.remove('offline');
            } else {
                statusElement.innerHTML = '<i class="bi bi-wifi-off" style="color: #dc3545;"></i> Offline';
                statusElement.classList.add('offline');
            }
        }
    }

    // ===== ACTIVITY LOADING =====

    async loadInitialActivities() {
        try {
            this.showLoading();
            const response = await fetch('/admin/api/activities/recent?limit=50', {
                headers: { 'X-XSRF-TOKEN': this.getCsrfToken() }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            this.activities = data.activities || [];
            this.applyFilters();
            this.updateStats(data.stats);

        } catch (error) {
            console.error('Error loading activities:', error);
            this.showError('Грешка при зареждане на активностите');
        } finally {
            this.hideLoading();
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
        if (isRealTime) {
            this.showToast(`Нова активност от ${activity.username}: ${this.formatAction(activity)}`, 'info');
        }

        this.updateStats();
    }

    // ===== FILTERING - IMPROVED =====

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

        // Мигновенно прилагане на филтрите
        this.applyFilters();
    }

    applyFilters() {
        // Филтрираме всички активности
        this.filteredActivities = this.activities.filter(activity => this.passesFilters(activity));

        // Пререндерираме таблицата
        this.renderActivities();

        // Обновяваме брояча
        this.updateVisibleCount();

        console.log(`Filtered: ${this.filteredActivities.length} of ${this.activities.length} activities`);
    }

    passesFilters(activity) {
        // Type filter
        if (!this.filters.types.has(activity.type)) {
            return false;
        }

        // IMPROVED User filter - търси в username
        if (this.filters.user && this.filters.user.length > 0) {
            const username = (activity.username || '').toLowerCase();
            if (!username.includes(this.filters.user)) {
                return false;
            }
        }

        return true;
    }

    clearUserFilter() {
        const userFilter = document.getElementById('activity-user-filter');
        const clearUserFilter = document.getElementById('clear-user-filter');

        if (userFilter) {
            userFilter.value = '';
            this.filters.user = '';
            this.applyFilters();
        }

        if (clearUserFilter) {
            clearUserFilter.style.display = 'none';
        }

        // Remove highlights
        this.highlightSearchResults('');
    }

    highlightSearchResults(searchTerm) {
        document.querySelectorAll('.activity-user-name').forEach(element => {
            element.classList.remove('highlight');
            if (searchTerm && element.textContent.toLowerCase().includes(searchTerm)) {
                element.classList.add('highlight');
            }
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
        const iconHtml = this.getActivityIcon(activity.type, activity.action);
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
            'create_publication': 'Създаде публикация',
            'create_event': 'Създаде събитие',
            'create_referendum': 'Създаде референдум',
            'create_poll': 'Създаде анкета',
            'create_comment': 'Коментира',
            'like_publication': 'Хареса публикация',
            'dislike_publication': 'Не хареса публикация',
            'vote_referendum': 'Гласува в референдум',
            'vote_poll': 'Гласува в анкета',
            'login': 'Влезе в профила',
            'logout': 'Излезе от профила',
            'register': 'Се регистрира',
            'report_content': 'Докладва съдържание',
            'delete_content': 'Изтри съдържание',
            'edit_content': 'Редактира съдържание'
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

    clearActivities() {
        if (!confirm('Сигурни ли сте, че искате да изчистите всички активности?'))
            return;

        this.activities = [];
        this.filteredActivities = [];
        this.renderActivities();
        this.updateStats();
    }

    toggleAutoScroll() {
        this.autoScroll = !this.autoScroll;
        const btn = document.getElementById('auto-scroll-btn');

        if (this.autoScroll) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="bi bi-arrow-down"></i> Авто скрол';
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="bi bi-arrow-down"></i> Спрян скрол';
        }
    }

    scrollToTop() {
        const container = document.querySelector('.activity-stream-container');
        if (container) {
            container.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    exportActivities() {
        // FIXED - използва backend API вместо локален CSV
        window.location.href = '/admin/api/activities/export';
    }

    async manualRefresh() {
        const btn = document.getElementById('refresh-activities-btn');
        if (btn) {
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i> Зареждане...';
            btn.disabled = true;
        }

        try {
            await this.loadInitialActivities();
            this.showToast('Активностите са обновени успешно!', 'success');
        } catch (error) {
            this.showToast('Грешка при обновяване на активностите', 'error');
        } finally {
            if (btn) {
                btn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Обнови';
                btn.disabled = false;
            }
        }
    }

    // ===== STATS UPDATE =====

    updateStats(stats = null) {
        if (stats) {
            document.getElementById('online-users-count').textContent = stats.onlineUsers || 0;
            document.getElementById('last-hour-activities').textContent = stats.lastHour || 0;
            document.getElementById('today-activities').textContent = stats.today || 0;
        }

        this.updateVisibleCount();
        this.updateLastUpdate();
    }

    updateVisibleCount() {
        // Update both places where count is shown
        document.getElementById('visible-activities').textContent = this.filteredActivities.length;
        document.getElementById('total-activities').textContent = this.activities.length;
        document.getElementById('visible-activities-footer').textContent = this.filteredActivities.length;
        document.getElementById('total-activities-footer').textContent = this.activities.length;
    }

    updateLastUpdate() {
        const now = new Date().toLocaleTimeString('bg-BG', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('last-update').textContent = now;
    }

    // ===== TOAST NOTIFICATIONS =====

    showToast(message, type = 'info') {
        const toast = document.getElementById('activity-toast');
        const toastBody = document.getElementById('toast-body');
        const toastTime = document.getElementById('toast-time');

        if (toast && toastBody) {
            toastBody.textContent = message;
            toastTime.textContent = new Date().toLocaleTimeString('bg-BG', {
                hour: '2-digit',
                minute: '2-digit'
            });

            // Set toast color based on type
            toast.className = `toast ${type === 'error' ? 'border-danger' : type === 'success' ? 'border-success' : 'border-info'}`;

            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
        }
    }

    // ===== ACTIVITY DETAILS MODAL =====

    showActivityDetails(activityId) {
        const activity = this.activities.find(a => a.id == activityId);
        if (!activity) return;

        // Зареждаме детайлите в модала
        const modalContent = document.querySelector('.activity-detail-content');
        if (modalContent) {
            modalContent.innerHTML = this.createDetailContent(activity);
        }

        // Показваме модала
        const modal = new bootstrap.Modal(document.getElementById('activityDetailModal'));
        modal.show();
    }

    createDetailContent(activity) {
        return `
            <div class="detail-row">
                <div class="detail-label">Време:</div>
                <div class="detail-value">${new Date(activity.timestamp).toLocaleString('bg-BG')}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Потребител:</div>
                <div class="detail-value">${this.escapeHtml(activity.username || 'Неизвестен')}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Действие:</div>
                <div class="detail-value">${this.formatAction(activity)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Детайли:</div>
                <div class="detail-value">${this.escapeHtml(activity.details || 'Няма допълнителни детайли')}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">IP адрес:</div>
                <div class="detail-value">${activity.ipAddress || 'Неизвестен'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">User Agent:</div>
                <div class="detail-value">${this.escapeHtml(activity.userAgent || 'Неизвестен')}</div>
            </div>
        `;
    }

    copyActivityDetails() {
        const modalContent = document.querySelector('.activity-detail-content');
        if (modalContent) {
            const text = modalContent.innerText;
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('Детайлите са копирани в clipboard!', 'success');
            }).catch(() => {
                this.showToast('Грешка при копиране', 'error');
            });
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

    hideLoading() {
        // Loading се премахва автоматично при renderActivities()
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