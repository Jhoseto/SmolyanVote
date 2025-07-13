// ====== PUBLICATION DETAIL MODAL - FIXED VERSION ======
// src/main/resources/static/js/publications/publicationDetailModal.js

class PublicationDetailModal {
    constructor() {
        this.modal = document.getElementById('postDetailModal');
        this.currentPost = null;
        this.isVisible = false;

        this.init();
    }

    init() {
        if (!this.modal) {
            console.error('Post detail modal not found!');
            return;
        }
        this.setupEventListeners();
        this.setupImageZoom();
    }

    setupEventListeners() {
        // Close modal
        document.getElementById('closeModalBtn')?.addEventListener('click', () => this.close());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        // Post actions
        document.getElementById('modalLikeBtn')?.addEventListener('click', () => this.toggleLike());
        document.getElementById('modalDislikeBtn')?.addEventListener('click', () => this.toggleDislike());
        document.getElementById('modalShareBtn')?.addEventListener('click', () => this.sharePost());

        // Menu actions
        document.getElementById('modalEditBtn')?.addEventListener('click', () => this.startInlineEdit());
        document.getElementById('modalDeleteBtn')?.addEventListener('click', () =>
            window.confirmDelete(this.currentPost?.id));
        document.getElementById('modalReportBtn')?.addEventListener('click', () =>
            window.showReportModal(this.currentPost?.id));

        // Post menu toggle
        const menuBtn = this.modal.querySelector('.modal-menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePostMenu();
            });
        }

        // Close menu when clicking outside
        document.addEventListener('click', () => this.closePostMenu());
    }

    setupImageZoom() {
        const imageContainer = document.getElementById('modalPostImageContainer');
        const fullscreenOverlay = document.getElementById('imageFullscreenOverlay');

        imageContainer?.addEventListener('click', () => this.showImageFullscreen());

        document.getElementById('fullscreenCloseBtn')?.addEventListener('click', () =>
            fullscreenOverlay?.classList.remove('show'));

        fullscreenOverlay?.addEventListener('click', (e) => {
            if (e.target === fullscreenOverlay) fullscreenOverlay.classList.remove('show');
        });
    }

    // ====== MAIN OPEN METHOD ======

    async open(postId) {
        try {
            console.log('🔧 DEBUG: Opening modal for post:', postId);
            this.showLoading();

            // Fetch publication data
            const response = await fetch(`/publications/detail/api/${postId}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('🔧 DEBUG: Publication data received:', data);

            // ✅ FIX: Правилно извличаме data-та
            this.currentPost = data.publication || data;

            // Populate modal content
            this.populateContent();

            // Show modal
            this.show(postId);

        } catch (error) {
            console.error('❌ DEBUG: Error opening modal:', error);
            this.showError('Възникна грешка при зареждането');
        } finally {
            this.hideLoading();
        }
    }

    // ✅ FIX: Поправен show метод
    async show(postId) {
        console.log('🔧 DEBUG: Showing modal for post:', postId);

        this.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        this.isVisible = true;

        // ✅ Инициализираме commentsManager когато отваряме модала
        if (!window.commentsManager) {
            window.commentsManager = new CommentsManager();
        }

        // ✅ Зареждаме коментарите
        await window.commentsManager.loadComments(postId);
    }

    close() {
        console.log('🔧 DEBUG: Closing modal');

        // Ако има активен edit, отказваме го
        if (this.modal.querySelector('.modal-edit-form')) {
            this.cancelInlineEdit();
        }

        this.modal.classList.remove('show');
        document.body.style.overflow = '';
        this.isVisible = false;
        this.currentPost = null;

        // ✅ Cleanup на commentsManager
        if (window.commentsManager) {
            window.commentsManager.cleanup();
        }
    }

    populateContent() {
        const post = this.currentPost;
        if (!post) {
            console.error('❌ DEBUG: No post data to populate');
            return;
        }

        console.log('🔧 DEBUG: Populating modal content:', post);

        // Author info
        this.setText('modalAuthorName', post.authorUsername || post.author?.username);
        this.setHtml('modalAuthorAvatar', this.createAvatar(
            post.authorImageUrl || post.author?.imageUrl,
            post.authorUsername || post.author?.username
        ));
        this.setText('modalPostTime', this.formatTimeAgo(post.createdAt));

        // Content
        this.setText('modalPostTitle', post.title);
        this.setText('modalPostText', post.content);
        this.setText('modalCategoryText', this.getCategoryText(post.category));

        // Category icon
        const categoryIcon = document.getElementById('modalCategoryIcon');
        if (categoryIcon) {
            categoryIcon.className = this.getCategoryIcon(post.category);
        }

        // Image
        const imageContainer = document.getElementById('modalPostImageContainer');
        const postImage = document.getElementById('modalPostImage');
        if (post.imageUrl && postImage) {
            postImage.src = post.imageUrl;
            imageContainer.style.display = 'block';
        } else {
            imageContainer.style.display = 'none';
        }

        // Stats
        this.setText('modalLikesCount', post.likesCount || 0);
        this.setText('modalDislikesCount', post.dislikesCount || 0);
        this.setText('modalCommentsCount', post.commentsCount || 0);
        this.setText('modalSharesCount', post.sharesCount || 0);
        this.setText('commentsHeaderCount', post.commentsCount || 0);

        // ✅ View count update
        this.setText('modalViewCount', post.viewsCount || 0);

        // Button states
        this.updateButton('modalLikeBtn', post.isLiked, 'bi-hand-thumbs-up-fill', 'bi-hand-thumbs-up', 'liked');
        this.updateButton('modalDislikeBtn', post.isDisliked, 'bi-hand-thumbs-down-fill', 'bi-hand-thumbs-down', 'disliked');

        // Menu visibility
        this.updateMenuVisibility(post);
    }

    updateMenuVisibility(post) {
        const menu = document.getElementById('modalPostMenu');
        if (!menu || !window.isAuthenticated) {
            if (menu) menu.style.display = 'none';
            return;
        }

        menu.style.display = 'block';

        const isOwner = window.currentUserId && window.currentUserId === (post.authorId || post.author?.id);
        const isAdmin = window.isAdmin;
        const canManage = isOwner || isAdmin;

        const editBtn = document.getElementById('modalEditBtn');
        const deleteBtn = document.getElementById('modalDeleteBtn');
        const reportBtn = document.getElementById('modalReportBtn');

        if (canManage) {
            // Собственик или админ
            if (editBtn) editBtn.style.display = 'block';
            if (deleteBtn) deleteBtn.style.display = 'block';
            if (reportBtn) reportBtn.style.display = 'none';
        } else {
            // Чужда публикация
            if (editBtn) editBtn.style.display = 'none';
            if (deleteBtn) deleteBtn.style.display = 'none';
            if (reportBtn) reportBtn.style.display = 'block';
        }
    }

    // ====== POST ACTIONS ======

    async toggleLike() {
        if (!this.currentPost || !window.postInteractions) return;

        try {
            console.log('🔧 DEBUG: Toggling like for post:', this.currentPost.id);
            await window.postInteractions.toggleLike(this.currentPost.id);
            this.syncFromMainFeed();
        } catch (error) {
            console.error('❌ DEBUG: Error toggling like:', error);
        }
    }

    async toggleDislike() {
        if (!this.currentPost || !window.postInteractions) return;

        try {
            console.log('🔧 DEBUG: Toggling dislike for post:', this.currentPost.id);
            await window.postInteractions.toggleDislike(this.currentPost.id);
            this.syncFromMainFeed();
        } catch (error) {
            console.error('❌ DEBUG: Error toggling dislike:', error);
        }
    }

    async sharePost() {
        if (!window.isAuthenticated) {
            window.showLoginWarning();
            return;
        }

        if (!this.currentPost || !window.postInteractions) return;

        try {
            console.log('🔧 DEBUG: Sharing post:', this.currentPost.id);
            await window.postInteractions.sharePublication(this.currentPost.id);
            this.syncFromMainFeed();
        } catch (error) {
            console.error('❌ DEBUG: Error sharing post:', error);
        }
    }

    // ====== SYNC WITH MAIN FEED ======

    syncFromMainFeed() {
        const mainPost = document.querySelector(`[data-post-id="${this.currentPost.id}"]`);
        if (!mainPost) return;

        // Обнови counts от DOM-а
        const likeCount = mainPost.querySelector('.like-stats-count')?.textContent;
        const dislikeCount = mainPost.querySelector('.dislike-stats-count')?.textContent;
        const shareCount = mainPost.querySelector('.share-stats-count')?.textContent;

        // Обнови button states
        const isLiked = mainPost.querySelector('.like-btn')?.classList.contains('liked');
        const isDisliked = mainPost.querySelector('.dislike-btn')?.classList.contains('disliked');

        // Аплицирай в модала
        if (likeCount !== undefined) {
            this.setText('modalLikesCount', likeCount);
            this.currentPost.likesCount = parseInt(likeCount) || 0;
        }
        if (dislikeCount !== undefined) {
            this.setText('modalDislikesCount', dislikeCount);
            this.currentPost.dislikesCount = parseInt(dislikeCount) || 0;
        }
        if (shareCount !== undefined) {
            this.setText('modalSharesCount', shareCount);
            this.currentPost.sharesCount = parseInt(shareCount) || 0;
        }

        // Обнови button визуали
        this.updateButton('modalLikeBtn', isLiked, 'bi-hand-thumbs-up-fill', 'bi-hand-thumbs-up', 'liked');
        this.updateButton('modalDislikeBtn', isDisliked, 'bi-hand-thumbs-down-fill', 'bi-hand-thumbs-down', 'disliked');
    }

    // ====== INLINE EDIT FUNCTIONALITY ======

    startInlineEdit() {
        if (!this.currentPost || this.modal.querySelector('.modal-edit-form')) return;

        const contentContainer = this.modal.querySelector('.modal-post-content');
        if (!contentContainer) return;

        const editForm = document.createElement('div');
        editForm.className = 'modal-edit-form';
        editForm.innerHTML = `
            <textarea class="modal-edit-textarea" placeholder="Редактирайте публикацията...">${this.currentPost.content || ''}</textarea>
            <div class="modal-edit-buttons">
                <button class="modal-edit-cancel">Отказ</button>
                <button class="modal-edit-save">Запази</button>
            </div>
        `;

        // Hide original content
        contentContainer.style.display = 'none';
        contentContainer.parentNode.insertBefore(editForm, contentContainer.nextSibling);

        // Setup event listeners
        editForm.querySelector('.modal-edit-cancel').addEventListener('click', () => this.cancelInlineEdit());
        editForm.querySelector('.modal-edit-save').addEventListener('click', () => this.saveInlineEdit());
    }

    cancelInlineEdit() {
        const editForm = this.modal.querySelector('.modal-edit-form');
        const contentContainer = this.modal.querySelector('.modal-post-content');

        if (editForm) editForm.remove();
        if (contentContainer) contentContainer.style.display = 'block';
    }

    async saveInlineEdit() {
        const editForm = this.modal.querySelector('.modal-edit-form');
        const textarea = editForm?.querySelector('.modal-edit-textarea');
        const saveBtn = editForm?.querySelector('.modal-edit-save');

        if (!textarea || !this.currentPost) return;

        const newContent = textarea.value.trim();
        if (!newContent) return;

        saveBtn.disabled = true;
        saveBtn.textContent = 'Запазване...';

        try {
            // Update via postInteractions
            if (window.postInteractions) {
                await window.postInteractions.editPublication(this.currentPost.id, newContent);
                this.currentPost.content = newContent;
                this.setText('modalPostText', newContent);
                this.cancelInlineEdit();
            }
        } catch (error) {
            console.error('❌ DEBUG: Error saving edit:', error);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Запази';
        }
    }

    // ====== MENU FUNCTIONALITY ======

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

    // ====== IMAGE FUNCTIONALITY ======

    showImageFullscreen() {
        const postImage = document.getElementById('modalPostImage');
        const fullscreenImage = document.getElementById('fullscreenImage');
        const overlay = document.getElementById('imageFullscreenOverlay');

        if (postImage && fullscreenImage && overlay) {
            fullscreenImage.src = postImage.src;
            overlay.classList.add('show');
        }
    }

    // ====== UI HELPERS ======

    setText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text || '';
        }
    }

    setHtml(elementId, html) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html || '';
        }
    }

    updateButton(buttonId, isActive, activeIcon, inactiveIcon, activeClass) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        const icon = button.querySelector('i');
        if (icon) {
            icon.className = isActive ? `bi ${activeIcon}` : `bi ${inactiveIcon}`;
        }

        if (activeClass) {
            button.classList.toggle(activeClass, isActive);
        }
    }

    createAvatar(imageUrl, username) {
        if (window.avatarUtils) {
            return window.avatarUtils.createAvatar(imageUrl, username, 40, 'modal-author-avatar');
        }

        // Fallback
        const fallbackImageUrl = imageUrl || '/images/default-avatar.png';
        return `<img src="${fallbackImageUrl}" alt="${username}" style="width:40px;height:40px;border-radius:50%;">`;
    }

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'сега';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}м`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}ч`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}д`;
        return `${Math.floor(diffInSeconds / 2592000)}м`;
    }

    getCategoryText(category) {
        const categories = {
            'NEWS': 'Новини',
            'INFRASTRUCTURE': 'Инфраструктура',
            'MUNICIPAL': 'Общински въпроси',
            'INITIATIVES': 'Инициативи',
            'CULTURE': 'Култура',
            'OTHER': 'Други'
        };
        return categories[category] || category;
    }

    getCategoryIcon(category) {
        const icons = {
            'NEWS': 'bi bi-newspaper',
            'INFRASTRUCTURE': 'bi bi-building',
            'MUNICIPAL': 'bi bi-city',
            'INITIATIVES': 'bi bi-lightbulb',
            'CULTURE': 'bi bi-palette',
            'OTHER': 'bi bi-tag'
        };
        return icons[category] || 'bi bi-tag';
    }

    showLoading() {
        const loading = document.getElementById('modalLoading');
        if (loading) {
            loading.style.display = 'flex';
        }
    }

    hideLoading() {
        const loading = document.getElementById('modalLoading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    showError(message) {
        console.error('Modal error:', message);
        // TODO: Implement proper error display
        alert(message);
    }
}

// ====== GLOBAL API ======

window.openPostModal = function(postId) {
    // Проверка за authentication
    if (!window.isAuthenticated) {
        window.showLoginWarning();
        return;
    }

    if (window.publicationModal) {
        window.publicationModal.open(postId);
    }
};

// ====== INITIALIZATION ======

document.addEventListener('DOMContentLoaded', () => {
    window.publicationModal = new PublicationDetailModal();
    console.log('✅ DEBUG: PublicationDetailModal initialized');
});

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PublicationDetailModal;
}
