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
        security: null,
        lastUpdated: null
    },

    // Initialize advanced features
    init() {
        if (this.isInitialized) return;

        this.setupTabSystem();
        this.setupToolsPanel();
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
        this.clearRefreshTimers();

        switch (tabName) {
            case 'charts':
                break;
            case 'users':
                await this.loadUsersAnalysis();
                // ⚡ RESIZE FIX
                setTimeout(() => {
                    if (this.charts?.usersTime) {
                        this.charts.usersTime.resize();
                    }
                }, 100);
                break;
            case 'security':
                await this.loadSecurityAnalysis();
                // ⚡ RESIZE FIX
                setTimeout(() => {
                    if (this.charts?.security) {
                        this.charts.security.resize();
                    }
                }, 100);
                break;
            case 'tools':
                this.setupToolsPanel();
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
                maintainAspectRatio: false,  // ⚡ KEY FIX
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
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

    // Security analysis tab
    async loadSecurityAnalysis() {
        if (!window.activityWall?.filteredActivities) return;

        this.showTabLoading('security-content');

        try {
            const activities = window.activityWall.filteredActivities;
            const analysis = this.performSecurityAnalysis(activities);

            this.renderSecurityAnalysis(analysis);
            this.analysisData.security = analysis;

            // Setup auto-refresh for security tab
            this.setupTabRefresh('security', 15000); // 15 seconds

            const securityContent = document.getElementById('security-content');
            if (securityContent) {
                securityContent.style.opacity = '1';
                securityContent.style.pointerEvents = 'auto';
            }
        } catch (error) {
            console.error('Security analysis failed:', error);
            this.showTabError('security-content', 'Грешка при анализа на сигурността');
        }
    },

    // Perform security analysis
    performSecurityAnalysis(activities) {
        const alerts = [];
        const suspiciousIPs = new Map();
        const unusualActivity = [];
        const ipStats = {};
        const userAgentStats = {};

        // Analyze activities for security issues
        activities.forEach(activity => {
            const ip = activity.ipAddress;
            const userAgent = activity.userAgent;
            const timestamp = new Date(activity.timestamp);

            // IP tracking
            if (ip) {
                if (!ipStats[ip]) {
                    ipStats[ip] = {
                        count: 0,
                        users: new Set(),
                        actions: new Set(),
                        firstSeen: timestamp,
                        lastSeen: timestamp
                    };
                }

                ipStats[ip].count++;
                ipStats[ip].users.add(activity.username || 'Система');
                ipStats[ip].actions.add(activity.action);
                ipStats[ip].lastSeen = timestamp > ipStats[ip].lastSeen ? timestamp : ipStats[ip].lastSeen;
            }

            // User agent tracking
            if (userAgent) {
                userAgentStats[userAgent] = (userAgentStats[userAgent] || 0) + 1;
            }
        });

        // Detect suspicious IPs
        Object.entries(ipStats).forEach(([ip, stats]) => {
            const score = this.calculateSuspicionScore(stats);

            if (score > 0.7) {
                suspiciousIPs.set(ip, {
                    ...stats,
                    users: Array.from(stats.users),
                    actions: Array.from(stats.actions),
                    score: score,
                    reasons: this.getSuspicionReasons(stats)
                });

                alerts.push({
                    type: 'high',
                    title: 'Подозрителен IP адрес',
                    message: `IP ${ip} показва необичайна активност`,
                    timestamp: new Date(),
                    details: `${stats.count} активности от ${stats.users.size} потребителя`
                });
            }
        });

        // Detect unusual activity patterns
        const now = new Date();
        const recentActivities = activities.filter(a =>
            (now - new Date(a.timestamp)) < 60 * 60 * 1000 // Last hour
        );

        if (recentActivities.length > 100) {
            alerts.push({
                type: 'medium',
                title: 'Висока активност',
                message: 'Регистрирана е необичайно висока активност',
                timestamp: new Date(),
                details: `${recentActivities.length} активности през последния час`
            });
        }

        // Check for failed login attempts or errors
        const errorActions = activities.filter(a =>
            a.action.includes('ERROR') || a.action.includes('FAILED')
        );

        if (errorActions.length > 10) {
            alerts.push({
                type: 'medium',
                title: 'Множество грешки',
                message: 'Регистрирани са множество неуспешни операции',
                timestamp: new Date(),
                details: `${errorActions.length} неуспешни операции`
            });
        }

        return {
            alerts: alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
            suspiciousIPs: Array.from(suspiciousIPs.entries())
                .sort(([,a], [,b]) => b.score - a.score),
            unusualActivity,
            totalIPs: Object.keys(ipStats).length,
            securityScore: this.calculateOverallSecurityScore(alerts, suspiciousIPs.size)
        };
    },

    // Calculate suspicion score for IP
    calculateSuspicionScore(stats) {
        let score = 0;

        // High activity count
        if (stats.count > 100) score += 0.3;
        if (stats.count > 500) score += 0.3;

        // Multiple users from same IP
        if (stats.users.size > 3) score += 0.2;
        if (stats.users.size > 10) score += 0.3;

        // Diverse actions (could indicate automation)
        if (stats.actions.size > 10) score += 0.2;

        // Time-based analysis
        const timeSpan = stats.lastSeen - stats.firstSeen;
        const activitiesPerMinute = stats.count / (timeSpan / 60000);
        if (activitiesPerMinute > 2) score += 0.3;

        return Math.min(score, 1);
    },

    // Get suspicion reasons
    getSuspicionReasons(stats) {
        const reasons = [];

        if (stats.count > 100) reasons.push('Висок брой активности');
        if (stats.users.size > 3) reasons.push('Множество потребители');
        if (stats.actions.size > 10) reasons.push('Разнообразни действия');

        const timeSpan = stats.lastSeen - stats.firstSeen;
        const activitiesPerMinute = stats.count / (timeSpan / 60000);
        if (activitiesPerMinute > 2) reasons.push('Висока честота');

        return reasons;
    },

    // Calculate overall security score
    calculateOverallSecurityScore(alerts, suspiciousIPCount) {
        let score = 100;

        // Deduct points for alerts
        alerts.forEach(alert => {
            switch (alert.type) {
                case 'high': score -= 20; break;
                case 'medium': score -= 10; break;
                case 'low': score -= 5; break;
            }
        });

        // Deduct points for suspicious IPs
        score -= suspiciousIPCount * 5;

        return Math.max(score, 0);
    },

    // Render security analysis
    renderSecurityAnalysis(analysis) {
        this.renderSecurityAlerts(analysis.alerts);
        this.renderSuspiciousIPs(analysis.suspiciousIPs);
        this.renderUnusualActivity(analysis.unusualActivity);
        this.renderSecurityChart(analysis);
    },

    // Render security alerts
    renderSecurityAlerts(alerts) {
        const container = document.getElementById('security-alerts-list');
        if (!container) return;

        const alertColors = {
            high: 'danger',
            medium: 'warning',
            low: 'info'
        };

        const html = alerts.slice(0, 10).map(alert => `
            <div class="alert alert-${alertColors[alert.type]} alert-sm mb-2">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>${this.escapeHtml(alert.title)}</strong>
                        <div>${this.escapeHtml(alert.message)}</div>
                        <small class="text-muted">${alert.details}</small>
                    </div>
                    <small class="text-muted">
                        ${window.ActivityWallUtils.formatDateTime(alert.timestamp, 'relative')}
                    </small>
                </div>
            </div>
        `).join('');

        container.innerHTML = html || '<div class="text-muted p-3">Няма алерти</div>';
    },

    // Render suspicious IPs
    renderSuspiciousIPs(suspiciousIPs) {
        const container = document.getElementById('suspicious-ips-list');
        if (!container) return;

        const html = suspiciousIPs.slice(0, 10).map(([ip, data]) => `
            <div class="suspicious-ip-item p-2 border-bottom">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <code class="text-danger">${this.escapeHtml(ip)}</code>
                        <div class="mt-1">
                            <small class="badge bg-danger">${Math.round(data.score * 100)}% риск</small>
                            <small class="badge bg-secondary ms-1">${data.count} активности</small>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" 
                            onclick="ActivityWallAdvanced.showIPDetails('${this.escapeHtml(ip)}')">
                        <i class="bi bi-shield-exclamation"></i>
                    </button>
                </div>
                <div class="mt-2">
                    <small class="text-muted">
                        ${data.reasons.join(', ')}
                    </small>
                </div>
            </div>
        `).join('');

        container.innerHTML = html || '<div class="text-muted p-3">Няма подозрителни IP адреси</div>';
    },

    // Render unusual activity
    renderUnusualActivity(unusualActivity) {
        const container = document.getElementById('unusual-activity-list');
        if (!container) return;

        if (unusualActivity.length === 0) {
            container.innerHTML = '<div class="text-muted p-3">Няма необичайна активност</div>';
            return;
        }

        const html = unusualActivity.map(activity => `
            <div class="unusual-activity-item p-2 border-bottom">
                <div class="fw-bold">${this.escapeHtml(activity.title)}</div>
                <div class="text-muted">${this.escapeHtml(activity.description)}</div>
                <small class="text-muted">
                    ${window.ActivityWallUtils.formatDateTime(activity.timestamp, 'relative')}
                </small>
            </div>
        `).join('');

        container.innerHTML = html;
    },

    // Render security statistics chart
    renderSecurityChart(analysis) {
        const canvas = document.getElementById('security-stats-chart');
        if (!canvas || !window.Chart) return;

        if (this.charts?.security) {
            this.charts.security.destroy();
        }

        const ctx = canvas.getContext('2d');
        if (!this.charts) this.charts = {};

        this.charts.security = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Безопасни IP', 'Подозрителни IP', 'Алерти'],
                datasets: [{
                    data: [
                        analysis.totalIPs - analysis.suspiciousIPs.length,
                        analysis.suspiciousIPs.length,
                        analysis.alerts.length
                    ],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,  // ⚡ KEY FIX
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    },

    // Tools panel setup
    setupToolsPanel() {
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

    // Bind report generation events
    bindReportEvents() {
        ['generate-activity-report', 'generate-users-report', 'generate-security-report'].forEach(id => {
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
                case 'security':
                    reportData = this.generateSecurityReport(activities);
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
            if (this.currentTab === tabName) {
                if (tabName === 'users') {
                    await this.loadUsersAnalysis();
                } else if (tabName === 'security') {
                    await this.loadSecurityAnalysis();
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
    async onFiltersChanged(filteredActivities) {
        if (this.currentTab === 'users' && this.analysisData.users) {
            await this.loadUsersAnalysis();
        } else if (this.currentTab === 'security' && this.analysisData.security) {
            await this.loadSecurityAnalysis();
        }
    },

    // Show user details (modal or detailed view)
    showUserDetails(username) {
        if (!this.analysisData.users) return;

        const userStats = this.analysisData.users.userStats[username];
        if (!userStats) return;

        const details = `
            Потребител: ${username}
            Общо активности: ${userStats.totalActivities}
            Последна активност: ${window.ActivityWallUtils.formatDateTime(userStats.lastActivity)}
            Уникални IP адреси: ${userStats.uniqueIPs}
            Най-често действие: ${userStats.mostCommonAction ?
            window.ActivityWallUtils.translateAction(userStats.mostCommonAction[0]) : 'Няма'}
        `;

        window.ActivityWallUtils.copyToClipboard(details, 'Детайлите за потребителя са копирани');
    },

    // Show IP details
    showIPDetails(ip) {
        if (!this.analysisData.security) return;

        const ipData = this.analysisData.security.suspiciousIPs.find(([ipAddr]) => ipAddr === ip);
        if (!ipData) return;

        const [, data] = ipData;
        const details = `
            IP адрес: ${ip}
            Ниво на риск: ${Math.round(data.score * 100)}%
            Активности: ${data.count}
            Потребители: ${data.users.join(', ')}
            Причини: ${data.reasons.join(', ')}
        `;

        window.ActivityWallUtils.copyToClipboard(details, 'Детайлите за IP адреса са копирани');
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