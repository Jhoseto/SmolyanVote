/**
 * ENHANCED FILTERS MANAGER - Refactored for maximum efficiency
 * Centralized filter management with minimal code, maximum effect
 */

class FiltersManager {
    constructor() {
        // Central state management
        this.activeFilters = this.getDefaultFilters();
        this.lastAppliedFilters = null;
        this.observers = new Set();
        this.debounceTimers = new Map();
        this.initialCategoryCounts = null;
        
        // Initialize
        this.init();
    }

    /**
     * Initialize the filters manager
     */
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeFilters());
        } else {
            this.initializeFilters();
        }
    }

    /**
     * Initialize filters after DOM is ready
     */
    initializeFilters() {
        this.loadFromStorage();
        this.syncWithURL();
        this.setupEventListeners();
        this.saveInitialCategoryCounts();
        this.applyFilters();
        
        // Auto-load publications if publicationsManager is available
        this.autoLoadPublications();
    }

    /**
     * Save initial category counts from HTML
     */
    saveInitialCategoryCounts() {
        if (this.initialCategoryCounts) return;
        
        const categoryMap = {
            '': 'total',
            'news': 'news',
            'infrastructure': 'infrastructure',
            'municipal': 'municipal',
            'initiatives': 'initiatives',
            'culture': 'culture',
            'other': 'other'
        };

        this.initialCategoryCounts = {};
        Object.keys(categoryMap).forEach(categoryValue => {
            const countKey = categoryMap[categoryValue];
            const countElement = document.querySelector(
                `[data-filter="category"][data-value="${categoryValue}"] .count`
            );
            if (countElement) {
                this.initialCategoryCounts[countKey] = parseInt(countElement.textContent) || 0;
            }
        });
    }

    /**
     * Restore initial category counts
     */
    restoreInitialCategoryCounts() {
        if (!this.initialCategoryCounts) {
            this.saveInitialCategoryCounts();
        }
        
        if (this.initialCategoryCounts) {
            this.updateCategoryCountsUI(this.initialCategoryCounts);
        }
    }

    /**
     * Auto-load publications when everything is ready
     */
    async autoLoadPublications() {
        // Wait a bit for all components to initialize
        setTimeout(async () => {
            if (window.publicationsManager && typeof window.publicationsManager.loadInitialPosts === 'function') {
                console.log('🔄 Auto-loading publications...');
                try {
                    await window.publicationsManager.loadInitialPosts();
                    console.log('✅ Publications loaded successfully');
                } catch (error) {
                    console.error('❌ Error auto-loading publications:', error);
                }
            }
        }, 500);
    }

    /**
     * Get default filter values
     * @returns {Object} Default filters object
     */
    getDefaultFilters() {
        return {
            search: '',
            category: '',
            status: '',
            sort: 'date-desc',
            time: '',
            author: '',
            userIds: []
        };
    }

    /**
     * Set filter value
     * @param {string} key - Filter key
     * @param {*} value - Filter value
     */
    set(key, value) {
        const normalizedValue = this.normalizeValue(value);
        if (this.activeFilters[key] !== normalizedValue) {
            this.activeFilters[key] = normalizedValue;
            this.emitChange();
            this.debouncedSync();
            this.applyFilters();
        }
    }

    /**
     * Get filter value
     * @param {string} key - Filter key
     * @returns {*} Filter value
     */
    get(key) {
        return this.activeFilters[key];
    }

    /**
     * Get all active filters
     * @returns {Object} All active filters
     */
    getAll() {
        // ✅ КРИТИЧНО: Синхронизирай с userSearchManager
        if (window.userSearchManager && window.userSearchManager.getSelectedUserIds) {
            const userIds = window.userSearchManager.getSelectedUserIds();
            if (userIds && userIds.length > 0) {
                this.activeFilters.userIds = userIds;
            } else if (this.activeFilters.userIds && this.activeFilters.userIds.length === 0) {
                delete this.activeFilters.userIds;
            }
        }
        
        return { ...this.activeFilters };
    }

    /**
     * Reset filters to default values
     * @param {boolean} keepDefaults - Whether to keep default values
     */
    reset(keepDefaults = false) {
        const defaultFilters = this.getDefaultFilters();
        this.activeFilters = keepDefaults ? defaultFilters : this.getDefaultFilters();
        this.emitChange();
        this.syncWithURL();
        this.applyFilters();
    }

    /**
     * Apply filters (centralized UI update)
     */
    applyFilters() {
        this.debouncedCall('applyFilters', () => {
            if (this.hasFiltersChanged()) {
                this.updateUI();
                this.saveToStorage();
                this.notifyPublicationsManager();
                this.lastAppliedFilters = { ...this.activeFilters };
            }
        }, 200);
    }

    /**
     * Get payload for backend request
     * @returns {Object} Clean payload without empty values
     */
    getPayload() {
        const payload = {};
        Object.keys(this.activeFilters).forEach(key => {
            const value = this.activeFilters[key];
            if (this.isValidValue(value)) {
                payload[key] = value;
            }
        });
        
        // ✅ КРИТИЧНО: Винаги включвай userIds ако има избрани users
        if (this.activeFilters.userIds && Array.isArray(this.activeFilters.userIds) && this.activeFilters.userIds.length > 0) {
            payload.userIds = this.activeFilters.userIds;
        }
        
        return payload;
    }

    /**
     * Filter posts locally
     * @param {Array} posts - Posts to filter
     * @returns {Array} Filtered posts
     */
    filterPostsLocally(posts) {
        if (!posts || !Array.isArray(posts)) return [];

        return posts.filter(post => {
            try {
                // Search filter
                if (this.activeFilters.search) {
                    const searchTerm = this.activeFilters.search.toLowerCase();
                    const searchIn = [
                        post.title || '',
                        post.excerpt || '',
                        post.content || '',
                        post.author?.username || ''
                    ].join(' ').toLowerCase();

                    if (!searchIn.includes(searchTerm)) return false;
                }

                // Category filter
                if (this.activeFilters.category) {
                    const postCategory = this.normalizeCategory(post.category);
                    const filterCategory = this.normalizeCategory(this.activeFilters.category);
                    if (postCategory !== filterCategory) return false;
                }

                // Status filter
                if (this.activeFilters.status) {
                    const postStatus = this.normalizeStatus(post.status);
                    const filterStatus = this.normalizeStatus(this.activeFilters.status);
                    if (postStatus !== filterStatus) return false;
                }

                // Time filter
                if (this.activeFilters.time) {
                    const postDate = this.parsePostDate(post.createdAt || post.created);
                    if (!this.isWithinTimeFilter(postDate, this.activeFilters.time)) {
                        return false;
                    }
                }

                // Author filter
                if (this.activeFilters.author) {
                    if (this.activeFilters.author === 'me' && post.author?.id !== window.currentUserId) {
                        return false;
                    }
                    if (this.activeFilters.author === 'following' &&
                        window.postInteractions &&
                        typeof window.postInteractions.isAuthorFollowed === 'function' &&
                        !window.postInteractions.isAuthorFollowed(post.author?.id)) {
                        return false;
                    }
                }

                // User IDs filter
                if (this.activeFilters.userIds && this.activeFilters.userIds.length > 0) {
                    if (!post.author?.id || !this.activeFilters.userIds.includes(post.author.id)) {
                        return false;
                    }
                }

                return true;
        } catch (error) {
                console.warn('Error filtering post:', post, error);
                return true;
            }
        });
    }

    /**
     * Sort posts
     * @param {Array} posts - Posts to sort
     * @returns {Array} Sorted posts
     */
    sortPosts(posts) {
        if (!posts || !Array.isArray(posts)) return [];

        const sortBy = this.activeFilters.sort || 'date-desc';

        return [...posts].sort((a, b) => {
            try {
                switch (sortBy) {
                    case 'date-desc':
                        const dateA = this.parsePostDate(a.createdAt || a.created);
                        const dateB = this.parsePostDate(b.createdAt || b.created);
                        return dateB - dateA;
                    case 'date-asc':
                        const dateA2 = this.parsePostDate(a.createdAt || a.created);
                        const dateB2 = this.parsePostDate(b.createdAt || b.created);
                        return dateA2 - dateB2;
                    case 'likes':
                        return (b.likesCount || 0) - (a.likesCount || 0);
                    case 'views':
                        return (b.viewsCount || 0) - (a.viewsCount || 0);
                    case 'comments':
                        return (b.commentsCount || 0) - (a.commentsCount || 0);
                    default:
                        return 0;
                }
            } catch (error) {
                console.warn('Error sorting posts:', error);
                return 0;
            }
        });
    }

    /**
     * Add observer for filter changes
     * @param {Function} callback - Callback function
     */
    onChange(callback) {
        this.observers.add(callback);
    }

    /**
     * Remove observer
     * @param {Function} callback - Callback function
     */
    offChange(callback) {
        this.observers.delete(callback);
    }

    /**
     * Emit change to all observers
     */
    emitChange() {
        this.observers.forEach(callback => {
            try {
                callback(this.activeFilters);
        } catch (error) {
                console.warn('Error in filter change observer:', error);
            }
        });
    }

    /**
     * Set user filter (for user search integration)
     * @param {Array} userIds - Array of user IDs
     */
    setUserFilter(userIds) {
        this.set('userIds', Array.isArray(userIds) ? userIds : []);
    }

    /**
     * Get selected user IDs
     * @returns {Array} Array of user IDs
     */
    getSelectedUserIds() {
        return this.activeFilters.userIds || [];
    }

    /**
     * Get filter count
     * @returns {number} Number of active filters
     */
    getFilterCount() {
        return Object.keys(this.activeFilters).filter(key => 
            this.isValidValue(this.activeFilters[key]) && key !== 'sort' && this.activeFilters[key] !== 'date-desc'
        ).length;
    }

    /**
     * Refresh UI manually
     */
    refreshUI() {
        this.updateUI();
    }

    /**
     * Get cached results (for compatibility with publicationsMain.js)
     * @param {string} cacheKey - Optional cache key
     * @returns {Array|null} Cached results array or null if empty
     */
    getCachedResults(cacheKey = null) {
        if (cacheKey && this.cache && this.cache[cacheKey]) {
            const cached = this.cache[cacheKey];
            // Return null if empty array to force API call
            return (cached && cached.length > 0) ? cached : null;
        }
        return null;
    }

    /**
     * Check if publicationsAPI is ready and retry if needed
     * @returns {Promise<boolean>} True if API is ready
     */
    async waitForPublicationsAPI() {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max
        
        while (attempts < maxAttempts) {
            if (window.publicationsAPI && typeof window.publicationsAPI.getPublications === 'function') {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.error('publicationsAPI not available after 5 seconds');
        return false;
    }

    /**
     * Safely load publications with API check
     * @param {Object} filters - Filter parameters
     * @param {number} page - Page number
     * @param {number} size - Page size
     * @returns {Promise<Array>} Publications data
     */
    async safeLoadPublications(filters = {}, page = 0, size = 10) {
        const isAPIReady = await this.waitForPublicationsAPI();
        
        if (!isAPIReady) {
            console.error('Cannot load publications: API not available');
            return [];
        }
        
        try {
            const data = await window.publicationsAPI.getPublications(filters, page, size);
            return data || [];
        } catch (error) {
            console.error('Error loading publications:', error);
            return [];
        }
    }

    /**
     * Set cached results (for compatibility with publicationsMain.js)
     * @param {string} cacheKey - Cache key
     * @param {Array} data - Data to cache
     */
    setCachedResults(cacheKey, data) {
        if (!this.cache) {
            this.cache = {};
        }
        this.cache[cacheKey] = data;
    }


    // ===== PRIVATE METHODS =====

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        try {
        // Search input
        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const value = e.target.value.trim();
                this.updateSearchUI(value);
                    this.debouncedSet('search', value);
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                        this.set('search', searchInput.value.trim());
                }
            });
        }

        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    this.updateSearchUI('');
                        this.set('search', '');
                }
            });
        }

        // Filter options
            const filterOptions = document.querySelectorAll('.filter-option');
            if (filterOptions.length > 0) {
                filterOptions.forEach(option => {
            option.addEventListener('click', () => {
                const filterType = option.dataset.filter;
                const filterValue = option.dataset.value;

                        if (filterType && filterValue !== undefined) {
                this.updateFilterOptionUI(filterType, filterValue);
                            this.set(filterType, filterValue);
                        }
            });
        });
            }

        // Clear all filters
        const clearAllBtn = document.getElementById('clearAllFilters');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                    this.reset();
            });
        }

        // Mobile filter toggle
        const mobileToggle = document.getElementById('mobileFilterToggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                this.toggleMobileFilters();
            });
        }

        // Close mobile filters
        const closeSidebar = document.getElementById('closeSidebar');
        if (closeSidebar) {
            closeSidebar.addEventListener('click', () => {
                this.closeMobileFilters();
            });
        }

        // Close mobile filters when clicking outside
        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.left-sidebar');
            const toggle = document.getElementById('mobileFilterToggle');

            if (sidebar && sidebar.classList.contains('show') &&
                !sidebar.contains(e.target) &&
                toggle && !toggle.contains(e.target)) {
                this.closeMobileFilters();
            }
        });
        } catch (error) {
            console.warn('Error setting up event listeners:', error);
        }
    }

    /**
     * Load filters from storage
     */
    loadFromStorage() {
        try {
            // Load from URL params first
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.toString()) {
                ['search', 'category', 'status', 'sort', 'time', 'author'].forEach(key => {
                    if (urlParams.has(key)) {
                        this.activeFilters[key] = urlParams.get(key);
                    }
                });
                
                // Special handling for userIds
                if (urlParams.has('userIds')) {
                    const userIdsParam = urlParams.get('userIds');
                    if (userIdsParam) {
                        this.activeFilters.userIds = userIdsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
                    }
                }
            }

            // Load from localStorage
            if (typeof Storage !== 'undefined' && localStorage) {
                const stored = localStorage.getItem('smolyan_publications_filters');
                if (stored) {
                    const storedFilters = JSON.parse(stored);
                    // Merge stored filters but URL params have priority
                    Object.keys(storedFilters).forEach(key => {
                        if (!urlParams.has(key)) {
                            this.activeFilters[key] = storedFilters[key];
                        }
                    });
                    
                    // Special handling for userIds from localStorage
                    if (!urlParams.has('userIds') && storedFilters.userIds && Array.isArray(storedFilters.userIds)) {
                        this.activeFilters.userIds = storedFilters.userIds;
                    }
                }
            }
        } catch (error) {
            console.warn('Error loading filters from storage:', error);
        }
    }

    /**
     * Save filters to storage
     */
    saveToStorage() {
        try {
            if (typeof Storage !== 'undefined' && localStorage) {
                localStorage.setItem('smolyan_publications_filters', JSON.stringify(this.activeFilters));
            }
        } catch (error) {
            console.warn('Failed to save filters to localStorage:', error);
        }
    }

    /**
     * Sync with URL (debounced)
     */
    syncWithURL() {
        this.debouncedCall('syncWithURL', () => {
            const params = new URLSearchParams();
            const currentParams = new URLSearchParams(window.location.search);
            const openModalParam = currentParams.get('openModal');

            if (openModalParam) {
                params.set('openModal', openModalParam);
            }

            Object.keys(this.activeFilters).forEach(key => {
                const value = this.activeFilters[key];
                if (this.isValidValue(value) && value !== 'date-desc') {
                    if (key === 'userIds' && Array.isArray(value) && value.length > 0) {
                        params.set(key, value.join(','));
                    } else if (key !== 'userIds') {
                        params.set(key, value);
                    }
                }
            });

            const newURL = params.toString() ?
                `${window.location.pathname}?${params.toString()}` :
                window.location.pathname;

            try {
                window.history.replaceState({}, '', newURL);
            } catch (error) {
                console.warn('Failed to update URL:', error);
            }
        }, 300);
    }

    /**
     * Update UI components
     */
    updateUI() {
        this.updateSearchUI();
        this.updateFilterOptionsUI();
        this.updateActiveFiltersDisplay();
        this.updateMobileFilterBadge();
    }

    /**
     * Update search UI
     */
    updateSearchUI(value = null) {
        const searchInput = document.getElementById('searchInput');
        const clearBtn = document.getElementById('clearSearch');
        
        if (searchInput) {
            if (value !== null) {
                searchInput.value = value;
            } else {
                searchInput.value = this.activeFilters.search || '';
            }
        }
        
        if (clearBtn) {
            const hasValue = (value !== null ? value : this.activeFilters.search) || '';
            clearBtn.style.display = hasValue ? 'block' : 'none';
        }
    }

    /**
     * Update filter options UI
     */
    updateFilterOptionsUI() {
        Object.keys(this.activeFilters).forEach(filterType => {
            const value = this.activeFilters[filterType];
            if (value) {
                this.updateFilterOptionUI(filterType, value);
            }
        });
    }

    /**
     * Update single filter option UI
     */
    updateFilterOptionUI(filterType, filterValue) {
        const options = document.querySelectorAll(`[data-filter="${filterType}"]`);
        options.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.value === filterValue) {
                option.classList.add('active');
            }
        });
    }

    /**
     * Update active filters display
     */
    updateActiveFiltersDisplay() {
        const summary = document.getElementById('activeFiltersSummary');
        const list = document.getElementById('activeFiltersList');

        if (!summary || !list) return;

        const activeFilters = Object.keys(this.activeFilters).filter(key =>
            this.isValidValue(this.activeFilters[key]) && key !== 'sort' && this.activeFilters[key] !== 'date-desc'
        );

        // Check if display needs to be updated
        const shouldShow = activeFilters.length > 0;
        const isCurrentlyShown = summary.style.display !== 'none';
        
        if (shouldShow === isCurrentlyShown && shouldShow) {
            // Check if content is the same
            const currentContent = list.innerHTML;
            const newContent = activeFilters.map(filterType => {
                const value = this.activeFilters[filterType];
                return `<div class="active-filter-tag">
                    <span>${this.getFilterDisplayName(filterType, value)}</span>
                    <button class="remove-filter-btn" data-filter="${filterType}">&times;</button>
                </div>`;
            }).join('');
            
            if (currentContent === newContent) {
                return; // No need to update
            }
        }

        if (activeFilters.length === 0) {
            summary.style.display = 'none';
            return;
        }

        summary.style.display = 'block';
        list.innerHTML = '';

        activeFilters.forEach(filterType => {
            const value = this.activeFilters[filterType];
            const tag = document.createElement('div');
            tag.className = 'active-filter-tag';
            tag.innerHTML = `
                <span>${this.getFilterDisplayName(filterType, value)}</span>
                <button class="remove-filter-btn" data-filter="${filterType}">&times;</button>
            `;

            // Add click listener to remove button
            const removeBtn = tag.querySelector('.remove-filter-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.set(filterType, '');
                });
            }

            list.appendChild(tag);
        });
    }

    /**
     * Update mobile filter badge
     */
    updateMobileFilterBadge() {
        const toggle = document.getElementById('mobileFilterToggle');
        const count = this.getFilterCount();

        if (toggle) {
            const button = toggle.querySelector('.filter-toggle-btn');
            if (button) {
                if (count > 0) {
                    button.innerHTML = `
                        <i class="bi bi-funnel-fill"></i>
                        <span>Филтри (${count})</span>
                    `;
                } else {
                    button.innerHTML = `
                        <i class="bi bi-funnel"></i>
                        <span>Филтри</span>
                    `;
                }
            }
        }
    }

    /**
     * Notify publications manager
     */
    notifyPublicationsManager() {
        if (window.publicationsManager && typeof window.publicationsManager.onFiltersChanged === 'function') {
            // Always use server-side filtering for all filters including userIds
            window.publicationsManager.onFiltersChanged(this.activeFilters);
        }
        // Update category counts after filter change
        this.updateCategoryCounts();
    }

    /**
     * Update category counts based on loaded publications
     */
    updateCategoryCounts() {
        // If no user filter is active, restore initial counts
        if (!this.activeFilters.userIds || this.activeFilters.userIds.length === 0) {
            this.restoreInitialCategoryCounts();
            return;
        }

        if (!window.publicationsManager || !window.publicationsManager.allLoadedPosts) {
            return;
        }

        const posts = window.publicationsManager.allLoadedPosts || [];
        const counts = {
            total: posts.length,
            news: 0,
            infrastructure: 0,
            municipal: 0,
            initiatives: 0,
            culture: 0,
            other: 0
        };

        posts.forEach(post => {
            const category = this.normalizeCategory(post.category || 'other');
            if (counts.hasOwnProperty(category)) {
                counts[category]++;
            } else {
                counts.other++;
            }
        });

        this.updateCategoryCountsUI(counts);
    }

    /**
     * Update category counts in UI
     */
    updateCategoryCountsUI(counts) {
        const categoryMap = {
            '': 'total',
            'news': 'news',
            'infrastructure': 'infrastructure',
            'municipal': 'municipal',
            'initiatives': 'initiatives',
            'culture': 'culture',
            'other': 'other'
        };

        Object.keys(categoryMap).forEach(categoryValue => {
            const countKey = categoryMap[categoryValue];
            const countElement = document.querySelector(
                `[data-filter="category"][data-value="${categoryValue}"] .count`
            );
            if (countElement && counts.hasOwnProperty(countKey)) {
                countElement.textContent = counts[countKey];
            }
        });
    }

    // ===== UTILITY METHODS =====

    /**
     * Normalize value
     * @param {*} value - Value to normalize
     * @returns {*} Normalized value
     */
    normalizeValue(value) {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return value.trim();
        if (Array.isArray(value)) return value.filter(item => item !== null && item !== undefined);
        return value;
    }

    /**
     * Check if value is valid (not empty)
     * @param {*} value - Value to check
     * @returns {boolean} True if valid
     */
    isValidValue(value) {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim() !== '';
        if (Array.isArray(value)) return value.length > 0;
        return true;
    }

    /**
     * Check if filters have changed
     * @returns {boolean} True if changed
     */
    hasFiltersChanged() {
        if (!this.lastAppliedFilters) return true;
        return JSON.stringify(this.activeFilters) !== JSON.stringify(this.lastAppliedFilters);
    }

    /**
     * Debounced set method
     * @param {string} key - Filter key
     * @param {*} value - Filter value
     */
    debouncedSet(key, value) {
        this.debouncedCall(`set_${key}`, () => {
            this.set(key, value);
        }, 300);
    }

    /**
     * Debounced sync
     */
    debouncedSync() {
        this.debouncedCall('sync', () => {
            this.syncWithURL();
        }, 300);
    }

    /**
     * Generic debounced call
     * @param {string} key - Debounce key
     * @param {Function} callback - Callback function
     * @param {number} delay - Delay in ms
     */
    debouncedCall(key, callback, delay) {
        clearTimeout(this.debounceTimers.get(key));
        this.debounceTimers.set(key, setTimeout(callback, delay));
    }

    // ===== LEGACY COMPATIBILITY METHODS =====

    /**
     * Legacy method for backward compatibility
     * @param {string} filterType - Filter type
     * @param {*} value - Filter value
     */
    updateFilter(filterType, value) {
        this.set(filterType, value);
    }

    /**
     * Legacy method for backward compatibility
     * @param {string} filterType - Filter type
     * @param {*} value - Filter value
     */
    debouncedUpdateFilter(filterType, value) {
        this.debouncedSet(filterType, value);
    }

    /**
     * Legacy method for backward compatibility
     */
    clearAllFilters() {
        this.reset();
    }

    /**
     * Legacy method for backward compatibility
     * @param {string} filterType - Filter type
     */
    removeFilter(filterType) {
        this.set(filterType, '');
    }

    /**
     * Legacy method for backward compatibility
     * @returns {Object} Current filters
     */
    getCurrentFilters() {
        return this.getAll();
    }

    /**
     * Legacy method for backward compatibility
     * @param {string} filterType - Filter type
     * @param {*} value - Filter value
     */
    setFilter(filterType, value) {
        this.set(filterType, value);
    }

    /**
     * Legacy method for backward compatibility
     * @returns {boolean} True if has active filters
     */
    hasActiveFilters() {
        return this.getFilterCount() > 0;
    }

    // ===== HELPER METHODS =====

    /**
     * Get filter display name
     * @param {string} filterType - Filter type
     * @param {*} value - Filter value
     * @returns {string} Display name
     */
    getFilterDisplayName(filterType, value) {
        const filterNames = {
            search: `"${value}"`,
            category: this.getCategoryText(value),
            status: this.getStatusText(value),
            time: this.getTimeText(value),
            author: this.getAuthorText(value),
            sort: this.getSortText(value)
        };
        return filterNames[filterType] || value;
    }

    getCategoryText(category) {
        if (!category) return 'Други';
        const categoryStr = typeof category === 'string' ? category : (category.name || String(category));
        const texts = {
            'news': 'Новини',
            'infrastructure': 'Инфраструктура',
            'municipal': 'Община',
            'initiatives': 'Граждански инициативи',
            'culture': 'Културни събития',
            'other': 'Други'
        };
        return texts[categoryStr.toLowerCase()] || categoryStr;
    }

    getStatusText(status) {
        if (!status) return 'Публикувани';
        const statusStr = typeof status === 'string' ? status : (status.name || String(status));
        const texts = {
            'published': 'Публикувани',
            'review': 'За преглед',
            'draft': 'Чернови'
        };
        return texts[statusStr.toLowerCase()] || statusStr;
    }

    getTimeText(time) {
        if (!time) return '';
        const timeStr = typeof time === 'string' ? time : (time.name || String(time));
        const texts = {
            'today': 'Днес',
            'week': 'Тази седмица',
            'month': 'Този месец',
            'year': 'Тази година'
        };
        return texts[timeStr] || timeStr;
    }

    getAuthorText(author) {
        if (!author) return '';
        const authorStr = typeof author === 'string' ? author : (author.name || String(author));
        const texts = {
            'me': 'Моите публикации',
            'following': 'Следвани автори'
        };
        return texts[authorStr] || authorStr;
    }

    getSortText(sort) {
        if (!sort) return 'Най-нови';
        const texts = {
            'date-desc': 'Най-нови',
            'date-asc': 'Най-стари',
            'likes': 'Най-харесвани',
            'views': 'Най-гледани',
            'comments': 'Най-коментирани'
        };
        return texts[sort] || sort;
    }

    normalizeCategory(category) {
        if (!category) return 'other';
        if (typeof category === 'object' && category.name) {
            return category.name.toLowerCase();
        }
        return category.toString().toLowerCase();
    }

    normalizeStatus(status) {
        if (!status) return 'published';
        if (typeof status === 'object' && status.name) {
            return status.name.toLowerCase();
        }
        return status.toString().toLowerCase();
    }

    parsePostDate(dateInput) {
        if (!dateInput) return new Date();
        if (dateInput instanceof Date) return dateInput;
        if (typeof dateInput === 'string') return new Date(dateInput);
        if (Array.isArray(dateInput) && dateInput.length >= 3) {
            return new Date(
                dateInput[0], // година
                dateInput[1] - 1, // месец (Java месеците са 1-базирани)
                dateInput[2], // ден
                dateInput[3] || 0, // час
                dateInput[4] || 0, // минута
                dateInput[5] || 0  // секунда
            );
        }
        return new Date(dateInput);
    }

    isWithinTimeFilter(postDate, timeFilter) {
        if (isNaN(postDate.getTime())) return true;
        const now = new Date();

        switch (timeFilter) {
            case 'today':
                return postDate.toDateString() === now.toDateString();
            case 'week':
                const weekAgo = new Date(now);
                weekAgo.setDate(now.getDate() - 7);
                return postDate >= weekAgo;
            case 'month':
                const monthAgo = new Date(now);
                monthAgo.setMonth(now.getMonth() - 1);
                return postDate >= monthAgo;
            case 'year':
                const yearAgo = new Date(now);
                yearAgo.setFullYear(now.getFullYear() - 1);
                return postDate >= yearAgo;
            default:
                return true;
        }
    }

    // Mobile functions
    toggleMobileFilters() {
        const sidebar = document.querySelector('.left-sidebar');
        const overlay = document.getElementById('mobileOverlay');

        if (sidebar) {
            sidebar.classList.toggle('show');
            if (overlay) {
                overlay.style.display = sidebar.classList.contains('show') ? 'block' : 'none';
            }
            try {
                document.body.style.overflow = sidebar.classList.contains('show') ? 'hidden' : '';
            } catch (error) {
                console.warn('Failed to set body overflow:', error);
            }
        }
    }

    closeMobileFilters() {
        const sidebar = document.querySelector('.left-sidebar');
        const overlay = document.getElementById('mobileOverlay');

        if (sidebar) {
            sidebar.classList.remove('show');
            if (overlay) {
                overlay.style.display = 'none';
            }
            try {
                document.body.style.overflow = '';
            } catch (error) {
                console.warn('Failed to reset body overflow:', error);
            }
        }
    }
}

// Global functions for backward compatibility
window.clearAllFilters = function() {
    if (window.filtersManager) {
        window.filtersManager.clearAllFilters();
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.filtersManager = new FiltersManager();
    } catch (error) {
        console.error('Failed to initialize FiltersManager:', error);
    }
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FiltersManager;
}