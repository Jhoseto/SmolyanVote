// ====== PUBLICATION DETAIL MODAL - FIXED VERSION ======
// src/main/resources/static/js/publications/publicationDetailModal.js

class PublicationDetailModal {
    constructor() {
        this.modal = document.getElementById('postDetailModal');
        this.currentPost = null;
        this.isVisible = false;
        this.currentYouTubeVideo = null; // Store current YouTube video info
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.youtubePlayer = null; // Latest YouTube player instance
        this.videoCurrentTime = 0; // Current playback position for active player
        this.videoTimeInterval = null; // Interval for tracking video time
        this.pendingSeekTime = null; // Time to resume playback from when moving between players
        this.activePlayerType = 'modal'; // 'modal' or 'floating'

        this.init();
        this.loadYouTubeAPI();
    }

    loadYouTubeAPI() {
        // Зареждаме YouTube IFrame API ако още не е зареден
        if (window.YT && window.YT.Player) {
            return; // API вече е зареден
        }

        if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
            return; // Скриптът вече е добавен
        }

        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        // Изчакваме API-то да се зареди
        window.onYouTubeIframeAPIReady = () => {
            console.log('✅ YouTube IFrame API loaded');
        };
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
        // НЕ скриваме floating мини-плеър - той остава активен на заден фон

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

        // Проверяваме дали има активно YouTube видео
        const youtubeIframe = document.getElementById('modalYouTubeIframe');
        const youtubePlayer = document.getElementById('modalYouTubePlayer');
        
        // Проверяваме дали YouTube player-ът е видим и има src
        if (youtubePlayer && youtubePlayer.style.display !== 'none' && 
            youtubeIframe && youtubeIframe.src && 
            this.currentYouTubeVideo && this.currentYouTubeVideo.embedUrl) {
            console.log('🎬 Moving video to floating player:', this.currentYouTubeVideo.title);
            // ВЕДНАГА преместваме iframe-а без забавяне
            this.moveVideoToFloatingPlayer(youtubeIframe);
        } else {
            console.log('❌ No YouTube video to create floating player:', {
                youtubePlayerVisible: youtubePlayer && youtubePlayer.style.display !== 'none',
                iframeSrc: youtubeIframe?.src,
                currentVideo: this.currentYouTubeVideo
            });
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

        // НЕ нулираме currentYouTubeVideo тук - ще се обнови при показване на YouTube player

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
                    this.currentYouTubeVideo = null; // Няма YouTube видео
                    this.showImageDisplay(metadata);
                    break;
                case 'website':
                default:
                    this.currentYouTubeVideo = null; // Няма YouTube видео
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

        // Вземаме или генерираме embedUrl и videoId
        let embedUrl = metadata.embedUrl;
        let videoId = metadata.videoId;
        
        // Ако няма embedUrl, но има videoId или url, генерираме го
        if (!embedUrl) {
            if (videoId) {
                embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
            } else if (metadata.url) {
                // Извличаме videoId от URL-а
                videoId = this.extractYouTubeVideoId(metadata.url);
                if (videoId) {
                    embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
                }
            }
        }

        // Ако все още няма embedUrl, показваме thumbnail с линк
        if (!embedUrl) {
            this.showYouTubeThumbnail(playerContainer, metadata);
            return;
        }

        // Показваме iframe за възпроизвеждане на видео
        let iframe = document.getElementById('modalYouTubeIframe');
        
        // Ако iframe-ът не съществува или е преместен в floating player, създаваме нов
        const floatingIframe = document.getElementById('floatingYouTubeIframe');
        if (!iframe || (floatingIframe && iframe.id === 'floatingYouTubeIframe')) {
            const iframeContainer = playerContainer.querySelector('.youtube-embed-container');
            if (iframeContainer) {
                // Премахваме стария iframe ако съществува
                const oldIframe = iframeContainer.querySelector('iframe');
                if (oldIframe) {
                    oldIframe.remove();
                }
                
                iframe = document.createElement('iframe');
                iframe.id = 'modalYouTubeIframe';
                iframe.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: 8px;';
                iframe.setAttribute('allowfullscreen', '');
                iframe.setAttribute('allow', 'autoplay; encrypted-media');
                iframeContainer.appendChild(iframe);
            }
        }
        
        const title = document.getElementById('modalYouTubeTitle');
        const link = document.getElementById('modalYouTubeLink');
        const linkText = document.getElementById('modalYouTubeLinkText');

        if (iframe && title && link && linkText) {
            // Ако вече има floating player с активно видео, спираме го преди да пускаме ново
            const existingFloatingPlayer = document.getElementById('floatingYouTubePlayer');
            const existingFloatingIframe = document.getElementById('floatingYouTubeIframe');
            if (existingFloatingPlayer && existingFloatingPlayer.style.display !== 'none' && existingFloatingIframe && existingFloatingIframe.src) {
                console.log('🛑 Stopping existing video in floating player');
                // Спираме старото видео като премахваме src
                existingFloatingIframe.src = '';
                // Скриваме floating player-а
                existingFloatingPlayer.style.display = 'none';
                // Премахваме iframe-а
                existingFloatingIframe.remove();
            }

            // Задаваме embedUrl с допълнителни параметри за по-добро възпроизвеждане
            const normalizedEmbedUrl = this.normalizeEmbedUrl(embedUrl, { autoplay: 1 });
            iframe.src = normalizedEmbedUrl;
            title.textContent = metadata.title || 'YouTube Video';
            link.href = metadata.url || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : '#'); 
            linkText.textContent = metadata.title || 'Отвори в YouTube';
            playerContainer.style.display = 'block';
            
            // Запазваме информацията за видеото за floating мини-плеър
            this.currentYouTubeVideo = {
                embedUrl: normalizedEmbedUrl,
                title: metadata.title || 'YouTube Video',
                videoId: videoId
            };
            console.log('✅ YouTube video saved for floating player:', this.currentYouTubeVideo);
            this.pendingSeekTime = null;
            this.videoCurrentTime = 0;
            this.activePlayerType = 'modal';
            
            // Инициализираме YouTube IFrame API player за да можем да контролираме видеото
            setTimeout(() => {
                this.initYouTubePlayer(iframe, videoId);
            }, 200);
        } else {
            // Fallback: показваме thumbnail
            this.showYouTubeThumbnail(playerContainer, metadata);
        }
    }

    extractYouTubeVideoId(url) {
        if (!url) return null;
        
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /youtube\.com\/watch\?.*v=([^&\n?#]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        return null;
    }

    normalizeEmbedUrl(embedUrl, options = {}) {
        if (!embedUrl) {
            return '';
        }

        const { autoplay, start } = options;

        try {
            const url = new URL(embedUrl, window.location.origin);

            // Задължителни параметри за по-добър контрол
            url.searchParams.set('enablejsapi', '1');
            if (window.location?.origin) {
                url.searchParams.set('origin', window.location.origin);
            }
            url.searchParams.set('modestbranding', '1');
            url.searchParams.set('rel', '0');
            url.searchParams.set('playsinline', '1');

            if (typeof autoplay !== 'undefined') {
                url.searchParams.set('autoplay', autoplay ? '1' : '0');
            }

            if (typeof start !== 'undefined' && start !== null && !isNaN(start)) {
                const normalizedStart = Math.max(0, Math.floor(start));
                if (normalizedStart > 0) {
                    url.searchParams.set('start', normalizedStart.toString());
                } else {
                    url.searchParams.delete('start');
                }
            }

            return url.toString();
        } catch (error) {
            console.warn('⚠️ Could not normalize embed URL:', embedUrl, error);
            return embedUrl;
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
        // Нулираме YouTube видео, защото няма link content
        this.currentYouTubeVideo = null;
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

    // ====== YOUTUBE IFrame API ======

    initYouTubePlayer(iframe, videoId) {
        // Изчакваме YouTube API да се зареди
        if (!window.YT || !window.YT.Player) {
            // Ако API-то не е заредено, опитваме се отново след малко
            setTimeout(() => this.initYouTubePlayer(iframe, videoId), 500);
            return;
        }

        // Спираме стария интервал ако съществува
        if (this.videoTimeInterval) {
            clearInterval(this.videoTimeInterval);
            this.videoTimeInterval = null;
        }

        // Ако iframe-ът вече има src, не инициализираме player отново
        // (може да е вече инициализиран)
        if (iframe.id === 'floatingYouTubeIframe' && iframe.src) {
            // За floating player, изчакваме малко и инициализираме
            setTimeout(() => {
                this.initYouTubePlayerInstance(iframe, videoId);
            }, 2000);
            return;
        }

        this.initYouTubePlayerInstance(iframe, videoId);
    }

    initYouTubePlayerInstance(iframe, videoId) {
        if (!window.YT || !window.YT.Player) {
            setTimeout(() => this.initYouTubePlayerInstance(iframe, videoId), 500);
            return;
        }

        const isFloatingIframe = iframe.id === 'floatingYouTubeIframe';
        const playerType = isFloatingIframe ? 'floating' : 'modal';

        try {
            const playerOptions = {
                playerVars: {
                    playsinline: 1,
                    rel: 0,
                    modestbranding: 1,
                    enablejsapi: 1,
                    origin: window.location.origin,
                    autoplay: isFloatingIframe ? 1 : 0
                },
                events: {
                    'onStateChange': (event) => {
                        // Следяме промените в състоянието на видеото
                        if (isFloatingIframe &&
                            typeof this.pendingSeekTime === 'number' &&
                            event.data === window.YT.PlayerState.PLAYING) {
                            this.applyPendingSeek(event.target, true);
                        }

                        if (event.data === window.YT.PlayerState.PLAYING) {
                            // Видеото свири - стартираме периодично обновяване
                            this.startVideoTimeTracking(playerType);
                        } else if (event.data === window.YT.PlayerState.PAUSED) {
                            // Видеото е на пауза - обновяваме позицията
                            this.updateVideoTime(playerType);
                        }
                    },
                    'onReady': (event) => {
                        console.log('✅ YouTube player ready');
                        // Запазваме референция към player-а
                        this.youtubePlayer = event.target;
                        this.activePlayerType = playerType;

                        if (isFloatingIframe) {
                            try {
                                event.target.playVideo();
                            } catch (error) {
                                console.warn('⚠️ Could not auto-play floating player:', error);
                            }
                        }

                        this.applyPendingSeek(event.target, isFloatingIframe);
                        // Стартираме проследяване на позицията веднага
                        this.startVideoTimeTracking(playerType);
                    }
                }
            };

            if (!iframe.src || !iframe.src.includes('youtube.com/embed')) {
                playerOptions.videoId = videoId;
            }

            this.youtubePlayer = new window.YT.Player(iframe, playerOptions);
        } catch (error) {
            console.warn('⚠️ Could not initialize YouTube player:', error);
            // Fallback: стартираме проследяване без YouTube API
            this.startVideoTimeTracking(playerType);
        }
    }

    applyPendingSeek(player, isFloatingIframe) {
        if (typeof this.pendingSeekTime !== 'number') {
            if (isFloatingIframe) {
                try {
                    player.playVideo();
                } catch (error) {
                    console.warn('⚠️ Could not resume floating player automatically:', error);
                }
            }
            return;
        }

        const targetTime = Math.max(0, Math.floor(this.pendingSeekTime));
        let seekSucceeded = targetTime === 0;

        if (targetTime > 0) {
            try {
                player.seekTo(targetTime, true);
                console.log('⏩ Seeking video to', targetTime, 'seconds');
                this.videoCurrentTime = targetTime;
                seekSucceeded = true;
            } catch (error) {
                console.warn('⚠️ Could not seek video:', error);
            }
        }

        if (isFloatingIframe) {
            try {
                player.playVideo();
            } catch (error) {
                console.warn('⚠️ Could not resume floating player automatically:', error);
            }
        }

        if (seekSucceeded) {
            this.pendingSeekTime = null;
        }
    }

    startVideoTimeTracking(playerType = 'modal') {
        // Спираме стария интервал ако съществува
        if (this.videoTimeInterval) {
            clearInterval(this.videoTimeInterval);
        }

        this.activePlayerType = playerType;

        // Обновяваме позицията веднага
        this.updateVideoTime(playerType);

        // Обновяваме позицията на всеки 1 секунда
        this.videoTimeInterval = setInterval(() => {
            this.updateVideoTime(playerType);
        }, 1000);
    }

    getPlayerByType(playerType = 'modal') {
        const targetType = playerType === 'floating' ? 'floatingYouTubeIframe' : 'modalYouTubeIframe';

        if (window.YT && typeof window.YT.get === 'function') {
            const player = window.YT.get(targetType);
            if (player) {
                return player;
            }
        }

        if (this.youtubePlayer && typeof this.youtubePlayer.getIframe === 'function') {
            const iframe = this.youtubePlayer.getIframe();
            if (iframe && iframe.id === targetType) {
                return this.youtubePlayer;
            }
        }

        return null;
    }

    updateVideoTime(playerType = this.activePlayerType) {
        const player = this.getPlayerByType(playerType);
        if (player && typeof player.getCurrentTime === 'function') {
            try {
                const currentTime = player.getCurrentTime();
                if (!isNaN(currentTime) && currentTime >= 0) {
                    const time = Math.floor(currentTime);
                    // Запазваме позицията само ако е по-голяма от текущата (за да не се връща назад)
                    if (time > 0 && time >= (this.videoCurrentTime || 0)) {
                        this.videoCurrentTime = time;
                        // Логваме само ако има промяна
                        if (time > 0 && time % 5 === 0) {
                            console.log('⏱️ Video time updated:', time, 'seconds');
                        }
                    }
                }
            } catch (error) {
                // Игнорираме грешки при достъп до player
            }
        }
    }

    getCurrentVideoTime(playerType = this.activePlayerType) {
        const player = this.getPlayerByType(playerType);
        if (player && typeof player.getCurrentTime === 'function') {
            try {
                const currentTime = player.getCurrentTime();
                if (!isNaN(currentTime) && currentTime >= 0) {
                    const time = Math.floor(currentTime);
                    // Обновяваме запазената стойност само ако е по-голяма и > 0
                    if (time > 0 && time >= (this.videoCurrentTime || 0)) {
                        this.videoCurrentTime = time;
                    }
                    // Ако времето е 0, връщаме последната известна позиция
                    return time > 0 ? time : (this.videoCurrentTime || 0);
                }
            } catch (error) {
                // Ако има грешка, използваме запазената стойност
                console.warn('⚠️ Error getting current time from player:', error);
            }
        }
        // Връщаме запазената позиция
        return this.videoCurrentTime || 0;
    }

    getVideoTimeWithRetry(iframe, callback, retries = 15) {
        // Опитваме се да получим позицията няколко пъти
        let attempt = 0;
        let maxTime = 0; // Запазваме максималната получена позиция
        
        const tryGetTime = () => {
            attempt++;
            
            // Обновяваме позицията
            this.updateVideoTime('modal');
            const currentTime = this.getCurrentVideoTime('modal');
            
            // Запазваме максималната позиция
            if (currentTime > maxTime) {
                maxTime = currentTime;
            }
            
            console.log(`🔄 Attempt ${attempt}/${retries}: Current video time:`, currentTime, 'seconds, Max:', maxTime, 'seconds');
            
            // Ако player-ът е готов И имаме позиция > 0, или сме изчерпали опитите
            if ((this.youtubePlayer && maxTime > 0) || attempt >= retries) {
                const finalTime = maxTime > 0 ? maxTime : currentTime;
                console.log('✅ Final video time:', finalTime, 'seconds (player ready:', !!this.youtubePlayer, ')');
                callback(finalTime);
                return;
            }
            
            // Опитваме се отново след малко
            setTimeout(tryGetTime, 400);
        };
        
        tryGetTime();
    }

    // ====== FLOATING YOUTUBE MINI PLAYER ======

    moveVideoToFloatingPlayer(modalIframe) {
        const floatingPlayer = document.getElementById('floatingYouTubePlayer');
        const floatingIframeContainer = document.querySelector('.floating-player-iframe-container');
        const floatingTitle = document.getElementById('floatingPlayerTitle');
        
        if (!floatingPlayer || !floatingIframeContainer) {
            console.error('❌ Floating player elements not found');
            return;
        }

        if (!modalIframe || !modalIframe.src) {
            console.error('❌ Modal iframe not found or has no src');
            return;
        }

        // Ако вече има iframe в floating player, спираме го и премахваме
        const existingFloatingIframe = document.getElementById('floatingYouTubeIframe');
        if (existingFloatingIframe && existingFloatingIframe !== modalIframe) {
            console.log('🛑 Removing existing floating iframe');
            existingFloatingIframe.src = '';
            existingFloatingIframe.remove();
        }

        // ПРЕМЕСТВАМЕ САМИЯ IFRAME - НЕ СЪЗДАВАМЕ НОВ!
        // Това гарантира, че видеото продължава без прекъсване
        console.log('🎬 Moving existing iframe to floating player (no interruption)');
        
        // Променяме ID-то на iframe-а
        modalIframe.id = 'floatingYouTubeIframe';
        
        // Изчистваме контейнера и преместваме iframe-а
        floatingIframeContainer.innerHTML = '';
        floatingIframeContainer.appendChild(modalIframe);
        
        // Задаваме заглавието
        if (floatingTitle && this.currentYouTubeVideo) {
            floatingTitle.textContent = this.currentYouTubeVideo.title;
        }

        // Възстановяваме позицията по подразбиране само ако не е бил преместен
        const hasCustomPosition = floatingPlayer.style.left || floatingPlayer.style.top;
        if (!hasCustomPosition) {
            floatingPlayer.style.left = 'auto';
            floatingPlayer.style.top = 'auto';
            floatingPlayer.style.right = '20px';
            floatingPlayer.style.bottom = '20px';
        }
        floatingPlayer.classList.remove('minimized', 'dragging');

        // Показваме floating мини-плеър ВЕДНАГА
        floatingPlayer.style.display = 'block';
        console.log('✅ Video moved to floating player, continuing playback without interruption');

        // Настройваме drag and drop (само ако още не е настроен)
        if (!floatingPlayer.dataset.dragSetup) {
            this.setupFloatingPlayerDrag(floatingPlayer);
            floatingPlayer.dataset.dragSetup = 'true';
        }

        // Настройваме контролите (само ако още не са настроени)
        if (!floatingPlayer.dataset.controlsSetup) {
            this.setupFloatingPlayerControls(floatingPlayer);
            floatingPlayer.dataset.controlsSetup = 'true';
        }
        
        // Обновяваме активния player тип
        this.activePlayerType = 'floating';
    }

    createFloatingPlayer(embedUrl) {
        const floatingPlayer = document.getElementById('floatingYouTubePlayer');
        const floatingIframe = document.getElementById('floatingYouTubeIframe');
        const floatingTitle = document.getElementById('floatingPlayerTitle');
        
        if (!floatingPlayer || !floatingIframe) {
            console.error('❌ Floating player elements not found');
            return;
        }

        // Използваме запазената информация за видеото
        const videoInfo = this.currentYouTubeVideo || {
            embedUrl: embedUrl,
            title: 'YouTube Video'
        };

        console.log('🎬 Creating/updating floating player:', videoInfo);

        // Ако floating player-ът вече е видим, само обновяваме видеото
        const isAlreadyVisible = floatingPlayer.style.display !== 'none' && 
                                  floatingPlayer.style.display !== '';
        
        if (isAlreadyVisible) {
            console.log('🔄 Updating existing floating player');
            // Спираме старото видео преди да пускаме новото
            floatingIframe.src = '';
            // Малко забавяне за да се спре старото видео
            setTimeout(() => {
                floatingIframe.src = videoInfo.embedUrl;
                if (floatingTitle) {
                    floatingTitle.textContent = videoInfo.title;
                }
                console.log('✅ Floating player updated with new video');
            }, 100);
        } else {
            console.log('🆕 Creating new floating player');
            // Задаваме iframe src
            floatingIframe.src = videoInfo.embedUrl;
            
            // Задаваме заглавието
            if (floatingTitle) {
                floatingTitle.textContent = videoInfo.title;
            }

            // Възстановяваме позицията по подразбиране само ако не е бил преместен
            const hasCustomPosition = floatingPlayer.style.left || floatingPlayer.style.top;
            if (!hasCustomPosition) {
                floatingPlayer.style.left = 'auto';
                floatingPlayer.style.top = 'auto';
                floatingPlayer.style.right = '20px';
                floatingPlayer.style.bottom = '20px';
            }
            floatingPlayer.classList.remove('minimized', 'dragging');

            // Показваме floating мини-плеър
            floatingPlayer.style.display = 'block';
            console.log('✅ Floating player displayed');
        }

        // Настройваме drag and drop (само ако още не е настроен)
        if (!floatingPlayer.dataset.dragSetup) {
            this.setupFloatingPlayerDrag(floatingPlayer);
            floatingPlayer.dataset.dragSetup = 'true';
        }

        // Настройваме контролите (само ако още не са настроени)
        if (!floatingPlayer.dataset.controlsSetup) {
            this.setupFloatingPlayerControls(floatingPlayer);
            floatingPlayer.dataset.controlsSetup = 'true';
        }
    }

    setupFloatingPlayerDrag(player) {
        const header = player.querySelector('.floating-player-header');
        if (!header) return;

        header.addEventListener('mousedown', (e) => {
            // Не позволяваме drag на бутоните
            if (e.target.closest('.floating-player-btn')) {
                return;
            }

            this.isDragging = true;
            player.classList.add('dragging');

            const rect = player.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;

            const maxX = window.innerWidth - player.offsetWidth;
            const maxY = window.innerHeight - player.offsetHeight;

            let newX = e.clientX - this.dragOffset.x;
            let newY = e.clientY - this.dragOffset.y;

            // Ограничаваме позицията в границите на екрана
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            player.style.left = `${newX}px`;
            player.style.top = `${newY}px`;
            player.style.right = 'auto';
            player.style.bottom = 'auto';
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                player.classList.remove('dragging');
            }
        });

        // Touch events за mobile
        header.addEventListener('touchstart', (e) => {
            if (e.target.closest('.floating-player-btn')) {
                return;
            }

            this.isDragging = true;
            player.classList.add('dragging');

            const touch = e.touches[0];
            const rect = player.getBoundingClientRect();
            this.dragOffset.x = touch.clientX - rect.left;
            this.dragOffset.y = touch.clientY - rect.top;

            e.preventDefault();
        });

        document.addEventListener('touchmove', (e) => {
            if (!this.isDragging) return;

            const touch = e.touches[0];
            const maxX = window.innerWidth - player.offsetWidth;
            const maxY = window.innerHeight - player.offsetHeight;

            let newX = touch.clientX - this.dragOffset.x;
            let newY = touch.clientY - this.dragOffset.y;

            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            player.style.left = `${newX}px`;
            player.style.top = `${newY}px`;
            player.style.right = 'auto';
            player.style.bottom = 'auto';

            e.preventDefault();
        });

        document.addEventListener('touchend', () => {
            if (this.isDragging) {
                this.isDragging = false;
                player.classList.remove('dragging');
            }
        });
    }

    setupFloatingPlayerControls(player) {
        const minimizeBtn = document.getElementById('floatingPlayerMinimize');
        const closeBtn = document.getElementById('floatingPlayerClose');

        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                player.classList.toggle('minimized');
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeFloatingPlayer();
            });
        }
    }

    closeFloatingPlayer() {
        const floatingPlayer = document.getElementById('floatingYouTubePlayer');
        const floatingIframe = document.getElementById('floatingYouTubeIframe');
        
        // Спираме интервала за проследяване
        if (this.videoTimeInterval) {
            clearInterval(this.videoTimeInterval);
            this.videoTimeInterval = null;
        }

        // Спираме YouTube player инстанцията
        if (this.youtubePlayer && typeof this.youtubePlayer.destroy === 'function') {
            try {
                this.youtubePlayer.destroy();
                this.youtubePlayer = null;
            } catch (error) {
                console.warn('⚠️ Error destroying YouTube player:', error);
            }
        }
        
        if (floatingPlayer) {
            floatingPlayer.style.display = 'none';
        }

        if (floatingIframe) {
            // Спираме видеото като премахваме src
            floatingIframe.src = '';
            // Премахваме iframe-а от DOM
            floatingIframe.remove();
        }

        // Нулираме currentYouTubeVideo само ако модалът не е отворен
        if (!this.isVisible) {
            this.currentYouTubeVideo = null;
        }
        this.isDragging = false;
        this.videoCurrentTime = 0;
        this.pendingSeekTime = null;
        this.activePlayerType = 'modal';

        // Възстановяваме позицията по подразбиране
        if (floatingPlayer) {
            floatingPlayer.style.left = 'auto';
            floatingPlayer.style.top = 'auto';
            floatingPlayer.style.right = '20px';
            floatingPlayer.style.bottom = '20px';
            floatingPlayer.classList.remove('minimized', 'dragging');
        }
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

