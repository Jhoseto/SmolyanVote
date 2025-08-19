// ====== ADMIN ACTIVITY WALL - UTILITIES (FIXED) ======
// Файл: src/main/resources/static/js/admin/activityWall/activity-wall-utils.js

window.ActivityWallUtils = {

    // ===== STATE MANAGEMENT =====
    isInitialized: false,
    performanceData: null,
    notificationSettings: null,

    // ===== BROWSER SUPPORT DETECTION =====
    browserSupport: {
        localStorage: false,
        clipboard: false,
        notifications: false,
        audioContext: false
    },

    // ===== INITIALIZATION =====

    init() {
        if (this.isInitialized) return;

        this.detectBrowserSupport();
        this.setupToastContainer();
        this.isInitialized = true;

        console.log('✅ Activity Wall Utils: Initialized with browser support:', this.browserSupport);
    },

    detectBrowserSupport() {
        // localStorage support
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            this.browserSupport.localStorage = true;
        } catch (e) {
            this.browserSupport.localStorage = false;
            console.warn('⚠️ localStorage not supported');
        }

        // Clipboard API support
        this.browserSupport.clipboard = !!navigator.clipboard;

        // Notifications support
        this.browserSupport.notifications = 'Notification' in window;

        // AudioContext support
        this.browserSupport.audioContext = !!(window.AudioContext || window.webkitAudioContext);
    },

    // ===== TOAST NOTIFICATIONS (IMPROVED) =====

    showToast(message, type = 'info', duration = 4000) {
        if (!message) return null;

        try {
            const toast = this.createToast(message, type, duration);
            const container = this.getToastContainer();
            container.appendChild(toast);

            // Use Bootstrap Toast if available
            if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
                const bsToast = new bootstrap.Toast(toast, { delay: duration });
                bsToast.show();

                toast.addEventListener('hidden.bs.toast', () => {
                    this.removeToast(toast);
                });

                return bsToast;
            } else {
                // Fallback implementation
                this.showFallbackToast(toast, duration);
                return toast;
            }
        } catch (error) {
            console.error('❌ Error showing toast:', error);
            // Ultimate fallback
            console.log(`[${type.toUpperCase()}] ${message}`);
            return null;
        }
    },

    createToast(message, type, duration) {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${this.getBootstrapTypeClass(type)} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        const iconClass = this.getToastIcon(type);

        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi ${iconClass} me-2"></i>
                    ${this.escapeHtml(message)}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                        data-bs-dismiss="toast" onclick="this.closest('.toast').remove()"></button>
            </div>
        `;

        return toast;
    },

    showFallbackToast(toast, duration) {
        toast.style.display = 'block';

        setTimeout(() => {
            this.removeToast(toast);
        }, duration);
    },

    removeToast(toast) {
        if (toast && toast.parentNode) {
            toast.style.transition = 'opacity 0.3s ease';
            toast.style.opacity = '0';

            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    },

    getToastContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            container.style.zIndex = '1080';
            document.body.appendChild(container);
        }
        return container;
    },

    setupToastContainer() {
        this.getToastContainer(); // Ensure container exists
    },

    getBootstrapTypeClass(type) {
        const typeMap = {
            'success': 'success',
            'error': 'danger',
            'warning': 'warning',
            'info': 'info'
        };
        return typeMap[type] || 'info';
    },

    getToastIcon(type) {
        const iconMap = {
            'success': 'bi-check-circle-fill',
            'error': 'bi-exclamation-triangle-fill',
            'warning': 'bi-exclamation-circle-fill',
            'info': 'bi-info-circle-fill'
        };
        return iconMap[type] || 'bi-info-circle-fill';
    },

    // ===== CLIPBOARD OPERATIONS (IMPROVED) =====

    async copyToClipboard(text) {
        if (!text) return false;

        try {
            // Modern Clipboard API
            if (this.browserSupport.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }

            // Fallback for older browsers
            return this.fallbackCopyToClipboard(text);

        } catch (error) {
            console.error('❌ Clipboard API failed:', error);
            return this.fallbackCopyToClipboard(text);
        }
    },

    fallbackCopyToClipboard(text) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            textArea.style.opacity = '0';

            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            return successful;
        } catch (error) {
            console.error('❌ Fallback copy failed:', error);
            return false;
        }
    },

    async copyActivityDetails(activityId) {
        if (!window.activityWallInstance) {
            this.showToast('Activity Wall не е инициализиран', 'error');
            return false;
        }

        const activity = window.activityWallInstance.activities.find(a => a.id == activityId);
        if (!activity) {
            this.showToast('Активността не е намерена', 'error');
            return false;
        }

        const details = this.formatActivityForCopy(activity);
        const success = await this.copyToClipboard(details);

        if (success) {
            this.showToast('Детайлите са копирани в клипборда', 'success');
        } else {
            this.showToast('Грешка при копирането', 'error');
        }

        return success;
    },

    formatActivityForCopy(activity) {
        const timestamp = new Date(activity.timestamp).toLocaleString('bg-BG');

        return `ACTIVITY DETAILS
═══════════════════
ID: ${activity.id}
Време: ${timestamp}
Потребител: ${activity.username || 'Анонимен'}
Действие: ${activity.action}
Тип съдържание: ${activity.entityType || 'N/A'}
ID на съдържанието: ${activity.entityId || 'N/A'}
IP адрес: ${activity.ipAddress || 'N/A'}
Детайли: ${activity.details || 'Няма детайли'}
User Agent: ${activity.userAgent || 'N/A'}
═══════════════════
Експортирано от SmolyanVote Activity Wall
${new Date().toLocaleString('bg-BG')}`;
    },

    // ===== FILE DOWNLOAD (IMPROVED) =====

    downloadAsFile(content, filename, mimeType = 'text/plain') {
        try {
            const blob = new Blob([content], { type: mimeType });
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = this.sanitizeFilename(filename);
            a.style.display = 'none';

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Clean up the URL object
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 100);

            return true;
        } catch (error) {
            console.error('❌ File download error:', error);
            this.showToast('Грешка при изтегляне на файла', 'error');
            return false;
        }
    },

    sanitizeFilename(filename) {
        // Remove invalid characters for filenames
        return filename.replace(/[<>:"/\\|?*]/g, '_');
    },

    downloadJSON(data, filename) {
        try {
            const jsonString = JSON.stringify(data, null, 2);
            const sanitizedFilename = filename.endsWith('.json') ? filename : filename + '.json';
            return this.downloadAsFile(jsonString, sanitizedFilename, 'application/json');
        } catch (error) {
            console.error('❌ JSON download error:', error);
            this.showToast('Грешка при експорт на JSON файла', 'error');
            return false;
        }
    },

    downloadCSV(activities, filename) {
        try {
            const headers = ['ID', 'Време', 'Потребител', 'Действие', 'Тип съдържание', 'ID на съдържанието', 'IP адрес', 'Детайли'];

            const csvContent = [
                headers.join(','),
                ...activities.map(activity => [
                    activity.id,
                    `"${new Date(activity.timestamp).toLocaleString('bg-BG')}"`,
                    `"${(activity.username || 'Анонимен').replace(/"/g, '""')}"`,
                    `"${activity.action.replace(/"/g, '""')}"`,
                    `"${(activity.entityType || 'N/A').replace(/"/g, '""')}"`,
                    activity.entityId || 'N/A',
                    `"${(activity.ipAddress || 'N/A').replace(/"/g, '""')}"`,
                    `"${(activity.details || 'Няма детайли').replace(/"/g, '""')}"`
                ].join(','))
            ].join('\n');

            const sanitizedFilename = filename.endsWith('.csv') ? filename : filename + '.csv';
            return this.downloadAsFile('\uFEFF' + csvContent, sanitizedFilename, 'text/csv;charset=utf-8');
        } catch (error) {
            console.error('❌ CSV download error:', error);
            this.showToast('Грешка при експорт на CSV файла', 'error');
            return false;
        }
    },

    // ===== HTML UTILITIES =====

    escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return String(unsafe);

        const div = document.createElement('div');
        div.textContent = unsafe;
        return div.innerHTML;
    },

    createElement(tag, className = '', content = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.innerHTML = content;
        return element;
    },

    // ===== TIME UTILITIES =====

    timeAgo(date) {
        try {
            const now = new Date();
            const inputDate = new Date(date);
            const diffInSeconds = Math.floor((now - inputDate) / 1000);

            if (diffInSeconds < 60) return 'преди малко';
            if (diffInSeconds < 3600) return `преди ${Math.floor(diffInSeconds / 60)} мин`;
            if (diffInSeconds < 86400) return `преди ${Math.floor(diffInSeconds / 3600)} ч`;
            if (diffInSeconds < 2592000) return `преди ${Math.floor(diffInSeconds / 86400)} дни`;

            return inputDate.toLocaleDateString('bg-BG');
        } catch (error) {
            console.error('❌ Error in timeAgo:', error);
            return 'неизвестно';
        }
    },

    formatDateTime(timestamp) {
        try {
            const date = new Date(timestamp);
            return date.toLocaleString('bg-BG', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            console.error('❌ Error formatting date:', error);
            return 'Невалидна дата';
        }
    },

    getTimeRangeDate(range) {
        const now = new Date();

        switch (range) {
            case '1h':
                return new Date(now - 60 * 60 * 1000);
            case '5h':
                return new Date(now - 5 * 60 * 60 * 1000);
            case '12h':
                return new Date(now - 12 * 60 * 60 * 1000);
            case '24h':
                return new Date(now - 24 * 60 * 60 * 1000);
            case '48h':
                return new Date(now - 48 * 60 * 60 * 1000);
            default:
                return null;
        }
    },

    // ===== VALIDATION UTILITIES =====

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    isValidIP(ip) {
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipv4Regex.test(ip);
    },

    // ===== ARRAY UTILITIES =====

    groupBy(array, key) {
        if (!Array.isArray(array)) return {};

        return array.reduce((groups, item) => {
            const group = item[key];
            if (!groups[group]) {
                groups[group] = [];
            }
            groups[group].push(item);
            return groups;
        }, {});
    },

    sortBy(array, key, direction = 'asc') {
        if (!Array.isArray(array)) return [];

        return array.slice().sort((a, b) => {
            let aVal = a[key];
            let bVal = b[key];

            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (direction === 'desc') {
                return bVal > aVal ? 1 : -1;
            }
            return aVal > bVal ? 1 : -1;
        });
    },

    // ===== EVENT UTILITIES =====

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // ===== DOM UTILITIES =====

    addSpinnerToButton(button) {
        if (!button) return null;

        const originalContent = button.innerHTML;
        const originalDisabled = button.disabled;

        button.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Зареждане...
        `;
        button.disabled = true;

        return () => {
            button.innerHTML = originalContent;
            button.disabled = originalDisabled;
        };
    },

    removeSpinnerFromButton(button, originalContent) {
        if (!button) return;
        button.innerHTML = originalContent;
        button.disabled = false;
    },

    // ===== STATISTICS UTILITIES =====

    calculatePercentage(value, total) {
        if (total === 0) return 0;
        return Math.round((value / total) * 100 * 100) / 100;
    },

    getTopItems(items, key, limit = 5) {
        if (!Array.isArray(items)) return [];

        const grouped = this.groupBy(items, key);
        const counts = Object.entries(grouped).map(([name, items]) => ({
            name,
            count: items.length
        }));

        return this.sortBy(counts, 'count', 'desc').slice(0, limit);
    },

    // ===== FILTER PERSISTENCE (SAFE) =====

    saveFilterState(filters) {
        if (!this.browserSupport.localStorage) {
            console.warn('⚠️ localStorage not supported, cannot save filter state');
            return false;
        }

        try {
            const filterState = {
                ...filters,
                timestamp: Date.now()
            };
            localStorage.setItem('activityWall_filters', JSON.stringify(filterState));
            return true;
        } catch (error) {
            console.error('❌ Failed to save filter state:', error);
            return false;
        }
    },

    loadFilterState() {
        if (!this.browserSupport.localStorage) {
            return null;
        }

        try {
            const saved = localStorage.getItem('activityWall_filters');
            if (!saved) return null;

            const filterState = JSON.parse(saved);

            // Check if saved state is not too old (max 24 hours)
            const maxAge = 24 * 60 * 60 * 1000;
            if (Date.now() - filterState.timestamp > maxAge) {
                this.clearFilterState();
                return null;
            }

            delete filterState.timestamp;
            return filterState;
        } catch (error) {
            console.error('❌ Failed to load filter state:', error);
            return null;
        }
    },

    clearFilterState() {
        if (!this.browserSupport.localStorage) return;

        try {
            localStorage.removeItem('activityWall_filters');
        } catch (error) {
            console.error('❌ Failed to clear filter state:', error);
        }
    },

    // ===== PERFORMANCE MONITORING (OPTIMIZED) =====

    startPerformanceMonitoring() {
        if (!this.browserSupport.audioContext) {
            console.warn('⚠️ Performance monitoring limited due to browser support');
        }

        this.performanceData = {
            apiCalls: [],
            websocketMetrics: {
                connectTime: null,
                messageCount: 0,
                errors: 0,
                lastPing: null
            },
            memoryUsage: [],
            renderTimes: []
        };

        // Monitor memory usage every 60 seconds (reduced frequency)
        this.performanceInterval = setInterval(() => {
            this.collectMemoryMetrics();
        }, 60000);

        console.log('✅ Performance monitoring started');
    },

    collectMemoryMetrics() {
        if (!performance.memory) return;

        try {
            this.performanceData.memoryUsage.push({
                timestamp: Date.now(),
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            });

            // Keep only last 50 measurements (reduced)
            if (this.performanceData.memoryUsage.length > 50) {
                this.performanceData.memoryUsage.shift();
            }

            this.checkMemoryUsage();
        } catch (error) {
            console.error('❌ Error collecting memory metrics:', error);
        }
    },

    trackAPICall(url, startTime, endTime, success) {
        if (!this.performanceData) return;

        const duration = endTime - startTime;

        this.performanceData.apiCalls.push({
            url,
            duration,
            success,
            timestamp: startTime
        });

        // Keep only last 20 API calls (reduced)
        if (this.performanceData.apiCalls.length > 20) {
            this.performanceData.apiCalls.shift();
        }

        // Alert on slow API calls (increased threshold)
        if (duration > 10000) { // 10 seconds
            this.showToast(`Бавна API заявка: ${url} (${Math.round(duration)}ms)`, 'warning');
        }

        return duration;
    },

    checkMemoryUsage() {
        const latest = this.performanceData.memoryUsage.slice(-3);
        if (latest.length < 3) return;

        const growth = latest[2].used - latest[0].used;
        const growthPercent = (growth / latest[0].used) * 100;

        // Alert if memory usage increased by more than 75% in last 3 measurements
        if (growthPercent > 75) {
            this.showToast('Засечено възможно изтичане на памет', 'warning');
        }
    },

    // ===== SMART NOTIFICATIONS (IMPROVED) =====

    setupSmartNotifications() {
        this.notificationSettings = {
            enabled: true,
            sound: this.browserSupport.audioContext,
            browser: this.browserSupport.notifications,
            patterns: {
                security: true,
                performance: true,
                errors: true
            }
        };

        // Request browser notification permission if supported
        if (this.browserSupport.notifications && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                this.notificationSettings.browser = permission === 'granted';
                console.log('🔔 Notification permission:', permission);
            });
        }

        console.log('✅ Smart notifications setup completed');
    },

    checkForCriticalEvents(newActivity) {
        if (!this.notificationSettings || !this.notificationSettings.enabled) return;

        const criticalActions = [
            'ADMIN_LOGIN',
            'BAN_USER',
            'DELETE_USER_CONTENT',
            'SUSPICIOUS_ACTIVITY',
            'CSRF_ATTACK_BLOCKED',
            'SYSTEM_MAINTENANCE'
        ];

        if (criticalActions.includes(newActivity.action)) {
            this.sendCriticalNotification(newActivity);
        }
    },

    sendCriticalNotification(activity) {
        const message = `Критично действие: ${this.formatActivityForNotification(activity)}`;

        // Toast notification
        this.showToast(message, 'error', 8000);

        // Sound notification (if supported and enabled)
        if (this.notificationSettings.sound && this.browserSupport.audioContext) {
            this.playNotificationSound();
        }

        // Browser notification (if supported and permitted)
        if (this.notificationSettings.browser && Notification.permission === 'granted') {
            try {
                new Notification('SmolyanVote Admin Alert', {
                    body: message,
                    icon: '/images/logo1.png',
                    tag: 'critical-activity',
                    requireInteraction: true
                });
            } catch (error) {
                console.error('❌ Browser notification error:', error);
            }
        }
    },

    formatActivityForNotification(activity) {
        return `${activity.username || 'Анонимен'} - ${activity.action}`;
    },

    playNotificationSound(type = 'critical') {
        if (!this.browserSupport.audioContext) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContext();

            const frequency = type === 'critical' ? 800 : 600;
            const duration = type === 'critical' ? 200 : 150;

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = 'square';

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);

            // Clean up
            setTimeout(() => {
                audioContext.close();
            }, duration + 100);
        } catch (error) {
            console.error('❌ Failed to play notification sound:', error);
        }
    },

    // ===== CLEANUP =====

    destroy() {
        console.log('🧹 Destroying Activity Wall Utils...');

        // Clear performance monitoring
        if (this.performanceInterval) {
            clearInterval(this.performanceInterval);
            this.performanceInterval = null;
        }

        // Clear data
        this.performanceData = null;
        this.notificationSettings = null;

        // Reset state
        this.isInitialized = false;

        console.log('✅ Activity Wall Utils destroyed');
    }
};

// ===== INTEGRATION WITH ACTIVITY WALL =====

// Safe copy activity details button handler
document.addEventListener('click', function(e) {
    if (e.target.id === 'copy-activity-details') {
        e.preventDefault();
        const modal = e.target.closest('.modal');
        if (modal) {
            const activityId = document.getElementById('modal-activity-id')?.textContent;
            if (activityId) {
                window.ActivityWallUtils.copyActivityDetails(activityId);
            }
        }
    }
});

// Global toast function for backward compatibility
if (!window.showToast) {
    window.showToast = function(message, type = 'info') {
        if (window.ActivityWallUtils && window.ActivityWallUtils.showToast) {
            window.ActivityWallUtils.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    };
}

// ===== SAFE AUTO-START =====
document.addEventListener('DOMContentLoaded', function() {
    try {
        window.ActivityWallUtils.init();

        if (document.getElementById('activity-wall')) {
            window.ActivityWallUtils.startPerformanceMonitoring();
            window.ActivityWallUtils.setupSmartNotifications();

            // Add required CSS for new features
            const style = document.createElement('style');
            style.id = 'activity-wall-utils-styles';
            style.textContent = `
                .activity-highlight {
                    background: rgba(255, 235, 59, 0.6) !important;
                    font-weight: bold !important;
                    border-radius: 3px;
                    padding: 1px 3px;
                }
                
                .search-match {
                    background: rgba(76, 175, 80, 0.1) !important;
                    border-left: 3px solid #4CAF50 !important;
                }
                
                .search-no-match {
                    opacity: 0.5;
                }
                
                .pattern-alert {
                    background: rgba(244, 67, 54, 0.1) !important;
                    border-left: 3px solid #f44336 !important;
                    animation: patternAlertPulse 2s infinite;
                }
                
                @keyframes patternAlertPulse {
                    0% { background: rgba(244, 67, 54, 0.1); }
                    50% { background: rgba(244, 67, 54, 0.2); }
                    100% { background: rgba(244, 67, 54, 0.1); }
                }
                
                .performance-warning {
                    border-left: 3px solid #ff9800 !important;
                    background: rgba(255, 152, 0, 0.1) !important;
                }
                
                .critical-notification {
                    animation: criticalAlert 1s ease-in-out 3;
                }
                
                @keyframes criticalAlert {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                
                .toast-container {
                    z-index: 9999 !important;
                }
            `;

            if (!document.getElementById('activity-wall-utils-styles')) {
                document.head.appendChild(style);
            }
        }
    } catch (error) {
        console.error('❌ Failed to initialize Activity Wall Utils:', error);
    }
});

// ===== ACTION TRANSLATIONS (SHARED) =====
window.ActivityWallUtils.actionTranslations = {
    // ===== АВТЕНТИКАЦИЯ =====
    'USER_LOGIN': 'Влезе в системата',
    'USER_LOGOUT': 'Излезе от системата',
    'USER_REGISTER': 'Регистрира се',
    'USER_PASSWORD_CHANGE': 'Смени паролата',
    'USER_EMAIL_VERIFY': 'Потвърди имейла',
    'USER_PASSWORD_RESET': 'Нулира паролата',

    // ===== СЪЗДАВАНЕ =====
    'CREATE_PUBLICATION': 'Създаде публикация',
    'CREATE_SIMPLE_EVENT': 'Създаде събитие',
    'CREATE_REFERENDUM': 'Създаде референдум',
    'CREATE_MULTI_POLL': 'Създаде анкета',
    'CREATE_COMMENT': 'Коментира',
    'CREATE_SIGNAL': 'Подаде сигнал',

    // ===== ВЗАИМОДЕЙСТВИЯ =====
    'LIKE_PUBLICATION': 'Хареса публикация',
    'DISLIKE_PUBLICATION': 'Не хареса публикация',
    'LIKE_COMMENT': 'Хареса коментар',
    'DISLIKE_COMMENT': 'Не хареса коментар',
    'VOTE_SIMPLE_EVENT': 'Гласува в събитие',
    'VOTE_REFERENDUM': 'Гласува в референдум',
    'VOTE_MULTI_POLL': 'Гласува в анкета',
    'SHARE_PUBLICATION': 'Сподели публикация',
    'BOOKMARK_CONTENT': 'Добави в отметки',
    'FOLLOW_USER': 'Последва потребител',
    'UNFOLLOW_USER': 'Спря да следва потребител',

    // ===== ПРЕГЛЕЖДАНЕ =====
    'VIEW_PUBLICATION': 'Прегледа публикация',
    'VIEW_EVENT': 'Прегледа събитие',
    'VIEW_REFERENDUM': 'Прегледа референдум',
    'VIEW_MULTI_POLL': 'Прегледа анкета',
    'VIEW_SIGNAL': 'Прегледа сигнал',
    'VIEW_PROFILE': 'Прегледа профил',
    'SEARCH_CONTENT': 'Търси съдържание',
    'FILTER_CONTENT': 'Филтрира съдържание',

    // ===== РЕДАКТИРАНЕ =====
    'EDIT_PUBLICATION': 'Редактира публикация',
    'EDIT_EVENT': 'Редактира събитие',
    'EDIT_REFERENDUM': 'Редактира референдум',
    'EDIT_MULTI_POLL': 'Редактира анкета',
    'EDIT_SIGNAL': 'Редактира сигнал',
    'EDIT_COMMENT': 'Редактира коментар',
    'EDIT_PROFILE': 'Редактира профил',

    // ===== ИЗТРИВАНЕ =====
    'DELETE_PUBLICATION': 'Изтри публикация',
    'DELETE_EVENT': 'Изтри събитие',
    'DELETE_REFERENDUM': 'Изтри референдум',
    'DELETE_COMMENT': 'Изтри коментар',
    'DELETE_SIGNAL': 'Изтри сигнал',

    // ===== ДОКЛАДВАНЕ =====
    'REPORT_PUBLICATION': 'Докладва публикация',
    'REPORT_EVENT': 'Докладва събитие',
    'REPORT_REFERENDUM': 'Докладва референдум',
    'REPORT_COMMENT': 'Докладва коментар',
    'REPORT_USER': 'Докладва потребител',

    // ===== АДМИНИСТРАЦИЯ =====
    'ADMIN_REVIEW_REPORT': 'Прегледа доклад',
    'ADMIN_DELETE_CONTENT': 'Изтри съдържание (админ)',
    'ADMIN_BAN_USER': 'Блокира потребител',
    'ADMIN_UNBAN_USER': 'Отблокира потребител',
    'ADMIN_PROMOTE_USER': 'Повиши потребител',
    'ADMIN_DEMOTE_USER': 'Понижи потребител',
    'CONTACT_MESSAGE': 'Съобщение до контакт',

    // ===== НАСТРОЙКИ =====
    'UPDATE_NOTIFICATIONS': 'Актуализира нотификации',
    'UPDATE_PRIVACY': 'Актуализира поверителност',
    'EXPORT_DATA': 'Експортира данни',
    'DELETE_ACCOUNT': 'Изтриване на акаунт',

    // ===== СИСТЕМА =====
    'SYSTEM_BACKUP': 'Системен backup',
    'SYSTEM_MAINTENANCE': 'Системна поддръжка',
    'API_ACCESS': 'API достъп'
};

// ===== HELPER METHOD =====
window.ActivityWallUtils.translateAction = function(action) {
    return this.actionTranslations[action] || action;
};


// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (window.ActivityWallUtils) {
        window.ActivityWallUtils.destroy();
    }
});

// Export for global access
window.ActivityWallUtils = window.ActivityWallUtils;