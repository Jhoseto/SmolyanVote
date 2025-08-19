// ====== ADMIN ACTIVITY WALL - CHARTS & GRAPHS (FIXED) ======
// Файл: src/main/resources/static/js/admin/activityWall/activity-wall-charts.js

window.ActivityWallCharts = {

    // ===== CHART INSTANCES =====
    charts: {
        hourly: null,
        actions: null,
        users: null,
        timeline: null,
        mainTimeline: null,
        heatmap: null
    },

    // ===== STATE MANAGEMENT =====
    isInitialized: false,
    isChartJSLoaded: false,
    chartJSPromise: null,
    pendingUpdates: [],

    // ===== CHART CONFIGURATION =====
    defaultConfig: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 300 // Намалено за по-добра производителност
        },
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true
                }
            },
            y: {
                display: true,
                title: {
                    display: true
                },
                beginAtZero: true
            }
        }
    },

    // ===== INITIALIZATION (IMPROVED) =====

    async init() {
        if (this.isInitialized) return;

        try {
            console.log('🚀 Initializing Activity Wall Charts...');

            this.createChartsContainer();
            await this.loadChartJS();
            this.bindChartEvents();
            this.isInitialized = true;

            // Process any pending updates
            if (this.pendingUpdates.length > 0) {
                const latestUpdate = this.pendingUpdates[this.pendingUpdates.length - 1];
                this.updateAllCharts(latestUpdate);
                this.pendingUpdates = [];
            }

            console.log('✅ Activity Wall Charts: Initialized successfully');
        } catch (error) {
            console.error('❌ Activity Wall Charts initialization failed:', error);
        }
    },

    async loadChartJS() {
        // Проверка дали Chart.js вече е зареден
        if (typeof Chart !== 'undefined') {
            this.isChartJSLoaded = true;
            this.setupChartDefaults();
            return Promise.resolve();
        }

        // Ако вече се зарежда, изчакваме
        if (this.chartJSPromise) {
            return this.chartJSPromise;
        }

        // Създаваме promise за зареждането
        this.chartJSPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
            script.async = true;

            script.onload = () => {
                this.isChartJSLoaded = true;
                this.setupChartDefaults();
                console.log('✅ Chart.js loaded successfully');
                resolve();
            };

            script.onerror = () => {
                console.error('❌ Failed to load Chart.js');
                reject(new Error('Failed to load Chart.js'));
            };

            document.head.appendChild(script);
        });

        return this.chartJSPromise;
    },

    setupChartDefaults() {
        if (typeof Chart === 'undefined') return;

        Chart.register(ChartDataLabels);
        Chart.defaults.font.family = '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        Chart.defaults.font.size = 12;
        Chart.defaults.color = '#666';

        // Глобални настройки за производителност
        Chart.defaults.animation.duration = 300;
        Chart.defaults.plugins.legend.display = true;
    },

    createChartsContainer() {
        const existingContainer = document.getElementById('activity-charts-container');
        if (existingContainer) return;

        const chartsContainer = document.createElement('div');
        chartsContainer.id = 'activity-charts-container';
        chartsContainer.className = 'activity-charts-container mt-4';
        chartsContainer.style.display = 'none';
        chartsContainer.innerHTML = this.getChartsHTML();

        const activityWall = document.getElementById('activity-wall');
        if (activityWall) {
            activityWall.appendChild(chartsContainer);
        }
    },

    getChartsHTML() {
        return `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0">
                        <i class="bi bi-graph-up me-2"></i>
                        Графики и анализи <small class="text-muted">(отражение на филтрираните данни)</small>
                    </h5>
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-outline-secondary" id="charts-toggle-btn">
                            <i class="bi bi-eye-slash"></i> Скрий
                        </button>
                        <button type="button" class="btn btn-outline-primary" id="charts-refresh-btn">
                            <i class="bi bi-arrow-clockwise"></i> Обнови
                        </button>
                    </div>
                </div>
                <div class="card-body" id="charts-body">
                    <div class="row">
                        <!-- Hourly Activity Chart -->
                        <div class="col-md-6 mb-4">
                            <div class="chart-card">
                                <h6 class="chart-title">
                                    <i class="bi bi-clock me-2"></i>Активности по часове
                                </h6>
                                <div class="chart-container" style="height: 300px;">
                                    <canvas id="hourly-activity-chart"></canvas>
                                </div>
                            </div>
                        </div>

                        <!-- Actions Distribution Chart -->
                        <div class="col-md-6 mb-4">
                            <div class="chart-card">
                                <h6 class="chart-title">
                                    <i class="bi bi-pie-chart me-2"></i>Разпределение по действия
                                </h6>
                                <div class="chart-container" style="height: 300px;">
                                    <canvas id="actions-distribution-chart"></canvas>
                                </div>
                            </div>
                        </div>

                        <!-- User Activity Chart -->
                        <div class="col-md-6 mb-4">
                            <div class="chart-card">
                                <h6 class="chart-title">
                                    <i class="bi bi-people me-2"></i>Най-активни потребители
                                </h6>
                                <div class="chart-container" style="height: 300px;">
                                    <canvas id="user-activity-chart"></canvas>
                                </div>
                            </div>
                        </div>

                        <!-- Timeline Chart -->
                        <div class="col-md-6 mb-4">
                            <div class="chart-card">
                                <h6 class="chart-title">
                                    <i class="bi bi-graph-up-arrow me-2"></i>Хронология на активностите
                                </h6>
                                <div class="chart-container" style="height: 300px;">
                                    <canvas id="timeline-chart"></canvas>
                                </div>
                            </div>
                        </div>

                        <!-- Heat Map -->
                        <div class="col-12 mb-4">
                            <div class="chart-card">
                                <h6 class="chart-title">
                                    <i class="bi bi-grid-3x3-gap me-2"></i>Топлинна карта на активностите
                                </h6>
                                <div class="chart-container" style="height: 200px;">
                                    <div id="activity-heatmap"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    bindChartEvents() {
        // Toggle Button
        const toggleBtn = document.getElementById('charts-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleChartsVisibility());
        }

        // Refresh Button
        const refreshBtn = document.getElementById('charts-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshAllCharts());
        }
    },

    // ===== MAIN UPDATE FUNCTION (IMPROVED) =====

    async updateAllCharts(filteredActivities) {
        if (!this.isChartJSLoaded || !this.isInitialized) {
            this.pendingUpdates.push(filteredActivities);
            return;
        }

        try {
            console.log('🔄 Updating charts with data:', filteredActivities.length, 'filtered activities');

            const container = document.getElementById('activity-charts-container');
            if (!container || container.style.display === 'none') {
                return;
            }

            // ✅ ДОЛНИТЕ графики = ФИЛТРИРАНИ активности
            await Promise.all([
                this.createHourlyActivityChart(filteredActivities),
                this.createActionsDistributionChart(filteredActivities),
                this.createUserActivityChart(filteredActivities),
                this.createTimelineChart(filteredActivities),
                this.createActivityHeatmap(filteredActivities)
            ]);

            console.log('✅ Charts updated successfully');

            if (window.ActivityWallUtils) {
                window.ActivityWallUtils.showToast('Графиките са обновени успешно', 'success');
            }
        } catch (error) {
            console.error('❌ Error updating charts:', error);
            this.showError('Грешка при обновяване на графиките');
        }
    },

    async safeChartUpdate(updateFunction) {
        try {
            await updateFunction();
        } catch (error) {
            console.error('❌ Chart update error:', error);
        }
    },

    // ===== CHART CREATION METHODS (IMPROVED) =====

    createMainTimelineChart(allActivities) {
        return new Promise((resolve) => {
            const ctx = document.getElementById('activity-timeline-chart');
            if (!ctx) {
                resolve();
                return;
            }

            // ✅ ЗАЩИТА срещу undefined
            if (!allActivities || !Array.isArray(allActivities)) {
                console.warn('⚠️ No activities data for main timeline chart');
                resolve();
                return;
            }

            // Групиране по часове от ВСИЧКИ данни
            const hourlyData = this.groupActivitiesByHour(allActivities);

            this.destroyChart('mainTimeline');

            try {
                this.charts.mainTimeline = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: hourlyData.labels,
                        datasets: [{
                            label: 'Всички активности',
                            data: hourlyData.data,
                            borderColor: 'rgba(54, 162, 235, 1)',
                            backgroundColor: 'rgba(54, 162, 235, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.3,
                            pointRadius: 3,
                            pointHoverRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: { duration: 300 },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                mode: 'index',
                                intersect: false,
                                callbacks: {
                                    title: function(tooltipItems) {
                                        return 'Час: ' + tooltipItems[0].label;
                                    },
                                    label: function(context) {
                                        return 'Общо активности: ' + context.parsed.y;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                display: true,
                                grid: { color: 'rgba(0,0,0,0.05)' }
                            },
                            y: {
                                display: true,
                                beginAtZero: true,
                                grid: { color: 'rgba(0,0,0,0.05)' }
                            }
                        }
                    }
                });

                resolve();
            } catch (error) {
                console.error('❌ Error creating main timeline chart:', error);
                resolve();
            }
        });
    },

    createHourlyActivityChart(filteredActivities) {
        return new Promise((resolve) => {
            const ctx = document.getElementById('hourly-activity-chart');
            if (!ctx) {
                resolve();
                return;
            }

            const hourlyData = this.groupActivitiesByHour(filteredActivities);
            this.destroyChart('hourly');

            try {
                this.charts.hourly = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: hourlyData.labels,
                        datasets: [{
                            label: 'Активности',
                            data: hourlyData.data,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.1
                        }]
                    },
                    options: {
                        ...this.defaultConfig,
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Час от денонощието'
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Брой активности'
                                },
                                beginAtZero: true
                            }
                        }
                    }
                });

                resolve();
            } catch (error) {
                console.error('❌ Error creating hourly chart:', error);
                resolve();
            }
        });
    },

    createActionsDistributionChart(filteredActivities) {
        return new Promise((resolve) => {
            const ctx = document.getElementById('actions-distribution-chart');
            if (!ctx) {
                resolve();
                return;
            }

            const actionsData = this.groupActivitiesByAction(filteredActivities);
            this.destroyChart('actions');

            try {
                // ✅ ПРОСТ ГЕНЕРАТОР НА ЦВЕТОВЕ
                const colors = this.generateSimpleColors(actionsData.labels.length);

                this.charts.actions = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: actionsData.labels,
                        datasets: [{
                            data: actionsData.data,
                            backgroundColor: colors,
                            borderWidth: 2,
                            borderColor: '#fff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: { duration: 300 },
                        plugins: {
                            legend: { position: 'bottom' },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const label = context.label || '';
                                        const value = context.parsed;
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = ((value / total) * 100).toFixed(1);

                                        // ✅ ПОКАЗВАМЕ ПРОЦЕНТИ В TOOLTIP
                                        return `${label}: ${value} активности (${percentage}%)`;
                                    }
                                }
                            },
                            // ✅ ПОКАЗВАМЕ ПРОЦЕНТИ ВЪРХУ ГРАФИКАТА
                            datalabels: {
                                color: '#fff',
                                font: {
                                    weight: 'bold',
                                    size: 12
                                },
                                formatter: function(value, context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);

                                    // Показваме процент само ако е над 3%
                                    return percentage > 3 ? percentage + '%' : '';
                                }
                            }
                        }
                    }
                });

                resolve();
            } catch (error) {
                console.error('❌ Error creating actions chart:', error);
                resolve();
            }
        });
    },

// ✅ МНОГО ПРОСТ ЦВЕТЕН ГЕНЕРАТОР
    generateSimpleColors(count) {
        const colors = [];

        for (let i = 0; i < count; i++) {
            // Прост алгоритъм: различен hue за всеки цвят
            const hue = (i * 360 / count) % 360;
            colors.push(`hsl(${hue}, 70%, 60%)`);
        }

        return colors;
    },

    createUserActivityChart(filteredActivities) {
        return new Promise((resolve) => {
            const ctx = document.getElementById('user-activity-chart');
            if (!ctx) {
                resolve();
                return;
            }

            const userData = this.groupActivitiesByUser(filteredActivities);
            this.destroyChart('users');

            try {
                this.charts.users = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: userData.labels,
                        datasets: [{
                            label: 'Активности',
                            data: userData.data,
                            backgroundColor: 'rgba(54, 162, 235, 0.8)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        ...this.defaultConfig,
                        indexAxis: 'y',
                        animation: { duration: 300 },
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Брой активности'
                                },
                                beginAtZero: true
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Потребители'
                                }
                            }
                        }
                    }
                });

                resolve();
            } catch (error) {
                console.error('❌ Error creating users chart:', error);
                resolve();
            }
        });
    },


    createTimelineChart(filteredActivities) {
        return new Promise((resolve) => {
            const ctx = document.getElementById('timeline-chart');
            if (!ctx) {
                resolve();
                return;
            }

            const timelineData = this.groupActivitiesByTimeline(filteredActivities);
            this.destroyChart('timeline');

            try {
                this.charts.timeline = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: timelineData.labels,
                        datasets: [{
                            label: 'Активности за периода',
                            data: timelineData.data,
                            borderColor: 'rgb(255, 99, 132)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.1
                        }]
                    },
                    options: {
                        ...this.defaultConfig,
                        animation: { duration: 300 },
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Време'
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Брой активности'
                                },
                                beginAtZero: true
                            }
                        }
                    }
                });

                resolve();
            } catch (error) {
                console.error('❌ Error creating timeline chart:', error);
                resolve();
            }
        });
    },

    createActivityHeatmap(filteredActivities) {
        return new Promise((resolve) => {
            const heatmapContainer = document.getElementById('activity-heatmap');
            if (!heatmapContainer) {
                resolve();
                return;
            }

            try {
                const heatmapData = this.groupActivitiesForHeatmap(filteredActivities);
                heatmapContainer.innerHTML = this.generateHeatmapHTML(heatmapData);
                resolve();
            } catch (error) {
                console.error('❌ Error creating heatmap:', error);
                heatmapContainer.innerHTML = '<div class="text-center text-muted">Грешка при зареждане на топлинната карта</div>';
                resolve();
            }
        });
    },

    // ===== DATA GROUPING METHODS (OPTIMIZED) =====
    groupActivitiesByHour(filteredActivities) {
        const hourCounts = new Array(24).fill(0);

        // ✅ ЗАЩИТА срещу undefined/null
        if (!filteredActivities || !Array.isArray(filteredActivities)) {
            console.warn('⚠️ Invalid activities data passed to groupActivitiesByHour');
            return {
                labels: Array.from({length: 24}, (_, i) => i + ':00'),
                data: hourCounts
            };
        }

        filteredActivities.forEach(activity => {
            if (activity && activity.timestamp) {
                const hour = new Date(activity.timestamp).getHours();
                if (hour >= 0 && hour < 24) {
                    hourCounts[hour]++;
                }
            }
        });

        return {
            labels: Array.from({length: 24}, (_, i) => i + ':00'),
            data: hourCounts
        };
    },

    groupActivitiesByAction(filteredActivities) {
        const actionCounts = {};

        filteredActivities.forEach(activity => {
            const action = activity.action || 'Неизвестно';

            // ✅ ПРОВЕРКА дали Utils е зареден + fallback
            let translatedAction = action;
            if (window.ActivityWallUtils && window.ActivityWallUtils.translateAction) {
                translatedAction = window.ActivityWallUtils.translateAction(action);
            }

            actionCounts[translatedAction] = (actionCounts[translatedAction] || 0) + 1;
        });

        // ✅ ПОКАЗВАМЕ ВСИЧКИ действия
        const sortedActions = Object.entries(actionCounts)
            .sort(([,a], [,b]) => b - a);

        return {
            labels: sortedActions.map(([action]) => action),
            data: sortedActions.map(([, count]) => count)
        };
    },

    groupActivitiesByUser(filteredActivities) {
        const userCounts = {};

        filteredActivities.forEach(activity => {
            const username = activity.username || 'Анонимен';
            userCounts[username] = (userCounts[username] || 0) + 1;
        });

        const sortedUsers = Object.entries(userCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        return {
            labels: sortedUsers.map(([username]) => username),
            data: sortedUsers.map(([, count]) => count)
        };
    },

    groupActivitiesByTimeline(filteredActivities) {
        if (filteredActivities.length === 0) {
            return { labels: [], data: [] };
        }

        const dailyCounts = {};

        filteredActivities.forEach(activity => {
            if (activity.timestamp) {
                const date = new Date(activity.timestamp).toISOString().split('T')[0];
                dailyCounts[date] = (dailyCounts[date] || 0) + 1;
            }
        });

        const sortedDates = Object.keys(dailyCounts).sort();

        return {
            labels: sortedDates,
            data: sortedDates.map(date => dailyCounts[date])
        };
    },

    groupActivitiesForHeatmap(filteredActivities) {
        const heatmapData = {};

        // Initialize data (7 days x 24 hours)
        for (let day = 0; day < 7; day++) {
            heatmapData[day] = new Array(24).fill(0);
        }

        filteredActivities.forEach(activity => {
            if (activity.timestamp) {
                const date = new Date(activity.timestamp);
                const dayOfWeek = date.getDay();
                const hour = date.getHours();

                if (dayOfWeek >= 0 && dayOfWeek < 7 && hour >= 0 && hour < 24) {
                    heatmapData[dayOfWeek][hour]++;
                }
            }
        });

        return heatmapData;
    },

    generateHeatmapHTML(heatmapData) {
        const days = ['Нед', 'Пон', 'Вт', 'Ср', 'Чет', 'Пет', 'Съб'];
        const maxValue = Math.max(...Object.values(heatmapData).flat());

        if (maxValue === 0) {
            return '<div class="text-center text-muted p-3">Няма данни за топлинна карта</div>';
        }

        let html = '<div class="heatmap-container">';

        // Header row
        html += '<div class="heatmap-header">';
        html += '<div class="heatmap-corner"></div>';
        for (let hour = 0; hour < 24; hour += 2) {
            html += `<div class="heatmap-hour">${hour}</div>`;
        }
        html += '</div>';

        // Data rows
        Object.keys(heatmapData).forEach(dayIndex => {
            html += '<div class="heatmap-row">';
            html += `<div class="heatmap-day">${days[dayIndex]}</div>`;

            heatmapData[dayIndex].forEach((value, hour) => {
                if (hour % 2 === 0) {
                    const intensity = maxValue > 0 ? value / maxValue : 0;
                    const opacity = Math.max(0.1, intensity);
                    html += `<div class="heatmap-cell" 
                                style="background-color: rgba(54, 162, 235, ${opacity});"
                                title="${days[dayIndex]} ${hour}:00 - ${value} активности">
                                ${value > 0 ? value : ''}
                             </div>`;
                }
            });

            html += '</div>';
        });

        html += '</div>';
        return html;
    },

    // ===== CONTROL METHODS (IMPROVED) =====

    async showCharts(filteredActivities) {
        const container = document.getElementById('activity-charts-container');
        if (container) {
            container.style.display = 'block';
        }

        this.updateToggleButton(true);

        // Изчакваме инициализацията, след това обновяваме
        if (!this.isInitialized) {
            await this.init();
        }

        setTimeout(() => {
            this.updateAllCharts(filteredActivities);
        }, 100);
    },

    hideCharts() {
        const container = document.getElementById('activity-charts-container');
        if (container) {
            container.style.display = 'none';
        }
        this.updateToggleButton(false);
    },

    async toggleChartsVisibility() {
        const container = document.getElementById('activity-charts-container');
        if (!container) return;

        const isVisible = container.style.display !== 'none';

        if (isVisible) {
            this.hideCharts();
        } else {
            if (window.activityWallInstance && window.activityWallInstance.filteredActivities) {
                await this.showCharts(window.activityWallInstance.filteredActivities);
            } else {
                this.showError('Няма данни за показване');
            }
        }
    },

    async refreshAllCharts() {
        if (!window.activityWallInstance || !window.activityWallInstance.filteredActivities) {
            this.showError('Няма данни за обновяване');
            return;
        }

        const filteredActivities = window.activityWallInstance.filteredActivities;
        this.showChartsLoading();

        try {
            await this.updateAllCharts(filteredActivities);

            if (window.ActivityWallUtils) {
                window.ActivityWallUtils.showToast('Графиките са обновени успешно', 'success');
            }
        } catch (error) {
            console.error('❌ Error refreshing charts:', error);
            this.showError('Грешка при обновяване на графиките');
        }
    },

    // ===== INTEGRATION METHODS =====

    async onFiltersChanged(filteredActivities) {

        const container = document.getElementById('activity-charts-container');
        if (container && container.style.display !== 'none') {
            // ✅ Обновяваме само долните графики с филтрираните данни
            // Горната остава с всички данни
            await Promise.all([
                this.createHourlyActivityChart(filteredActivities),
                this.createActionsDistributionChart(filteredActivities),
                this.createUserActivityChart(filteredActivities),
                this.createTimelineChart(filteredActivities),
                this.createActivityHeatmap(filteredActivities)
            ]);
        }
    },

    // ===== UTILITY METHODS (IMPROVED) =====

    destroyChart(chartName) {
        try {
            if (this.charts[chartName]) {
                this.charts[chartName].destroy();
                this.charts[chartName] = null;
            }
        } catch (error) {
            console.error(`❌ Error destroying chart ${chartName}:`, error);
            this.charts[chartName] = null;
        }
    },

    updateToggleButton(isVisible) {
        const toggleBtn = document.getElementById('charts-toggle-btn');
        if (toggleBtn) {
            if (isVisible) {
                toggleBtn.innerHTML = '<i class="bi bi-eye-slash"></i> Скрий';
            } else {
                toggleBtn.innerHTML = '<i class="bi bi-eye"></i> Покажи';
            }
        }
    },

    showChartsLoading() {
        const chartsBody = document.getElementById('charts-body');
        if (chartsBody) {
            chartsBody.innerHTML = `
                <div class="text-center p-5">
                    <div class="spinner-border text-primary me-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <span>Обновяване на графиките...</span>
                </div>
            `;
        }
    },

    showNoDataMessage() {
        const chartsBody = document.getElementById('charts-body');
        if (chartsBody) {
            chartsBody.innerHTML = `
                <div class="text-center p-5">
                    <i class="bi bi-bar-chart text-muted" style="font-size: 3rem;"></i>
                    <h5 class="mt-3 text-muted">Няма данни за показване</h5>
                    <p class="text-muted">Графиките ще се появят когато има филтрирани активности</p>
                </div>
            `;
        }
    },

    showError(message) {
        if (window.ActivityWallUtils) {
            window.ActivityWallUtils.showToast(message, 'error');
        } else {
            console.error('Charts Error:', message);
        }
    },

    // ===== CLEANUP =====

    destroy() {
        console.log('🧹 Destroying Activity Wall Charts...');

        // Destroy all chart instances
        Object.keys(this.charts).forEach(chartName => {
            this.destroyChart(chartName);
        });

        // Clear state
        this.isInitialized = false;
        this.isChartJSLoaded = false;
        this.chartJSPromise = null;
        this.pendingUpdates = [];

        console.log('✅ Activity Wall Charts destroyed');
    }
};

// ===== CSS STYLES FOR HEATMAP (IMPROVED) =====
const heatmapStyles = `
    .heatmap-container {
        display: inline-block;
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
        background: #fff;
    }
    
    .heatmap-header, .heatmap-row {
        display: flex;
        align-items: center;
    }
    
    .heatmap-corner, .heatmap-day {
        width: 40px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        background-color: #f8f9fa;
        border-right: 1px solid #ddd;
    }
    
    .heatmap-hour, .heatmap-cell {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        border-right: 1px solid #eee;
        border-bottom: 1px solid #eee;
    }
    
    .heatmap-hour {
        background-color: #f8f9fa;
        font-weight: bold;
    }
    
    .heatmap-cell {
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
    }
    
    .heatmap-cell:hover {
        border: 2px solid #007bff;
        z-index: 10;
        transform: scale(1.1);
    }
    
    .chart-card {
        height: 100%;
        background: #fff;
        border-radius: 8px;
        padding: 1rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .chart-title {
        color: #495057;
        font-size: 0.9rem;
        margin-bottom: 1rem;
        font-weight: 600;
    }
    
    .chart-container {
        position: relative;
    }
    
    .activity-charts-container {
        transition: all 0.3s ease;
    }
`;

// Add styles if not already added
if (!document.getElementById('activity-charts-styles')) {
    const chartsStyleSheet = document.createElement('style');
    chartsStyleSheet.id = 'activity-charts-styles';
    chartsStyleSheet.textContent = heatmapStyles;
    document.head.appendChild(chartsStyleSheet);
}

// ===== AUTO INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await window.ActivityWallCharts.init();
    } catch (error) {
        console.error('❌ Failed to initialize Activity Wall Charts:', error);
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    window.ActivityWallCharts.destroy();
});

// Export for global access
window.ActivityWallCharts = window.ActivityWallCharts;