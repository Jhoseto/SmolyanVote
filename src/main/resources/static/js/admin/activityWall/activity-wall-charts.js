// ====== ADMIN ACTIVITY WALL - CHARTS & GRAPHS ======
// Файл: src/main/resources/static/js/admin/activityWall/activity-wall-charts.js
// 🎯 ГРАФИКАТА Е ОТРАЖЕНИЕ НА ТАБЛИЦАТА - използва this.filteredActivities

window.ActivityWallCharts = {

    // ===== CHART INSTANCES =====
    charts: {
        hourly: null,
        actions: null,
        users: null,
        timeline: null,           // За timeline-chart (в charts секцията)
        mainTimeline: null,       // За activity-timeline-chart (основния)
        heatmap: null
    },

    // ===== CHART CONFIGURATION =====
    defaultConfig: {
        responsive: true,
        maintainAspectRatio: false,
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

    // ===== INITIALIZATION =====

    init() {
        this.createChartsContainer();
        this.loadChartJS();
        console.log('✅ Activity Wall Charts: Initialized - СИНХРОНИЗИРАН с таблицата');
    },

    createChartsContainer() {
        const existingContainer = document.getElementById('activity-charts-container');
        if (existingContainer) return;

        const chartsContainer = document.createElement('div');
        chartsContainer.id = 'activity-charts-container';
        chartsContainer.className = 'activity-charts-container mt-4';
        chartsContainer.style.display = 'none';
        chartsContainer.innerHTML = `
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
                <div class="card-body">
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

        const activityWall = document.getElementById('activity-wall');
        if (activityWall) {
            activityWall.appendChild(chartsContainer);
        }

        this.bindChartEvents();
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

    loadChartJS() {
        // Проверка дали Chart.js е зареден
        if (typeof Chart !== 'undefined') {
            this.setupChartDefaults();
            return;
        }

        // Зареждане на Chart.js от CDN
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
        script.onload = () => {
            this.setupChartDefaults();
            console.log('✅ Chart.js loaded');
        };
        script.onerror = () => {
            console.error('❌ Failed to load Chart.js');
        };
        document.head.appendChild(script);
    },

    setupChartDefaults() {
        if (typeof Chart === 'undefined') return;

        Chart.defaults.font.family = '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        Chart.defaults.font.size = 12;
        Chart.defaults.color = '#666';
    },

    // ===== 🎯 КЛЮЧОВИ МЕТОДИ: ИЗПОЛЗВАТ filteredActivities ОТ ACTIVITY WALL =====

    // 🔥 ГЛАВНА ФУНКЦИЯ: Обновява всички графики с филтрираните данни
    updateAllCharts(filteredActivities) {
        if (!filteredActivities || filteredActivities.length === 0) {
            this.showNoDataMessage();
            return;
        }

        console.log('🔄 Обновяване на графиките с', filteredActivities.length, 'филтрирани активности');

        // Създаване на всички графики с филтрираните данни
        this.createMainTimelineChart(filteredActivities);
        this.createHourlyActivityChart(filteredActivities);
        this.createActionsDistributionChart(filteredActivities);
        this.createUserActivityChart(filteredActivities);
        this.createTimelineChart(filteredActivities);
        this.createActivityHeatmap(filteredActivities);
    },

    // 🔥 ГЛАВНАТА TIMELINE ГРАФИКА (activity-timeline-chart) - използва филтрираните данни
    createMainTimelineChart(filteredActivities) {
        const ctx = document.getElementById('activity-timeline-chart');
        if (!ctx) return null;

        // Групиране по часове от филтрираните данни
        const hourlyData = this.groupActivitiesByHour(filteredActivities);

        this.destroyChart('mainTimeline');

        this.charts.mainTimeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hourlyData.labels,
                datasets: [{
                    label: 'Активности',
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
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            title: function(tooltipItems) {
                                return 'Час: ' + tooltipItems[0].label;
                            },
                            label: function(context) {
                                return 'Активности: ' + context.parsed.y;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: false
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: false
                        },
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    }
                }
            }
        });

        return this.charts.mainTimeline;
    },

    createHourlyActivityChart(filteredActivities) {
        const ctx = document.getElementById('hourly-activity-chart');
        if (!ctx) return null;

        const hourlyData = this.groupActivitiesByHour(filteredActivities);

        this.destroyChart('hourly');

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

        return this.charts.hourly;
    },

    createActionsDistributionChart(filteredActivities) {
        const ctx = document.getElementById('actions-distribution-chart');
        if (!ctx) return null;

        const actionsData = this.groupActivitiesByAction(filteredActivities);

        this.destroyChart('actions');

        this.charts.actions = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: actionsData.labels,
                datasets: [{
                    data: actionsData.data,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 205, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)',
                        'rgba(255, 159, 64, 0.8)',
                        'rgba(199, 199, 199, 0.8)',
                        'rgba(83, 102, 255, 0.8)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        return this.charts.actions;
    },

    createUserActivityChart(filteredActivities) {
        const ctx = document.getElementById('user-activity-chart');
        if (!ctx) return null;

        const userData = this.groupActivitiesByUser(filteredActivities);

        this.destroyChart('users');

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
                indexAxis: 'y', // Horizontal bar chart
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

        return this.charts.users;
    },

    createTimelineChart(filteredActivities) {
        const ctx = document.getElementById('timeline-chart');
        if (!ctx) return null;

        const timelineData = this.groupActivitiesByTimeline(filteredActivities);

        this.destroyChart('timeline');

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

        return this.charts.timeline;
    },

    createActivityHeatmap(filteredActivities) {
        const heatmapContainer = document.getElementById('activity-heatmap');
        if (!heatmapContainer) return;

        const heatmapData = this.groupActivitiesForHeatmap(filteredActivities);
        heatmapContainer.innerHTML = this.generateHeatmapHTML(heatmapData);
    },

    // ===== 🎯 ГРУПИРАЩИ ФУНКЦИИ (използват филтрираните данни) =====

    groupActivitiesByHour(filteredActivities) {
        const hourCounts = new Array(24).fill(0);

        filteredActivities.forEach(activity => {
            if (activity.timestamp) {
                const hour = new Date(activity.timestamp).getHours();
                hourCounts[hour]++;
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
            actionCounts[action] = (actionCounts[action] || 0) + 1;
        });

        return {
            labels: Object.keys(actionCounts),
            data: Object.values(actionCounts)
        };
    },

    groupActivitiesByUser(filteredActivities) {
        const userCounts = {};

        filteredActivities.forEach(activity => {
            const username = activity.username || 'Анонимен';
            userCounts[username] = (userCounts[username] || 0) + 1;
        });

        // Сортиране по брой активности (най-активните първо)
        const sortedUsers = Object.entries(userCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10); // Топ 10

        return {
            labels: sortedUsers.map(([username]) => username),
            data: sortedUsers.map(([, count]) => count)
        };
    },

    groupActivitiesByTimeline(filteredActivities) {
        if (filteredActivities.length === 0) {
            return { labels: [], data: [] };
        }

        // Групиране по дни
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

        // Инициализация на данните (7 дни x 24 часа)
        for (let day = 0; day < 7; day++) {
            heatmapData[day] = new Array(24).fill(0);
        }

        filteredActivities.forEach(activity => {
            if (activity.timestamp) {
                const date = new Date(activity.timestamp);
                const dayOfWeek = date.getDay();
                const hour = date.getHours();
                heatmapData[dayOfWeek][hour]++;
            }
        });

        return heatmapData;
    },

    generateHeatmapHTML(heatmapData) {
        const days = ['Нед', 'Пон', 'Вт', 'Ср', 'Чет', 'Пет', 'Съб'];
        const maxValue = Math.max(...Object.values(heatmapData).flat());

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

    // ===== УПРАВЛЯВАЩИ МЕТОДИ =====

    showCharts(filteredActivities) {
        const container = document.getElementById('activity-charts-container');
        if (container) {
            container.style.display = 'block';
        }

        // Обновяване на всички графики с филтрираните данни
        setTimeout(() => {
            this.updateAllCharts(filteredActivities);
        }, 100);

        this.updateToggleButton(true);
    },

    hideCharts() {
        const container = document.getElementById('activity-charts-container');
        if (container) {
            container.style.display = 'none';
        }
        this.updateToggleButton(false);
    },

    toggleChartsVisibility() {
        const container = document.getElementById('activity-charts-container');
        if (!container) return;

        const isVisible = container.style.display !== 'none';

        if (isVisible) {
            this.hideCharts();
        } else {
            // Вземи филтрираните данни от activity wall
            if (window.activityWallInstance && window.activityWallInstance.filteredActivities) {
                this.showCharts(window.activityWallInstance.filteredActivities);
            }
        }
    },

    refreshAllCharts() {
        if (!window.activityWallInstance || !window.activityWallInstance.filteredActivities) {
            this.showError('Няма данни за обновяване');
            return;
        }

        const filteredActivities = window.activityWallInstance.filteredActivities;

        // Показай loading индикатор
        this.showChartsLoading();

        setTimeout(() => {
            this.updateAllCharts(filteredActivities);

            if (window.ActivityWallUtils) {
                window.ActivityWallUtils.showToast('Графиките са обновени с филтрираните данни', 'success');
            }
        }, 500);
    },

    // ===== 🔥 КЛЮЧОВА ФУНКЦИЯ: Автоматично обновяване при промяна на филтрите =====
    onFiltersChanged(filteredActivities) {
        console.log('🔄 Графиките получиха нови филтрирани данни:', filteredActivities.length, 'активности');

        const container = document.getElementById('activity-charts-container');
        if (container && container.style.display !== 'none') {
            this.updateAllCharts(filteredActivities);
        }
    },

    // ===== UTILITY МЕТОДИ =====

    destroyChart(chartName) {
        if (this.charts[chartName]) {
            this.charts[chartName].destroy();
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
        const container = document.getElementById('activity-charts-container');
        if (!container) return;

        const cardBody = container.querySelector('.card-body');
        if (cardBody) {
            cardBody.innerHTML = `
                <div class="text-center p-5">
                    <div class="spinner-border text-primary me-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <span>Обновяване на графиките с филтрираните данни...</span>
                </div>
            `;
        }
    },

    showNoDataMessage() {
        const container = document.getElementById('activity-charts-container');
        if (!container) return;

        const cardBody = container.querySelector('.card-body');
        if (cardBody) {
            cardBody.innerHTML = `
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

    // ===== INTEGRATION METHODS =====

    integrateWithActivityWall() {
        // Автоматично интегриране с activity wall
        if (window.activityWallInstance) {
            console.log('✅ Activity Wall Charts: ИНТЕГРИРАНИ с Activity Wall - графиките са отражение на таблицата');
        }
    }
};

// ===== CSS STYLES FOR HEATMAP =====
const heatmapStyles = `
    .heatmap-container {
        display: inline-block;
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
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
    }
    
    .heatmap-cell:hover {
        border: 2px solid #007bff;
        z-index: 10;
        position: relative;
    }
    
    .chart-card {
        height: 100%;
    }
    
    .chart-title {
        color: #495057;
        font-size: 0.9rem;
        margin-bottom: 1rem;
    }
    
    .chart-container {
        position: relative;
    }
`;

// Добавяне на стиловете
const chartsStyleSheet = document.createElement('style');
chartsStyleSheet.textContent = heatmapStyles;
document.head.appendChild(chartsStyleSheet);

// ===== AUTO INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    window.ActivityWallCharts.init();
});

// Export for global access
window.ActivityWallCharts = window.ActivityWallCharts;