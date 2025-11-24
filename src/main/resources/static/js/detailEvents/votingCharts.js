/**
 * Voting Charts Module
 * Рендира графики за резултатите от гласуването
 * Използва Chart.js библиотека
 */

window.VotingCharts = {
    charts: {},

    /**
     * Инициализира графики за SimpleEvent (За/Против/Въздържал се)
     */
    initSimpleEventChart(data) {
        const canvas = document.getElementById('simpleEventChart');
        if (!canvas || !window.Chart) {
            console.warn('Chart.js не е зареден или canvas не е намерен');
            return;
        }

        // Унищожи съществуваща графика ако има
        if (this.charts.simpleEvent) {
            this.charts.simpleEvent.destroy();
        }

        const ctx = canvas.getContext('2d');
        const labels = [data.positiveLabel, data.negativeLabel, data.neutralLabel];
        const votes = [data.yesVotes, data.noVotes, data.neutralVotes];
        const colors = ['#4b9f3e', '#ef4444', '#64748b']; // Зелено, Червено, Сиво

        this.charts.simpleEvent = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: votes,
                    backgroundColor: colors,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.5,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12,
                                family: 'Inter, system-ui, sans-serif'
                            },
                            usePointStyle: true,
                            pointStyle: 'circle'
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
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} гласа (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    },

    /**
     * Инициализира графики за Referendum (множество опции)
     */
    initReferendumChart(data) {
        const canvas = document.getElementById('referendumChart');
        if (!canvas || !window.Chart) {
            console.warn('Chart.js не е зареден или canvas не е намерен');
            return;
        }

        if (this.charts.referendum) {
            this.charts.referendum.destroy();
        }

        const ctx = canvas.getContext('2d');
        const labels = data.options || [];
        const votes = data.votes || [];
        const percentages = data.votePercentages || [];

        // Генериране на цветове за всяка опция
        const colors = this.generateColors(labels.length);

        this.charts.referendum = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Гласове',
                    data: votes,
                    backgroundColor: colors.map(c => c + '80'), // 50% opacity
                    borderColor: colors,
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y', // Horizontal bar chart
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: labels.length > 5 ? 2 : 1.5,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleColor: '#f8fafc',
                        bodyColor: '#e2e8f0',
                        borderColor: '#334155',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const index = context.dataIndex;
                                const value = context.parsed.x || 0;
                                const percentage = percentages[index] || 0;
                                return `${value} гласа (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    },

    /**
     * Инициализира графики за MultiPoll (до 10 опции)
     */
    initMultiPollChart(data) {
        const canvas = document.getElementById('multiPollChart');
        if (!canvas || !window.Chart) {
            console.warn('Chart.js не е зареден или canvas не е намерен');
            return;
        }

        if (this.charts.multiPoll) {
            this.charts.multiPoll.destroy();
        }

        const ctx = canvas.getContext('2d');
        const labels = data.optionsText || [];
        const votes = data.votesForOptions || [];
        const percentages = data.votePercentages || [];

        // Генериране на цветове
        const colors = this.generateColors(labels.length);

        this.charts.multiPoll = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Гласове',
                    data: votes,
                    backgroundColor: colors.map(c => c + '80'),
                    borderColor: colors,
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: labels.length > 5 ? 2.5 : 1.8,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleColor: '#f8fafc',
                        bodyColor: '#e2e8f0',
                        borderColor: '#334155',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const index = context.dataIndex;
                                const value = context.parsed.x || 0;
                                const percentage = percentages[index] || 0;
                                return `${value} гласа (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    },

    /**
     * Генерира масив от цветове за графиките
     */
    generateColors(count) {
        const baseColors = [
            '#4b9f3e', // Зелено
            '#3b82f6', // Синьо
            '#f59e0b', // Оранжево
            '#ef4444', // Червено
            '#8b5cf6', // Лилаво
            '#ec4899', // Розово
            '#14b8a6', // Тюркоазно
            '#f97316', // Оранжево-червено
            '#06b6d4', // Циан
            '#84cc16'  // Лайм
        ];

        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }
        return colors;
    },

    /**
     * Toggle между progress bars и графики
     */
    toggleView(type) {
        const barsContainer = document.querySelector(`.voting-results-bars[data-type="${type}"]`);
        const chartContainer = document.querySelector(`.voting-results-chart[data-type="${type}"]`);
        const toggleBtn = document.querySelector(`.chart-toggle-btn[data-type="${type}"]`);

        if (!barsContainer || !chartContainer || !toggleBtn) return;

        const isChartVisible = chartContainer.style.display !== 'none';

        if (isChartVisible) {
            // Покажи progress bars
            chartContainer.style.display = 'none';
            barsContainer.style.display = 'block';
            toggleBtn.innerHTML = '<i class="bi bi-bar-chart"></i> Покажи графика';
        } else {
            // Покажи графика
            barsContainer.style.display = 'none';
            chartContainer.style.display = 'block';
            toggleBtn.innerHTML = '<i class="bi bi-list"></i> Покажи резултати';
        }
    },

    /**
     * Унищожи всички графики
     */
    destroyAll() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }
};

