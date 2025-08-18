// ====== ADMIN ACTIVITY WALL - UTILITIES ======
// Файл: src/main/resources/static/js/admin/activityWall/activity-wall-utils.js

window.ActivityWallUtils = {

    // ===== TOAST NOTIFICATIONS =====

    showToast(message, type = 'info', duration = 4000) {
        const toast = this.createToast(message, type, duration);
        const container = this.getToastContainer();
        container.appendChild(toast);

        const bsToast = new bootstrap.Toast(toast, {
            delay: duration
        });
        bsToast.show();

        toast.addEventListener('hidden.bs.toast', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });

        return bsToast;
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
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        return toast;
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

    // ===== CLIPBOARD OPERATIONS =====

    async copyToClipboard(text) {
        if (!text) return false;

        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                return successful;
            }
        } catch (error) {
            console.error('❌ Failed to copy to clipboard:', error);
            return false;
        }
    },

    async copyActivityDetails(activityId) {
        if (!window.activityWallInstance) return;

        const activity = window.activityWallInstance.activities.find(a => a.id == activityId);
        if (!activity) return;

        const details = this.formatActivityForCopy(activity);
        const success = await this.copyToClipboard(details);

        if (success) {
            this.showToast('Детайлите са копирани', 'success');
        } else {
            this.showToast('Грешка при копирането', 'error');
        }
    },

    formatActivityForCopy(activity) {
        return `ACTIVITY DETAILS
═══════════════════
ID: ${activity.id}
Време: ${new Date(activity.timestamp).toLocaleString('bg-BG')}
Потребител: ${activity.username || 'Анонимен'}
Действие: ${activity.action}
Тип съдържание: ${activity.entityType || 'N/A'}
ID на съдържанието: ${activity.entityId || 'N/A'}
IP адрес: ${activity.ipAddress || 'N/A'}
Детайли: ${activity.details || 'Няма детайли'}
User Agent: ${activity.userAgent || 'N/A'}
═══════════════════`;
    },

    // ===== FILE DOWNLOAD =====

    downloadAsFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    },

    downloadJSON(data, filename) {
        const jsonString = JSON.stringify(data, null, 2);
        this.downloadAsFile(jsonString, filename, 'application/json');
    },

    downloadCSV(activities, filename) {
        const headers = ['ID', 'Време', 'Потребител', 'Действие', 'Тип съдържание', 'ID на съдържанието', 'IP адрес', 'Детайли'];

        const csvContent = [
            headers.join(','),
            ...activities.map(activity => [
                activity.id,
                `"${new Date(activity.timestamp).toLocaleString('bg-BG')}"`,
                `"${activity.username || 'Анонимен'}"`,
                `"${activity.action}"`,
                `"${activity.entityType || 'N/A'}"`,
                activity.entityId || 'N/A',
                `"${activity.ipAddress || 'N/A'}"`,
                `"${(activity.details || 'Няма детайли').replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');

        this.downloadAsFile(csvContent, filename, 'text/csv;charset=utf-8');
    },

    // ===== HTML UTILITIES =====

    escapeHtml(unsafe) {
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
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'преди малко';
        if (diffInSeconds < 3600) return `преди ${Math.floor(diffInSeconds / 60)} мин`;
        if (diffInSeconds < 86400) return `преди ${Math.floor(diffInSeconds / 3600)} ч`;
        if (diffInSeconds < 2592000) return `преди ${Math.floor(diffInSeconds / 86400)} дни`;

        return date.toLocaleDateString('bg-BG');
    },

    formatDateTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('bg-BG', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
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
        const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
        return ipv4Regex.test(ip) || ipv6Regex.test(ip);
    },

    // ===== ARRAY UTILITIES =====

    groupBy(array, key) {
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

    // ===== MODAL UTILITIES =====

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            return bsModal;
        }
        return null;
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        }
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
        if (!button) return;

        const originalContent = button.innerHTML;
        button.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            Зареждане...
        `;
        button.disabled = true;

        return () => {
            button.innerHTML = originalContent;
            button.disabled = false;
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
        const grouped = this.groupBy(items, key);
        const counts = Object.entries(grouped).map(([name, items]) => ({
            name,
            count: items.length
        }));

        return this.sortBy(counts, 'count', 'desc').slice(0, limit);
    },

    // ===== SEARCH HIGHLIGHTING =====

    highlightSearchText(text, searchTerm) {
        if (!searchTerm || !text) return text;

        const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi');
        return text.replace(regex, '<mark class="activity-highlight">$1</mark>');
    },

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    highlightTableRows(searchTerm, searchType = 'user') {
        const tableBody = document.getElementById('activity-table-body');
        if (!tableBody) return;

        const rows = tableBody.querySelectorAll('tr[data-activity-id]');

        rows.forEach(row => {
            row.classList.remove('search-match', 'search-no-match');

            // Remove existing highlights
            const highlightedElements = row.querySelectorAll('.activity-highlight');
            highlightedElements.forEach(el => {
                el.outerHTML = el.innerHTML;
            });

            if (!searchTerm) return;

            let cellToCheck;
            if (searchType === 'user') {
                cellToCheck = row.querySelector('.col-user');
            } else if (searchType === 'ip') {
                cellToCheck = row.querySelector('.col-ip');
            }

            if (cellToCheck) {
                const cellText = cellToCheck.textContent.toLowerCase();
                const searchLower = searchTerm.toLowerCase();

                if (cellText.includes(searchLower)) {
                    row.classList.add('search-match');
                    // Apply highlighting
                    cellToCheck.innerHTML = this.highlightSearchText(cellToCheck.innerHTML, searchTerm);
                } else {
                    row.classList.add('search-no-match');
                }
            }
        });

        // Update search result count
        const matches = tableBody.querySelectorAll('.search-match').length;
        const total = rows.length;

        if (searchTerm && window.activityWallInstance) {
            this.showToast(`Намерени ${matches} от ${total} резултата`, 'info');
        }
    },

    clearSearchHighlights() {
        const tableBody = document.getElementById('activity-table-body');
        if (!tableBody) return;

        const rows = tableBody.querySelectorAll('tr[data-activity-id]');
        rows.forEach(row => {
            row.classList.remove('search-match', 'search-no-match');

            const highlightedElements = row.querySelectorAll('.activity-highlight');
            highlightedElements.forEach(el => {
                el.outerHTML = el.innerHTML;
            });
        });
    },

    // ===== FILTER PERSISTENCE =====

    saveFilterState(filters) {
        try {
            const filterState = {
                ...filters,
                timestamp: Date.now()
            };
            localStorage.setItem('activityWall_filters', JSON.stringify(filterState));
        } catch (error) {
            console.error('❌ Failed to save filter state:', error);
        }
    },

    loadFilterState() {
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
        try {
            localStorage.removeItem('activityWall_filters');
        } catch (error) {
            console.error('❌ Failed to clear filter state:', error);
        }
    },

    saveFilterPreset(name, filters) {
        try {
            const presets = this.getFilterPresets();
            presets[name] = {
                ...filters,
                created: Date.now()
            };
            localStorage.setItem('activityWall_presets', JSON.stringify(presets));
            this.showToast(`Филтър "${name}" е запазен`, 'success');
        } catch (error) {
            console.error('❌ Failed to save filter preset:', error);
        }
    },

    getFilterPresets() {
        try {
            const saved = localStorage.getItem('activityWall_presets');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('❌ Failed to load filter presets:', error);
            return {};
        }
    },

    getDefaultPresets() {
        return {
            'Security Events': {
                timeRange: '24h',
                action: 'FAILED_LOGIN',
                user: '',
                ip: '',
                entityType: ''
            },
            'Admin Actions': {
                timeRange: '24h',
                action: '',
                user: 'admin',
                ip: '',
                entityType: ''
            },
            'Recent Votes': {
                timeRange: '1h',
                action: 'VOTE_',
                user: '',
                ip: '',
                entityType: ''
            },
            'Last Hour Activity': {
                timeRange: '1h',
                action: '',
                user: '',
                ip: '',
                entityType: ''
            }
        };
    },

    // ===== PATTERN DETECTION =====

    analyzeActivities(activities) {
        const analysis = {
            suspiciousIPs: this.detectSuspiciousIPs(activities),
            botLikeUsers: this.detectBotLikeUsers(activities),
            bulkActions: this.detectBulkActions(activities),
            failedLogins: this.detectFailedLoginPatterns(activities),
            anomalies: this.detectAnomalies(activities)
        };

        return analysis;
    },

    detectSuspiciousIPs(activities) {
        const ipStats = this.groupBy(activities, 'ipAddress');
        const suspicious = [];

        Object.entries(ipStats).forEach(([ip, ipActivities]) => {
            if (!ip || ip === 'N/A') return;

            // Check for high frequency actions
            const actionsPerHour = ipActivities.length / this.getTimeSpanHours(ipActivities);
            const failedLogins = ipActivities.filter(a => a.action === 'FAILED_LOGIN').length;
            const differentUsers = new Set(ipActivities.map(a => a.username)).size;

            if (actionsPerHour > 100 || failedLogins > 10 || differentUsers > 5) {
                suspicious.push({
                    ip,
                    totalActions: ipActivities.length,
                    actionsPerHour: Math.round(actionsPerHour),
                    failedLogins,
                    differentUsers,
                    riskLevel: this.calculateRiskLevel(actionsPerHour, failedLogins, differentUsers)
                });
            }
        });

        return this.sortBy(suspicious, 'riskLevel', 'desc');
    },

    detectBotLikeUsers(activities) {
        const userStats = this.groupBy(activities, 'username');
        const suspicious = [];

        Object.entries(userStats).forEach(([username, userActivities]) => {
            if (!username || username === 'Анонимен') return;

            const actionsPerMinute = userActivities.length / this.getTimeSpanMinutes(userActivities);
            const actionTypes = new Set(userActivities.map(a => a.action)).size;
            const sameActionStreak = this.getLongestStreak(userActivities);

            if (actionsPerMinute > 10 || sameActionStreak > 20) {
                suspicious.push({
                    username,
                    totalActions: userActivities.length,
                    actionsPerMinute: Math.round(actionsPerMinute * 100) / 100,
                    actionTypes,
                    longestStreak: sameActionStreak,
                    riskLevel: this.calculateBotRiskLevel(actionsPerMinute, sameActionStreak)
                });
            }
        });

        return this.sortBy(suspicious, 'riskLevel', 'desc');
    },

    detectBulkActions(activities) {
        const timeGroups = this.groupActivitiesByTimeWindow(activities, 5); // 5 minute windows
        const bulkActions = [];

        timeGroups.forEach(group => {
            const actionCounts = this.groupBy(group, 'action');

            Object.entries(actionCounts).forEach(([action, actionActivities]) => {
                if (actionActivities.length > 15) { // More than 15 same actions in 5 minutes
                    bulkActions.push({
                        action,
                        count: actionActivities.length,
                        timeWindow: this.formatTimeWindow(group[0].timestamp, group[group.length - 1].timestamp),
                        users: new Set(actionActivities.map(a => a.username)).size,
                        ips: new Set(actionActivities.map(a => a.ipAddress)).size
                    });
                }
            });
        });

        return this.sortBy(bulkActions, 'count', 'desc');
    },

    detectFailedLoginPatterns(activities) {
        const failedLogins = activities.filter(a => a.action === 'FAILED_LOGIN');
        const patterns = [];

        // Group by IP
        const ipGroups = this.groupBy(failedLogins, 'ipAddress');
        Object.entries(ipGroups).forEach(([ip, attempts]) => {
            if (attempts.length > 5) {
                patterns.push({
                    type: 'IP Brute Force',
                    identifier: ip,
                    attempts: attempts.length,
                    timeSpan: this.getTimeSpan(attempts),
                    users: new Set(attempts.map(a => a.username)).size
                });
            }
        });

        // Group by user
        const userGroups = this.groupBy(failedLogins, 'username');
        Object.entries(userGroups).forEach(([username, attempts]) => {
            if (attempts.length > 3) {
                patterns.push({
                    type: 'User Account Attack',
                    identifier: username,
                    attempts: attempts.length,
                    timeSpan: this.getTimeSpan(attempts),
                    ips: new Set(attempts.map(a => a.ipAddress)).size
                });
            }
        });

        return this.sortBy(patterns, 'attempts', 'desc');
    },

    detectAnomalies(activities) {
        const anomalies = [];

        // Detect off-hours activity
        const offHoursActivity = activities.filter(a => {
            const hour = new Date(a.timestamp).getHours();
            return hour < 6 || hour > 22; // Outside 6 AM - 10 PM
        });

        if (offHoursActivity.length > 10) {
            anomalies.push({
                type: 'Off-hours Activity',
                count: offHoursActivity.length,
                description: 'Необичайна активност извън работното време'
            });
        }

        // Detect admin actions by non-admin users
        const adminActions = activities.filter(a =>
            a.action.includes('ADMIN_') ||
            a.action.includes('BAN_') ||
            a.action.includes('MODERATE_')
        );

        const nonAdminActions = adminActions.filter(a =>
            !a.username?.toLowerCase().includes('admin')
        );

        if (nonAdminActions.length > 0) {
            anomalies.push({
                type: 'Admin Actions by Non-Admin',
                count: nonAdminActions.length,
                description: 'Админ действия от не-админ потребители'
            });
        }

        return anomalies;
    },

    // Pattern detection helpers
    getTimeSpanHours(activities) {
        if (activities.length < 2) return 1;
        const timestamps = activities.map(a => new Date(a.timestamp).getTime());
        const span = (Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60 * 60);
        return Math.max(span, 0.1); // Minimum 0.1 hour
    },

    getTimeSpanMinutes(activities) {
        if (activities.length < 2) return 1;
        const timestamps = activities.map(a => new Date(a.timestamp).getTime());
        const span = (Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60);
        return Math.max(span, 1); // Minimum 1 minute
    },

    getLongestStreak(activities) {
        if (activities.length === 0) return 0;

        let maxStreak = 1;
        let currentStreak = 1;

        for (let i = 1; i < activities.length; i++) {
            if (activities[i].action === activities[i-1].action) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 1;
            }
        }

        return maxStreak;
    },

    groupActivitiesByTimeWindow(activities, windowMinutes) {
        const groups = [];
        const windowMs = windowMinutes * 60 * 1000;

        const sorted = this.sortBy(activities, 'timestamp', 'asc');
        let currentGroup = [];
        let groupStartTime = null;

        sorted.forEach(activity => {
            const activityTime = new Date(activity.timestamp).getTime();

            if (!groupStartTime || (activityTime - groupStartTime) > windowMs) {
                if (currentGroup.length > 0) {
                    groups.push(currentGroup);
                }
                currentGroup = [activity];
                groupStartTime = activityTime;
            } else {
                currentGroup.push(activity);
            }
        });

        if (currentGroup.length > 0) {
            groups.push(currentGroup);
        }

        return groups;
    },

    calculateRiskLevel(actionsPerHour, failedLogins, differentUsers) {
        let risk = 0;

        if (actionsPerHour > 200) risk += 3;
        else if (actionsPerHour > 100) risk += 2;
        else if (actionsPerHour > 50) risk += 1;

        if (failedLogins > 20) risk += 3;
        else if (failedLogins > 10) risk += 2;
        else if (failedLogins > 5) risk += 1;

        if (differentUsers > 10) risk += 2;
        else if (differentUsers > 5) risk += 1;

        return Math.min(risk, 5); // Max risk level 5
    },

    calculateBotRiskLevel(actionsPerMinute, longestStreak) {
        let risk = 0;

        if (actionsPerMinute > 20) risk += 3;
        else if (actionsPerMinute > 10) risk += 2;
        else if (actionsPerMinute > 5) risk += 1;

        if (longestStreak > 50) risk += 3;
        else if (longestStreak > 20) risk += 2;
        else if (longestStreak > 10) risk += 1;

        return Math.min(risk, 5);
    },

    getTimeSpan(activities) {
        if (activities.length < 2) return 'N/A';

        const timestamps = activities.map(a => new Date(a.timestamp));
        const start = new Date(Math.min(...timestamps));
        const end = new Date(Math.max(...timestamps));
        const diffMinutes = (end - start) / (1000 * 60);

        if (diffMinutes < 60) {
            return `${Math.round(diffMinutes)} мин`;
        } else {
            return `${Math.round(diffMinutes / 60)} ч`;
        }
    },

    formatTimeWindow(startTimestamp, endTimestamp) {
        const start = new Date(startTimestamp);
        const end = new Date(endTimestamp);
        return `${start.toLocaleTimeString('bg-BG')} - ${end.toLocaleTimeString('bg-BG')}`;
    },

    // ===== PERFORMANCE MONITORING =====

    startPerformanceMonitoring() {
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

        // Monitor memory usage every 30 seconds
        setInterval(() => {
            if (performance.memory) {
                this.performanceData.memoryUsage.push({
                    timestamp: Date.now(),
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                });

                // Keep only last 100 measurements
                if (this.performanceData.memoryUsage.length > 100) {
                    this.performanceData.memoryUsage.shift();
                }

                // Check for memory leaks
                this.checkMemoryUsage();
            }
        }, 30000);
    },

    trackAPICall(url, startTime, endTime, success) {
        const duration = endTime - startTime;

        this.performanceData.apiCalls.push({
            url,
            duration,
            success,
            timestamp: startTime
        });

        // Keep only last 50 API calls
        if (this.performanceData.apiCalls.length > 50) {
            this.performanceData.apiCalls.shift();
        }

        // Alert on slow API calls
        if (duration > 5000) { // 5 seconds
            this.showToast(`Бавна API заявка: ${url} (${duration}ms)`, 'warning');
        }

        return duration;
    },

    trackWebSocketMetrics(eventType, data = {}) {
        const metrics = this.performanceData.websocketMetrics;

        switch (eventType) {
            case 'connect':
                metrics.connectTime = Date.now();
                break;
            case 'message':
                metrics.messageCount++;
                break;
            case 'error':
                metrics.errors++;
                break;
            case 'ping':
                metrics.lastPing = Date.now();
                break;
        }
    },

    trackRenderTime(startTime, endTime, operation) {
        const duration = endTime - startTime;

        this.performanceData.renderTimes.push({
            operation,
            duration,
            timestamp: startTime
        });

        // Keep only last 20 render measurements
        if (this.performanceData.renderTimes.length > 20) {
            this.performanceData.renderTimes.shift();
        }

        // Alert on slow renders
        if (duration > 1000) { // 1 second
            this.showToast(`Бавно рендериране: ${operation} (${duration}ms)`, 'warning');
        }
    },

    checkMemoryUsage() {
        const latest = this.performanceData.memoryUsage.slice(-5);
        if (latest.length < 5) return;

        const growth = latest[4].used - latest[0].used;
        const growthPercent = (growth / latest[0].used) * 100;

        // Alert if memory usage increased by more than 50% in last 5 measurements
        if (growthPercent > 50) {
            this.showToast('Възможно изтичане на памет', 'warning');
        }
    },

    getPerformanceReport() {
        const apiCalls = this.performanceData.apiCalls;
        const avgAPITime = apiCalls.length > 0 ?
            apiCalls.reduce((sum, call) => sum + call.duration, 0) / apiCalls.length : 0;

        const renders = this.performanceData.renderTimes;
        const avgRenderTime = renders.length > 0 ?
            renders.reduce((sum, render) => sum + render.duration, 0) / renders.length : 0;

        return {
            apiMetrics: {
                totalCalls: apiCalls.length,
                averageTime: Math.round(avgAPITime),
                slowCalls: apiCalls.filter(call => call.duration > 3000).length,
                failedCalls: apiCalls.filter(call => !call.success).length
            },
            websocketMetrics: this.performanceData.websocketMetrics,
            renderMetrics: {
                totalRenders: renders.length,
                averageTime: Math.round(avgRenderTime),
                slowRenders: renders.filter(render => render.duration > 500).length
            },
            memoryMetrics: this.getMemoryMetrics()
        };
    },

    getMemoryMetrics() {
        const usage = this.performanceData.memoryUsage;
        if (usage.length === 0) return null;

        const latest = usage[usage.length - 1];
        const usagePercent = (latest.used / latest.limit) * 100;

        return {
            currentUsage: Math.round(latest.used / 1048576), // MB
            totalAvailable: Math.round(latest.limit / 1048576), // MB
            usagePercent: Math.round(usagePercent),
            trend: usage.length > 1 ?
                (latest.used > usage[usage.length - 2].used ? 'увеличава се' : 'намалява') : 'стабилна'
        };
    },

    // ===== SMART NOTIFICATIONS =====

    setupSmartNotifications() {
        this.notificationSettings = {
            enabled: true,
            sound: true,
            browser: true,
            patterns: {
                security: true,
                performance: true,
                errors: true
            }
        };

        // Request browser notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    },

    checkForCriticalEvents(newActivity) {
        if (!this.notificationSettings.enabled) return;

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

        // Check for patterns
        if (window.activityWallInstance) {
            const recentActivities = window.activityWallInstance.activities.slice(0, 20);
            this.checkActivityPatterns(recentActivities);
        }
    },

    sendCriticalNotification(activity) {
        const message = `Критично действие: ${this.formatActivityForNotification(activity)}`;

        // Toast notification
        this.showToast(message, 'error');

        // Sound notification
        if (this.notificationSettings.sound) {
            this.playNotificationSound();
        }

        // Browser notification
        if (this.notificationSettings.browser && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('SmolyanVote Admin Alert', {
                body: message,
                icon: '/images/logo1.png',
                tag: 'critical-activity'
            });
        }
    },

    checkActivityPatterns(activities) {
        // Check for rapid failed logins
        const recentFailedLogins = activities.filter(a =>
            a.action === 'FAILED_LOGIN' &&
            new Date(a.timestamp) > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        );

        if (recentFailedLogins.length > 5) {
            this.sendPatternAlert('Множество неуспешни опити за влизане', recentFailedLogins.length);
        }

        // Check for bulk deletions
        const recentDeletions = activities.filter(a =>
            a.action.includes('DELETE') &&
            new Date(a.timestamp) > new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
        );

        if (recentDeletions.length > 10) {
            this.sendPatternAlert('Масово изтриване на съдържание', recentDeletions.length);
        }
    },

    sendPatternAlert(pattern, count) {
        const message = `Открит модел: ${pattern} (${count} действия)`;

        this.showToast(message, 'warning');

        if (this.notificationSettings.sound) {
            this.playNotificationSound('warning');
        }
    },

    playNotificationSound(type = 'critical') {
        try {
            const frequency = type === 'critical' ? 800 : 600;
            const duration = type === 'critical' ? 200 : 150;

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
        } catch (error) {
            console.error('❌ Failed to play notification sound:', error);
        }
    },

    formatActivityForNotification(activity) {
        return `${activity.username || 'Анонимен'} - ${this.formatActionText(activity.action)}`;
    },

    formatActionText(action) {
        const actionMap = {
            'ADMIN_LOGIN': 'Админ вход',
            'BAN_USER': 'Блокира потребител',
            'DELETE_USER_CONTENT': 'Изтри потребителско съдържание',
            'SUSPICIOUS_ACTIVITY': 'Подозрителна активност',
            'CSRF_ATTACK_BLOCKED': 'Блокирана CSRF атака',
            'SYSTEM_MAINTENANCE': 'Системна поддръжка'
        };

        return actionMap[action] || action;
    }

};

// ===== INTEGRATION WITH ACTIVITY WALL =====

// Copy activity details button handler
document.addEventListener('click', function(e) {
    if (e.target.id === 'copy-activity-details') {
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
        window.ActivityWallUtils.showToast(message, type);
    };
}

// Auto-start performance monitoring and notifications
document.addEventListener('DOMContentLoaded', function() {
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
        `;
        document.head.appendChild(style);
    }
});

// Hook into ActivityWall events for smart monitoring
if (window.activityWallInstance) {
    const originalAddNewActivity = window.activityWallInstance.addNewActivity;
    window.activityWallInstance.addNewActivity = function(activity, isRealTime) {
        // Call original method
        originalAddNewActivity.call(this, activity, isRealTime);

        // Check for critical events
        if (isRealTime) {
            window.ActivityWallUtils.checkForCriticalEvents(activity);
        }
    };
}