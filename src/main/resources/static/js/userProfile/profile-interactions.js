/* ===== PROFILE INTERACTIONS - REAL DATA INTEGRATION ===== */

class ProfileManager {
    constructor() {
        this.currentTab = 'overview';
        this.isLoading = false;
        this.touchStartX = 0;
        this.userId = null;
        this.isOwnProfile = false;
        this.csrfToken = null;
        this.init();
    }

    // ===== INITIALIZATION WITH REAL DATA =====
    init() {
        this.extractPageData();
        this.setupEventListeners();
        this.initializeAvatarsWithUtils();
        this.animateCounters();
        this.setupMobileSwipe();
        this.loadUserPreferences();
    }

    extractPageData() {
        // Extract user ID and profile type from page
        const userIdElement = document.querySelector('[data-user-id]');
        this.userId = userIdElement?.dataset.userId || this.extractUserIdFromUrl();

        // Check if own profile (has edit button)
        this.isOwnProfile = !!document.querySelector('.edit-profile-btn');

        // Extract CSRF token
        this.csrfToken = document.querySelector('meta[name="_csrf"]')?.content;

        // Set current user data for avatar utils
        if (this.isOwnProfile) {
            const user = this.getCurrentUserData();
            if (user) {
                window.currentUsername = user.username;
                window.currentUserImage = user.imageUrl;
            }
        }
    }

    getCurrentUserData() {
        // Try to get from data attributes first
        const userDataElement = document.getElementById('current-user-data');
        if (userDataElement) {
            const userData = {
                id: userDataElement.dataset.userId,
                username: userDataElement.dataset.username,
                imageUrl: userDataElement.dataset.imageUrl,
                isOwnProfile: userDataElement.dataset.isOwnProfile === 'true'
            };

            if (userData.username) {
                return userData;
            }
        }

        // Fallback: extract from page elements
        const username = document.querySelector('.username')?.textContent?.trim();
        const avatar = document.querySelector('.profile-avatar');
        const imageUrl = avatar?.dataset.userImage;
        const userIdElement = document.querySelector('[data-user-id]');
        const userId = userIdElement?.dataset.userId;

        return username ? { username, imageUrl, id: userId } : null;
    }

    extractUserIdFromUrl() {
        const path = window.location.pathname;
        const matches = path.match(/\/user\/(\d+)/) || path.match(/\/profile\/?$/);
        return matches ? (matches[1] || 'current') : null;
    }

    // ===== AVATAR INTEGRATION WITH avatarUtils.js =====
    initializeAvatarsWithUtils() {
        // Let avatarUtils handle avatar initialization
        if (window.avatarUtils) {
            // Use the existing avatar system
            window.avatarUtils.updateAll();

            // Set up observer for new avatars
            window.avatarUtils.observeNewAvatars();
        } else {
            // Fallback if avatarUtils not available
            console.warn('Avatar utils not available, using fallback');
            this.initializeAvatarsFallback();
        }
    }

    initializeAvatarsFallback() {
        document.querySelectorAll('[data-user-image]').forEach(avatar => {
            const imageUrl = avatar.dataset.userImage;
            const username = avatar.dataset.username;
            this.setAvatarContent(avatar, imageUrl, username);
        });
    }

    setAvatarContent(avatar, imageUrl, username) {
        if (imageUrl && imageUrl !== 'null' && imageUrl.length > 10) {
            // Try to load image
            const img = new Image();
            img.onload = () => {
                avatar.style.backgroundImage = `url(${imageUrl})`;
                avatar.style.backgroundSize = 'cover';
                avatar.style.backgroundPosition = 'center';
                avatar.textContent = '';
            };
            img.onerror = () => this.setAvatarInitials(avatar, username);
            img.src = imageUrl;
        } else {
            this.setAvatarInitials(avatar, username);
        }
    }

    setAvatarInitials(avatar, username) {
        const initials = this.getInitials(username);
        avatar.textContent = initials;
        avatar.style.backgroundColor = this.generateAvatarColor(username);
        avatar.style.color = '#ffffff';
        avatar.style.fontWeight = '700';
        avatar.style.display = 'flex';
        avatar.style.alignItems = 'center';
        avatar.style.justifyContent = 'center';
    }

    getInitials(username) {
        if (!username) return '??';
        const clean = username.trim();
        return clean.length >= 2 ? clean.substring(0, 2).toUpperCase() : clean.charAt(0).toUpperCase();
    }

    generateAvatarColor(username) {
        const colors = ['#6bb85f', '#8bc97f', '#5ca84f', '#a8d4a0', '#c8e4c2'];
        if (!username) return colors[0];
        const hash = username.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        return colors[hash % colors.length];
    }

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        this.delegateEvent('.tab-btn', 'click', this.switchTab.bind(this));
        this.delegateEvent('.follow-btn', 'click', this.handleFollow.bind(this));
        this.delegateEvent('.edit-profile-btn', 'click', this.openEditModal.bind(this));
        this.delegateEvent('.modal form', 'submit', this.handleFormSubmit.bind(this));
        this.delegateEvent('.load-more-btn', 'click', this.loadMoreContent.bind(this));
        this.delegateEvent('.filter-btn', 'click', this.filterContent.bind(this));
        this.delegateEvent('#profileImage', 'change', this.handleImageUpload.bind(this));
        this.delegateEvent('.event-card, .signal-card, .publication-card', 'click', this.handleCardClick.bind(this));

        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }

    delegateEvent(selector, event, handler) {
        document.addEventListener(event, (e) => {
            const target = e.target.closest(selector);
            if (target) handler(e, target);
        });
    }

    // ===== TAB SYSTEM WITH REAL DATA =====
    switchTab(e, button) {
        if (this.isLoading) return;

        const tabId = button.dataset.tab;
        if (tabId === this.currentTab) return;

        this.updateTabUI(button, tabId);
        this.loadTabContent(tabId);
        this.currentTab = tabId;
    }

    updateTabUI(activeButton, tabId) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        const targetContent = document.getElementById(tabId);
        if (targetContent) {
            setTimeout(() => {
                targetContent.classList.add('active');
            }, 150);
        }
    }

    // ===== REAL API INTEGRATION =====
    async loadTabContent(tabId) {
        // Events are already loaded statically in HTML with Thymeleaf
        if (!this.userId || tabId === 'overview' || tabId === 'events') return;

        this.showLoading();

        try {
            const endpoint = this.getTabEndpoint(tabId);
            const data = await this.fetchWithAuth(endpoint);
            this.renderContent(tabId, data);
        } catch (error) {
            console.error('Error loading tab content:', error);
            this.showError('Грешка при зареждане на съдържанието');
        } finally {
            this.hideLoading();
        }
    }

    getTabEndpoint(tabId) {
        const baseUrl = this.isOwnProfile ? '/profile/api' : `/user/${this.userId}/api`;

        const endpoints = {
            'events': `${baseUrl}/events`,
            'publications': `${baseUrl}/publications`,
            'signals': `${baseUrl}/signals`,
            'messenger': `${baseUrl}/messenger`
        };

        return endpoints[tabId] || `${baseUrl}/${tabId}`;
    }

    // ===== CONTENT RENDERING =====
    renderContent(tabId, data) {
        const container = document.getElementById(`${tabId}Grid`);
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';

        if (tabId === 'signals') {
            this.renderSignals(data, container);
        } else if (tabId === 'publications') {
            this.renderPublications(data, container);
        }
    }

    renderSignals(signals, container) {
        if (!signals.length) {
            this.showEmptyState(container, 'signals');
            return;
        }

        signals.forEach(signal => {
            const signalCard = this.createSignalCard(signal);
            container.appendChild(signalCard);
        });
    }

    renderPublications(publications, container) {
        if (!publications.length) {
            this.showEmptyState(container, 'publications');
            return;
        }

        publications.forEach(pub => {
            const pubCard = this.createPublicationCard(pub);
            container.appendChild(pubCard);
        });
    }

    // ===== CARD CREATION METHODS =====
    createSignalCard(signal) {
        const card = document.createElement('div');
        card.className = 'signal-card glass-card';
        card.dataset.signalId = signal.id;

        const categoryIcons = {
            'ROAD_DAMAGE': 'cone-striped',
            'SIDEWALK_DAMAGE': 'bricks',
            'LIGHTING': 'lightbulb',
            'TRAFFIC_SIGNS': 'sign-stop',
            'WATER_SEWER': 'droplet',
            'WASTE_MANAGEMENT': 'trash',
            'ILLEGAL_DUMPING': 'trash2',
            'TREE_ISSUES': 'tree',
            'AIR_POLLUTION': 'cloud-haze',
            'NOISE_POLLUTION': 'volume-up',
            'HEALTHCARE': 'heart-pulse',
            'EDUCATION': 'book',
            'TRANSPORT': 'bus-front',
            'PARKING': 'p-square',
            'SECURITY': 'shield-check',
            'VANDALISM': 'exclamation-triangle',
            'ACCESSIBILITY': 'universal-access',
            'OTHER': 'flag'
        };

        const urgencyColors = {
            'LOW': '#28a745',
            'MEDIUM': '#ffc107',
            'HIGH': '#dc3545'
        };

        // ИЗПОЛЗВАМЕ БЪЛГАРСКИТЕ ИМЕНА ОТ BACKEND-А
        const categoryName = signal.categoryBG || signal.category;
        const urgencyName = signal.urgencyBG || signal.urgency;

        card.innerHTML = `
        <div class="signal-header">
            <div class="signal-category">
                <i class="bi bi-${categoryIcons[signal.category] || 'flag'}"></i>
                <span>${categoryName}</span>
            </div>
            <span class="urgency-badge" style="background-color: ${urgencyColors[signal.urgency]}">
                ${urgencyName}
            </span>
        </div>
        <h4 class="signal-title">${signal.title}</h4>
        <p class="signal-description">${signal.description && signal.description.length > 120 ? signal.description.substring(0, 120) + '...' : (signal.description || 'Няма описание')}</p>
        <div class="signal-meta">
            <div class="author-info">
                <div class="author-avatar" style="${signal.authorImageUrl ? `background-image: url('${signal.authorImageUrl}'); background-size: cover; background-position: center;` : `background-color: ${this.generateAvatarColor(signal.authorUsername)}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700;`}">
                    ${!signal.authorImageUrl ? this.getInitials(signal.authorUsername) : ''}
                </div>
                <span class="author-name">${signal.authorUsername}</span>
            </div>
            <div class="signal-stats">
                <span><i class="bi bi-heart"></i> ${signal.likesCount || 0}</span>
                <span><i class="bi bi-eye"></i> ${signal.viewsCount || 0}</span>
            </div>
        </div>
        <div class="time-info">${this.formatTimeAgo(signal.created)}</div>
    `;

        return card;
    }


    createPublicationCard(pub) {
        const card = document.createElement('div');
        card.className = 'publication-card glass-card';
        card.dataset.publicationId = pub.id;

        card.innerHTML = `
        <div class="publication-image">
            ${pub.imageUrl
            ? `<img src="${pub.imageUrl}" alt="Publication Image" class="pub-img"/>`
            : `<div class="pub-placeholder">📷</div>`}
        </div>
        <div class="publication-content">
            <p class="publication-excerpt">${pub.content || 'Няма съдържание'}</p>
            <div class="publication-meta">
            <div class="time-info">${this.formatTimeAgo(pub.createdAt || new Date().toISOString())}</div>
                <div class="publication-stats">
                    <span><i class="bi bi-hand-thumbs-up-fill"></i> ${pub.likesCount || 0}</span>
                    <span><i class="bi bi-hand-thumbs-down-fill"></i> ${pub.dislikesCount || 0}</span>
                    <span><i class="bi bi-eye"></i> ${pub.viewsCount || 0}</span>
                    <span><i class="bi bi-chat-fill"></i> ${pub.commentsCount || 0}</span>
                </div>
            </div>
        </div>
    `;

        return card;
    }



    // ===== CARD CLICK HANDLER =====
    handleCardClick(e, card) {
        if (e.target.closest('button, a, .dropdown, .reaction-btn')) return;

        let url;

        if (card.classList.contains('event-card')) {
            const eventType = card.dataset.eventType;
            const eventId = card.dataset.eventId;

            const urlMap = {
                'SIMPLEEVENT': 'event',
                'REFERENDUM': 'referendum',
                'MULTI_POLL': 'multipoll'
            };

            url = `/${urlMap[eventType]}/${eventId}`;

        } else if (card.classList.contains('signal-card')) {
            const signalId = card.dataset.signalId;
            url = `/signals/mainView?openSignal=${signalId}`;

        } else if (card.classList.contains('publication-card')) {
            const pubId = card.dataset.publicationId;
            if (window.openPostModal) {
                window.openPostModal(pubId);
            } else {
                console.error('openPostModal function not available');
            }
        }

        if (url) {
            window.open(url, '_blank');
        }
    }

    // ===== FOLLOW SYSTEM WITH REAL API =====
    async handleFollow(e, button) {
        e.preventDefault();
        if (this.isLoading || !this.userId) return;

        const isFollowing = button.dataset.action === 'unfollow';

        // Optimistic UI update
        this.updateFollowButton(button, !isFollowing);

        try {
            const response = await this.fetchWithAuth(
                `/api/users/${this.userId}/follow`,
                'POST'
            );

            if (response.success || response.isFollowing !== undefined) {
                const nowFollowing = response.isFollowing;
                this.updateFollowButton(button, nowFollowing);
                this.showSuccess(response.message ||
                    (nowFollowing ? 'Започнахте да следвате потребителя' : 'Спряхте да следвате потребителя'));
            }
        } catch (error) {
            // Revert on error
            this.updateFollowButton(button, isFollowing);
            this.showError('Грешка при промяна на следването');
        }
    }

    updateFollowButton(button, following) {
        const icon = button.querySelector('i');
        const text = button.querySelector('span');

        if (following) {
            button.dataset.action = 'unfollow';
            button.className = 'btn btn-outline-secondary action-btn follow-btn';
            icon.className = 'bi bi-person-check';
            text.textContent = 'Следвате';
        } else {
            button.dataset.action = 'follow';
            button.className = 'btn btn-primary action-btn follow-btn';
            icon.className = 'bi bi-person-plus';
            text.textContent = 'Следвай';
        }
    }

    // ===== FORM HANDLING WITH REAL SUBMISSION =====
    async handleFormSubmit(e, form) {
        e.preventDefault();
        if (this.isLoading) return;

        this.showLoading();

        try {
            const formData = new FormData(form);

            // Use AJAX endpoint for better UX
            const response = await fetch('/profile/update/ajax', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.ok) {
                const result = await response.json();

                this.hideModal();
                this.showSuccess(result.message || 'Профилът е обновен успешно');

                // Update UI with new data
                if (result.bio !== undefined) {
                    const bioElement = document.querySelector('.user-bio');
                    if (bioElement) bioElement.textContent = result.bio || '';
                }

                if (result.locationBG) {
                    const locationElement = document.querySelector('.info-item [data-location]');
                    if (locationElement) locationElement.textContent = result.locationBG;
                }

                // Update current user data for avatar utils
                if (result.imageUrl) {
                    window.currentUserImage = result.imageUrl;
                }

                // Update avatars if image was changed
                if (window.avatarUtils) {
                    setTimeout(() => window.avatarUtils.updateAll(), 500);
                }
            } else {
                const errorResult = await response.json();
                throw new Error(errorResult.error || `HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('Form submission error:', error);
            this.showError(error.message || 'Грешка при запазване на промените');
        } finally {
            this.hideLoading();
        }
    }

    // ===== IMAGE UPLOAD WITH PREVIEW =====
    handleImageUpload(e, input) {
        const file = input.files[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            this.showError('Моля изберете изображение');
            input.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            this.showError('Размерът на файла трябва да е под 5MB');
            input.value = '';
            return;
        }

        // Preview image
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.querySelector('.current-avatar .profile-avatar');
            if (preview) {
                preview.style.backgroundImage = `url(${e.target.result})`;
                preview.style.backgroundSize = 'cover';
                preview.style.backgroundPosition = 'center';
                preview.textContent = '';
            }
        };
        reader.readAsDataURL(file);
    }

    // ===== CONTENT FILTERING =====
    filterContent(e, button) {
        const filter = button.dataset.filter;
        const container = button.closest('.tab-content');

        // Update filter UI
        container.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Filter content
        const cards = container.querySelectorAll('[data-event-type], [data-type]');
        cards.forEach(card => {
            const cardType = card.dataset.eventType || card.dataset.type;
            const shouldShow = filter === 'all' || cardType === filter;
            card.style.display = shouldShow ? 'block' : 'none';
        });
    }

    // ===== MODAL HANDLERS =====
    openEditModal(e, button) {
        // The modal is already set up in HTML with data-bs-target
        // Bootstrap will handle the opening
    }

    loadMoreContent(e, button) {
        // Placeholder for load more functionality
        button.style.display = 'none';
    }

    // ===== USER PREFERENCES LOADING =====
    async loadUserPreferences() {
        if (!this.isOwnProfile) return;

        try {
            const preferences = await this.fetchWithAuth('/api/user/preferences');

            // Store user preferences for other components
            window.userPreferences = preferences;

        } catch (error) {
            console.warn('Could not load user preferences:', error);
        }
    }

    // ===== COUNTER ANIMATIONS =====
    animateCounters() {
        const counters = document.querySelectorAll('.stat-number');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateNumber(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => observer.observe(counter));
    }

    animateNumber(element) {
        const target = parseInt(element.textContent.replace(/[^\d]/g, '')) || 0;
        if (target === 0) return;

        let current = 0;
        const increment = target / 30;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = this.formatNumber(target);
                clearInterval(timer);
            } else {
                element.textContent = this.formatNumber(Math.floor(current));
            }
        }, 50);
    }

    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    // ===== MOBILE SWIPE SUPPORT =====
    setupMobileSwipe() {
        const tabContainer = document.querySelector('.tab-content-container');
        if (!tabContainer) return;

        tabContainer.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
        }, { passive: true });

        tabContainer.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = this.touchStartX - touchEndX;

            if (Math.abs(diff) > 50) {
                this.swipeTab(diff > 0 ? 'next' : 'prev');
            }
        }, { passive: true });
    }

    swipeTab(direction) {
        const tabs = ['overview', 'events', 'publications', 'signals', 'messenger'];
        const currentIndex = tabs.indexOf(this.currentTab);

        let newIndex;
        if (direction === 'next' && currentIndex < tabs.length - 1) {
            newIndex = currentIndex + 1;
        } else if (direction === 'prev' && currentIndex > 0) {
            newIndex = currentIndex - 1;
        } else {
            return;
        }

        const tabButton = document.querySelector(`[data-tab="${tabs[newIndex]}"]`);
        if (tabButton) tabButton.click();
    }

    // ===== KEYBOARD NAVIGATION =====
    handleKeyboard(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        const keys = {
            '1': 'overview',
            '2': 'events',
            '3': 'publications',
            '4': 'signals',
            '5': 'messenger'
        };

        if (keys[e.key]) {
            const tabButton = document.querySelector(`[data-tab="${keys[e.key]}"]`);
            if (tabButton) tabButton.click();
        }
    }

    // ===== API METHODS =====
    async fetchWithAuth(url, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        // Add CSRF token
        if (this.csrfToken) {
            options.headers['X-CSRF-TOKEN'] = this.csrfToken;
        }

        if (data && method !== 'GET') {
            options.body = data instanceof FormData ? data : JSON.stringify(data);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        } else {
            return response.text();
        }
    }

    async refreshUserData() {
        try {
            let userData;

            if (this.isOwnProfile) {
                // For own profile, get current user data
                userData = await this.fetchWithAuth('/api/user/current');
            } else {
                // For other profiles, get user data by ID
                userData = await this.fetchWithAuth(`/api/user/${this.userId}`);
            }

            // Update counters with data-stat attributes
            if (userData.userEventsCount !== undefined) {
                const eventsCounter = document.querySelector('[data-stat="events"] .stat-number');
                if (eventsCounter) eventsCounter.textContent = this.formatNumber(userData.userEventsCount);
            }

            if (userData.totalVotes !== undefined) {
                const votesCounter = document.querySelector('[data-stat="votes"] .stat-number');
                if (votesCounter) votesCounter.textContent = this.formatNumber(userData.totalVotes);
            }

            if (userData.publicationsCount !== undefined) {
                const pubsCounter = document.querySelector('[data-stat="publications"] .stat-number');
                if (pubsCounter) pubsCounter.textContent = this.formatNumber(userData.publicationsCount);
            }

            if (userData.signalsCount !== undefined) {
                const signalsCounter = document.querySelector('[data-stat="signals"] .stat-number');
                if (signalsCounter) signalsCounter.textContent = this.formatNumber(userData.signalsCount);
            }

            if (userData.reputationScore !== undefined) {
                const repCounter = document.querySelector('[data-stat="reputation"] .stat-number');
                if (repCounter) repCounter.textContent = this.formatNumber(userData.reputationScore);

                const repBadge = document.querySelector('.reputation-badge .badge-text');
                if (repBadge && userData.reputationBadge) {
                    repBadge.textContent = userData.reputationBadge;
                }
            }

            // Update bio if changed
            if (userData.bio !== undefined) {
                const bioElement = document.querySelector('.user-bio');
                if (bioElement) bioElement.textContent = userData.bio || '';
            }

            // Update location if changed
            if (userData.locationBG) {
                const locationElement = document.querySelector('.info-item:has(.bi-geo-alt) span:last-child');
                if (locationElement) locationElement.textContent = userData.locationBG;
            }

        } catch (error) {
            console.error('Could not refresh user data:', error);
        }
    }

    // ===== UTILITY METHODS =====
    showEmptyState(container, type) {
        const emptyMessages = {
            'events': {
                icon: 'calendar-event',
                title: 'Няма събития',
                message: this.isOwnProfile ? 'Все още не сте създали събития.' : 'Този потребител няма събития.'
            },
            'signals': {
                icon: 'flag',
                title: 'Няма сигнали',
                message: this.isOwnProfile ? 'Все още не сте подали сигнали.' : 'Този потребител няма сигнали.'
            },
            'publications': {
                icon: 'file-text',
                title: 'Няма публикации',
                message: this.isOwnProfile ? 'Все още не сте публикували нищо.' : 'Този потребител няма публикации.'
            }
        };

        const config = emptyMessages[type];
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-${config.icon}"></i>
                <h4>${config.title}</h4>
                <p>${config.message}</p>
            </div>
        `;
    }

    formatTimeAgo(dateString) {
        if (!dateString) return 'скоро';

        let date;
        if (dateString instanceof Date) {
            date = dateString;
        } else if (typeof dateString === 'string') {
            // Handle both ISO strings and Instant format
            date = new Date(dateString);
        } else {
            return 'скоро';
        }

        // Проверка дали датата е валидна
        if (isNaN(date.getTime())) {
            return 'скоро';
        }

        const now = new Date();
        const diffMs = now - date;

        // Ако разликата е отрицателна (бъдещо време), връщаме "скоро"
        if (diffMs < 0) return 'скоро';

        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'току-що';
        if (diffMins < 60) return `преди ${diffMins} мин.`;
        if (diffHours < 24) return `преди ${diffHours} ч.`;
        if (diffDays < 7) return `преди ${diffDays} дни`;

        return date.toLocaleDateString('bg-BG');
    }

    // ===== UI STATE MANAGEMENT =====
    showLoading() {
        this.isLoading = true;
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.style.opacity = '1';
        }
    }

    hideLoading() {
        this.isLoading = false;
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        }
    }

    hideModal() {
        const modal = document.querySelector('.modal.show');
        if (modal && window.bootstrap) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            bsModal?.hide();
        }
    }

    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    showError(message) {
        this.showAlert(message, 'error');
    }

    showAlert(message, type) {
        // Try SweetAlert2 first
        if (window.Swal) {
            const config = {
                text: message,
                timer: 3000,
                showConfirmButton: false,
                position: 'top-end',
                toast: true
            };

            if (type === 'success') {
                Swal.fire({ ...config, icon: 'success' });
            } else {
                Swal.fire({ ...config, icon: 'error' });
            }
            return;
        }

        // Fallback toast
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'success' ? 'success' : 'danger'} position-fixed`;
        toast.style.cssText = `
            top: 20px; 
            right: 20px; 
            z-index: 10000; 
            min-width: 300px;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
                ${message}
            </div>
        `;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.style.opacity = '1', 10);

        // Auto remove
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// ===== INITIALIZE ON DOM READY =====
document.addEventListener('DOMContentLoaded', () => {
    // Wait for avatarUtils to be ready
    const initProfile = () => {
        window.profileManager = new ProfileManager();
    };

    if (window.avatarUtils && window.avatarUtils.isInitialized) {
        initProfile();
    } else {
        // Wait a bit for avatarUtils to initialize
        setTimeout(initProfile, 300);
    }
});

// ===== GLOBAL HELPERS =====
window.showLoginWarning = () => {
    if (window.profileManager) {
        profileManager.showAlert('Моля влезте в профила си', 'error');
    } else {
        alert('Моля влезте в профила си');
    }
};

// ===== PERFORMANCE OPTIMIZATIONS =====
if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
        // Preload profile images
        document.querySelectorAll('[data-user-image]').forEach(el => {
            const imageUrl = el.dataset.userImage;
            if (imageUrl && imageUrl.startsWith('http')) {
                const img = new Image();
                img.src = imageUrl;
            }
        });
    });
}