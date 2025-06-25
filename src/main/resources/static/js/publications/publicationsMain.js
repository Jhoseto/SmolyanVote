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

        // TODO: Разкоментирай когато имаш 50+ постове със снимки
        // this.setupLazyImageLoading();

        // TODO: Разкоментирай когато имаш 500+ постове
        // this.setupVirtualScrolling();

        this.loadInitialPosts();
    }

    setupEventListeners() {
        // Listen for filter changes
        if (window.filtersManager) {
            const originalUpdate = window.filtersManager.updateFilter;
            window.filtersManager.updateFilter = (...args) => {
                originalUpdate.apply(window.filtersManager, args);
                this.onFiltersChanged(window.filtersManager.getCurrentFilters());
            };
        }

        // Post menu handling
        document.addEventListener('click', (e) => {
            if (e.target.closest('.post-menu')) {
                e.preventDefault();
                e.stopPropagation();

                const menu = e.target.closest('.post-menu');
                const dropdown = menu.querySelector('.post-menu-dropdown');

                // Close all other menus
                document.querySelectorAll('.post-menu-dropdown').forEach(d => {
                    if (d !== dropdown) d.style.display = 'none';
                });

                // Toggle current menu
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            } else {
                // Close all menus when clicking outside
                document.querySelectorAll('.post-menu-dropdown').forEach(d => {
                    d.style.display = 'none';
                });
            }
        });
    }

    onFiltersChanged(filters) {
        this.applyLocalFilters();
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

            let data = window.filtersManager ? window.filtersManager.getCachedResults(cacheKey) : null;

            if (!data) {
                data = await window.publicationsAPI.getPublications(filters, this.currentPage, this.postsPerPage);

                if (window.filtersManager) {
                    window.filtersManager.setCachedResults(cacheKey, data);
                }
            }

            if (data.publications && data.publications.length > 0) {
                data.publications.forEach(post => {
                    if (!this.loadedPosts.has(post.id)) {
                        this.allLoadedPosts.push(post);
                        this.loadedPosts.add(post.id);
                    }
                });

                this.renderPosts(data.publications);
                this.currentPage++;
                this.hasMorePosts = data.publications.length === this.postsPerPage;

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
            console.warn('Preload failed:', error);
        }
    }

    getCacheKey(filters, page) {
        return JSON.stringify({ ...filters, page });
    }

    renderPosts(posts) {
        const postsContainer = document.getElementById('postsContainer');
        if (!postsContainer) return;

        // TODO: Когато активираш virtual scrolling, използвай:
        // return this.renderPostsVirtual(posts);

        posts.forEach(post => {
            const postElement = this.createPostElement(post);
            postsContainer.appendChild(postElement);

            // TODO: Когато активираш lazy loading, добави:
            // this.observeNewImages(postElement);
        });

        this.hideNoResults();
    }

    createPostElement(post) {
        const postDiv = document.createElement('div');
        postDiv.className = 'post';
        postDiv.dataset.postId = post.id;

        const timeAgo = this.formatTimeAgo(post.createdAt || post.created || new Date());
        const authorUsername = post.author?.username || 'Анонимен';
        const authorImageUrl = post.author?.imageUrl || '/images/default-avatar.png';
        const authorId = post.author?.id || 0;

        const isOwner = this.isCurrentUserOwner(authorId);
        const isLiked = window.postInteractions ? window.postInteractions.isPostLiked(post.id) : false;

        const status = this.normalizeStatus(post.status);
        const category = this.normalizeCategory(post.category);

        postDiv.innerHTML = `
        <div class="post-header">
            <img class="user-avatar" src="${authorImageUrl}" alt="${this.escapeHtml(authorUsername)}" onerror="this.src='/images/default-avatar.png'">
            <div class="post-author-info">
                <a href="/users/${authorId}" class="post-author-name">${this.escapeHtml(authorUsername)}</a>
                <div class="post-meta">
                    <span>${timeAgo}</span>
                    <i class="bi bi-circle online-status-indicator ${this.getOnlineStatus(post.author)}" title="${this.getOnlineStatusText(post.author)}"></i>
                    <span>•</span>
                    <span class="post-status ${this.getStatusClass(post.status)}">
                        ${this.getStatusText(status)}
                    </span>
                    ${post.emotion ? `<span>•</span><span class="post-emotion">${post.emotion} ${post.emotionText || ''}</span>` : ''}
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
            ${post.excerpt && post.excerpt !== post.title ? `<div class="post-excerpt">${this.escapeHtml(post.excerpt)}</div>` : ''}
            ${post.imageUrl ?
            // TODO: За lazy loading промени на:
            // `<img data-src="${post.imageUrl}" class="post-image lazy" src="/images/placeholder.jpg" alt="Publication image">`
            `<img src="${post.imageUrl}" class="post-image" alt="Publication image" loading="lazy">`
            : ''}
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

    getOnlineStatus(author) {
        if (!author) return 'offline';

        if (author.onlineStatus === 1) {
            return 'online';
        }

        if (author.lastOnline) {
            const lastOnlineDate = new Date(author.lastOnline);
            const now = new Date();
            const diffMinutes = (now - lastOnlineDate) / (1000 * 60);

            if (diffMinutes <= 5) {
                return 'online';
            } else if (diffMinutes <= 30) {
                return 'away';
            }
        }

        return 'offline';
    }

    getOnlineStatusText(author) {
        const status = this.getOnlineStatus(author);
        const texts = {
            'online': 'Онлайн сега',
            'away': 'Неактивен',
            'offline': 'Офлайн'
        };
        return texts[status] || 'Неизвестен статус';
    }

    createPostMenu(postId) {
        return `
            <div class="post-menu">
                <i class="bi bi-three-dots"></i>
                <div class="post-menu-dropdown" style="display: none;">
                    <a href="javascript:void(0)" class="menu-item" onclick="startInlineEdit(${postId})">
                        <i class="bi bi-pencil"></i> Редактирай
                    </a>
                    <a href="javascript:void(0)" class="menu-item text-danger" onclick="confirmDelete(${postId})">
                        <i class="bi bi-trash"></i> Изтрий
                    </a>
                </div>
            </div>
        `;
    }

    startInlineEdit(postId) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (!postElement || postElement.querySelector('.edit-textarea')) return;

        const post = this.allLoadedPosts.find(p => p.id === postId);
        if (!post) return;

        const contentDiv = postElement.querySelector('.post-content');
        const titleElement = postElement.querySelector('.post-title');
        const excerptElement = postElement.querySelector('.post-excerpt');

        const fullContent = post.content || ((post.title || '') + '\n\n' + (post.excerpt || '')).trim();

        // Hide original content
        titleElement.style.display = 'none';
        if (excerptElement) excerptElement.style.display = 'none';

        // Create edit form
        const editForm = document.createElement('div');
        editForm.className = 'inline-edit-form';
        editForm.innerHTML = `
            <textarea class="edit-textarea" rows="6" placeholder="Напишете вашия текст...">${this.escapeHtml(fullContent)}</textarea>
            <div class="edit-buttons">
                <button class="btn btn-primary btn-sm" onclick="saveInlineEdit(${postId})">
                    <i class="bi bi-check"></i> Запази
                </button>
                <button class="btn btn-secondary btn-sm" onclick="cancelInlineEdit(${postId})">
                    <i class="bi bi-x"></i> Отказ
                </button>
            </div>
        `;

        // Insert after category
        const categoryElement = postElement.querySelector('.post-category');
        categoryElement.parentNode.insertBefore(editForm, categoryElement.nextSibling);

        // Focus textarea
        setTimeout(() => {
            const textarea = editForm.querySelector('.edit-textarea');
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }, 100);

        // Close menu
        document.querySelectorAll('.post-menu-dropdown').forEach(d => d.style.display = 'none');
    }

    async saveInlineEdit(postId) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        const textarea = postElement.querySelector('.edit-textarea');
        const newContent = textarea.value.trim();

        if (!newContent) {
            alert('Текстът не може да бъде празен!');
            return;
        }

        try {
            const post = this.allLoadedPosts.find(p => p.id === postId);
            if (!post) {
                throw new Error('Публикацията не е намерена');
            }

            // Split content into title and excerpt
            const lines = newContent.split('\n');
            const newTitle = lines[0].substring(0, 100);
            const remainingContent = lines.slice(1).join('\n').trim();
            const newExcerpt = remainingContent.substring(0, 200);

            const updateData = {
                title: newTitle,
                content: newContent,
                category: post.category,
                emotion: post.emotion,
                emotionText: post.emotionText,
                imageUrl: post.imageUrl
            };

            await window.publicationsAPI.updatePublication(postId, updateData);

            // Update data in memory
            if (post) {
                post.title = newTitle;
                post.excerpt = newExcerpt;
                post.content = newContent;
                post.status = 'EDITED';
            }

            // Update DOM elements
            this.updatePostContentInDOM(postElement, newTitle, newExcerpt);
            this.cancelInlineEdit(postId);
            this.updatePostStatus(postElement, 'EDITED');

            window.postInteractions?.showToast('Публикацията е обновена успешно!', 'success');
        } catch (error) {
            console.error('Error updating post:', error);
            window.postInteractions?.showError('Възникна грешка при запазването.');
        }
    }

    updatePostContentInDOM(postElement, newTitle, newExcerpt) {
        // Update title
        const titleElement = postElement.querySelector('.post-title');
        if (titleElement) {
            titleElement.textContent = newTitle;
        }

        // Update excerpt
        const excerptElement = postElement.querySelector('.post-excerpt');
        if (excerptElement) {
            if (newExcerpt && newExcerpt !== newTitle) {
                excerptElement.textContent = newExcerpt;
                excerptElement.style.display = 'block';
            } else {
                excerptElement.style.display = 'none';
            }
        } else if (newExcerpt && newExcerpt !== newTitle) {
            // Create new excerpt element if it doesn't exist
            const newExcerptDiv = document.createElement('div');
            newExcerptDiv.className = 'post-excerpt';
            newExcerptDiv.textContent = newExcerpt;

            const titleElement = postElement.querySelector('.post-title');
            if (titleElement && titleElement.nextSibling) {
                titleElement.parentNode.insertBefore(newExcerptDiv, titleElement.nextSibling);
            }
        }
    }

    updatePostStatus(postElement, newStatus) {
        const statusElement = postElement.querySelector('.post-status');
        if (statusElement) {
            statusElement.className = `post-status ${this.getStatusClass(newStatus)}`;
            statusElement.textContent = this.getStatusText(newStatus);
        }
    }

    cancelInlineEdit(postId) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        const editForm = postElement.querySelector('.inline-edit-form');
        const titleElement = postElement.querySelector('.post-title');
        const excerptElement = postElement.querySelector('.post-excerpt');

        // Remove edit form
        if (editForm) editForm.remove();

        // Show original content
        titleElement.style.display = 'block';
        if (excerptElement) excerptElement.style.display = 'block';
    }

    setupInfiniteScroll() {
        let scrollTimeout;

        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (this.isNearBottom() && !this.isLoading && this.hasMorePosts) {
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
            confirmButtonColor: '#4b9f3e'
        });
    }

    // ====== UTILITY METHODS ======

    formatTimeAgo(dateInput) {
        let date;

        if (typeof dateInput === 'string') {
            date = new Date(dateInput);
        } else if (dateInput instanceof Date) {
            date = dateInput;
        } else if (Array.isArray(dateInput) && dateInput.length >= 6) {
            date = new Date(dateInput[0], dateInput[1] - 1, dateInput[2], dateInput[3] || 0, dateInput[4] || 0, dateInput[5] || 0);
        } else {
            date = new Date();
        }

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
            'PENDING': 'bi bi-clock',
            'EDITED': 'bi bi-file-earmark'
        };
        return icons[status] || 'bi bi-circle';
    }

    getStatusClass(status) {
        const classes = {
            'PUBLISHED': 'status-published',
            'PENDING': 'status-pending',
            'EDITED': 'status-edited'
        };
        return classes[status] || '';
    }

    getStatusText(status) {
        const texts = {
            'PUBLISHED': 'Публикувана',
            'PENDING': 'Изчаква преглед от модератор',
            'EDITED': 'Редактирана'
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

    clearCache() {
        if (window.filtersManager) {
            window.filtersManager.clearCache();
        }
        console.log('Publications cache cleared');
    }

    // ====== TODO: PERFORMANCE OPTIMIZATIONS ======

    // TODO: LazyImageLoading - добави при 50+ постове със снимки за по-бързо зареждане
    // setupLazyImageLoading() - IntersectionObserver за снимки
    // observeNewImages(postElement) - добави нови снимки към observer

    // TODO: VirtualScrolling - добави при 500+ постове за перфектен performance
    // setupVirtualScrolling() - рендира само видимите постове (10-15 DOM елемента)
    // renderPostsVirtual(posts) - замести renderPosts() за големи списъци

    // TODO: Други оптимизации при голям трафик:
    // - Image compression (WebP, thumbnails)
    // - Service Worker (offline режим)
    // - IndexedDB caching
    // - Code splitting
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
    }
};

// Global functions
window.startInlineEdit = function(postId) {
    window.publicationsManager?.startInlineEdit(postId);
};

window.saveInlineEdit = function(postId) {
    window.publicationsManager?.saveInlineEdit(postId);
};

window.cancelInlineEdit = function(postId) {
    window.publicationsManager?.cancelInlineEdit(postId);
};

window.showLikesModal = function(postId) {
    // TODO: Implement likes modal showing users who liked the post
    if (window.postInteractions) {
        window.postInteractions.showToast('Функцията за показване на харесали ще бъде добавена скоро', 'info');
    } else {
        console.log('Show likes modal for post:', postId);
    }
};

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    // Initialize managers
    window.errorHandler = new ErrorHandler();
    window.analyticsTracker = new AnalyticsTracker();

    // Track page view
    window.analyticsTracker.trackPageView();

    // Initialize main publications manager
    window.publicationsManager = new PublicationsManager();

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
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            window.publicationsManager.refresh();
        }

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
        ErrorHandler,
        AnalyticsTracker
    };
}