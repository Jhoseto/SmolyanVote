// ====== ADMIN ACTIVITY WALL - PREMIUM CHARTS ======
// File: src/main/resources/static/js/admin/activityWall/activity-wall-charts.js

window.ActivityWallCharts = {
    charts: {},
    isInitialized: false,

    // Professional color schemes for 2025
    colors: {
        primary: {
            main: '#1e293b',
            light: '#334155',
            dark: '#0f172a',
            gradient: ['#1e293b', '#334155', '#475569']
        },
        accent: {
            main: '#4b9f3e',
            light: '#5fb052',
            dark: '#3a7b30',
            gradient: ['#4b9f3e', '#5fb052', '#68d391']
        },
        neutral: {
            light: '#f8fafc',
            medium: '#64748b',
            dark: '#475569',
            darkest: '#1e293b'
        },
        status: {
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
            info: '#3b82f6'
        }
    },

    // Modern chart defaults
    getChartDefaults() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 800,
                easing: 'easeInOutCubic'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20,
                        font: {
                            family: 'Inter, system-ui, sans-serif',
                            size: 12,
                            weight: '500'
                        },
                        color: this.colors.neutral.dark
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#f8fafc',
                    bodyColor: '#e2e8f0',
                    borderColor: '#334155',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    titleFont: {
                        family: 'Inter, system-ui, sans-serif',
                        size: 13,
                        weight: '600'
                    },
                    bodyFont: {
                        family: 'Inter, system-ui, sans-serif',
                        size: 12
                    },
                    displayColors: true,
                    usePointStyle: true
                }
            },
            elements: {
                point: {
                    radius: 0,
                    hoverRadius: 6,
                    backgroundColor: this.colors.accent.main,
                    borderColor: '#ffffff',
                    borderWidth: 2
                },
                line: {
                    tension: 0.4,
                    borderWidth: 3,
                    fill: true
                },
                bar: {
                    borderRadius: 6,
                    borderSkipped: false
                }
            }
        };
    },

    // Create gradient backgrounds
    createGradient(ctx, color1, color2, direction = 'vertical') {
        const gradient = direction === 'vertical'
            ? ctx.createLinearGradient(0, 0, 0, ctx.canvas.height)
            : ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);

        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        return gradient;
    },

    // Initialize charts system
    async init() {
        if (this.isInitialized) return;

        try {
            await this.waitForChartJS();
            this.setupChartJS();
            this.bindEvents();
            this.isInitialized = true;
        } catch (error) {
            console.error('Charts initialization failed:', error);
        }
    },

    // Wait for Chart.js to load
    async waitForChartJS() {
        let attempts = 0;
        const maxAttempts = 50;

        while (typeof Chart === 'undefined' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (typeof Chart === 'undefined') {
            throw new Error('Chart.js failed to load');
        }
    },

    // Setup Chart.js with custom configurations
    setupChartJS() {
        Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
        Chart.defaults.font.size = 12;
        Chart.defaults.color = this.colors.neutral.dark;

        // Register modern plugins if available
        if (Chart.register && window.ChartDataLabels) {
            Chart.register(ChartDataLabels);
        }
    },

    // Bind chart control events
    bindEvents() {
        // Chart refresh buttons
        document.querySelectorAll('[data-chart]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chartType = e.target.closest('[data-chart]')?.dataset?.chart?.replace('-refresh', '');
                if (chartType) {
                    this.refreshChart(chartType);
                }
            });
        });

        // Tab switching optimization
        document.querySelectorAll('#activity-tabs .nav-link').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                if (e.target.id === 'charts-tab') {
                    setTimeout(() => this.resizeAllCharts(), 100);
                }
            });
        });
    },

    // Update main timeline chart (top chart - shows all data)
    async updateMainTimeline(activities) {
        const canvas = document.getElementById('main-activity-timeline-chart');
        if (!canvas) return;

        this.destroyChart('mainTimeline');

        const hourlyData = this.processHourlyData(activities, 24);
        const ctx = canvas.getContext('2d');

        // Create premium gradient
        const backgroundGradient = this.createGradient(
            ctx,
            'rgba(75, 159, 62, 0.1)',
            'rgba(75, 159, 62, 0.05)'
        );

        const borderGradient = this.createGradient(
            ctx,
            this.colors.accent.main,
            this.colors.accent.light
        );

        this.charts.mainTimeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hourlyData.labels,
                datasets: [{
                    label: 'Активности по часове',
                    data: hourlyData.data,
                    backgroundColor: backgroundGradient,
                    borderColor: borderGradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 8,
                    pointBackgroundColor: this.colors.accent.main,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 3,
                    pointHoverBackgroundColor: this.colors.accent.light,
                    pointHoverBorderWidth: 4
                }]
            },
            options: {
                ...this.getChartDefaults(),
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(100, 116, 139, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: this.colors.neutral.medium,
                            font: {
                                size: 11,
                                weight: '500'
                            },
                            maxRotation: 0
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(100, 116, 139, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: this.colors.neutral.medium,
                            font: {
                                size: 11,
                                weight: '500'
                            },
                            callback: function(value) {
                                return value % 1 === 0 ? value : '';
                            }
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
                                return `${context[0].label}ч.`;
                            },
                            label: function(context) {
                                return `Активности: ${context.parsed.y}`;
                            }
                        }
                    }
                }
            }
        });
    },

    // Hourly activity chart (filtered data)
    async createHourlyActivityChart(activities) {
        const canvas = document.getElementById('hourly-activity-chart');
        if (!canvas) return;

        this.destroyChart('hourly');

        const hourlyData = this.processHourlyData(activities, 12);
        const ctx = canvas.getContext('2d');

        // Create sophisticated bar gradients
        const gradients = hourlyData.data.map((_, index) => {
            const intensity = Math.min(hourlyData.data[index] / Math.max(...hourlyData.data), 1);
            return this.createGradient(
                ctx,
                `rgba(75, 159, 62, ${0.8 * intensity})`,
                `rgba(75, 159, 62, ${0.3 * intensity})`
            );
        });

        this.charts.hourly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: hourlyData.labels,
                datasets: [{
                    label: 'Активности',
                    data: hourlyData.data,
                    backgroundColor: gradients,
                    borderColor: this.colors.accent.main,
                    borderWidth: 0,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                ...this.getChartDefaults(),
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: this.colors.neutral.medium,
                            font: {
                                size: 10,
                                weight: '500'
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(100, 116, 139, 0.08)',
                            drawBorder: false
                        },
                        ticks: {
                            color: this.colors.neutral.medium,
                            font: {
                                size: 10,
                                weight: '500'
                            },
                            stepSize: 1
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
                                return `${context[0].label}ч.`;
                            },
                            label: function(context) {
                                return `Активности: ${context.parsed.y}`;
                            }
                        }
                    }
                }
            }
        });
    },

    // Actions distribution chart (premium doughnut)
    async createActionsDistributionChart(activities) {
        const canvas = document.getElementById('actions-distribution-chart');
        if (!canvas) return;

        this.destroyChart('actions');

        const actionsData = this.processActionsData(activities);
        const ctx = canvas.getContext('2d');

        // Premium color palette for actions
        const colors = [
            '#4b9f3e', '#3b82f6', '#8b5cf6', '#f59e0b',
            '#ef4444', '#10b981', '#f97316', '#6366f1',
            '#ec4899', '#14b8a6', '#84cc16', '#64748b'
        ];

        // Create subtle gradients for each segment
        const backgroundColors = actionsData.data.map((_, index) => {
            const color = colors[index % colors.length];
            return this.createRadialGradient(ctx, color);
        });

        this.charts.actions = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: actionsData.labels,
                datasets: [{
                    data: actionsData.data,
                    backgroundColor: backgroundColors,
                    borderColor: '#ffffff',
                    borderWidth: 3,
                    hoverBorderWidth: 5,
                    hoverOffset: 8
                }]
            },
            options: {
                ...this.getChartDefaults(),
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'right',
                        align: 'center',
                        labels: {
                            boxWidth: 12,
                            boxHeight: 12,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            padding: 15,
                            font: {
                                size: 11,
                                weight: '500'
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed * 100) / total).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1200
                }
            }
        });
    },

    // User activity chart (horizontal bars)
    async createUserActivityChart(activities) {
        const canvas = document.getElementById('user-activity-chart');
        if (!canvas) return;

        this.destroyChart('users');

        const usersData = this.processUsersData(activities);
        const ctx = canvas.getContext('2d');

        // Create horizontal gradient for bars
        const gradient = this.createGradient(
            ctx,
            this.colors.primary.light,
            this.colors.primary.main,
            'horizontal'
        );

        this.charts.users = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: usersData.labels,
                datasets: [{
                    label: 'Активности',
                    data: usersData.data,
                    backgroundColor: gradient,
                    borderColor: this.colors.primary.dark,
                    borderWidth: 0,
                    borderRadius: 6
                }]
            },
            options: {
                ...this.getChartDefaults(),
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(100, 116, 139, 0.08)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#ffffff',
                            font: {
                                size: 10
                            },
                            stepSize: 1
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: this.colors.neutral.medium,
                            font: {
                                size: 10,
                                weight: '500'
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed.x} активности`;
                            }
                        }
                    }
                }
            }
        });
    },

    // Activity heatmap (custom visualization)
    async createActivityHeatmap(activities) {
        const container = document.getElementById('activity-heatmap-container');
        if (!container) return;

        const heatmapData = this.processHeatmapData(activities);

        container.innerHTML = `
            <div class="heatmap-grid">
                <div class="heatmap-days">
                    ${['Пон', 'Вто', 'Сря', 'Чет', 'Пет', 'Саб', 'Нед'].map(day =>
            `<div class="heatmap-day-label">${day}</div>`
        ).join('')}
                </div>
                <div class="heatmap-hours">
                    ${Array.from({length: 24}, (_, i) =>
            `<div class="heatmap-hour-label">${i.toString().padStart(2, '0')}</div>`
        ).join('')}
                </div>
                <div class="heatmap-cells">
                    ${this.generateHeatmapCells(heatmapData)}
                </div>
                <div class="heatmap-legend">
                    <span class="heatmap-legend-label">По-малко</span>
                    <div class="heatmap-legend-scale">
                        ${Array.from({length: 20}, (_, i) =>
            `<div class="heatmap-legend-cell" data-level="${i}"></div>`
        ).join('')}
                    </div>
                    <span class="heatmap-legend-label">Повече</span>
                </div>
            </div>
        `;

        this.addHeatmapInteractivity(container, heatmapData);
    },

    // Generate heatmap cells
    generateHeatmapCells(data) {
        const maxValue = Math.max(...Object.values(data));
        let cells = '';

        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                const key = `${day}-${hour}`;
                const value = data[key] || 0;
                const intensity = maxValue > 0 ? Math.floor((value / maxValue) * 19) : 0;

                cells += `
                    <div class="heatmap-cell" 
                         data-day="${day}" 
                         data-hour="${hour}" 
                         data-value="${value}"
                         data-intensity="${intensity}"
                         title="${this.getDayName(day)} ${hour}:00ч - ${value} активности. Кликни за детайли.">
                    </div>
                `;
            }
        }

        return cells;
    },

    // Add heatmap interactivity
    addHeatmapInteractivity(container, data) {
        const cells = container.querySelectorAll('.heatmap-cell');

        cells.forEach(cell => {
            cell.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.1)';
                this.style.zIndex = '10';
                this.style.boxShadow = '0 4px 12px rgba(75, 159, 62, 0.3)';
            });

            cell.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
                this.style.zIndex = '1';
                this.style.boxShadow = 'none';
            });

            cell.addEventListener('click', function(e) {
                const day = this.dataset.day;
                const hour = this.dataset.hour;
                const value = this.dataset.value;

                // Find activities for this time slot
                const activities = window.activityWall.filteredActivities.filter(a => {
                    const d = new Date(a.timestamp);
                    const cellDay = (d.getDay() + 6) % 7; // Convert to Monday = 0
                    return cellDay == day && d.getHours() == hour;
                });

                // Show custom heatmap popup instead of table modal
                window.ActivityWallCharts.showHeatmapPopup(
                    day,
                    parseInt(hour),
                    activities,
                    e.clientX + 10,
                    e.clientY + 10
                );
            });
        });
    },

    // Data processing methods
    processHourlyData(activities, hours = 24) {
        const now = new Date();
        const labels = [];
        const data = [];

        for (let i = hours - 1; i >= 0; i--) {
            const hour = new Date(now - i * 60 * 60 * 1000);
            const hourStart = new Date(hour);
            hourStart.setMinutes(0, 0, 0);
            const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

            const count = activities.filter(activity => {
                const activityTime = new Date(activity.timestamp);
                return activityTime >= hourStart && activityTime < hourEnd;
            }).length;

            labels.push(hour.getHours().toString().padStart(2, '0'));
            data.push(count);
        }

        return { labels, data };
    },

    processActionsData(activities) {
        const actionCounts = {};
        activities.forEach(activity => {
            actionCounts[activity.action] = (actionCounts[activity.action] || 0) + 1;
        });

        const sorted = Object.entries(actionCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        return {
            labels: sorted.map(([action]) => this.translateAction(action)),
            data: sorted.map(([,count]) => count)
        };
    },

    processUsersData(activities) {
        const userCounts = {};
        activities.forEach(activity => {
            if (activity.username) {
                userCounts[activity.username] = (userCounts[activity.username] || 0) + 1;
            }
        });

        const sorted = Object.entries(userCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        return {
            labels: sorted.map(([user]) => user),
            data: sorted.map(([,count]) => count)
        };
    },

    processHeatmapData(activities) {
        const heatmapData = {};

        activities.forEach(activity => {
            const date = new Date(activity.timestamp);
            const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const hour = date.getHours();
            const key = `${(day + 6) % 7}-${hour}`; // Convert to Monday = 0

            heatmapData[key] = (heatmapData[key] || 0) + 1;
        });

        return heatmapData;
    },

    // Utility methods
    createRadialGradient(ctx, color) {
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;
        const radius = Math.min(centerX, centerY);

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, this.adjustColor(color, -20));
        return gradient;
    },

    adjustColor(color, amount) {
        return '#' + color.replace(/^#/, '').replace(/../g, color =>
            ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2)
        );
    },

    translateAction(action) {
        const translations = {
            'CREATE_PUBLICATION': 'Публикации',
            'CREATE_EVENT': 'События',
            'CREATE_REFERENDUM': 'Референдуми',
            'CREATE_MULTI_POLL': 'Анкети',
            'CREATE_SIGNAL': 'Сигнали',
            'CREATE_COMMENT': 'Коментари',
            'LOGIN': 'Вход',
            'LOGOUT': 'Изход',
            'REGISTER': 'Регистрации',
            'VOTE_REFERENDUM': 'Гласувания (Р)',
            'VOTE_MULTI_POLL': 'Гласувания (А)',
            'VOTE_SIMPLEEVENT': 'Гласувания (С)',
            'VIEW_PUBLICATION': 'Прегледи',
            'LIKE_PUBLICATION': 'Харесвания',
            'ADMIN_REVIEW_REPORT': 'Админ преглед'
        };
        return translations[action] || action.replace(/_/g, ' ');
    },

    getDayName(day) {
        const days = ['Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота', 'Неделя'];
        return days[day];
    },

    // Create heatmap popup
    createHeatmapPopup() {
        if (document.getElementById('heatmap-popup')) return;

        const popup = document.createElement('div');
        popup.id = 'heatmap-popup';
        popup.className = 'heatmap-popup';
        popup.style.cssText = `
            position: fixed;
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 1rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            display: none;
            min-width: 250px;
            backdrop-filter: blur(8px);
        `;

        document.body.appendChild(popup);
    },

    // Show heatmap popup
    showHeatmapPopup(day, hour, activities, x, y) {
        this.createHeatmapPopup();
        const popup = document.getElementById('heatmap-popup');

        const dayName = this.getDayName(day);
        const timeSlot = `${hour}:00 - ${hour + 1}:00ч`;

        let content = `
            <div class="heatmap-popup-header">
                <strong>${dayName}</strong><br>
                <span class="text-muted">${timeSlot}</span>
            </div>
            <hr style="margin: 0.5rem 0;">
            <div class="heatmap-popup-stats">
                <div><strong>Общо активности:</strong> ${activities.length}</div>
        `;

        if (activities.length > 0) {
            // Top actions
            const actionCounts = {};
            activities.forEach(a => {
                actionCounts[a.action] = (actionCounts[a.action] || 0) + 1;
            });
            const topActions = Object.entries(actionCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3);

            // Top users
            const userCounts = {};
            activities.forEach(a => {
                if (a.username) userCounts[a.username] = (userCounts[a.username] || 0) + 1;
            });
            const topUsers = Object.entries(userCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3);

            content += `
                <div style="margin-top: 0.5rem;">
                    <strong>Топ действия:</strong><br>
                    ${topActions.map(([action, count]) =>
                `<small>• ${this.translateAction(action)}: ${count}</small>`
            ).join('<br>')}
                </div>
            `;

            if (topUsers.length > 0) {
                content += `
                    <div style="margin-top: 0.5rem;">
                        <strong>Топ потребители:</strong><br>
                        ${topUsers.map(([user, count]) =>
                    `<small>• ${user}: ${count}</small>`
                ).join('<br>')}
                    </div>
                `;
            }
        }

        content += `
            </div>
            <button type="button" class="btn btn-sm btn-outline-secondary mt-2" 
                    onclick="ActivityWallCharts.hideHeatmapPopup()">
                Затвори
            </button>
        `;

        popup.innerHTML = content;
        popup.style.display = 'block';
        popup.style.left = Math.min(x, window.innerWidth - 270) + 'px';
        popup.style.top = Math.min(y, window.innerHeight - 200) + 'px';
    },

    // Hide heatmap popup
    hideHeatmapPopup() {
        const popup = document.getElementById('heatmap-popup');
        if (popup) popup.style.display = 'none';
    },

    // Chart management
    destroyChart(chartName) {
        if (this.charts[chartName]) {
            this.charts[chartName].destroy();
            delete this.charts[chartName];
        }
    },

    refreshChart(chartType) {
        const refreshMethods = {
            'hourly': () => this.createHourlyActivityChart(window.activityWall?.filteredActivities || []),
            'actions': () => this.createActionsDistributionChart(window.activityWall?.filteredActivities || []),
            'users': () => this.createUserActivityChart(window.activityWall?.filteredActivities || []),
            'heatmap': () => this.createActivityHeatmap(window.activityWall?.filteredActivities || [])
        };

        if (refreshMethods[chartType]) {
            refreshMethods[chartType]();
        }
    },

    resizeAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.resize) {
                chart.resize();
            }
        });
    },

    // External integration methods
    async onFiltersChanged(filteredActivities) {
        if (!this.isInitialized) return;

        await Promise.all([
            this.createHourlyActivityChart(filteredActivities),
            this.createActionsDistributionChart(filteredActivities),
            this.createUserActivityChart(filteredActivities),
            this.createActivityHeatmap(filteredActivities)
        ]);
    },

    // Cleanup
    destroy() {
        Object.keys(this.charts).forEach(chartName => {
            this.destroyChart(chartName);
        });

        // Cleanup heatmap popup
        const popup = document.getElementById('heatmap-popup');
        if (popup && popup.parentNode) {
            popup.parentNode.removeChild(popup);
        }

        this.isInitialized = false;
    }
};

// Auto initialization
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await window.ActivityWallCharts.init();
    } catch (error) {
        console.error('Failed to initialize Activity Wall Charts:', error);
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (window.ActivityWallCharts) {
        window.ActivityWallCharts.destroy();
    }
});