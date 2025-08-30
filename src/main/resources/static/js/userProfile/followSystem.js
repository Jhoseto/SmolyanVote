/**
 * Follow System for User Profiles
 */
class UserFollowSystem {
    constructor() {
        // Вземаме CSRF токена и header името от meta таговете
        const csrfMeta = document.querySelector('meta[name="_csrf"]');
        const csrfHeaderMeta = document.querySelector('meta[name="_csrf_header"]');
        this.csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';
        this.csrfHeader = csrfHeaderMeta ? csrfHeaderMeta.getAttribute('content') : '';

        // НОВИ PROPERTIES за users табовете
        this.usersTabData = {
            followers: { page: 0, loading: false, hasNext: true, searchTerm: '' },
            following: { page: 0, loading: false, hasNext: true, searchTerm: '' }
        };
        this.searchTimeout = null;
        this.currentUsersTab = 'followers';

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadInitialFollowStatus();

        // Инициализира users табовете ако съществуват
        if (document.getElementById('users')) {
            this.initializeUsersTab();
        }
    }

    bindEvents() {
        // Follow/Unfollow button click
        document.addEventListener('click', (e) => {
            if (e.target.matches('.follow-btn, .follow-btn *')) {
                e.preventDefault();
                const button = e.target.closest('.follow-btn');
                this.handleFollowClick(button);
            }
        });
    }

    async handleFollowClick(button) {
        const userId = button.dataset.userId;
        const action = button.dataset.action;

        if (!userId) {
            console.error('User ID not found');
            return;
        }

        this.setButtonLoading(button, true);

        try {
            let response;
            if (action === 'follow') {
                response = await this.followUser(userId);
            } else {
                response = await this.unfollowUser(userId);
            }

            if (response && response.success) {
                this.updateFollowButton(button, response.action);
                this.updateFollowersCount(response.followersCount);
                this.showNotification(response.message, 'success');
            } else if (response) {
                this.showNotification(response.message, 'error');
            } else {
                this.showNotification('Възникна грешка. Опитайте отново.', 'error');
            }

        } catch (error) {
            console.error('Follow request failed:', error);
            this.showNotification('Възникна грешка. Опитайте отново.', 'error');
        } finally {
            this.setButtonLoading(button, false);
        }
    }

    async followUser(userId) {
        const res = await fetch(`/api/follow/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                [this.csrfHeader]: this.csrfToken
            }
        });
        return this.parseJSON(res);
    }

    async unfollowUser(userId) {
        const res = await fetch(`/api/follow/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                [this.csrfHeader]: this.csrfToken
            }
        });
        return this.parseJSON(res);
    }

    async loadInitialFollowStatus() {
        const followButton = document.getElementById('followButton');
        if (!followButton) return;

        const userId = followButton.dataset.userId;
        if (!userId) return;

        try {
            const res = await fetch(`/api/follow/${userId}/status`, {
                headers: {
                    [this.csrfHeader]: this.csrfToken
                }
            });
            const data = await this.parseJSON(res);

            if (data && data.success) {
                if (data.isFollowing) {
                    this.updateFollowButton(followButton, 'followed');
                }
                this.updateFollowersCount(data.followersCount);
                document.querySelectorAll('.following-count').forEach(el => el.textContent = data.followingCount);
            }

        } catch (error) {
            console.error('Failed to load follow status:', error);
        }
    }

    async parseJSON(response) {
        try {
            return await response.json();
        } catch (err) {
            console.error('Invalid JSON response:', await response.text());
            return null;
        }
    }

    updateFollowButton(button, action) {
        if (action === 'followed') {
            button.dataset.action = 'unfollow';
            button.className = 'btn btn-outline-secondary action-btn follow-btn';
            button.innerHTML = '<i class="bi bi-person-dash"></i> <span>Не следвай</span>';
        } else {
            button.dataset.action = 'follow';
            button.className = 'btn btn-primary action-btn follow-btn';
            button.innerHTML = '<i class="bi bi-person-plus"></i> <span>Следвай</span>';
        }
    }

    updateFollowersCount(newCount) {
        document.querySelectorAll('.followers-count').forEach(el => {
            el.textContent = newCount;
            el.parentElement.classList.add('stat-updated');
            setTimeout(() => el.parentElement.classList.remove('stat-updated'), 1000);
        });
    }

    setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<i class="bi bi-hourglass-split"></i> <span>Зареждане...</span>';
        } else {
            button.disabled = false;
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} notification-popup`;
        notification.innerHTML = `<i class="bi bi-${type === 'success' ? 'check-circle' : 'x-circle'}"></i> <span>${message}</span>`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    // ============= USERS TAB FUNCTIONALITY =============

    /**
     * Инициализиране на users табовете
     */
    initializeUsersTab() {
        this.bindUsersTabEvents();
        this.loadInitialUsersData();
    }

    /**
     * Event listeners за users табовете
     */
    bindUsersTabEvents() {
        // Sub-tabs switching
        document.addEventListener('click', (e) => {
            if (e.target.matches('.users-sub-tab-btn, .users-sub-tab-btn *')) {
                const button = e.target.closest('.users-sub-tab-btn');
                this.switchUsersSubTab(button);
            }
        });

        // Search input
        const searchInput = document.getElementById('usersSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.handleUsersSearch(e.target.value);
                }, 300);
            });
        }

        // User card clicks - отваряне на профил в нов таб
        document.addEventListener('click', (e) => {
            if (e.target.matches('.user-card-overlay')) {
                const userCard = e.target.closest('.user-card');
                const userId = userCard.dataset.userId;
                if (userId) {
                    window.open(`/profile/${userId}`, '_blank');
                }
            }
        });

        // Follow buttons в user картите
        document.addEventListener('click', (e) => {
            if (e.target.matches('.user-follow-btn, .user-follow-btn *')) {
                e.preventDefault();
                e.stopPropagation(); // Спира click-а да отиде до overlay
                const button = e.target.closest('.user-follow-btn');
                this.handleUserCardFollowClick(button);
            }
        });

        // Pagination buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.pagination-btn')) {
                const page = parseInt(e.target.dataset.page);
                if (!isNaN(page)) {
                    this.loadUsersPage(page);
                }
            }
        });
    }

    /**
     * Превключване между под-табовете
     */
    switchUsersSubTab(button) {
        const tabType = button.dataset.usersTab;

        // Update UI
        document.querySelectorAll('.users-sub-tab-btn').forEach(btn =>
            btn.classList.remove('active'));
        button.classList.add('active');

        document.querySelectorAll('.users-sub-content').forEach(content =>
            content.classList.remove('active'));
        document.getElementById(`${tabType}-content`).classList.add('active');

        this.currentUsersTab = tabType;

        // Зарежда данните за новия таб
        this.loadUsersData(tabType, 0);
    }

    /**
     * Първоначално зареждане на данните
     */
    loadInitialUsersData() {
        const usersTab = document.getElementById('users');
        if (!usersTab) return;

        // Зарежда само ако табът е активен
        if (usersTab.classList.contains('active')) {
            this.loadUsersData('followers', 0);
        }
    }

    /**
     * Търсене в потребители
     */
    async handleUsersSearch(searchTerm) {
        this.usersTabData[this.currentUsersTab].searchTerm = searchTerm;
        this.usersTabData[this.currentUsersTab].page = 0; // Reset to first page
        await this.loadUsersData(this.currentUsersTab, 0);
    }

    /**
     * Зареждане на потребители за определен таб и страница
     */
    async loadUsersData(tabType, page) {
        const profileUserId = this.getProfileUserId();
        if (!profileUserId) return;

        const tabData = this.usersTabData[tabType];
        if (tabData.loading) return;

        tabData.loading = true;
        this.showUsersLoading(tabType);

        try {
            const searchParam = tabData.searchTerm ? `&search=${encodeURIComponent(tabData.searchTerm)}` : '';
            const url = `/api/follow/${profileUserId}/${tabType}?page=${page}&size=20${searchParam}`;

            const response = await fetch(url, {
                headers: { [this.csrfHeader]: this.csrfToken }
            });

            const data = await this.parseJSON(response);

            if (data && data.success) {
                tabData.page = page;
                tabData.hasNext = data.hasNext;

                this.renderUsersList(tabType, data.data, data.followingIds || []);
                this.updateUsersPagination(tabType, data.currentPage, data.hasNext);
                this.updateUsersResultsInfo(data.data.length, data.searchTerm);
            } else {
                this.showUsersError(tabType, 'Грешка при зареждане на потребителите');
            }

        } catch (error) {
            console.error('Error loading users:', error);
            this.showUsersError(tabType, 'Грешка при зареждане на потребителите');
        } finally {
            tabData.loading = false;
            this.hideUsersLoading(tabType);
        }
    }

    /**
     * Зареждане на определена страница
     */
    async loadUsersPage(page) {
        await this.loadUsersData(this.currentUsersTab, page);
    }

    /**
     * Генериране на потребителски карти от Object[] данните
     */
    renderUsersList(tabType, usersData, followingIds) {
        const grid = document.getElementById(`${tabType}Grid`);
        if (!grid) return;

        if (!usersData || usersData.length === 0) {
            grid.innerHTML = '';
            document.getElementById(`${tabType}Empty`).style.display = 'block';
            return;
        }

        document.getElementById(`${tabType}Empty`).style.display = 'none';

        const userCards = usersData.map(userData =>
            this.createUserCard(userData, followingIds)).join('');

        grid.innerHTML = userCards;

        // Инициализира avatar placeholders
        setTimeout(() => {
            if (window.initializeAvatarPlaceholders) {
                window.initializeAvatarPlaceholders();
            }
        }, 100);
    }

    /**
     * Създаване на една user карта от Object[] данни
     */
    createUserCard(userData, followingIds) {
        // Object[] структура: [id, username, imageUrl, role, onlineStatus, created, followedAt, followersCount]
        const [id, username, imageUrl, role, onlineStatus, created, followedAt, followersCount] = userData;

        const isFollowing = followingIds.includes(id);
        const joinDate = new Date(created).toLocaleDateString('bg-BG', { month: '2-digit', year: 'numeric' });
        const isOnline = onlineStatus === 1;
        const isAdmin = role === 'ADMIN';

        return `
            <div class="user-card glass-card" data-user-id="${id}" ${isFollowing ? 'data-following="true"' : ''} ${isAdmin ? 'data-role="ADMIN"' : ''}>
                <div class="user-card-inner">
                    <!-- Avatar Section -->
                    <div class="user-avatar-section">
                        <div class="user-avatar avatar-placeholder" data-user-image="${imageUrl || ''}" data-username="${username}">
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
                        <button class="btn btn-primary btn-sm user-follow-btn" data-user-id="${id}" data-action="follow">
                            <i class="bi bi-person-plus"></i>
                            <span>Следвай</span>
                        </button>
                        
                        <button class="btn btn-outline-secondary btn-sm user-follow-btn following-state" 
                                data-user-id="${id}" data-action="unfollow" style="display: none;">
                            <i class="bi bi-person-dash"></i>
                            <span>Не следвай</span>
                        </button>
                    </div>
                </div>

                <!-- Click Overlay за отваряне на профил -->
                <div class="user-card-overlay" title="Отвори профил"></div>
            </div>
        `;
    }

    /**
     * Handle follow/unfollow в user картите
     */
    async handleUserCardFollowClick(button) {
        const userId = button.dataset.userId;
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
                // Обновява бутона в картата
                this.updateUserCardFollowButton(button, response.action);
                this.showNotification(response.message, 'success');

                // Обновява основните брояче в профила
                this.updateFollowersCount(response.followersCount);
            } else if (response) {
                this.showNotification(response.message, 'error');
            }

        } catch (error) {
            console.error('Follow request failed:', error);
            this.showNotification('Възникна грешка. Опитайте отново.', 'error');
        } finally {
            this.setButtonLoading(button, false);
        }
    }

    /**
     * Обновява follow бутона в user картата
     */
    updateUserCardFollowButton(button, action) {
        const userCard = button.closest('.user-card');

        if (action === 'followed') {
            userCard.setAttribute('data-following', 'true');
        } else {
            userCard.removeAttribute('data-following');
        }
    }

    // ============= UI HELPER METHODS =============

    showUsersLoading(tabType) {
        const loading = document.getElementById(`${tabType}Loading`);
        if (loading) loading.style.display = 'flex';
    }

    hideUsersLoading(tabType) {
        const loading = document.getElementById(`${tabType}Loading`);
        if (loading) loading.style.display = 'none';
    }

    showUsersError(tabType, message) {
        const grid = document.getElementById(`${tabType}Grid`);
        if (grid) {
            grid.innerHTML = `
                <div class="users-empty-state">
                    <i class="bi bi-exclamation-triangle"></i>
                    <h4>Грешка</h4>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    updateUsersPagination(tabType, currentPage, hasNext) {
        const paginationContainer = document.getElementById('usersPagination');
        if (!paginationContainer) return;

        let paginationHTML = '';

        // Previous button
        if (currentPage > 0) {
            paginationHTML += `<button class="pagination-btn" data-page="${currentPage - 1}">‹</button>`;
        } else {
            paginationHTML += `<button class="pagination-btn" disabled>‹</button>`;
        }

        // Page numbers (показва текущата + 2 от всяка страна)
        const startPage = Math.max(0, currentPage - 2);
        const endPage = currentPage + 2;

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === currentPage ? 'active' : '';
            paginationHTML += `<button class="pagination-btn ${isActive}" data-page="${i}">${i + 1}</button>`;
        }

        // Next button
        if (hasNext) {
            paginationHTML += `<button class="pagination-btn" data-page="${currentPage + 1}">›</button>`;
        } else {
            paginationHTML += `<button class="pagination-btn" disabled>›</button>`;
        }

        paginationContainer.innerHTML = paginationHTML;
    }

    updateUsersResultsInfo(resultsCount, searchTerm) {
        const resultsInfo = document.getElementById('usersResultsInfo');
        if (!resultsInfo) return;

        const searchText = searchTerm ? ` за "${searchTerm}"` : '';
        resultsInfo.innerHTML = `<span class="results-count">Показани: ${resultsCount} резултата${searchText}</span>`;
    }

    getProfileUserId() {
        const userInfo = document.querySelector('.user-info-section');
        return userInfo ? userInfo.dataset.userId : null;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.profile-hero')) {
        new UserFollowSystem();
    }
});