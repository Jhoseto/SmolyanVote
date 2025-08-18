// ====== ADMIN ACTIVITY WALL - CHARTS & GRAPHS ======
// Файл: src/main/resources/static/js/admin/activityWall/activity-wall-charts.js

window.ActivityWallCharts = {

    // ===== CHART INSTANCES =====
    charts: {
        hourly: null,
        actions: null,
        users: null,
        timeline: null,
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
        console.log('✅ Activity Wall Charts: Initialized');
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
                        Графики и анализи
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

    // ===== CHART CREATION METHODS =====

    createHourlyActivityChart(activities) {
        const ctx = document.getElementById('hourly-activity-chart');
        if (!ctx) return null;

        const hourlyData = this.processHourlyData(activities);

        this.destroyChart('hourly');

        this.charts.hourly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hourlyData.labels,
                datasets: [{
                    label: 'Активности',
                    data: hourlyData.data,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
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

    createActionsDistributionChart(activities) {
        const ctx = document.getElementById('actions-distribution-chart');
        if (!ctx) return null;

        const actionsData = this.processActionsData(activities);

        this.destroyChart('actions');

        this.charts.actions = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: actionsData.labels,
                datasets: [{
                    data: actionsData.data,
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40',
                        '#FF6384',
                        '#C9CBCF'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((context.raw / total) * 100);
                                return context.label + ': ' + context.raw + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });

        return this.charts.actions;
    },

    createUserActivityChart(activities) {
        const ctx = document.getElementById('user-activity-chart');
        if (!ctx) return null;

        const userData = this.processUserData(activities);

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

    createTimelineChart(activities) {
        const ctx = document.getElementById('timeline-chart');
        if (!ctx) return null;

        const timelineData = this.processTimelineData(activities);

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

    createActivityHeatmap(activities) {
        const container = document.getElementById('activity-heatmap');
        if (!container) return;

        const heatmapData = this.processHeatmapData(activities);

        container.innerHTML = '';

        // Създаване на heatmap с HTML/CSS
        const heatmapHtml = this.generateHeatmapHTML(heatmapData);
        container.innerHTML = heatmapHtml;
    },

    // ===== DATA PROCESSING METHODS =====

    processHourlyData(activities) {
        const hourlyCount = new Array(24).fill(0);

        activities.forEach(activity => {
            const hour = new Date(activity.timestamp).getHours();
            hourlyCount[hour]++;
        });

        return {
            labels: Array.from({length: 24}, (_, i) => `${i}:00`),
            data: hourlyCount
        };
    },

    processActionsData(activities) {
        const actionCounts = {};

        activities.forEach(activity => {
            const action = this.formatActionForChart(activity.action);
            actionCounts[action] = (actionCounts[action] || 0) + 1;
        });

        const sorted = Object.entries(actionCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8); // Top 8 actions

        return {
            labels: sorted.map(([action]) => action),
            data: sorted.map(([, count]) => count)
        };
    },

    processUserData(activities) {
        const userCounts = {};

        activities.forEach(activity => {
            const username = activity.username || 'Анонимен';
            userCounts[username] = (userCounts[username] || 0) + 1;
        });

        const sorted = Object.entries(userCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10); // Top 10 users

        return {
            labels: sorted.map(([user]) => user),
            data: sorted.map(([, count]) => count)
        };
    },

    processTimelineData(activities) {
        // Групиране по часове за последните 24 часа
        const now = new Date();
        const hourlyData = {};

        for (let i = 23; i >= 0; i--) {
            const hour = new Date(now.getTime() - (i * 60 * 60 * 1000));
            const hourKey = hour.toISOString().substring(0, 13);
            hourlyData[hourKey] = 0;
        }

        activities.forEach(activity => {
            const activityTime = new Date(activity.timestamp);
            const hourKey = activityTime.toISOString().substring(0, 13);
            if (hourlyData.hasOwnProperty(hourKey)) {
                hourlyData[hourKey]++;
            }
        });

        const labels = Object.keys(hourlyData).map(key => {
            const date = new Date(key + ':00:00');
            return date.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
        });

        return {
            labels: labels,
            data: Object.values(hourlyData)
        };
    },

    processHeatmapData(activities) {
        const heatmap = Array(7).fill(null).map(() => Array(24).fill(0));

        activities.forEach(activity => {
            const date = new Date(activity.timestamp);
            const dayOfWeek = date.getDay(); // 0 = Sunday
            const hour = date.getHours();
            heatmap[dayOfWeek][hour]++;
        });

        return heatmap;
    },

    // ===== UTILITY METHODS =====

    formatActionForChart(action) {
        if (!action) return 'Неизвестно';

        const actionMap = {
            'USER_LOGIN': 'Вход',
            'USER_LOGOUT': 'Изход',
            'USER_REGISTER': 'Регистрация',
            'CREATE_PUBLICATION': 'Създаване',
            'DELETE_PUBLICATION': 'Изтриване',
            'LIKE_PUBLICATION': 'Харесвания',
            'DISLIKE_PUBLICATION': 'Нехаресвания',
            'VOTE_FOR': 'Гласове ЗА',
            'VOTE_AGAINST': 'Гласове ПРОТИВ',
            'ADMIN_LOGIN': 'Админ вход',
            'BAN_USER': 'Блокиране',
            'UNBAN_USER': 'Разблокиране'
        };

        return actionMap[action] || action.replace(/_/g, ' ');
    },

    generateHeatmapHTML(heatmapData) {
        const days = ['Нед', 'Пон', 'Вто', 'Сря', 'Чет', 'Пет', 'Съб'];
        const maxValue = Math.max(...heatmapData.flat());

        let html = '<div class="heatmap-container">';

        // Header с часовете
        html += '<div class="heatmap-header">';
        html += '<div class="heatmap-corner"></div>';
        for (let hour = 0; hour < 24; hour++) {
            html += `<div class="heatmap-hour">${hour}</div>`;
        }
        html += '</div>';

        // Редове за всеки ден
        heatmapData.forEach((dayData, dayIndex) => {
            html += '<div class="heatmap-row">';
            html += `<div class="heatmap-day">${days[dayIndex]}</div>`;

            dayData.forEach((value, hour) => {
                const intensity = maxValue > 0 ? value / maxValue : 0;
                const opacity = Math.max(0.1, intensity);
                html += `<div class="heatmap-cell" 
                            style="background-color: rgba(54, 162, 235, ${opacity});"
                            title="${days[dayIndex]} ${hour}:00 - ${value} активности">
                            ${value > 0 ? value : ''}
                         </div>`;
            });

            html += '</div>';
        });

        html += '</div>';

        return html;
    },

    destroyChart(chartName) {
        if (this.charts[chartName]) {
            this.charts[chartName].destroy();
            this.charts[chartName] = null;
        }
    },

    // ===== PUBLIC METHODS =====

    showCharts(activities) {
        if (!activities || activities.length === 0) {
            this.showError('Няма данни за графиките');
            return;
        }

        const container = document.getElementById('activity-charts-container');
        if (container) {
            container.style.display = 'block';
        }

        // Създаване на всички графики
        setTimeout(() => {
            this.createHourlyActivityChart(activities);
            this.createActionsDistributionChart(activities);
            this.createUserActivityChart(activities);
            this.createTimelineChart(activities);
            this.createActivityHeatmap(activities);
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
            // Вземи данните от activity wall instance
            if (window.activityWallInstance) {
                const activities = window.activityWallInstance.filteredActivities || [];
                this.showCharts(activities);
            }
        }
    },

    refreshAllCharts() {
        if (!window.activityWallInstance) return;

        const activities = window.activityWallInstance.filteredActivities || [];

        // Показай loading индикатор
        this.showChartsLoading();

        setTimeout(() => {
            this.showCharts(activities);

            if (window.ActivityWallUtils) {
                window.ActivityWallUtils.showToast('Графиките са обновени', 'success');
            }
        }, 500);
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
                    <span>Зареждане на графиките...</span>
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

    onFiltersChanged(filteredActivities) {
        // Автоматично обновяване на графиките при промяна на филтрите
        const container = document.getElementById('activity-charts-container');
        if (container && container.style.display !== 'none') {
            this.refreshAllCharts();
        }
    },

    integrateWithActivityWall() {
        // Автоматично интегриране с activity wall
        if (window.activityWallInstance) {
            console.log('✅ Activity Wall Charts: Integrated with Activity Wall');
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