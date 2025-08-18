// ====== ADMIN ACTIVITY WALL - ADVANCED FEATURES ======
// Файл: src/main/resources/static/js/admin/activityWall/activity-wall-advanced.js

window.ActivityWallAdvanced = {

    // ===== INTERNAL STATE =====

    analysisCache: new Map(),
    updateCallbacks: [],
    isInitialized: false,
    analysisWorker: null,

    // ===== INITIALIZATION =====

    init() {
        if (this.isInitialized) return;

        this.setupAdvancedUI();
        this.bindAdvancedEvents();
        this.isInitialized = true;

        console.log('✅ Activity Wall Advanced: Initialized');
    },

    setupAdvancedUI() {
        this.createAdvancedControlPanel();
        this.createAnalysisPanel();
        this.createStatsPanel();
    },

    createAdvancedControlPanel() {
        const existingPanel = document.getElementById('advanced-control-panel');
        if (existingPanel) return;

        const controlPanel = document.createElement('div');
        controlPanel.id = 'advanced-control-panel';
        controlPanel.className = 'advanced-control-panel mt-3';
        controlPanel.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h6 class="card-title mb-0">
                        <i class="bi bi-tools me-2"></i>Разширени инструменти
                    </h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="control-group">
                                <label class="control-label">
                                    <i class="bi bi-graph-up me-2"></i>Анализи:
                                </label>
                                <div class="btn-group-vertical d-grid gap-1" role="group">
                                    <button type="button" class="btn btn-outline-primary btn-sm" id="show-user-analysis-btn">
                                        <i class="bi bi-people"></i> Потребители
                                    </button>
                                    <button type="button" class="btn btn-outline-warning btn-sm" id="show-security-analysis-btn">
                                        <i class="bi bi-shield-check"></i> Сигурност
                                    </button>
                                    <button type="button" class="btn btn-outline-info btn-sm" id="show-performance-analysis-btn">
                                        <i class="bi bi-speedometer2"></i> Производителност
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="control-group">
                                <label class="control-label">
                                    <i class="bi bi-download me-2"></i>Експорт:
                                </label>
                                <div class="btn-group-vertical d-grid gap-1" role="group">
                                    <button type="button" class="btn btn-outline-success btn-sm" id="export-excel-btn">
                                        <i class="bi bi-file-earmark-excel"></i> Excel отчет
                                    </button>
                                    <button type="button" class="btn btn-outline-danger btn-sm" id="export-pdf-btn">
                                        <i class="bi bi-file-earmark-pdf"></i> PDF доклад
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm" id="export-xml-btn">
                                        <i class="bi bi-file-earmark-code"></i> XML данни
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="control-group">
                                <label class="control-label">
                                    <i class="bi bi-bar-chart me-2"></i>Визуализации:
                                </label>
                                <div class="btn-group-vertical d-grid gap-1" role="group">
                                    <button type="button" class="btn btn-outline-primary btn-sm" id="show-charts-btn">
                                        <i class="bi bi-graph-up"></i> Покажи графики
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm" id="generate-report-btn">
                                        <i class="bi bi-file-text"></i> Генерирай отчет
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const activityWall = document.getElementById('activity-wall');
        if (activityWall) {
            activityWall.appendChild(controlPanel);
        }
    },

    createAnalysisPanel() {
        const existingPanel = document.getElementById('analysis-panel');
        if (existingPanel) return;

        const analysisPanel = document.createElement('div');
        analysisPanel.id = 'analysis-panel';
        analysisPanel.className = 'analysis-panel mt-3';
        analysisPanel.style.display = 'none';
        analysisPanel.innerHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0" id="analysis-title">
                        <i class="bi bi-bar-chart me-2"></i>
                        Разширен анализ
                    </h5>
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="close-analysis-btn">
                        <i class="bi bi-x"></i> Затвори
                    </button>
                </div>
                <div class="card-body" id="analysis-content">
                    <!-- Analysis content will be inserted here -->
                </div>
            </div>
        `;

        const activityWall = document.getElementById('activity-wall');
        if (activityWall) {
            activityWall.appendChild(analysisPanel);
        }
    },

    createStatsPanel() {
        const existingPanel = document.getElementById('stats-panel');
        if (existingPanel) return;

        const statsPanel = document.createElement('div');
        statsPanel.id = 'stats-panel';
        statsPanel.className = 'stats-panel mt-3';
        statsPanel.innerHTML = `
            <div class="row">
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="bi bi-activity text-primary"></i>
                        </div>
                        <div class="stat-content">
                            <h4 class="stat-number" id="total-activities-stat">0</h4>
                            <p class="stat-label">Общо активности</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="bi bi-people text-success"></i>
                        </div>
                        <div class="stat-content">
                            <h4 class="stat-number" id="unique-users-stat">0</h4>
                            <p class="stat-label">Уникални потребители</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="bi bi-clock text-warning"></i>
                        </div>
                        <div class="stat-content">
                            <h4 class="stat-number" id="avg-per-hour-stat">0</h4>
                            <p class="stat-label">Средно на час</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="bi bi-shield-check text-danger"></i>
                        </div>
                        <div class="stat-content">
                            <h4 class="stat-number" id="security-alerts-stat">0</h4>
                            <p class="stat-label">Сигурност алерти</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const activityWall = document.getElementById('activity-wall');
        if (activityWall) {
            activityWall.appendChild(statsPanel);
        }
    },

    bindAdvancedEvents() {
        // Analysis Buttons
        document.getElementById('show-user-analysis-btn')?.addEventListener('click', () => this.showUserAnalysis());
        document.getElementById('show-security-analysis-btn')?.addEventListener('click', () => this.showSecurityAnalysis());
        document.getElementById('show-performance-analysis-btn')?.addEventListener('click', () => this.showPerformanceAnalysis());

        // Export Buttons
        document.getElementById('export-excel-btn')?.addEventListener('click', () => this.exportAsExcel());
        document.getElementById('export-pdf-btn')?.addEventListener('click', () => this.exportAsPDF());
        document.getElementById('export-xml-btn')?.addEventListener('click', () => this.exportAsXML());

        // Charts Button
        document.getElementById('show-charts-btn')?.addEventListener('click', () => this.showCharts());

        // Report Button
        document.getElementById('generate-report-btn')?.addEventListener('click', () => this.generateReport());

        // Close Analysis Button
        document.getElementById('close-analysis-btn')?.addEventListener('click', () => this.hideAnalysis());
    },

    // ===== ANALYSIS METHODS =====

    showUserAnalysis() {
        const activities = this.getActivities();
        if (!activities.length) {
            this.showError('Няма активности за анализ');
            return;
        }

        const analysis = this.performUserAnalysis(activities);
        this.displayAnalysis('Анализ на потребителите', this.renderUserAnalysis(analysis));
    },

    showSecurityAnalysis() {
        const activities = this.getActivities();
        if (!activities.length) {
            this.showError('Няма активности за анализ');
            return;
        }

        const analysis = this.performSecurityAnalysis(activities);
        this.displayAnalysis('Анализ на сигурността', this.renderSecurityAnalysis(analysis));
    },

    showPerformanceAnalysis() {
        const activities = this.getActivities();
        if (!activities.length) {
            this.showError('Няма активности за анализ');
            return;
        }

        const analysis = this.performPerformanceAnalysis(activities);
        this.displayAnalysis('Анализ на производителността', this.renderPerformanceAnalysis(analysis));
    },

    // ===== ANALYSIS IMPLEMENTATIONS =====

    performUserAnalysis(activities) {
        const userStats = {};
        const ipStats = {};

        activities.forEach(activity => {
            const username = activity.username || 'Анонимен';
            const ip = activity.ipAddress || 'Неизвестен';

            // User statistics
            if (!userStats[username]) {
                userStats[username] = {
                    username,
                    totalActivities: 0,
                    actions: new Set(),
                    ips: new Set(),
                    firstActivity: activity.timestamp,
                    lastActivity: activity.timestamp,
                    hourlyDistribution: new Array(24).fill(0)
                };
            }

            const stats = userStats[username];
            stats.totalActivities++;
            stats.actions.add(activity.action);
            stats.ips.add(ip);

            const hour = new Date(activity.timestamp).getHours();
            stats.hourlyDistribution[hour]++;

            if (new Date(activity.timestamp) < new Date(stats.firstActivity)) {
                stats.firstActivity = activity.timestamp;
            }
            if (new Date(activity.timestamp) > new Date(stats.lastActivity)) {
                stats.lastActivity = activity.timestamp;
            }

            // IP statistics
            ipStats[ip] = (ipStats[ip] || 0) + 1;
        });

        // Convert Sets to counts
        Object.values(userStats).forEach(stats => {
            stats.uniqueActions = stats.actions.size;
            stats.uniqueIPs = stats.ips.size;
            stats.actions = Array.from(stats.actions);
            stats.ips = Array.from(stats.ips);
        });

        return {
            userStats: Object.values(userStats).sort((a, b) => b.totalActivities - a.totalActivities),
            ipStats: Object.entries(ipStats).sort(([,a], [,b]) => b - a).slice(0, 20),
            totalUsers: Object.keys(userStats).length,
            totalIPs: Object.keys(ipStats).length
        };
    },

    performSecurityAnalysis(activities) {
        const suspiciousPatterns = [];
        const adminActions = [];
        const failedAttempts = [];
        const ipViolations = {};

        activities.forEach(activity => {
            // Admin actions
            if (activity.action && activity.action.includes('ADMIN')) {
                adminActions.push(activity);
            }

            // Failed attempts (if we had such data)
            if (activity.action && (activity.action.includes('FAIL') || activity.action.includes('ERROR'))) {
                failedAttempts.push(activity);
            }

            // IP violations
            const ip = activity.ipAddress;
            if (ip) {
                ipViolations[ip] = (ipViolations[ip] || 0) + 1;
            }
        });

        // Find suspicious IPs
        Object.entries(ipViolations).forEach(([ip, count]) => {
            if (count > 100) {
                suspiciousPatterns.push({
                    type: 'high_activity_ip',
                    severity: count > 500 ? 'high' : 'medium',
                    message: `IP ${ip} има ${count} активности`,
                    ip,
                    count
                });
            }
        });

        // Find rapid successive actions
        const sortedActivities = activities.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        for (let i = 1; i < sortedActivities.length; i++) {
            const prev = sortedActivities[i - 1];
            const curr = sortedActivities[i];

            if (prev.username === curr.username && prev.ipAddress === curr.ipAddress) {
                const timeDiff = new Date(curr.timestamp) - new Date(prev.timestamp);
                if (timeDiff < 1000) {
                    suspiciousPatterns.push({
                        type: 'rapid_actions',
                        severity: 'medium',
                        message: `Бързи действия от ${curr.username} (${timeDiff}ms разлика)`,
                        username: curr.username,
                        timeDiff
                    });
                }
            }
        }

        return {
            suspiciousPatterns: suspiciousPatterns.sort((a, b) => {
                const severityOrder = { high: 3, medium: 2, low: 1 };
                return severityOrder[b.severity] - severityOrder[a.severity];
            }),
            adminActions: adminActions.slice(0, 20),
            failedAttempts: failedAttempts.slice(0, 20),
            totalSuspicious: suspiciousPatterns.length,
            riskLevel: this.calculateRiskLevel(suspiciousPatterns)
        };
    },

    performPerformanceAnalysis(activities) {
        const hourlyLoad = new Array(24).fill(0);
        const actionLoad = {};
        const timeWindows = this.groupByTimeWindows(activities, 15); // 15-minute windows

        activities.forEach(activity => {
            const hour = new Date(activity.timestamp).getHours();
            hourlyLoad[hour]++;

            const action = activity.action || 'UNKNOWN';
            actionLoad[action] = (actionLoad[action] || 0) + 1;
        });

        const peakHour = hourlyLoad.indexOf(Math.max(...hourlyLoad));
        const avgLoad = activities.length / 24;

        return {
            hourlyLoad,
            actionLoad: Object.entries(actionLoad).sort(([,a], [,b]) => b - a).slice(0, 10),
            timeWindows: timeWindows.slice(-20), // Last 20 windows
            peakHour,
            avgLoad: Math.round(avgLoad * 100) / 100,
            totalActivities: activities.length,
            loadTrend: this.calculateLoadTrend(hourlyLoad)
        };
    },

    // ===== RENDERING METHODS =====

    renderUserAnalysis(analysis) {
        return `
            <div class="analysis-results">
                <div class="row mb-4">
                    <div class="col-md-4">
                        <div class="analysis-stat">
                            <h3>${analysis.totalUsers}</h3>
                            <p>Общо потребители</p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="analysis-stat">
                            <h3>${analysis.totalIPs}</h3>
                            <p>Уникални IP адреси</p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="analysis-stat">
                            <h3>${Math.round(analysis.userStats.reduce((sum, u) => sum + u.totalActivities, 0) / analysis.totalUsers)}</h3>
                            <p>Средно активности/потребител</p>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6">
                        <h6><i class="bi bi-people me-2"></i>Най-активни потребители</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Потребител</th>
                                        <th>Активности</th>
                                        <th>Уникални IP</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${analysis.userStats.slice(0, 10).map(user => `
                                        <tr>
                                            <td><strong>${user.username}</strong></td>
                                            <td><span class="badge bg-primary">${user.totalActivities}</span></td>
                                            <td><span class="badge bg-warning">${user.uniqueIPs}</span></td>
                                            <td><span class="badge bg-info">${user.uniqueActions}</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6><i class="bi bi-router me-2"></i>Най-активни IP адреси</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>IP Адрес</th>
                                        <th>Активности</th>
                                        <th>Статус</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${analysis.ipStats.slice(0, 10).map(([ip, count]) => `
                                        <tr>
                                            <td><code>${ip}</code></td>
                                            <td><span class="badge bg-primary">${count}</span></td>
                                            <td>
                                                <span class="badge ${count > 100 ? 'bg-danger' : count > 50 ? 'bg-warning' : 'bg-success'}">
                                                    ${count > 100 ? 'Подозрителен' : count > 50 ? 'Активен' : 'Нормален'}
                                                </span>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderSecurityAnalysis(analysis) {
        return `
            <div class="analysis-results">
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="analysis-stat">
                            <h3 class="text-${analysis.riskLevel === 'high' ? 'danger' : analysis.riskLevel === 'medium' ? 'warning' : 'success'}">
                                ${analysis.riskLevel.toUpperCase()}
                            </h3>
                            <p>Ниво на риск</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="analysis-stat">
                            <h3>${analysis.totalSuspicious}</h3>
                            <p>Подозрителни модели</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="analysis-stat">
                            <h3>${analysis.adminActions.length}</h3>
                            <p>Админ действия</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="analysis-stat">
                            <h3>${analysis.failedAttempts.length}</h3>
                            <p>Неуспешни опити</p>
                        </div>
                    </div>
                </div>

                ${analysis.suspiciousPatterns.length > 0 ? `
                    <div class="mb-4">
                        <h6><i class="bi bi-exclamation-triangle me-2"></i>Подозрителни модели</h6>
                        <div class="alert-list">
                            ${analysis.suspiciousPatterns.slice(0, 10).map(pattern => `
                                <div class="alert alert-${pattern.severity === 'high' ? 'danger' : 'warning'} alert-dismissible">
                                    <strong>${pattern.type.toUpperCase()}:</strong> ${pattern.message}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : '<div class="alert alert-success"><i class="bi bi-check-circle me-2"></i>Не са открити подозрителни модели</div>'}

                <div class="row">
                    <div class="col-md-6">
                        <h6><i class="bi bi-shield-check me-2"></i>Скорошни админ действия</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Време</th>
                                        <th>Потребител</th>
                                        <th>Действие</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${analysis.adminActions.slice(0, 5).map(action => `
                                        <tr>
                                            <td><small>${new Date(action.timestamp).toLocaleString('bg-BG')}</small></td>
                                            <td><strong>${action.username}</strong></td>
                                            <td><code>${action.action}</code></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6><i class="bi bi-x-circle me-2"></i>Неуспешни опити</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Време</th>
                                        <th>IP</th>
                                        <th>Тип</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${analysis.failedAttempts.slice(0, 5).map(attempt => `
                                        <tr>
                                            <td><small>${new Date(attempt.timestamp).toLocaleString('bg-BG')}</small></td>
                                            <td><code>${attempt.ipAddress}</code></td>
                                            <td><span class="badge bg-danger">${attempt.action}</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderPerformanceAnalysis(analysis) {
        return `
            <div class="analysis-results">
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="analysis-stat">
                            <h3>${analysis.totalActivities}</h3>
                            <p>Общо активности</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="analysis-stat">
                            <h3>${analysis.avgLoad}</h3>
                            <p>Средно на час</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="analysis-stat">
                            <h3>${analysis.peakHour}:00</h3>
                            <p>Пиков час</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="analysis-stat">
                            <h3 class="text-${analysis.loadTrend === 'increasing' ? 'danger' : analysis.loadTrend === 'decreasing' ? 'success' : 'info'}">
                                ${analysis.loadTrend === 'increasing' ? '↗' : analysis.loadTrend === 'decreasing' ? '↘' : '→'}
                            </h3>
                            <p>Тенденция на натоварването</p>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <h6><i class="bi bi-bar-chart me-2"></i>Най-чести действия</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Действие</th>
                                        <th>Брой</th>
                                        <th>Процент</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${analysis.actionLoad.map(([action, count]) => {
            const percent = Math.round((count / analysis.totalActivities) * 100);
            return `
                                            <tr>
                                                <td><code>${action}</code></td>
                                                <td><span class="badge bg-primary">${count}</span></td>
                                                <td>
                                                    <div class="progress" style="height: 20px;">
                                                        <div class="progress-bar" style="width: ${percent}%">${percent}%</div>
                                                    </div>
                                                </td>
                                            </tr>
                                        `;
        }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6><i class="bi bi-clock me-2"></i>Натоварване по часове</h6>
                        <div class="hourly-load-chart">
                            ${analysis.hourlyLoad.map((load, hour) => {
            const maxLoad = Math.max(...analysis.hourlyLoad);
            const height = maxLoad > 0 ? (load / maxLoad) * 100 : 0;
            return `
                                    <div class="hour-bar" title="${hour}:00 - ${load} активности">
                                        <div class="bar" style="height: ${height}%"></div>
                                        <div class="hour-label">${hour}</div>
                                    </div>
                                `;
        }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // ===== EXPORT METHODS =====

    exportAsExcel() {
        const activities = this.getActivities();
        if (!activities.length) {
            this.showError('Няма данни за експорт');
            return;
        }

        // Показваме съобщение че Excel експорт ще бъде имплементиран
        this.showInfo('Excel експорт ще бъде имплементиран в следваща версия. Използвайте CSV експорт от основното меню.');
    },

    exportAsPDF() {
        const activities = this.getActivities();
        if (!activities.length) {
            this.showError('Няма данни за експорт');
            return;
        }

        this.generatePDFReport(activities);
    },

    exportAsXML() {
        const activities = this.getActivities();
        if (!activities.length) {
            this.showError('Няма данни за експорт');
            return;
        }

        const xmlContent = this.generateXML(activities);

        if (window.ActivityWallUtils) {
            window.ActivityWallUtils.downloadAsFile(
                xmlContent,
                `activity-export-${new Date().toISOString().split('T')[0]}.xml`,
                'application/xml'
            );
            this.showSuccess('XML файлът е изтеглен');
        }
    },

    generatePDFReport(activities) {
        const userAnalysis = this.performUserAnalysis(activities);
        const securityAnalysis = this.performSecurityAnalysis(activities);
        const performanceAnalysis = this.performPerformanceAnalysis(activities);

        const reportContent = `
            <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
                <h1 style="text-align: center; color: #333;">Отчет за активностите</h1>
                <p style="text-align: center; color: #666;">Генериран на ${new Date().toLocaleDateString('bg-BG')}</p>
                
                <h2>Обобщение</h2>
                <ul>
                    <li>Общо активности: ${activities.length}</li>
                    <li>Уникални потребители: ${userAnalysis.totalUsers}</li>
                    <li>Уникални IP адреси: ${userAnalysis.totalIPs}</li>
                    <li>Ниво на риск: ${securityAnalysis.riskLevel}</li>
                </ul>

                <h2>Най-активни потребители</h2>
                <table border="1" style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <th>Потребител</th>
                        <th>Активности</th>
                        <th>Уникални IP</th>
                    </tr>
                    ${userAnalysis.userStats.slice(0, 10).map(user => `
                        <tr>
                            <td>${user.username}</td>
                            <td>${user.totalActivities}</td>
                            <td>${user.uniqueIPs}</td>
                        </tr>
                    `).join('')}
                </table>

                <h2>Анализ на сигурността</h2>
                <p>Открити са ${securityAnalysis.totalSuspicious} подозрителни модела.</p>
                
                <h2>Производителност</h2>
                <p>Пиков час: ${performanceAnalysis.peakHour}:00</p>
                <p>Средно активности на час: ${performanceAnalysis.avgLoad}</p>
            </div>
        `;

        // Отваряме нов прозорец за печат
        const printWindow = window.open('', '_blank');
        printWindow.document.write(reportContent);
        printWindow.document.close();
        printWindow.print();

        this.showSuccess('PDF отчетът е генериран');
    },

    generateXML(activities) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<activityReport>\n';
        xml += `  <metadata>\n`;
        xml += `    <exportDate>${new Date().toISOString()}</exportDate>\n`;
        xml += `    <totalRecords>${activities.length}</totalRecords>\n`;
        xml += `  </metadata>\n`;
        xml += `  <activities>\n`;

        activities.forEach(activity => {
            xml += '    <activity>\n';
            xml += `      <id>${activity.id}</id>\n`;
            xml += `      <timestamp>${activity.timestamp}</timestamp>\n`;
            xml += `      <username><![CDATA[${activity.username || ''}]]></username>\n`;
            xml += `      <action><![CDATA[${activity.action}]]></action>\n`;
            xml += `      <entityType><![CDATA[${activity.entityType || ''}]]></entityType>\n`;
            xml += `      <entityId>${activity.entityId || ''}</entityId>\n`;
            xml += `      <ipAddress><![CDATA[${activity.ipAddress || ''}]]></ipAddress>\n`;
            xml += `      <details><![CDATA[${activity.details || ''}]]></details>\n`;
            xml += '    </activity>\n';
        });

        xml += '  </activities>\n';
        xml += '</activityReport>';

        return xml;
    },

    // ===== CHART INTEGRATION =====

    showCharts() {
        if (window.ActivityWallCharts) {
            const activities = this.getActivities();
            window.ActivityWallCharts.showCharts(activities);
        } else {
            this.showError('Графиките не са достъпни');
        }
    },

    // ===== REPORT GENERATION =====

    generateReport() {
        const activities = this.getActivities();
        if (!activities.length) {
            this.showError('Няма данни за отчет');
            return;
        }

        const userAnalysis = this.performUserAnalysis(activities);
        const securityAnalysis = this.performSecurityAnalysis(activities);
        const performanceAnalysis = this.performPerformanceAnalysis(activities);

        const reportHtml = `
            <div class="comprehensive-report">
                <h4>Пълен отчет за активностите</h4>
                <div class="report-section">
                    ${this.renderUserAnalysis(userAnalysis)}
                </div>
                <div class="report-section">
                    ${this.renderSecurityAnalysis(securityAnalysis)}
                </div>
                <div class="report-section">
                    ${this.renderPerformanceAnalysis(performanceAnalysis)}
                </div>
            </div>
        `;

        this.displayAnalysis('Пълен отчет', reportHtml);
    },

    // ===== UTILITY METHODS =====

    getActivities() {
        return window.activityWallInstance?.filteredActivities || [];
    },

    displayAnalysis(title, content) {
        const panel = document.getElementById('analysis-panel');
        const titleElement = document.getElementById('analysis-title');
        const contentElement = document.getElementById('analysis-content');

        if (titleElement) {
            titleElement.innerHTML = `<i class="bi bi-bar-chart me-2"></i>${title}`;
        }

        if (contentElement) {
            contentElement.innerHTML = content;
        }

        if (panel) {
            panel.style.display = 'block';
            panel.scrollIntoView({ behavior: 'smooth' });
        }
    },

    hideAnalysis() {
        const panel = document.getElementById('analysis-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    },

    updateStats(activities) {
        if (!activities) return;

        const userAnalysis = this.performUserAnalysis(activities);
        const securityAnalysis = this.performSecurityAnalysis(activities);
        const performanceAnalysis = this.performPerformanceAnalysis(activities);

        // Update stat cards
        document.getElementById('total-activities-stat').textContent = activities.length;
        document.getElementById('unique-users-stat').textContent = userAnalysis.totalUsers;
        document.getElementById('avg-per-hour-stat').textContent = Math.round(performanceAnalysis.avgLoad);
        document.getElementById('security-alerts-stat').textContent = securityAnalysis.totalSuspicious;
    },

    calculateRiskLevel(suspiciousPatterns) {
        const highSeverity = suspiciousPatterns.filter(p => p.severity === 'high').length;
        const mediumSeverity = suspiciousPatterns.filter(p => p.severity === 'medium').length;

        if (highSeverity > 0) return 'high';
        if (mediumSeverity > 2) return 'medium';
        return 'low';
    },

    calculateLoadTrend(hourlyLoad) {
        const recent = hourlyLoad.slice(-6); // Last 6 hours
        const previous = hourlyLoad.slice(-12, -6); // Previous 6 hours

        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;

        const change = (recentAvg - previousAvg) / (previousAvg || 1);

        if (change > 0.2) return 'increasing';
        if (change < -0.2) return 'decreasing';
        return 'stable';
    },

    groupByTimeWindows(activities, minutes) {
        const windows = {};
        const windowMs = minutes * 60 * 1000;

        activities.forEach(activity => {
            const timestamp = new Date(activity.timestamp).getTime();
            const windowStart = Math.floor(timestamp / windowMs) * windowMs;
            const windowKey = new Date(windowStart).toISOString();

            if (!windows[windowKey]) {
                windows[windowKey] = { timestamp: windowKey, count: 0 };
            }
            windows[windowKey].count++;
        });

        return Object.values(windows).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    },

    showSuccess(message) {
        if (window.ActivityWallUtils) {
            window.ActivityWallUtils.showToast(message, 'success');
        }
    },

    showError(message) {
        if (window.ActivityWallUtils) {
            window.ActivityWallUtils.showToast(message, 'error');
        }
    },

    showInfo(message) {
        if (window.ActivityWallUtils) {
            window.ActivityWallUtils.showToast(message, 'info');
        }
    },

    // ===== INTEGRATION METHODS =====

    onFiltersChanged(filteredActivities) {
        this.updateStats(filteredActivities);

        // Clear analysis cache when filters change
        this.analysisCache.clear();
    },

    integrateWithActivityWall() {
        if (window.activityWallInstance) {
            const activities = window.activityWallInstance.filteredActivities || [];
            this.updateStats(activities);
            console.log('✅ Activity Wall Advanced: Integrated with Activity Wall');
        }
    }
};

// ===== CSS STYLES =====
const advancedStyles = `
    .analysis-stat {
        text-align: center;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #dee2e6;
    }
    
    .analysis-stat h3 {
        margin: 0;
        font-size: 2rem;
        font-weight: bold;
    }
    
    .analysis-stat p {
        margin: 0.5rem 0 0 0;
        color: #6c757d;
        font-size: 0.875rem;
    }
    
    .stat-card {
        display: flex;
        align-items: center;
        padding: 1rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 1rem;
    }
    
    .stat-icon {
        font-size: 2rem;
        margin-right: 1rem;
    }
    
    .stat-content h4 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: bold;
    }
    
    .stat-content p {
        margin: 0;
        color: #6c757d;
        font-size: 0.875rem;
    }
    
    .hourly-load-chart {
        display: flex;
        align-items: end;
        height: 200px;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 4px;
    }
    
    .hour-bar {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0 1px;
    }
    
    .bar {
        width: 100%;
        background: #007bff;
        border-radius: 2px 2px 0 0;
        min-height: 2px;
        transition: all 0.3s ease;
    }
    
    .hour-bar:hover .bar {
        background: #0056b3;
    }
    
    .hour-label {
        font-size: 0.7rem;
        margin-top: 0.25rem;
        color: #6c757d;
    }
    
    .report-section {
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #dee2e6;
    }
    
    .control-group {
        margin-bottom: 1rem;
    }
    
    .control-label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: #495057;
    }
`;

// Добавяне на стиловете
const advancedStyleSheet = document.createElement('style');
advancedStyleSheet.textContent = advancedStyles;
document.head.appendChild(advancedStyleSheet);

// ===== AUTO INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    window.ActivityWallAdvanced.init();
});

// Export for global access
window.ActivityWallAdvanced = window.ActivityWallAdvanced;