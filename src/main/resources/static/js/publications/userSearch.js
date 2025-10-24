/**
 * User Search Manager for Publications Page
 * Handles user search, selection, and filtering functionality
 */
class UserSearchManager {
    constructor() {
        this.selectedUsers = [];
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.debounceTimer = null;
        this.debounceDelay = 300;
        this.minSearchLength = 2;
        
        this.elements = {
            panel: null,
            content: null,
            input: null,
            dropdown: null,
            selectedList: null,
            loading: null,
            expandBtn: null
        };
        
        this.init();
    }
    
    /**
     * Initialize the user search functionality
     */
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.loadFromLocalStorage();
        this.syncWithURL();
        this.updateUI();
        
        // Notify filters manager after loading from storage/URL
        if (this.selectedUsers.length > 0) {
            this.notifyFiltersManager();
        }
        
        console.log('🔍 UserSearchManager initialized');
    }
    
    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements.panel = document.getElementById('userSearchContent');
        this.elements.content = document.getElementById('userSearchContent');
        this.elements.input = document.getElementById('userSearchInput');
        this.elements.dropdown = document.getElementById('userSearchDropdown');
        this.elements.selectedList = document.getElementById('selectedUsersList');
        this.elements.loading = document.getElementById('searchLoading');
        this.elements.expandBtn = document.getElementById('expandUserSearch');
        
        if (!this.elements.input) {
            console.error('❌ User search input not found');
            return;
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search input
        this.elements.input?.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });
        
        this.elements.input?.addEventListener('focus', () => {
            if (this.elements.input.value.length >= this.minSearchLength) {
                this.elements.dropdown?.classList.add('show');
            }
        });
        
        // Expand/collapse button
        this.elements.expandBtn?.addEventListener('click', () => {
            this.togglePanel();
        });
        
        // Click outside to close dropdown
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-search-panel')) {
                this.hideDropdown();
            }
        });
        
        // Keyboard navigation
        this.elements.input?.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
    }
    
    /**
     * Handle search input with debouncing
     */
    handleSearchInput(query) {
        const trimmedQuery = query.trim();
        
        // Clear previous timer
        clearTimeout(this.debounceTimer);
        
        if (trimmedQuery.length < this.minSearchLength) {
            this.hideDropdown();
            return;
        }
        
        // Show loading
        this.showLoading(true);
        
        // Debounce search
        this.debounceTimer = setTimeout(() => {
            this.searchUsers(trimmedQuery);
        }, this.debounceDelay);
    }
    
    /**
     * Search users via API
     */
    async searchUsers(query) {
        try {
            // Check cache first
            if (this.cache.has(query)) {
                const cached = this.cache.get(query);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    this.renderSearchResults(cached.data);
                    this.showLoading(false);
                    return;
                }
            }
            
            // Make API call
            const response = await fetch(`/api/svmessenger/users/search?query=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': window.appData?.csrfToken || ''
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const users = await response.json();
            
            // Cache results
            this.cache.set(query, {
                data: users,
                timestamp: Date.now()
            });
            
            this.renderSearchResults(users);
            
        } catch (error) {
            console.error('❌ Error searching users:', error);
            this.renderSearchError();
        } finally {
            this.showLoading(false);
        }
    }
    
    /**
     * Render search results
     */
    renderSearchResults(users) {
        if (!this.elements.dropdown) return;
        
        if (users.length === 0) {
            this.elements.dropdown.innerHTML = `
                <div class="user-search-empty">
                    <i class="bi bi-person-x"></i>
                    <div>Няма намерени потребители</div>
                </div>
            `;
        } else {
            this.elements.dropdown.innerHTML = users.map(user => this.createUserResultHTML(user)).join('');
        }
        
        this.elements.dropdown.classList.add('show');
        this.setupResultEventListeners();
    }
    
    /**
     * Create HTML for user result
     */
    createUserResultHTML(user) {
        const avatarUrl = user.imageUrl || '/images/default-avatar.png';
        const fullName = this.escapeHtml(user.fullName || user.username);
        const username = this.escapeHtml(user.username);
        const isOnline = user.isOnline ? 'online' : 'offline';
        
        return `
            <div class="user-search-result" data-user-id="${user.id}">
                <img src="${avatarUrl}" alt="${fullName}" class="user-avatar" 
                     onerror="this.src='/images/default-avatar.png'">
                <div class="user-info">
                    <div class="user-name">${fullName}</div>
                    <div class="user-username">@${username}</div>
                </div>
                <div class="online-indicator ${isOnline}"></div>
            </div>
        `;
    }
    
    /**
     * Setup event listeners for search results
     */
    setupResultEventListeners() {
        const results = this.elements.dropdown?.querySelectorAll('.user-search-result');
        results?.forEach(result => {
            result.addEventListener('click', (e) => {
                e.stopPropagation();
                const userId = parseInt(result.dataset.userId);
                const user = this.getUserFromResult(result);
                this.showContextMenu(user, e);
            });
        });
    }
    
    /**
     * Get user data from result element
     */
    getUserFromResult(resultElement) {
        const userId = parseInt(resultElement.dataset.userId);
        const nameElement = resultElement.querySelector('.user-name');
        const usernameElement = resultElement.querySelector('.user-username');
        const avatarElement = resultElement.querySelector('.user-avatar');
        const onlineElement = resultElement.querySelector('.online-indicator');
        
        return {
            id: userId,
            fullName: nameElement?.textContent || '',
            username: usernameElement?.textContent?.replace('@', '') || '',
            imageUrl: avatarElement?.src || '/images/default-avatar.png',
            isOnline: onlineElement?.classList.contains('online') || false
        };
    }
    
    /**
     * Show context menu for user
     */
    showContextMenu(user, event) {
        // Remove existing menu
        const existingMenu = document.querySelector('.user-context-menu');
        existingMenu?.remove();
        
        // Create new menu
        const menu = document.createElement('div');
        menu.className = 'user-context-menu show';
        menu.innerHTML = `
            <div class="user-context-menu-item" data-action="filter">
                <i class="bi bi-funnel-fill"></i>
                <span>Покажи публикациите</span>
            </div>
            <div class="user-context-menu-item" data-action="profile">
                <i class="bi bi-person"></i>
                <span>Разгледай профила</span>
            </div>
        `;
        
        // Position menu
        const rect = event.target.getBoundingClientRect();
        menu.style.left = `${rect.left}px`;
        menu.style.top = `${rect.bottom + 4}px`;
        
        document.body.appendChild(menu);
        
        // Setup menu event listeners
        menu.addEventListener('click', (e) => {
            const action = e.target.closest('.user-context-menu-item')?.dataset.action;
            if (action === 'filter') {
                this.addUserToFilter(user);
            } else if (action === 'profile') {
                this.openUserProfile(user);
            }
            menu.remove();
        });
        
        // Close menu on outside click
        setTimeout(() => {
            document.addEventListener('click', () => {
                menu.remove();
            }, { once: true });
        }, 100);
    }
    
    /**
     * Add user to filter
     */
    addUserToFilter(user) {
        // Check if already selected
        if (this.selectedUsers.some(u => u.id === user.id)) {
            return;
        }
        
        this.selectedUsers.push(user);
        this.updateUI();
        this.saveToLocalStorage();
        this.notifyFiltersManager();
        this.hideDropdown();
        
        console.log('✅ User added to filter:', user.username);
    }
    
    /**
     * Remove user from filter
     */
    removeUserFromFilter(userId) {
        this.selectedUsers = this.selectedUsers.filter(u => u.id !== userId);
        this.updateUI();
        this.saveToLocalStorage();
        this.notifyFiltersManager();
        
        console.log('✅ User removed from filter:', userId);
    }
    
    /**
     * Open user profile
     */
    openUserProfile(user) {
        window.open(`/user/${user.username}`, '_blank');
    }
    
    /**
     * Update UI elements
     */
    updateUI() {
        this.updateSelectedUsersList();
        this.updateExpandButton();
    }
    
    /**
     * Update selected users list
     */
    updateSelectedUsersList() {
        if (!this.elements.selectedList) return;
        
        if (this.selectedUsers.length === 0) {
            this.elements.selectedList.innerHTML = '';
            return;
        }
        
        this.elements.selectedList.innerHTML = this.selectedUsers.map(user => `
            <div class="selected-user-tag" data-user-id="${user.id}">
                <img src="${user.imageUrl}" alt="${user.fullName}" class="user-avatar"
                     onerror="this.src='/images/default-avatar.png'">
                <span class="user-name">${this.escapeHtml(user.fullName)}</span>
                <button class="remove-btn" type="button" title="Премахни">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `).join('');
        
        // Setup remove button listeners
        this.elements.selectedList.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const userId = parseInt(btn.closest('.selected-user-tag').dataset.userId);
                this.removeUserFromFilter(userId);
            });
        });
    }
    
    /**
     * Update expand button state
     */
    updateExpandButton() {
        if (!this.elements.expandBtn) return;
        
        const hasUsers = this.selectedUsers.length > 0;
        this.elements.expandBtn.classList.toggle('collapsed', !hasUsers);
    }
    
    /**
     * Toggle panel visibility
     */
    togglePanel() {
        if (!this.elements.content) return;
        
        const isCollapsed = this.elements.content.classList.contains('collapsed');
        this.elements.content.classList.toggle('collapsed', !isCollapsed);
        this.elements.expandBtn?.classList.toggle('collapsed', !isCollapsed);
    }
    
    /**
     * Show/hide loading indicator
     */
    showLoading(show) {
        if (this.elements.loading) {
            this.elements.loading.style.display = show ? 'block' : 'none';
        }
    }
    
    /**
     * Hide dropdown
     */
    hideDropdown() {
        this.elements.dropdown?.classList.remove('show');
    }
    
    /**
     * Handle keyboard navigation
     */
    handleKeyboardNavigation(e) {
        if (e.key === 'Escape') {
            this.hideDropdown();
            this.elements.input?.blur();
        }
    }
    
    /**
     * Render search error
     */
    renderSearchError() {
        if (!this.elements.dropdown) return;
        
        this.elements.dropdown.innerHTML = `
            <div class="user-search-empty">
                <i class="bi bi-exclamation-triangle"></i>
                <div>Грешка при търсене</div>
            </div>
        `;
        this.elements.dropdown.classList.add('show');
    }
    
    /**
     * Get selected user IDs
     */
    getSelectedUserIds() {
        return this.selectedUsers.map(user => user.id);
    }
    
    /**
     * Clear search
     */
    clearSearch() {
        this.elements.input.value = '';
        this.hideDropdown();
    }
    
    /**
     * Clear all selected users
     */
    clearAllUsers() {
        this.selectedUsers = [];
        this.updateUI();
        this.saveToLocalStorage();
        this.notifyFiltersManager();
    }
    
    /**
     * Save to localStorage
     */
    saveToLocalStorage() {
        try {
            localStorage.setItem('publications_selected_users', JSON.stringify(this.selectedUsers));
        } catch (error) {
            console.warn('⚠️ Could not save to localStorage:', error);
        }
    }
    
    /**
     * Load from localStorage
     */
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('publications_selected_users');
            if (saved) {
                this.selectedUsers = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('⚠️ Could not load from localStorage:', error);
        }
    }

    /**
     * Sync with URL parameters
     */
    syncWithURL() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const userIdsParam = urlParams.get('userIds');
            
            if (userIdsParam) {
                const userIds = userIdsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
                
                // Filter selectedUsers to only include users from URL
                this.selectedUsers = this.selectedUsers.filter(user => userIds.includes(user.id));
                
                // If there are userIds in URL but missing in selectedUsers, add placeholders
                userIds.forEach(id => {
                    if (!this.selectedUsers.some(u => u.id === id)) {
                        const savedUser = this.findUserInLocalStorage(id);
                        if (savedUser) {
                            this.selectedUsers.push(savedUser);
                        }
                    }
                });
            }
        } catch (error) {
            console.warn('⚠️ Could not sync with URL:', error);
        }
    }

    /**
     * Find user in localStorage by ID
     */
    findUserInLocalStorage(userId) {
        try {
            const saved = localStorage.getItem('publications_selected_users');
            if (saved) {
                const users = JSON.parse(saved);
                return users.find(u => u.id === userId);
            }
        } catch (error) {
            return null;
        }
        return null;
    }
    
    /**
     * Notify filters manager
     */
    notifyFiltersManager() {
        if (window.filtersManager) {
            window.filtersManager.setUserFilter(this.getSelectedUserIds());
        } else {
            console.warn('⚠️ filtersManager not available yet, retrying...');
            // Retry after a short delay
            setTimeout(() => {
                if (window.filtersManager) {
                    window.filtersManager.setUserFilter(this.getSelectedUserIds());
                }
            }, 100);
        }
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for filtersManager to be ready
    const initUserSearch = () => {
        if (window.filtersManager) {
            window.userSearchManager = new UserSearchManager();
            console.log('✅ UserSearchManager initialized with filtersManager');
        } else {
            console.log('⏳ Waiting for filtersManager...');
            setTimeout(initUserSearch, 100);
        }
    };
    
    initUserSearch();
});

// Export for global access
window.UserSearchManager = UserSearchManager;
