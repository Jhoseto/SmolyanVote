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
        this.isLoading = false;
        
        // CSRF настройки (като в commentsManager.js и publicationsApi.js)
        this.csrfToken = document.querySelector('meta[name="_csrf"]')?.getAttribute('content');
        this.csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.getAttribute('content');
        
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
            
            // Добавяме вибрация за мобилни устройства
            if (window.innerWidth <= 768 && 'vibrate' in navigator) {
                navigator.vibrate(30); // По-кратка вибрация за нотификации
            }
            
            this.toggleDropdown();
        });

        const markAllBtn = document.querySelector('.mark-all-read');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Добавяме вибрация за мобилни устройства
                if (window.innerWidth <= 768 && 'vibrate' in navigator) {
                    navigator.vibrate([50, 30, 50]); // Двойна вибрация за важни действия
                }
                
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
            // Зареждаме нотификациите при отваряне на dropdown
            if (this.notifications.length === 0) {
                this.loadRecent();
            }
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
        // Новите нотификации от WebSocket винаги са непрочетени
        const normalized = {
            ...notification,
            read: false,
            isRead: false
        };
        
        // Увеличаваме брояча
        this.unreadCount++;
        this.updateBadge();

        this.notifications.unshift(normalized);

        if (this.isDropdownOpen) {
            this.renderDropdown();
        }

        this.showToast(normalized);
    }

    // ====== API CALLS ======

    async loadUnreadCount() {
        try {
            const response = await fetch('/api/notifications/unread-count');
            if (response.ok) {
                const data = await response.json();
                this.unreadCount = data.count || 0;
                this.updateBadge();
            }
        } catch (error) {
            console.error('Failed to load unread count:', error);
        }
    }

    async loadRecent() {
        try {
            this.isLoading = true;
            const response = await fetch('/api/notifications/recent?limit=10');
            if (response.ok) {
                const data = await response.json();
                // Фикс: нормализиране на read/isRead полето
                this.notifications = data.map(n => ({
                    ...n,
                    read: n.read !== undefined ? n.read : (n.isRead !== undefined ? n.isRead : false),
                    isRead: n.isRead !== undefined ? n.isRead : (n.read !== undefined ? n.read : false)
                }));
                // Преизчисляваме unreadCount от заредените нотификации
                this.unreadCount = this.notifications.filter(n => !n.read).length;
                this.updateBadge();
                if (this.isDropdownOpen) this.renderDropdown();
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async markAsRead(id) {
        try {
            const csrfTokenMeta = document.querySelector('meta[name="_csrf"]');
            const csrfHeaderMeta = document.querySelector('meta[name="_csrf_header"]');
            
            if (!csrfTokenMeta || !csrfHeaderMeta) {
                console.error('CSRF meta tags not found');
                throw new Error('CSRF protection not available');
            }
            
            const csrfToken = csrfTokenMeta.getAttribute("content");
            const csrfHeader = csrfHeaderMeta.getAttribute("content");

            const response = await fetch(`/api/notifications/${id}/read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    [csrfHeader]: csrfToken
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', response.status, errorText);
                throw new Error(`Failed to mark as read: ${response.status}`);
            }

            // Обновяваме всички нотификации с това ID
            this.notifications.forEach(n => {
                if (n.id === id) {
                    n.read = true;
                    n.isRead = true;
                }
            });
            
            // Преизчисляваме unreadCount
            this.unreadCount = this.notifications.filter(n => {
                const isRead = n.read !== undefined ? n.read : (n.isRead !== undefined ? n.isRead : false);
                return !isRead;
            }).length;
            
            // Обновяваме визуализацията
            this.updateBadge();
            this.renderDropdown();
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    }

    async markAllAsRead() {
        try {
            const csrfTokenMeta = document.querySelector('meta[name="_csrf"]');
            const csrfHeaderMeta = document.querySelector('meta[name="_csrf_header"]');
            
            if (!csrfTokenMeta || !csrfHeaderMeta) {
                console.error('CSRF meta tags not found');
                throw new Error('CSRF protection not available');
            }
            
            const csrfToken = csrfTokenMeta.getAttribute("content");
            const csrfHeader = csrfHeaderMeta.getAttribute("content");

            const response = await fetch('/api/notifications/read-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    [csrfHeader]: csrfToken
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', response.status, errorText);
                throw new Error(`Failed to mark all as read: ${response.status}`);
            }

            // Фикс: синхронизация на read/isRead за всички
            this.notifications.forEach(n => {
                n.read = true;
                n.isRead = true;
            });
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

        // Показваме loading state докато зареждаме
        if (this.notifications.length === 0 && this.isLoading) {
            container.innerHTML = `
                <div class="notification-loading">
                    <i class="bi bi-arrow-repeat"></i>
                    <p>Зареждане...</p>
                </div>
            `;
            return;
        }

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
        
        // Setup event listeners СЛЕД като се рендерира HTML-а
        this.setupNotificationListeners();
    }
    
    setupNotificationListeners() {
        const container = document.querySelector('.notification-list');
        if (!container) return;
        
        // Event listeners за notification items
        container.querySelectorAll('.notification-item').forEach(item => {
            const id = item.getAttribute('data-notification-id');
            const url = item.getAttribute('data-action-url');
            
            item.addEventListener('click', (e) => {
                // Ако кликнеш на mark-read бутона, не изпълнява handleClick
                if (e.target.closest('.notification-mark-read')) {
                    return;
                }
                this.handleClick(parseInt(id), url || '');
            });
        });
        
        // Event listeners за mark-read бутоните
        container.querySelectorAll('.notification-mark-read').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const idsStr = btn.getAttribute('data-notification-ids');
                if (idsStr) {
                    // Ако има множество ID-та (групирана нотификация), маркираме всички
                    const ids = idsStr.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
                    if (ids.length > 0) {
                        // Маркираме всички нотификации от групата
                        Promise.all(ids.map(id => this.markAsRead(id))).then(() => {
                            // Обновяваме визуализацията след маркиране
                            this.renderDropdown();
                        });
                    }
                }
            });
        });
    }

    createNotificationHTML(n) {
        const isSystem = !n.actorUsername;
        // Фикс: поддръжка на read и isRead
        const isRead = n.read !== undefined ? n.read : (n.isRead !== undefined ? n.isRead : false);

        // За групирани нотификации запазваме всички ID-та
        const notificationIds = n._ids && n._ids.length > 0 ? n._ids.join(',') : n.id;
        
        return `
            <div class="notification-item ${isRead ? 'read' : 'unread'}" 
                 data-notification-id="${n.id}"
                 data-notification-ids="${notificationIds}"
                 data-action-url="${n.actionUrl || ''}">
                
                <div class="notification-icon">
                    ${n.actorImageUrl
            ? `<img src="${n.actorImageUrl}" alt="${n.actorUsername || ''}">`
            : `<i class="${n.icon || 'bi-bell'}"></i>`
        }
                </div>

                <div class="notification-content">
                    <p class="notification-message">${n.message}${n._count > 1 ? ` <span class="notification-count">(${n._count})</span>` : ''}</p>
                    <span class="notification-time">${n.timeAgo || 'Сега'}</span>
                </div>

                ${!isRead ? '<div class="notification-unread-dot"></div>' : ''}

                <button class="notification-mark-read" 
                        data-notification-ids="${notificationIds}"
                        title="Маркирай като прочетена">
                    <i class="bi bi-eye"></i>
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
            // Фикс: нормализиране на read/isRead преди групиране
            const isRead = n.read !== undefined ? n.read : (n.isRead !== undefined ? n.isRead : false);
            const key = `${n.type}|${n.entityType || ''}|${n.entityId || ''}`;
            if (!map.has(key)) {
                map.set(key, {
                    ...n,
                    read: isRead,
                    isRead: isRead,
                    _actors: n.actorUsername ? [n.actorUsername] : [],
                    _count: 1,
                    _ids: [n.id], // Запазваме всички ID-та за групираните нотификации
                });
            } else {
                const g = map.get(key);
                g._count += 1;
                g._ids.push(n.id); // Добавяме ID на текущата нотификация
                if (n.createdAt && (!g.createdAt || n.createdAt > g.createdAt)) {
                    g.createdAt = n.createdAt;
                    g.timeAgo = n.timeAgo;
                    g.actionUrl = n.actionUrl;
                }
                if (n.actorUsername && !g._actors.includes(n.actorUsername)) {
                    g._actors.push(n.actorUsername);
                }
                // keep unread dot if any item unread
                if (!isRead) {
                    g.read = false;
                    g.isRead = false;
                }
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