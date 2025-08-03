// ====== ENHANCED FILTERS MANAGER JS ======
// Файл: src/main/resources/static/js/publications/filtersManager.js

class FiltersManager {
    constructor() {
        this.filters = this.loadFiltersFromStorage();
        this.searchCache = new Map();
        this.debounceTimeout = null;
        this.lastSearchQuery = '';

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.restoreUIFromFilters();
        this.updateURL();
    }

    loadFiltersFromStorage() {
        try {
            // ПОПРАВКА: По-безопасно зареждане на филтри
            const filters = this.getDefaultFilters();

            // Merge with URL params if present
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.toString()) {
                ['search', 'category', 'status', 'sort', 'time', 'author'].forEach(key => {
                    if (urlParams.has(key)) {
                        filters[key] = urlParams.get(key);
                    }
                });
            }

            // ПОПРАВКА: Опитваме localStorage само ако е наличен и работи
            try {
                if (typeof Storage !== 'undefined' && localStorage) {
                    const stored = localStorage.getItem('smolyan_publications_filters');
                    if (stored) {
                        const storedFilters = JSON.parse(stored);
                        // Merge stored filters но URL params имат приоритет
                        Object.keys(storedFilters).forEach(key => {
                            if (!urlParams.has(key)) {
                                filters[key] = storedFilters[key];
                            }
                        });
                    }
                }
            } catch (storageError) {
                console.warn('localStorage not available, using session filters:', storageError);
            }

            return filters;
        } catch (error) {
            console.error('Error loading filters:', error);
            return this.getDefaultFilters();
        }
    }

    getDefaultFilters() {
        return {
            search: '',
            category: '',
            status: '',
            sort: 'date-desc',
            time: '',
            author: ''
        };
    }

    saveFiltersToStorage() {
        // ПОПРАВКА: По-безопасно запазване
        try {
            if (typeof Storage !== 'undefined' && localStorage) {
                localStorage.setItem('smolyan_publications_filters', JSON.stringify(this.filters));
            } else {
            }
        } catch (error) {
            console.warn('Failed to save filters to localStorage:', error);
        }
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const value = e.target.value.trim();
                this.updateSearchUI(value);
                this.debouncedUpdateFilter('search', value);
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.updateFilter('search', searchInput.value.trim());
                }
            });
        }

        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    this.updateSearchUI('');
                    this.updateFilter('search', '');
                }
            });
        }

        // Filter options
        document.querySelectorAll('.filter-option').forEach(option => {
            option.addEventListener('click', () => {
                const filterType = option.dataset.filter;
                const filterValue = option.dataset.value;

                // Update active state
                this.updateFilterOptionUI(filterType, filterValue);

                // Update filter
                this.updateFilter(filterType, filterValue);
            });
        });

        // Clear all filters
        const clearAllBtn = document.getElementById('clearAllFilters');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearAllFilters();
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
    }

    updateFilter(filterType, value) {
        this.filters[filterType] = value;
        this.saveFiltersToStorage();
        this.updateActiveFiltersDisplay();
        this.updateURL();

        // Clear cache when filters change
        if (filterType !== 'search') {
            this.searchCache.clear();
        }

        // Notify main manager
        if (window.publicationsManager) {
            window.publicationsManager.onFiltersChanged(this.filters);
        }
    }

    debouncedUpdateFilter(filterType, value) {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
            this.updateFilter(filterType, value);
        }, 300);
    }

    updateSearchUI(value) {
        const clearBtn = document.getElementById('clearSearch');
        if (clearBtn) {
            clearBtn.style.display = value ? 'block' : 'none';
        }
    }

    updateFilterOptionUI(filterType, filterValue) {
        const options = document.querySelectorAll(`[data-filter="${filterType}"]`);
        options.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.value === filterValue) {
                option.classList.add('active');
            }
        });
    }

    restoreUIFromFilters() {
        // Restore search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput && this.filters.search) {
            searchInput.value = this.filters.search;
            this.updateSearchUI(this.filters.search);
        }

        // Restore filter options
        Object.keys(this.filters).forEach(filterType => {
            if (this.filters[filterType]) {
                this.updateFilterOptionUI(filterType, this.filters[filterType]);
            }
        });

        this.updateActiveFiltersDisplay();
    }

    clearAllFilters() {
        this.filters = this.getDefaultFilters();
        this.saveFiltersToStorage();
        this.searchCache.clear();

        // Reset UI
        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');

        if (searchInput) searchInput.value = '';
        if (clearSearch) clearSearch.style.display = 'none';

        // Reset filter options
        document.querySelectorAll('.filter-option.active').forEach(option => {
            option.classList.remove('active');
        });

        // Activate default options
        document.querySelectorAll('.filter-option[data-value=""]').forEach(option => {
            option.classList.add('active');
        });

        // Activate default sort
        const defaultSortOption = document.querySelector('.filter-option[data-filter="sort"][data-value="date-desc"]');
        if (defaultSortOption) {
            defaultSortOption.classList.add('active');
        }

        this.updateActiveFiltersDisplay();
        this.updateURL();

        // Notify main manager
        if (window.publicationsManager) {
            window.publicationsManager.onFiltersChanged(this.filters);
        }
    }

    updateActiveFiltersDisplay() {
        const summary = document.getElementById('activeFiltersSummary');
        const list = document.getElementById('activeFiltersList');

        if (!summary || !list) return;

        const activeFilters = Object.keys(this.filters).filter(key =>
            this.filters[key] && key !== 'sort' && this.filters[key] !== 'date-desc'
        );

        if (activeFilters.length === 0) {
            summary.style.display = 'none';
            return;
        }

        summary.style.display = 'block';
        list.innerHTML = '';

        activeFilters.forEach(filterType => {
            const value = this.filters[filterType];
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
                    this.removeFilter(filterType);
                });
            }

            list.appendChild(tag);
        });
    }

    removeFilter(filterType) {
        this.updateFilter(filterType, '');

        // Update UI
        const options = document.querySelectorAll(`[data-filter="${filterType}"]`);
        options.forEach(option => option.classList.remove('active'));

        const defaultOption = document.querySelector(`[data-filter="${filterType}"][data-value=""]`);
        if (defaultOption) {
            defaultOption.classList.add('active');
        }

        // Clear search input if removing search filter
        if (filterType === 'search') {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = '';
            this.updateSearchUI('');
        }
    }

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

    // ПОПРАВКА: Съвместимост с backend енуми
    getCategoryText(category) {
        const texts = {
            'news': 'Новини',
            'infrastructure': 'Инфраструктура',
            'municipal': 'Община',
            'initiatives': 'Граждански инициативи',
            'culture': 'Културни събития',
            'other': 'Други'
        };
        return texts[category?.toLowerCase()] || category;
    }

    getStatusText(status) {
        const texts = {
            'published': 'Публикувани',
            'review': 'За преглед',
            'draft': 'Чернови'
        };
        return texts[status?.toLowerCase()] || status;
    }

    getTimeText(time) {
        const texts = {
            'today': 'Днес',
            'week': 'Тази седмица',
            'month': 'Този месец',
            'year': 'Тази година'
        };
        return texts[time] || time;
    }

    getAuthorText(author) {
        const texts = {
            'me': 'Моите публикации',
            'following': 'Следвани автори'
        };
        return texts[author] || author;
    }

    getSortText(sort) {
        const texts = {
            'date-desc': 'Най-нови',
            'date-asc': 'Най-стари',
            'likes': 'Най-харесвани',
            'views': 'Най-гледани',
            'comments': 'Най-коментирани'
        };
        return texts[sort] || sort;
    }

    updateURL() {
        const params = new URLSearchParams();

        const currentParams = new URLSearchParams(window.location.search);
        const openModalParam = currentParams.get('openModal');

        if (openModalParam) {
            params.set('openModal', openModalParam);
        }

        Object.keys(this.filters).forEach(key => {
            if (this.filters[key] && this.filters[key] !== 'date-desc') {
                params.set(key, this.filters[key]);
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

            // ПОПРАВКА: По-безопасна промяна на body overflow
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

            // ПОПРАВКА: Възстановяване на body overflow
            try {
                document.body.style.overflow = '';
            } catch (error) {
                console.warn('Failed to reset body overflow:', error);
            }
        }
    }

    // ====== ПОДОБРЕНИ ФИЛТРИРАЩИ МЕТОДИ ======

    // Локално филтриране на posts за instant response
    filterPostsLocally(posts) {
        if (!posts || !Array.isArray(posts)) return [];

        return posts.filter(post => {
            try {
                // Search filter
                if (this.filters.search) {
                    const searchTerm = this.filters.search.toLowerCase();
                    const searchIn = [
                        post.title || '',
                        post.excerpt || '',
                        post.content || '',
                        post.author?.username || ''
                    ].join(' ').toLowerCase();

                    if (!searchIn.includes(searchTerm)) return false;
                }

                // Category filter - ПОПРАВКА: Обработка на различни формати
                if (this.filters.category) {
                    const postCategory = this.normalizeCategory(post.category);
                    const filterCategory = this.normalizeCategory(this.filters.category);
                    if (postCategory !== filterCategory) return false;
                }

                // Status filter - ПОПРАВКА: Обработка на различни формати
                if (this.filters.status) {
                    const postStatus = this.normalizeStatus(post.status);
                    const filterStatus = this.normalizeStatus(this.filters.status);
                    if (postStatus !== filterStatus) return false;
                }

                // Time filter
                if (this.filters.time) {
                    const postDate = this.parsePostDate(post.createdAt || post.created);
                    if (!this.isWithinTimeFilter(postDate, this.filters.time)) {
                        return false;
                    }
                }

                // Author filter
                if (this.filters.author) {
                    if (this.filters.author === 'me' && post.author?.id !== window.currentUserId) {
                        return false;
                    }
                    if (this.filters.author === 'following' &&
                        window.postInteractions &&
                        !window.postInteractions.isAuthorFollowed(post.author?.id)) {
                        return false;
                    }
                }

                return true;
            } catch (error) {
                console.warn('Error filtering post:', post, error);
                return true; // По-добре да покаже post-а отколкото да го скрие заради грешка
            }
        });
    }

    // ПОПРАВКА: Нормализиране на категории
    normalizeCategory(category) {
        if (!category) return 'other';

        // Обработка на Java enum формат
        if (typeof category === 'object' && category.name) {
            return category.name.toLowerCase();
        }

        return category.toString().toLowerCase();
    }

    // ПОПРАВКА: Нормализиране на статуси
    normalizeStatus(status) {
        if (!status) return 'published';

        // Обработка на Java enum формат
        if (typeof status === 'object' && status.name) {
            return status.name.toLowerCase();
        }

        return status.toString().toLowerCase();
    }

    // ПОПРАВКА: По-гъвкаво парсване на дати
    parsePostDate(dateInput) {
        if (!dateInput) return new Date();

        if (dateInput instanceof Date) {
            return dateInput;
        }

        if (typeof dateInput === 'string') {
            return new Date(dateInput);
        }

        // Java LocalDateTime като масив: [year, month, day, hour, minute, second]
        if (Array.isArray(dateInput) && dateInput.length >= 3) {
            return new Date(
                dateInput[0],
                dateInput[1] - 1, // Java месеците са 1-базирани
                dateInput[2],
                dateInput[3] || 0,
                dateInput[4] || 0,
                dateInput[5] || 0
            );
        }

        return new Date(dateInput);
    }

    isWithinTimeFilter(postDate, timeFilter) {
        if (isNaN(postDate.getTime())) return true; // Невалидна дата - показваме я

        const now = new Date();

        switch (timeFilter) {
            case 'today':
                return postDate.toDateString() === now.toDateString();
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return postDate >= weekAgo;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return postDate >= monthAgo;
            case 'year':
                const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                return postDate >= yearAgo;
            default:
                return true;
        }
    }

    // Подобрено сортиране
    sortPosts(posts) {
        if (!posts || !Array.isArray(posts)) return [];

        const sortBy = this.filters.sort || 'date-desc';

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

    // Public API
    getCurrentFilters() {
        return { ...this.filters };
    }

    setFilter(filterType, value) {
        this.updateFilter(filterType, value);
    }

    hasActiveFilters() {
        return Object.keys(this.filters).some(key =>
            this.filters[key] && key !== 'sort' && this.filters[key] !== 'date-desc'
        );
    }

    getFilterCount() {
        return Object.keys(this.filters).filter(key =>
            this.filters[key] && key !== 'sort' && this.filters[key] !== 'date-desc'
        ).length;
    }

    // Cache management
    getCachedResults(key) {
        const cached = this.searchCache.get(key);
        if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes
            return cached.data;
        }
        return null;
    }

    setCachedResults(key, data) {
        this.searchCache.set(key, {
            data: data,
            timestamp: Date.now()
        });

        // Limit cache size
        if (this.searchCache.size > 20) {
            const firstKey = this.searchCache.keys().next().value;
            this.searchCache.delete(firstKey);
        }
    }

    clearCache() {
        this.searchCache.clear();
    }
}

// Global functions
window.clearAllFilters = function() {
    if (window.filtersManager) {
        window.filtersManager.clearAllFilters();
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.filtersManager = new FiltersManager();

        // Update mobile filter toggle badge
        const updateFilterBadge = () => {
            const toggle = document.getElementById('mobileFilterToggle');
            const count = window.filtersManager.getFilterCount();

            if (toggle && count > 0) {
                const button = toggle.querySelector('.filter-toggle-btn');
                if (button) {
                    button.innerHTML = `
                        <i class="bi bi-funnel-fill"></i>
                        <span>Филтри (${count})</span>
                    `;
                }
            } else if (toggle) {
                const button = toggle.querySelector('.filter-toggle-btn');
                if (button) {
                    button.innerHTML = `
                        <i class="bi bi-funnel"></i>
                        <span>Филтри</span>
                    `;
                }
            }
        };

        // Update badge when filters change
        const originalUpdateFilter = window.filtersManager.updateFilter;
        window.filtersManager.updateFilter = function(...args) {
            originalUpdateFilter.apply(this, args);
            updateFilterBadge();
        };

        updateFilterBadge();


    } catch (error) {
        console.error('Failed to initialize FiltersManager:', error);
    }
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FiltersManager;
}