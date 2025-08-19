// ====== ADMIN ACTIVITY WALL - ADVANCED ANALYTICS ======
// File: src/main/resources/static/js/admin/activityWall/activity-wall-advanced.js

window.ActivityWallAdvanced = {
    isInitialized: false,
    currentTab: 'charts',
    analysisCache: new Map(),
    refreshTimers: {},

    // Advanced analysis data
    analysisData: {
        users: null,
        lastUpdated: null
    },

    // Initialize advanced features
    init() {
        if (this.isInitialized) return;

        this.setupTabSystem();
        this.setupToolsContent(); // ⚡ FIXED: setupToolsPanel → setupToolsContent
        this.isInitialized = true;
    },

    // Setup tab navigation system
    setupTabSystem() {
        const tabs = document.querySelectorAll('#activity-tabs .nav-link');

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.bsTarget?.replace('#', '').replace('-content', '');
                if (targetTab) {
                    this.switchToTab(targetTab);
                }
            });
        });

        // Initialize with charts tab
        this.switchToTab('charts');
    },

    // Switch to specific tab and load content
    async switchToTab(tabName) {
        this.currentTab = tabName;

        // Clear any existing refresh timers
        this.clearRefreshTimers();

        switch (tabName) {
            case 'charts':
                // Charts are handled by ActivityWallCharts
                break;
            case 'users':
                await this.loadUsersAnalysis();
                break;
            case 'tools':
                this.setupToolsContent();
                break;
        }
    },

    // Users analysis tab
    async loadUsersAnalysis() {
        if (!window.activityWall?.filteredActivities) return;

        this.showTabLoading('users-content');

        try {
            const activities = window.activityWall.filteredActivities;
            const analysis = this.performUsersAnalysis(activities);

            this.renderUsersAnalysis(analysis);
            this.analysisData.users = analysis;
            this.analysisData.lastUpdated = new Date();

            // Setup auto-refresh for users tab
            this.setupTabRefresh('users', 30000); // 30 seconds

            // ⚡ RESTORE NORMAL STATE
            const usersContent = document.getElementById('users-content');
            if (usersContent) {
                usersContent.style.opacity = '1';
                usersContent.style.pointerEvents = 'auto';
            }

        } catch (error) {
            console.error('Users analysis failed:', error);
            this.showTabError('users-content', 'Грешка при анализа на потребителите');
        }
    },

    // Perform comprehensive users analysis
    performUsersAnalysis(activities) {
        const userStats = {};
        const userTimeline = {};
        const userActions = {};

        // Process each activity
        activities.forEach(activity => {
            const username = activity.username || 'Система';
            const hour = new Date(activity.timestamp).getHours();

            // Basic stats
            if (!userStats[username]) {
                userStats[username] = {
                    totalActivities: 0,
                    lastActivity: null,
                    firstActivity: null,
                    ipAddresses: new Set(),
                    actions: {}
                };
            }

            userStats[username].totalActivities++;
            userStats[username].lastActivity = !userStats[username].lastActivity ||
            new Date(activity.timestamp) > new Date(userStats[username].lastActivity)
                ? activity.timestamp : userStats[username].lastActivity;

            userStats[username].firstActivity = !userStats[username].firstActivity ||
            new Date(activity.timestamp) < new Date(userStats[username].firstActivity)
                ? activity.timestamp : userStats[username].firstActivity;

            if (activity.ipAddress) {
                userStats[username].ipAddresses.add(activity.ipAddress);
            }

            // Action tracking
            userStats[username].actions[activity.action] =
                (userStats[username].actions[activity.action] || 0) + 1;

            // Timeline data
            if (!userTimeline[hour]) userTimeline[hour] = {};
            userTimeline[hour][username] = (userTimeline[hour][username] || 0) + 1;

            // Action distribution
            if (!userActions[activity.action]) userActions[activity.action] = 0;
            userActions[activity.action]++;
        });

        // Convert Sets to Arrays and find most common actions
        Object.keys(userStats).forEach(username => {
            userStats[username].ipAddresses = Array.from(userStats[username].ipAddresses);
            userStats[username].uniqueIPs = userStats[username].ipAddresses.length;

            const actions = Object.entries(userStats[username].actions);
            userStats[username].mostCommonAction = actions.length > 0
                ? actions.sort(([,a], [,b]) => b - a)[0]
                : null;
        });

        return {
            userStats,
            userTimeline,
            userActions,
            topUsers: Object.entries(userStats)
                .sort(([,a], [,b]) => b.totalActivities - a.totalActivities)
                .slice(0, 20),
            totalUsers: Object.keys(userStats).length,
            totalActivities: activities.length
        };
    },

    // Render users analysis
    renderUsersAnalysis(analysis) {
        this.renderTopUsersList(analysis.topUsers);
        this.renderUsersTimeChart(analysis.userTimeline);
        this.renderUsersDetailedTable(analysis.userStats);
    },

    // Render top users list
    renderTopUsersList(topUsers) {
        const container = document.getElementById('top-users-list');
        if (!container) return;

        const html = topUsers.map(([ username, stats ], index) => `
            <div class="user-item d-flex justify-content-between align-items-center p-2 border-bottom">
                <div class="user-info">
                    <div class="user-rank">#${index + 1}</div>
                    <div class="user-name fw-bold">${this.escapeHtml(username)}</div>
                    <small class="text-muted">
                        ${stats.mostCommonAction ?
            window.ActivityWallUtils.translateAction(stats.mostCommonAction[0]) :
            'Няма данни'}
                    </small>
                </div>
                <div class="user-stats text-end">
                    <div class="fw-bold text-primary">${stats.totalActivities}</div>
                    <small class="text-muted">активности</small>
                </div>
            </div>
        `).join('');

        container.innerHTML = html || '<div class="text-muted p-3">Няма данни</div>';
    },

    // Render users time chart
    renderUsersTimeChart(userTimeline) {
        const canvas = document.getElementById('users-time-chart');
        if (!canvas || !window.Chart) return;

        // Destroy existing chart
        if (this.charts?.usersTime) {
            this.charts.usersTime.destroy();
        }

        const ctx = canvas.getContext('2d');
        const hours = Array.from({length: 24}, (_, i) => i);
        const hourlyTotals = hours.map(hour => {
            return Object.values(userTimeline[hour] || {}).reduce((sum, count) => sum + count, 0);
        });

        if (!this.charts) this.charts = {};

        this.charts.usersTime = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hours.map(h => h.toString().padStart(2, '0') + ':00'),
                datasets: [{
                    label: 'Потребителска активност',
                    data: hourlyTotals,
                    borderColor: '#4b9f3e',
                    backgroundColor: 'rgba(75, 159, 62, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    },

    // Render detailed users table
    renderUsersDetailedTable(userStats) {
        const tbody = document.getElementById('users-detailed-body');
        if (!tbody) return;

        const sortedUsers = Object.entries(userStats)
            .sort(([,a], [,b]) => b.totalActivities - a.totalActivities);

        const html = sortedUsers.map(([username, stats]) => `
            <tr>
                <td>
                    <strong>${this.escapeHtml(username)}</strong>
                </td>
                <td class="text-center">
                    <span class="badge bg-primary">${stats.totalActivities}</span>
                </td>
                <td>
                    <small>${window.ActivityWallUtils.formatDateTime(stats.lastActivity, 'relative')}</small>
                </td>
                <td>
                    <small>${stats.mostCommonAction ?
            window.ActivityWallUtils.translateAction(stats.mostCommonAction[0]) :
            '-'}</small>
                </td>
                <td>
                    <span class="badge bg-secondary">${stats.uniqueIPs}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" 
                            onclick="ActivityWallAdvanced.showUserDetails('${this.escapeHtml(username)}')">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = html || '<tr><td colspan="6" class="text-muted text-center">Няма данни</td></tr>';
    },

    // Tools panel setup
    setupToolsContent() {
        this.bindExportEvents();
        this.bindReportEvents();
        this.bindSettingsEvents();
        this.loadSavedSettings();
    },

    // Bind export events
    bindExportEvents() {
        const exportBtn = document.getElementById('export-data-btn');
        if (exportBtn) {
            exportBtn.replaceWith(exportBtn.cloneNode(true)); // Remove existing listeners
            document.getElementById('export-data-btn').addEventListener('click', () => this.handleDataExport());
        }
    },

    // Handle data export
    async handleDataExport() {
        const format = document.getElementById('export-format')?.value || 'csv';
        const period = document.getElementById('export-period')?.value || 'current';
        const details = document.getElementById('export-details')?.value || 'basic';

        try {
            const activities = this.getActivitiesForExport(period);
            const filename = `activities_${new Date().toISOString().split('T')[0]}.${format}`;

            let data;
            switch (format) {
                case 'csv':
                    data = window.ActivityWallUtils.formatDataForExport(activities, 'csv');
                    break;
                case 'json':
                    data = window.ActivityWallUtils.formatDataForExport(activities, 'json');
                    break;
                case 'excel':
                    data = window.ActivityWallUtils.formatDataForExport(activities, 'excel');
                    break;
                case 'pdf':
                    await this.generatePDFReport(activities, details);
                    return;
            }

            window.ActivityWallUtils.downloadData(data, filename, this.getMimeType(format));
            window.ActivityWallUtils.showToast(`Експортът е завършен успешно (${filename})`, 'success');

        } catch (error) {
            console.error('Export failed:', error);
            window.ActivityWallUtils.showToast('Грешка при експорта', 'error');
        }
    },

    // Get activities for export based on period
    getActivitiesForExport(period) {
        const allActivities = window.activityWall?.activities || [];

        switch (period) {
            case 'current':
                return window.activityWall?.filteredActivities || [];
            case '1h':
                return this.filterActivitiesByTime(allActivities, 1);
            case '24h':
                return this.filterActivitiesByTime(allActivities, 24);
            case '7d':
                return this.filterActivitiesByTime(allActivities, 24 * 7);
            case '30d':
                return this.filterActivitiesByTime(allActivities, 24 * 30);
            case 'all':
            default:
                return allActivities;
        }
    },

    // Filter activities by time period
    filterActivitiesByTime(activities, hours) {
        const now = new Date();
        const cutoff = new Date(now - hours * 60 * 60 * 1000);
        return activities.filter(activity => new Date(activity.timestamp) >= cutoff);
    },

    // Get MIME type for export format
    getMimeType(format) {
        const types = {
            csv: 'text/csv',
            json: 'application/json',
            excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };
        return types[format] || 'text/plain';
    },

    // Generate PDF Report
    async generatePDFReport(activities, details) {
        window.print();
        window.ActivityWallUtils.showToast('PDF доклад е готов за печат', 'success');
    },

    // Generate Users Report
    generateUsersReport(activities) {
        const users = this.performUsersAnalysis(activities);
        return JSON.stringify(users, null, 2);
    },

    // Bind report generation events
    bindReportEvents() {
        ['generate-activity-report', 'generate-users-report'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.replaceWith(btn.cloneNode(true));
                document.getElementById(id).addEventListener('click', () => {
                    const reportType = id.replace('generate-', '').replace('-report', '');
                    this.generateReport(reportType);
                });
            }
        });
    },

    // Generate reports
    async generateReport(type) {
        try {
            window.ActivityWallUtils.showToast(`Генериране на ${type} доклад...`, 'info');

            const activities = window.activityWall?.filteredActivities || [];
            let reportData;

            switch (type) {
                case 'activity':
                    reportData = this.generateActivityReport(activities);
                    break;
                case 'users':
                    reportData = this.generateUsersReport(activities);
                    break;

            }

            const filename = `${type}_report_${new Date().toISOString().split('T')[0]}.html`;
            window.ActivityWallUtils.downloadData(reportData, filename, 'text/html');
            window.ActivityWallUtils.showToast('Докладът е генериран успешно', 'success');

        } catch (error) {
            console.error('Report generation failed:', error);
            window.ActivityWallUtils.showToast('Грешка при генериране на доклада', 'error');
        }
    },

    // Generate activity report
    generateActivityReport(activities) {
        const summary = window.ActivityWallUtils.generateActivitySummary(activities);

        return `
            <!DOCTYPE html>
            <html lang="bg">
            <head>
                <meta charset="UTF-8">
                <title>Доклад за активност - SmolyanVote</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { border-bottom: 2px solid #4b9f3e; padding-bottom: 10px; margin-bottom: 20px; }
                    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
                    .stat-box { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
                    .stat-value { font-size: 24px; font-weight: bold; color: #4b9f3e; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>SmolyanVote - Доклад за активност</h1>
                    <p>Генериран на: ${new Date().toLocaleString('bg-BG')}</p>
                </div>
                
                <div class="stats">
                    <div class="stat-box">
                        <div class="stat-value">${summary.totalActivities}</div>
                        <div>Общо активности</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${summary.uniqueUsers}</div>
                        <div>Уникални потребители</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${summary.uniqueIPs}</div>
                        <div>Уникални IP адреси</div>
                    </div>
                </div>

                <h2>Най-често действие</h2>
                <p>${summary.topAction ?
            `${summary.topAction.translated}: ${summary.topAction.count} пъти` :
            'Няма данни'}</p>

                <h2>Период на данните</h2>
                <p>${summary.timeRange ?
            `От ${new Date(summary.timeRange.earliest).toLocaleString('bg-BG')} до ${new Date(summary.timeRange.latest).toLocaleString('bg-BG')}` :
            'Няма данни'}</p>
            </body>
            </html>
        `;
    },

    // Bind settings events
    bindSettingsEvents() {
        const saveBtn = document.getElementById('save-settings-btn');
        const clearBtn = document.getElementById('clear-cache-btn');

        if (saveBtn) {
            saveBtn.replaceWith(saveBtn.cloneNode(true));
            document.getElementById('save-settings-btn').addEventListener('click', () => this.saveSettings());
        }

        if (clearBtn) {
            clearBtn.replaceWith(clearBtn.cloneNode(true));
            document.getElementById('clear-cache-btn').addEventListener('click', () => this.clearCache());
        }
    },

    // Save settings
    saveSettings() {
        const refreshInterval = document.getElementById('refresh-interval')?.value;
        const maxRecords = document.getElementById('max-records')?.value;

        if (refreshInterval && window.activityWall) {
            // Update refresh interval
            window.activityWall.refreshInterval = parseInt(refreshInterval) * 1000;
        }

        if (maxRecords && window.activityWall) {
            // Update max records
            window.activityWall.maxActivities = parseInt(maxRecords);
        }

        window.ActivityWallUtils.showToast('Настройките са запазени', 'success');
    },

    // Clear cache
    clearCache() {
        this.analysisCache.clear();
        this.analysisData = { users: null, security: null, lastUpdated: null };

        if (window.activityWall) {
            window.activityWall.activities = [];
            window.activityWall.filteredActivities = [];
            window.activityWall.loadInitialActivities();
        }

        window.ActivityWallUtils.showToast('Кешът е изчистен', 'success');
    },

    // Load saved settings
    loadSavedSettings() {
        const refreshInterval = document.getElementById('refresh-interval');
        const maxRecords = document.getElementById('max-records');

        if (refreshInterval && window.activityWall) {
            refreshInterval.value = (window.activityWall.refreshInterval || 5000) / 1000;
        }

        if (maxRecords && window.activityWall) {
            maxRecords.value = window.activityWall.maxActivities || 1000;
        }
    },

    // Setup tab auto-refresh
    setupTabRefresh(tabName, interval) {
        this.clearRefreshTimer(tabName);

        this.refreshTimers[tabName] = setInterval(async () => {
            // ⚡ SKIP REFRESH if popups are open
            if (document.getElementById('user-details-popup') ||
                document.getElementById('user-actions-mini-popup') ||
                document.getElementById('user-ips-mini-popup')) {
                return; // Don't refresh while user is viewing popups
            }

            if (this.currentTab === tabName) {
                if (tabName === 'users') {
                    await this.loadUsersAnalysis();
                }
            }
        }, interval);
    },

    // Clear refresh timers
    clearRefreshTimers() {
        Object.values(this.refreshTimers).forEach(timer => clearInterval(timer));
        this.refreshTimers = {};
    },

    clearRefreshTimer(tabName) {
        if (this.refreshTimers[tabName]) {
            clearInterval(this.refreshTimers[tabName]);
            delete this.refreshTimers[tabName];
        }
    },

    // Show loading state for tab
    showTabLoading(contentId) {
        const content = document.getElementById(contentId);
        if (content) {
            content.style.opacity = '0.6';
            content.style.pointerEvents = 'none';
        }
    },

    // Show error state for tab
    showTabError(contentId, message) {
        const content = document.getElementById(contentId);
        if (content) {
            content.style.opacity = '1';
            content.style.pointerEvents = 'auto';
        }
        window.ActivityWallUtils.showToast(message, 'error');
    },

    // External integration methods
    onFiltersChanged(filteredActivities) {
        if (this.currentTab === 'users' && this.analysisData.users) {
            this.loadUsersAnalysis();
        }
    },

    // Show user details (modal or detailed view)
    showUserDetails(username) {
        if (!this.analysisData.users) return;

        const userStats = this.analysisData.users.userStats[username];
        if (!userStats) return;

        // Show custom user popup instead of copy to clipboard
        this.showUserDetailsPopup(username, userStats, event.clientX + 10, event.clientY + 10);
    },

    // Create user details popup
    createUserDetailsPopup() {
        if (document.getElementById('user-details-popup')) return;

        const popup = document.createElement('div');
        popup.id = 'user-details-popup';
        popup.className = 'user-details-popup';
        popup.style.cssText = `
            position: fixed;
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 1.25rem;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            z-index: 9999;
            display: none;
            min-width: 320px;
            max-width: 400px;
            backdrop-filter: blur(8px);
        `;

        document.body.appendChild(popup);
    },

    // Show user details popup
    showUserDetailsPopup(username, userStats, x, y) {
        this.createUserDetailsPopup();
        const popup = document.getElementById('user-details-popup');

        // Get user activities for detailed analysis
        const userActivities = window.activityWall.filteredActivities.filter(a => a.username === username);

        // Activity breakdown
        const actionCounts = Object.entries(userStats.actions)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        // Time analysis
        const hourCounts = {};
        userActivities.forEach(a => {
            const hour = new Date(a.timestamp).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        const topHour = Object.entries(hourCounts)
            .sort(([,a], [,b]) => b - a)[0];

        let content = `
            <div class="user-popup-header">
                <strong><i class="bi bi-person-circle"></i> ${this.escapeHtml(username)}</strong>
                <button type="button" class="btn-close" onclick="ActivityWallAdvanced.hideUserDetailsPopup()"
                        style="background: none; border: none; font-size: 1.2rem; opacity: 0.7; float: right; cursor: pointer;">&times;</button>
            </div>
            <hr style="margin: 0.75rem 0;">
            
            <div class="user-popup-stats">
                <div class="row text-center mb-2">
                    <div class="col-6">
                        <div class="h5 text-primary mb-0 clickable-count" 
                             onclick="ActivityWallAdvanced.showUserActionsPopup('${this.escapeHtml(username)}')"
                             style="cursor: pointer;" title="Кликни за всички действия">
                            ${userStats.totalActivities}
                        </div>
                        <small class="text-muted">Активности</small>
                    </div>
                    <div class="col-6">
                        <div class="h5 text-info mb-0 clickable-count" 
                             onclick="ActivityWallAdvanced.showUserIPsPopup('${this.escapeHtml(username)}')"
                             style="cursor: pointer;" title="Кликни за всички IP адреси">
                            ${userStats.uniqueIPs}
                        </div>
                        <small class="text-muted">IP адреса</small>
                    </div>
                </div>
                
                <div><strong>Период:</strong><br>
                <small>${window.ActivityWallUtils.formatDateTime(userStats.firstActivity, 'short')} - 
                ${window.ActivityWallUtils.formatDateTime(userStats.lastActivity, 'short')}</small></div>
        `;

        if (actionCounts.length > 0) {
            content += `
                <div class="mt-2">
                    <strong>Топ действия:</strong><br>
                    ${actionCounts.map(([action, count]) =>
                `<small>• ${window.ActivityWallUtils.translateAction(action)}: <span class="badge bg-secondary">${count}</span></small>`
            ).join('<br>')}
                </div>
            `;
        }

        if (topHour) {
            content += `
                <div class="mt-2">
                    <strong>Най-активен час:</strong> ${topHour[0]}:00ч (${topHour[1]} активности)
                </div>
            `;
        }

        if (userStats.ipAddresses.length > 0) {
            content += `
                <div class="mt-2">
                    <strong>IP адреси:</strong><br>
                    ${userStats.ipAddresses.slice(0, 3).map(ip =>
                `<small><code>${ip}</code></small>`
            ).join('<br>')}
                    ${userStats.ipAddresses.length > 3 ? `<br><small class="text-muted">+${userStats.ipAddresses.length - 3} още</small>` : ''}
                </div>
            `;
        }

        content += `
            </div>
            <div class="mt-3">
                <button type="button" class="btn btn-sm btn-primary me-2" 
                        onclick="ActivityWallAdvanced.filterByUser('${this.escapeHtml(username)}')">
                    <i class="bi bi-funnel"></i> Филтрирай таблицата
                </button>
                <button type="button" class="btn btn-sm btn-outline-secondary" 
                        onclick="ActivityWallAdvanced.copyUserInfo('${this.escapeHtml(username)}')">
                    <i class="bi bi-clipboard"></i> Копирай
                </button>
            </div>
        `;

        popup.innerHTML = content;
        popup.style.display = 'block';

        // ⚡ CENTER POSITIONING for main popup
        popup.style.left = '50%';
        popup.style.top = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.maxHeight = (window.innerHeight - 40) + 'px';
        popup.style.overflowY = 'auto';
    },

    // Hide user details popup
    hideUserDetailsPopup() {
        const popup = document.getElementById('user-details-popup');
        if (popup) popup.style.display = 'none';
    },

    // Filter main table by user
    filterByUser(username) {
        if (window.activityWall) {
            document.getElementById('user-filter').value = username;
            window.activityWall.updateFilter('user', username);
        }
        this.hideUserDetailsPopup();
    },

    // Copy user info to clipboard
    copyUserInfo(username) {
        if (!this.analysisData.users) return;

        const userStats = this.analysisData.users.userStats[username];
        if (!userStats) return;

        const details = `
Потребител: ${username}
Общо активности: ${userStats.totalActivities}
Уникални IP адреси: ${userStats.uniqueIPs}
Първа активност: ${window.ActivityWallUtils.formatDateTime(userStats.firstActivity)}
Последна активност: ${window.ActivityWallUtils.formatDateTime(userStats.lastActivity)}
Най-често действие: ${userStats.mostCommonAction ?
            window.ActivityWallUtils.translateAction(userStats.mostCommonAction[0]) + ': ' + userStats.mostCommonAction[1] : 'Няма'}
IP адреси: ${userStats.ipAddresses.join(', ')}
        `.trim();

        window.ActivityWallUtils.copyToClipboard(details, 'Потребителските детайли са копирани');
        this.hideUserDetailsPopup();
    },

    // Show user actions mini popup
    showUserActionsPopup(username) {
        if (!this.analysisData.users) return;

        const userStats = this.analysisData.users.userStats[username];
        if (!userStats) return;

        // Get main popup position
        const mainPopup = document.getElementById('user-details-popup');
        const mainRect = mainPopup ? mainPopup.getBoundingClientRect() : null;

        const miniPopup = document.createElement('div');
        miniPopup.id = 'user-actions-mini-popup';
        miniPopup.style.cssText = `
            position: fixed;
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 1rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10001;
            max-width: 300px;
            max-height: 300px;
            overflow-y: auto;
            ${mainRect ? `left: ${mainRect.right + 10}px; top: ${mainRect.top}px;` : 'left: 60%; top: 30%;'}
        `;

        const allActions = Object.entries(userStats.actions)
            .sort(([,a], [,b]) => b - a);

        miniPopup.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <strong>Всички действия на ${username}</strong>
                <button type="button" onclick="this.parentElement.parentElement.remove()"
                        style="background: none; border: none; font-size: 1.2rem; opacity: 0.7; cursor: pointer;">&times;</button>
            </div>
            <div style="max-height: 200px; overflow-y: auto;">
                ${allActions.map(([action, count]) => `
                    <div class="d-flex justify-content-between border-bottom py-1">
                        <small>${window.ActivityWallUtils.translateAction(action)}</small>
                        <span class="badge bg-primary">${count}</span>
                    </div>
                `).join('')}
            </div>
        `;

        document.body.appendChild(miniPopup);

        // Auto remove after 15 seconds (longer since user is interacting)
        setTimeout(() => {
            if (miniPopup.parentNode) miniPopup.remove();
        }, 15000);
    },

    // Show user IPs mini popup
    showUserIPsPopup(username) {
        if (!this.analysisData.users) return;

        const userStats = this.analysisData.users.userStats[username];
        if (!userStats) return;

        // Get main popup position
        const mainPopup = document.getElementById('user-details-popup');
        const mainRect = mainPopup ? mainPopup.getBoundingClientRect() : null;

        const miniPopup = document.createElement('div');
        miniPopup.id = 'user-ips-mini-popup';
        miniPopup.style.cssText = `
            position: fixed;
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 1rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10001;
            max-width: 280px;
            max-height: 250px;
            overflow-y: auto;
            ${mainRect ? `left: ${mainRect.left - 290}px; top: ${mainRect.top}px;` : 'left: 20%; top: 30%;'}
        `;

        miniPopup.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <strong>IP адреси на ${username}</strong>
                <button type="button" onclick="this.parentElement.parentElement.remove()"
                        style="background: none; border: none; font-size: 1.2rem; opacity: 0.7; cursor: pointer;">&times;</button>
            </div>
            <div style="max-height: 150px; overflow-y: auto;">
                ${userStats.ipAddresses.map(ip => `
                    <div class="py-1">
                        <code class="small">${ip}</code>
                    </div>
                `).join('')}
            </div>
        `;

        document.body.appendChild(miniPopup);

        // Auto remove after 12 seconds
        setTimeout(() => {
            if (miniPopup.parentNode) miniPopup.remove();
        }, 12000);
    },

    // Utility methods
    escapeHtml(text) {
        return window.ActivityWallUtils.escapeHtml(text);
    },

    // Cleanup
    destroy() {
        this.clearRefreshTimers();

        if (this.charts) {
            Object.values(this.charts).forEach(chart => {
                if (chart && chart.destroy) chart.destroy();
            });
        }

        // Cleanup user details popup
        const userPopup = document.getElementById('user-details-popup');
        if (userPopup && userPopup.parentNode) {
            userPopup.parentNode.removeChild(userPopup);
        }

        // Cleanup mini popups
        const actionsPopup = document.getElementById('user-actions-mini-popup');
        if (actionsPopup && actionsPopup.parentNode) {
            actionsPopup.parentNode.removeChild(actionsPopup);
        }

        const ipsPopup = document.getElementById('user-ips-mini-popup');
        if (ipsPopup && ipsPopup.parentNode) {
            ipsPopup.parentNode.removeChild(ipsPopup);
        }

        this.analysisCache.clear();
        this.isInitialized = false;
    }
};

// Auto initialization
document.addEventListener('DOMContentLoaded', function() {
    window.ActivityWallAdvanced.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (window.ActivityWallAdvanced) {
        window.ActivityWallAdvanced.destroy();
    }
});