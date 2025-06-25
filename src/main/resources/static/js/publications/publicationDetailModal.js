// ====== PUBLICATION DETAIL MODAL JS ======
// Файл: src/main/resources/static/js/publications/publicationDetailModal.js

class PublicationDetailModal {
    constructor() {
        this.modal = null;
        this.currentPostId = null;
        this.currentPost = null;
        this.allPosts = [];
        this.currentIndex = 0;
        this.isLoading = false;
        this.keyboardNavigationEnabled = true;

        this.init();
    }

    init() {
        this.modal = document.getElementById('postDetailModal');
        if (!this.modal) {
            console.error('Post detail modal not found!');
            return;
        }

        this.setupEventListeners();
        this.setupKeyboardNavigation();
    }

    setupEventListeners() {
        // Close modal events
        const closeBtn = document.getElementById('closeModalBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // Navigation buttons
        const prevBtn = document.getElementById('prevPostBtn');
        const nextBtn = document.getElementById('nextPostBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.navigateToPrevious());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.navigateToNext());
        }

        // Post menu
        const menuBtn = this.modal.querySelector('.modal-menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePostMenu();
            });
        }

        // Post actions
        const likeBtn = document.getElementById('modalLikeBtn');
        const dislikeBtn = document.getElementById('modalDislikeBtn');
        const shareBtn = document.getElementById('modalShareBtn');

        if (likeBtn) {
            likeBtn.addEventListener('click', () => this.toggleLike());
        }

        if (dislikeBtn) {
            dislikeBtn.addEventListener('click', () => this.toggleDislike());
        }

        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.sharePost());
        }

        // Edit and delete buttons
        const editBtn = document.getElementById('modalEditBtn');
        const deleteBtn = document.getElementById('modalDeleteBtn');

        if (editBtn) {
            editBtn.addEventListener('click', () => this.editPost());
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deletePost());
        }

        // Close menu when clicking outside
        document.addEventListener('click', () => {
            this.closePostMenu();
        });

        // Image zoom (future feature)
        const postImage = document.getElementById('modalPostImage');
        if (postImage) {
            postImage.addEventListener('click', () => this.zoomImage());
        }
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (!this.isVisible() || !this.keyboardNavigationEnabled) return;

            switch (e.key) {
                case 'Escape':
                    this.closeModal();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.navigateToPrevious();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.navigateToNext();
                    break;
                case 'l':
                case 'L':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        this.toggleLike();
                    }
                    break;
                case 'd':
                case 'D':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        this.toggleDislike();
                    }
                    break;
                case 's':
                case 'S':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        this.sharePost();
                    }
                    break;
            }
        });
    }

    async openModal(postId, allPosts = []) {
        if (this.isLoading) return;

        try {
            this.showLoading();
            this.currentPostId = postId;
            this.allPosts = allPosts;
            this.currentIndex = allPosts.findIndex(post => post.id == postId);

            // Load post data
            await this.loadPostData(postId);

            // Show modal
            this.showModal();
            this.updateNavigationButtons();

            // Load comments
            if (window.commentsManager) {
                window.commentsManager.loadComments(postId);
            }

            // Track analytics
            this.trackModalOpen(postId);

        } catch (error) {
            console.error('Error opening modal:', error);
            this.showError('Възникна грешка при зареждането на публикацията');
        } finally {
            this.hideLoading();
        }
    }

    async loadPostData(postId) {
        try {
            // First try to find post in already loaded posts
            let post = this.allPosts.find(p => p.id == postId);

            // If not found, fetch from server
            if (!post) {
                const response = await window.publicationsAPI.getPublication(postId);
                post = response;

                // Add to posts array if fetched
                if (post) {
                    this.allPosts.unshift(post);
                    this.currentIndex = 0;
                }
            }

            if (!post) {
                throw new Error('Публикацията не е намерена');
            }

            this.currentPost = post;
            this.populateModalContent(post);

        } catch (error) {
            console.error('Error loading post data:', error);
            throw error;
        }
    }

    populateModalContent(post) {
        try {
            // Author info
            this.updateAuthorInfo(post);

            // Post category
            this.updatePostCategory(post);

            // Post content
            this.updatePostContent(post);

            // Post image
            this.updatePostImage(post);

            // Post stats
            this.updatePostStats(post);

            // Post actions
            this.updatePostActions(post);

            // Post menu (if owner)
            this.updatePostMenu(post);

            // Comments count in header
            this.updateCommentsHeader(post);

        } catch (error) {
            console.error('Error populating modal content:', error);
        }
    }

    updateAuthorInfo(post) {
        const authorName = document.getElementById('modalAuthorName');
        const authorAvatar = document.getElementById('modalAuthorAvatar');
        const postTime = document.getElementById('modalPostTime');
        const onlineStatus = document.getElementById('modalOnlineStatus');
        const postStatus = document.getElementById('modalPostStatus');
        const postEmotion = document.getElementById('modalPostEmotion');

        if (authorName && post.author) {
            authorName.textContent = post.author.username || 'Анонимен';
            authorName.href = `/users/${post.author.id}`;
        }

        if (authorAvatar && post.author) {
            const avatarHTML = window.avatarUtils ?
                window.avatarUtils.createAvatar(
                    post.author.imageUrl || '/images/default-avatar.png',
                    post.author.username || 'Анонимен',
                    48,
                    'modal-author-avatar'
                ) :
                `<img src="${post.author.imageUrl || '/images/default-avatar.png'}" 
                      alt="${post.author.username}" style="width:48px;height:48px;border-radius:50%;">`;

            authorAvatar.innerHTML = avatarHTML;
        }

        if (postTime) {
            postTime.textContent = this.formatTimeAgo(post.createdAt || post.created);
        }

        if (onlineStatus && post.author) {
            const status = this.getOnlineStatus(post.author);
            onlineStatus.className = `bi bi-circle online-status-indicator ${status}`;
            onlineStatus.title = this.getOnlineStatusText(post.author);
        }

        if (postStatus) {
            const status = this.normalizeStatus(post.status);
            postStatus.textContent = this.getStatusText(status);
            postStatus.className = `modal-post-status ${this.getStatusClass(status)}`;
        }

        if (postEmotion) {
            if (post.emotion && post.emotionText) {
                postEmotion.innerHTML = `<span>•</span><span>${post.emotion} ${post.emotionText}</span>`;
                postEmotion.style.display = 'inline';
            } else {
                postEmotion.style.display = 'none';
            }
        }
    }

    updatePostCategory(post) {
        const categoryIcon = document.getElementById('modalCategoryIcon');
        const categoryText = document.getElementById('modalCategoryText');

        const category = this.normalizeCategory(post.category);

        if (categoryIcon) {
            categoryIcon.className = this.getCategoryIcon(category);
        }

        if (categoryText) {
            categoryText.textContent = this.getCategoryText(category);
        }
    }

    updatePostContent(post) {
        const postTitle = document.getElementById('modalPostTitle');
        const postText = document.getElementById('modalPostText');

        if (postTitle) {
            postTitle.textContent = post.title || 'Без заглавие';
        }

        if (postText) {
            const content = post.content || post.excerpt || '';
            postText.textContent = content;
        }
    }

    updatePostImage(post) {
        const imageContainer = document.getElementById('modalPostImageContainer');
        const postImage = document.getElementById('modalPostImage');

        if (post.imageUrl && imageContainer && postImage) {
            postImage.src = post.imageUrl;
            postImage.alt = post.title || 'Post image';
            imageContainer.style.display = 'block';
        } else if (imageContainer) {
            imageContainer.style.display = 'none';
        }
    }

    updatePostStats(post) {
        const likesCount = document.getElementById('modalLikesCount');
        const dislikesCount = document.getElementById('modalDislikesCount');
        const commentsCount = document.getElementById('modalCommentsCount');
        const sharesCount = document.getElementById('modalSharesCount');

        if (likesCount) likesCount.textContent = post.likesCount || 0;
        if (dislikesCount) dislikesCount.textContent = post.dislikesCount || 0;
        if (commentsCount) commentsCount.textContent = post.commentsCount || 0;
        if (sharesCount) sharesCount.textContent = post.sharesCount || 0;
    }

    updatePostActions(post) {
        const likeBtn = document.getElementById('modalLikeBtn');
        const dislikeBtn = document.getElementById('modalDislikeBtn');

        if (!window.postInteractions) return;

        const isLiked = window.postInteractions.isPostLiked(post.id);
        const isDisliked = window.postInteractions.isPostDisliked(post.id);

        if (likeBtn) {
            const icon = likeBtn.querySelector('i');
            if (isLiked) {
                likeBtn.classList.add('liked');
                icon.className = 'bi bi-hand-thumbs-up-fill';
            } else {
                likeBtn.classList.remove('liked');
                icon.className = 'bi bi-hand-thumbs-up';
            }
        }

        if (dislikeBtn) {
            const icon = dislikeBtn.querySelector('i');
            if (isDisliked) {
                dislikeBtn.classList.add('disliked');
                icon.className = 'bi bi-hand-thumbs-down-fill';
            } else {
                dislikeBtn.classList.remove('disliked');
                icon.className = 'bi bi-hand-thumbs-down';
            }
        }
    }

    updatePostMenu(post) {
        const postMenu = document.getElementById('modalPostMenu');

        if (postMenu) {
            const isOwner = window.currentUserId && window.currentUserId == post.author?.id;
            postMenu.style.display = isOwner ? 'block' : 'none';
        }
    }

    updateCommentsHeader(post) {
        const headerCount = document.getElementById('commentsHeaderCount');
        if (headerCount) {
            headerCount.textContent = post.commentsCount || 0;
        }
    }

    showModal() {
        if (this.modal) {
            this.modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        if (this.modal) {
            this.modal.classList.remove('show');
            document.body.style.overflow = '';

            // Reset modal content after animation
            setTimeout(() => {
                this.resetModalContent();
            }, 300);
        }

        // Notify components
        if (window.commentsManager) {
            window.commentsManager.clearComments();
        }

        this.currentPostId = null;
        this.currentPost = null;
    }

    resetModalContent() {
        // Reset all content to default values
        const elementsToReset = [
            'modalAuthorName', 'modalPostTitle', 'modalPostText',
            'modalLikesCount', 'modalDislikesCount', 'modalCommentsCount', 'modalSharesCount'
        ];

        elementsToReset.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = '';
            }
        });

        // Hide image
        const imageContainer = document.getElementById('modalPostImageContainer');
        if (imageContainer) {
            imageContainer.style.display = 'none';
        }

        // Reset buttons
        this.resetActionButtons();
    }

    resetActionButtons() {
        const likeBtn = document.getElementById('modalLikeBtn');
        const dislikeBtn = document.getElementById('modalDislikeBtn');

        if (likeBtn) {
            likeBtn.classList.remove('liked');
            const icon = likeBtn.querySelector('i');
            if (icon) icon.className = 'bi bi-hand-thumbs-up';
        }

        if (dislikeBtn) {
            dislikeBtn.classList.remove('disliked');
            const icon = dislikeBtn.querySelector('i');
            if (icon) icon.className = 'bi bi-hand-thumbs-down';
        }
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevPostBtn');
        const nextBtn = document.getElementById('nextPostBtn');

        if (prevBtn) {
            prevBtn.disabled = this.currentIndex <= 0;
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentIndex >= this.allPosts.length - 1;
        }
    }

    async navigateToPrevious() {
        if (this.currentIndex > 0) {
            const prevPost = this.allPosts[this.currentIndex - 1];
            await this.openModal(prevPost.id, this.allPosts);
        }
    }

    async navigateToNext() {
        if (this.currentIndex < this.allPosts.length - 1) {
            const nextPost = this.allPosts[this.currentIndex + 1];
            await this.openModal(nextPost.id, this.allPosts);
        }
    }

    // ====== POST ACTIONS ======

    async toggleLike() {
        if (!window.isAuthenticated) {
            this.showLoginPrompt();
            return;
        }

        if (!this.currentPost || !window.postInteractions) return;

        try {
            await window.postInteractions.toggleLike(this.currentPost.id);

            // Update current post data
            this.currentPost.likesCount = parseInt(document.querySelector(`[data-post-id="${this.currentPost.id}"] .like-stats-count`)?.textContent || 0);
            this.currentPost.dislikesCount = parseInt(document.querySelector(`[data-post-id="${this.currentPost.id}"] .dislike-stats-count`)?.textContent || 0);

            // Update modal UI
            this.updatePostStats(this.currentPost);
            this.updatePostActions(this.currentPost);

        } catch (error) {
            console.error('Error toggling like:', error);
        }
    }

    async toggleDislike() {
        if (!window.isAuthenticated) {
            this.showLoginPrompt();
            return;
        }

        if (!this.currentPost || !window.postInteractions) return;

        try {
            await window.postInteractions.toggleDislike(this.currentPost.id);

            // Update current post data
            this.currentPost.likesCount = parseInt(document.querySelector(`[data-post-id="${this.currentPost.id}"] .like-stats-count`)?.textContent || 0);
            this.currentPost.dislikesCount = parseInt(document.querySelector(`[data-post-id="${this.currentPost.id}"] .dislike-stats-count`)?.textContent || 0);

            // Update modal UI
            this.updatePostStats(this.currentPost);
            this.updatePostActions(this.currentPost);

        } catch (error) {
            console.error('Error toggling dislike:', error);
        }
    }

    async sharePost() {
        if (!this.currentPost || !window.postInteractions) return;

        try {
            await window.postInteractions.sharePublication(this.currentPost.id);

            // Update shares count
            this.currentPost.sharesCount = (this.currentPost.sharesCount || 0) + 1;
            this.updatePostStats(this.currentPost);

        } catch (error) {
            console.error('Error sharing post:', error);
        }
    }

    editPost() {
        if (!this.currentPost || !window.publicationsManager) return;

        this.closeModal();

        // Start inline edit in main feed
        setTimeout(() => {
            window.publicationsManager.startInlineEdit(this.currentPost.id);
        }, 300);
    }

    async deletePost() {
        if (!this.currentPost || !window.postInteractions) return;

        try {
            await window.postInteractions.deletePost(this.currentPost.id);
            this.closeModal();

        } catch (error) {
            console.error('Error deleting post:', error);
        }
    }

    togglePostMenu() {
        const dropdown = this.modal.querySelector('.modal-menu-dropdown');
        if (dropdown) {
            const isVisible = dropdown.style.display === 'block';
            dropdown.style.display = isVisible ? 'none' : 'block';
        }
    }

    closePostMenu() {
        const dropdown = this.modal.querySelector('.modal-menu-dropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }

    zoomImage() {
        // Future feature: full screen image view
        console.log('Image zoom feature will be implemented');
    }

    // ====== UTILITY METHODS ======

    showLoading() {
        this.isLoading = true;
        const loading = document.getElementById('modalLoading');
        if (loading) {
            loading.style.display = 'flex';
        }
    }

    hideLoading() {
        this.isLoading = false;
        const loading = document.getElementById('modalLoading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    showError(message) {
        if (window.postInteractions) {
            window.postInteractions.showError(message);
        } else {
            alert(message);
        }
    }

    showLoginPrompt() {
        if (window.postInteractions) {
            window.postInteractions.showLoginPrompt();
        }
    }

    isVisible() {
        return this.modal && this.modal.classList.contains('show');
    }

    trackModalOpen(postId) {
        if (window.analyticsTracker) {
            window.analyticsTracker.track('modal_open', { postId: postId });
        }
    }

    // Copy utility methods from publicationsMain.js
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

    normalizeStatus(status) {
        if (!status) return 'PUBLISHED';
        return typeof status === 'string' ? status.toUpperCase() : status.toString().toUpperCase();
    }

    normalizeCategory(category) {
        if (!category) return 'OTHER';
        return typeof category === 'string' ? category.toLowerCase() : category.toString().toLowerCase();
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
            'PENDING': 'Изчаква преглед',
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
}

// Global function to open modal
window.openPostModal = function(postId) {
    if (window.publicationDetailModal) {
        const allPosts = window.publicationsManager ? window.publicationsManager.allLoadedPosts : [];
        window.publicationDetailModal.openModal(postId, allPosts);
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.publicationDetailModal = new PublicationDetailModal();
    } catch (error) {
        console.error('Failed to initialize PublicationDetailModal:', error);
    }
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PublicationDetailModal;
}