// ====== FILTERS MANAGER JS ======
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
            const saved = localStorage.getItem('smolyan_publications_filters');
            const filters = saved ? JSON.parse(saved) : this.getDefaultFilters();

            // Merge with URL params if present
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.toString()) {
                ['search', 'category', 'status', 'sort', 'time', 'author'].forEach(key => {
                    if (urlParams.has(key)) {
                        filters[key] = urlParams.get(key);
                    }
                });
            }

            return filters;
        } catch (error) {
            console.error('Error loading filters from storage:', error);
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
        try {
            localStorage.setItem('smolyan_publications_filters', JSON.stringify(this.filters));
        } catch (error) {
            console.error('Error saving filters to storage:', error);
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
                searchInput.value = '';
                this.updateSearchUI('');
                this.updateFilter('search', '');
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

        // Close mobile filters when clicking outside
        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.left-sidebar');
            const toggle = document.getElementById('mobileFilterToggle');

            if (sidebar && sidebar.classList.contains('show') &&
                !sidebar.contains(e.target) &&
                !toggle.contains(e.target)) {
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
                <span class="remove" data-filter="${filterType}">&times;</span>
            `;

            // Add click listener to remove button
            const removeBtn = tag.querySelector('.remove');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFilter(filterType);
            });

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

    getCategoryText(category) {
        const texts = {
            'news': 'Новини',
            'municipal': 'Общински решения',
            'initiatives': 'Граждански инициативи',
            'culture': 'Културни събития',
            'other': 'Други'
        };
        return texts[category] || category;
    }

    getStatusText(status) {
        const texts = {
            'published': 'Публикувани',
            'review': 'За преглед',
            'draft': 'Чернови'
        };
        return texts[status] || status;
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

        Object.keys(this.filters).forEach(key => {
            if (this.filters[key] && this.filters[key] !== 'date-desc') {
                params.set(key, this.filters[key]);
            }
        });

        const newURL = params.toString() ?
            `${window.location.pathname}?${params.toString()}` :
            window.location.pathname;

        window.history.replaceState({}, '', newURL);
    }

    // Local filtering for instant response
    filterPostsLocally(posts) {
        if (!posts || posts.length === 0) return posts;

        return posts.filter(post => {
            // Search filter
            if (this.filters.search && !this.matchesSearch(post, this.filters.search)) {
                return false;
            }

            // Category filter
            if (this.filters.category && post.category !== this.filters.category) {
                return false;
            }

            // Status filter
            if (this.filters.status) {
                if (this.filters.status === 'published' && post.status !== 'PUBLISHED') {
                    return false;
                }
                if (this.filters.status === 'review' && post.status !== 'REVIEW') {
                    return false;
                }
                if (this.filters.status === 'draft' && post.status !== 'DRAFT') {
                    return false;
                }
            }

            // Time filter
            if (this.filters.time && !this.matchesTimeFilter(post, this.filters.time)) {
                return false;
            }

            // Author filter
            if (this.filters.author) {
                if (this.filters.author === 'me' && post.author.id !== window.currentUserId) {
                    return false;
                }
                // 'following' filter would need additional data
            }

            return true;
        });
    }

    matchesSearch(post, query) {
        const searchQuery = query.toLowerCase();
        const searchableText = [
            post.title,
            post.content || post.excerpt || '',
            post.author.username
        ].join(' ').toLowerCase();

        return searchableText.includes(searchQuery);
    }

    matchesTimeFilter(post, timeFilter) {
        const postDate = new Date(post.createdAt);
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

    sortPosts(posts) {
        if (!posts || posts.length === 0) return posts;

        const sortedPosts = [...posts];

        switch (this.filters.sort) {
            case 'date-asc':
                return sortedPosts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            case 'likes':
                return sortedPosts.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
            case 'views':
                return sortedPosts.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
            case 'comments':
                return sortedPosts.sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0));
            case 'date-desc':
            default:
                return sortedPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
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

    getCacheKey() {
        return JSON.stringify(this.filters);
    }

    // Mobile functions
    toggleMobileFilters() {
        const sidebar = document.querySelector('.left-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('show');
            document.body.style.overflow = sidebar.classList.contains('show') ? 'hidden' : '';
        }
    }

    closeMobileFilters() {
        const sidebar = document.querySelector('.left-sidebar');
        if (sidebar) {
            sidebar.classList.remove('show');
            document.body.style.overflow = '';
        }
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

    // Debug methods
    debugFilters() {
        console.log('Current filters:', this.filters);
        console.log('Cache size:', this.searchCache.size);
        console.log('Has active filters:', this.hasActiveFilters());
    }

    clearCache() {
        this.searchCache.clear();
        console.log('Filter cache cleared');
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
    window.filtersManager = new FiltersManager();

    // Update mobile filter toggle badge
    const updateFilterBadge = () => {
        const toggle = document.getElementById('mobileFilterToggle');
        const count = window.filtersManager.getFilterCount();

        if (toggle && count > 0) {
            toggle.innerHTML = `
                <i class="bi bi-funnel-fill"></i>
                <span>Филтри (${count})</span>
            `;
        } else if (toggle) {
            toggle.innerHTML = `
                <i class="bi bi-funnel"></i>
                <span>Филтри</span>
            `;
        }
    };

    // Update badge when filters change
    const originalUpdateFilter = window.filtersManager.updateFilter;
    window.filtersManager.updateFilter = function(...args) {
        originalUpdateFilter.apply(this, args);
        updateFilterBadge();
    };

    updateFilterBadge();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FiltersManager;
}