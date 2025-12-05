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
            this.initializeUsersTab();
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
                const username = userCard?.querySelector('.user-card-username')?.textContent?.trim();
                if (username) {
                    window.open(`/user/${username}`, '_blank');
                }
            }
        });

        // Dropdown меню опции
        document.addEventListener('click', (e) => {
            // Follow/Unfollow от dropdown
            if (e.target.matches('.user-follow-link') || e.target.closest('.user-follow-link')) {
                e.preventDefault();
                e.stopPropagation();
                const link = e.target.closest('.user-follow-link');
                const userId = link?.dataset.userId;
                if (userId) {
                    this.handleFollowAction(userId, 'follow', link);
                }
            }

            if (e.target.matches('.user-unfollow-link') || e.target.closest('.user-unfollow-link')) {
                e.preventDefault();
                e.stopPropagation();
                const link = e.target.closest('.user-unfollow-link');
                const userId = link?.dataset.userId;
                if (userId) {
                    this.handleFollowAction(userId, 'unfollow', link);
                }
            }

            // Съобщение от dropdown
            if (e.target.matches('.user-message-link') || e.target.closest('.user-message-link')) {
                e.preventDefault();
                e.stopPropagation();
                const link = e.target.closest('.user-message-link');
                const userId = link?.dataset.userId;
                if (userId) {
                    this.handleMessageAction(userId);
                }
            }

            // Докладвай от dropdown
            if (e.target.matches('.user-report-link') || e.target.closest('.user-report-link')) {
                e.preventDefault();
                e.stopPropagation();
                const link = e.target.closest('.user-report-link');
                const userId = link?.dataset.userId;
                if (userId) {
                    this.handleReportAction(userId);
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

        // Затваря dropdown-ите при клик извън тях
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-card-dropdown')) {
                this.closeAllDropdowns();
            }
        });

        // Препозиционира dropdown-ите при resize на прозореца
        window.addEventListener('resize', () => {
            this.closeAllDropdowns();
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

        // Hero действия за чужд профил
        this.delegateEvent('.profile-follow-link', 'click', async (e, button) => {
            e.preventDefault();
            e.stopPropagation();
            if (button?.dataset?.userId) {
                await this.handleFollowAction(button.dataset.userId, 'follow', button);
            }
        });

        this.delegateEvent('.profile-unfollow-link', 'click', async (e, button) => {
            e.preventDefault();
            e.stopPropagation();
            if (button?.dataset?.userId) {
                await this.handleFollowAction(button.dataset.userId, 'unfollow', button);
            }
        });

        this.delegateEvent('.profile-message-link', 'click', async (e, button) => {
            e.preventDefault();
            e.stopPropagation();
            if (button?.dataset?.userId) {
                await this.handleMessageAction(button.dataset.userId);
            }
        });

        this.delegateEvent('.profile-report-link', 'click', (e, button) => {
            e.preventDefault();
            e.stopPropagation();
            if (button?.dataset?.userId) {
                this.handleReportAction(button.dataset.userId);
            }
        });
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
            this.loadTabData('followers');
        } else {
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

        tabData.loading = true;
        this.showLoading(tabType);

        try {
            const searchParam = tabData.searchTerm ?
                `&search=${encodeURIComponent(tabData.searchTerm)}` : '';
            const url = `/api/follow/${this.profileUserId}/${tabType}?page=${page}&size=20${searchParam}`;

            const response = await fetch(url, {
                headers: { [this.csrfHeader]: this.csrfToken }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

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

        // Инициализира avatar placeholders и dropdown-ите
        setTimeout(() => {
            if (window.initializeAvatarPlaceholders) {
                window.initializeAvatarPlaceholders();
            }
            // Инициализира dropdown-ите след като DOM-ът е готов
            this.initializeDropdowns();
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
                        
                        <!-- Dropdown Menu -->
                        <div class="user-card-dropdown">
                            <button class="dropdown-toggle" 
                                    type="button" 
                                    title="Още опции">
                                <i class="bi bi-three-dots"></i>
                            </button>
                            <ul class="dropdown-menu">
                                ${this.generateDropdownMenuHTML(id, username, isCurrentUser, isFollowing)}
                            </ul>
                        </div>
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
        // Ако е собствения потребител - показваме само "Това сте вие"
        if (isCurrentUser) {
            return '<div class="user-card-self"><---></div>';
        }

        // Ако не е логнат - не показваме нищо
        if (!this.isAuthenticated) {
            return '';
        }

        // За други потребители - показваме бутон САМО когато НЕ се следват
        if (!isFollowing) {
            return `
                <button class="user-follow-btn" 
                        data-user-id="${userId}" data-action="follow">
                    <i class="bi bi-person-plus"></i>
                    <span>Следвай</span>
                </button>
            `;
        } else {
            // Когато се следва - не показваме бутон (опцията е в менюто)
            return '';
        }
    }

    /**
     * Генерира HTML за dropdown менюто според контекста
     */
    generateDropdownMenuHTML(userId, username, isCurrentUser, isFollowing) {
        let menuItems = [];

        // Винаги показваме опция за преглед на профила
        menuItems.push(`
            <li>
                <a class="dropdown-item user-profile-link" href="/user/${username}" data-user-id="${userId}" target="_blank">
                    <i class="bi bi-person"></i>
                    <span>Преглед на профила</span>
                </a>
            </li>
        `);

        // Ако е собствения потребител - показваме само преглед на профила
        if (isCurrentUser) {
            return menuItems.join('');
        }

        // Ако не е логнат - показваме само преглед на профила
        if (!this.isAuthenticated) {
            return menuItems.join('');
        }

        // За други потребители - показваме follow/unfollow опции
        if (isFollowing) {
            menuItems.push(`
                <li>
                    <a class="dropdown-item user-unfollow-link" href="#" data-user-id="${userId}">
                        <i class="bi bi-person-dash"></i>
                        <span>Не следвай</span>
                    </a>
                </li>
            `);
        } else {
            menuItems.push(`
                <li>
                    <a class="dropdown-item user-follow-link" href="#" data-user-id="${userId}">
                        <i class="bi bi-person-plus"></i>
                        <span>Следвай</span>
                    </a>
                </li>
            `);
        }

        // Съобщение опция
        menuItems.push(`
            <li>
                <a class="dropdown-item user-message-link" href="#" data-user-id="${userId}">
                    <i class="bi bi-chat-dots"></i>
                    <span>Изпрати съобщение</span>
                </a>
            </li>
        `);

        // Разделител
        menuItems.push('<li><hr class="dropdown-divider"></li>');

        // Докладвай опция
        menuItems.push(`
            <li>
                <a class="dropdown-item user-report-link" href="#" data-user-id="${userId}">
                    <i class="bi bi-flag"></i>
                    <span>Докладвай потребител</span>
                </a>
            </li>
        `);

        return menuItems.join('');
    }

    // ==================== DROPDOWN ИНИЦИАЛИЗАЦИЯ ====================

    /**
     * Инициализира custom dropdown-ите
     */
    initializeDropdowns() {
        // Инициализира всички dropdown-и в user картите
        const dropdownToggles = document.querySelectorAll('.user-card-dropdown .dropdown-toggle');
        dropdownToggles.forEach((toggle, index) => {
            
            // Премахва всички съществуващи event listeners
            const newToggle = toggle.cloneNode(true);
            toggle.parentNode.replaceChild(newToggle, toggle);
            
            // Добавя нов event listener
            newToggle.addEventListener('click', this.handleDropdownToggle.bind(this));
        });
    }

    /**
     * Handle на dropdown toggle
     */
    handleDropdownToggle(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const toggle = e.target.closest('.dropdown-toggle');
        const dropdown = toggle.nextElementSibling;
        
        if (!dropdown) {
            return;
        }
        
        // Затваря всички други dropdown-и
        this.closeAllDropdowns();
        
        // Показва/скрива текущия dropdown
        if (dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        } else {
            dropdown.classList.add('show');
        }
    }

    /**
     * Затваря всички dropdown-и
     */
    closeAllDropdowns() {
        const openDropdowns = document.querySelectorAll('.user-card-dropdown .dropdown-menu');
        openDropdowns.forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }

    // ==================== FOLLOW ОПЕРАЦИИ ====================

    /**
     * Handle на главния follow бутон
     */
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
     * Handle на follow/unfollow действия от dropdown
     */
    async handleFollowAction(userId, action, button = null) {
        if (!this.isAuthenticated) return;

        if (button) {
            this.setButtonLoading(button, true);
        }

        try {
            let response;
            if (action === 'follow') {
                response = await this.followUser(userId);
            } else {
                response = await this.unfollowUser(userId);
            }

            if (response && response.success) {
                // Определяме дали потребителят се следва СЛЕД операцията
                const isFollowingAfterAction = action === 'follow';
                this.updateFollowUI(userId, isFollowingAfterAction);
                if (response.followersCount !== undefined || response.followingCount !== undefined) {
                    this.updateFollowCounters(response);
                }
                this.showNotification(response.message, 'success');
            } else {
                this.showNotification(response?.message || 'Възникна грешка', 'error');
            }

        } catch (error) {
            console.error('Follow action error:', error);
            this.showNotification('Възникна грешка. Опитайте отново.', 'error');
        } finally {
            if (button) {
                this.setButtonLoading(button, false);
            }
        }
    }

    /**
     * Handle на съобщение действие
     */
    async handleMessageAction(userId) {
        // Проверяваме дали SVMessenger е наличен
        if (window.SVMessenger && window.SVMessenger.startConversation) {
            try {
                // Стартираме разговор с потребителя
                const conversation = await window.SVMessenger.startConversation(userId);
                
                // Отваряме чат прозореца
                if (window.SVMessenger.openChat) {
                    window.SVMessenger.openChat(conversation.id);
                }
            } catch (error) {
                console.error('SVMessenger: Failed to start conversation:', error);
                this.showNotification('Грешка при отваряне на чат прозорец', 'error');
            }
        } else {
            // Ако SVMessenger не е наличен, чакаме малко и пробваме отново
            setTimeout(async () => {
                if (window.SVMessenger && window.SVMessenger.startConversation) {
                    try {
                        const conversation = await window.SVMessenger.startConversation(userId);
                        
                        // Отваряме чат прозореца
                        if (window.SVMessenger.openChat) {
                            window.SVMessenger.openChat(conversation.id);
                        }
                    } catch (error) {
                        console.error('SVMessenger: Failed to start conversation:', error);
                        this.showNotification('Грешка при отваряне на чат прозорец', 'error');
                    }
                } else {
                    // Ако SVMessenger не работи, показваме съобщение
                    this.showNotification('Чат системата не е налична в момента', 'error');
                }
            }, 2000);
        }
    }

    /**
     * Handle на докладване действие
     */
    async handleReportAction(userId) {
        if (!this.isAuthenticated) {
            if (typeof window.showLoginWarning === 'function') {
                window.showLoginWarning();
            } else {
                alert('За да докладвате потребител, моля влезте в системата!');
            }
            return;
        }

        if (!userId) {
            console.error('User ID is required for reporting');
            this.showNotification('Грешка: Липсва ID на потребителя', 'error');
            return;
        }

        // Проверка за SweetAlert2
        if (typeof Swal === 'undefined') {
            console.error('SweetAlert2 не е достъпен');
            this.showNotification('Възникна проблем със системата. Моля опитайте отново.', 'error');
            return;
        }

        // Показване на модал за докладване
        Swal.fire({
            title: 'Докладвай потребител',
            html: `
                <div style="text-align: left; margin-bottom: 20px;">
                    <p style="margin-bottom: 15px; color: #666; font-size: 14px;">Защо докладвате този потребител?</p>
                    <select id="reportReason" class="swal2-select" style="width: 85%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px;">
                        <option value="SPAM">🚫 Спам или нежелано съдържание</option>
                        <option value="HARASSMENT">⚠️ Тормоз или заплахи</option>
                        <option value="HATE_SPEECH">😡 Език на омразата</option>
                        <option value="MISINFORMATION">❌ Дезинформация или фалшиви новини</option>
                        <option value="INAPPROPRIATE">🔞 Неподходящо съдържание</option>
                        <option value="COPYRIGHT">📝 Нарушение на авторски права</option>
                        <option value="OTHER">❓ Друго</option>
                    </select>
                    
                    <!-- Поле за описание - показва се само при "Друго" -->
                    <div id="descriptionContainer" style="margin-top: 15px; display: none;">
                        <label for="reportDescription" style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
                            Опишете проблема:
                        </label>
                        <textarea 
                            id="reportDescription" 
                            placeholder="Моля, опишете подробно защо докладвате този потребител..."
                            style="width: 85%; min-height: 80px; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; resize: vertical; font-family: inherit;"
                            maxlength="500"
                        ></textarea>
                        <div style="text-align: right; font-size: 12px; color: #999; margin-top: 5px;">
                            <span id="charCounter">0/500 знака</span>
                        </div>
                    </div>
                    
                    <p style="margin-top: 15px; font-size: 12px; color: #999;">
                        Вашият доклад ще бъде прегледан от нашия екип в рамките на 24 часа.
                    </p>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: '<i class="bi bi-flag-fill"></i> Изпрати доклад',
            cancelButtonText: '<i class="bi bi-x"></i> Отказ',
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#6c757d',
            buttonsStyling: true,
            customClass: {
                popup: 'animated fadeInDown',
                confirmButton: 'btn btn-danger',
                cancelButton: 'btn btn-secondary'
            },
            didOpen: () => {
                // Настройване на event listeners за динамичното показване на описанието
                const reasonSelect = document.getElementById('reportReason');
                const descriptionContainer = document.getElementById('descriptionContainer');
                const reportDescription = document.getElementById('reportDescription');
                const charCounter = document.getElementById('charCounter');

                if (reasonSelect && descriptionContainer) {
                    reasonSelect.addEventListener('change', () => {
                        if (reasonSelect.value === 'OTHER') {
                            descriptionContainer.style.display = 'block';
                            reportDescription.focus();
                        } else {
                            descriptionContainer.style.display = 'none';
                        }
                    });
                }

                // Character counter за описанието
                if (reportDescription && charCounter) {
                    reportDescription.addEventListener('input', () => {
                        const length = reportDescription.value.length;
                        charCounter.textContent = `${length}/500 знака`;

                        if (length > 450) {
                            charCounter.style.color = '#e74c3c';
                        } else if (length > 400) {
                            charCounter.style.color = '#f39c12';
                        } else {
                            charCounter.style.color = '#999';
                        }
                    });
                }
            },
            preConfirm: () => {
                const reason = document.getElementById('reportReason').value;
                const description = document.getElementById('reportDescription').value.trim();

                if (!reason) {
                    Swal.showValidationMessage('<i class="bi bi-exclamation-triangle"></i> Моля, изберете причина за докладването!');
                    return false;
                }

                // Валидация за описанието при избор "Друго"
                if (reason === 'OTHER' && !description) {
                    Swal.showValidationMessage('<i class="bi bi-exclamation-triangle"></i> Моля, опишете причината за докладването!');
                    return false;
                }

                // Валидация за дължина на описанието
                if (description && description.length < 10) {
                    Swal.showValidationMessage('<i class="bi bi-exclamation-triangle"></i> Описанието трябва да е поне 10 знака!');
                    return false;
                }

                if (description && description.length > 500) {
                    Swal.showValidationMessage('<i class="bi bi-exclamation-triangle"></i> Описанието не може да бъде повече от 500 знака!');
                    return false;
                }

                return { reason, description };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                await this.submitUserReport(userId, result.value.reason, result.value.description);
            }
        });
    }

    /**
     * Изпраща доклад за потребител
     */
    async submitUserReport(userId, reason, description) {
        try {
            const response = await fetch(`/api/reports/USER/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': this.csrfToken
                },
                body: JSON.stringify({
                    reason: reason,
                    description: description || null
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Докладът е изпратен!',
                    text: data.message || 'Благодарим ви за доклада. Ще прегледаме случая в рамките на 24 часа.',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#4cb15c'
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Грешка',
                    text: data.error || 'Възникна грешка при изпращането на доклада. Моля опитайте отново.',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#e74c3c'
                });
            }
        } catch (error) {
            console.error('Error submitting user report:', error);
            Swal.fire({
                icon: 'error',
                title: 'Грешка',
                text: 'Възникна неочаквана грешка. Моля опитайте отново по-късно.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#e74c3c'
            });
        }
    }

    /**
     * Обновява UI-то след follow/unfollow операция
     */
    updateFollowUI(userId, isFollowing) {
        // Обновяваме бутоните в hero секцията
        this.toggleHeroFollowButtons(isFollowing);

        // Обновяваме user картите - прегенерираме цялата карта
        const userCards = document.querySelectorAll(`[data-user-id="${userId}"]`);
        userCards.forEach(card => {
            if (card.classList.contains('user-card')) {
                // Намираме родителския контейнер
                const grid = card.closest('.users-grid');
                if (grid) {
                    // Прегенерираме картата с новата логика
                    const userId = card.dataset.userId;
                    const isCurrentUser = parseInt(userId) === this.currentUserId;
                    
                    // Създаваме нова карта с правилната логика
                    const newCardHTML = this.createUserCard(
                        [userId, card.querySelector('.user-card-username')?.textContent || '', 
                         card.querySelector('.user-avatar')?.getAttribute('data-user-image') || '',
                         'USER', 0, new Date(), new Date(), 0], 
                        isFollowing ? [parseInt(userId)] : []
                    );
                    
                    // Заменяме старата карта с новата
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = newCardHTML;
                    const newCard = tempDiv.firstElementChild;
                    card.parentNode.replaceChild(newCard, card);
                    
                    // Инициализираме dropdown-а за новата карта
                    setTimeout(() => {
                        this.initializeDropdowns();
                    }, 50);
                }
            }
        });
    }

    toggleHeroFollowButtons(isFollowing) {
        const followBtn = document.getElementById('profileFollowBtn');
        const unfollowBtn = document.getElementById('profileUnfollowBtn');

        if (followBtn) {
            if (isFollowing) {
                followBtn.classList.add('d-none');
            } else {
                followBtn.classList.remove('d-none');
            }
        }

        if (unfollowBtn) {
            if (isFollowing) {
                unfollowBtn.classList.remove('d-none');
            } else {
                unfollowBtn.classList.add('d-none');
            }
        }
    }

    /**
     * Зарежда началното follow състояние
     */
    async loadInitialFollowStatus() {
        const followBtn = document.getElementById('profileFollowBtn');
        const unfollowBtn = document.getElementById('profileUnfollowBtn');
        if (!this.profileUserId || (!followBtn && !unfollowBtn)) return;

        try {
            const response = await fetch(`/api/follow/${this.profileUserId}/status`, {
                headers: { [this.csrfHeader]: this.csrfToken }
            });

            const data = await response.json();
            if (data && data.success) {
                this.toggleHeroFollowButtons(data.isFollowing);
                this.updateFollowCounters(data);
            }

        } catch (error) {
            console.error('Failed to load follow status:', error);
        }
    }

    // ==================== UI ОБНОВЛЕНИЯ ====================

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

    /**
     * Event delegation helper - регистрира event listener на document level
     * за елементи, които могат да се появят динамично
     */
    delegateEvent(selector, event, handler) {
        document.addEventListener(event, (e) => {
            const target = e.target.closest(selector);
            if (target) {
                handler(e, target);
            }
        });
    }

    getMetaContent(name) {
        const meta = document.querySelector(`meta[name="${name}"]`);
        return meta ? meta.getAttribute('content') : null;
    }

    showNotification(message, type = 'info') {

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
