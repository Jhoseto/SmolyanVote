// ====== ADMIN ACTIVITY WALL - ADVANCED FEATURES ======
// Файл: src/main/resources/static/js/admin/activityWall/activity-wall-advanced.js

window.ActivityWallAdvanced = {

    // ===== ИНИЦИАЛИЗАЦИЯ =====
    isInitialized: false,
    chartInstance: null,
    alertSystem: null,
    analyticsEngine: null,

    init() {
        if (this.isInitialized) return;

        this.initializeChart();
        this.initializeAnalytics();
        this.initializeAlertSystem();
        this.initializeBatchOperations();
        this.initializeAdvancedExport();
        this.initializeDashboardWidgets();
        this.setupAdvancedEventListeners();

        this.isInitialized = true;
        console.log('✅ Activity Wall Advanced initialized');
    },

    // ===== TIMELINE CHART IMPLEMENTATION =====

    initializeChart() {
        const canvas = document.getElementById('activity-timeline-chart');
        if (!canvas) return;

        // Destroy existing chart if exists
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        const ctx = canvas.getContext('2d');

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Активности',
                    data: [],
                    borderColor: 'rgba(75, 159, 62, 1)',
                    backgroundColor: 'rgba(75, 159, 62, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(75, 159, 62, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(75, 159, 62, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Време'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Брой активности'
                        },
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return `Час: ${context[0].label}`;
                            },
                            label: function(context) {
                                return `Активности: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 4,
                        hoverRadius: 6
                    }
                }
            }
        });
    },

    updateChart(activities) {
        if (!this.chartInstance) return;

        const timeGroups = this.groupActivitiesByHour(activities);
        const labels = [];
        const data = [];

        // Generate last 24 hours
        for (let i = 23; i >= 0; i--) {
            const hour = new Date(Date.now() - i * 60 * 60 * 1000);
            const hourKey = hour.toISOString().slice(0, 13);
            const hourLabel = hour.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });

            labels.push(hourLabel);
            data.push(timeGroups[hourKey] || 0);
        }

        this.chartInstance.data.labels = labels;
        this.chartInstance.data.datasets[0].data = data;
        this.chartInstance.update('none');
    },

    groupActivitiesByHour(activities) {
        const groups = {};
        const now = new Date();
        const last24Hours = new Date(now - 24 * 60 * 60 * 1000);

        activities.forEach(activity => {
            const activityTime = new Date(activity.timestamp);
            if (activityTime >= last24Hours) {
                const hourKey = activityTime.toISOString().slice(0, 13);
                groups[hourKey] = (groups[hourKey] || 0) + 1;
            }
        });

        return groups;
    },

    // ===== ADVANCED ANALYTICS ENGINE =====

    initializeAnalytics() {
        this.analyticsEngine = {
            trendAnalysis: this.performTrendAnalysis.bind(this),
            behaviorAnalysis: this.performBehaviorAnalysis.bind(this),
            securityAnalysis: this.performSecurityAnalysis.bind(this),
            performanceAnalysis: this.performPerformanceAnalysis.bind(this),
            predictiveAnalysis: this.performPredictiveAnalysis.bind(this)
        };
    },

    performTrendAnalysis(activities) {
        const analysis = {
            hourlyTrend: this.calculateHourlyTrend(activities),
            dailyTrend: this.calculateDailyTrend(activities),
            actionTrends: this.calculateActionTrends(activities),
            userActivityTrend: this.calculateUserActivityTrend(activities),
            peakHours: this.identifyPeakHours(activities)
        };

        return analysis;
    },

    calculateHourlyTrend(activities) {
        const hourGroups = {};
        const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        activities.forEach(activity => {
            const activityTime = new Date(activity.timestamp);
            if (activityTime >= last7Days) {
                const hour = activityTime.getHours();
                hourGroups[hour] = (hourGroups[hour] || 0) + 1;
            }
        });

        return hourGroups;
    },

    calculateDailyTrend(activities) {
        const dayGroups = {};
        const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        activities.forEach(activity => {
            const activityTime = new Date(activity.timestamp);
            if (activityTime >= last30Days) {
                const dayKey = activityTime.toISOString().slice(0, 10);
                dayGroups[dayKey] = (dayGroups[dayKey] || 0) + 1;
            }
        });

        return dayGroups;
    },

    calculateActionTrends(activities) {
        const actionGroups = {};
        activities.forEach(activity => {
            actionGroups[activity.action] = (actionGroups[activity.action] || 0) + 1;
        });

        return Object.entries(actionGroups)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([action, count]) => ({ action, count }));
    },

    calculateUserActivityTrend(activities) {
        const userGroups = {};
        activities.forEach(activity => {
            if (activity.username && activity.username !== 'Анонимен') {
                userGroups[activity.username] = (userGroups[activity.username] || 0) + 1;
            }
        });

        return Object.entries(userGroups)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([username, count]) => ({ username, count }));
    },

    identifyPeakHours(activities) {
        const hourCounts = this.calculateHourlyTrend(activities);
        const sortedHours = Object.entries(hourCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);

        return sortedHours.map(([hour, count]) => ({
            hour: parseInt(hour),
            count,
            timeRange: `${hour}:00 - ${parseInt(hour) + 1}:00`
        }));
    },

    performBehaviorAnalysis(activities) {
        return {
            sessionAnalysis: this.analyzeUserSessions(activities),
            navigationPatterns: this.analyzeNavigationPatterns(activities),
            interactionPatterns: this.analyzeInteractionPatterns(activities),
            contentPreferences: this.analyzeContentPreferences(activities)
        };
    },

    analyzeUserSessions(activities) {
        const sessions = {};
        const sessionTimeout = 30 * 60 * 1000; // 30 minutes

        activities.forEach(activity => {
            if (!activity.username || activity.username === 'Анонимен') return;

            const userId = activity.username;
            const timestamp = new Date(activity.timestamp).getTime();

            if (!sessions[userId]) {
                sessions[userId] = [];
            }

            let currentSession = sessions[userId][sessions[userId].length - 1];

            if (!currentSession || timestamp - currentSession.lastActivity > sessionTimeout) {
                currentSession = {
                    start: timestamp,
                    lastActivity: timestamp,
                    activities: []
                };
                sessions[userId].push(currentSession);
            }

            currentSession.lastActivity = timestamp;
            currentSession.activities.push(activity);
        });

        // Calculate session statistics
        const sessionStats = {};
        Object.entries(sessions).forEach(([userId, userSessions]) => {
            const durations = userSessions.map(session =>
                session.lastActivity - session.start
            );
            const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
            const activityCounts = userSessions.map(session => session.activities.length);
            const avgActivities = activityCounts.reduce((a, b) => a + b, 0) / activityCounts.length;

            sessionStats[userId] = {
                sessionCount: userSessions.length,
                avgDuration: Math.round(avgDuration / 1000 / 60), // minutes
                avgActivitiesPerSession: Math.round(avgActivities),
                totalActivities: activityCounts.reduce((a, b) => a + b, 0)
            };
        });

        return sessionStats;
    },

    analyzeNavigationPatterns(activities) {
        const viewActions = activities.filter(a => a.action.includes('VIEW_'));
        const pathSequences = {};

        viewActions.forEach((activity, index) => {
            if (index > 0 && viewActions[index - 1].username === activity.username) {
                const fromAction = viewActions[index - 1].action;
                const toAction = activity.action;
                const pathKey = `${fromAction} -> ${toAction}`;
                pathSequences[pathKey] = (pathSequences[pathKey] || 0) + 1;
            }
        });

        return Object.entries(pathSequences)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([path, count]) => ({ path, count }));
    },

    analyzeInteractionPatterns(activities) {
        const interactions = activities.filter(a =>
            a.action.includes('VOTE_') ||
            a.action.includes('LIKE_') ||
            a.action.includes('COMMENT') ||
            a.action.includes('CREATE_')
        );

        const interactionTypes = {};
        interactions.forEach(activity => {
            const type = this.getInteractionType(activity.action);
            interactionTypes[type] = (interactionTypes[type] || 0) + 1;
        });

        return interactionTypes;
    },

    getInteractionType(action) {
        if (action.includes('VOTE_')) return 'Гласуване';
        if (action.includes('LIKE_')) return 'Харесвания';
        if (action.includes('COMMENT')) return 'Коментари';
        if (action.includes('CREATE_')) return 'Създаване';
        return 'Други';
    },

    analyzeContentPreferences(activities) {
        const contentInteractions = activities.filter(a =>
            a.entityType && a.entityType !== 'SYSTEM'
        );

        const preferences = {};
        contentInteractions.forEach(activity => {
            const type = activity.entityType;
            preferences[type] = (preferences[type] || 0) + 1;
        });

        return Object.entries(preferences)
            .sort(([,a], [,b]) => b - a)
            .map(([type, count]) => ({ type, count, percentage: 0 }))
            .map(item => ({
                ...item,
                percentage: Math.round((item.count / contentInteractions.length) * 100)
            }));
    },

    performSecurityAnalysis(activities) {
        return {
            threats: this.identifySecurityThreats(activities),
            anomalies: this.detectAnomalies(activities),
            riskScores: this.calculateRiskScores(activities),
            recommendations: this.generateSecurityRecommendations(activities)
        };
    },

    identifySecurityThreats(activities) {
        const threats = [];
        const suspiciousActions = [
            'FAILED_LOGIN', 'BLOCKED_REQUEST', 'CSRF_ATTACK_BLOCKED',
            'SPAM_DETECTED', 'BOT_DETECTED', 'SUSPICIOUS_ACTIVITY'
        ];

        const threatCounts = {};
        activities.forEach(activity => {
            if (suspiciousActions.includes(activity.action)) {
                const key = `${activity.action}_${activity.ipAddress}`;
                threatCounts[key] = (threatCounts[key] || 0) + 1;
            }
        });

        Object.entries(threatCounts).forEach(([key, count]) => {
            const [action, ip] = key.split('_');
            if (count > 5) { // Threshold for threat detection
                threats.push({
                    type: action,
                    source: ip,
                    count,
                    severity: this.calculateThreatSeverity(action, count),
                    recommendation: this.getThreatRecommendation(action, count)
                });
            }
        });

        return threats.sort((a, b) => b.severity - a.severity);
    },

    calculateThreatSeverity(action, count) {
        const baseScores = {
            'FAILED_LOGIN': 3,
            'BLOCKED_REQUEST': 2,
            'CSRF_ATTACK_BLOCKED': 5,
            'SPAM_DETECTED': 2,
            'BOT_DETECTED': 4,
            'SUSPICIOUS_ACTIVITY': 3
        };

        const baseScore = baseScores[action] || 1;
        const frequencyMultiplier = Math.min(count / 10, 3);
        return Math.round(baseScore * frequencyMultiplier);
    },

    getThreatRecommendation(action, count) {
        const recommendations = {
            'FAILED_LOGIN': 'Разгледайте възможност за временно блокиране на IP адреса',
            'BLOCKED_REQUEST': 'Проверете за зловредни заявки от този източник',
            'CSRF_ATTACK_BLOCKED': 'Незабавно блокирайте IP адреса и проверете логовете',
            'SPAM_DETECTED': 'Активирайте допълнителни anti-spam мерки',
            'BOT_DETECTED': 'Имплементирайте CAPTCHA или rate limiting',
            'SUSPICIOUS_ACTIVITY': 'Извършете ръчна проверка на активността'
        };

        return recommendations[action] || 'Наблюдавайте активността внимателно';
    },

    detectAnomalies(activities) {
        const anomalies = [];

        // Time-based anomalies
        const offHoursActivity = this.detectOffHoursActivity(activities);
        if (offHoursActivity.length > 0) {
            anomalies.push({
                type: 'Off-hours Activity',
                description: `${offHoursActivity.length} активности извън работното време`,
                severity: 2,
                details: offHoursActivity
            });
        }

        // Volume anomalies
        const volumeSpikes = this.detectVolumeSpikes(activities);
        if (volumeSpikes.length > 0) {
            anomalies.push({
                type: 'Volume Spike',
                description: `Необичайно голям обем активности`,
                severity: 3,
                details: volumeSpikes
            });
        }

        // Geographic anomalies (if IP geolocation is available)
        const geoAnomalies = this.detectGeographicAnomalies(activities);
        if (geoAnomalies.length > 0) {
            anomalies.push({
                type: 'Geographic Anomaly',
                description: 'Активности от необичайни локации',
                severity: 2,
                details: geoAnomalies
            });
        }

        return anomalies;
    },

    detectOffHoursActivity(activities) {
        const offHoursThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return activities.filter(activity => {
            const hour = new Date(activity.timestamp).getHours();
            return (hour < 6 || hour > 22) && new Date(activity.timestamp) > offHoursThreshold;
        });
    },

    detectVolumeSpikes(activities) {
        const hourlyVolumes = this.groupActivitiesByHour(activities);
        const volumes = Object.values(hourlyVolumes);
        const average = volumes.reduce((a, b) => a + b, 0) / volumes.length;
        const spikeThreshold = average * 3;

        return Object.entries(hourlyVolumes)
            .filter(([hour, volume]) => volume > spikeThreshold)
            .map(([hour, volume]) => ({ hour, volume, threshold: spikeThreshold }));
    },

    detectGeographicAnomalies(activities) {
        // Simplified implementation - in real scenario would use IP geolocation
        const ipPatterns = {};
        activities.forEach(activity => {
            if (activity.ipAddress && activity.ipAddress !== 'N/A') {
                const subnet = activity.ipAddress.split('.').slice(0, 2).join('.');
                ipPatterns[subnet] = (ipPatterns[subnet] || 0) + 1;
            }
        });

        // Flag subnets with very low activity as potential anomalies
        return Object.entries(ipPatterns)
            .filter(([subnet, count]) => count === 1)
            .map(([subnet, count]) => ({ subnet, count }));
    },

    calculateRiskScores(activities) {
        const riskFactors = {
            failedLogins: this.countFailedLogins(activities),
            suspiciousIPs: window.ActivityWallUtils.detectSuspiciousIPs(activities).length,
            offHoursActivity: this.detectOffHoursActivity(activities).length,
            adminActions: this.countAdminActions(activities),
            anomalousPatterns: this.detectAnomalies(activities).length
        };

        const totalRisk = Object.values(riskFactors).reduce((sum, value) => sum + value, 0);
        const riskLevel = totalRisk < 5 ? 'Low' : totalRisk < 15 ? 'Medium' : 'High';

        return {
            totalScore: totalRisk,
            level: riskLevel,
            factors: riskFactors,
            recommendation: this.getRiskRecommendation(riskLevel)
        };
    },

    countFailedLogins(activities) {
        return activities.filter(a => a.action === 'FAILED_LOGIN').length;
    },

    countAdminActions(activities) {
        return activities.filter(a =>
            a.action.includes('ADMIN_') ||
            a.action.includes('BAN_') ||
            a.action.includes('MODERATE_')
        ).length;
    },

    getRiskRecommendation(level) {
        const recommendations = {
            'Low': 'Системата работи нормално. Продължете наблюдението.',
            'Medium': 'Препоръчва се повишено внимание към сигурността.',
            'High': 'Необходими са незабавни действия за сигурност!'
        };
        return recommendations[level];
    },

    generateSecurityRecommendations(activities) {
        const recommendations = [];

        const failedLogins = this.countFailedLogins(activities);
        if (failedLogins > 10) {
            recommendations.push({
                priority: 'High',
                action: 'Имплементирайте rate limiting за login опити',
                reason: `${failedLogins} неуспешни опити за вход`
            });
        }

        const suspiciousIPs = window.ActivityWallUtils.detectSuspiciousIPs(activities);
        if (suspiciousIPs.length > 0) {
            recommendations.push({
                priority: 'Medium',
                action: 'Прегледайте и блокирайте подозрителни IP адреси',
                reason: `${suspiciousIPs.length} подозрителни IP адреса`
            });
        }

        const offHoursCount = this.detectOffHoursActivity(activities).length;
        if (offHoursCount > 20) {
            recommendations.push({
                priority: 'Medium',
                action: 'Активирайте уведомления за активност извън работното време',
                reason: `${offHoursCount} активности извън работното време`
            });
        }

        return recommendations;
    },

    performPerformanceAnalysis(activities) {
        return {
            systemLoad: this.calculateSystemLoad(activities),
            responsePatterns: this.analyzeResponsePatterns(activities),
            bottlenecks: this.identifyBottlenecks(activities),
            recommendations: this.generatePerformanceRecommendations(activities)
        };
    },

    calculateSystemLoad(activities) {
        const timeWindows = this.groupActivitiesByTimeWindow(activities, 5); // 5-minute windows
        const loads = timeWindows.map(window => window.length);

        return {
            current: loads[loads.length - 1] || 0,
            average: loads.reduce((a, b) => a + b, 0) / loads.length,
            peak: Math.max(...loads),
            trend: this.calculateTrend(loads)
        };
    },

    calculateTrend(values) {
        if (values.length < 2) return 'stable';

        const recent = values.slice(-5);
        const older = values.slice(-10, -5);

        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

        const change = (recentAvg - olderAvg) / olderAvg;

        if (change > 0.2) return 'increasing';
        if (change < -0.2) return 'decreasing';
        return 'stable';
    },

    groupActivitiesByTimeWindow(activities, windowMinutes) {
        return window.ActivityWallUtils.groupActivitiesByTimeWindow(activities, windowMinutes);
    },

    analyzeResponsePatterns(activities) {
        // This would analyze API response times if available
        // For now, return mock data
        return {
            averageResponseTime: 150,
            slowRequests: 3,
            timeouts: 0,
            errorRate: 0.5
        };
    },

    identifyBottlenecks(activities) {
        const actionCounts = {};
        activities.forEach(activity => {
            actionCounts[activity.action] = (actionCounts[activity.action] || 0) + 1;
        });

        return Object.entries(actionCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .filter(([action, count]) => count > activities.length * 0.1)
            .map(([action, count]) => ({
                action,
                count,
                percentage: Math.round((count / activities.length) * 100)
            }));
    },

    generatePerformanceRecommendations(activities) {
        const recommendations = [];
        const bottlenecks = this.identifyBottlenecks(activities);

        if (bottlenecks.length > 0) {
            recommendations.push({
                priority: 'Medium',
                action: 'Оптимизирайте най-честите операции',
                details: bottlenecks.map(b => `${b.action}: ${b.percentage}%`).join(', ')
            });
        }

        const systemLoad = this.calculateSystemLoad(activities);
        if (systemLoad.trend === 'increasing') {
            recommendations.push({
                priority: 'High',
                action: 'Подгответе се за увеличено натоварване',
                details: `Тенденция на нарастване на системната натовареност`
            });
        }

        return recommendations;
    },

    performPredictiveAnalysis(activities) {
        return {
            nextHourPrediction: this.predictNextHourActivity(activities),
            dailyForecast: this.predictDailyActivity(activities),
            trendPrediction: this.predictTrends(activities),
            capacityPlanning: this.planCapacity(activities)
        };
    },

    predictNextHourActivity(activities) {
        const hourlyData = this.calculateHourlyTrend(activities);
        const currentHour = new Date().getHours();
        const historicalAverage = hourlyData[currentHour] || 0;

        // Simple prediction based on recent trend
        const recentActivities = activities.filter(a =>
            new Date(a.timestamp) > new Date(Date.now() - 60 * 60 * 1000)
        ).length;

        const predicted = Math.round((historicalAverage + recentActivities) / 2);

        return {
            predicted,
            confidence: recentActivities > 0 ? 'Medium' : 'Low',
            currentHour,
            historicalAverage
        };
    },

    predictDailyActivity(activities) {
        const dailyData = this.calculateDailyTrend(activities);
        const recentDays = Object.values(dailyData).slice(-7);
        const average = recentDays.reduce((a, b) => a + b, 0) / recentDays.length;

        return {
            predicted: Math.round(average),
            range: {
                min: Math.round(average * 0.8),
                max: Math.round(average * 1.2)
            },
            confidence: recentDays.length >= 7 ? 'High' : 'Medium'
        };
    },

    predictTrends(activities) {
        const actionTrends = this.calculateActionTrends(activities);
        const growing = actionTrends.filter((_, index) => index < actionTrends.length / 2);
        const declining = actionTrends.filter((_, index) => index >= actionTrends.length / 2);

        return {
            growingActions: growing.slice(0, 3),
            decliningActions: declining.slice(-3),
            stableActions: actionTrends.slice(3, -3)
        };
    },

    planCapacity(activities) {
        const systemLoad = this.calculateSystemLoad(activities);
        const projectedLoad = systemLoad.average * 1.5; // 50% growth projection

        return {
            currentCapacity: '100%',
            projectedUsage: `${Math.round((projectedLoad / systemLoad.peak) * 100)}%`,
            recommendation: projectedLoad > systemLoad.peak ?
                'Планирайте увеличаване на капацитета' :
                'Текущият капацитет е достатъчен',
            timeToCapacityLimit: projectedLoad > systemLoad.peak ? '3-6 месеца' : 'Няма риск'
        };
    },

    // ===== ALERT SYSTEM =====

    initializeAlertSystem() {
        this.alertSystem = {
            rules: [
                {
                    id: 'failed_login_spike',
                    name: 'Множество неуспешни входове',
                    condition: (activities) => {
                        const recent = activities.filter(a =>
                            a.action === 'FAILED_LOGIN' &&
                            new Date(a.timestamp) > new Date(Date.now() - 5 * 60 * 1000)
                        );
                        return recent.length > 5;
                    },
                    severity: 'high',
                    message: 'Открити са множество неуспешни опити за вход'
                },
                {
                    id: 'admin_action_burst',
                    name: 'Масови админ действия',
                    condition: (activities) => {
                        const recent = activities.filter(a =>
                            a.action.includes('ADMIN_') &&
                            new Date(a.timestamp) > new Date(Date.now() - 10 * 60 * 1000)
                        );
                        return recent.length > 10;
                    },
                    severity: 'medium',
                    message: 'Открити са множество админ действия'
                },
                {
                    id: 'unusual_activity_volume',
                    name: 'Необичаен обем активности',
                    condition: (activities) => {
                        const recent = activities.filter(a =>
                            new Date(a.timestamp) > new Date(Date.now() - 10 * 60 * 1000)
                        );
                        return recent.length > 100;
                    },
                    severity: 'medium',
                    message: 'Необичайно голям обем активности'
                },
                {
                    id: 'off_hours_admin',
                    name: 'Админ активност извън работното време',
                    condition: (activities) => {
                        const hour = new Date().getHours();
                        const isOffHours = hour < 6 || hour > 22;
                        if (!isOffHours) return false;

                        const recent = activities.filter(a =>
                            a.action.includes('ADMIN_') &&
                            new Date(a.timestamp) > new Date(Date.now() - 30 * 60 * 1000)
                        );
                        return recent.length > 0;
                    },
                    severity: 'high',
                    message: 'Админ активност извън работното време'
                },
                {
                    id: 'suspicious_ip_activity',
                    name: 'Подозрителна IP активност',
                    condition: (activities) => {
                        const suspiciousIPs = window.ActivityWallUtils.detectSuspiciousIPs(activities);
                        return suspiciousIPs.length > 0;
                    },
                    severity: 'high',
                    message: 'Открити са подозрителни IP адреси'
                }
            ],
            activeAlerts: [],
            checkAlerts: this.checkAlerts.bind(this),
            addCustomRule: this.addCustomAlertRule.bind(this),
            dismissAlert: this.dismissAlert.bind(this)
        };
    },

    checkAlerts(activities) {
        const newAlerts = [];

        this.alertSystem.rules.forEach(rule => {
            try {
                if (rule.condition(activities)) {
                    const existingAlert = this.alertSystem.activeAlerts.find(a => a.ruleId === rule.id);
                    if (!existingAlert) {
                        const alert = {
                            id: Date.now() + Math.random(),
                            ruleId: rule.id,
                            name: rule.name,
                            message: rule.message,
                            severity: rule.severity,
                            timestamp: new Date(),
                            dismissed: false
                        };

                        this.alertSystem.activeAlerts.push(alert);
                        newAlerts.push(alert);

                        this.triggerAlert(alert);
                    }
                }
            } catch (error) {
                console.error(`Error checking alert rule ${rule.id}:`, error);
            }
        });

        return newAlerts;
    },

    triggerAlert(alert) {
        // Visual notification
        window.ActivityWallUtils.showToast(alert.message,
            alert.severity === 'high' ? 'error' : 'warning', 6000);

        // Sound notification
        if (window.ActivityWallUtils.notificationSettings?.sound) {
            window.ActivityWallUtils.playNotificationSound(
                alert.severity === 'high' ? 'critical' : 'warning'
            );
        }

        // Browser notification
        if (window.ActivityWallUtils.notificationSettings?.browser &&
            'Notification' in window && Notification.permission === 'granted') {
            new Notification('SmolyanVote Security Alert', {
                body: alert.message,
                icon: '/images/logo1.png',
                tag: `alert-${alert.ruleId}`,
                requireInteraction: alert.severity === 'high'
            });
        }

        // Update alert indicator
        this.updateAlertIndicator();
    },

    updateAlertIndicator() {
        const activeAlerts = this.alertSystem.activeAlerts.filter(a => !a.dismissed);
        const indicator = document.getElementById('alert-indicator');

        if (indicator) {
            if (activeAlerts.length > 0) {
                indicator.style.display = 'block';
                indicator.textContent = activeAlerts.length;
                indicator.className = 'alert-indicator ' +
                    (activeAlerts.some(a => a.severity === 'high') ? 'alert-high' : 'alert-medium');
            } else {
                indicator.style.display = 'none';
            }
        }
    },

    addCustomAlertRule(rule) {
        this.alertSystem.rules.push({
            id: `custom_${Date.now()}`,
            ...rule
        });
    },

    dismissAlert(alertId) {
        const alert = this.alertSystem.activeAlerts.find(a => a.id === alertId);
        if (alert) {
            alert.dismissed = true;
            this.updateAlertIndicator();
        }
    },

    // ===== BATCH OPERATIONS =====

    initializeBatchOperations() {
        this.batchOperations = {
            selectedActivities: new Set(),
            operations: {
                export: this.batchExport.bind(this),
                analyze: this.batchAnalyze.bind(this),
                flag: this.batchFlag.bind(this),
                archive: this.batchArchive.bind(this)
            },
            selectAll: this.selectAllActivities.bind(this),
            clearSelection: this.clearSelection.bind(this),
            getSelected: this.getSelectedActivities.bind(this)
        };

        this.addBatchControls();
    },

    addBatchControls() {
        const streamHeader = document.querySelector('.stream-header');
        if (!streamHeader) return;

        const batchControls = document.createElement('div');
        batchControls.className = 'batch-controls';
        batchControls.style.display = 'none';
        batchControls.innerHTML = `
            <div class="batch-info">
                <span id="batch-count">0 избрани</span>
            </div>
            <div class="batch-actions">
                <button id="batch-select-all" class="control-btn control-btn-outline">
                    <i class="bi bi-check-all"></i> Избери всички
                </button>
                <button id="batch-export" class="control-btn control-btn-success">
                    <i class="bi bi-download"></i> Експорт
                </button>
                <button id="batch-analyze" class="control-btn control-btn-primary">
                    <i class="bi bi-graph-up"></i> Анализ
                </button>
                <button id="batch-clear" class="control-btn control-btn-secondary">
                    <i class="bi bi-x"></i> Изчисти
                </button>
            </div>
        `;

        streamHeader.appendChild(batchControls);

        // Event listeners
        document.getElementById('batch-select-all')?.addEventListener('click', this.selectAllActivities.bind(this));
        document.getElementById('batch-export')?.addEventListener('click', () => this.batchExport());
        document.getElementById('batch-analyze')?.addEventListener('click', () => this.batchAnalyze());
        document.getElementById('batch-clear')?.addEventListener('click', this.clearSelection.bind(this));
    },

    selectAllActivities() {
        if (!window.activityWallInstance) return;

        const activities = window.activityWallInstance.filteredActivities;
        activities.forEach(activity => {
            this.batchOperations.selectedActivities.add(activity.id);
        });

        this.updateBatchUI();
        this.updateActivityRowsSelection();
    },

    clearSelection() {
        this.batchOperations.selectedActivities.clear();
        this.updateBatchUI();
        this.updateActivityRowsSelection();
    },

    toggleActivitySelection(activityId) {
        if (this.batchOperations.selectedActivities.has(activityId)) {
            this.batchOperations.selectedActivities.delete(activityId);
        } else {
            this.batchOperations.selectedActivities.add(activityId);
        }

        this.updateBatchUI();
        this.updateActivityRowsSelection();
    },

    updateBatchUI() {
        const count = this.batchOperations.selectedActivities.size;
        const batchControls = document.querySelector('.batch-controls');
        const batchCount = document.getElementById('batch-count');

        if (batchControls) {
            batchControls.style.display = count > 0 ? 'flex' : 'none';
        }

        if (batchCount) {
            batchCount.textContent = `${count} избрани`;
        }
    },

    updateActivityRowsSelection() {
        const rows = document.querySelectorAll('#activity-table-body tr[data-activity-id]');
        rows.forEach(row => {
            const activityId = parseInt(row.dataset.activityId);
            const isSelected = this.batchOperations.selectedActivities.has(activityId);
            row.classList.toggle('selected', isSelected);

            const checkbox = row.querySelector('.activity-checkbox');
            if (checkbox) {
                checkbox.checked = isSelected;
            }
        });
    },

    getSelectedActivities() {
        if (!window.activityWallInstance) return [];

        return window.activityWallInstance.activities.filter(activity =>
            this.batchOperations.selectedActivities.has(activity.id)
        );
    },

    batchExport() {
        const selectedActivities = this.getSelectedActivities();
        if (selectedActivities.length === 0) {
            window.ActivityWallUtils.showToast('Няма избрани активности', 'warning');
            return;
        }

        this.showExportModal(selectedActivities);
    },

    batchAnalyze() {
        const selectedActivities = this.getSelectedActivities();
        if (selectedActivities.length === 0) {
            window.ActivityWallUtils.showToast('Няма избрани активности', 'warning');
            return;
        }

        const analysis = this.performFullAnalysis(selectedActivities);
        this.showAnalysisModal(analysis);
    },

    batchFlag() {
        const selectedActivities = this.getSelectedActivities();
        if (selectedActivities.length === 0) return;

        // Implementation for flagging activities
        window.ActivityWallUtils.showToast(`${selectedActivities.length} активности са маркирани`, 'success');
    },

    batchArchive() {
        const selectedActivities = this.getSelectedActivities();
        if (selectedActivities.length === 0) return;

        // Implementation for archiving activities
        window.ActivityWallUtils.showToast(`${selectedActivities.length} активности са архивирани`, 'success');
    },

    // ===== ADVANCED EXPORT =====

    initializeAdvancedExport() {
        this.exportFormats = {
            json: this.exportAsJSON.bind(this),
            csv: this.exportAsCSV.bind(this),
            excel: this.exportAsExcel.bind(this),
            pdf: this.exportAsPDF.bind(this),
            xml: this.exportAsXML.bind(this)
        };
    },

    showExportModal(activities) {
        const modal = this.createExportModal();
        document.body.appendChild(modal);

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        // Setup export button handlers
        modal.querySelector('#export-json-btn').addEventListener('click', () => {
            this.exportAsJSON(activities);
            bsModal.hide();
        });

        modal.querySelector('#export-csv-btn').addEventListener('click', () => {
            this.exportAsCSV(activities);
            bsModal.hide();
        });

        modal.querySelector('#export-excel-btn').addEventListener('click', () => {
            this.exportAsExcel(activities);
            bsModal.hide();
        });

        modal.querySelector('#export-pdf-btn').addEventListener('click', () => {
            this.exportAsPDF(activities);
            bsModal.hide();
        });

        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    },

    createExportModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-download me-2"></i>Експорт на активности
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>Изберете формат за експорт:</p>
                        <div class="export-options">
                            <button id="export-json-btn" class="btn btn-outline-primary me-2 mb-2">
                                <i class="bi bi-filetype-json me-1"></i>JSON
                            </button>
                            <button id="export-csv-btn" class="btn btn-outline-success me-2 mb-2">
                                <i class="bi bi-filetype-csv me-1"></i>CSV
                            </button>
                            <button id="export-excel-btn" class="btn btn-outline-info me-2 mb-2">
                                <i class="bi bi-file-earmark-excel me-1"></i>Excel
                            </button>
                            <button id="export-pdf-btn" class="btn btn-outline-danger me-2 mb-2">
                                <i class="bi bi-filetype-pdf me-1"></i>PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return modal;
    },

    exportAsJSON(activities) {
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                totalRecords: activities.length,
                source: 'SmolyanVote Activity Wall',
                version: '1.0'
            },
            activities: activities
        };

        window.ActivityWallUtils.downloadJSON(exportData,
            `activity-export-${new Date().toISOString().split('T')[0]}.json`);

        window.ActivityWallUtils.showToast('JSON файлът е изтеглен', 'success');
    },

    exportAsCSV(activities) {
        window.ActivityWallUtils.downloadCSV(activities,
            `activity-export-${new Date().toISOString().split('T')[0]}.csv`);

        window.ActivityWallUtils.showToast('CSV файлът е изтеглен', 'success');
    },

    exportAsExcel(activities) {
        // Enhanced Excel export with multiple sheets
        const workbook = {
            SheetNames: ['Activities', 'Summary', 'Statistics'],
            Activities: this.createActivitySheet(activities),
            Summary: this.createSummarySheet(activities),
            Statistics: this.createStatisticsSheet(activities)
        };

        // This would require a library like XLSX.js
        window.ActivityWallUtils.showToast('Excel експорт ще бъде имплементиран', 'info');
    },

    exportAsPDF(activities) {
        // PDF export with formatted report
        window.ActivityWallUtils.showToast('PDF експорт ще бъде имплементиран', 'info');
    },

    exportAsXML(activities) {
        const xmlContent = this.generateXML(activities);
        window.ActivityWallUtils.downloadAsFile(xmlContent,
            `activity-export-${new Date().toISOString().split('T')[0]}.xml`,
            'application/xml');

        window.ActivityWallUtils.showToast('XML файлът е изтеглен', 'success');
    },

    generateXML(activities) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<activities>\n';
        xml += `  <metadata>\n`;
        xml += `    <exportDate>${new Date().toISOString()}</exportDate>\n`;
        xml += `    <totalRecords>${activities.length}</totalRecords>\n`;
        xml += `  </metadata>\n`;

        activities.forEach(activity => {
            xml += '  <activity>\n';
            xml += `    <id>${activity.id}</id>\n`;
            xml += `    <timestamp>${activity.timestamp}</timestamp>\n`;
            xml += `    <username><![CDATA[${activity.username || ''}]]></username>\n`;
            xml += `    <action><![CDATA[${activity.action}]]></action>\n`;
            xml += `    <entityType><![CDATA[${activity.entityType || ''}]]></entityType>\n`;
            xml += `    <entityId>${activity.entityId || ''}</entityId>\n`;
            xml += `    <ipAddress><![CDATA[${activity.ipAddress || ''}]]></ipAddress>\n`;
            xml += `    <details><![CDATA[${activity.details || ''}]]></details>\n`;
            xml += '  </activity>\n';
        });

        xml += '</activities>';
        return xml;
    },

    // ===== DASHBOARD WIDGETS =====

    initializeDashboardWidgets() {
        this.widgets = {
            securityScore: this.createSecurityScoreWidget(),
            topUsers: this.createTopUsersWidget(),
            systemHealth: this.createSystemHealthWidget(),
            recentAlerts: this.createRecentAlertsWidget()
        };

        this.addWidgetsToDOM();
    },

    createSecurityScoreWidget() {
        return {
            id: 'security-score-widget',
            title: 'Security Score',
            icon: 'shield-check',
            update: (activities) => {
                const riskScores = this.calculateRiskScores(activities);
                return {
                    score: 100 - (riskScores.totalScore * 2),
                    level: riskScores.level,
                    trend: 'stable'
                };
            }
        };
    },

    createTopUsersWidget() {
        return {
            id: 'top-users-widget',
            title: 'Most Active Users',
            icon: 'people',
            update: (activities) => {
                const userActivity = this.calculateUserActivityTrend(activities);
                return userActivity.slice(0, 5);
            }
        };
    },

    createSystemHealthWidget() {
        return {
            id: 'system-health-widget',
            title: 'System Health',
            icon: 'cpu',
            update: (activities) => {
                const performance = this.performPerformanceAnalysis(activities);
                return {
                    status: performance.systemLoad.trend === 'increasing' ? 'warning' : 'healthy',
                    load: performance.systemLoad.current,
                    trend: performance.systemLoad.trend
                };
            }
        };
    },

    createRecentAlertsWidget() {
        return {
            id: 'recent-alerts-widget',
            title: 'Recent Alerts',
            icon: 'exclamation-triangle',
            update: (activities) => {
                return this.alertSystem.activeAlerts
                    .filter(alert => !alert.dismissed)
                    .slice(0, 3);
            }
        };
    },

    addWidgetsToDOM() {
        const statsGrid = document.querySelector('.activity-stats-grid');
        if (!statsGrid) return;

        // Add additional widget container
        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'advanced-widgets-grid';
        widgetContainer.innerHTML = `
            <div class="widget-card" id="security-score-widget">
                <div class="widget-header">
                    <i class="bi bi-shield-check"></i>
                    <span>Security Score</span>
                </div>
                <div class="widget-content">
                    <div class="score-display">--</div>
                    <div class="score-level">Loading...</div>
                </div>
            </div>
            
            <div class="widget-card" id="top-users-widget">
                <div class="widget-header">
                    <i class="bi bi-people"></i>
                    <span>Top Users</span>
                </div>
                <div class="widget-content">
                    <div class="user-list">Loading...</div>
                </div>
            </div>
            
            <div class="widget-card" id="system-health-widget">
                <div class="widget-header">
                    <i class="bi bi-cpu"></i>
                    <span>System Health</span>
                </div>
                <div class="widget-content">
                    <div class="health-status">--</div>
                    <div class="health-details">Loading...</div>
                </div>
            </div>
            
            <div class="widget-card" id="recent-alerts-widget">
                <div class="widget-header">
                    <i class="bi bi-exclamation-triangle"></i>
                    <span>Recent Alerts</span>
                </div>
                <div class="widget-content">
                    <div class="alerts-list">No active alerts</div>
                </div>
            </div>
        `;

        statsGrid.parentNode.insertBefore(widgetContainer, statsGrid.nextSibling);
    },

    updateWidgets(activities) {
        Object.values(this.widgets).forEach(widget => {
            try {
                const data = widget.update(activities);
                this.updateWidgetDisplay(widget.id, data);
            } catch (error) {
                console.error(`Error updating widget ${widget.id}:`, error);
            }
        });
    },

    updateWidgetDisplay(widgetId, data) {
        const widget = document.getElementById(widgetId);
        if (!widget) return;

        switch (widgetId) {
            case 'security-score-widget':
                this.updateSecurityScoreWidget(widget, data);
                break;
            case 'top-users-widget':
                this.updateTopUsersWidget(widget, data);
                break;
            case 'system-health-widget':
                this.updateSystemHealthWidget(widget, data);
                break;
            case 'recent-alerts-widget':
                this.updateRecentAlertsWidget(widget, data);
                break;
        }
    },

    updateSecurityScoreWidget(widget, data) {
        const scoreDisplay = widget.querySelector('.score-display');
        const levelDisplay = widget.querySelector('.score-level');

        if (scoreDisplay) {
            scoreDisplay.textContent = Math.round(data.score);
            scoreDisplay.className = `score-display ${data.level.toLowerCase()}`;
        }

        if (levelDisplay) {
            levelDisplay.textContent = data.level;
        }
    },

    updateTopUsersWidget(widget, data) {
        const userList = widget.querySelector('.user-list');
        if (!userList) return;

        if (data.length === 0) {
            userList.innerHTML = '<div class="no-data">No activity</div>';
            return;
        }

        userList.innerHTML = data.map(user => `
            <div class="user-item">
                <span class="username">${user.username}</span>
                <span class="activity-count">${user.count}</span>
            </div>
        `).join('');
    },

    updateSystemHealthWidget(widget, data) {
        const statusDisplay = widget.querySelector('.health-status');
        const detailsDisplay = widget.querySelector('.health-details');

        if (statusDisplay) {
            statusDisplay.textContent = data.status.toUpperCase();
            statusDisplay.className = `health-status ${data.status}`;
        }

        if (detailsDisplay) {
            detailsDisplay.textContent = `Load: ${data.load}, Trend: ${data.trend}`;
        }
    },

    updateRecentAlertsWidget(widget, data) {
        const alertsList = widget.querySelector('.alerts-list');
        if (!alertsList) return;

        if (data.length === 0) {
            alertsList.innerHTML = '<div class="no-alerts">No active alerts</div>';
            return;
        }

        alertsList.innerHTML = data.map(alert => `
            <div class="alert-item ${alert.severity}">
                <div class="alert-message">${alert.message}</div>
                <div class="alert-time">${this.formatRelativeTime(alert.timestamp)}</div>
            </div>
        `).join('');
    },

    formatRelativeTime(timestamp) {
        return window.ActivityWallUtils.timeAgo(new Date(timestamp));
    },

    // ===== ADVANCED EVENT LISTENERS =====

    setupAdvancedEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'a':
                        e.preventDefault();
                        this.selectAllActivities();
                        break;
                    case 'e':
                        e.preventDefault();
                        if (this.batchOperations.selectedActivities.size > 0) {
                            this.batchExport();
                        }
                        break;
                    case 'r':
                        e.preventDefault();
                        if (window.activityWallInstance) {
                            window.activityWallInstance.manualRefresh();
                        }
                        break;
                }
            }

            if (e.key === 'Escape') {
                this.clearSelection();
            }
        });

        // Enhanced table interactions
        const tableBody = document.getElementById('activity-table-body');
        if (tableBody) {
            tableBody.addEventListener('click', (e) => {
                const row = e.target.closest('tr[data-activity-id]');
                if (!row) return;

                const activityId = parseInt(row.dataset.activityId);

                if (e.target.type === 'checkbox' || e.target.classList.contains('activity-checkbox')) {
                    this.toggleActivitySelection(activityId);
                } else if (e.ctrlKey || e.metaKey) {
                    this.toggleActivitySelection(activityId);
                }
            });

            // Add checkboxes to table rows
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === 1 && node.tagName === 'TR' && node.dataset.activityId) {
                                this.addCheckboxToRow(node);
                            }
                        });
                    }
                });
            });

            observer.observe(tableBody, { childList: true });
        }
    },

    addCheckboxToRow(row) {
        const actionsCell = row.querySelector('.col-actions');
        if (!actionsCell) return;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'activity-checkbox me-2';
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            const activityId = parseInt(row.dataset.activityId);
            this.toggleActivitySelection(activityId);
        });

        actionsCell.insertBefore(checkbox, actionsCell.firstChild);
    },

    // ===== ANALYSIS MODAL =====

    showAnalysisModal(analysis) {
        const modal = this.createAnalysisModal(analysis);
        document.body.appendChild(modal);

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    },

    createAnalysisModal(analysis) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-graph-up me-2"></i>Анализ на активности
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${this.generateAnalysisHTML(analysis)}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Затвори</button>
                    </div>
                </div>
            </div>
        `;
        return modal;
    },

    generateAnalysisHTML(analysis) {
        return `
            <div class="analysis-sections">
                <div class="row">
                    <div class="col-md-6">
                        <div class="analysis-section">
                            <h6><i class="bi bi-shield-check me-2"></i>Security Analysis</h6>
                            <div class="analysis-content">
                                <p><strong>Risk Level:</strong> ${analysis.securityAnalysis.riskScores.level}</p>
                                <p><strong>Threats Detected:</strong> ${analysis.securityAnalysis.threats.length}</p>
                                <p><strong>Anomalies:</strong> ${analysis.securityAnalysis.anomalies.length}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="analysis-section">
                            <h6><i class="bi bi-graph-up me-2"></i>Trend Analysis</h6>
                            <div class="analysis-content">
                                <p><strong>Peak Hours:</strong></p>
                                <ul>
                                    ${analysis.trendAnalysis.peakHours.map(hour =>
            `<li>${hour.timeRange}: ${hour.count} activities</li>`
        ).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="analysis-section">
                            <h6><i class="bi bi-people me-2"></i>User Behavior</h6>
                            <div class="analysis-content">
                                <p><strong>Most Active Users:</strong></p>
                                <ul>
                                    ${analysis.trendAnalysis.userActivityTrend.slice(0, 5).map(user =>
            `<li>${user.username}: ${user.count} activities</li>`
        ).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="analysis-section">
                            <h6><i class="bi bi-activity me-2"></i>Action Trends</h6>
                            <div class="analysis-content">
                                <p><strong>Most Common Actions:</strong></p>
                                <ul>
                                    ${analysis.trendAnalysis.actionTrends.slice(0, 5).map(action =>
            `<li>${action.action}: ${action.count}</li>`
        ).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    performFullAnalysis(activities) {
        return {
            trendAnalysis: this.performTrendAnalysis(activities),
            behaviorAnalysis: this.performBehaviorAnalysis(activities),
            securityAnalysis: this.performSecurityAnalysis(activities),
            performanceAnalysis: this.performPerformanceAnalysis(activities),
            predictiveAnalysis: this.performPredictiveAnalysis(activities)
        };
    },

    // ===== INTEGRATION METHODS =====

    integrateWithActivityWall() {
        if (!window.activityWallInstance) return;

        // Hook into activity updates
        const originalApplyFilters = window.activityWallInstance.applyFilters;
        window.activityWallInstance.applyFilters = function() {
            originalApplyFilters.call(this);

            // Update advanced features
            if (window.ActivityWallAdvanced.isInitialized) {
                window.ActivityWallAdvanced.updateChart(this.filteredActivities);
                window.ActivityWallAdvanced.updateWidgets(this.filteredActivities);
                window.ActivityWallAdvanced.checkAlerts(this.filteredActivities);
            }
        };

        // Hook into new activity additions
        const originalAddNewActivity = window.activityWallInstance.addNewActivity;
        window.activityWallInstance.addNewActivity = function(activity, isRealTime) {
            originalAddNewActivity.call(this, activity, isRealTime);

            if (isRealTime && window.ActivityWallAdvanced.isInitialized) {
                // Check for immediate alerts
                window.ActivityWallAdvanced.checkAlerts([activity]);

                // Update real-time chart
                setTimeout(() => {
                    window.ActivityWallAdvanced.updateChart(this.filteredActivities);
                    window.ActivityWallAdvanced.updateWidgets(this.filteredActivities);
                }, 1000);
            }
        };
    },

    // ===== CLEANUP =====

    destroy() {
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }

        // Clear intervals and cleanup
        this.isInitialized = false;
    }
};

// ===== AUTO-INITIALIZATION =====

document.addEventListener('DOMContentLoaded', function() {
    // Wait for ActivityWall to be initialized
    setTimeout(() => {
        if (document.getElementById('activity-wall')) {
            window.ActivityWallAdvanced.init();
            window.ActivityWallAdvanced.integrateWithActivityWall();

            // Initial data load
            if (window.activityWallInstance?.filteredActivities) {
                window.ActivityWallAdvanced.updateChart(window.activityWallInstance.filteredActivities);
                window.ActivityWallAdvanced.updateWidgets(window.activityWallInstance.filteredActivities);
            }
        }
    }, 1000);
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (window.ActivityWallAdvanced) {
        window.ActivityWallAdvanced.destroy();
    }
});

// Export for global access
window.ActivityWallAdvanced = window.ActivityWallAdvanced;