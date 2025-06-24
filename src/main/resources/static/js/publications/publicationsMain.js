// ====== PUBLICATIONS MAIN JS ======
// Файл: src/main/resources/static/js/publications/publicationsMain.js

class PublicationsManager {
    constructor() {
        this.isLoading = false;
        this.hasMorePosts = true;
        this.currentPage = 0;
        this.postsPerPage = 10;
        this.loadedPosts = new Set();
        this.allLoadedPosts = [];
        this.filteredPosts = [];

        this.scrollThreshold = 800;
        this.preloadThreshold = 5;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupInfiniteScroll();
        this.setupScrollToTop();
        this.loadInitialPosts();
    }

    setupEventListeners() {
        // Listen for filter changes
        if (window.filtersManager) {
            // Override the filter manager's update method to notify us
            const originalUpdate = window.filtersManager.updateFilter;
            window.filtersManager.updateFilter = (...args) => {
                originalUpdate.apply(window.filtersManager, args);
                this.onFiltersChanged(window.filtersManager.getCurrentFilters());
            };
        }
    }

    onFiltersChanged(filters) {
        // Apply filters locally first for instant response
        this.applyLocalFilters();

        // Then load from server with debounce
        this.debouncedServerLoad();
    }

    applyLocalFilters() {
        if (!window.filtersManager) return;

        const filters = window.filtersManager.getCurrentFilters();
        this.filteredPosts = window.filtersManager.filterPostsLocally(this.allLoadedPosts);
        this.filteredPosts = window.filtersManager.sortPosts(this.filteredPosts);

        this.renderFilteredPosts();
    }

    renderFilteredPosts() {
        const postsContainer = document.getElementById('postsContainer');
        if (!postsContainer) return;

        postsContainer.innerHTML = '';

        if (this.filteredPosts.length === 0) {
            this.showNoResults();
            return;
        }

        this.filteredPosts.forEach(post => {
            const postElement = this.createPostElement(post);
            postsContainer.appendChild(postElement);
        });

        this.hideNoResults();
    }

    debouncedServerLoad() {
        clearTimeout(this.serverLoadTimeout);
        this.serverLoadTimeout = setTimeout(() => {
            this.loadInitialPosts();
        }, 500);
    }

    async loadInitialPosts() {
        this.showLoading();
        this.currentPage = 0;
        this.hasMorePosts = true;
        this.loadedPosts.clear();
        this.allLoadedPosts = [];

        const postsContainer = document.getElementById('postsContainer');
        if (postsContainer) {
            postsContainer.innerHTML = '';
        }

        await this.loadMorePosts();
    }

    async loadMorePosts() {
        if (this.isLoading || !this.hasMorePosts) return;

        this.isLoading = true;
        this.showLoading();

        try {
            const filters = window.filtersManager ? window.filtersManager.getCurrentFilters() : {};
            const cacheKey = this.getCacheKey(filters, this.currentPage);

            // Try cache first
            let data = window.filtersManager ? window.filtersManager.getCachedResults(cacheKey) : null;

            if (!data) {
                data = await window.publicationsAPI.getPublications(filters, this.currentPage, this.postsPerPage);

                // Cache the results
                if (window.filtersManager) {
                    window.filtersManager.setCachedResults(cacheKey, data);
                }
            }

            if (data.publications && data.publications.length > 0) {
                // Add to all loaded posts
                data.publications.forEach(post => {
                    if (!this.loadedPosts.has(post.id)) {
                        this.allLoadedPosts.push(post);
                        this.loadedPosts.add(post.id);
                    }
                });

                this.renderPosts(data.publications);
                this.currentPage++;
                this.hasMorePosts = data.publications.length === this.postsPerPage;

                // Preload next page if we're getting close
                if (this.hasMorePosts && this.allLoadedPosts.length < this.preloadThreshold * this.postsPerPage) {
                    this.preloadNextPage(filters);
                }
            } else {
                this.hasMorePosts = false;
                if (this.currentPage === 0) {
                    this.showNoResults();
                } else {
                    this.showNoMorePosts();
                }
            }

        } catch (error) {
            console.error('Error loading posts:', error);
            this.showError('Възникна грешка при зареждането на публикациите.');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    async preloadNextPage(filters) {
        try {
            const nextPageData = await window.publicationsAPI.preloadNextPage(filters, this.currentPage, this.postsPerPage);
            if (nextPageData && window.filtersManager) {
                const cacheKey = this.getCacheKey(filters, this.currentPage);
                window.filtersManager.setCachedResults(cacheKey, nextPageData);
            }
        } catch (error) {
            // Preloading failed, but that's ok
            console.warn('Preload failed:', error);
        }
    }

    getCacheKey(filters, page) {
        return JSON.stringify({ ...filters, page });
    }

    renderPosts(posts) {
        const postsContainer = document.getElementById('postsContainer');
        if (!postsContainer) return;

        posts.forEach(post => {
            const postElement = this.createPostElement(post);
            postsContainer.appendChild(postElement);
        });

        this.hideNoResults();
    }

    createPostElement(post) {
        const postDiv = document.createElement('div');
        postDiv.className = 'post';
        postDiv.dataset.postId = post.id;

        // ПОПРАВКА: По-сигурна обработка на датата
        const timeAgo = this.formatTimeAgo(post.createdAt || post.created || new Date());

        // ПОПРАВКА: По-сигурна обработка на автора
        const authorUsername = post.author?.username || 'Анонимен';
        const authorInitial = authorUsername.charAt(0).toUpperCase();
        const authorId = post.author?.id || 0;

        const isOwner = this.isCurrentUserOwner(authorId);
        const isLiked = window.postInteractions ? window.postInteractions.isPostLiked(post.id) : false;

        // ПОПРАВКА: По-сигурна обработка на енуми и опционални полета
        const status = this.normalizeStatus(post.status);
        const category = this.normalizeCategory(post.category);

        postDiv.innerHTML = `
            <div class="post-header">
                <div class="user-avatar">${authorInitial}</div>
                <div class="post-author-info">
                    <a href="/users/${authorId}" class="post-author-name">${this.escapeHtml(authorUsername)}</a>
                    <div class="post-meta">
                        <span>${timeAgo}</span>
                        <span>•</span>
                        <i class="${this.getStatusIcon(status)}"></i>
                        <span class="post-status ${this.getStatusClass(status)}">
                            ${this.getStatusText(status)}
                        </span>
                    </div>
                </div>
                ${isOwner ? this.createPostMenu(post.id) : ''}
            </div>
            
            <div class="post-content">
                <div class="post-category">
                    <i class="${this.getCategoryIcon(category)}"></i>
                    <span>${this.getCategoryText(category)}</span>
                </div>
                <div class="post-title">${this.escapeHtml(post.title || 'Без заглавие')}</div>
                ${post.excerpt ? `<div class="post-excerpt">${this.escapeHtml(post.excerpt)}</div>` : ''}
                ${post.imageUrl ? `<img src="${post.imageUrl}" class="post-image" alt="Publication image" loading="lazy">` : ''}
            </div>

            <div class="post-stats">
                <div class="stats-left">
                    <div class="reaction-count" onclick="showLikesModal(${post.id})">
                        <div class="reaction-icons">
                            <div class="reaction-icon like-icon">👍</div>
                            ${(post.likesCount || 0) > 5 ? '<div class="reaction-icon heart-icon">❤️</div>' : ''}
                        </div>
                        <span>${post.likesCount || 0}</span>
                    </div>
                </div>
                <div class="stats-right">
                    <span>${(post.commentsCount || 0)} коментара • ${(post.sharesCount || 0)} споделяния</span>
                </div>
            </div>

            <div class="post-actions">
                <button class="post-action ${isLiked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
                    <i class="bi ${isLiked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'}"></i>
                    <span>Харесва</span>
                </button>
                <a href="/publications/${post.id}" class="post-action">
                    <i class="bi bi-chat"></i>
                    <span>Коментирай</span>
                </a>
                <button class="post-action" onclick="sharePublication(${post.id})">
                    <i class="bi bi-share"></i>
                    <span>Сподели</span>
                </button>
            </div>
        `;

        return postDiv;
    }

    createPostMenu(postId) {
        return `
            <div class="post-menu">
                <i class="bi bi-three-dots"></i>
                <div class="post-menu-dropdown" style="display: none;">
                    <a href="/publications/${postId}/edit" class="menu-item">
                        <i class="bi bi-pencil"></i> Редактирай
                    </a>
                    <a href="javascript:void(0)" class="menu-item text-danger" onclick="confirmDelete(${postId})">
                        <i class="bi bi-trash"></i> Изтрий
                    </a>
                </div>
            </div>
        `;
    }

    setupInfiniteScroll() {
        let scrollTimeout;

        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (this.isNearBottom() && !this.isLoading && this.hasMorePosts) {
                    // Only load more if we're not filtering locally
                    const filters = window.filtersManager ? window.filtersManager.getCurrentFilters() : {};
                    const hasActiveFilters = window.filtersManager ? window.filtersManager.hasActiveFilters() : false;

                    if (!hasActiveFilters) {
                        this.loadMorePosts();
                    }
                }
            }, 100);
        });
    }

    isNearBottom() {
        return (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - this.scrollThreshold);
    }

    setupScrollToTop() {
        const scrollBtn = document.getElementById('scrollToTop');
        if (!scrollBtn) return;

        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (window.scrollY > 300) {
                    scrollBtn.style.display = 'block';
                } else {
                    scrollBtn.style.display = 'none';
                }
            }, 100);
        });

        scrollBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    showLoading() {
        const loading = document.getElementById('loadingIndicator');
        if (loading) loading.style.display = 'flex';
    }

    hideLoading() {
        const loading = document.getElementById('loadingIndicator');
        if (loading) loading.style.display = 'none';
    }

    showNoMorePosts() {
        const noMore = document.getElementById('noMorePosts');
        if (noMore && this.currentPage > 0) {
            noMore.style.display = 'flex';
        }
    }

    showNoResults() {
        const noResults = document.getElementById('noResults');
        if (noResults) noResults.style.display = 'block';

        const noMore = document.getElementById('noMorePosts');
        if (noMore) noMore.style.display = 'none';
    }

    hideNoResults() {
        const noResults = document.getElementById('noResults');
        if (noResults) noResults.style.display = 'none';
    }

    showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Грешка',
            text: message,
            confirmButtonColor: '#1877f2'
        });
    }

    // ====== UTILITY METHODS - ПОПРАВЕНИ ======

    formatTimeAgo(dateInput) {
        let date;

        // ПОПРАВКА: По-гъвкава обработка на различните дата формати
        if (typeof dateInput === 'string') {
            // Обработваме Java LocalDateTime формат: "2024-01-15T10:30:00"
            date = new Date(dateInput);
        } else if (dateInput instanceof Date) {
            date = dateInput;
        } else if (Array.isArray(dateInput) && dateInput.length >= 6) {
            // Java LocalDateTime може да се сериализира като масив [year, month, day, hour, minute, second]
            date = new Date(dateInput[0], dateInput[1] - 1, dateInput[2], dateInput[3] || 0, dateInput[4] || 0, dateInput[5] || 0);
        } else {
            date = new Date();
        }

        // Проверяваме дали датата е валидна
        if (isNaN(date.getTime())) {
            return 'неизвестно време';
        }

        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'преди малко';
        if (diffInSeconds < 3600) return `преди ${Math.floor(diffInSeconds / 60)} мин`;
        if (diffInSeconds < 86400) return `преди ${Math.floor(diffInSeconds / 3600)} ч`;
        if (diffInSeconds < 2592000) return `преди ${Math.floor(diffInSeconds / 86400)} дни`;

        return date.toLocaleDateString('bg-BG');
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    isCurrentUserOwner(authorId) {
        return window.currentUserId && window.currentUserId == authorId;
    }

    // ПОПРАВКА: Нормализиране на енуми от Java
    normalizeStatus(status) {
        if (!status) return 'PUBLISHED';
        return typeof status === 'string' ? status.toUpperCase() : status.toString().toUpperCase();
    }

    normalizeCategory(category) {
        if (!category) return 'OTHER';
        return typeof category === 'string' ? category.toLowerCase() : category.toString().toLowerCase();
    }

    getStatusIcon(status) {
        const icons = {
            'PUBLISHED': 'bi bi-globe',
            'REVIEW': 'bi bi-clock',
            'DRAFT': 'bi bi-file-earmark'
        };
        return icons[status] || 'bi bi-circle';
    }

    getStatusClass(status) {
        const classes = {
            'PUBLISHED': 'status-published',
            'REVIEW': 'status-review',
            'DRAFT': 'status-draft'
        };
        return classes[status] || '';
    }

    getStatusText(status) {
        const texts = {
            'PUBLISHED': 'Публикувана',
            'REVIEW': 'За преглед',
            'DRAFT': 'Чернова'
        };
        return texts[status] || status;
    }

    getCategoryIcon(category) {
        const icons = {
            'news': 'bi bi-newspaper',
            'infrastructure': 'bi bi-tools',
            'municipal': 'bi bi-building',
            'initiatives': 'bi bi-lightbulb',
            'culture': 'bi bi-palette',
            'other': 'bi bi-three-dots'
        };
        return icons[category] || 'bi bi-tag';
    }

    getCategoryText(category) {
        const texts = {
            'news': 'Новини',
            'infrastructure': 'Инфраструктура',
            'municipal': 'Община',
            'initiatives': 'Граждански инициативи',
            'culture': 'Културни събития',
            'other': 'Други'
        };
        return texts[category] || category;
    }

    // Public API
    refresh() {
        this.loadInitialPosts();
    }

    addPost(post) {
        if (!this.loadedPosts.has(post.id)) {
            this.allLoadedPosts.unshift(post);
            this.loadedPosts.add(post.id);

            const postsContainer = document.getElementById('postsContainer');
            if (postsContainer) {
                const postElement = this.createPostElement(post);
                postsContainer.insertBefore(postElement, postsContainer.firstChild);
            }
        }
    }

    removePost(postId) {
        this.loadedPosts.delete(postId);
        this.allLoadedPosts = this.allLoadedPosts.filter(post => post.id !== postId);

        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            postElement.remove();
        }
    }

    updatePost(updatedPost) {
        const index = this.allLoadedPosts.findIndex(post => post.id === updatedPost.id);
        if (index !== -1) {
            this.allLoadedPosts[index] = updatedPost;

            const postElement = document.querySelector(`[data-post-id="${updatedPost.id}"]`);
            if (postElement) {
                const newElement = this.createPostElement(updatedPost);
                postElement.parentNode.replaceChild(newElement, postElement);
            }
        }
    }

    getLoadedPostsCount() {
        return this.allLoadedPosts.length;
    }

    hasPost(postId) {
        return this.loadedPosts.has(postId);
    }

    // Debug methods


    clearCache() {
        if (window.filtersManager) {
            window.filtersManager.clearCache();
        }
        console.log('Publications cache cleared');
    }
}

// Performance optimization - Intersection Observer for lazy loading
class LazyImageLoader {
    constructor() {
        this.imageObserver = null;
        this.init();
    }

    init() {
        if ('IntersectionObserver' in window) {
            this.imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.remove('lazy');
                        }
                        observer.unobserve(img);
                    }
                });
            });
        }
    }

    observe(img) {
        if (this.imageObserver && img.dataset.src) {
            this.imageObserver.observe(img);
        }
    }
}

// Viewport optimization - Only render visible posts
class VirtualScrollManager {
    constructor(container, itemHeight = 400) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.visibleItems = [];
        this.scrollTop = 0;
        this.containerHeight = 0;

        this.init();
    }

    init() {
        if (!this.container) return;

        this.updateContainerHeight();
        this.setupScrollListener();
        window.addEventListener('resize', () => this.updateContainerHeight());
    }

    updateContainerHeight() {
        this.containerHeight = window.innerHeight;
    }

    setupScrollListener() {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    handleScroll() {
        this.scrollTop = window.pageYOffset;
        // Virtual scrolling logic would go here for very large lists
        // For now, we rely on browser optimization
    }
}

// Enhanced error handling
class ErrorHandler {
    constructor() {
        this.errorQueue = [];
        this.maxErrors = 10;
        this.init();
    }

    init() {
        window.addEventListener('error', (e) => this.handleError(e));
        window.addEventListener('unhandledrejection', (e) => this.handlePromiseRejection(e));
    }

    handleError(event) {
        const error = {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            timestamp: Date.now()
        };

        this.addError(error);
        console.error('Global error caught:', error);
    }

    handlePromiseRejection(event) {
        const error = {
            message: event.reason?.message || 'Unhandled promise rejection',
            stack: event.reason?.stack,
            timestamp: Date.now()
        };

        this.addError(error);
        console.error('Unhandled promise rejection:', error);
    }

    addError(error) {
        this.errorQueue.push(error);

        if (this.errorQueue.length > this.maxErrors) {
            this.errorQueue.shift();
        }

        // Could send errors to monitoring service here
    }

    getErrors() {
        return [...this.errorQueue];
    }

    clearErrors() {
        this.errorQueue = [];
    }
}

// Analytics tracker
class AnalyticsTracker {
    constructor() {
        this.events = [];
        this.sessionId = this.generateSessionId();
    }

    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    track(eventName, data = {}) {
        const event = {
            name: eventName,
            data: data,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            url: window.location.href
        };

        this.events.push(event);

        // Could send to analytics service
    }

    trackPageView() {
        this.track('page_view', {
            path: window.location.pathname,
            referrer: document.referrer
        });
    }

    trackInteraction(type, target) {
        this.track('interaction', {
            type: type,
            target: target
        });
    }
}

// Global utilities
window.utils = {
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'М';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'К';
        }
        return num.toString();
    },

    copyToClipboard(text) {
        return navigator.clipboard.writeText(text);
    },

    preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }
};

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    // Initialize managers in order
    window.lazyImageLoader = new LazyImageLoader();
    window.errorHandler = new ErrorHandler();
    window.analyticsTracker = new AnalyticsTracker();

    // Track page view
    window.analyticsTracker.trackPageView();

    // Initialize main publications manager
    window.publicationsManager = new PublicationsManager();

    // Setup virtual scrolling for large lists
    const postsContainer = document.getElementById('postsContainer');
    if (postsContainer) {
        window.virtualScrollManager = new VirtualScrollManager(postsContainer);
    }

    // Performance monitoring
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                window.analyticsTracker.track('performance', {
                    loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                    totalTime: perfData.loadEventEnd - perfData.fetchStart
                });
            }, 0);
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + R to refresh
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            window.publicationsManager.refresh();
        }

        // Escape to close modals/menus
        if (e.key === 'Escape') {
            document.querySelectorAll('.post-menu-dropdown').forEach(menu => {
                menu.style.display = 'none';
            });

            if (window.filtersManager) {
                window.filtersManager.closeMobileFilters();
            }
        }
    });

});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PublicationsManager,
        LazyImageLoader,
        VirtualScrollManager,
        ErrorHandler,
        AnalyticsTracker
    };
}