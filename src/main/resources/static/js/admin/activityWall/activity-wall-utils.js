// ====== ADMIN ACTIVITY WALL - UTILITIES ======
// Файл: js/activityWall/activity-wall-utils.js

window.ActivityWallUtils = {

    // ===== TOAST NOTIFICATIONS =====

    showToast(message, type = 'info', duration = 4000) {
        const toast = this.createToast(message, type, duration);
        const container = this.getToastContainer();
        container.appendChild(toast);

        // Initialize Bootstrap toast
        const bsToast = new bootstrap.Toast(toast, {
            delay: duration
        });
        bsToast.show();

        // Auto remove after shown
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

    // ===== MODAL MANAGEMENT =====

    createModal(id, title, content, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = id;
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', `${id}Label`);
        modal.setAttribute('aria-hidden', 'true');

        const size = options.size ? `modal-${options.size}` : '';
        const centered = options.centered ? 'modal-dialog-centered' : '';

        modal.innerHTML = `
            <div class="modal-dialog ${size} ${centered}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="${id}Label">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        return modal;
    },

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            return bsModal;
        }
        return null;
    },

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        }
    },

    // ===== UI HELPERS =====

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}д ${hours % 24}ч`;
        if (hours > 0) return `${hours}ч ${minutes % 60}м`;
        if (minutes > 0) return `${minutes}м ${seconds % 60}с`;
        return `${seconds}с`;
    },

    truncateText(text, maxLength = 100) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // ===== LOADING STATES =====

    showLoadingButton(buttonId, loadingText = 'Зареждане...') {
        const button = document.getElementById(buttonId);
        if (!button) return null;

        const originalContent = button.innerHTML;
        const originalDisabled = button.disabled;

        button.innerHTML = `<i class="bi bi-arrow-clockwise spin me-2"></i>${loadingText}`;
        button.disabled = true;

        return {
            restore: () => {
                button.innerHTML = originalContent;
                button.disabled = originalDisabled;
            }
        };
    },

    showLoadingSpinner(containerId, message = 'Зареждане...') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const originalContent = container.innerHTML;
        container.innerHTML = `
            <div class="text-center p-4">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div class="text-muted">${message}</div>
            </div>
        `;

        return {
            restore: () => {
                container.innerHTML = originalContent;
            }
        };
    },

    // ===== VALIDATION HELPERS =====

    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    isValidIP(ip) {
        const re = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return re.test(ip);
    },

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    // ===== DATE/TIME HELPERS =====

    formatRelativeTime(timestamp) {
        const now = new Date();
        const date = new Date(timestamp);
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return 'Сега';
        if (diffMins < 60) return `${diffMins}м`;
        if (diffHours < 24) return `${diffHours}ч`;
        if (diffDays < 7) return `${diffDays}д`;

        return date.toLocaleDateString('bg-BG');
    },

    formatFullDateTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('bg-BG') + ' ' +
            date.toLocaleTimeString('bg-BG', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
    },

    getDateRangeText(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        const startStr = start.toLocaleDateString('bg-BG');
        const endStr = end.toLocaleDateString('bg-BG');

        if (startStr === endStr) {
            return startStr;
        }

        return `${startStr} - ${endStr}`;
    },

    // ===== LOCAL STORAGE HELPERS =====

    setPreference(key, value) {
        try {
            localStorage.setItem(`activityWall_${key}`, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn('Failed to save preference:', error);
            return false;
        }
    },

    getPreference(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(`activityWall_${key}`);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn('Failed to load preference:', error);
            return defaultValue;
        }
    },

    removePreference(key) {
        try {
            localStorage.removeItem(`activityWall_${key}`);
            return true;
        } catch (error) {
            console.warn('Failed to remove preference:', error);
            return false;
        }
    },

    // ===== CLIPBOARD HELPERS =====

    async copyToClipboard(text) {
        if (!text) return false;

        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
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
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    },

    // ===== DOWNLOAD HELPERS =====

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

    downloadCSV(data, filename, headers = null) {
        let csvContent = '';

        // Add headers if provided
        if (headers) {
            csvContent += headers.join(',') + '\n';
        }

        // Add data rows
        data.forEach(row => {
            const csvRow = Array.isArray(row) ?
                row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',') :
                Object.values(row).map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
            csvContent += csvRow + '\n';
        });

        this.downloadAsFile(csvContent, filename, 'text/csv');
    },

    // ===== DEBOUNCE/THROTTLE =====

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
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // ===== CSS ANIMATIONS =====

    addCSSRule(selector, rules) {
        let stylesheet = document.getElementById('activity-wall-dynamic-styles');
        if (!stylesheet) {
            stylesheet = document.createElement('style');
            stylesheet.id = 'activity-wall-dynamic-styles';
            document.head.appendChild(stylesheet);
        }

        const rule = `${selector} { ${rules} }`;
        stylesheet.textContent += rule + '\n';
    },

    animateValue(element, start, end, duration = 1000) {
        if (!element) return;

        const startTime = performance.now();
        const difference = end - start;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = start + (difference * progress);

            element.textContent = Math.round(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    },

    // ===== INITIALIZATION =====

    init() {
        // Add utility CSS if not present
        if (!document.querySelector('#activity-wall-utils-styles')) {
            const style = document.createElement('style');
            style.id = 'activity-wall-utils-styles';
            style.textContent = `
                .spin {
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .fade-in {
                    animation: fadeIn 0.3s ease-in;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .slide-down {
                    animation: slideDown 0.3s ease-out;
                }
                
                @keyframes slideDown {
                    from { transform: translateY(-10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        console.log('✅ Activity Wall Utils initialized');
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.ActivityWallUtils.init();
});