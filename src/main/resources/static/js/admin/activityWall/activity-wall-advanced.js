// ====== ADMIN ACTIVITY WALL - ADVANCED FEATURES (FIXED) ======
// Файл: src/main/resources/static/js/admin/activityWall/activity-wall-advanced.js

window.ActivityWallAdvanced = {

    // ===== INTERNAL STATE =====
    analysisCache: new Map(),
    updateCallbacks: [],
    isInitialized: false,
    analysisWorker: null,
    currentAnalysisRequest: null,

    // ===== INITIALIZATION (IMPROVED) =====

    async init() {
        if (this.isInitialized) return;

        try {
            console.log('🚀 Initializing Activity Wall Advanced...');

            await this.setupAdvancedUI();
            this.bindAdvancedEvents();
            this.setupAnalysisCache();
            this.isInitialized = true;

            console.log('✅ Activity Wall Advanced: Initialized successfully');
        } catch (error) {
            console.error('❌ Activity Wall Advanced initialization failed:', error);
        }
    },

    async setupAdvancedUI() {
        await this.createAdvancedControlPanel();
        await this.createAnalysisPanel();
        await this.createStatsPanel();
    },

    setupAnalysisCache() {
        // Clear cache every 5 minutes to prevent memory leaks
        setInterval(() => {
            const now = Date.now();
            for (const [key, value] of this.analysisCache.entries()) {
                if (now - value.timestamp > 300000) { // 5 minutes
                    this.analysisCache.delete(key);
                }
            }
        }, 300000);
    },

    async createAdvancedControlPanel() {
        const existingPanel = document.getElementById('advanced-control-panel');
        if (existingPanel) return;

        const controlPanel = document.createElement('div');
        controlPanel.id = 'advanced-control-panel';
        controlPanel.className = 'advanced-control-panel mt-3';
        controlPanel.innerHTML = this.getAdvancedControlPanelHTML();

        const activityWall = document.getElementById('activity-wall');
        if (activityWall) {
            activityWall.appendChild(controlPanel);
        }
    },

    getAdvancedControlPanelHTML() {
        return `
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
    },

    async createAnalysisPanel() {
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
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-secondary" id="refresh-analysis-btn" title="Обнови анализа">
                            <i class="bi bi-arrow-clockwise"></i>
                        </button>
                        <button type="button" class="btn btn-outline-secondary" id="close-analysis-btn" title="Затвори">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
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

    async createStatsPanel() {
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
        this.bindEventSafely('show-user-analysis-btn', 'click', () => this.showUserAnalysis());
        this.bindEventSafely('show-security-analysis-btn', 'click', () => this.showSecurityAnalysis());
        this.bindEventSafely('show-performance-analysis-btn', 'click', () => this.showPerformanceAnalysis());

        // Export Buttons
        this.bindEventSafely('export-excel-btn', 'click', () => this.exportAsExcel());
        this.bindEventSafely('export-pdf-btn', 'click', () => this.exportAsPDF());
        this.bindEventSafely('export-xml-btn', 'click', () => this.exportAsXML());

        // Other Buttons
        this.bindEventSafely('show-charts-btn', 'click', () => this.showCharts());
        this.bindEventSafely('generate-report-btn', 'click', () => this.generateReport());
        this.bindEventSafely('close-analysis-btn', 'click', () => this.hideAnalysis());
        this.bindEventSafely('refresh-analysis-btn', 'click', () => this.refreshCurrentAnalysis());
    },

    bindEventSafely(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`⚠️ Element not found: ${elementId}`);
        }
    },

    // ===== ANALYSIS METHODS (IMPROVED) =====

    async showUserAnalysis() {
        await this.performAnalysis('user', 'Анализ на потребителите', this.performUserAnalysis.bind(this), this.renderUserAnalysis.bind(this));
    },

    async showSecurityAnalysis() {
        await this.performAnalysis('security', 'Анализ на сигурността', this.performSecurityAnalysis.bind(this), this.renderSecurityAnalysis.bind(this));
    },

    async showPerformanceAnalysis() {
        await this.performAnalysis('performance', 'Анализ на производителността', this.performPerformanceAnalysis.bind(this), this.renderPerformanceAnalysis.bind(this));
    },

    async performAnalysis(type, title, analysisFunction, renderFunction) {
        try {
            const activities = this.getActivities();
            if (!activities.length) {
                this.showError('Няма активности за анализ');
                return;
            }

            // Show loading
            this.showAnalysisLoading(title);

            // Check cache first
            const cacheKey = `${type}_${activities.length}_${this.getActivitiesHash(activities)}`;
            let analysis = this.getFromCache(cacheKey);

            if (!analysis) {
                console.log(`🔍 Performing ${type} analysis on ${activities.length} activities...`);

                // Cancel any existing analysis
                if (this.currentAnalysisRequest) {
                    this.currentAnalysisRequest.cancelled = true;
                }

                // Create new analysis request
                this.currentAnalysisRequest = { cancelled: false };
                const currentRequest = this.currentAnalysisRequest;

                // Perform analysis
                analysis = await this.runAnalysisWithTimeout(analysisFunction, activities, 10000);

                // Check if request was cancelled
                if (currentRequest.cancelled) {
                    return;
                }

                // Cache the result
                this.saveToCache(cacheKey, analysis);
            } else {
                console.log(`📋 Using cached ${type} analysis`);
            }

            // Render results
            const renderedContent = renderFunction(analysis);
            this.displayAnalysis(title, renderedContent);

        } catch (error) {
            console.error(`❌ Error in ${type} analysis:`, error);
            this.showError(`Грешка при ${type} анализ: ${error.message}`);
        }
    },

    async runAnalysisWithTimeout(analysisFunction, activities, timeout) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Анализът отне твърде много време'));
            }, timeout);

            try {
                const result = analysisFunction(activities);
                clearTimeout(timeoutId);
                resolve(result);
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    },

    getActivitiesHash(activities) {
        // Simple hash for cache key
        return activities.length + '_' + (activities[0]?.timestamp || '') + '_' + (activities[activities.length - 1]?.timestamp || '');
    },

    getFromCache(key) {
        const cached = this.analysisCache.get(key);
        if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
            return cached.data;
        }
        return null;
    },

    saveToCache(key, data) {
        this.analysisCache.set(key, {
            data,
            timestamp: Date.now()
        });
    },

    // ===== ANALYSIS IMPLEMENTATIONS (OPTIMIZED) =====

    performUserAnalysis(activities) {
        const userStats = new Map();
        const ipStats = new Map();

        activities.forEach(activity => {
            const username = activity.username || 'Анонимен';
            const ip = activity.ipAddress || 'Неизвестен';

            // User statistics
            if (!userStats.has(username)) {
                userStats.set(username, {
                    username,
                    totalActivities: 0,
                    actions: new Set(),
                    ips: new Set(),
                    firstActivity: activity.timestamp,
                    lastActivity: activity.timestamp,
                    hourlyDistribution: new Array(24).fill(0)
                });
            }

            const stats = userStats.get(username);
            stats.totalActivities++;
            stats.actions.add(activity.action);
            stats.ips.add(ip);

            const hour = new Date(activity.timestamp).getHours();
            if (hour >= 0 && hour < 24) {
                stats.hourlyDistribution[hour]++;
            }

            if (new Date(activity.timestamp) < new Date(stats.firstActivity)) {
                stats.firstActivity = activity.timestamp;
            }
            if (new Date(activity.timestamp) > new Date(stats.lastActivity)) {
                stats.lastActivity = activity.timestamp;
            }

            // IP statistics
            ipStats.set(ip, (ipStats.get(ip) || 0) + 1);
        });

        // Convert Maps to arrays and process
        const processedUserStats = Array.from(userStats.values()).map(stats => ({
            ...stats,
            uniqueActions: stats.actions.size,
            uniqueIPs: stats.ips.size,
            actions: Array.from(stats.actions),
            ips: Array.from(stats.ips)
        })).sort((a, b) => b.totalActivities - a.totalActivities);

        const processedIpStats = Array.from(ipStats.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 20);

        return {
            userStats: processedUserStats,
            ipStats: processedIpStats,
            totalUsers: userStats.size,
            totalIPs: ipStats.size
        };
    },

    performSecurityAnalysis(activities) {
        const suspiciousPatterns = [];
        const adminActions = [];
        const failedAttempts = [];
        const ipViolations = new Map();

        activities.forEach(activity => {
            // Admin actions
            if (activity.action && activity.action.includes('ADMIN')) {
                adminActions.push(activity);
            }

            // Failed attempts
            if (activity.action && (activity.action.includes('FAIL') || activity.action.includes('ERROR'))) {
                failedAttempts.push(activity);
            }

            // IP violations
            const ip = activity.ipAddress;
            if (ip && ip !== 'N/A') {
                ipViolations.set(ip, (ipViolations.get(ip) || 0) + 1);
            }
        });

        // Find suspicious IPs
        for (const [ip, count] of ipViolations.entries()) {
            if (count > 100) {
                suspiciousPatterns.push({
                    type: 'high_activity_ip',
                    severity: count > 500 ? 'high' : 'medium',
                    message: `IP ${ip} има ${count} активности`,
                    ip,
                    count
                });
            }
        }

        // Find rapid successive actions
        const sortedActivities = activities.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        for (let i = 1; i < Math.min(sortedActivities.length, 1000); i++) { // Limit for performance
            const prev = sortedActivities[i - 1];
            const curr = sortedActivities[i];

            if (prev.username === curr.username && prev.ipAddress === curr.ipAddress) {
                const timeDiff = new Date(curr.timestamp) - new Date(prev.timestamp);
                if (timeDiff < 1000 && timeDiff > 0) {
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
            }).slice(0, 50), // Limit results
            adminActions: adminActions.slice(0, 20),
            failedAttempts: failedAttempts.slice(0, 20),
            totalSuspicious: suspiciousPatterns.length,
            riskLevel: this.calculateRiskLevel(suspiciousPatterns)
        };
    },

    performPerformanceAnalysis(activities) {
        const hourlyLoad = new Array(24).fill(0);
        const actionLoad = new Map();
        const timeWindows = this.groupByTimeWindows(activities, 15);

        activities.forEach(activity => {
            const hour = new Date(activity.timestamp).getHours();
            if (hour >= 0 && hour < 24) {
                hourlyLoad[hour]++;
            }

            const action = activity.action || 'UNKNOWN';
            actionLoad.set(action, (actionLoad.get(action) || 0) + 1);
        });

        const peakHour = hourlyLoad.indexOf(Math.max(...hourlyLoad));
        const avgLoad = activities.length / 24;

        return {
            hourlyLoad,
            actionLoad: Array.from(actionLoad.entries())
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10),
            timeWindows: timeWindows.slice(-20),
            peakHour,
            avgLoad: Math.round(avgLoad * 100) / 100,
            totalActivities: activities.length,
            loadTrend: this.calculateLoadTrend(hourlyLoad)
        };
    },

    // ===== RENDERING METHODS (SAFE) =====

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
                            <h3>${analysis.totalUsers > 0 ? Math.round(analysis.userStats.reduce((sum, u) => sum + u.totalActivities, 0) / analysis.totalUsers) : 0}</h3>
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
                                            <td><strong>${this.escapeHtml(user.username)}</strong></td>
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
                                            <td><code>${this.escapeHtml(ip)}</code></td>
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
                                    <strong>${pattern.type.toUpperCase()}:</strong> ${this.escapeHtml(pattern.message)}
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
                                            <td><strong>${this.escapeHtml(action.username || 'N/A')}</strong></td>
                                            <td><code>${this.escapeHtml(action.action)}</code></td>
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
                                            <td><code>${this.escapeHtml(attempt.ipAddress || 'N/A')}</code></td>
                                            <td><span class="badge bg-danger">${this.escapeHtml(attempt.action)}</span></td>
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
            const percent = analysis.totalActivities > 0 ? Math.round((count / analysis.totalActivities) * 100) : 0;
            return `
                                            <tr>
                                                <td><code>${this.escapeHtml(action)}</code></td>
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

    // ===== EXPORT METHODS (IMPROVED) =====

    async exportAsExcel() {
        const activities = this.getActivities();
        if (!activities.length) {
            this.showError('Няма данни за експорт');
            return;
        }

        this.showInfo('Excel експорт ще бъде имплементиран в следваща версия. Използвайте CSV експорт от основното меню.');
    },

    async exportAsPDF() {
        const activities = this.getActivities();
        if (!activities.length) {
            this.showError('Няма данни за експорт');
            return;
        }

        try {
            this.generatePDFReport(activities);
        } catch (error) {
            console.error('❌ PDF export error:', error);
            this.showError('Грешка при генериране на PDF отчета');
        }
    },

    async exportAsXML() {
        const activities = this.getActivities();
        if (!activities.length) {
            this.showError('Няма данни за експорт');
            return;
        }

        try {
            const xmlContent = this.generateXML(activities);

            if (window.ActivityWallUtils) {
                const success = window.ActivityWallUtils.downloadAsFile(
                    xmlContent,
                    `activity-export-${new Date().toISOString().split('T')[0]}.xml`,
                    'application/xml'
                );

                if (success) {
                    this.showSuccess('XML файлът е изтеглен успешно');
                } else {
                    this.showError('Грешка при изтегляне на XML файла');
                }
            }
        } catch (error) {
            console.error('❌ XML export error:', error);
            this.showError('Грешка при генериране на XML файла');
        }
    },

    generatePDFReport(activities) {
        const userAnalysis = this.performUserAnalysis(activities);
        const securityAnalysis = this.performSecurityAnalysis(activities);
        const performanceAnalysis = this.performPerformanceAnalysis(activities);

        const reportContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Отчет за активностите - SmolyanVote</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                    h1 { text-align: center; color: #333; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .stat { background: #f8f9fa; padding: 10px; margin: 10px 0; border-left: 4px solid #007bff; }
                </style>
            </head>
            <body>
                <h1>Отчет за активностите</h1>
                <p style="text-align: center; color: #666;">Генериран на ${new Date().toLocaleDateString('bg-BG')}</p>
                
                <h2>Обобщение</h2>
                <div class="stat">Общо активности: ${activities.length}</div>
                <div class="stat">Уникални потребители: ${userAnalysis.totalUsers}</div>
                <div class="stat">Уникални IP адреси: ${userAnalysis.totalIPs}</div>
                <div class="stat">Ниво на риск: ${securityAnalysis.riskLevel}</div>

                <h2>Най-активни потребители</h2>
                <table>
                    <tr><th>Потребител</th><th>Активности</th><th>Уникални IP</th></tr>
                    ${userAnalysis.userStats.slice(0, 10).map(user => `
                        <tr>
                            <td>${this.escapeHtml(user.username)}</td>
                            <td>${user.totalActivities}</td>
                            <td>${user.uniqueIPs}</td>
                        </tr>
                    `).join('')}
                </table>

                <h2>Анализ на сигурността</h2>
                <p>Открити са ${securityAnalysis.totalSuspicious} подозрителни модела.</p>
                
                <h2>Производителност</h2>
                <div class="stat">Пиков час: ${performanceAnalysis.peakHour}:00</div>
                <div class="stat">Средно активности на час: ${performanceAnalysis.avgLoad}</div>
            </body>
            </html>
        `;

        // Open in new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(reportContent);
            printWindow.document.close();
            printWindow.print();
            this.showSuccess('PDF отчетът е генериран');
        } else {
            this.showError('Грешка - попъп блокер възпрепятства отварянето на отчета');
        }
    },

    generateXML(activities) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<activityReport>\n';
        xml += `  <metadata>\n`;
        xml += `    <exportDate>${new Date().toISOString()}</exportDate>\n`;
        xml += `    <totalRecords>${activities.length}</totalRecords>\n`;
        xml += `    <generator>SmolyanVote Activity Wall</generator>\n`;
        xml += `  </metadata>\n`;
        xml += `  <activities>\n`;

        activities.forEach(activity => {
            xml += '    <activity>\n';
            xml += `      <id>${activity.id}</id>\n`;
            xml += `      <timestamp>${activity.timestamp}</timestamp>\n`;
            xml += `      <username><![CDATA[${activity.username || ''}]]></username>\n`;
            xml += `      <action><![CDATA[${activity.action || ''}]]></action>\n`;
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

    // ===== OTHER METHODS =====

    async showCharts() {
        if (window.ActivityWallCharts) {
            const activities = this.getActivities();
            await window.ActivityWallCharts.showCharts(activities);
        } else {
            this.showError('Графиките не са достъпни');
        }
    },

    async generateReport() {
        const activities = this.getActivities();
        if (!activities.length) {
            this.showError('Няма данни за отчет');
            return;
        }

        try {
            this.showAnalysisLoading('Генериране на пълен отчет');

            const [userAnalysis, securityAnalysis, performanceAnalysis] = await Promise.all([
                this.runAnalysisWithTimeout(this.performUserAnalysis.bind(this), activities, 5000),
                this.runAnalysisWithTimeout(this.performSecurityAnalysis.bind(this), activities, 5000),
                this.runAnalysisWithTimeout(this.performPerformanceAnalysis.bind(this), activities, 5000)
            ]);

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
        } catch (error) {
            console.error('❌ Error generating report:', error);
            this.showError('Грешка при генериране на отчета');
        }
    },

    async refreshCurrentAnalysis() {
        const panel = document.getElementById('analysis-panel');
        if (!panel || panel.style.display === 'none') {
            this.showInfo('Няма отворен анализ за обновяване');
            return;
        }

        // Clear cache and regenerate
        this.analysisCache.clear();

        // Determine which analysis to refresh based on title
        const titleElement = document.getElementById('analysis-title');
        const title = titleElement?.textContent || '';

        if (title.includes('потребителите')) {
            await this.showUserAnalysis();
        } else if (title.includes('сигурността')) {
            await this.showSecurityAnalysis();
        } else if (title.includes('производителността')) {
            await this.showPerformanceAnalysis();
        } else if (title.includes('Пълен отчет')) {
            await this.generateReport();
        } else {
            this.showInfo('Не можах да определя типа анализ за обновяване');
        }
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
            titleElement.innerHTML = `<i class="bi bi-bar-chart me-2"></i>${this.escapeHtml(title)}`;
        }

        if (contentElement) {
            contentElement.innerHTML = content;
        }

        if (panel) {
            panel.style.display = 'block';
            panel.scrollIntoView({ behavior: 'smooth' });
        }
    },

    showAnalysisLoading(title) {
        const titleElement = document.getElementById('analysis-title');
        const contentElement = document.getElementById('analysis-content');

        if (titleElement) {
            titleElement.innerHTML = `<i class="bi bi-bar-chart me-2"></i>${this.escapeHtml(title)}`;
        }

        if (contentElement) {
            contentElement.innerHTML = `
                <div class="text-center p-5">
                    <div class="spinner-border text-primary me-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <span>Изпълнява се анализ...</span>
                </div>
            `;
        }

        const panel = document.getElementById('analysis-panel');
        if (panel) {
            panel.style.display = 'block';
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

        try {
            const userAnalysis = this.performUserAnalysis(activities);
            const securityAnalysis = this.performSecurityAnalysis(activities);
            const performanceAnalysis = this.performPerformanceAnalysis(activities);

            // Update stat cards safely
            this.updateStatElement('total-activities-stat', activities.length);
            this.updateStatElement('unique-users-stat', userAnalysis.totalUsers);
            this.updateStatElement('avg-per-hour-stat', Math.round(performanceAnalysis.avgLoad));
            this.updateStatElement('security-alerts-stat', securityAnalysis.totalSuspicious);
        } catch (error) {
            console.error('❌ Error updating stats:', error);
        }
    },

    updateStatElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    },

    calculateRiskLevel(suspiciousPatterns) {
        const highSeverity = suspiciousPatterns.filter(p => p.severity === 'high').length;
        const mediumSeverity = suspiciousPatterns.filter(p => p.severity === 'medium').length;

        if (highSeverity > 0) return 'high';
        if (mediumSeverity > 2) return 'medium';
        return 'low';
    },

    calculateLoadTrend(hourlyLoad) {
        if (hourlyLoad.length < 12) return 'stable';

        const recent = hourlyLoad.slice(-6);
        const previous = hourlyLoad.slice(-12, -6);

        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;

        const change = previousAvg > 0 ? (recentAvg - previousAvg) / previousAvg : 0;

        if (change > 0.2) return 'increasing';
        if (change < -0.2) return 'decreasing';
        return 'stable';
    },

    groupByTimeWindows(activities, minutes) {
        const windows = new Map();
        const windowMs = minutes * 60 * 1000;

        activities.forEach(activity => {
            const timestamp = new Date(activity.timestamp).getTime();
            const windowStart = Math.floor(timestamp / windowMs) * windowMs;
            const windowKey = new Date(windowStart).toISOString();

            if (!windows.has(windowKey)) {
                windows.set(windowKey, { timestamp: windowKey, count: 0 });
            }
            windows.get(windowKey).count++;
        });

        return Array.from(windows.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    },

    escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return String(unsafe);

        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    showSuccess(message) {
        if (window.ActivityWallUtils) {
            window.ActivityWallUtils.showToast(message, 'success');
        } else {
            console.log(`✅ ${message}`);
        }
    },

    showError(message) {
        if (window.ActivityWallUtils) {
            window.ActivityWallUtils.showToast(message, 'error');
        } else {
            console.error(`❌ ${message}`);
        }
    },

    showInfo(message) {
        if (window.ActivityWallUtils) {
            window.ActivityWallUtils.showToast(message, 'info');
        } else {
            console.log(`ℹ️ ${message}`);
        }
    },

    // ===== INTEGRATION METHODS =====

    onFiltersChanged(filteredActivities) {
        this.updateStats(filteredActivities);
        this.analysisCache.clear();
    },

    integrateWithActivityWall() {
        if (window.activityWallInstance) {
            const activities = window.activityWallInstance.filteredActivities || [];
            this.updateStats(activities);
            console.log('✅ Activity Wall Advanced: Integrated with Activity Wall');
        }
    },

    // ===== CLEANUP =====

    destroy() {
        console.log('🧹 Destroying Activity Wall Advanced...');

        // Cancel any running analysis
        if (this.currentAnalysisRequest) {
            this.currentAnalysisRequest.cancelled = true;
        }

        // Clear cache
        this.analysisCache.clear();

        // Reset state
        this.isInitialized = false;
        this.updateCallbacks = [];
        this.currentAnalysisRequest = null;

        console.log('✅ Activity Wall Advanced destroyed');
    }
};

// ===== CSS STYLES (IMPROVED) =====
const advancedStyles = `
    .analysis-stat {
        text-align: center;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #dee2e6;
        transition: transform 0.2s ease;
    }
    
    .analysis-stat:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
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
        transition: transform 0.2s ease;
    }
    
    .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
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
        gap: 2px;
    }
    
    .hour-bar {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
    }
    
    .bar {
        width: 100%;
        background: linear-gradient(to top, #007bff, #66b3ff);
        border-radius: 2px 2px 0 0;
        min-height: 2px;
        transition: all 0.3s ease;
    }
    
    .hour-bar:hover .bar {
        background: linear-gradient(to top, #0056b3, #4da6ff);
        transform: scaleY(1.1);
    }
    
    .hour-label {
        font-size: 0.7rem;
        margin-top: 0.25rem;
        color: #6c757d;
        font-weight: 500;
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
    
    .analysis-results {
        animation: fadeIn 0.3s ease-in;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .alert-list .alert {
        margin-bottom: 0.5rem;
        border-radius: 6px;
    }
    
    .comprehensive-report {
        max-width: 100%;
        overflow-x: auto;
    }
    
    .table-responsive {
        border-radius: 6px;
        overflow: hidden;
    }
    
    .progress {
        border-radius: 10px;
        overflow: hidden;
    }
    
    .progress-bar {
        transition: width 0.6s ease;
    }
`;

// Add styles if not already added
if (!document.getElementById('activity-advanced-styles')) {
    const advancedStyleSheet = document.createElement('style');
    advancedStyleSheet.id = 'activity-advanced-styles';
    advancedStyleSheet.textContent = advancedStyles;
    document.head.appendChild(advancedStyleSheet);
}

// ===== AUTO INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await window.ActivityWallAdvanced.init();
    } catch (error) {
        console.error('❌ Failed to initialize Activity Wall Advanced:', error);
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    window.ActivityWallAdvanced.destroy();
});

// Export for global access
window.ActivityWallAdvanced = window.ActivityWallAdvanced;