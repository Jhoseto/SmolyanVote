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

    // ПРОМЕНЕН МЕТОД - с добавка за обновяване на реакциите
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

        // НОВА ПРОМЯНА: Обновяваме реакциите след филтриране
        if (window.postInteractions && window.isAuthenticated) {
            setTimeout(() => {
                window.postInteractions.updateAllPostsUI();
            }, 50);
        }
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

    // ПРОМЕНЕН МЕТОД - с добавка за обновяване на реакциите
    renderPosts(posts) {
        const postsContainer = document.getElementById('postsContainer');
        if (!postsContainer) return;

        posts.forEach(post => {
            const postElement = this.createPostElement(post);
            postsContainer.appendChild(postElement);
        });

        this.hideNoResults();

        // НОВА ПРОМЯНА: Обновяваме реакциите след добавяне на постовете
        if (window.postInteractions && window.isAuthenticated) {
            // Малка пауза за да се завърши DOM операцията
            setTimeout(() => {
                window.postInteractions.updateAllPostsUI();
            }, 50);
        }
    }

    createPostElement(post) {
        const postDiv = document.createElement('div');
        postDiv.className = 'post';
        postDiv.dataset.postId = post.id;

        const timeAgo = this.formatTimeAgo(post.createdAt || post.created || new Date());
        const authorUsername = post.author?.username || 'Анонимен';
        const authorImageUrl = post.author?.imageUrl || '/images/default-avatar.png';
        const authorId = post.author?.id || 0;

        const canManage = this.canManagePost(authorId);
        const isLiked = window.postInteractions ? window.postInteractions.isPostLiked(post.id) : false;
        const isDisliked = window.postInteractions ? window.postInteractions.isPostDisliked(post.id) : false;

        const status = this.normalizeStatus(post.status);
        const category = this.normalizeCategory(post.category);

        // Използваме avatarUtils за създаване на avatar
        const authorAvatarHTML = window.avatarUtils ?
            window.avatarUtils.createAvatar(authorImageUrl, authorUsername, 40, 'user-avatar') :
            `<img class="user-avatar" src="${authorImageUrl}" alt="${authorUsername}" style="width:40px;height:40px;">`;

        // NEW: Премахваме URL-а от текста ако има link preview
        let postText = post.excerpt || post.content || '';
        if (post.linkUrl && postText.includes(post.linkUrl)) {
            postText = postText.replace(post.linkUrl, '').trim();
        }

        postDiv.innerHTML = `
        <div class="post-header">
            ${authorAvatarHTML}
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
            ${canManage ? this.createPostMenu(post.id) : (this.shouldShowReportMenu(authorId) ? this.createReportMenu(post.id) : '')}
        </div>
        
        <div class="post-content" onclick="checkAuthAndOpenModal(${post.id})" style="cursor: pointer;">
            
            <!-- Post Text - само текстът без URL -->
            ${postText ? `<div class="post-text">${this.escapeHtml(postText)}</div>` : ''}
            
            <!-- Link Preview -->
            ${this.generateLinkPreviewHTML(post)}
            
            <!-- Image (ако има) -->
            ${post.imageUrl ? `<img src="${post.imageUrl}" class="post-image" alt="Publication image" loading="lazy">` : ''}
            
            <!-- Category -->
            <div class="post-category">
                <i class="${this.getCategoryIcon(category)}"></i>
                <span>${this.getCategoryText(category)}</span>
            </div>
        </div>

        <div class="post-stats">
            <div class="stats-left">
                <div class="stats-item">
                    <i class="bi bi-hand-thumbs-up-fill stats-icon"></i>
                    <span class="stats-count like-stats-count">${post.likesCount || 0}</span>
                </div>
                <div class="stats-item">
                    <i class="bi bi-hand-thumbs-down-fill stats-icon"></i>
                    <span class="stats-count dislike-stats-count">${post.dislikesCount || 0}</span>
                </div>
            </div>
            <div class="stats-right">
                <div class="stats-item">
                    <i class="bi bi-eye-fill stats-icon"></i>
                    <span class="stats-count view-stats-count">${post.viewsCount || 0}</span>
                </div>
                <div class="stats-item">
                    <i class="bi bi-chat-fill stats-icon"></i>
                    <span class="stats-count comment-stats-count">${post.commentsCount || 0}</span>
                </div>  
                <div class="stats-item">
                    <i class="bi bi-share-fill stats-icon"></i>
                    <span class="stats-count share-stats-count">${post.sharesCount || 0}</span>
                </div>
            </div>
        </div>

        <div class="post-actions">
            <button class="post-action like-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
                <i class="bi ${isLiked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'}"></i>
                <span>Харесвам</span>
            </button>
            <button class="post-action dislike-btn ${isDisliked ? 'disliked' : ''}" onclick="toggleDislike(${post.id})">
                <i class="bi ${isDisliked ? 'bi-hand-thumbs-down-fill' : 'bi-hand-thumbs-down'}"></i>
                <span>Не харесвам</span>
            </button>
            <a href="javascript:void(0)" class="post-action comment-btn" onclick="checkAuthAndOpenModal(${post.id})">
                <i class="bi bi-chat"></i>
                <span>Коментирай</span>
            </a>
            <button class="post-action share-btn" onclick="checkAuthAndShare(${post.id})">
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
                <div class="menu-divider"></div>
                <a href="javascript:void(0)" class="menu-item text-warning" onclick="showReportModal(${postId})">
                    <i class="bi bi-flag"></i> Докладвай
                </a>
            </div>
        </div>
    `;
    }

    createReportMenu(postId) {
        return `
        <div class="post-menu">
            <i class="bi bi-three-dots"></i>
            <div class="post-menu-dropdown" style="display: none;">
                <a href="javascript:void(0)" class="menu-item text-warning" onclick="showReportModal(${postId})">
                    <i class="bi bi-flag"></i> Докладвай
                </a>
            </div>
        </div>
    `;
    }

    // Останалите методи остават същите...
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

    canManagePost(authorId) {
        return (window.currentUserId && window.currentUserId === authorId) || window.isAdmin;
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

    // ПРОМЕНЕН МЕТОД - с добавка за обновяване на UI
    addPost(post) {
        if (!this.loadedPosts.has(post.id)) {
            this.allLoadedPosts.unshift(post);
            this.loadedPosts.add(post.id);

            const postsContainer = document.getElementById('postsContainer');
            if (postsContainer) {
                const postElement = this.createPostElement(post);
                postsContainer.insertBefore(postElement, postsContainer.firstChild);

                // НОВА ПРОМЯНА: Обновяваме UI на новия пост
                if (window.postInteractions && window.isAuthenticated) {
                    setTimeout(() => {
                        window.postInteractions.updateSinglePostUI(postElement, post.id);
                    }, 50);
                }
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

    shouldShowReportMenu(authorId) {
        // Показвай report само ако:
        // 1. Потребителят е логнат
        // 2. НЕ е собственик на поста
        // 3. НЕ е админ (админите не трябва да докладват)
        return window.isAuthenticated &&
            window.currentUserId != authorId &&
            !window.isAdmin;
    }

    generateLinkPreviewHTML(post) {
        if (!post.linkUrl || !post.linkMetadata) {
            return '';
        }

        try {
            const metadata = typeof post.linkMetadata === 'string'
                ? JSON.parse(post.linkMetadata)
                : post.linkMetadata;

            if (!metadata || !metadata.type) {
                return '';
            }

            // Запазваме референция към текущия post за render методите
            this.currentRenderingPost = post;

            return `
            <div class="post-link-preview" style="margin-top: 12px;">
                ${this.renderLinkPreviewByType(metadata)}
            </div>
        `;

        } catch (error) {
            console.error('Error parsing link metadata:', error);
            return '';
        }
    }

    renderLinkPreviewByType(metadata) {
        switch (metadata.type) {
            case 'youtube':
                return this.renderYouTubePreview(metadata);
            case 'image':
                return this.renderImagePreview(metadata);
            case 'website':
            default:
                return this.renderWebsitePreview(metadata);
        }
    }
    setCurrentRenderingPost(post) {
        this.currentRenderingPost = post;
    }
    renderYouTubePreview(metadata) {
        const postId = this.currentRenderingPost?.id || 'unknown';
        return `
        <div class="youtube-preview" onclick="openPostModal(${postId})" style="cursor: pointer;">
            <div class="preview-thumbnail" style="background-image: url('${metadata.thumbnail}'); height: 300px; background-size: cover; background-position: center; position: relative; border-radius: 8px; overflow: hidden;">
                <div class="play-button" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60px; height: 60px; background: rgba(255, 0, 0, 0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px;">
                    <i class="bi bi-play-fill"></i>
                </div>
            </div>
            <div class="preview-content" style="padding: 12px; background: #f8f9fa; border: 1px solid #e4e6eb; border-top: none; border-radius: 0 0 8px 8px;">
                <div class="preview-title" style="font-size: 14px; font-weight: 600; color: #1c1e21; margin-bottom: 4px;">
                    ${metadata.title || 'YouTube Video'}
                </div>
                <div class="preview-description" style="font-size: 12px; color: #65676b; margin-bottom: 4px;">
                    ${metadata.description || 'Натиснете за възпроизвеждане'}
                </div>
                <div class="preview-source" style="font-size: 11px; color: #8a8d91; text-transform: uppercase;">
                    YouTube
                </div>
            </div>
        </div>
    `;
    }

    renderImagePreview(metadata) {
        const postId = this.currentRenderingPost?.id || 'unknown';
        const title = metadata.title || 'Изображение';
        const description = metadata.description || 'Кликнете за по-голям изглед';

        return `
        <div class="image-preview-large" onclick="openPostModal(${postId})" style="cursor: pointer; margin-top: 12px;">
            <div class="image-large-display" style="
                background-image: url('${metadata.url}'); 
                height: 250px; 
                background-size: cover; 
                background-position: center; 
                border-radius: 8px; 
                position: relative; 
                overflow: hidden;
                border: 1px solid #e4e6eb;
                transition: transform 0.2s ease;
            " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                <div class="image-overlay" style="
                    position: absolute; 
                    bottom: 0; 
                    left: 0; 
                    right: 0; 
                    background: linear-gradient(transparent, rgba(0,0,0,0.6)); 
                    padding: 16px; 
                    color: white;
                ">
                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px; line-height: 1.3;">
                        ${title}
                    </div>
                    <div style="font-size: 12px; opacity: 0.9; line-height: 1.4;">
                        ${description}
                    </div>
                    <div style="font-size: 11px; opacity: 0.8; margin-top: 4px;">
                        <i class="bi bi-image"></i> ИЗОБРАЖЕНИЕ
                    </div>
                </div>
            </div>
        </div>
    `;
    }

    renderWebsitePreview(metadata) {
        const postId = this.currentRenderingPost?.id || 'unknown';
        const hasImage = metadata.image && metadata.image.length > 0;
        const title = metadata.title || metadata.domain || 'Уебсайт';
        const description = metadata.description || 'Кликнете за повече информация';
        const domain = metadata.domain || 'УЕБСАЙТ';

        if (hasImage) {
            // Голям preview с изображение
            return `
            <div class="website-preview-large" onclick="openPostModal(${postId})" style="cursor: pointer;">
                <div class="website-large-image" style="
                    background-image: url('${metadata.image}'); 
                    height: 360px; 
                    background-size: cover; 
                    background-position: center; 
                    border-radius: 8px; 
                    position: relative; 
                    overflow: hidden;
                    border: 1px solid #e4e6eb;
                ">
                    <div class="website-overlay" style="
                        position: absolute; 
                        bottom: 0; 
                        left: 0; 
                        right: 0; 
                        background: linear-gradient(transparent, rgba(0,0,0,0.7)); 
                        padding: 16px; 
                        color: white;
                    ">
                        <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px; line-height: 1.3;">
                            ${title}
                        </div>
                        <div style="font-size: 12px; opacity: 0.9; line-height: 1.4;">
                            ${description}
                        </div>
                        <div style="font-size: 11px; opacity: 0.8; margin-top: 4px; text-transform: uppercase;">
                            ${domain}
                        </div>
                    </div>
                </div>
            </div>
        `;
        } else {
            // Compact preview без изображение
            return `
            <div class="website-preview-compact" onclick="openPostModal(${postId})" style="
                cursor: pointer; 
                display: flex; 
                gap: 12px; 
                padding: 12px; 
                border: 1px solid #e4e6eb; 
                border-radius: 8px; 
                background: #f8f9fa;
                transition: box-shadow 0.2s ease;
            " onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='none'">
                <div style="
                    width: 48px; 
                    height: 48px; 
                    background: #e4e6eb; 
                    border-radius: 8px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    flex-shrink: 0;
                ">
                    ${metadata.favicon ?
                `<img src="${metadata.favicon}" style="width: 24px; height: 24px; object-fit: contain;" alt="Favicon">` :
                '<i class="bi bi-link-45deg" style="font-size: 20px; color: #65676b;"></i>'
            }
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="
                        font-size: 14px; 
                        font-weight: 600; 
                        color: #1c1e21; 
                        margin-bottom: 4px; 
                        white-space: nowrap; 
                        overflow: hidden; 
                        text-overflow: ellipsis;
                    ">
                        ${title}
                    </div>
                    <div style="
                        font-size: 12px; 
                        color: #65676b; 
                        margin-bottom: 4px; 
                        overflow: hidden; 
                        display: -webkit-box; 
                        -webkit-line-clamp: 2; 
                        -webkit-box-orient: vertical;
                        line-height: 1.4;
                    ">
                        ${description}
                    </div>
                    <div style="
                        font-size: 11px; 
                        color: #8a8d91; 
                        text-transform: uppercase;
                        opacity: 0.8;
                    ">
                        ${domain}
                    </div>
                </div>
            </div>
        `;
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
});
window.checkAuthAndOpenModal = function(postId) {
    if (!window.isAuthenticated) {
        window.showLoginWarning();
        return;
    }
    openPostModal(postId);
};

window.checkAuthAndShare = function(postId) {
    if (!window.isAuthenticated) {
        window.showLoginWarning();
        return;
    }
    sharePublication(postId);
};

window.openYouTubeLink = function(url) {
    window.open(url, '_blank');
};

window.openImageLink = function(url) {
    window.open(url, '_blank');
};

window.openWebsiteLink = function(url) {
    window.open(url, '_blank');
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PublicationsManager,
        ErrorHandler,
        AnalyticsTracker
    };
}