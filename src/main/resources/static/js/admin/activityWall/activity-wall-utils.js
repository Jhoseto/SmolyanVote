// ====== ADMIN ACTIVITY WALL - PROFESSIONAL UTILS ======
// File: src/main/resources/static/js/admin/activityWall/activity-wall-utils.js

window.ActivityWallUtils = {
    isInitialized: false,
    toastContainer: null,
    performanceMonitor: null,
    audioContext: null,
    notificationSettings: {
        enabled: true,
        sound: true,
        position: 'top-end',
        duration: 4000
    },

    // Browser capability detection
    capabilities: {
        localStorage: false,
        clipboard: false,
        notifications: false,
        audioContext: false,
        webWorkers: false,
        offlineStorage: false
    },

    // Initialize utilities
    init() {
        if (this.isInitialized) return;

        this.detectCapabilities();
        this.setupToastSystem();
        this.loadSettings();
        this.initPerformanceMonitor();
        this.isInitialized = true;
    },

    // Detect browser capabilities
    detectCapabilities() {
        // localStorage support
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            this.capabilities.localStorage = true;
        } catch (e) {
            this.capabilities.localStorage = false;
        }

        // Clipboard API support
        this.capabilities.clipboard = !!(navigator.clipboard && navigator.clipboard.writeText);

        // Notifications support
        this.capabilities.notifications = 'Notification' in window;

        // AudioContext support
        this.capabilities.audioContext = !!(window.AudioContext || window.webkitAudioContext);

        // Web Workers support
        this.capabilities.webWorkers = typeof Worker !== 'undefined';

        // IndexedDB support
        this.capabilities.offlineStorage = 'indexedDB' in window;
    },

    // Setup toast notification system
    setupToastSystem() {
        if (this.toastContainer) return;

        this.toastContainer = document.createElement('div');
        this.toastContainer.className = 'toast-container position-fixed p-3';
        this.toastContainer.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            pointer-events: none;
        `;
        document.body.appendChild(this.toastContainer);
    },

    // Show professional toast notification
    showToast(message, type = 'info', duration = null) {
        if (!this.toastContainer) this.setupToastSystem();

        const toastId = 'toast_' + Date.now();
        const actualDuration = duration || this.notificationSettings.duration;

        const icons = {
            success: 'bi-check-circle-fill',
            error: 'bi-exclamation-triangle-fill',
            warning: 'bi-exclamation-circle-fill',
            info: 'bi-info-circle-fill'
        };

        const colors = {
            success: 'text-bg-success',
            error: 'text-bg-danger',
            warning: 'text-bg-warning',
            info: 'text-bg-primary'
        };

        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast align-items-center ${colors[type]} border-0`;
        toast.style.cssText = `
            pointer-events: auto;
            margin-bottom: 0.5rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
            backdrop-filter: blur(10px);
            border-radius: 12px;
        `;

        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center">
                    <i class="bi ${icons[type]} me-2"></i>
                    <span>${this.escapeHtml(message)}</span>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                        onclick="ActivityWallUtils.hideToast('${toastId}')"></button>
            </div>
        `;

        this.toastContainer.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

            requestAnimationFrame(() => {
                toast.style.transform = 'translateX(0)';
            });
        });

        // Auto hide
        setTimeout(() => this.hideToast(toastId), actualDuration);

        // Play sound notification
        if (this.notificationSettings.sound && type !== 'info') {
            this.playNotificationSound(type);
        }

        return toastId;
    },

    // Hide specific toast
    hideToast(toastId) {
        const toast = document.getElementById(toastId);
        if (!toast) return;

        toast.style.transition = 'transform 0.2s ease-in, opacity 0.2s ease-in';
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 200);
    },

    // Play subtle notification sound
    playNotificationSound(type) {
        if (!this.capabilities.audioContext || !this.notificationSettings.sound) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Different tones for different types
            const frequencies = {
                success: 800,
                error: 400,
                warning: 600,
                info: 500
            };

            oscillator.frequency.setValueAtTime(frequencies[type] || 500, audioContext.currentTime);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);

            setTimeout(() => audioContext.close(), 200);
        } catch (error) {
            // Silent fail for audio issues
        }
    },

    // Copy to clipboard with feedback
    async copyToClipboard(text, feedbackMessage = 'Копирано в клипборда') {
        if (!this.capabilities.clipboard) {
            this.showToast('Клипбордът не е поддържан от браузъра', 'error');
            return false;
        }

        try {
            await navigator.clipboard.writeText(text);
            this.showToast(feedbackMessage, 'success');
            return true;
        } catch (error) {
            console.error('Clipboard copy failed:', error);
            this.showToast('Грешка при копиране', 'error');
            return false;
        }
    },

    // Format data for export
    formatDataForExport(activities, format = 'csv') {
        switch (format.toLowerCase()) {
            case 'csv':
                return this.formatAsCSV(activities);
            case 'json':
                return this.formatAsJSON(activities);
            case 'excel':
                return this.formatAsExcel(activities);
            default:
                return this.formatAsCSV(activities);
        }
    },

    // Format as CSV
    formatAsCSV(activities) {
        const headers = [
            'ID', 'Време', 'Потребител', 'Действие', 'Тип обект',
            'Детайли', 'IP адрес', 'User Agent'
        ];

        const rows = activities.map(activity => [
            activity.id,
            new Date(activity.timestamp).toLocaleString('bg-BG'),
            activity.username || 'Система',
            this.translateAction(activity.action),
            activity.entityType || '',
            this.cleanForCSV(activity.details || ''),
            activity.ipAddress || '',
            this.cleanForCSV(activity.userAgent || '')
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => this.escapeCSVField(field)).join(','))
            .join('\n');

        return csvContent;
    },

    // Format as JSON
    formatAsJSON(activities) {
        return JSON.stringify(activities.map(activity => ({
            id: activity.id,
            timestamp: activity.timestamp,
            username: activity.username,
            action: activity.action,
            actionTranslated: this.translateAction(activity.action),
            entityType: activity.entityType,
            entityId: activity.entityId,
            details: activity.details,
            ipAddress: activity.ipAddress,
            userAgent: activity.userAgent
        })), null, 2);
    },

    // Download data as file
    downloadData(data, filename, mimeType = 'text/csv') {
        const blob = new Blob([data], { type: mimeType + ';charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    },

    formatAsExcel(activities) {
        return this.formatAsCSV(activities); // Excel reads CSV format
    },

    // Performance monitoring
    initPerformanceMonitor() {
        if (!performance || !performance.now) return;

        this.performanceMonitor = {
            startTime: performance.now(),
            metrics: {
                memoryUsage: 0,
                renderTime: 0,
                apiCalls: 0,
                errors: 0
            }
        };

        // Monitor memory usage if available
        if (performance.memory) {
            setInterval(() => {
                this.performanceMonitor.metrics.memoryUsage = performance.memory.usedJSHeapSize;
            }, 10000);
        }
    },

    // Measure operation performance
    measurePerformance(operation, callback) {
        if (!this.performanceMonitor) return callback();

        const startTime = performance.now();
        const result = callback();
        const endTime = performance.now();

        this.performanceMonitor.metrics.renderTime = endTime - startTime;

        return result;
    },

    // Throttle function calls
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

    // Debounce function calls
    debounce(func, delay) {
        let timeoutId;
        return function() {
            const args = arguments;
            const context = this;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(context, args), delay);
        };
    },

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Format date/time
    formatDateTime(date, format = 'full') {
        // Parse Java LocalDateTime array or regular date
        const d = Array.isArray(date)
            ? new Date(
                date[0],                               // year
                date[1] - 1,                          // month (Java 1-12 -> JS 0-11)
                date[2],                              // day
                date[3] || 0,                         // hour
                date[4] || 0,                         // minute
                date[5] || 0,                         // second
                Math.floor((date[6] || 0) / 1000000)  // nano to milliseconds
            )
            : new Date(date);

        switch (format) {
            case 'date':
                return d.toLocaleDateString('bg-BG');
            case 'time':
                return d.toLocaleTimeString('bg-BG');
            case 'short':
                return d.toLocaleDateString('bg-BG') + ' ' + d.toLocaleTimeString('bg-BG', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            case 'relative':
                return this.getRelativeTime(d);
            default:
                return d.toLocaleString('bg-BG');
        }
    },

    // Get relative time (e.g., "2 минути назад")
    getRelativeTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSeconds < 60) return 'Току-що';
        if (diffMinutes < 60) return `${diffMinutes} минути назад`;
        if (diffHours < 24) return `${diffHours} часа назад`;
        if (diffDays < 7) return `${diffDays} дни назад`;

        return date.toLocaleDateString('bg-BG');
    },

    // Validate data
    validateActivityData(activity) {
        const required = ['id', 'timestamp', 'action'];
        return required.every(field => activity.hasOwnProperty(field) && activity[field] !== null);
    },

    // Generate activity summary
    generateActivitySummary(activities) {
        const totalActivities = activities.length;
        const uniqueUsers = new Set(activities.map(a => a.username).filter(Boolean)).size;
        const uniqueIPs = new Set(activities.map(a => a.ipAddress).filter(Boolean)).size;

        const actionCounts = {};
        activities.forEach(activity => {
            actionCounts[activity.action] = (actionCounts[activity.action] || 0) + 1;
        });

        const topAction = Object.entries(actionCounts)
            .sort(([,a], [,b]) => b - a)[0];

        const timeRange = activities.length > 0 ? {
            earliest: new Date(Math.min(...activities.map(a => new Date(a.timestamp)))),
            latest: new Date(Math.max(...activities.map(a => new Date(a.timestamp))))
        } : null;

        return {
            totalActivities,
            uniqueUsers,
            uniqueIPs,
            topAction: topAction ? {
                action: topAction[0],
                count: topAction[1],
                translated: this.translateAction(topAction[0])
            } : null,
            timeRange,
            generatedAt: new Date()
        };
    },

    // Settings management
    loadSettings() {
        if (!this.capabilities.localStorage) return;

        try {
            const saved = localStorage.getItem('activityWall_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.notificationSettings = { ...this.notificationSettings, ...settings };
            }
        } catch (error) {
            // Silent fail for settings load
        }
    },

    saveSettings() {
        if (!this.capabilities.localStorage) return;

        try {
            localStorage.setItem('activityWall_settings', JSON.stringify(this.notificationSettings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    },

    updateSettings(newSettings) {
        this.notificationSettings = { ...this.notificationSettings, ...newSettings };
        this.saveSettings();
    },

    // Utility helper functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    escapeCSVField(field) {
        const str = String(field);
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    },

    cleanForCSV(text) {
        return String(text)
            .replace(/[\r\n]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    },

    translateAction(action) {
        const translations = {
            'CREATE_PUBLICATION': 'Създаде публикация',
            'CREATE_SIMPLE_EVENT': 'Създаде събитие',
            'CREATE_REFERENDUM': 'Създаде референдум',
            'CREATE_MULTI_POLL': 'Създаде анкета',
            'CREATE_COMMENT': 'Коментира',
            'CREATE_SIGNAL': 'Създаде сигнал',
            'LIKE_PUBLICATION': 'Хареса публикация',
            'DISLIKE_PUBLICATION': 'Не хареса публикация',
            'LIKE_COMMENT': 'Хареса коментар',
            'DISLIKE_COMMENT': 'Не хареса коментар',
            'VOTE_SIMPLE_EVENT': 'Гласува в събитие',
            'VOTE_REFERENDUM': 'Гласува в референдум',
            'VOTE_MULTI_POLL': 'Гласува в анкета',
            'SHARE_PUBLICATION': 'Сподели публикация',
            'SHARE_EVENT': 'Сподели събитие',
            'SHARE_REFERENDUM': 'Сподели референдум',
            'BOOKMARK_CONTENT': 'Добави в отметки',
            'FOLLOW_USER': 'Последва потребител',
            'UNFOLLOW_USER': 'Спря да следва потребител',
            'VIEW_PUBLICATION': 'Прегледа публикация',
            'VIEW_EVENT': 'Прегледа събитие',
            'VIEW_REFERENDUM': 'Прегледа референдум',
            'VIEW_MULTI_POLL': 'Прегледа множествена анкета',
            'VIEW_SIGNAL': 'Прегледа сигнал',
            'VIEW_PROFILE': 'Прегледа профил',
            'SEARCH_CONTENT': 'Търсене в съдържанието',
            'FILTER_CONTENT': 'Филтриране на съдържание',
            'EDIT_PUBLICATION': 'Редактира публикация',
            'EDIT_EVENT': 'Редактира събитие',
            'EDIT_REFERENDUM': 'Редактира референдум',
            'EDIT_MULTI_POLL': 'Редактира множествена анкета',
            'EDIT_SIGNAL': 'Редактира сигнал',
            'EDIT_COMMENT': 'Редактира коментар',
            'EDIT_PROFILE': 'Редактира профил',
            'DELETE_PUBLICATION': 'Изтри публикация',
            'DELETE_EVENT': 'Изтри събитие',
            'DELETE_REFERENDUM': 'Изтри референдум',
            'DELETE_COMMENT': 'Изтри коментар',
            'DELETE_SIGNAL': 'Изтри сигнал',
            'REPORT_PUBLICATION': 'Докладва публикация',
            'REPORT_EVENT': 'Докладва събитие',
            'REPORT_REFERENDUM': 'Докладва референдум',
            'REPORT_COMMENT': 'Докладва коментар',
            'REPORT_USER': 'Докладва потребител',
            'ADMIN_REVIEW_REPORT': 'Прегледа доклад',
            'ADMIN_DELETE_CONTENT': 'Изтри съдържание (админ)',
            'ADMIN_BAN_USER': 'Блокира потребител',
            'ADMIN_UNBAN_USER': 'Отблокира потребител',
            'ADMIN_PROMOTE_USER': 'Повиши потребител',
            'ADMIN_DEMOTE_USER': 'Понижи потребител',
            'CONTACT_MESSAGE': 'Съобщение до контакт',
            'USER_REGISTER': 'Регистрация',
            'USER_LOGIN': 'Вход в системата',
            'USER_LOGOUT': 'Изход от системата',
            'USER_PASSWORD_CHANGE': 'Смяна на парола',
            'USER_EMAIL_VERIFY': 'Потвърждение на имейл',
            'USER_PASSWORD_RESET': 'Нулиране на парола',
            'UPDATE_NOTIFICATIONS': 'Актуализира нотификации',
            'UPDATE_PRIVACY': 'Актуализира поверителност',
            'EXPORT_DATA': 'Експортира данни',
            'DELETE_ACCOUNT': 'Изтриване на акаунт',
            'SYSTEM_BACKUP': 'Системен backup',
            'SYSTEM_MAINTENANCE': 'Системна поддръжка',
            'API_ACCESS': 'API достъп'
        };

        return translations[action] || action?.replace(/_/g, ' ').toLowerCase() || 'Неизвестно действие';
    },

    // Performance helpers
    isHighPerformanceDevice() {
        return navigator.hardwareConcurrency >= 4 &&
            (performance.memory ? performance.memory.jsHeapSizeLimit > 1000000000 : true);
    },

    // Get system information
    getSystemInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onlineStatus: navigator.onLine,
            screenResolution: `${screen.width}x${screen.height}`,
            colorDepth: screen.colorDepth,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            capabilities: this.capabilities,
            performance: this.performanceMonitor?.metrics
        };
    },

    // Cleanup resources
    destroy() {
        if (this.toastContainer && this.toastContainer.parentNode) {
            this.toastContainer.parentNode.removeChild(this.toastContainer);
        }

        if (this.audioContext) {
            this.audioContext.close();
        }

        this.performanceMonitor = null;
        this.isInitialized = false;
    }
};

// Auto initialization
document.addEventListener('DOMContentLoaded', function() {
    window.ActivityWallUtils.init();
});

// Global cleanup
window.addEventListener('beforeunload', function() {
    if (window.ActivityWallUtils) {
        window.ActivityWallUtils.destroy();
    }
});

// Export for global access and backwards compatibility
window.showToast = function(message, type = 'info') {
    return window.ActivityWallUtils.showToast(message, type);
};