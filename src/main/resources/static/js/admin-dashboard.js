document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin Dashboard loaded');

    // Initialize collapsible sections
    initializeCollapsibleSections();

    // Първоначално зареждане
    loadAllDashboardData();

    // Auto refresh на всеки 30 секунди
    setInterval(loadAllDashboardData, 30000);

    // Manual refresh бутон
    document.getElementById('refresh-btn').addEventListener('click', function() {
        this.disabled = true;
        this.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Зареждане...';

        loadAllDashboardData().finally(() => {
            this.disabled = false;
            this.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Обнови данни';
        });
    });
});

// ===== COLLAPSIBLE SECTIONS FUNCTIONALITY =====
function initializeCollapsibleSections() {
    const sectionHeaders = document.querySelectorAll('.section-header');

    sectionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const targetId = this.getAttribute('data-toggle');
            const targetContent = document.getElementById(targetId);

            // Toggle collapsed classes
            this.classList.toggle('collapsed');
            targetContent.classList.toggle('collapsed');

            // Save collapse state to localStorage
            const isCollapsed = this.classList.contains('collapsed');
            localStorage.setItem(`admin-section-${targetId}`, isCollapsed.toString());
        });

        // Restore collapse state from localStorage
        const targetId = header.getAttribute('data-toggle');
        const savedState = localStorage.getItem(`admin-section-${targetId}`);

        if (savedState === 'true') {
            header.classList.add('collapsed');
            document.getElementById(targetId).classList.add('collapsed');
        }
    });
}

// ===== ОСНОВНА ФУНКЦИЯ ЗА ЗАРЕЖДАНЕ НА ВСИЧКИ ДАННИ =====
async function loadAllDashboardData() {
    try {
        await Promise.all([
            loadHealthData(),
            loadSystemMetrics(),
            loadApplicationInfo(),
            loadDatabaseHealth(),
            loadCloudinaryHealth(),
            loadEmailHealth(),
            loadPerformanceMetrics(),
            loadHttpStatusMetrics(),
            loadJvmMetrics(),
            loadDiskSpace(),
            loadDatabasePool(),
            loadMemoryDetails(),
            loadErrorRates()
        ]);

        updateLastRefresh();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showErrorMessage('Грешка при зареждане на данни');
    }
}

// ===== HEALTH DATA =====
async function loadHealthData() {
    try {
        const response = await fetch('/admin/api/health');
        const data = await response.json();

        const statusElement = document.getElementById('health-status');
        statusElement.textContent = data.status;
        statusElement.className = data.status === 'UP' ? 'status-active' : 'status-error';

    } catch (error) {
        console.error('Error loading health data:', error);
        document.getElementById('health-status').textContent = 'ERROR';
        document.getElementById('health-status').className = 'status-error';
    }
}

// ===== SYSTEM METRICS =====
async function loadSystemMetrics() {
    try {
        const response = await fetch('/admin/api/metrics');
        const data = await response.json();

        // CPU Usage
        if (data.cpuUsage !== undefined) {
            document.getElementById('cpu-usage').textContent = Math.round(data.cpuUsage * 100);
        }

        // Memory Usage
        if (data.memoryUsed && data.memoryMax) {
            const usedMB = Math.round(data.memoryUsed / 1024 / 1024);
            const maxMB = Math.round(data.memoryMax / 1024 / 1024);
            const percent = Math.round(data.memoryUsagePercent);

            document.getElementById('memory-used').textContent = usedMB;
            document.getElementById('memory-max').textContent = maxMB;
            document.getElementById('memory-percent').textContent = percent;
        }

        // Active Threads
        if (data.activeThreads !== undefined) {
            document.getElementById('threads-active').textContent = Math.round(data.activeThreads);
        }

    } catch (error) {
        console.error('Error loading system metrics:', error);
    }
}

// ===== APPLICATION INFO =====
async function loadApplicationInfo() {
    try {
        const response = await fetch('/admin/api/info');
        const data = await response.json();

        if (data.uptimeMinutes !== undefined) {
            document.getElementById('uptime').textContent = Math.round(data.uptimeMinutes);
        }

        if (data.javaVersion) {
            document.getElementById('java-version').textContent = data.javaVersion;
        }

    } catch (error) {
        console.error('Error loading app info:', error);
    }
}

// ===== DATABASE HEALTH =====
async function loadDatabaseHealth() {
    try {
        const response = await fetch('/admin/api/health/database');
        const data = await response.json();

        const statusElement = document.getElementById('db-status');
        statusElement.textContent = data.status;
        statusElement.className = data.status === 'UP' ? 'status-active' : 'status-error';

    } catch (error) {
        console.error('Error loading database health:', error);
        document.getElementById('db-status').textContent = 'ERROR';
        document.getElementById('db-status').className = 'status-error';
    }
}

// ===== CLOUDINARY HEALTH =====
async function loadCloudinaryHealth() {
    try {
        const response = await fetch('/admin/api/health/cloudinary');
        const data = await response.json();

        const statusElement = document.getElementById('cloudinary-status');
        statusElement.textContent = data.status;
        statusElement.className = data.status === 'UP' ? 'status-active' : 'status-error';

        if (data.cloudName) {
            document.getElementById('cloudinary-name').textContent = data.cloudName;
        }

    } catch (error) {
        console.error('Error loading cloudinary health:', error);
        document.getElementById('cloudinary-status').textContent = 'ERROR';
        document.getElementById('cloudinary-status').className = 'status-error';
    }
}

// ===== EMAIL HEALTH =====
async function loadEmailHealth() {
    try {
        const response = await fetch('/admin/api/health/email');
        const data = await response.json();

        const statusElement = document.getElementById('email-status');
        statusElement.textContent = data.status;
        statusElement.className = data.status === 'UP' ? 'status-active' : 'status-error';

        // За Mailjet показваме service name или sender email
        if (data.service) {
            document.getElementById('email-host').textContent = data.service;
        } else if (data.senderEmail) {
            document.getElementById('email-host').textContent = data.senderEmail;
        }

        // Debug информация в console за администратора
        if (data.status === 'DOWN' && data.error) {
            console.warn('Email Service Issue:', data.error);
        }

    } catch (error) {
        console.error('Error loading email health:', error);
        document.getElementById('email-status').textContent = 'ERROR';
        document.getElementById('email-status').className = 'status-error';
    }
}

// ===== PERFORMANCE METRICS =====
async function loadPerformanceMetrics() {
    try {
        const response = await fetch('/admin/api/metrics/response-time');
        const data = await response.json();

        if (data.averageResponseTime !== undefined) {
            document.getElementById('avg-response-time').textContent =
                Math.round(data.averageResponseTime);
        }

        if (data.maxResponseTime !== undefined) {
            document.getElementById('max-response-time').textContent =
                Math.round(data.maxResponseTime);
        }

        if (data.totalTime !== undefined) {
            document.getElementById('total-response-time').textContent =
                Math.round(data.totalTime);
        }

    } catch (error) {
        console.error('Error loading performance metrics:', error);
    }
}

// ===== HTTP STATUS METRICS =====
async function loadHttpStatusMetrics() {
    try {
        const response = await fetch('/admin/api/metrics/http-status');
        const data = await response.json();

        document.getElementById('http-200').textContent = Math.round(data.status200 || 0);
        document.getElementById('http-404').textContent = Math.round(data.status404 || 0);
        document.getElementById('http-500').textContent = Math.round(data.status500 || 0);

    } catch (error) {
        console.error('Error loading HTTP status metrics:', error);
    }
}

// ===== JVM METRICS =====
async function loadJvmMetrics() {
    try {
        const response = await fetch('/admin/api/metrics/jvm');
        const data = await response.json();

        if (data.threadsLive !== undefined) {
            document.getElementById('threads-live').textContent = Math.round(data.threadsLive);
        }

        if (data.threadsPeak !== undefined) {
            document.getElementById('threads-peak').textContent = Math.round(data.threadsPeak);
        }

    } catch (error) {
        console.error('Error loading JVM metrics:', error);
    }
}

// ===== DISK SPACE =====
async function loadDiskSpace() {
    try {
        const response = await fetch('/admin/api/resources/disk');
        const data = await response.json();

        if (data.usagePercent !== undefined) {
            document.getElementById('disk-usage-percent').textContent =
                Math.round(data.usagePercent);
        }

        if (data.freeSpaceGB !== undefined) {
            document.getElementById('disk-free').textContent = Math.round(data.freeSpaceGB);
        }

        if (data.totalSpaceGB !== undefined) {
            document.getElementById('disk-total').textContent = Math.round(data.totalSpaceGB);
        }

    } catch (error) {
        console.error('Error loading disk space:', error);
    }
}

// ===== DATABASE CONNECTION POOL =====
async function loadDatabasePool() {
    try {
        const response = await fetch('/admin/api/resources/database-pool');
        const data = await response.json();

        document.getElementById('db-active-connections').textContent =
            Math.round(data.active || 0);
        document.getElementById('db-pending-connections').textContent =
            Math.round(data.pending || 0);

    } catch (error) {
        console.error('Error loading database pool:', error);
    }
}

// ===== MEMORY DETAILS =====
async function loadMemoryDetails() {
    try {
        const response = await fetch('/admin/api/resources/memory');
        const data = await response.json();

        if (data.heapUsed !== undefined) {
            document.getElementById('heap-used').textContent =
                Math.round(data.heapUsed / 1024 / 1024);
        }

        if (data.heapMax !== undefined) {
            document.getElementById('heap-max').textContent =
                Math.round(data.heapMax / 1024 / 1024);
        }

        if (data.nonHeapUsed !== undefined) {
            document.getElementById('non-heap-used').textContent =
                Math.round(data.nonHeapUsed / 1024 / 1024);
        }

    } catch (error) {
        console.error('Error loading memory details:', error);
    }
}

// ===== ERROR RATES =====
async function loadErrorRates() {
    try {
        const response = await fetch('/admin/api/errors/rates');
        const data = await response.json();

        if (data.httpErrorRate !== undefined) {
            document.getElementById('http-error-rate').textContent =
                data.httpErrorRate.toFixed(2);
        }

        // Recent errors
        const recentResponse = await fetch('/admin/api/errors/recent');
        const recentData = await recentResponse.json();

        if (recentData.http5xxCount !== undefined) {
            document.getElementById('recent-5xx-count').textContent =
                Math.round(recentData.http5xxCount);
        }

    } catch (error) {
        console.error('Error loading error rates:', error);
    }
}

// ===== UTILITY FUNCTIONS =====
function updateLastRefresh() {
    const now = new Date();
    document.getElementById('last-update').textContent =
        now.toLocaleTimeString('bg-BG');
}

function showErrorMessage(message) {
    // Създаваме временно съобщение за грешка
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger';
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '20px';
    errorDiv.style.right = '20px';
    errorDiv.style.zIndex = '9999';
    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);

    // Премахваме след 5 секунди
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}