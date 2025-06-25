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

        this.init();
    }

    init() {
        this.loadUserPreferences();
        this.setupEventListeners();
        this.setupCreatePostForm();
        this.requestNotificationPermission();
    }

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

        const isValid = (content.length > 0 || hasImage) && category;

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
                    createdAt: response.createdAt || new Date().toISOString(),
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

    async loadUserPreferences() {
        if (!window.isAuthenticated) return;
        try {
            const response = await window.publicationsAPI.getUserPreferences();
            this.likedPosts = new Set(response.likedPosts || []);
            this.dislikedPosts = new Set(response.dislikedPosts || []);
            this.bookmarkedPosts = new Set(response.bookmarkedPosts || []);
            this.followedAuthors = new Set(response.followedAuthors || []);
        } catch (error) {
            console.error('Error loading user preferences:', error);
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

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isFormExpanded) {
                this.collapseCreateForm();
            }
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
        const likeCountElement = postElement.querySelector('.like-count');

        if (likeButton && likeIcon) {
            if (isLiked) {
                likeButton.classList.add('liked');
                likeIcon.className = 'bi bi-hand-thumbs-up-fill';
            } else {
                likeButton.classList.remove('liked');
                likeIcon.className = 'bi bi-hand-thumbs-up';
            }
        }

        if (likeCountElement) {
            likeCountElement.textContent = likesCount;
        }

        // Update dislike button
        const dislikeButton = postElement.querySelector('.dislike-btn');
        const dislikeIcon = dislikeButton?.querySelector('i');
        const dislikeCountElement = postElement.querySelector('.dislike-count');

        if (dislikeButton && dislikeIcon) {
            if (isDisliked) {
                dislikeButton.classList.add('disliked');
                dislikeIcon.className = 'bi bi-hand-thumbs-down-fill';
            } else {
                dislikeButton.classList.remove('disliked');
                dislikeIcon.className = 'bi bi-hand-thumbs-down';
            }
        }

        if (dislikeCountElement) {
            dislikeCountElement.textContent = dislikesCount;
        }
    }

    showLikeAnimation(postElement) {
        const likeButton = postElement.querySelector('.like-btn');
        const rect = likeButton.getBoundingClientRect();

        const heart = document.createElement('div');
        heart.innerHTML = '❤️';
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

    // ====== OTHER INTERACTIONS ======

    async sharePublication(postId) {
        try {
            const url = `${window.location.origin}/publications/${postId}`;

            if (navigator.share) {
                await navigator.share({
                    title: 'Публикация от SmolyanVote',
                    url: url
                });
                this.trackInteraction('share_native', postId);
            } else {
                await navigator.clipboard.writeText(url);
                this.showToast('Линкът е копиран!', 'success');
                this.trackInteraction('share_clipboard', postId);
            }

            await window.publicationsAPI.sharePublication(postId);
            this.updateShareCount(postId);
        } catch (error) {
            console.error('Error sharing:', error);
        }
    }

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

    updateShareCount(postId) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            const statsRight = postElement.querySelector('.stats-right span');
            if (statsRight) {
                const currentText = statsRight.textContent;
                const matches = currentText.match(/(\d+)\s+споделяния/);
                if (matches) {
                    const newCount = parseInt(matches[1]) + 1;
                    statsRight.textContent = currentText.replace(/\d+(\s+споделяния)/, `${newCount}$1`);
                }
            }
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

    updateCommentCount(postId, count) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            const statsRight = postElement.querySelector('.stats-right span');
            if (statsRight) {
                statsRight.textContent = statsRight.textContent.replace(/\d+(\s+коментара)/, `${count}$1`);
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
        color: #1877f2 !important;
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