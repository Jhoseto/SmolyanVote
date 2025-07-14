class PostInteractions {
    constructor() {
        this.likedPosts = new Set();
        this.dislikedPosts = new Set();
        this.bookmarkedPosts = new Set();
        this.followedAuthors = new Set();
        this.pendingRequests = new Map();
        this.notificationPermission = false;
        this.eventSource = null;
        this.selectedEmotion = null;
        this.selectedEmotionText = '';
        this.isFormExpanded = false;
        this.currentLinkData = null;

        this.init();
    }

    init() {
        this.loadUserPreferences();
        this.setupEventListeners();
        this.setupCreatePostForm();
        this.requestNotificationPermission();
    }

    // ПЪЛЕН setupCreatePostForm() метод с добавена link функционалност
// Заместваш този метод в postInteractions.js класа

    setupCreatePostForm() {
        // Text area auto-resize and validation
        const postContent = document.getElementById('postContent');
        if (postContent) {
            postContent.addEventListener('input', (e) => {
                // Auto resize
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';

                // Validate form
                this.validateForm();
            });
        }

        // Image button
        const imageBtn = document.getElementById('imageBtn');
        const imageInput = document.getElementById('postImage');

        if (imageBtn && imageInput) {
            imageBtn.addEventListener('click', () => imageInput.click());
            imageInput.addEventListener('change', (e) => {
                if (e.target.files[0]) {
                    this.handleImageUpload(e.target.files[0]);
                }
            });
        }

        // NEW: Link button functionality
        const linkBtn = document.getElementById('linkBtn');
        const linkInputSection = document.getElementById('linkInputSection');
        const linkInput = document.getElementById('postLink');

        if (linkBtn && linkInputSection && linkInput) {
            // Toggle link input section
            linkBtn.addEventListener('click', () => {
                const isVisible = linkInputSection.style.display !== 'none';
                if (isVisible) {
                    this.hideLinkInput();
                } else {
                    this.showLinkInput();
                }
            });

            // Handle link input changes
            linkInput.addEventListener('input', (e) => {
                this.handleLinkInput(e.target.value);
            });

            // Handle link input paste
            linkInput.addEventListener('paste', (e) => {
                setTimeout(() => {
                    this.handleLinkInput(e.target.value);
                }, 100);
            });
        }

        // Emotion button
        const emotionBtn = document.getElementById('emotionBtn');
        if (emotionBtn) {
            emotionBtn.addEventListener('click', () => this.toggleEmotionPicker());
        }

        // Emotion picker events
        document.querySelectorAll('.emotion-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectEmotion(item.dataset.emotion, item.dataset.text);
            });
        });

        // Category validation
        const categorySelect = document.getElementById('postCategory');
        if (categorySelect) {
            categorySelect.addEventListener('change', () => this.validateForm());
        }

        // Submit button
        const submitBtn = document.getElementById('submitPost');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.createPost());
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancelPost');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.collapseCreateForm());
        }

        // Close emotion picker when clicking outside
        document.addEventListener('click', (e) => {
            const emotionPicker = document.getElementById('emotionPicker');
            const emotionBtn = document.getElementById('emotionBtn');

            if (emotionPicker && emotionPicker.style.display === 'block' &&
                !emotionPicker.contains(e.target) && !emotionBtn.contains(e.target)) {
                emotionPicker.style.display = 'none';
            }
        });
    }

    expandCreateForm() {
        if (!window.isAuthenticated) {
            this.showLoginPrompt();
            return;
        }

        const expanded = document.getElementById('createPostExpanded');
        const collapsed = document.getElementById('collapsedActions');

        expanded.style.display = 'block';
        collapsed.style.display = 'none';

        // Focus on textarea
        setTimeout(() => {
            const textarea = document.getElementById('postContent');
            if (textarea) textarea.focus();
        }, 100);

        this.isFormExpanded = true;
    }

    collapseCreateForm() {
        const expanded = document.getElementById('createPostExpanded');
        const collapsed = document.getElementById('collapsedActions');

        expanded.style.display = 'none';
        collapsed.style.display = 'flex';

        this.resetForm();
        this.isFormExpanded = false;
    }

    resetForm() {
        // Reset text
        const postContent = document.getElementById('postContent');
        if (postContent) {
            postContent.value = '';
            postContent.style.height = 'auto';
        }

        // Reset category
        const categorySelect = document.getElementById('postCategory');
        if (categorySelect) categorySelect.value = '';

        // Reset image
        this.removeImage();

        // Reset emotion
        this.removeEmotion();

        // Hide emotion picker
        const emotionPicker = document.getElementById('emotionPicker');
        if (emotionPicker) emotionPicker.style.display = 'none';

        // Reset validation
        this.validateForm();
    }

    handleImageUpload(file) {
        if (file.size > 10 * 1024 * 1024) {
            this.showError('Снимката не може да надвишава 10MB.');
            return;
        }

        if (!file.type.startsWith('image/')) {
            this.showError('Моля, изберете снимка.');
            return;
        }

        const previewSection = document.getElementById('imagePreviewSection');
        const previewContainer = document.getElementById('imagePreviewContainer');

        const reader = new FileReader();
        reader.onload = (e) => {
            previewContainer.innerHTML = `
                <img class="image-preview" src="${e.target.result}" alt="Preview">
                <button class="remove-image-btn" onclick="postInteractions.removeImage()">
                    <i class="bi bi-x"></i>
                </button>
            `;
            previewSection.style.display = 'block';
        };
        reader.readAsDataURL(file);

        this.validateForm();
    }

    removeImage() {
        const previewSection = document.getElementById('imagePreviewSection');
        const previewContainer = document.getElementById('imagePreviewContainer');
        const imageInput = document.getElementById('postImage');

        if (previewSection) previewSection.style.display = 'none';
        if (previewContainer) previewContainer.innerHTML = '';
        if (imageInput) imageInput.value = '';

        this.validateForm();
    }

    toggleEmotionPicker() {
        const picker = document.getElementById('emotionPicker');
        const isVisible = picker.style.display === 'block';
        picker.style.display = isVisible ? 'none' : 'block';
    }

    selectEmotion(emotion, text) {
        this.selectedEmotion = emotion;
        this.selectedEmotionText = text;

        const selectedSection = document.getElementById('selectedEmotion');
        selectedSection.innerHTML = `
            <span class="emotion-icon">${emotion}</span>
            <span>се чувства <strong>${text}</strong></span>
            <button class="remove-selected-emotion" onclick="postInteractions.removeEmotion()">
                <i class="bi bi-x"></i>
            </button>
        `;
        selectedSection.style.display = 'flex';

        // Hide picker
        document.getElementById('emotionPicker').style.display = 'none';

        this.validateForm();
    }

    removeEmotion() {
        this.selectedEmotion = null;
        this.selectedEmotionText = '';

        const selectedSection = document.getElementById('selectedEmotion');
        selectedSection.style.display = 'none';
        selectedSection.innerHTML = '';

        this.validateForm();
    }

    validateForm() {
        const content = document.getElementById('postContent')?.value.trim() || '';
        const category = document.getElementById('postCategory')?.value || '';
        const hasImage = document.getElementById('postImage')?.files.length > 0;
        const submitBtn = document.getElementById('submitPost');

        const isValid = content.length >= 1 && category;
        if (submitBtn) {
            submitBtn.disabled = !isValid;
        }

        return isValid;
    }

    async createPost() {
        if (!window.isAuthenticated) {
            this.showLoginPrompt();
            return;
        }

        if (!this.validateForm()) {
            this.showError('Моля, попълнете съдържание и изберете категория.');
            return;
        }

        const content = document.getElementById('postContent').value.trim();
        const category = document.getElementById('postCategory').value;
        const imageInput = document.getElementById('postImage');
        const submitBtn = document.getElementById('submitPost');

        // Show loading animation
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
        <div class="spinner-border spinner-border-sm" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        Публикуване...
    `;

        // Add loading overlay to form
        const formContainer = document.getElementById('createPostExpanded');
        if (formContainer) {
            formContainer.style.opacity = '0.7';
            formContainer.style.pointerEvents = 'none';
        }

        try {
            let imageUrl = null;

            // Upload image with progress
            if (imageInput.files.length > 0) {
                submitBtn.innerHTML = `
                <div class="spinner-border spinner-border-sm" role="status"></div>
                Качване на снимка...
            `;

                const response = await window.publicationsAPI.uploadImage(imageInput.files[0]);
                imageUrl = response.url;
            }

            submitBtn.innerHTML = `
            <div class="spinner-border spinner-border-sm" role="status"></div>
            Запазване...
        `;

            const publicationData = {
                title: content.substring(0, 100) || 'Публикация',
                content: content,
                excerpt: content.substring(0, 200),
                category: category.toUpperCase(),
                emotion: this.selectedEmotion,
                emotionText: this.selectedEmotionText,
                imageUrl: imageUrl,
                status: 'PUBLISHED'
            };

            const response = await window.publicationsAPI.createPublication(publicationData);

            if (response && response.id) {
                // Get full publication data from server response
                const fullPublicationData = {
                    id: response.id,
                    title: response.title || publicationData.title,
                    content: response.content || publicationData.content,
                    excerpt: response.excerpt || publicationData.excerpt,
                    category: response.category || publicationData.category,
                    emotion: response.emotion || publicationData.emotion,
                    emotionText: response.emotionText || publicationData.emotionText,
                    imageUrl: response.imageUrl || publicationData.imageUrl,
                    status: response.status || publicationData.status,
                    created: response.created || new Date().toISOString(),
                    likesCount: response.likesCount || 0,
                    dislikesCount: response.dislikesCount || 0,
                    commentsCount: response.commentsCount || 0,
                    sharesCount: response.sharesCount || 0,
                    // Използвай целия author от response
                    author: response.author || {
                        id: window.currentUserId,
                        username: window.currentUser?.username || 'Неизвестен',
                        imageUrl: window.currentUser?.imageUrl || '/images/default-avatar.png',
                        onlineStatus: 1
                    }
                };

                // Success animation
                submitBtn.innerHTML = `
                <i class="bi bi-check-circle"></i>
                Публикувано!
            `;
                submitBtn.style.background = '#28a745';

                setTimeout(() => {
                    if (window.publicationsManager) {
                        window.publicationsManager.addPost(fullPublicationData);
                    }

                    this.showToast('Публикацията е създадена успешно!', 'success');
                    this.collapseCreateForm();
                    this.trackInteraction('create_post', response.id);

                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 1000);
            }

        } catch (error) {
            console.error('Error creating post:', error);

            // ЗАЩИТА: Специална обработка за rate limiting (429 status)
            if (error.status === 429) {
                this.showError('Можете да публикувате само една публикация на минута. Моля, изчакайте.');
            } else {
                this.showError('Засечен е СПАМ или съдържание от грозен характер !');
            }
        } finally {
            // Reset form state
            setTimeout(() => {
                if (formContainer) {
                    formContainer.style.opacity = '1';
                    formContainer.style.pointerEvents = 'auto';
                }

                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Публикувай';
                submitBtn.style.background = '';
            }, this.isFormExpanded ? 0 : 1500);
        }
    }

    // ПРОМЕНЕН МЕТОД - с добавка за обновяване на UI
    async loadUserPreferences() {
        if (!window.isAuthenticated) return;
        try {
            const response = await window.publicationsAPI.getUserPreferences();
            this.likedPosts = new Set(response.likedPosts || []);
            this.dislikedPosts = new Set(response.dislikedPosts || []);
            this.bookmarkedPosts = new Set(response.bookmarkedPosts || []);
            this.followedAuthors = new Set(response.followedAuthors || []);

            // НОВА ПРОМЯНА: Обновяваме UI след зареждане на данните
            this.updateAllPostsUI();

        } catch (error) {
            console.error('Error loading user preferences:', error);
        }
    }

    // НОВИ МЕТОДИ за обновяване на UI:

    /**
     * Обновява UI на всички постове след зареждане на предпочитанията
     */
    updateAllPostsUI() {
        document.querySelectorAll('[data-post-id]').forEach(postElement => {
            const postId = parseInt(postElement.dataset.postId);
            this.updateSinglePostUI(postElement, postId);
        });
    }

    /**
     * Обновява UI на един конкретен пост
     */
    updateSinglePostUI(postElement, postId) {
        const isLiked = this.isPostLiked(postId);
        const isDisliked = this.isPostDisliked(postId);
        const isBookmarked = this.isPostBookmarked(postId);

        // Обновяваме like бутона
        const likeBtn = postElement.querySelector('.like-btn');
        const likeIcon = likeBtn?.querySelector('i');
        if (likeBtn && likeIcon) {
            if (isLiked) {
                likeBtn.classList.add('liked');
                likeIcon.className = 'bi bi-hand-thumbs-up-fill';
            } else {
                likeBtn.classList.remove('liked');
                likeIcon.className = 'bi bi-hand-thumbs-up';
            }
        }

        // Обновяваме dislike бутона
        const dislikeBtn = postElement.querySelector('.dislike-btn');
        const dislikeIcon = dislikeBtn?.querySelector('i');
        if (dislikeBtn && dislikeIcon) {
            if (isDisliked) {
                dislikeBtn.classList.add('disliked');
                dislikeIcon.className = 'bi bi-hand-thumbs-down-fill';
            } else {
                dislikeBtn.classList.remove('disliked');
                dislikeIcon.className = 'bi bi-hand-thumbs-down';
            }
        }

        // Обновяваме bookmark бутона (ако съществува)
        const bookmarkBtn = postElement.querySelector('.bookmark-btn');
        if (bookmarkBtn) {
            const bookmarkIcon = bookmarkBtn.querySelector('i');
            if (isBookmarked) {
                bookmarkBtn.classList.add('bookmarked');
                if (bookmarkIcon) bookmarkIcon.className = 'bi bi-bookmark-fill';
            } else {
                bookmarkBtn.classList.remove('bookmarked');
                if (bookmarkIcon) bookmarkIcon.className = 'bi bi-bookmark';
            }
        }
    }

    setupEventListeners() {
        // Handle post menu toggles
        document.addEventListener('click', (e) => {
            if (e.target.closest('.post-menu')) {
                e.stopPropagation();
                this.handlePostMenuClick(e.target.closest('.post-menu'));
            }
        });

        // Close menus when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.post-menu-dropdown').forEach(menu => {
                menu.style.display = 'none';
            });
        });
    }

    handlePostMenuClick(menuElement) {
        const dropdown = menuElement.querySelector('.post-menu-dropdown');
        const isVisible = dropdown.style.display === 'block';

        document.querySelectorAll('.post-menu-dropdown').forEach(menu => {
            menu.style.display = 'none';
        });

        dropdown.style.display = isVisible ? 'none' : 'block';
    }

    // ====== LIKES/DISLIKES FUNCTIONALITY ======

    async toggleLike(postId) {
        if (!window.isAuthenticated) {
            this.showLoginPrompt();
            return;
        }

        const requestKey = `like-${postId}`;
        if (this.pendingRequests.has(requestKey)) return;

        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (!postElement) return;

        const isCurrentlyLiked = this.likedPosts.has(postId);
        const isCurrentlyDisliked = this.dislikedPosts.has(postId);

        this.pendingRequests.set(requestKey, true);

        try {
            const response = await window.publicationsAPI.toggleLike(postId);

            // Update local state
            if (response.isLiked) {
                this.likedPosts.add(postId);
                this.dislikedPosts.delete(postId); // Remove dislike if was disliked
                this.showLikeAnimation(postElement);
                this.trackInteraction('like', postId);
            } else {
                this.likedPosts.delete(postId);
                this.trackInteraction('unlike', postId);
            }

            // Update UI
            this.updateLikeDislikeUI(postElement, response.isLiked, false, response.likesCount, response.dislikesCount);

        } catch (error) {
            console.error('Error toggling like:', error);
            this.showError('Възникна грешка при харесването.');
        } finally {
            this.pendingRequests.delete(requestKey);
        }
    }

    async toggleDislike(postId) {
        if (!window.isAuthenticated) {
            this.showLoginPrompt();
            return;
        }

        const requestKey = `dislike-${postId}`;
        if (this.pendingRequests.has(requestKey)) return;

        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (!postElement) return;

        this.pendingRequests.set(requestKey, true);

        try {
            const response = await window.publicationsAPI.toggleDislike(postId);

            // Update local state
            if (response.isDisliked) {
                this.dislikedPosts.add(postId);
                this.likedPosts.delete(postId); // Remove like if was liked
                this.trackInteraction('dislike', postId);
            } else {
                this.dislikedPosts.delete(postId);
                this.trackInteraction('undislike', postId);
            }

            // Update UI
            this.updateLikeDislikeUI(postElement, false, response.isDisliked, response.likesCount, response.dislikesCount);

        } catch (error) {
            console.error('Error toggling dislike:', error);
            this.showError('Възникна грешка при дислайкването.');
        } finally {
            this.pendingRequests.delete(requestKey);
        }
    }

    updateLikeDislikeUI(postElement, isLiked, isDisliked, likesCount, dislikesCount) {
        // Update like button
        const likeButton = postElement.querySelector('.like-btn');
        const likeIcon = likeButton?.querySelector('i');

        if (likeButton && likeIcon) {
            if (isLiked) {
                likeButton.classList.add('liked');
                likeIcon.className = 'bi bi-hand-thumbs-up-fill';
            } else {
                likeButton.classList.remove('liked');
                likeIcon.className = 'bi bi-hand-thumbs-up';
            }
        }

        // Update dislike button
        const dislikeButton = postElement.querySelector('.dislike-btn');
        const dislikeIcon = dislikeButton?.querySelector('i');

        if (dislikeButton && dislikeIcon) {
            if (isDisliked) {
                dislikeButton.classList.add('disliked');
                dislikeIcon.className = 'bi bi-hand-thumbs-down-fill';
            } else {
                dislikeButton.classList.remove('disliked');
                dislikeIcon.className = 'bi bi-hand-thumbs-down';
            }
        }

        // Update stats counts
        const likeStatsCount = postElement.querySelector('.like-stats-count');
        if (likeStatsCount) {
            likeStatsCount.textContent = likesCount || 0;
        }

        const dislikeStatsCount = postElement.querySelector('.dislike-stats-count');
        if (dislikeStatsCount) {
            dislikeStatsCount.textContent = dislikesCount || 0;
        }
    }

    showLikeAnimation(postElement) {
        const likeButton = postElement.querySelector('.like-btn');
        const rect = likeButton.getBoundingClientRect();

        const heart = document.createElement('div');
        heart.innerHTML = '💚';
        heart.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top}px;
            font-size: 20px;
            z-index: 1000;
            pointer-events: none;
            animation: likeAnimation 1s ease-out forwards;
        `;

        document.body.appendChild(heart);
        setTimeout(() => document.body.removeChild(heart), 1000);
    }

    // ====== SHARE FUNCTIONALITY ======

    async sharePublication(postId) {
        if (!window.isAuthenticated) {
            this.showLoginPrompt();
            return;
        }

        try {
            const url = `${window.location.origin}/publications/${postId}`;

            // Показваме диалог за споделяне
            this.showShareDialog(url, postId);

        } catch (error) {
            console.error('Error sharing:', error);
            this.showError('Възникна грешка при споделянето.');
        }
    }

    showShareDialog(url, postId) {
        Swal.fire({
            title: 'Споделете публикацията',
            html: `
                <div style="margin: 20px 0;">
                    <p style="margin-bottom: 15px;">Копирайте този линк за споделяне:</p>
                    <div style="position: relative;">
                        <input type="text" id="shareUrlInput" value="${url}" readonly 
                               style="width: 100%; padding: 12px 50px 12px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; background-color: #f8f9fa;"
                               onclick="this.select()">
                        <button id="copyUrlBtn" type="button" 
                                style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: #4b9f3e; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            Копирай
                        </button>
                    </div>
                    <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: center;">
                        <button type="button" class="social-share-btn" data-platform="facebook" 
                                style="background: #1877f2; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                            <i class="bi bi-facebook"></i> Facebook
                        </button>
                        <button type="button" class="social-share-btn" data-platform="twitter"
                                style="background: #1da1f2; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                            <i class="bi bi-twitter"></i> Twitter
                        </button>
                        <button type="button" class="social-share-btn" data-platform="whatsapp"
                                style="background: #25d366; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                            <i class="bi bi-whatsapp"></i> WhatsApp
                        </button>
                    </div>
                </div>
            `,
            showCancelButton: true,
            showConfirmButton: false,
            cancelButtonText: 'Затвори',
            cancelButtonColor: '#6c757d',
            width: '500px',
            didOpen: () => {
                // Copy button функционалност
                const copyBtn = document.getElementById('copyUrlBtn');
                const urlInput = document.getElementById('shareUrlInput');

                copyBtn.addEventListener('click', () => {
                    try {
                        urlInput.select();
                        urlInput.setSelectionRange(0, 99999);

                        const successful = document.execCommand('copy');
                        if (successful) {
                            copyBtn.textContent = '✓ Копирано';
                            copyBtn.style.background = '#28a745';
                            setTimeout(() => {
                                copyBtn.textContent = 'Копирай';
                                copyBtn.style.background = '#4b9f3e';
                            }, 2000);

                            // Отчитаме споделянето
                            this.recordShare(postId);
                        } else {
                            throw new Error('Copy command failed');
                        }
                    } catch (err) {
                        console.error('Copy failed:', err);
                        copyBtn.textContent = 'Ctrl+C';
                        copyBtn.style.background = '#ffc107';
                    }
                });

                // Social media buttons
                document.querySelectorAll('.social-share-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const platform = e.currentTarget.dataset.platform;
                        this.openSocialShare(platform, url, postId);
                    });
                });
            }
        });

        this.trackInteraction('share_dialog', postId);
    }

    openSocialShare(platform, url, postId) {
        const title = 'Публикация от SmolyanVote';
        let shareUrl = '';

        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
                break;
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
                break;
            default:
                return;
        }

        const popup = window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');

        if (popup) {
            this.trackInteraction(`share_${platform}`, postId);
            this.showToast(`Отварям ${platform} за споделяне...`, 'info');
            // Отчитаме споделянето
            this.recordShare(postId);
        } else {
            window.open(shareUrl, '_blank');
        }
    }

    async recordShare(postId) {
        try {
            await window.publicationsAPI.sharePublication(postId);
            this.updateShareCount(postId);
        } catch (error) {
            console.error('Error recording share:', error);
        }
    }

    updateShareCount(postId) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            const shareStatsCount = postElement.querySelector('.share-stats-count');
            if (shareStatsCount) {
                const currentCount = parseInt(shareStatsCount.textContent) || 0;
                shareStatsCount.textContent = currentCount + 1;
                shareStatsCount.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    shareStatsCount.style.transform = '';
                }, 200);
            }
        }
    }

    // ====== OTHER INTERACTIONS ======

    showToast(message, type = 'success') {
        Swal.fire({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            icon: type,
            title: message
        });
    }

    showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Грешка',
            text: message,
            confirmButtonColor: '#4b9f3e'
        });
    }

    showLoginPrompt() {
        Swal.fire({
            icon: 'info',
            title: 'Вход необходим',
            text: 'Моля, влезте в профила си.',
            confirmButtonText: 'Вход',
            showCancelButton: true,
            confirmButtonColor: '#4b9f3e'
        }).then((result) => {
            if (result.isConfirmed) {
                document.querySelector('[data-bs-target="#loginModal"]')?.click();
            }
        });
    }

    async toggleBookmark(postId) {
        if (!window.isAuthenticated) {
            this.showLoginPrompt();
            return;
        }

        try {
            const response = await window.publicationsAPI.toggleBookmark(postId);

            if (response.isBookmarked) {
                this.bookmarkedPosts.add(postId);
                this.showToast('Публикацията е добавена в любими', 'success');
                this.trackInteraction('bookmark', postId);
            } else {
                this.bookmarkedPosts.delete(postId);
                this.showToast('Публикацията е премахната от любими', 'info');
                this.trackInteraction('unbookmark', postId);
            }

            this.updateBookmarkUI(postId, response.isBookmarked);
        } catch (error) {
            console.error('Error toggling bookmark:', error);
            this.showError('Възникна грешка при добавянето в любими.');
        }
    }

    updateBookmarkUI(postId, isBookmarked) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (!postElement) return;

        const bookmarkButton = postElement.querySelector('.bookmark-btn');
        if (bookmarkButton) {
            const icon = bookmarkButton.querySelector('i');
            if (isBookmarked) {
                icon.className = 'bi bi-bookmark-fill';
                bookmarkButton.classList.add('bookmarked');
            } else {
                icon.className = 'bi bi-bookmark';
                bookmarkButton.classList.remove('bookmarked');
            }
        }
    }

    async followAuthor(authorId) {
        if (!window.isAuthenticated) {
            this.showLoginPrompt();
            return;
        }

        if (authorId == window.currentUserId) {
            this.showToast('Не можете да следвате себе си', 'warning');
            return;
        }

        try {
            const response = await window.publicationsAPI.toggleFollowAuthor(authorId);

            if (response.isFollowing) {
                this.followedAuthors.add(authorId);
                this.showToast('Сега следвате този автор', 'success');
                this.trackInteraction('follow', authorId);
            } else {
                this.followedAuthors.delete(authorId);
                this.showToast('Вече не следвате този автор', 'info');
                this.trackInteraction('unfollow', authorId);
            }

            this.updateFollowUI(authorId, response.isFollowing);
        } catch (error) {
            console.error('Error following author:', error);
            this.showError('Възникна грешка при следването на автора.');
        }
    }

    updateFollowUI(authorId, isFollowing) {
        const followButtons = document.querySelectorAll(`[data-author-id="${authorId}"] .follow-btn`);

        followButtons.forEach(button => {
            const icon = button.querySelector('i');
            if (isFollowing) {
                icon.className = 'bi bi-person-check-fill';
                button.classList.add('following');
                button.title = 'Не следвай';
            } else {
                icon.className = 'bi bi-person-plus';
                button.classList.remove('following');
                button.title = 'Следвай';
            }
        });
    }

    async reportPost(postId, reason) {
        if (!window.isAuthenticated) {
            this.showLoginPrompt();
            return;
        }

        try {
            await window.publicationsAPI.reportPublication(postId, reason);

            Swal.fire({
                icon: 'success',
                title: 'Докладът е изпратен',
                text: 'Благодарим за докладването. Ще прегледаме публикацията.',
                confirmButtonColor: '#4b9f3e',
                timer: 3000
            });

            this.trackInteraction('report', postId);
        } catch (error) {
            console.error('Error reporting post:', error);
            this.showError('Възникна грешка при докладването.');
        }
    }

    showReportModal(postId) {
        Swal.fire({
            title: 'Докладвай публикация',
            text: 'Защо докладвате тази публикация?',
            input: 'select',
            inputOptions: {
                'spam': 'Спам',
                'harassment': 'Тормоз или заплахи',
                'hate_speech': 'Език на омразата',
                'misinformation': 'Дезинформация',
                'inappropriate': 'Неподходящо съдържание',
                'copyright': 'Нарушение на авторски права',
                'other': 'Друго'
            },
            inputPlaceholder: 'Изберете причина',
            showCancelButton: true,
            confirmButtonText: 'Докладвай',
            cancelButtonText: 'Отказ',
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#6c757d',
            inputValidator: (value) => {
                if (!value) {
                    return 'Моля, изберете причина!';
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.reportPost(postId, result.value);
            }
        });
    }

    async deletePost(postId) {
        try {
            const result = await Swal.fire({
                title: 'Сигурни ли сте?',
                text: 'Тази публикация ще бъде изтрита завинаги!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#e74c3c',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Да, изтрий',
                cancelButtonText: 'Отказ',
                reverseButtons: true
            });

            if (!result.isConfirmed) return;

            await window.publicationsAPI.deletePublication(postId);

            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            if (postElement) {
                postElement.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => {
                    if (postElement.parentNode) {
                        postElement.parentNode.removeChild(postElement);
                    }
                }, 300);
            }

            this.showToast('Публикацията е изтрита успешно', 'success');
            this.trackInteraction('delete', postId);

            if (window.publicationsManager) {
                window.publicationsManager.removePost(postId);
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            this.showError('Възникна грешка при изтриването.');
        }
    }

    updateLikeCount(postId, count) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            const likeCount = postElement.querySelector('.like-count');
            if (likeCount) {
                likeCount.textContent = count;
                likeCount.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    likeCount.style.transform = '';
                }, 200);
            }
        }
    }

    showLinkInput() {
        const linkInputSection = document.getElementById('linkInputSection');
        const linkInput = document.getElementById('postLink');

        linkInputSection.style.display = 'block';
        setTimeout(() => {
            linkInput.focus();
        }, 100);
    }

    hideLinkInput() {
        const linkInputSection = document.getElementById('linkInputSection');
        const linkInput = document.getElementById('postLink');
        const linkPreviewContainer = document.getElementById('linkPreviewContainer');

        linkInputSection.style.display = 'none';
        linkInput.value = '';
        linkPreviewContainer.style.display = 'none';

        // Clear any stored link data
        this.currentLinkData = null;
    }

    handleLinkInput(url) {
        const trimmedUrl = url.trim();

        if (!trimmedUrl) {
            this.hideLinkPreview();
            return;
        }

        // Basic URL validation
        if (this.isValidURL(trimmedUrl)) {
            this.processLink(trimmedUrl);
        } else {
            this.hideLinkPreview();
        }
    }

    isValidURL(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }

    hideLinkPreview() {
        const linkPreviewContainer = document.getElementById('linkPreviewContainer');
        linkPreviewContainer.style.display = 'none';
        this.currentLinkData = null;
    }

    processLink(url) {
        // Show loading state
        this.showLinkLoading();

        // Determine link type and generate appropriate preview
        const linkType = this.determineLinkType(url);

        setTimeout(() => {
            if (linkType === 'youtube') {
                this.generateYouTubePreview(url);
            } else if (linkType === 'image') {
                this.generateImagePreview(url);
            } else {
                this.generateWebsitePreview(url);
            }
        }, 1000); // Simulate API delay
    }

    showLinkLoading() {
        const linkPreviewContainer = document.getElementById('linkPreviewContainer');
        const linkPreview = document.getElementById('linkPreview');

        linkPreview.innerHTML = `
        <div class="link-loading" style="padding: 12px; text-align: center;">
            <div class="spinner-border spinner-border-sm" role="status"></div>
            <span style="margin-left: 8px; color: #65676b; font-size: 14px;">Зареждане на информация...</span>
        </div>
    `;

        linkPreviewContainer.style.display = 'block';
    }

    showLinkPreview(linkData) {
        const linkPreviewContainer = document.getElementById('linkPreviewContainer');
        const linkPreview = document.getElementById('linkPreview');

        // Store link data for later use
        this.currentLinkData = linkData;

        // Generate preview HTML based on link type
        let previewHTML = '';

        if (linkData.type === 'youtube') {
            previewHTML = `
            <div class="youtube-preview">
                <div class="preview-thumbnail" style="background-image: url('${linkData.thumbnail}')">
                    <div class="play-button">
                        <i class="bi bi-play-fill"></i>
                    </div>
                </div>
                <div class="preview-content">
                    <div class="preview-title">${linkData.title}</div>
                    <div class="preview-description">${linkData.description}</div>
                    <div class="preview-source">
                        <i class="bi bi-youtube" style="color: #ff0000;"></i>
                        YouTube
                    </div>
                </div>
            </div>
        `;
        } else if (linkData.type === 'image') {
            previewHTML = `
            <div class="image-preview">
                <img src="${linkData.imageUrl}" 
                     alt="${linkData.title}" 
                     style="max-width: 100%; max-height: 300px; border-radius: 6px; display: block; margin: 8px auto;"
                     onload="this.style.opacity='1'" 
                     onerror="this.parentElement.innerHTML='<div style=\\'padding: 20px; text-align: center; color: #65676b; font-size: 14px;\\'>❌ Неуспешно зареждане на изображението</div>'">
                <div style="padding: 8px 12px; font-size: 12px; color: #65676b; text-align: center;">
                    ${linkData.url}
                </div>
            </div>
        `;
        } else if (linkData.type === 'website') {
            previewHTML = `
            <div class="website-preview" style="display: flex; gap: 12px; padding: 12px; align-items: center;">
                <div style="width: 48px; height: 48px; background: #f0f2f5; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <img src="${linkData.favicon}" 
                         alt="favicon" 
                         style="width: 24px; height: 24px;"
                         onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'bi bi-globe\\' style=\\'color: #65676b; font-size: 20px;\\'></i>'">
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 14px; font-weight: 600; color: #1c1e21; margin-bottom: 2px; word-break: break-word;">
                        ${linkData.title}
                    </div>
                    <div style="font-size: 12px; color: #65676b; margin-bottom: 2px;">
                        ${linkData.description}
                    </div>
                    <div style="font-size: 11px; color: #65676b; text-transform: uppercase;">
                        ${linkData.domain}
                    </div>
                </div>
            </div>
        `;
        } else if (linkData.type === 'loading') {
            previewHTML = `
            <div class="website-preview" style="display: flex; gap: 12px; padding: 12px; align-items: center;">
                <div style="width: 48px; height: 48px; background: #f0f2f5; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                    <div class="spinner-border spinner-border-sm" role="status"></div>
                </div>
                <div style="flex: 1;">
                    <div style="font-size: 14px; font-weight: 600; color: #1c1e21; margin-bottom: 2px;">
                        ${linkData.title}
                    </div>
                    <div style="font-size: 12px; color: #65676b;">
                        ${linkData.description}
                    </div>
                </div>
            </div>
        `;
        }

        linkPreview.innerHTML = previewHTML;
        linkPreviewContainer.style.display = 'block';
    }

    determineLinkType(url) {
        const urlLower = url.toLowerCase();

        // YouTube detection
        if (urlLower.includes('youtube.com/watch') ||
            urlLower.includes('youtu.be/') ||
            urlLower.includes('youtube.com/embed')) {
            return 'youtube';
        }

        // Image detection
        if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/)) {
            return 'image';
        }

        // Default to website
        return 'website';
    }

    generateYouTubePreview(url) {
        const videoId = this.extractYouTubeVideoId(url);

        if (!videoId) {
            this.generateWebsitePreview(url);
            return;
        }

        const previewData = {
            type: 'youtube',
            url: url,
            videoId: videoId,
            title: 'YouTube Video',
            description: 'Натиснете за възпроизвеждане',
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            embedUrl: `https://www.youtube.com/embed/${videoId}`
        };

        this.showLinkPreview(previewData);
    }

    extractYouTubeVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /youtube\.com\/watch\?.*v=([^&\n?#]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }

        return null;
    }

    generateImagePreview(url) {
        // Проверяваме дали URL-ът наистина е за снимка
        const img = new Image();

        img.onload = () => {
            const previewData = {
                type: 'image',
                url: url,
                title: 'Изображение',
                imageUrl: url
            };
            this.showLinkPreview(previewData);
        };

        img.onerror = () => {
            // Ако не е валидна снимка, покажи като website
            this.generateWebsitePreview(url);
        };

        img.src = url;
    }

    generateWebsitePreview(url) {
        const domain = this.extractDomain(url);

        const previewData = {
            type: 'website',
            url: url,
            title: domain,
            description: `Линк към ${domain}`,
            domain: domain,
            favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
        };

        this.showLinkPreview(previewData);
    }

    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch {
            return 'Уебсайт';
        }
    }

    updateCommentCount(postId, count) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            const commentStatsCount = postElement.querySelector('.comment-stats-count');
            if (commentStatsCount) {
                commentStatsCount.textContent = count;
                commentStatsCount.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    commentStatsCount.style.transform = '';
                }, 200);
            }
        }
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            document.addEventListener('click', () => {
                Notification.requestPermission().then(permission => {
                    this.notificationPermission = permission === 'granted';
                    if (this.notificationPermission) {
                        this.showToast('Нотификациите са разрешени', 'success');
                    }
                });
            }, { once: true });
        } else if ('Notification' in window && Notification.permission === 'granted') {
            this.notificationPermission = true;
        }
    }

    trackInteraction(type, targetId) {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackInteraction(type, targetId);
        }
    }

    emit(eventName, data) {
        document.dispatchEvent(new CustomEvent(`publication:${eventName}`, { detail: data }));
    }

    on(eventName, callback) {
        document.addEventListener(`publication:${eventName}`, callback);
    }

    off(eventName, callback) {
        document.removeEventListener(`publication:${eventName}`, callback);
    }

    destroy() {
        if (this.eventSource) {
            this.eventSource.close();
        }
        this.pendingRequests.clear();
    }

    // Public API methods
    isPostLiked(postId) { return this.likedPosts.has(postId); }
    isPostDisliked(postId) { return this.dislikedPosts.has(postId); }
    isPostBookmarked(postId) { return this.bookmarkedPosts.has(postId); }
    isAuthorFollowed(authorId) { return this.followedAuthors.has(authorId); }
    getLikedPosts() { return Array.from(this.likedPosts); }
    getDislikedPosts() { return Array.from(this.dislikedPosts); }
    getBookmarkedPosts() { return Array.from(this.bookmarkedPosts); }
    getFollowedAuthors() { return Array.from(this.followedAuthors); }
}

// Global functions
window.expandCreateForm = function() {
    window.postInteractions?.expandCreateForm();
};

window.showCreateForm = function() {
    window.postInteractions?.expandCreateForm();
};

window.togglePostMenu = function(element) {
    window.postInteractions?.handlePostMenuClick(element);
};

window.toggleLike = function(postId) {
    window.postInteractions?.toggleLike(postId);
};

window.toggleDislike = function(postId) {
    window.postInteractions?.toggleDislike(postId);
};

window.sharePublication = function(postId) {
    window.postInteractions?.sharePublication(postId);
};

window.toggleBookmark = function(postId) {
    window.postInteractions?.toggleBookmark(postId);
};

window.followAuthor = function(authorId) {
    window.postInteractions?.followAuthor(authorId);
};

window.showReportModal = function(postId) {
    window.postInteractions?.showReportModal(postId);
};

window.confirmDelete = function(postId) {
    window.postInteractions?.deletePost(postId);
};

window.showLikesModal = function(postId) {
    // Future implementation
    console.log('Show likes modal for post:', postId);
};

// CSS Animations
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    @keyframes likeAnimation {
        0% {
            transform: translateY(0) scale(1);
            opacity: 1;
        }
        50% {
            transform: translateY(-20px) scale(1.2);
            opacity: 0.8;
        }
        100% {
            transform: translateY(-40px) scale(0.8);
            opacity: 0;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-20px);
        }
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    .like-btn, .dislike-btn {
        transition: all 0.2s ease;
    }
    
    .like-btn:active, .dislike-btn:active {
        transform: scale(0.95);
    }
    
    .like-btn.liked {
        color: #4cb15c !important;
        animation: pulse 0.3s ease;
    }
    
    .dislike-btn.disliked {
        color: #e74c3c !important;
        animation: pulse 0.3s ease;
    }
    
    .bookmark-btn.bookmarked {
        color: #ffc107 !important;
        animation: pulse 0.3s ease;
    }
    
    .follow-btn {
        transition: all 0.2s ease;
    }
    
    .follow-btn.following {
        background: #28a745 !important;
    }
    
    .follow-btn.following:hover {
        background: #218838 !important;
    }
    
    .like-count, .dislike-count {
        transition: transform 0.2s ease;
    }
    
    .like-count:hover, .dislike-count:hover {
        transform: scale(1.05);
    }
    
    .post-menu-dropdown {
        animation: fadeInDown 0.2s ease;
    }
    
    @keyframes fadeInDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(animationStyles);


// Initialize
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.postInteractions = new PostInteractions();
    } catch (error) {
        console.error('Failed to initialize PostInteractions:', error);
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.postInteractions) {
        window.postInteractions.destroy();
    }
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PostInteractions;
}