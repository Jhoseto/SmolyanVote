// ====== ADMIN ACTIVITY WALL - CORE ======
// File: src/main/resources/static/js/admin/activityWall/activity-wall.js

class ActivityWall {
    constructor() {
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
        this.sortColumn = 'timestamp';
        this.sortDirection = 'desc';
        this.selectedActivities = new Set();

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

    // Initialize the activity wall
    async init() {
        if (!this.checkRequiredElements() || !this.checkDependencies()) {
            console.error('Activity Wall: Missing required elements or dependencies');
            return;
        }

        this.setupEventListeners();
        await this.loadInitialActivities();
        await this.startLiveStream();
        this.updateConnectionStatus('connected');
        this.startRefreshInterval();
    }

    // Check if required DOM elements exist
    checkRequiredElements() {
        const required = [
            'activity-wall', 'activities-table-body', 'connection-status',
            'live-status-indicator', 'live-toggle-btn', 'activity-refresh-btn'
        ];
        return required.every(id => document.getElementById(id));
    }

    // Check if required dependencies are loaded
    checkDependencies() {
        return typeof SockJS !== 'undefined';
    }

    // Setup all event listeners
    setupEventListeners() {
        // Live controls
        document.getElementById('live-toggle-btn')?.addEventListener('click', () => this.toggleLiveStream());
        document.getElementById('activity-refresh-btn')?.addEventListener('click', () => this.manualRefresh());

        // Filter controls
        document.getElementById('time-range-filter')?.addEventListener('change', (e) => this.handleTimeRangeChange(e.target.value));
        document.getElementById('action-filter')?.addEventListener('change', (e) => this.updateFilter('action', e.target.value));
        document.getElementById('entity-type-filter')?.addEventListener('change', (e) => this.updateFilter('entityType', e.target.value));
        document.getElementById('user-filter')?.addEventListener('input', (e) => this.updateFilter('user', e.target.value));
        document.getElementById('ip-filter')?.addEventListener('input', (e) => this.updateFilter('ip', e.target.value));
        document.getElementById('clear-filters-btn')?.addEventListener('click', () => this.clearAllFilters());

        // Custom date range
        document.getElementById('apply-custom-date-btn')?.addEventListener('click', () => this.applyCustomDateRange());

        // Table interactions
        document.getElementById('select-all-checkbox')?.addEventListener('change', (e) => this.selectAllActivities(e.target.checked));
        document.getElementById('select-all-btn')?.addEventListener('click', () => this.selectAllActivities(true));
        document.getElementById('export-selected-btn')?.addEventListener('click', () => this.exportSelectedActivities());

        // Table sorting
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', (e) => this.handleSort(e.target.closest('.sortable').dataset.column));
        });

        // Activity row clicks
        document.getElementById('activities-table-body')?.addEventListener('click', (e) => this.handleTableClick(e));
    }

    // Handle time range filter change
    handleTimeRangeChange(value) {
        const customRange = document.getElementById('custom-date-range');
        if (value === 'custom') {
            customRange.style.display = 'block';
        } else {
            customRange.style.display = 'none';
            this.updateFilter('timeRange', value);
        }
    }

    // Apply custom date range filter
    applyCustomDateRange() {
        const startDate = document.getElementById('date-start-filter')?.value;
        const endDate = document.getElementById('date-end-filter')?.value;

        if (startDate && endDate) {
            this.filters.dateStart = new Date(startDate);
            this.filters.dateEnd = new Date(endDate);
            this.filters.timeRange = 'custom';
            this.applyFilters();
        }
    }

    // Update a specific filter
    updateFilter(filterName, value) {
        this.filters[filterName] = value;
        this.applyFilters();
    }

    // Clear all filters
    clearAllFilters() {
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
        document.getElementById('time-range-filter').value = 'all';
        document.getElementById('action-filter').value = '';
        document.getElementById('entity-type-filter').value = '';
        document.getElementById('user-filter').value = '';
        document.getElementById('ip-filter').value = '';
        document.getElementById('custom-date-range').style.display = 'none';

        this.applyFilters();
    }

    // Apply current filters to activities
    applyFilters() {
        this.filteredActivities = this.activities.filter(activity => {
            // Time range filter
            if (!this.passesTimeFilter(activity)) return false;

            // Text filters
            if (this.filters.user && !activity.username?.toLowerCase().includes(this.filters.user.toLowerCase())) return false;
            if (this.filters.ip && !activity.ipAddress?.includes(this.filters.ip)) return false;
            if (this.filters.action && activity.action !== this.filters.action) return false;
            if (this.filters.entityType && activity.entityType !== this.filters.entityType) return false;

            return true;
        });

        this.currentPage = 0;
        this.renderActivitiesTable();
        this.updateStatusBar();
        this.notifyFiltersChanged();
    }

    // Check if activity passes time filter
    passesTimeFilter(activity) {
        const activityTime = new Date(activity.timestamp);
        const now = new Date();

        switch (this.filters.timeRange) {
            case 'all':
                return true;
            case '1h':
                return (now - activityTime) <= 60 * 60 * 1000;
            case '2h':
                return (now - activityTime) <= 2 * 60 * 60 * 1000;
            case '6h':
                return (now - activityTime) <= 6 * 60 * 60 * 1000;
            case '12h':
                return (now - activityTime) <= 12 * 60 * 60 * 1000;
            case '24h':
                return (now - activityTime) <= 24 * 60 * 60 * 1000;
            case '48h':
                return (now - activityTime) <= 48 * 60 * 60 * 1000;
            case '72h':
                return (now - activityTime) <= 72 * 60 * 60 * 1000;
            case 'custom':
                return activityTime >= this.filters.dateStart && activityTime <= this.filters.dateEnd;
            default:
                return true;
        }
    }

    // Handle table sorting
    handleSort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'desc';
        }

        this.sortActivities();
        this.renderActivitiesTable();
        this.updateSortIcons();
    }

    // Sort activities by current sort settings
    sortActivities() {
        this.filteredActivities.sort((a, b) => {
            let aVal = a[this.sortColumn];
            let bVal = b[this.sortColumn];

            if (this.sortColumn === 'timestamp') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            }

            if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // Update sort icons in table headers
    updateSortIcons() {
        document.querySelectorAll('.sortable .sort-icon').forEach(icon => {
            icon.className = 'bi bi-chevron-expand sort-icon';
        });

        const currentHeader = document.querySelector(`[data-column="${this.sortColumn}"] .sort-icon`);
        if (currentHeader) {
            currentHeader.className = `bi bi-chevron-${this.sortDirection === 'asc' ? 'up' : 'down'} sort-icon`;
        }
    }

    // Handle table clicks (checkboxes, actions, etc.)
    handleTableClick(e) {
        if (e.target.classList.contains('activity-checkbox')) {
            const activityId = parseInt(e.target.dataset.activityId);
            this.toggleActivitySelection(activityId, e.target.checked);
        } else if (e.target.closest('.view-details-btn')) {
            const activityId = parseInt(e.target.closest('.view-details-btn').dataset.activityId);
            this.showActivityDetails(activityId);
        }
    }

    // Toggle activity selection
    toggleActivitySelection(activityId, selected) {
        if (selected) {
            this.selectedActivities.add(activityId);
        } else {
            this.selectedActivities.delete(activityId);
        }
        this.updateSelectionControls();
    }

    // Select/deselect all activities
    selectAllActivities(select) {
        const checkboxes = document.querySelectorAll('.activity-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = select;
            const activityId = parseInt(checkbox.dataset.activityId);
            if (select) {
                this.selectedActivities.add(activityId);
            } else {
                this.selectedActivities.delete(activityId);
            }
        });

        document.getElementById('select-all-checkbox').checked = select;
        this.updateSelectionControls();
    }

    // Update selection control buttons
    updateSelectionControls() {
        const exportBtn = document.getElementById('export-selected-btn');
        const hasSelected = this.selectedActivities.size > 0;

        exportBtn.disabled = !hasSelected;
        exportBtn.innerHTML = hasSelected
            ? `<i class="bi bi-download"></i> <span>Експорт избрани (${this.selectedActivities.size})</span>`
            : `<i class="bi bi-download"></i> <span>Експорт избрани</span>`;
    }

    // Load initial activities from server
    async loadInitialActivities() {
        try {
            const response = await fetch('/admin/api/activities', {
                headers: { 'X-XSRF-TOKEN': this.getCsrfToken() }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            this.activities = data.activities || [];
            this.applyFilters();
            this.updateMainTimeline();
        } catch (error) {
            console.error('Failed to load activities:', error);
            this.showError('Грешка при зареждането на активностите');
        }
    }

    // Load new activities since last ID
    async loadRecentActivities() {
        if (this.activities.length === 0) return;

        try {
            const lastId = this.activities[0].id;
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
            console.error('Failed to load recent activities:', error);
        }
    }

    // Add new activity to the list
    addNewActivity(activity, isRealTime = false) {
        this.activities.unshift(activity);

        if (this.activities.length > this.maxActivities) {
            this.activities = this.activities.slice(0, this.maxActivities);
        }

        this.applyFilters();
        this.updateMainTimeline();

        if (isRealTime) {
            this.showNewActivityNotification(activity);
        }
    }

    // Manual refresh
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
                setTimeout(() => refreshBtn.classList.remove('spin'), 500);
            }
        }
    }

    // Toggle live stream
    toggleLiveStream() {
        if (!this.isLive) {
            this.startLiveStream();
        } else if (this.isPaused) {
            this.resumeLiveStream();
        } else {
            this.pauseLiveStream();
        }
    }

    // Start live stream
    async startLiveStream() {
        this.isLive = true;
        this.isPaused = false;
        await this.setupWebSocket();
        this.updateLiveStatus();
    }

    // Pause live stream
    pauseLiveStream() {
        this.isPaused = true;
        this.updateLiveStatus();
    }

    // Resume live stream
    resumeLiveStream() {
        this.isPaused = false;
        this.updateLiveStatus();
    }

    // Stop live stream
    stopLiveStream() {
        this.isLive = false;
        this.isPaused = false;
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        this.updateLiveStatus();
    }

    // Update live status UI
    updateLiveStatus() {
        const indicator = document.getElementById('live-status-indicator');
        const toggleBtn = document.getElementById('live-toggle-btn');

        indicator.className = 'live-status-indicator';

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

    // Setup WebSocket connection
    async setupWebSocket() {
        if (typeof SockJS === 'undefined') {
            console.error('SockJS library not loaded');
            return;
        }

        try {
            const wsUrl = this.buildWebSocketURL();
            this.websocket = new SockJS(wsUrl);

            this.connectionTimeout = setTimeout(() => {
                if (this.websocket && this.websocket.readyState !== SockJS.OPEN) {
                    this.websocket.close();
                }
            }, 10000);

            this.websocket.onopen = () => {
                this.reconnectAttempts = 0;
                this.updateConnectionStatus('connected');
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
                    console.error('WebSocket message parse error:', error);
                }
            };

            this.websocket.onclose = () => {
                this.updateConnectionStatus('disconnected');
                if (this.connectionTimeout) {
                    clearTimeout(this.connectionTimeout);
                    this.connectionTimeout = null;
                }
                this.attemptReconnect();
            };

            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus('error');
            };

        } catch (error) {
            console.error('Failed to setup WebSocket:', error);
            this.updateConnectionStatus('error');
        }
    }

    // Build WebSocket URL
    buildWebSocketURL() {
        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        const hostname = window.location.hostname;
        const port = window.location.port;

        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            const wsPort = port || '2662';
            return `${protocol}//${hostname}:${wsPort}/ws/admin/activity`;
        }

        return `${protocol}//${window.location.host}/ws/admin/activity`;
    }

    // Attempt to reconnect WebSocket
    attemptReconnect() {
        if (!this.isLive || this.isPaused) return;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            this.showError('Не мога да се свържа с сървъра. Моля рефрешете страницата.');
            this.stopLiveStream();
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

        setTimeout(() => {
            if (this.isLive && !this.isPaused) {
                this.setupWebSocket();
            }
        }, delay);
    }

    // Send WebSocket message
    sendWebSocketMessage(type, data = {}) {
        if (this.websocket && this.websocket.readyState === SockJS.OPEN) {
            const message = {
                type: type,
                data: data,
                timestamp: new Date().toISOString()
            };
            this.websocket.send(JSON.stringify(message));
        }
    }

    // Handle incoming WebSocket messages
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
                    this.updateMainTimeline();
                }
                break;
            case 'error':
                console.error('WebSocket server error:', message.data);
                break;
        }
    }

    // Start auto-refresh interval
    startRefreshInterval() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.refreshInterval = setInterval(() => {
            if (this.isLive && !this.isPaused) {
                this.loadRecentActivities();
                this.updateStatusBar();
            }
        }, 5000);
    }

    // Render activities table
    renderActivitiesTable() {
        const tbody = document.getElementById('activities-table-body');
        const startIndex = this.currentPage * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageActivities = this.filteredActivities.slice(startIndex, endIndex);

        tbody.innerHTML = pageActivities.map(activity => this.createActivityRow(activity)).join('');
        this.renderPagination();
    }

    // Create activity table row
    createActivityRow(activity) {
        const isSelected = this.selectedActivities.has(activity.id);
        const timestamp = new Date(activity.timestamp).toLocaleString('bg-BG');
        const actionText = this.translateAction(activity.action);

        return `
            <tr>
                <td>
                    <input type="checkbox" class="form-check-input activity-checkbox" 
                           data-activity-id="${activity.id}" ${isSelected ? 'checked' : ''}>
                </td>
                <td><small>${timestamp}</small></td>
                <td>
                    <span class="user-badge">${activity.username || 'Система'}</span>
                </td>
                <td>
                    <span class="action-badge action-${activity.action}">${actionText}</span>
                </td>
                <td>
                    <span class="entity-badge">${activity.entityType || '-'}</span>
                </td>
                <td>
                    <small class="text-muted">${this.truncateText(activity.details || '-', 50)}</small>
                </td>
                <td>
                    <code class="ip-address">${activity.ipAddress || '-'}</code>
                </td>
                <td>
                    <button type="button" class="btn btn-sm btn-outline-primary view-details-btn" 
                            data-activity-id="${activity.id}">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    // Render pagination controls
    renderPagination() {
        const totalPages = Math.ceil(this.filteredActivities.length / this.pageSize);
        const paginationContainer = document.getElementById('pagination-controls');
        const paginationInfo = document.getElementById('pagination-info');

        const startIndex = this.currentPage * this.pageSize + 1;
        const endIndex = Math.min((this.currentPage + 1) * this.pageSize, this.filteredActivities.length);

        paginationInfo.textContent = `Показване на ${startIndex} - ${endIndex} от ${this.filteredActivities.length} записа`;

        let paginationHTML = '';

        // Previous button
        paginationHTML += `
            <li class="page-item ${this.currentPage === 0 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage - 1}">Предишна</a>
            </li>
        `;

        // Page numbers
        const startPage = Math.max(0, this.currentPage - 2);
        const endPage = Math.min(totalPages - 1, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i + 1}</a>
                </li>
            `;
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${this.currentPage >= totalPages - 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage + 1}">Следваща</a>
            </li>
        `;

        paginationContainer.innerHTML = paginationHTML;

        // Add click handlers
        paginationContainer.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (!isNaN(page) && page >= 0 && page < totalPages) {
                    this.currentPage = page;
                    this.renderActivitiesTable();
                }
            });
        });
    }

    // Update status bar with current statistics
    updateStatusBar() {
        const stats = this.calculateStatistics();

        document.getElementById('total-activities-count').textContent = this.activities.length;
        document.getElementById('filtered-activities-count').textContent = this.filteredActivities.length;
        document.getElementById('unique-users-count').textContent = stats.uniqueUsers;
        document.getElementById('active-users-count').textContent = stats.activeUsers;
        document.getElementById('avg-per-hour-count').textContent = stats.avgPerHour;
        document.getElementById('security-alerts-count').textContent = stats.securityAlerts;
        document.getElementById('last-update-time').textContent = new Date().toLocaleTimeString('bg-BG');
    }

    // Calculate statistics for status bar
    calculateStatistics() {
        const uniqueUsers = new Set(this.filteredActivities.map(a => a.username).filter(Boolean)).size;
        const now = new Date();
        const oneHourAgo = new Date(now - 60 * 60 * 1000);
        const recentActivities = this.filteredActivities.filter(a => new Date(a.timestamp) > oneHourAgo);
        const activeUsers = new Set(recentActivities.map(a => a.username).filter(Boolean)).size;
        const avgPerHour = this.filteredActivities.length > 0 ? Math.round(recentActivities.length) : 0;

        // Simple security alerts detection
        const suspiciousIPs = new Set();
        const ipCounts = {};
        this.filteredActivities.forEach(activity => {
            if (activity.ipAddress) {
                ipCounts[activity.ipAddress] = (ipCounts[activity.ipAddress] || 0) + 1;
                if (ipCounts[activity.ipAddress] > 50) { // More than 50 activities from same IP
                    suspiciousIPs.add(activity.ipAddress);
                }
            }
        });

        return {
            uniqueUsers,
            activeUsers,
            avgPerHour,
            securityAlerts: suspiciousIPs.size
        };
    }

    // Show activity details in modal
    showActivityDetails(activityId) {
        const activity = this.activities.find(a => a.id === activityId);
        if (!activity) return;

        document.getElementById('modal-activity-id').textContent = activity.id;
        document.getElementById('modal-activity-timestamp').textContent = new Date(activity.timestamp).toLocaleString('bg-BG');
        document.getElementById('modal-activity-username').textContent = activity.username || 'Система';
        document.getElementById('modal-activity-ip').textContent = activity.ipAddress || '-';
        document.getElementById('modal-activity-action').textContent = this.translateAction(activity.action);
        document.getElementById('modal-activity-entity-type').textContent = activity.entityType || '-';
        document.getElementById('modal-activity-details').textContent = activity.details || '-';
        document.getElementById('modal-activity-user-agent').textContent = activity.userAgent || '-';
        document.getElementById('modal-activity-session-id').textContent = activity.sessionId || '-';
        document.getElementById('modal-activity-entity-id').textContent = activity.entityId || '-';

        const modal = new bootstrap.Modal(document.getElementById('activity-details-modal'));
        modal.show();
    }

    // Export selected activities
    async exportSelectedActivities() {
        if (this.selectedActivities.size === 0) return;

        try {
            const selectedIds = Array.from(this.selectedActivities);
            const response = await fetch('/admin/api/activities/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': this.getCsrfToken()
                },
                body: JSON.stringify({ ids: selectedIds, format: 'csv' })
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `activities_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);

            this.showToast('Експортът е завършен успешно', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showToast('Грешка при експорта', 'error');
        }
    }

    // Update connection status
    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connection-status');
        const icons = {
            connected: 'bi-circle-fill text-success',
            disconnected: 'bi-circle-fill text-warning',
            error: 'bi-circle-fill text-danger'
        };
        const texts = {
            connected: 'Свързан',
            disconnected: 'Изключен',
            error: 'Грешка'
        };

        statusElement.innerHTML = `<i class="bi ${icons[status]}"></i> <span>${texts[status]}</span>`;
    }

    // Update main timeline chart
    updateMainTimeline() {
        if (window.ActivityWallCharts && window.ActivityWallCharts.updateMainTimeline) {
            window.ActivityWallCharts.updateMainTimeline(this.activities);
        }
    }

    // Notify other modules about filter changes
    notifyFiltersChanged() {
        if (window.ActivityWallCharts && window.ActivityWallCharts.onFiltersChanged) {
            window.ActivityWallCharts.onFiltersChanged(this.filteredActivities);
        }
        if (window.ActivityWallAdvanced && window.ActivityWallAdvanced.onFiltersChanged) {
            window.ActivityWallAdvanced.onFiltersChanged(this.filteredActivities);
        }
    }

    // Show new activity notification
    showNewActivityNotification(activity) {
        this.showToast(`Нова активност: ${this.translateAction(activity.action)}`, 'info');
    }

    // Utility functions
    getCsrfToken() {
        return document.querySelector('meta[name="_csrf"]')?.getAttribute('content') || '';
    }

    translateAction(action) {
        const translations = {
            'CREATE_PUBLICATION': 'Създаване на публикация',
            'CREATE_EVENT': 'Създаване на събитие',
            'CREATE_REFERENDUM': 'Създаване на референдум',
            'CREATE_MULTI_POLL': 'Създаване на анкета',
            'CREATE_SIGNAL': 'Създаване на сигнал',
            'CREATE_COMMENT': 'Създаване на коментар',
            'LOGIN': 'Вход в системата',
            'LOGOUT': 'Изход от системата',
            'REGISTER': 'Регистрация',
            'UPDATE_PROFILE': 'Актуализиране на профил',
            'VOTE_REFERENDUM': 'Гласуване в референдум',
            'VOTE_MULTI_POLL': 'Гласуване в анкета',
            'VOTE_SIMPLEEVENT': 'Гласуване в проста анкета',
            'LIKE_PUBLICATION': 'Харесване на публикация',
            'UNLIKE_PUBLICATION': 'Махане на харесване',
            'VIEW_PUBLICATION': 'Преглед на публикация',
            'VIEW_EVENT': 'Преглед на събитие',
            'VIEW_REFERENDUM': 'Преглед на референдум',
            'VIEW_SIGNAL': 'Преглед на сигнал',
            'VIEW_PROFILE': 'Преглед на профил',
            'SEARCH_CONTENT': 'Търсене в съдържанието',
            'FILTER_CONTENT': 'Филтриране на съдържание',
            'EDIT_PUBLICATION': 'Редактиране на публикация',
            'EDIT_EVENT': 'Редактиране на събитие',
            'EDIT_REFERENDUM': 'Редактиране на референдум',
            'EDIT_MULTI_POLL': 'Редактиране на анкета',
            'EDIT_SIGNAL': 'Редактиране на сигнал',
            'EDIT_COMMENT': 'Редактиране на коментар',
            'EDIT_PROFILE': 'Редактиране на профил',
            'DELETE_PUBLICATION': 'Изтриване на публикация',
            'DELETE_EVENT': 'Изтриване на събитие',
            'DELETE_REFERENDUM': 'Изтриване на референдум',
            'DELETE_COMMENT': 'Изтриване на коментар',
            'DELETE_SIGNAL': 'Изтриване на сигнал',
            'ADMIN_REVIEW_REPORT': 'Преглед на доклад (админ)',
            'ADMIN_DELETE_CONTENT': 'Изтриване на съдържание (админ)',
            'ADMIN_BAN_USER': 'Блокиране на потребител',
            'ADMIN_UNBAN_USER': 'Отблокиране на потребител',
            'ADMIN_PROMOTE_USER': 'Повишаване на потребител',
            'ADMIN_DEMOTE_USER': 'Понижаване на потребител',
            'CONTACT_MESSAGE': 'Съобщение до контакт',
            'UPDATE_NOTIFICATIONS': 'Актуализиране на нотификации',
            'UPDATE_PRIVACY': 'Актуализиране на поверителност',
            'EXPORT_DATA': 'Експортиране на данни',
            'DELETE_ACCOUNT': 'Изтриване на акаунт',
            'SYSTEM_BACKUP': 'Системен backup',
            'SYSTEM_MAINTENANCE': 'Системна поддръжка',
            'API_ACCESS': 'API достъп'
        };
        return translations[action] || action;
    }

    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    showToast(message, type = 'info') {
        if (window.ActivityWallUtils && window.ActivityWallUtils.showToast) {
            window.ActivityWallUtils.showToast(message, type);
        } else {
            // Fallback to simple alert
            if (type === 'error') {
                alert('Грешка: ' + message);
            }
        }
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    // Cleanup on destroy
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        if (this.websocket) {
            this.websocket.close();
        }
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.activityWall = new ActivityWall();
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (window.activityWall) {
        window.activityWall.destroy();
    }
});

// Export for global access
window.ActivityWall = ActivityWall;