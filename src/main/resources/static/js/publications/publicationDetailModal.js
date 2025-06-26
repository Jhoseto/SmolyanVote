// ====== SIMPLIFIED PUBLICATION DETAIL MODAL ======
// Файл: src/main/resources/static/js/publications/publicationDetailModal.js

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

        // Post actions - директни заявки към postInteractions
        document.getElementById('modalLikeBtn')?.addEventListener('click', () => this.toggleLike());
        document.getElementById('modalDislikeBtn')?.addEventListener('click', () => this.toggleDislike());
        document.getElementById('modalShareBtn')?.addEventListener('click', () => this.sharePost());

        // Menu actions
        document.getElementById('modalEditBtn')?.addEventListener('click', () => this.startInlineEdit());
        document.getElementById('modalDeleteBtn')?.addEventListener('click', () =>
            window.confirmDelete(this.currentPost?.id));

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

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!this.isVisible) return;
            if (e.key === 'Escape') {
                // Ако има активен edit, отказваме го
                if (this.modal.querySelector('.modal-edit-form')) {
                    this.cancelInlineEdit();
                } else {
                    this.close();
                }
            }
            if (e.key === 'l' && !e.ctrlKey) { e.preventDefault(); this.toggleLike(); }
            if (e.key === 'd' && !e.ctrlKey) { e.preventDefault(); this.toggleDislike(); }
        });
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

    async open(postId) {
        try {
            this.showLoading();

            // Fetch publication data
            const response = await fetch(`/publications/detail/api/${postId}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            this.currentPost = data.publication;

            // Populate modal content
            this.populateContent();

            // Show modal
            this.show();

            // Load comments
            window.commentsManager?.loadComments(postId);

        } catch (error) {
            console.error('Error opening modal:', error);
            window.postInteractions?.showError('Възникна грешка при зареждането');
        } finally {
            this.hideLoading();
        }
    }

    populateContent() {
        const post = this.currentPost;
        if (!post) return;

        // Author info
        this.setText('modalAuthorName', post.authorUsername);
        this.setHtml('modalAuthorAvatar', this.createAvatar(post.authorImageUrl, post.authorUsername));
        this.setText('modalPostTime', this.formatTimeAgo(post.createdAt));

        // Content
        this.setText('modalPostTitle', post.title);
        this.setText('modalPostText', post.content);
        this.setText('modalCategoryText', this.getCategoryText(post.category));

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

        // Buttons state
        this.updateButton('modalLikeBtn', post.isLiked, 'bi-hand-thumbs-up-fill', 'bi-hand-thumbs-up', 'liked');
        this.updateButton('modalDislikeBtn', post.isDisliked, 'bi-hand-thumbs-down-fill', 'bi-hand-thumbs-down', 'disliked');

        // Menu visibility
        const menu = document.getElementById('modalPostMenu');
        if (menu) {
            const canManage = (window.currentUserId && window.currentUserId === post.authorId) || window.isAdmin;
            menu.style.display = canManage ? 'block' : 'none';
        }
    }

    // ====== INLINE EDIT FUNCTIONALITY ======

    startInlineEdit() {
        if (!this.currentPost || this.modal.querySelector('.modal-edit-form')) return;

        const titleElement = document.getElementById('modalPostTitle');
        const textElement = document.getElementById('modalPostText');
        const contentContainer = this.modal.querySelector('.modal-post-content');

        if (!titleElement || !textElement || !contentContainer) return;

        // Подготвяме пълното съдържание
        const fullContent = this.currentPost.content ||
            ((this.currentPost.title || '') + '\n\n' + (this.currentPost.excerpt || '')).trim();

        // Скриваме оригиналното съдържание
        titleElement.style.display = 'none';
        textElement.style.display = 'none';

        // Създаваме edit форма
        const editForm = document.createElement('div');
        editForm.className = 'modal-edit-form';
        editForm.innerHTML = `
            <textarea class="modal-edit-textarea" rows="8" placeholder="Напишете вашия текст...">${this.escapeHtml(fullContent)}</textarea>
            <div class="modal-edit-buttons">
                <button class="modal-edit-save">
                    <i class="bi bi-check"></i> Запази
                </button>
                <button class="modal-edit-cancel">
                    <i class="bi bi-x"></i> Отказ
                </button>
            </div>
        `;

        // Добавяме след category
        const categoryElement = this.modal.querySelector('.modal-post-category');
        if (categoryElement && categoryElement.parentNode) {
            categoryElement.parentNode.insertBefore(editForm, categoryElement.nextSibling);
        } else {
            contentContainer.insertBefore(editForm, contentContainer.firstChild);
        }

        // Event listeners за бутоните
        const saveBtn = editForm.querySelector('.modal-edit-save');
        const cancelBtn = editForm.querySelector('.modal-edit-cancel');
        const textarea = editForm.querySelector('.modal-edit-textarea');

        saveBtn.addEventListener('click', () => this.saveInlineEdit());
        cancelBtn.addEventListener('click', () => this.cancelInlineEdit());

        // Focus на textarea
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }, 100);

        // Затваряме менюто
        this.closePostMenu();
    }

    async saveInlineEdit() {
        const textarea = this.modal.querySelector('.modal-edit-textarea');
        if (!textarea) return;

        const newContent = textarea.value.trim();
        if (!newContent) {
            window.postInteractions?.showError('Текстът не може да бъде празен!');
            return;
        }

        const saveBtn = this.modal.querySelector('.modal-edit-save');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<div class="spinner-border spinner-border-sm"></div> Запазване...';
        }

        try {
            // Split content into title and excerpt
            const lines = newContent.split('\n');
            const newTitle = lines[0].substring(0, 100);
            const remainingContent = lines.slice(1).join('\n').trim();
            const newExcerpt = remainingContent.substring(0, 200);

            const updateData = {
                title: newTitle,
                content: newContent,
                category: this.currentPost.category,
                emotion: this.currentPost.emotion,
                emotionText: this.currentPost.emotionText,
                imageUrl: this.currentPost.imageUrl
            };

            await window.publicationsAPI.updatePublication(this.currentPost.id, updateData);

            // Обновяваме данните в паметта
            this.currentPost.title = newTitle;
            this.currentPost.excerpt = newExcerpt;
            this.currentPost.content = newContent;
            this.currentPost.status = 'EDITED';

            // Обновяваме DOM-а в модала
            this.updateModalContentAfterEdit(newTitle, newContent);

            // Обновяваме главния feed ако постът е там
            this.updateMainFeedAfterEdit(newTitle, newExcerpt, newContent);

            this.cancelInlineEdit();
            window.postInteractions?.showToast('Публикацията е обновена успешно!', 'success');

        } catch (error) {
            console.error('Error updating post:', error);
            window.postInteractions?.showError('Възникна грешка при запазването.');

            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="bi bi-check"></i> Запази';
            }
        }
    }

    updateModalContentAfterEdit(newTitle, newContent) {
        const titleElement = document.getElementById('modalPostTitle');
        const textElement = document.getElementById('modalPostText');

        if (titleElement) {
            titleElement.textContent = newTitle;
        }
        if (textElement) {
            textElement.textContent = newContent;
        }

        // Обновяваме статуса
        const statusElement = this.modal.querySelector('.modal-post-status');
        if (statusElement) {
            statusElement.className = 'modal-post-status status-edited';
            statusElement.textContent = 'Редактирана';
        }
    }

    updateMainFeedAfterEdit(newTitle, newExcerpt, newContent) {
        const mainPost = document.querySelector(`[data-post-id="${this.currentPost.id}"]`);
        if (mainPost) {
            // Обновяваме заглавието
            const mainTitle = mainPost.querySelector('.post-title');
            if (mainTitle) {
                mainTitle.textContent = newTitle;
            }

            // Обновяваме excerpt
            const mainExcerpt = mainPost.querySelector('.post-excerpt');
            if (mainExcerpt) {
                if (newExcerpt && newExcerpt !== newTitle) {
                    mainExcerpt.textContent = newExcerpt;
                    mainExcerpt.style.display = 'block';
                } else {
                    mainExcerpt.style.display = 'none';
                }
            } else if (newExcerpt && newExcerpt !== newTitle) {
                // Създаваме нов excerpt ако не съществува
                const excerptDiv = document.createElement('div');
                excerptDiv.className = 'post-excerpt';
                excerptDiv.textContent = newExcerpt;

                const titleElement = mainPost.querySelector('.post-title');
                if (titleElement && titleElement.nextSibling) {
                    titleElement.parentNode.insertBefore(excerptDiv, titleElement.nextSibling);
                }
            }

            // Обновяваме статуса
            const mainStatus = mainPost.querySelector('.post-status');
            if (mainStatus) {
                mainStatus.className = 'post-status status-edited';
                mainStatus.textContent = 'Редактирана';
            }
        }
    }

    cancelInlineEdit() {
        const editForm = this.modal.querySelector('.modal-edit-form');
        const titleElement = document.getElementById('modalPostTitle');
        const textElement = document.getElementById('modalPostText');

        // Премахваме edit форма
        if (editForm) editForm.remove();

        // Показваме оригиналното съдържание
        if (titleElement) titleElement.style.display = 'block';
        if (textElement) textElement.style.display = 'block';
    }

    // ====== SIMPLE HELPERS ======

    setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    setHtml(id, html) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    }

    updateButton(btnId, isActive, activeIcon, inactiveIcon, activeClass) {
        const btn = document.getElementById(btnId);
        if (!btn) return;

        const icon = btn.querySelector('i');
        if (icon) icon.className = `bi ${isActive ? activeIcon : inactiveIcon}`;
        btn.classList.toggle(activeClass, isActive);
    }

    createAvatar(imageUrl, username) {
        return window.avatarUtils ?
            window.avatarUtils.createAvatar(imageUrl, username, 40, 'modal-author-avatar') :
            `<img src="${imageUrl || '/images/default-avatar.png'}" alt="${username}" style="width:40px;height:40px;border-radius:50%;">`;
    }

    formatTimeAgo(dateInput) {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return 'неизвестно време';

        const diffInSeconds = Math.floor((new Date() - date) / 1000);

        if (diffInSeconds < 60) return 'преди малко';
        if (diffInSeconds < 3600) return `преди ${Math.floor(diffInSeconds / 60)} мин`;
        if (diffInSeconds < 86400) return `преди ${Math.floor(diffInSeconds / 3600)} ч`;
        return date.toLocaleDateString('bg-BG');
    }

    getCategoryText(category) {
        const texts = {
            'NEWS': 'Новини',
            'INFRASTRUCTURE': 'Инфраструктура',
            'MUNICIPAL': 'Община',
            'INITIATIVES': 'Граждански инициативи',
            'CULTURE': 'Културни събития'
        };
        return texts[category] || 'Други';
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ====== POST ACTIONS ======

    async toggleLike() {
        if (!this.currentPost || !window.postInteractions) return;

        try {
            await window.postInteractions.toggleLike(this.currentPost.id);
            this.syncFromMainFeed();
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    }

    async toggleDislike() {
        if (!this.currentPost || !window.postInteractions) return;

        try {
            await window.postInteractions.toggleDislike(this.currentPost.id);
            this.syncFromMainFeed();
        } catch (error) {
            console.error('Error toggling dislike:', error);
        }
    }

    async sharePost() {
        if (!this.currentPost || !window.postInteractions) return;

        try {
            await window.postInteractions.sharePublication(this.currentPost.id);
            this.syncFromMainFeed();
        } catch (error) {
            console.error('Error sharing post:', error);
        }
    }

    // Синхронизация с главния feed
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

    show() {
        this.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        this.isVisible = true;
    }

    close() {
        // Ако има активен edit, отказваме го
        if (this.modal.querySelector('.modal-edit-form')) {
            this.cancelInlineEdit();
        }

        this.modal.classList.remove('show');
        document.body.style.overflow = '';
        this.isVisible = false;
        this.currentPost = null;

        // Clear comments
        window.commentsManager?.clearComments();
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

    showImageFullscreen() {
        const postImage = document.getElementById('modalPostImage');
        const fullscreenImage = document.getElementById('fullscreenImage');
        const overlay = document.getElementById('imageFullscreenOverlay');

        if (postImage && fullscreenImage && overlay) {
            fullscreenImage.src = postImage.src;
            overlay.classList.add('show');
        }
    }

    showLoading() {
        document.getElementById('modalLoading')?.style.setProperty('display', 'flex');
    }

    hideLoading() {
        document.getElementById('modalLoading')?.style.setProperty('display', 'none');
    }
}

// ====== GLOBAL API ======

window.openPostModal = function(postId) {
    window.publicationDetailModal?.open(postId);
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.publicationDetailModal = new PublicationDetailModal();
});

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PublicationDetailModal;
}