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
            this.currentPost = data.publication || data;
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

    async show(postId) {

        this.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        this.isVisible = true;

        if (!window.commentsManager) {
            window.commentsManager = new CommentsManager();
        }

        await window.commentsManager.loadComments(postId);
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

        // Author info
        this.setText('modalAuthorName', post.authorUsername || post.author?.username);
        this.setHtml('modalAuthorAvatar', this.createAvatar(
            post.authorImageUrl || post.author?.imageUrl,
            post.authorUsername || post.author?.username
        ));
        this.setText('modalPostTime', this.formatTimeAgo(post.createdAt));

        // Content - ПРЕМАХНАХ РЕДА ЗА modalPostTitle
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

        // ====== НОВА ЛОГИКА ЗА ЛИНКОВЕ  ======
        // Link content
        if (post.linkUrl && post.linkMetadata) {
            this.populateLinkContent(post.linkUrl, post.linkMetadata);
        } else {
            this.hideLinkContent();
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
            await window.postInteractions.toggleLike(this.currentPost.id);
            this.syncFromMainFeed();
        } catch (error) {
            console.error('❌ DEBUG: Error toggling like:', error);
        }
    }

    async toggleDislike() {
        if (!this.currentPost || !window.postInteractions) return;

        try {
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
        if (!newContent) {
            window.postInteractions?.showToast('Текстът не може да бъде празен!', 'error');
            return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = 'Запазване...';

        try {
            // Split content into title and excerpt (same logic as publicationsMain.js)
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

            // Update via publicationsAPI (same as publicationsMain.js)
            if (window.publicationsAPI) {
                await window.publicationsAPI.updatePublication(this.currentPost.id, updateData);
                
                // Update local data
                this.currentPost.title = newTitle;
                this.currentPost.excerpt = newExcerpt;
                this.currentPost.content = newContent;
                this.currentPost.status = 'EDITED';
                
                // Update modal display
                this.setText('modalPostText', newContent);
                this.cancelInlineEdit();
                
                // Show success message
                window.postInteractions?.showToast('Публикацията е обновена успешно!', 'success');
                
                // Update the post in the main list if it exists
                if (window.publicationsManager) {
                    const postElement = document.querySelector(`[data-post-id="${this.currentPost.id}"]`);
                    if (postElement) {
                        window.publicationsManager.updatePostContentInDOM(postElement, newTitle, newExcerpt);
                        window.publicationsManager.updatePostStatus(postElement, 'EDITED');
                    }
                }
            } else {
                throw new Error('publicationsAPI не е наличен');
            }
        } catch (error) {
            console.error('❌ DEBUG: Error saving edit:', error);
            window.postInteractions?.showError('Възникна грешка при запазването.');
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

    populateLinkContent(linkUrl, linkMetadata) {
        try {
            const metadata = typeof linkMetadata === 'string'
                ? JSON.parse(linkMetadata)
                : linkMetadata;

            if (!metadata || !metadata.type) {
                this.hideLinkContent();
                return;
            }

            // Показваме link секцията
            const linkContent = document.getElementById('modalLinkContent');
            if (linkContent) {
                linkContent.style.display = 'block';
            }

            // Скриваме всички preview типове
            const youtubePlayer = document.getElementById('modalYouTubePlayer');
            const imageDisplay = document.getElementById('modalImageDisplay');
            const websitePreview = document.getElementById('modalWebsitePreview');

            if (youtubePlayer) youtubePlayer.style.display = 'none';
            if (imageDisplay) imageDisplay.style.display = 'none';
            if (websitePreview) websitePreview.style.display = 'none';

            // Показваме правилния тип според metadata
            switch (metadata.type) {
                case 'youtube':
                    this.showYouTubePlayer(metadata);
                    break;
                case 'image':
                    this.showImageDisplay(metadata);
                    break;
                case 'website':
                default:
                    this.showWebsitePreview(metadata);
                    break;
            }

        } catch (error) {
            console.error('❌ Error parsing link metadata:', error);
            this.hideLinkContent();
        }
    }

    showYouTubePlayer(metadata) {
        const playerContainer = document.getElementById('modalYouTubePlayer');

        if (!playerContainer) {
            console.error('❌ YouTube player container not found');
            return;
        }

        // За localhost показваме само thumbnail
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            this.showYouTubeThumbnail(playerContainer, metadata);
            return;
        }

        // За production показваме iframe
        const iframe = document.getElementById('modalYouTubeIframe');
        const title = document.getElementById('modalYouTubeTitle');
        const link = document.getElementById('modalYouTubeLink');
        const linkText = document.getElementById('modalYouTubeLinkText');

        if (iframe && title && link && linkText) {
            iframe.src = metadata.embedUrl;
            title.textContent = metadata.title || 'YouTube Video';
            link.href = metadata.url;
            linkText.textContent = metadata.title || 'Отвори в YouTube';
            playerContainer.style.display = 'block';
        }
    }


    showYouTubeThumbnail(container, metadata) {
        container.innerHTML = `
        <div class="youtube-thumbnail" onclick="window.open('${metadata.url}', '_blank')" style="
            position: relative; 
            cursor: pointer;
            background-image: url('${metadata.thumbnail}');
            background-size: cover;
            background-position: center;
            height: 200px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: transform 0.2s ease;
        " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
            <div style="
                width: 68px; 
                height: 48px; 
                background: rgba(255, 0, 0, 0.9);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">▶</div>
        </div>
        <div style="padding: 12px 0; border-bottom: 1px solid #e4e6eb; margin-bottom: 8px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1c1e21;">${metadata.title}</h3>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 14px; color: #65676b;">Кликни за гледане в YouTube</span>
                <a href="${metadata.url}" target="_blank" style="
                    color: #ff0000; 
                    text-decoration: none; 
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                ">
                    <i class="bi bi-youtube"></i>
                    <span>YouTube</span>
                </a>
            </div>
        </div>
    `;
        container.style.display = 'block';
    }

    showImageDisplay(metadata) {
        const imageContainer = document.getElementById('modalImageDisplay');
        const image = document.getElementById('modalLinkImage');
        const title = document.getElementById('modalImageTitle');
        const link = document.getElementById('modalImageLink');

        if (!imageContainer || !image || !title || !link) {
            console.error('❌ Image display elements not found');
            return;
        }

        // Задаваме изображението
        image.src = metadata.url;
        image.alt = metadata.title || 'Изображение';

        // Задаваме заглавието
        title.textContent = metadata.title || 'Изображение';

        // Задаваме линка
        link.href = metadata.url;

        // Показваме контейнера
        imageContainer.style.display = 'block';

        console.log('✅ DEBUG: Image display populated');
    }

    showWebsitePreview(metadata) {
        const previewContainer = document.getElementById('modalWebsitePreview');

        if (!previewContainer) {
            console.error('❌ Website preview container not found');
            return;
        }

        const hasImage = metadata.image && metadata.image.length > 0;
        const title = metadata.title || metadata.domain || 'Уебсайт';
        const description = metadata.description || 'Посетете уебсайта за повече информация';
        const domain = metadata.domain || 'УЕБСАЙТ';

        if (hasImage) {
            // Показваме голямо изображение като YouTube
            previewContainer.innerHTML = `
            <div class="website-preview-large">
                <div class="website-large-image" 
                     style="background-image: url('${metadata.image}'); cursor: pointer;"
                     onclick="window.open('${metadata.url}', '_blank')">
                </div>
                <div class="website-content-below">
                    <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1c1e21;">
                        ${title}
                    </h3>
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #65676b; line-height: 1.4;">
                        ${description}
                    </p>
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="font-size: 12px; color: #8a8d91; text-transform: uppercase;">
                            ${domain}
                        </div>
                        <a href="${metadata.url}" target="_blank" style="
                            color: #1877f2; 
                            text-decoration: none; 
                            font-weight: 500;
                            display: flex;
                            align-items: center;
                            gap: 4px;
                            font-size: 14px;
                        ">
                            <i class="bi bi-box-arrow-up-right"></i>
                            <span>Посети</span>
                        </a>
                    </div>
                </div>
            </div>
        `;
        } else {
            // Показваме compact preview без изображение
            previewContainer.innerHTML = `
            <div class="website-card">
                <div class="website-header">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="website-icon">
                            ${metadata.favicon ?
                `<img src="${metadata.favicon}" class="favicon" alt="Favicon">` :
                '<i class="bi bi-link-45deg" style="font-size: 20px; color: #65676b;"></i>'
            }
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #1c1e21;">
                                ${title}
                            </h3>
                            <p style="margin: 0; font-size: 14px; color: #65676b; line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                                ${description}
                            </p>
                            <div style="margin-top: 4px; font-size: 12px; color: #8a8d91; text-transform: uppercase;">
                                ${domain}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="website-actions">
                    <a href="${metadata.url}" target="_blank" style="
                        color: #1877f2; 
                        text-decoration: none; 
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        width: fit-content;
                    ">
                        <i class="bi bi-box-arrow-up-right"></i>
                        <span>Посети уебсайта</span>
                    </a>
                </div>
            </div>
        `;
        }

        // Показваме контейнера
        previewContainer.style.display = 'block';
    }

    hideLinkContent() {
        const linkContent = document.getElementById('modalLinkContent');
        if (linkContent) {
            linkContent.style.display = 'none';
        }
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
});

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PublicationDetailModal;
}
