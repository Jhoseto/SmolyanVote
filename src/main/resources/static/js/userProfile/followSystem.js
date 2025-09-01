/**
 * FOLLOW SYSTEM - Напълно препрограмиран за unified-profile.html
 * Управлява следването на потребители и показването на followers/following списъци
 *
 * ВЪЗМОЖНОСТИ:
 * ✅ Главен follow бутон в профила
 * ✅ Follow бутони в user картите
 * ✅ Followers/Following табове с pagination
 * ✅ Search функционалност
 * ✅ Правилна логика за собствен vs чужд профил
 * ✅ CSRF защита и error handling
 */
class UserFollowSystem {
    constructor() {
        // CSRF настройки
        this.csrfToken = this.getMetaContent('_csrf') || '';
        this.csrfHeader = this.getMetaContent('_csrf_header') || 'X-CSRF-TOKEN';

        // User данни
        this.profileUserId = null;
        this.currentUserId = null;
        this.isOwnProfile = false;
        this.isAuthenticated = window.isAuthenticated || false;

        // Tab state за followers/following
        this.currentTab = 'followers';
        this.tabState = {
            followers: {
                page: 0,
                loading: false,
                hasNext: true,
                searchTerm: '',
                loaded: false
            },
            following: {
                page: 0,
                loading: false,
                hasNext: true,
                searchTerm: '',
                loaded: false
            }
        };

        this.searchTimeout = null;
        this.init();
    }

    // ==================== ИНИЦИАЛИЗАЦИЯ ====================

    init() {
        console.log('UserFollowSystem initializing...');

        // Извлича user данни
        if (!this.extractUserData()) {
            console.error('Failed to extract user data');
            return;
        }

        // Setup event listeners
        this.setupEventListeners();

        // Инициализира профилната визия
        this.initializeProfileView();

        // Зарежда follow статуса ако не е собствен профил
        if (!this.isOwnProfile && this.isAuthenticated) {
            this.loadInitialFollowStatus();
        }

        // Инициализира users таба ако съществува
        const usersTab = document.getElementById('users');
        if (usersTab) {
            console.log('Users tab found, initializing...');
            this.initializeUsersTab();
        } else {
            console.log('Users tab not found');
        }
    }

    /**
     * Извлича данни за потребителите от DOM
     */
    extractUserData() {
        // Profile user ID от .user-info-section
        const userInfoSection = document.querySelector('.user-info-section');
        if (userInfoSection && userInfoSection.dataset.userId) {
            this.profileUserId = parseInt(userInfoSection.dataset.userId);
        } else {
            console.error('Profile user ID not found');
            return false;
        }

        // Current user data
        const currentUserData = document.getElementById('current-user-data');
        if (currentUserData && currentUserData.dataset.userId) {
            this.currentUserId = parseInt(currentUserData.dataset.userId);
            this.isOwnProfile = currentUserData.dataset.isOwnProfile === 'true';
        }

        console.log('User data extracted:', {
            profileUserId: this.profileUserId,
            currentUserId: this.currentUserId,
            isOwnProfile: this.isOwnProfile,
            isAuthenticated: this.isAuthenticated
        });

        return true;
    }

    /**
     * Настройва правилната визия на профила
     */
    initializeProfileView() {
        const ownActions = document.querySelector('.own-profile-actions');
        const otherActions = document.querySelector('.other-profile-actions');

        if (this.isOwnProfile) {
            // Собствен профил - edit/settings бутони
            if (ownActions) ownActions.style.display = 'flex';
            if (otherActions) otherActions.style.display = 'none';
        } else {
            // Чужд профил - follow бутон
            if (ownActions) ownActions.style.display = 'none';
            if (otherActions) otherActions.style.display = 'flex';
        }
    }

    // ==================== EVENT LISTENERS ====================

    setupEventListeners() {
        // Главен follow бутон
        const followButton = document.getElementById('followButton');
        if (followButton) {
            followButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleMainFollowClick(followButton);
            });
        }

        // Tab switching бутони
        document.addEventListener('click', (e) => {
            if (e.target.matches('.users-sub-tab-btn') || e.target.closest('.users-sub-tab-btn')) {
                const button = e.target.closest('.users-sub-tab-btn');
                if (button) {
                    this.switchTab(button);
                }
            }
        });

        // User карти follow бутони
        document.addEventListener('click', (e) => {
            if (e.target.matches('.user-follow-btn') || e.target.closest('.user-follow-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const button = e.target.closest('.user-follow-btn');
                if (button) {
                    this.handleUserCardFollowClick(button);
                }
            }
        });

        // User карти - отваряне на профил
        document.addEventListener('click', (e) => {
            if (e.target.matches('.user-card-overlay')) {
                const userCard = e.target.closest('.user-card');
                const userId = userCard?.dataset.userId;
                if (userId) {
                    window.open(`/profile/${userId}`, '_blank');
                }
            }
        });

        // Pagination бутони
        document.addEventListener('click', (e) => {
            if (e.target.matches('.pagination-btn')) {
                const page = parseInt(e.target.dataset.page);
                if (!isNaN(page)) {
                    this.loadPage(page);
                }
            }
        });

        // Search input
        const searchInput = document.getElementById('usersSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.handleSearch(e.target.value.trim());
                }, 300);
            });
        }
    }

    // ==================== TABS УПРАВЛЕНИЕ ====================

    /**
     * Инициализира users таба
     */
    initializeUsersTab() {
        // Проверява дали tabs-а е активен
        const usersTab = document.getElementById('users');
        const isActive = usersTab && usersTab.classList.contains('active');

        if (isActive) {
            console.log('Users tab is active, loading initial data...');
            this.loadTabData('followers');
        } else {
            console.log('Users tab not active, waiting...');
            // Ако tabs-а не е активен, слуша за активиране
            this.observeTabActivation();
        }
    }

    /**
     * Наблюдава кога users tab-а става активен
     */
    observeTabActivation() {
        const usersTab = document.getElementById('users');
        if (!usersTab) return;

        // Observer за промени в класовете
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (usersTab.classList.contains('active') && !this.tabState.followers.loaded) {
                        console.log('Users tab activated, loading data...');
                        this.loadTabData('followers');
                        observer.disconnect(); // Спираме наблюдението
                    }
                }
            });
        });

        observer.observe(usersTab, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    /**
     * Превключва между followers/following табовете
     */
    switchTab(button) {
        const newTab = button.dataset.usersTab;
        if (!newTab || newTab === this.currentTab) return;

        console.log('Switching tab to:', newTab);

        // Обновява UI на бутоните
        document.querySelectorAll('.users-sub-tab-btn').forEach(btn =>
            btn.classList.remove('active'));
        button.classList.add('active');

        // Обновява content контейнерите
        document.querySelectorAll('.users-sub-content').forEach(content =>
            content.classList.remove('active'));
        const newContent = document.getElementById(`${newTab}-content`);
        if (newContent) {
            newContent.classList.add('active');
        }

        this.currentTab = newTab;

        // Зарежда данните за новия таб
        this.loadTabData(newTab);
    }

    /**
     * Зарежда данните за определен таб
     */
    async loadTabData(tabType, page = 0) {
        if (!this.profileUserId) return;

        const tabData = this.tabState[tabType];
        if (tabData.loading) return;

        console.log(`Loading ${tabType} data, page ${page}`);

        tabData.loading = true;
        this.showLoading(tabType);

        try {
            const searchParam = tabData.searchTerm ?
                `&search=${encodeURIComponent(tabData.searchTerm)}` : '';
            const url = `/api/follow/${this.profileUserId}/${tabType}?page=${page}&size=20${searchParam}`;

            console.log('API URL:', url);

            const response = await fetch(url, {
                headers: { [this.csrfHeader]: this.csrfToken }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            if (data && data.success) {
                tabData.page = page;
                tabData.hasNext = data.hasNext;
                tabData.loaded = true;

                this.renderUsers(tabType, data.data || [], data.followingIds || []);
                this.updatePagination(data.currentPage || page, data.hasNext);
                this.updateResultsInfo(data.data ? data.data.length : 0, tabData.searchTerm);
            } else {
                throw new Error(data?.message || 'Invalid response format');
            }

        } catch (error) {
            console.error(`Error loading ${tabType} data:`, error);
            this.showError(tabType, error.message);
        } finally {
            tabData.loading = false;
            this.hideLoading(tabType);
        }
    }

    // ==================== SEARCH И PAGINATION ====================

    /**
     * Handle търсене
     */
    async handleSearch(searchTerm) {
        console.log('Search term:', searchTerm);

        const tabData = this.tabState[this.currentTab];
        tabData.searchTerm = searchTerm;
        tabData.page = 0; // Reset страницата

        await this.loadTabData(this.currentTab, 0);
    }

    /**
     * Зарежда конкретна страница
     */
    async loadPage(page) {
        await this.loadTabData(this.currentTab, page);
    }

    // ==================== RENDERING ====================

    /**
     * Рендерира списъка с потребители
     */
    renderUsers(tabType, usersData, followingIds) {
        const grid = document.getElementById(`${tabType}Grid`);
        const emptyState = document.getElementById(`${tabType}Empty`);

        if (!grid) {
            console.error(`Grid not found: ${tabType}Grid`);
            return;
        }

        // Скрива loading
        this.hideLoading(tabType);

        if (!usersData || usersData.length === 0) {
            grid.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        // Генерира user карти
        const userCards = usersData.map(userData =>
            this.createUserCard(userData, followingIds)
        ).join('');

        grid.innerHTML = userCards;

        // Инициализира avatar placeholders
        setTimeout(() => {
            if (window.initializeAvatarPlaceholders) {
                window.initializeAvatarPlaceholders();
            }
        }, 100);
    }

    /**
     * Създава HTML за една user карта
     */
    createUserCard(userData, followingIds) {
        // Object[] структура: [id, username, imageUrl, role, onlineStatus, created, followedAt, followersCount]
        const [id, username, imageUrl, role, onlineStatus, created, followedAt, followersCount] = userData;

        const isFollowing = followingIds.includes(id);
        const isCurrentUser = id === this.currentUserId;
        const joinDate = new Date(created).toLocaleDateString('bg-BG', { month: '2-digit', year: 'numeric' });
        const isOnline = onlineStatus === 1;
        const isAdmin = role === 'ADMIN';

        return `
            <div class="user-card glass-card" data-user-id="${id}" ${isFollowing ? 'data-following="true"' : ''}>
                <div class="user-card-inner">
                    <!-- Avatar Section -->
                    <div class="user-avatar-section">
                        <div class="user-avatar avatar-placeholder" 
                             data-user-image="${imageUrl || ''}" 
                             data-username="${username}">
                        </div>
                        <div class="online-indicator ${isOnline ? 'online' : ''}"></div>
                    </div>
                    
                    <!-- User Info Section -->
                    <div class="user-info-section">
                        <div class="user-basic-info">
                            <h4 class="user-card-username">${username}</h4>
                            <div class="user-card-role">
                                <i class="bi ${isAdmin ? 'bi-shield-check' : 'bi-person'}"></i>
                                <span class="role-text">${isAdmin ? 'Админ' : 'Потребител'}</span>
                            </div>
                        </div>
                        
                        <div class="user-meta-info">
                            <div class="user-stats">
                                <span class="stat-item">
                                    <i class="bi bi-people"></i>
                                    <span class="followers-count">${followersCount}</span>
                                </span>
                            </div>
                            <div class="user-join-date">
                                <i class="bi bi-calendar-plus"></i>
                                <span class="join-date-text">Член от ${joinDate}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Action Section -->
                    <div class="user-card-actions">
                        ${this.generateFollowButtonHTML(id, isCurrentUser, isFollowing)}
                    </div>
                </div>
                
                <!-- Click Overlay за отваряне на профил -->
                <div class="user-card-overlay" title="Отвори профил"></div>
            </div>
        `;
    }

    /**
     * Генерира HTML за follow бутона според статуса
     */
    generateFollowButtonHTML(userId, isCurrentUser, isFollowing) {
        if (!this.isAuthenticated || isCurrentUser) {
            return '<div class="user-card-self">Това сте вие</div>';
        }

        if (isFollowing) {
            return `
                <button class="btn btn-outline-secondary btn-sm user-follow-btn" 
                        data-user-id="${userId}" data-action="unfollow">
                    <i class="bi bi-person-dash"></i>
                    <span>Не следвай</span>
                </button>
            `;
        } else {
            return `
                <button class="btn btn-primary btn-sm user-follow-btn" 
                        data-user-id="${userId}" data-action="follow">
                    <i class="bi bi-person-plus"></i>
                    <span>Следвай</span>
                </button>
            `;
        }
    }

    // ==================== FOLLOW ОПЕРАЦИИ ====================

    /**
     * Handle на главния follow бутон
     */
    async handleMainFollowClick(button) {
        if (!this.isAuthenticated || !button) return;

        const userId = parseInt(button.dataset.userId);
        const action = button.dataset.action;

        if (!userId) return;

        this.setButtonLoading(button, true);

        try {
            let response;
            if (action === 'follow') {
                response = await this.followUser(userId);
            } else {
                response = await this.unfollowUser(userId);
            }

            if (response && response.success) {
                this.updateMainFollowButton(button, response.action);
                this.updateFollowCounters(response);
                this.showNotification(response.message, 'success');

                // Обновява user картите ако са заредени
                this.refreshUserCardsAfterFollowChange(userId, response.action);
            } else {
                this.showNotification(response?.message || 'Възникна грешка', 'error');
            }

        } catch (error) {
            console.error('Follow request failed:', error);
            this.showNotification('Възникна грешка. Опитайте отново.', 'error');
        } finally {
            this.setButtonLoading(button, false);
        }
    }

    /**
     * Handle на follow бутоните в user картите
     */
    async handleUserCardFollowClick(button) {
        if (!this.isAuthenticated || !button) return;

        const userId = parseInt(button.dataset.userId);
        const action = button.dataset.action;

        if (!userId) return;

        this.setButtonLoading(button, true);

        try {
            let response;
            if (action === 'follow') {
                response = await this.followUser(userId);
            } else {
                response = await this.unfollowUser(userId);
            }

            if (response && response.success) {
                this.updateUserCardFollowButton(button, response.action);
                this.updateFollowCounters(response);
                this.showNotification(response.message, 'success');
            } else {
                this.showNotification(response?.message || 'Възникна грешка', 'error');
            }

        } catch (error) {
            console.error('User card follow failed:', error);
            this.showNotification('Възникна грешка. Опитайте отново.', 'error');
        } finally {
            this.setButtonLoading(button, false);
        }
    }

    /**
     * Зарежда началното follow състояние
     */
    async loadInitialFollowStatus() {
        const followButton = document.getElementById('followButton');
        if (!followButton || !this.profileUserId) return;

        try {
            const response = await fetch(`/api/follow/${this.profileUserId}/status`, {
                headers: { [this.csrfHeader]: this.csrfToken }
            });

            const data = await response.json();
            if (data && data.success) {
                const action = data.isFollowing ? 'followed' : 'not-followed';
                this.updateMainFollowButton(followButton, action);
                this.updateFollowCounters(data);
            }

        } catch (error) {
            console.error('Failed to load follow status:', error);
        }
    }

    // ==================== UI ОБНОВЛЕНИЯ ====================

    /**
     * Обновява главния follow бутон
     */
    updateMainFollowButton(button, action) {
        if (!button) return;

        const icon = button.querySelector('i');
        const span = button.querySelector('span');

        if (action === 'followed') {
            button.dataset.action = 'unfollow';
            button.className = 'btn btn-outline-secondary action-btn follow-btn';
            if (icon) icon.className = 'bi bi-person-dash';
            if (span) span.textContent = 'Не следвай';
        } else {
            button.dataset.action = 'follow';
            button.className = 'btn btn-primary action-btn follow-btn';
            if (icon) icon.className = 'bi bi-person-plus';
            if (span) span.textContent = 'Следвай';
        }
    }

    /**
     * Обновява follow бутона в user картата
     */
    updateUserCardFollowButton(button, action) {
        if (!button) return;

        const userCard = button.closest('.user-card');
        const icon = button.querySelector('i');
        const span = button.querySelector('span');

        if (action === 'followed') {
            userCard.setAttribute('data-following', 'true');
            button.className = 'btn btn-outline-secondary btn-sm user-follow-btn';
            button.dataset.action = 'unfollow';
            if (icon) icon.className = 'bi bi-person-dash';
            if (span) span.textContent = 'Не следвай';
        } else {
            userCard.removeAttribute('data-following');
            button.className = 'btn btn-primary btn-sm user-follow-btn';
            button.dataset.action = 'follow';
            if (icon) icon.className = 'bi bi-person-plus';
            if (span) span.textContent = 'Следвай';
        }
    }

    /**
     * Обновява follow counters в профила
     */
    updateFollowCounters(data) {
        // Главните counters в профила
        if (data.followersCount !== undefined) {
            document.querySelectorAll('.followers-count').forEach(el => {
                el.textContent = data.followersCount;
            });
        }

        if (data.followingCount !== undefined) {
            document.querySelectorAll('.following-count').forEach(el => {
                el.textContent = data.followingCount;
            });
        }

        // Counters в tab бутоните
        const followersTabBtn = document.querySelector('[data-users-tab="followers"] .sub-tab-counter');
        const followingTabBtn = document.querySelector('[data-users-tab="following"] .sub-tab-counter');

        if (followersTabBtn && data.followersCount !== undefined) {
            followersTabBtn.textContent = data.followersCount;
        }

        if (followingTabBtn && data.followingCount !== undefined) {
            followingTabBtn.textContent = data.followingCount;
        }
    }

    /**
     * Рефрешва user картите след follow промяна
     */
    refreshUserCardsAfterFollowChange(userId, action) {
        document.querySelectorAll(`[data-user-id="${userId}"] .user-follow-btn`).forEach(button => {
            this.updateUserCardFollowButton(button, action);
        });
    }

    /**
     * Обновява pagination
     */
    updatePagination(currentPage, hasNext) {
        const container = document.getElementById('usersPagination');
        if (!container) return;

        let html = '';

        // Previous
        if (currentPage > 0) {
            html += `<button class="pagination-btn" data-page="${currentPage - 1}">‹</button>`;
        } else {
            html += `<button class="pagination-btn" disabled>‹</button>`;
        }

        // Numbers (текущата + 2 от всяка страна)
        const startPage = Math.max(0, currentPage - 2);
        const endPage = currentPage + 2;

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === currentPage ? 'active' : '';
            html += `<button class="pagination-btn ${isActive}" data-page="${i}">${i + 1}</button>`;
        }

        // Next
        if (hasNext) {
            html += `<button class="pagination-btn" data-page="${currentPage + 1}">›</button>`;
        } else {
            html += `<button class="pagination-btn" disabled>›</button>`;
        }

        container.innerHTML = html;
    }

    /**
     * Обновява информацията за резултатите
     */
    updateResultsInfo(resultsCount, searchTerm) {
        const info = document.getElementById('usersResultsInfo');
        if (!info) return;

        const searchText = searchTerm ? ` за "${searchTerm}"` : '';
        info.innerHTML = `<span class="results-count">Показани: ${resultsCount} резултата${searchText}</span>`;
    }

    // ==================== UI STATES ====================

    showLoading(tabType) {
        const loading = document.getElementById(`${tabType}Loading`);
        if (loading) loading.style.display = 'flex';
    }

    hideLoading(tabType) {
        const loading = document.getElementById(`${tabType}Loading`);
        if (loading) loading.style.display = 'none';
    }

    showError(tabType, message) {
        const grid = document.getElementById(`${tabType}Grid`);
        if (grid) {
            grid.innerHTML = `
                <div class="users-empty-state">
                    <i class="bi bi-exclamation-triangle text-danger"></i>
                    <h4>Грешка</h4>
                    <p>${message}</p>
                    <button class="btn btn-outline-primary" onclick="location.reload()">
                        <i class="bi bi-arrow-clockwise"></i> Опитай отново
                    </button>
                </div>
            `;
        }
    }

    setButtonLoading(button, loading) {
        if (!button) return;

        if (loading) {
            button.disabled = true;
            const originalHTML = button.innerHTML;
            button.dataset.originalHtml = originalHTML;
            button.innerHTML = '<i class="bi bi-hourglass-split"></i> Зарежда...';
        } else {
            button.disabled = false;
            if (button.dataset.originalHtml) {
                button.innerHTML = button.dataset.originalHtml;
                delete button.dataset.originalHtml;
            }
        }
    }

    // ==================== API ЗАЯВКИ ====================

    async followUser(userId) {
        const response = await fetch(`/api/follow/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                [this.csrfHeader]: this.csrfToken
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    async unfollowUser(userId) {
        const response = await fetch(`/api/follow/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                [this.csrfHeader]: this.csrfToken
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    // ==================== UTILITY МЕТОДИ ====================

    getMetaContent(name) {
        const meta = document.querySelector(`meta[name="${name}"]`);
        return meta ? meta.getAttribute('content') : null;
    }

    showNotification(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);

        // Интеграция със съществуващата notification система
        if (window.showToast) {
            window.showToast(message, type);
        } else if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            // Fallback
            if (type === 'error') {
                alert('Грешка: ' + message);
            }
        }
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

document.addEventListener('DOMContentLoaded', () => {
    // Инициализира само ако сме в profile страница
    if (document.querySelector('.profile-hero')) {
        console.log('Initializing UserFollowSystem...');
        new UserFollowSystem();
    }
});

// CSS стилове за spinner animation
if (!document.querySelector('style[data-follow-system-styles]')) {
    const style = document.createElement('style');
    style.setAttribute('data-follow-system-styles', '');
    style.textContent = `
        .user-card-self {
            padding: 8px 12px;
            background: var(--bs-light, #f8f9fa);
            border-radius: 6px;
            font-size: 0.875rem;
            color: var(--bs-secondary, #6c757d);
            text-align: center;
            font-style: italic;
        }
        
        .users-loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3rem;
            text-align: center;
        }
        
        .users-loading-state .loading-spinner i {
            font-size: 2rem;
            color: var(--bs-primary, #0d6efd);
            animation: spin 1s linear infinite;
        }
        
        .users-empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3rem;
            text-align: center;
        }
        
        .users-empty-state i {
            font-size: 3rem;
            color: var(--bs-secondary, #6c757d);
            margin-bottom: 1rem;
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .pagination-btn.active {
            background-color: var(--bs-primary, #0d6efd);
            color: white;
            border-color: var(--bs-primary, #0d6efd);
        }
    `;
    document.head.appendChild(style);
}