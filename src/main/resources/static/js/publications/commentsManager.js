// ====== COMMENTS MANAGER - FIXED VERSION ======
// src/main/resources/static/js/publications/commentsManager.js

class CommentsManager {
    constructor() {
        this.currentPostId = null;
        this.comments = new Map();
        this.replies = new Map();
        this.isLoading = false;
        this.hasMoreComments = true;
        this.currentPage = 0;
        this.commentsPerPage = 10;
        this.currentSort = 'newest';
        this.isInitialized = false;

        console.log('🔧 DEBUG: CommentsManager created');
    }

    /**
     * Проверява дали необходимите DOM елементи съществуват
     */
    checkDOMElements() {
        const requiredElements = [
            'commentTextarea',
            'commentSubmitBtn',
            'commentsList',
            'commentTemplate'
        ];

        const missing = [];
        const found = [];

        requiredElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                found.push(id);
            } else {
                missing.push(id);
            }
        });

        console.log('🔧 DEBUG: DOM Elements found:', found);
        if (missing.length > 0) {
            console.error('❌ DEBUG: Missing DOM elements:', missing);
            return false;
        }

        return true;
    }

    /**
     * Инициализира системата
     */
    initialize() {
        if (this.isInitialized) {
            console.log('🔧 DEBUG: Already initialized');
            return;
        }

        console.log('🔧 DEBUG: Initializing CommentsManager...');

        if (!this.checkDOMElements()) {
            console.error('❌ DEBUG: Cannot initialize - missing DOM elements');
            return;
        }

        this.setupEventListeners();
        this.isInitialized = true;
        console.log('✅ DEBUG: CommentsManager initialized successfully');
    }

    setupEventListeners() {
        console.log('🔧 DEBUG: Setting up event listeners...');

        // Comment input events
        const commentTextarea = document.getElementById('commentTextarea');
        if (commentTextarea) {
            commentTextarea.addEventListener('input', () => this.handleCommentInput());
            commentTextarea.addEventListener('focus', () => this.showCommentActions());
            console.log('✅ DEBUG: Comment textarea events added');
        }

        // Comment action buttons
        const submitBtn = document.getElementById('commentSubmitBtn');
        const cancelBtn = document.getElementById('commentCancelBtn');
        const emojiBtn = document.getElementById('commentEmojiBtn');

        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitComment());
            console.log('✅ DEBUG: Submit button event added');
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelComment());
            console.log('✅ DEBUG: Cancel button event added');
        }

        if (emojiBtn) {
            emojiBtn.addEventListener('click', () => this.toggleEmojiPicker());
            console.log('✅ DEBUG: Emoji button event added');
        }

        // Emoji picker events
        document.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.insertEmoji(e.target.dataset.emoji));
        });

        // Load more comments
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreComments());
            console.log('✅ DEBUG: Load more button event added');
        }

        // Retry button
        const retryBtn = document.getElementById('retryCommentsBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.retryLoadComments());
            console.log('✅ DEBUG: Retry button event added');
        }

        // Comments sorting
        const sortSelect = document.getElementById('commentsSortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                console.log('🔧 DEBUG: Sort changed to:', this.currentSort);
                this.loadComments(this.currentPostId);
            });
            console.log('✅ DEBUG: Sort select event added');
        }

        // Event delegation
        this.setupEventDelegation();
    }

    /**
     * Event delegation за всички comment actions
     */
    setupEventDelegation() {
        const commentsSection = document.getElementById('commentsSection');
        if (!commentsSection) {
            console.error('❌ DEBUG: commentsSection not found');
            return;
        }

        commentsSection.addEventListener('click', (e) => {
            console.log('🔧 DEBUG: Click event in comments section:', e.target);

            e.stopPropagation();

            // Comment actions with data-action
            const target = e.target.closest('[data-action]');
            if (target) {
                const action = target.dataset.action;
                console.log('🔧 DEBUG: Found action:', action);
                this.handleCommentAction(target, e);
                return;
            }

            // Emoji picker close
            if (!e.target.closest('#commentEmojiPicker') && !e.target.closest('#commentEmojiBtn')) {
                const emojiPicker = document.getElementById('commentEmojiPicker');
                if (emojiPicker && emojiPicker.style.display === 'block') {
                    emojiPicker.style.display = 'none';
                    console.log('🔧 DEBUG: Emoji picker closed');
                }
            }

            // Comment menu close
            if (!e.target.closest('.comment-menu-btn')) {
                const openMenus = document.querySelectorAll('.comment-menu-dropdown[style*="block"]');
                if (openMenus.length > 0) {
                    openMenus.forEach(menu => menu.style.display = 'none');
                    console.log('🔧 DEBUG: Comment menus closed');
                }
            }
        });

        console.log('✅ DEBUG: Event delegation setup complete');
    }

    /**
     * Обработва всички comment actions
     */
    handleCommentAction(element, event) {
        const action = element.dataset.action;
        const commentId = element.closest('[data-comment-id]')?.dataset.commentId;
        const replyId = element.closest('[data-reply-id]')?.dataset.replyId;

        console.log('🔧 DEBUG: Handling action:', action, 'commentId:', commentId, 'replyId:', replyId);

        switch (action) {
            case 'like-comment':
                if (commentId) this.toggleCommentLike(commentId);
                break;
            case 'dislike-comment':
                if (commentId) this.toggleCommentDislike(commentId);
                break;
            case 'reply-comment':
                if (commentId) this.showReplyInput(commentId);
                break;
            case 'menu-comment':
                if (commentId) this.toggleCommentMenu(commentId);
                break;
            case 'show-replies':
                if (commentId) this.showReplies(commentId);
                break;
            case 'hide-replies':
                if (commentId) this.hideReplies(commentId);
                break;
            case 'like-reply':
                if (replyId) this.toggleReplyLike(replyId);
                break;
            case 'dislike-reply':
                if (replyId) this.toggleReplyDislike(replyId);
                break;
            default:
                console.warn('🔧 DEBUG: Unknown action:', action);
        }
    }

    // ====== MAIN LOAD COMMENTS ======

    async loadComments(postId) {
        if (this.isLoading) {
            console.log('🔧 DEBUG: Already loading comments');
            return;
        }

        console.log('🔧 DEBUG: Loading comments for post:', postId);

        // Инициализираме ако не е направено
        if (!this.isInitialized) {
            this.initialize();
            if (!this.isInitialized) {
                console.error('❌ DEBUG: Failed to initialize');
                return;
            }
        }

        this.currentPostId = postId;
        this.currentPage = 0;
        this.hasMoreComments = true;
        this.comments.clear();
        this.replies.clear();

        this.showLoading();
        this.hideNoComments();
        this.hideError();

        try {
            console.log('🔧 DEBUG: Fetching comments...');
            const response = await this.fetchComments(postId, 0);
            console.log('🔧 DEBUG: Comments response:', response);

            if (response.success && response.comments && response.comments.length > 0) {
                response.comments.forEach(comment => {
                    console.log('🔧 DEBUG: Adding comment to map:', comment.id);
                    this.comments.set(comment.id, comment);
                });

                this.renderComments();
                this.currentPage++;
                this.hasMoreComments = response.hasNext;
                this.updateLoadMoreButton();

                console.log('✅ DEBUG: Comments loaded successfully:', this.comments.size);
            } else {
                console.log('🔧 DEBUG: No comments found');
                this.showNoComments();
            }

            // Update view count
            await this.updateViewCount(postId);

            // Update avatar
            this.updateCommentInputAvatar();

        } catch (error) {
            console.error('❌ DEBUG: Error loading comments:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    // ====== VIEW COUNT UPDATE ======

    async updateViewCount(postId) {
        try {
            console.log('🔧 DEBUG: Updating view count for post:', postId);
            const response = await fetch(`/api/publications/${postId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.ok) {
                const publicationData = await response.json();
                console.log('🔧 DEBUG: Publication data:', publicationData);

                // Update view count on wall
                this.updateViewCountOnWall(postId, publicationData.viewsCount);

                // Update view count in modal
                this.updateViewCountInModal(publicationData.viewsCount);

                console.log('✅ DEBUG: View count updated:', publicationData.viewsCount);
            }
        } catch (error) {
            console.warn('⚠️ DEBUG: Failed to update view count:', error);
        }
    }

    updateViewCountOnWall(postId, viewCount) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            const viewStatsCount = postElement.querySelector('.view-stats-count');
            if (viewStatsCount) {
                viewStatsCount.textContent = viewCount || 0;
                console.log('✅ DEBUG: Updated view count on wall:', viewCount);
            }
        }
    }

    updateViewCountInModal(viewCount) {
        const modalViewCount = document.querySelector('#modalViewCount, .modal-view-count');
        if (modalViewCount) {
            modalViewCount.textContent = viewCount || 0;
            console.log('✅ DEBUG: Updated view count in modal:', viewCount);
        }
    }

    // ====== COMMENT INPUT HANDLING ======

    handleCommentInput() {
        const textarea = document.getElementById('commentTextarea');
        const submitBtn = document.getElementById('commentSubmitBtn');

        if (textarea && submitBtn) {
            const hasText = textarea.value.trim().length > 0;
            submitBtn.disabled = !hasText;
            console.log('🔧 DEBUG: Comment input changed, has text:', hasText);
        }
    }

    showCommentActions() {
        const actions = document.getElementById('commentInputActions');
        if (actions) {
            actions.style.display = 'flex';
            console.log('🔧 DEBUG: Comment actions shown');
        }
    }

    hideCommentActions() {
        const actions = document.getElementById('commentInputActions');
        if (actions) {
            actions.style.display = 'none';
            console.log('🔧 DEBUG: Comment actions hidden');
        }
    }

    async submitComment() {
        if (!window.isAuthenticated) {
            console.log('🔧 DEBUG: User not authenticated');
            this.showLoginPrompt();
            return;
        }

        const textarea = document.getElementById('commentTextarea');
        const submitBtn = document.getElementById('commentSubmitBtn');

        if (!textarea || !this.currentPostId) {
            console.error('❌ DEBUG: Missing textarea or currentPostId');
            return;
        }

        const text = textarea.value.trim();
        if (!text) {
            console.log('🔧 DEBUG: Empty comment text');
            return;
        }

        console.log('🔧 DEBUG: Submitting comment:', text);

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div> Публикуване...';

        try {
            const response = await this.createComment(this.currentPostId, text);
            console.log('🔧 DEBUG: Comment created:', response);

            if (response.success) {
                // Add to comments map
                this.comments.set(response.comment.id, response.comment);

                // Render new comment at top
                this.prependComment(response.comment);

                // Clear input
                textarea.value = '';
                this.hideCommentActions();

                // Update comment count
                this.updateCommentsCountEverywhere(this.currentPostId, 1);

                console.log('✅ DEBUG: Comment submitted successfully');
            }

        } catch (error) {
            console.error('❌ DEBUG: Error creating comment:', error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Коментирай';
        }
    }

    cancelComment() {
        const textarea = document.getElementById('commentTextarea');
        if (textarea) {
            textarea.value = '';
        }
        this.hideCommentActions();
        console.log('🔧 DEBUG: Comment cancelled');
    }

    // ====== COMMENT COUNT SYNC ======

    updateCommentsCountEverywhere(postId, delta) {
        console.log('🔧 DEBUG: Updating comment count by:', delta);
        this.updateCommentsCountInModal(delta);
        this.updateCommentsCountOnWall(postId, delta);
    }

    updateCommentsCountInModal(delta) {
        const headerCount = document.getElementById('commentsHeaderCount');
        if (headerCount) {
            const current = parseInt(headerCount.textContent) || 0;
            const newCount = Math.max(0, current + delta);
            headerCount.textContent = newCount;
            console.log('🔧 DEBUG: Modal comment count updated to:', newCount);
        }
    }

    updateCommentsCountOnWall(postId, delta) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            const commentStatsCount = postElement.querySelector('.comment-stats-count');
            if (commentStatsCount) {
                const current = parseInt(commentStatsCount.textContent) || 0;
                const newCount = Math.max(0, current + delta);
                commentStatsCount.textContent = newCount;
                console.log('🔧 DEBUG: Wall comment count updated to:', newCount);
            }
        }
    }

    // ====== REACTIONS (SIMPLIFIED FOR NOW) ======

    async toggleCommentLike(commentId) {
        console.log('🔧 DEBUG: Toggle comment like:', commentId);
        if (!window.isAuthenticated) {
            this.showLoginPrompt();
            return;
        }

        try {
            const response = await this.reactToComment(commentId, 'LIKE');

            if (response.success) {
                const comment = this.comments.get(commentId);
                if (comment) {
                    comment.likesCount = response.likesCount;
                    comment.dislikesCount = response.dislikesCount;
                    comment.userReaction = response.userReaction;
                }
                this.updateCommentActions(commentId);
                console.log('✅ DEBUG: Comment like toggled');
            }

        } catch (error) {
            console.error('❌ DEBUG: Error toggling comment like:', error);
        }
    }

    async toggleCommentDislike(commentId) {
        console.log('🔧 DEBUG: Toggle comment dislike:', commentId);
        if (!window.isAuthenticated) {
            this.showLoginPrompt();
            return;
        }

        try {
            const response = await this.reactToComment(commentId, 'DISLIKE');

            if (response.success) {
                const comment = this.comments.get(commentId);
                if (comment) {
                    comment.likesCount = response.likesCount;
                    comment.dislikesCount = response.dislikesCount;
                    comment.userReaction = response.userReaction;
                }
                this.updateCommentActions(commentId);
                console.log('✅ DEBUG: Comment dislike toggled');
            }

        } catch (error) {
            console.error('❌ DEBUG: Error toggling comment dislike:', error);
        }
    }

    updateCommentActions(commentId) {
        const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentDiv) return;

        const comment = this.comments.get(commentId);
        if (!comment) return;

        // Update counts
        const likesCount = commentDiv.querySelector('.comment-likes-count');
        const dislikesCount = commentDiv.querySelector('.comment-dislikes-count');

        if (likesCount) likesCount.textContent = comment.likesCount || 0;
        if (dislikesCount) dislikesCount.textContent = comment.dislikesCount || 0;

        // Update button states
        const likeBtn = commentDiv.querySelector('.comment-like-btn');
        const dislikeBtn = commentDiv.querySelector('.comment-dislike-btn');

        if (likeBtn) {
            const isLiked = comment.userReaction === 'LIKE';
            likeBtn.classList.toggle('liked', isLiked);
            const icon = likeBtn.querySelector('i');
            if (icon) {
                icon.className = isLiked ? 'bi bi-hand-thumbs-up-fill' : 'bi bi-hand-thumbs-up';
            }
        }

        if (dislikeBtn) {
            const isDisliked = comment.userReaction === 'DISLIKE';
            dislikeBtn.classList.toggle('disliked', isDisliked);
            const icon = dislikeBtn.querySelector('i');
            if (icon) {
                icon.className = isDisliked ? 'bi bi-hand-thumbs-down-fill' : 'bi bi-hand-thumbs-down';
            }
        }
    }

    toggleCommentMenu(commentId) {
        console.log('🔧 DEBUG: Toggle comment menu:', commentId);
        const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentDiv) return;

        const dropdown = commentDiv.querySelector('.comment-menu-dropdown');
        if (dropdown) {
            const isVisible = dropdown.style.display === 'block';

            // Close all other menus
            document.querySelectorAll('.comment-menu-dropdown').forEach(menu => {
                menu.style.display = 'none';
            });

            dropdown.style.display = isVisible ? 'none' : 'block';
        }
    }

    // ====== REPLIES (SIMPLIFIED FOR NOW) ======

    showReplyInput(commentId) {
        console.log('🔧 DEBUG: Show reply input:', commentId);
        // TODO: Implement
    }

    async showReplies(commentId) {
        console.log('🔧 DEBUG: Show replies for comment:', commentId);
        // TODO: Implement
    }

    hideReplies(commentId) {
        console.log('🔧 DEBUG: Hide replies for comment:', commentId);
        // TODO: Implement
    }

    async toggleReplyLike(replyId) {
        console.log('🔧 DEBUG: Toggle reply like:', replyId);
        // TODO: Implement
    }

    async toggleReplyDislike(replyId) {
        console.log('🔧 DEBUG: Toggle reply dislike:', replyId);
        // TODO: Implement
    }

    // ====== RENDERING ======

    renderComments() {
        console.log('🔧 DEBUG: Rendering comments...');
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) {
            console.error('❌ DEBUG: commentsList not found');
            return;
        }

        // Clear existing comments
        const existingComments = commentsList.querySelectorAll('.comment-item');
        existingComments.forEach(comment => comment.remove());
        console.log('🔧 DEBUG: Cleared existing comments:', existingComments.length);

        // Render all comments
        let rendered = 0;
        Array.from(this.comments.values()).forEach(comment => {
            const commentElement = this.createCommentElement(comment);
            if (commentElement) {
                commentsList.appendChild(commentElement);
                rendered++;
            }
        });

        console.log('✅ DEBUG: Rendered comments:', rendered);
    }

    prependComment(comment) {
        console.log('🔧 DEBUG: Prepending comment:', comment.id);
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;

        const commentElement = this.createCommentElement(comment);
        if (!commentElement) return;

        // Insert at the beginning
        const firstComment = commentsList.querySelector('.comment-item');
        if (firstComment) {
            commentsList.insertBefore(commentElement, firstComment);
        } else {
            commentsList.appendChild(commentElement);
        }

        this.hideNoComments();
        console.log('✅ DEBUG: Comment prepended successfully');
    }

    createCommentElement(comment) {
        console.log('🔧 DEBUG: Creating comment element for:', comment.id);
        const template = document.getElementById('commentTemplate');
        if (!template) {
            console.error('❌ DEBUG: commentTemplate not found');
            return null;
        }

        const commentElement = template.content.cloneNode(true);
        const commentDiv = commentElement.querySelector('.comment-item');

        // Set comment ID
        commentDiv.dataset.commentId = comment.id;

        // Fill basic content
        this.fillCommentContent(commentElement, comment);

        console.log('✅ DEBUG: Comment element created for:', comment.id);
        return commentElement;
    }

    fillCommentContent(commentElement, comment) {
        console.log('🔧 DEBUG: Filling comment content for:', comment.id);

        // Avatar - simplified
        const avatar = commentElement.querySelector('.comment-avatar');
        if (avatar) {
            avatar.innerHTML = `<img src="${comment.authorImage || '/images/default-avatar.png'}" alt="${comment.author}" style="width:32px;height:32px;border-radius:50%;">`;
        }

        // Author
        const authorLink = commentElement.querySelector('.comment-author');
        if (authorLink) {
            authorLink.textContent = comment.author;
            authorLink.href = `/users/${comment.author}`;
        }

        // Time
        const timeSpan = commentElement.querySelector('.comment-time');
        if (timeSpan) {
            timeSpan.textContent = this.formatTimeAgo(comment.createdAt);
        }

        // Full time
        const fullTime = commentElement.querySelector('.comment-full-time');
        if (fullTime) {
            fullTime.textContent = this.formatFullTime(comment.createdAt);
        }

        // Text
        const textDiv = commentElement.querySelector('.comment-text');
        if (textDiv) {
            textDiv.textContent = comment.text;
        }

        // Counts
        const likesCount = commentElement.querySelector('.comment-likes-count');
        const dislikesCount = commentElement.querySelector('.comment-dislikes-count');

        if (likesCount) likesCount.textContent = comment.likesCount || 0;
        if (dislikesCount) dislikesCount.textContent = comment.dislikesCount || 0;

        // Button states
        const likeBtn = commentElement.querySelector('.comment-like-btn');
        const dislikeBtn = commentElement.querySelector('.comment-dislike-btn');

        if (likeBtn) {
            const isLiked = comment.userReaction === 'LIKE';
            likeBtn.classList.toggle('liked', isLiked);
            const icon = likeBtn.querySelector('i');
            if (icon) {
                icon.className = isLiked ? 'bi bi-hand-thumbs-up-fill' : 'bi bi-hand-thumbs-up';
            }
        }

        if (dislikeBtn) {
            const isDisliked = comment.userReaction === 'DISLIKE';
            dislikeBtn.classList.toggle('disliked', isDisliked);
            const icon = dislikeBtn.querySelector('i');
            if (icon) {
                icon.className = isDisliked ? 'bi bi-hand-thumbs-down-fill' : 'bi bi-hand-thumbs-down';
            }
        }

        // Show menu for owner
        if (comment.canEdit) {
            const menuBtn = commentElement.querySelector('.comment-menu-btn');
            if (menuBtn) {
                menuBtn.style.display = 'flex';
            }
        }

        console.log('✅ DEBUG: Comment content filled for:', comment.id);
    }

    // ====== CLEANUP ======

    cleanup() {
        console.log('🔧 DEBUG: Cleaning up CommentsManager...');
        this.isInitialized = false;
        console.log('✅ DEBUG: CommentsManager cleanup completed');
    }

    // ====== UI STATE MANAGEMENT ======

    showLoading() {
        const loading = document.getElementById('commentsLoading');
        if (loading) {
            loading.style.display = 'flex';
            console.log('🔧 DEBUG: Loading shown');
        }
        this.hideNoComments();
        this.hideError();
    }

    hideLoading() {
        const loading = document.getElementById('commentsLoading');
        if (loading) {
            loading.style.display = 'none';
            console.log('🔧 DEBUG: Loading hidden');
        }
    }

    showNoComments() {
        const noComments = document.getElementById('noCommentsMessage');
        if (noComments) {
            noComments.style.display = 'flex';
            console.log('🔧 DEBUG: No comments message shown');
        }
        this.hideLoading();
        this.hideError();
    }

    hideNoComments() {
        const noComments = document.getElementById('noCommentsMessage');
        if (noComments) {
            noComments.style.display = 'none';
            console.log('🔧 DEBUG: No comments message hidden');
        }
    }

    showError(message = 'Възникна грешка при зареждане на коментарите') {
        const error = document.getElementById('commentsError');
        if (error) {
            error.style.display = 'flex';
            const errorText = error.querySelector('p');
            if (errorText) errorText.textContent = message;
            console.log('🔧 DEBUG: Error shown:', message);
        }
        this.hideLoading();
        this.hideNoComments();
    }

    hideError() {
        const error = document.getElementById('commentsError');
        if (error) {
            error.style.display = 'none';
            console.log('🔧 DEBUG: Error hidden');
        }
    }

    updateLoadMoreButton() {
        const loadMoreContainer = document.getElementById('loadMoreComments');
        if (loadMoreContainer) {
            loadMoreContainer.style.display = this.hasMoreComments ? 'block' : 'none';
            console.log('🔧 DEBUG: Load more button updated, hasMore:', this.hasMoreComments);
        }
    }

    async loadMoreComments() {
        console.log('🔧 DEBUG: Load more comments requested');
        // TODO: Implement
    }

    retryLoadComments() {
        console.log('🔧 DEBUG: Retry load comments');
        if (this.currentPostId) {
            this.loadComments(this.currentPostId);
        }
    }

    // ====== HELPER METHODS ======

    showLoginPrompt() {
        console.log('🔧 DEBUG: Showing login prompt');
        if (window.showLoginModal) {
            window.showLoginModal();
        } else {
            window.location.href = '/login';
        }
    }

    updateCommentInputAvatar() {
        const avatarContainer = document.getElementById('commentUserAvatar');
        if (avatarContainer && window.currentUserImage) {
            avatarContainer.innerHTML = `<img src="${window.currentUserImage}" alt="Avatar" class="comment-avatar-img">`;
            console.log('🔧 DEBUG: Comment input avatar updated');
        }
    }

    toggleEmojiPicker() {
        const emojiPicker = document.getElementById('commentEmojiPicker');
        if (emojiPicker) {
            const isVisible = emojiPicker.style.display === 'block';
            emojiPicker.style.display = isVisible ? 'none' : 'block';
            console.log('🔧 DEBUG: Emoji picker toggled, visible:', !isVisible);
        }
    }

    insertEmoji(emoji) {
        const textarea = document.getElementById('commentTextarea');
        if (textarea && emoji) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;

            textarea.value = text.substring(0, start) + emoji + text.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + emoji.length;

            this.handleCommentInput();
            textarea.focus();
        }

        // Hide emoji picker
        const emojiPicker = document.getElementById('commentEmojiPicker');
        if (emojiPicker) {
            emojiPicker.style.display = 'none';
        }
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

    formatFullTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('bg-BG', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // ====== API METHODS ======

    async fetchComments(postId, page) {
        try {
            const url = `/api/comments/publication/${postId}?page=${page}&size=${this.commentsPerPage}&sort=${this.currentSort}`;
            console.log('🔧 DEBUG: Fetching from URL:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('🔧 DEBUG: API response:', data);
            return data;
        } catch (error) {
            console.error('❌ DEBUG: API Error fetching comments:', error);
            throw error;
        }
    }

    async createComment(postId, text) {
        try {
            console.log('🔧 DEBUG: Creating comment API call');
            const formData = new FormData();
            formData.append('targetId', postId);
            formData.append('text', text);

            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    [window.appData.csrfHeader]: window.appData.csrfToken
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('🔧 DEBUG: Comment created API response:', data);
            return data;
        } catch (error) {
            console.error('❌ DEBUG: API Error creating comment:', error);
            throw error;
        }
    }

    async reactToComment(commentId, type) {
        try {
            const response = await fetch(`/api/comments/${commentId}/reaction/${type}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    [window.appData.csrfHeader]: window.appData.csrfToken
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ DEBUG: API Error reacting to comment:', error);
            throw error;
        }
    }
}

// НЕ инициализираме глобално
window.CommentsManager = CommentsManager;