/**
 * 🔔 NOTIFICATION SYSTEM
 * Минимален код - максимална функционалност
 */

class NotificationSystem {
    constructor() {
        this.ws = null;
        this.unreadCount = 0;
        this.notifications = [];
        this.isDropdownOpen = false;
        this.init();
    }

    init() {
        const bell = document.querySelector('.notification-bell');
        if (!bell) return;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.setupEventListeners();
        this.connectWebSocket();
        this.loadUnreadCount();
        this.loadRecent();
    }

    setupEventListeners() {
        const bell = document.querySelector('.notification-bell');
        if (!bell) return;

        const newBell = bell.cloneNode(true);
        bell.parentNode.replaceChild(newBell, bell);

        newBell.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleDropdown();
        });

        const markAllBtn = document.querySelector('.mark-all-read');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.markAllAsRead();
            });
        }

        document.addEventListener('click', (e) => {
            const wrapper = document.querySelector('.notification-wrapper');
            if (this.isDropdownOpen && wrapper && !wrapper.contains(e.target)) {
                this.toggleDropdown();
            }
        });
    }

    toggleDropdown() {
        this.isDropdownOpen = !this.isDropdownOpen;
        const dropdown = document.querySelector('.notification-dropdown');
        if (!dropdown) return;

        if (this.isDropdownOpen) {
            dropdown.classList.add('active');
            this.renderDropdown();
        } else {
            dropdown.classList.remove('active');
        }
    }

    // ====== WEBSOCKET ======

    connectWebSocket() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
            const host = window.location.host;
            const wsUrl = `${protocol}//${host}/ws/notifications`;

            console.log('Connecting to WebSocket:', wsUrl);

            this.ws = new SockJS(wsUrl);

            this.ws.onopen = () => {
                console.log('✅ WebSocket connected');
            };

            this.ws.onmessage = (event) => {
                try {
                    const notification = JSON.parse(event.data);
                    console.log('📨 New notification:', notification);
                    this.handleNewNotification(notification);
                } catch (error) {
                    console.error('Failed to parse notification:', error);
                }
            };

            this.ws.onclose = () => {
                console.log('❌ WebSocket disconnected, reconnecting in 5s...');
                setTimeout(() => this.connectWebSocket(), 5000);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
        }
    }

    handleNewNotification(notification) {
        this.unreadCount++;
        this.updateBadge();

        this.notifications.unshift(notification);

        if (this.isDropdownOpen) {
            this.renderDropdown();
        }

        this.showToast(notification);
    }

    // ====== API CALLS ======

    async loadUnreadCount() {
        try {
            const response = await fetch('/api/notifications/unread-count');
            if (response.ok) {
                const data = await response.json();
                this.unreadCount = data.count;
                this.updateBadge();
            }
        } catch (error) {
            console.error('Failed to load unread count:', error);
        }
    }

    async loadRecent() {
        try {
            const response = await fetch('/api/notifications/recent?limit=10');
            if (response.ok) {
                this.notifications = await response.json();
                if (this.isDropdownOpen) this.renderDropdown();
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }

    async markAsRead(id) {
        try {
            const response = await fetch(`/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to mark as read');

            const notification = this.notifications.find(n => n.id === id);
            if (notification && !notification.read) {
                notification.read = true;
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this.updateBadge();
                this.renderDropdown();
            }
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    }

    async markAllAsRead() {
        try {
            const response = await fetch('/api/notifications/read-all', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to mark all as read');

            this.notifications.forEach(n => n.read = true);
            this.unreadCount = 0;
            this.updateBadge();
            this.renderDropdown();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    }

    async deleteNotification(id) {
        try {
            const response = await fetch(`/api/notifications/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to delete');

            this.notifications = this.notifications.filter(n => n.id !== id);
            this.renderDropdown();
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    }

    // ====== UI UPDATES ======

    updateBadge() {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
        }
    }

    renderDropdown() {
        const container = document.querySelector('.notification-list');
        if (!container) return;

        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div class="notification-empty">
                    <i class="bi bi-bell"></i>
                    <p>Няма нотификации</p>
                </div>
            `;
            return;
        }

        // Group by type + entityType + entityId (frontend-only grouping)
        const grouped = this.groupNotifications(this.notifications);
        container.innerHTML = grouped.map(n => this.createNotificationHTML(n)).join('');
    }

    createNotificationHTML(n) {
        const isSystem = !n.actorUsername;

        return `
            <div class="notification-item ${n.read ? 'read' : 'unread'}" 
                 onclick="window.notificationSystem.handleClick(${n.id}, '${n.actionUrl || ''}')">
                
                <div class="notification-icon">
                    ${n.actorImageUrl
            ? `<img src="${n.actorImageUrl}" alt="${n.actorUsername || ''}">`
            : `<i class="${n.icon || 'bi-bell'}"></i>`
        }
                </div>

                <div class="notification-content">
                    <p class="notification-message">${n.message}</p>
                    <span class="notification-time">${n.timeAgo || 'Сега'}</span>
                </div>

                ${!n.read ? '<div class="notification-unread-dot"></div>' : ''}

                <button class="notification-delete" 
                        onclick="event.stopPropagation(); window.notificationSystem.deleteNotification(${n.id})">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;
    }

    handleClick(id, url) {
        this.markAsRead(id);
        if (url && url !== 'null' && url !== '') {
            setTimeout(() => window.location.href = url, 100);
        }
    }

    showToast(notification) {
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = `
            <div class="toast-icon">
                ${notification.actorImageUrl
            ? `<img src="${notification.actorImageUrl}" alt="">`
            : `<i class="${notification.icon || 'bi-bell'}"></i>`
        }
            </div>
            <div class="toast-content">
                <p>${notification.message}</p>
            </div>
        `;

        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);

        toast.onclick = () => {
            if (notification.actionUrl) {
                window.location.href = notification.actionUrl;
            }
        };
    }

    // ====== GROUPING (frontend only) ======
    groupNotifications(items) {
        const map = new Map();
        for (const n of items) {
            const key = `${n.type}|${n.entityType || ''}|${n.entityId || ''}`;
            if (!map.has(key)) {
                map.set(key, {
                    ...n,
                    _actors: n.actorUsername ? [n.actorUsername] : [],
                    _count: 1,
                });
            } else {
                const g = map.get(key);
                g._count += 1;
                if (n.createdAt && (!g.createdAt || n.createdAt > g.createdAt)) {
                    g.createdAt = n.createdAt;
                    g.timeAgo = n.timeAgo;
                    g.actionUrl = n.actionUrl;
                }
                if (n.actorUsername && !g._actors.includes(n.actorUsername)) {
                    g._actors.push(n.actorUsername);
                }
                // keep unread dot if any item unread
                if (!n.read) g.read = false;
            }
        }

        // Build display message for groups with more than 1
        const result = Array.from(map.values()).map(g => {
            if (g._count > 1) {
                const first = g._actors[0] || '';
                const others = g._count - 1;
                const suffix = this.groupSuffixForType(g.type);
                g.message = `${first} и още ${others} ${suffix}`;
            }
            return g;
        });

        return result;
    }

    groupSuffixForType(type) {
        switch ((type || '').toUpperCase()) {
            case 'COMMENT':
            case 'REPLY':
                return 'коментираха вашето съдържание';
            case 'LIKE':
                return 'харесаха вашето съдържание';
            case 'NEW_FOLLOWER':
                return 'започнаха да ви следват';
            case 'UNFOLLOW':
                return 'спряха да ви следват';
            case 'NEW_VOTE':
                return 'гласуваха във вашето събитие';
            default:
                return 'извършиха действие';
        }
    }
}

// ====== AUTO-INIT ======
let notificationSystem;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotifications);
} else {
    initNotifications();
}

function initNotifications() {
    const bell = document.querySelector('.notification-bell');
    if (bell) {
        notificationSystem = new NotificationSystem();
        window.notificationSystem = notificationSystem;
        // expose grouping for other pages (e.g., profile)
        window.groupNotifications = notificationSystem.groupNotifications.bind(notificationSystem);
    }
}