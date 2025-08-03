document.addEventListener('DOMContentLoaded', function() {
    initializeCollapsibleSections();
    loadAllDashboardData();
    setInterval(loadAllDashboardData, 30000);

    document.getElementById('refresh-btn').addEventListener('click', function() {
        this.disabled = true;
        this.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i> Зареждане...';

        loadAllDashboardData().finally(() => {
            this.disabled = false;
            this.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Обнови данни';
        });
    });
});

function initializeCollapsibleSections() {
    const sectionHeaders = document.querySelectorAll('.section-header');

    sectionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const targetId = this.getAttribute('data-toggle');
            const targetContent = document.getElementById(targetId);

            this.classList.toggle('collapsed');
            targetContent.classList.toggle('collapsed');

            if (targetId === 'reports-management' && !targetContent.classList.contains('collapsed')) {
                setTimeout(() => {
                    if (typeof setupEventListeners === 'function') {
                        setupEventListeners();
                        if (typeof loadReportsData === 'function') {
                            loadReportsData();
                        }
                    }
                }, 500);
            }

            const isCollapsed = this.classList.contains('collapsed');
            localStorage.setItem(`admin-section-${targetId}`, isCollapsed.toString());
        });

        const targetId = header.getAttribute('data-toggle');
        const savedState = localStorage.getItem(`admin-section-${targetId}`);

        if (savedState === 'true') {
            header.classList.add('collapsed');
            document.getElementById(targetId).classList.add('collapsed');
        } else if (savedState === 'false') {
            header.classList.remove('collapsed');
            document.getElementById(targetId).classList.remove('collapsed');

            if (targetId === 'reports-management') {
                setTimeout(() => {
                    if (typeof setupEventListeners === 'function') {
                        setupEventListeners();
                        if (typeof loadReportsData === 'function') {
                            loadReportsData();
                        }
                    }
                }, 100);
            }
        }
    });
}

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
        showToast('Данните са обновени успешно', 'success');

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Грешка при зареждане на данните', 'error');
    }
}

async function loadHealthData() {
    try {
        const response = await fetch('/admin/api/health');
        const data = await response.json();

        const statusElement = document.getElementById('health-status');
        statusElement.textContent = data.status;
        statusElement.className = data.status === 'UP' ? 'status-active' : 'status-error';

        if (data.details && data.details.diskSpace) {
            const uptimeMinutes = Math.round((Date.now() - data.details.diskSpace.total) / 60000);
            document.getElementById('uptime').textContent = uptimeMinutes;
        }

    } catch (error) {
        console.error('Error loading health data:', error);
        document.getElementById('health-status').textContent = 'ERROR';
        document.getElementById('health-status').className = 'status-error';
    }
}

async function loadSystemMetrics() {
    try {
        const response = await fetch('/admin/api/metrics/system');
        const data = await response.json();

        if (data.cpuUsage !== undefined) {
            document.getElementById('cpu-usage').textContent = Math.round(data.cpuUsage * 100);
        }

        if (data.systemLoadAverage !== undefined) {
            document.getElementById('system-load').textContent = data.systemLoadAverage.toFixed(2);
        }

    } catch (error) {
        console.error('Error loading system metrics:', error);
    }
}

async function loadMemoryDetails() {
    try {
        const response = await fetch('/admin/api/resources/memory');
        const data = await response.json();

        if (data.heapUsed !== undefined && data.heapMax !== undefined) {
            document.getElementById('memory-used').textContent = Math.round(data.heapUsed);
            document.getElementById('memory-max').textContent = Math.round(data.heapMax);

            const usagePercent = Math.round((data.heapUsed / data.heapMax) * 100);
            document.getElementById('memory-usage-percent').textContent = usagePercent;
        }

    } catch (error) {
        console.error('Error loading memory details:', error);
    }
}

async function loadApplicationInfo() {
    try {
        const response = await fetch('/admin/api/info');
        const data = await response.json();

        if (data.app && data.app.name) {
            document.getElementById('app-name').textContent = data.app.name;
        }

        if (data.app && data.app.version) {
            document.getElementById('app-version').textContent = data.app.version;
        }

        if (data.java && data.java.version) {
            document.getElementById('java-version').textContent = data.java.version;
        }

    } catch (error) {
        console.error('Error loading application info:', error);
    }
}

async function loadDatabaseHealth() {
    try {
        const response = await fetch('/admin/api/health/database');
        const data = await response.json();

        const dbStatusElement = document.getElementById('db-status');
        dbStatusElement.textContent = data.status;
        dbStatusElement.className = data.status === 'UP' ? 'status-active' : 'status-error';

    } catch (error) {
        console.error('Error loading database health:', error);
        document.getElementById('db-status').textContent = 'ERROR';
        document.getElementById('db-status').className = 'status-error';
    }
}

async function loadDatabasePool() {
    try {
        const response = await fetch('/admin/api/resources/database-pool');
        const data = await response.json();

        if (data.active !== undefined) {
            document.getElementById('db-active-connections').textContent = Math.round(data.active);
        }

        if (data.pending !== undefined) {
            document.getElementById('db-pending-connections').textContent = Math.round(data.pending);
        }

    } catch (error) {
        console.error('Error loading database pool metrics:', error);
    }
}

async function loadCloudinaryHealth() {
    try {
        const response = await fetch('/admin/api/health/cloudinary');
        const data = await response.json();

        const cloudinaryStatusElement = document.getElementById('cloudinary-status');
        cloudinaryStatusElement.textContent = data.status;
        cloudinaryStatusElement.className = data.status === 'UP' ? 'status-active' : 'status-error';

        if (data.details && data.details.cloudName) {
            document.getElementById('cloudinary-name').textContent = data.details.cloudName;
        }

    } catch (error) {
        console.error('Error loading Cloudinary health:', error);
        document.getElementById('cloudinary-status').textContent = 'ERROR';
        document.getElementById('cloudinary-status').className = 'status-error';
    }
}

async function loadEmailHealth() {
    try {
        const response = await fetch('/admin/api/health/email');
        const data = await response.json();

        const emailStatusElement = document.getElementById('email-status');
        emailStatusElement.textContent = data.status;
        emailStatusElement.className = data.status === 'UP' ? 'status-active' : 'status-error';

        if (data.details && data.details.host) {
            document.getElementById('email-host').textContent = data.details.host;
        }

    } catch (error) {
        console.error('Error loading email health:', error);
        document.getElementById('email-status').textContent = 'ERROR';
        document.getElementById('email-status').className = 'status-error';
    }
}

async function loadPerformanceMetrics() {
    try {
        const response = await fetch('/admin/api/metrics/response-time');
        const data = await response.json();

        if (data.avgResponseTime !== undefined) {
            document.getElementById('avg-response-time').textContent = Math.round(data.avgResponseTime);
        }

        if (data.requestsPerSecond !== undefined) {
            document.getElementById('requests-per-second').textContent = data.requestsPerSecond.toFixed(1);
        }

    } catch (error) {
        console.error('Error loading performance metrics:', error);
    }
}

async function loadErrorRates() {
    try {
        const response = await fetch('/admin/api/errors/rates');
        const data = await response.json();

        if (data.errorRate !== undefined) {
            document.getElementById('error-rate').textContent = (data.errorRate * 100).toFixed(2);
        }

        if (data.totalErrors !== undefined) {
            document.getElementById('total-errors').textContent = Math.round(data.totalErrors);
        }

    } catch (error) {
        console.error('Error loading error rates:', error);
    }
}

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

async function loadDiskSpace() {
    try {
        const response = await fetch('/admin/api/resources/disk');
        const data = await response.json();

        if (data.usagePercent !== undefined) {
            document.getElementById('disk-usage-percent').textContent = Math.round(data.usagePercent);
        }

        if (data.freeSpaceGB !== undefined) {
            document.getElementById('disk-free-space').textContent = Math.round(data.freeSpaceGB);
        }

    } catch (error) {
        console.error('Error loading disk space:', error);
    }
}

function updateLastRefresh() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('bg-BG');
    const elements = document.querySelectorAll('.last-refresh');
    elements.forEach(el => el.textContent = timeString);
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info') {
    let toast = document.getElementById('admin-toast');
    if (!toast) {
        toast = createToast();
    }

    const toastBody = toast.querySelector('.toast-body');
    const toastTime = toast.querySelector('.toast-time');

    if (toastBody) {
        toastBody.textContent = message;
    }

    if (toastTime) {
        toastTime.textContent = new Date().toLocaleTimeString('bg-BG', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    toast.className = `toast ${type === 'error' ? 'border-danger' : type === 'success' ? 'border-success' : 'border-info'}`;

    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

function createToast() {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1080';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.id = 'admin-toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="toast-header">
            <i class="bi bi-gear-fill text-primary me-2"></i>
            <strong class="me-auto">Админ панел</strong>
            <small class="text-muted toast-time">Сега</small>
            <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">
            Съобщение
        </div>
    `;

    toastContainer.appendChild(toast);
    return toast;
}

// ===== ACTIVITY WALL INTEGRATION =====
function getActivityWallInstance() {
    return window.activityWallInstance || null;
}

function isActivityWallActive() {
    const activityWall = getActivityWallInstance();
    return activityWall && activityWall.isLive;
}

function pauseActivityWall() {
    const activityWall = getActivityWallInstance();
    if (activityWall && !activityWall.isPaused) {
        activityWall.togglePause();
    }
}

function resumeActivityWall() {
    const activityWall = getActivityWallInstance();
    if (activityWall && activityWall.isPaused) {
        activityWall.togglePause();
    }
}

// ===== ORIGINAL EXPORTS =====
window.forceReportsRefresh = function() {
    const reportsSection = document.getElementById('reports-management');
    if (reportsSection && !reportsSection.classList.contains('collapsed')) {
        if (typeof loadReportsData === 'function') {
            loadReportsData();
        }
    }
};

window.isReportsSectionVisible = function() {
    const reportsSection = document.getElementById('reports-management');
    return reportsSection && !reportsSection.classList.contains('collapsed');
};

// ===== NEW EXPORTS =====
window.showToast = showToast;
window.getActivityWallInstance = getActivityWallInstance;
window.isActivityWallActive = isActivityWallActive;
window.pauseActivityWall = pauseActivityWall;
window.resumeActivityWall = resumeActivityWall;