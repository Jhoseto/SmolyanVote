// ====== ADMIN ACTIVITY WALL - ADVANCED FEATURES ======
// Файл: js/activityWall/activity-wall-advanced.js

window.ActivityWallAdvanced = {

    // ===== ADVANCED FILTERING =====

    initAdvancedFilters() {
        this.setupEntityTypeFilter();
        this.setupDateRangeFilter();
        this.setupActionCategoryFilter();
        this.setupIPFilter();
    },

    setupEntityTypeFilter() {
        const entityTypeSelect = document.getElementById('entity-type-filter');
        if (!entityTypeSelect) return;

        // Добавяме опции ако не съществуват
        if (entityTypeSelect.children.length <= 1) {
            const entityTypes = [
                { value: '', text: 'Всички типове' },
                { value: 'PUBLICATION', text: 'Публикации' },
                { value: 'EVENT', text: 'Прости събития' },
                { value: 'REFERENDUM', text: 'Референдуми' },
                { value: 'MULTI_POLL', text: 'Multi анкети' },
                { value: 'SIGNAL', text: 'Сигнали' },
                { value: 'COMMENT', text: 'Коментари' }
            ];

            entityTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type.value;
                option.textContent = type.text;
                entityTypeSelect.appendChild(option);
            });
        }

        entityTypeSelect.addEventListener('change', () => {
            this.applyAdvancedFilters();
        });
    },

    setupDateRangeFilter() {
        const dateRangeSelect = document.getElementById('date-range-filter');
        if (!dateRangeSelect) return;

        // Добавяме опции ако не съществуват
        if (dateRangeSelect.children.length <= 1) {
            const dateRanges = [
                { value: '', text: 'Всички периоди' },
                { value: '1h', text: 'Последният час' },
                { value: '6h', text: 'Последните 6 часа' },
                { value: '24h', text: 'Последните 24 часа' },
                { value: '7d', text: 'Последните 7 дни' },
                { value: '30d', text: 'Последните 30 дни' }
            ];

            dateRanges.forEach(range => {
                const option = document.createElement('option');
                option.value = range.value;
                option.textContent = range.text;
                dateRangeSelect.appendChild(option);
            });
        }

        dateRangeSelect.addEventListener('change', () => {
            this.applyAdvancedFilters();
        });

        // Custom date range picker
        const customDateStart = document.getElementById('custom-date-start');
        const customDateEnd = document.getElementById('custom-date-end');

        if (customDateStart && customDateEnd) {
            [customDateStart, customDateEnd].forEach(input => {
                input.addEventListener('change', () => {
                    if (customDateStart.value && customDateEnd.value) {
                        dateRangeSelect.value = 'custom';
                        this.applyAdvancedFilters();
                    }
                });
            });
        }
    },

    setupActionCategoryFilter() {
        const actionCategorySelect = document.getElementById('action-category-filter');
        if (!actionCategorySelect) return;

        // Добавяме опции ако не съществуват
        if (actionCategorySelect.children.length <= 1) {
            const categories = [
                { value: '', text: 'Всички действия' },
                { value: 'create', text: 'Създаване' },
                { value: 'interact', text: 'Взаимодействие' },
                { value: 'vote', text: 'Гласуване' },
                { value: 'moderate', text: 'Модерация' },
                { value: 'auth', text: 'Автентикация' }
            ];

            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.value;
                option.textContent = cat.text;
                actionCategorySelect.appendChild(option);
            });
        }

        actionCategorySelect.addEventListener('change', () => {
            this.applyAdvancedFilters();
        });
    },

    setupIPFilter() {
        const ipFilterInput = document.getElementById('ip-filter');
        const clearIPFilter = document.getElementById('clear-ip-filter');

        if (ipFilterInput) {
            ipFilterInput.addEventListener('input', () => {
                this.applyAdvancedFilters();
                if (clearIPFilter) {
                    clearIPFilter.style.display = ipFilterInput.value ? 'inline-block' : 'none';
                }
            });
        }

        if (clearIPFilter) {
            clearIPFilter.addEventListener('click', () => {
                ipFilterInput.value = '';
                clearIPFilter.style.display = 'none';
                this.applyAdvancedFilters();
            });
        }
    },

    applyAdvancedFilters() {
        const entityType = document.getElementById('entity-type-filter')?.value || '';
        const dateRange = document.getElementById('date-range-filter')?.value || '';
        const actionCategory = document.getElementById('action-category-filter')?.value || '';
        const ipFilter = document.getElementById('ip-filter')?.value.trim() || '';

        // Използваме /filtered endpoint за advanced филтри
        this.loadFilteredActivities(entityType, dateRange, actionCategory, ipFilter);
    },

    async loadFilteredActivities(entityType, dateRange, actionCategory, ipFilter) {
        try {
            const params = new URLSearchParams();

            if (entityType) params.append('entityType', entityType);
            if (actionCategory) params.append('action', actionCategory);
            if (ipFilter) {
                // За IP филтър ще направим локално филтриране
            }

            if (dateRange && dateRange !== 'custom') {
                const now = new Date();
                let since;

                switch (dateRange) {
                    case '1h':
                        since = new Date(now.getTime() - 60 * 60 * 1000);
                        break;
                    case '6h':
                        since = new Date(now.getTime() - 6 * 60 * 60 * 1000);
                        break;
                    case '24h':
                        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                        break;
                    case '7d':
                        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                    case '30d':
                        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        break;
                }

                if (since) {
                    params.append('since', since.toISOString());
                }
            }

            params.append('size', '200'); // Повече записи за филтриране

            const response = await fetch(`/admin/api/activities/filtered?${params.toString()}`, {
                headers: { 'X-XSRF-TOKEN': this.getCsrfToken() }
            });

            if (!response.ok) return;

            const data = await response.json();
            let filtered = data.activities || [];

            // Допълнително локално филтриране
            if (ipFilter) {
                filtered = filtered.filter(activity =>
                    activity.ipAddress && activity.ipAddress.includes(ipFilter)
                );
            }

            // Прилагаме основните филтри (user, types)
            filtered = filtered.filter(activity => {
                const activityType = this.determineActivityType(activity.action);
                if (!this.filters.types.has(activityType)) {
                    return false;
                }

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

            this.activities = filtered;
            this.filteredActivities = filtered;
            this.renderActivities();
            this.updateStats();
            this.updateAdvancedStats();

        } catch (error) {
            console.error('Error loading filtered activities:', error);
        }
    },

    clearAllFilters() {
        // Основни филтри
        this.filters.user = '';
        this.filters.types = new Set(['create', 'interact', 'moderate', 'auth', 'other']);

        // Advanced филтри
        const entityTypeFilter = document.getElementById('entity-type-filter');
        const dateRangeFilter = document.getElementById('date-range-filter');
        const actionCategoryFilter = document.getElementById('action-category-filter');
        const ipFilterInput = document.getElementById('ip-filter');
        const customDateStart = document.getElementById('custom-date-start');
        const customDateEnd = document.getElementById('custom-date-end');

        if (entityTypeFilter) entityTypeFilter.value = '';
        if (dateRangeFilter) dateRangeFilter.value = '';
        if (actionCategoryFilter) actionCategoryFilter.value = '';
        if (ipFilterInput) ipFilterInput.value = '';
        if (customDateStart) customDateStart.value = '';
        if (customDateEnd) customDateEnd.value = '';

        // UI reset
        const userFilter = document.getElementById('activity-user-filter');
        const clearUserFilter = document.getElementById('clear-user-filter');
        const clearIPFilter = document.getElementById('clear-ip-filter');

        if (userFilter) userFilter.value = '';
        if (clearUserFilter) clearUserFilter.style.display = 'none';
        if (clearIPFilter) clearIPFilter.style.display = 'none';

        // Type buttons reset
        document.querySelectorAll('.activity-filter-btn').forEach(btn => {
            btn.classList.add('active');
        });

        // Зареждаме първоначалните активности
        this.loadInitialActivities();
    },

    // ===== STATISTICS & CHARTS =====

    updateAdvancedStats() {
        this.updateEntityTypeStats();
        this.updateActionCategoryStats();
        this.updateHourlyChart();
        this.updateTopUsersChart();
    },

    updateEntityTypeStats() {
        const entityStats = {};
        this.filteredActivities.forEach(activity => {
            const entityType = activity.entityType || 'OTHER';
            entityStats[entityType] = (entityStats[entityType] || 0) + 1;
        });

        this.updateStatsPieChart('entity-type-chart', entityStats, {
            'PUBLICATION': 'Публикации',
            'EVENT': 'События',
            'REFERENDUM': 'Референдуми',
            'MULTI_POLL': 'Анкети',
            'SIGNAL': 'Сигнали',
            'COMMENT': 'Коментари',
            'OTHER': 'Други'
        });
    },

    updateActionCategoryStats() {
        const categoryStats = {};
        this.filteredActivities.forEach(activity => {
            const category = this.determineActivityType(activity.action);
            categoryStats[category] = (categoryStats[category] || 0) + 1;
        });

        this.updateStatsPieChart('action-category-chart', categoryStats, {
            'create': 'Създаване',
            'interact': 'Взаимодействие',
            'moderate': 'Модерация',
            'auth': 'Автентикация',
            'other': 'Други'
        });
    },

    updateHourlyChart() {
        const hourlyStats = {};
        const now = new Date();

        // Инициализираме последните 24 часа
        for (let i = 23; i >= 0; i--) {
            const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
            const hourKey = hour.getHours();
            hourlyStats[hourKey] = 0;
        }

        // Броим активностите по часове
        this.filteredActivities.forEach(activity => {
            const activityDate = new Date(activity.timestamp);
            const hour = activityDate.getHours();
            if (hourlyStats.hasOwnProperty(hour)) {
                hourlyStats[hour]++;
            }
        });

        this.updateStatsBarChart('hourly-activity-chart', hourlyStats, 'Активности по часове');
    },

    updateTopUsersChart() {
        const userStats = {};
        this.filteredActivities.forEach(activity => {
            const username = activity.username || 'Неизвестен';
            userStats[username] = (userStats[username] || 0) + 1;
        });

        // Топ 10 потребители
        const sortedUsers = Object.entries(userStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});

        this.updateStatsBarChart('top-users-chart', sortedUsers, 'Топ потребители');
    },

    updateStatsPieChart(chartId, data, labels) {
        const chartContainer = document.getElementById(chartId);
        if (!chartContainer) return;

        const total = Object.values(data).reduce((sum, count) => sum + count, 0);
        if (total === 0) {
            chartContainer.innerHTML = '<div class="text-muted">Няма данни</div>';
            return;
        }

        let html = '<div class="stats-pie-chart">';
        Object.entries(data).forEach(([key, value]) => {
            const percentage = ((value / total) * 100).toFixed(1);
            const label = labels[key] || key;
            html += `
                <div class="stats-pie-item">
                    <span class="stats-pie-label">${label}</span>
                    <span class="stats-pie-value">${value} (${percentage}%)</span>
                </div>
            `;
        });
        html += '</div>';

        chartContainer.innerHTML = html;
    },

    updateStatsBarChart(chartId, data, title) {
        const chartContainer = document.getElementById(chartId);
        if (!chartContainer) return;

        const maxValue = Math.max(...Object.values(data));
        if (maxValue === 0) {
            chartContainer.innerHTML = '<div class="text-muted">Няма данни</div>';
            return;
        }

        let html = `<div class="stats-bar-chart"><h6>${title}</h6>`;
        Object.entries(data).forEach(([key, value]) => {
            const percentage = (value / maxValue) * 100;
            html += `
                <div class="stats-bar-item">
                    <div class="stats-bar-label">${key}</div>
                    <div class="stats-bar-container">
                        <div class="stats-bar-fill" style="width: ${percentage}%"></div>
                        <span class="stats-bar-value">${value}</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        chartContainer.innerHTML = html;
    },

    // ===== STATISTICS API CALLS =====

    async loadStatistics() {
        try {
            const response = await fetch('/admin/api/activities/stats', {
                headers: { 'X-XSRF-TOKEN': this.getCsrfToken() }
            });

            if (!response.ok) return;

            const data = await response.json();
            this.updateStatistics(data.stats);

        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    },

    updateStatistics(data) {
        // Обновяваме основните статистики
        if (data.lastHour !== undefined) {
            const lastHourEl = document.getElementById('stats-last-hour');
            if (lastHourEl) lastHourEl.textContent = data.lastHour;
        }
        if (data.today !== undefined) {
            const todayEl = document.getElementById('stats-today');
            if (todayEl) todayEl.textContent = data.today;
        }
        if (data.onlineUsers !== undefined) {
            const onlineUsersEl = document.getElementById('stats-online-users');
            if (onlineUsersEl) onlineUsersEl.textContent = data.onlineUsers;
        }

        // Топ потребители
        if (data.topUsers && Array.isArray(data.topUsers)) {
            const topUsersContainer = document.getElementById('top-users-list');
            if (topUsersContainer) {
                let html = '';
                data.topUsers.slice(0, 5).forEach((user, index) => {
                    html += `
                        <div class="top-user-item">
                            <span class="top-user-rank">${index + 1}.</span>
                            <span class="top-user-name">${user.username}</span>
                            <span class="top-user-count">${user.activityCount}</span>
                        </div>
                    `;
                });
                topUsersContainer.innerHTML = html;
            }
        }

        // Топ действия
        if (data.topActions && Array.isArray(data.topActions)) {
            const topActionsContainer = document.getElementById('top-actions-list');
            if (topActionsContainer) {
                let html = '';
                data.topActions.slice(0, 5).forEach((action, index) => {
                    html += `
                        <div class="top-action-item">
                            <span class="top-action-rank">${index + 1}.</span>
                            <span class="top-action-name">${this.formatAction({action: action.action})}</span>
                            <span class="top-action-count">${action.count}</span>
                        </div>
                    `;
                });
                topActionsContainer.innerHTML = html;
            }
        }
    },

    // ===== MODAL DETAILS =====

    showActivityDetails(activityId) {
        const activity = this.activities.find(a => a.id == activityId);
        if (!activity) return;

        const modal = document.getElementById('activity-details-modal');
        if (!modal) return;

        // Попълваме modal-а с данни
        document.getElementById('modal-activity-id').textContent = activity.id;
        document.getElementById('modal-activity-time').textContent = this.formatTime(activity.timestamp);
        document.getElementById('modal-activity-user').textContent = activity.username || 'Неизвестен';
        document.getElementById('modal-activity-action').textContent = this.formatAction(activity);
        document.getElementById('modal-activity-entity-type').textContent = activity.entityType || '--';
        document.getElementById('modal-activity-entity-id').textContent = activity.entityId || '--';
        document.getElementById('modal-activity-details').textContent = activity.details || '--';
        document.getElementById('modal-activity-ip').textContent = activity.ipAddress || '--';
        document.getElementById('modal-activity-user-agent').textContent = activity.userAgent || '--';

        // Показваме modal-а
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        // Запазваме референция за copyActivityDetails
        this.currentModalActivity = activity;
    },

    copyActivityDetails() {
        if (!this.currentModalActivity) return;

        const activity = this.currentModalActivity;
        const details = `
Activity Details:
ID: ${activity.id}
Time: ${new Date(activity.timestamp).toLocaleString('bg-BG')}
User: ${activity.username || 'Unknown'}
Action: ${this.formatAction(activity)}
Entity Type: ${activity.entityType || '--'}
Entity ID: ${activity.entityId || '--'}
Details: ${activity.details || '--'}
IP Address: ${activity.ipAddress || '--'}
User Agent: ${activity.userAgent || '--'}
        `.trim();

        if (navigator.clipboard) {
            navigator.clipboard.writeText(details).then(() => {
                if (window.ActivityWallUtils) {
                    window.ActivityWallUtils.showToast('Детайлите са копирани', 'success');
                }
            }).catch(() => {
                if (window.ActivityWallUtils) {
                    window.ActivityWallUtils.showToast('Грешка при копиране', 'error');
                }
            });
        }
    },

    // ===== EXPORT FUNCTIONS =====

    async exportActivities() {
        try {
            // Подготвяме параметрите за експорт
            const params = new URLSearchParams();

            // Основни филтри
            if (this.filters.user) {
                params.append('username', this.filters.user);
            }

            // Advanced филтри
            const entityType = document.getElementById('entity-type-filter')?.value;
            if (entityType) {
                params.append('entityType', entityType);
            }

            const dateRange = document.getElementById('date-range-filter')?.value;
            if (dateRange && dateRange !== 'custom') {
                const now = new Date();
                let since;

                switch (dateRange) {
                    case '1h':
                        since = new Date(now.getTime() - 60 * 60 * 1000);
                        break;
                    case '6h':
                        since = new Date(now.getTime() - 6 * 60 * 60 * 1000);
                        break;
                    case '24h':
                        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                        break;
                    case '7d':
                        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                    case '30d':
                        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        break;
                }

                if (since) {
                    params.append('since', since.toISOString());
                }
            }

            params.append('limit', '5000'); // Максимум 5000 записа

            const url = `/admin/api/activities/export?${params.toString()}`;

            // Показваме loading
            const exportBtn = document.getElementById('activity-export-btn');
            const originalText = exportBtn?.innerHTML;
            if (exportBtn) {
                exportBtn.innerHTML = '<i class="bi bi-download spin"></i> Експортиране...';
                exportBtn.disabled = true;
            }

            // Правим заявката
            const response = await fetch(url, {
                headers: { 'X-XSRF-TOKEN': this.getCsrfToken() }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            // Изтегляме файла
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `activity_log_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);

            if (window.ActivityWallUtils) {
                window.ActivityWallUtils.showToast('Експортът е завършен успешно', 'success');
            }

        } catch (error) {
            console.error('Export error:', error);
            if (window.ActivityWallUtils) {
                window.ActivityWallUtils.showToast('Грешка при експортирането', 'error');
            }
        } finally {
            // Възстановяваме бутона
            const exportBtn = document.getElementById('activity-export-btn');
            if (exportBtn) {
                exportBtn.innerHTML = '<i class="bi bi-download"></i> Експорт';
                exportBtn.disabled = false;
            }
        }
    },

    // ===== INITIALIZATION =====

    init() {
        this.initAdvancedFilters();
        this.loadStatistics();

        // Clear all filters button
        const clearAllFiltersBtn = document.getElementById('clear-all-filters-btn');
        if (clearAllFiltersBtn) {
            clearAllFiltersBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }

        // Periodic stats update
        setInterval(() => {
            this.loadStatistics();
        }, 30000); // Всеки 30 секунди
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('activity-wall') && window.activityWallInstance) {
        // Extend the main instance with advanced features
        Object.assign(window.activityWallInstance, window.ActivityWallAdvanced);
        window.ActivityWallAdvanced.init.call(window.activityWallInstance);
    }
});