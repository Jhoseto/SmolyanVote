// ====== COMPLETE COMMENTS MANAGER - БЕЗ KEYBOARD + VIEW COUNT + REPLIES ======
// Файл: src/main/resources/static/js/publications/commentsManager.js

class CommentsManager {
    constructor() {
        this.currentPostId = null;
        this.comments = new Map();
        this.replies = new Map();
        this.isLoading = false;
        this.hasMoreComments = true;
        this.currentPage = 0;
        this.commentsPerPage = 10;
        this.isCommentsVisible = true;
        this.currentSort = 'newest';
        this.isInitialized = false;

        console.log('📝 CommentsManager created (not initialized yet)');
    }

    /**
     * Инициализира системата след като DOM елементите са налични
     */
    initialize() {
        if (this.isInitialized) return;

        console.log('📝 Initializing CommentsManager...');
        this.setupEventListeners();
        this.setupAutoResize();
        this.isInitialized = true;
        console.log('✅ CommentsManager initialized successfully');
    }

    /**
     * Проверява дали необходимите DOM елементи съществуват
     */
    checkDOMElements() {
        const requiredElements = [
            'commentTextarea',
            'commentSubmitBtn',
            'commentsList'
        ];

        const missing = requiredElements.filter(id => !document.getElementById(id));

        if (missing.length > 0) {
            console.warn('⚠️ Missing DOM elements:', missing);
            return false;
        }

        return true;
    }

    setupEventListeners() {
        // ✅ БЕЗ keyboard shortcuts - само основни click събития

        // Comment input events
        const commentTextarea = document.getElementById('commentTextarea');
        if (commentTextarea) {
            commentTextarea.addEventListener('input', () => this.handleCommentInput());
            commentTextarea.addEventListener('focus', () => this.showCommentActions());
        }

        // Comment actions
        const submitBtn = document.getElementById('commentSubmitBtn');
        const cancelBtn = document.getElementById('commentCancelBtn');
        const emojiBtn = document.getElementById('commentEmojiBtn');

        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitComment());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelComment());
        }

        if (emojiBtn) {
            emojiBtn.addEventListener('click', () => this.toggleEmojiPicker());
        }

        // Emoji picker events
        document.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.insertEmoji(e.target.dataset.emoji));
        });

        // Load more comments
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreComments());
        }

        // Retry button
        const retryBtn = document.getElementById('retryCommentsBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.retryLoadComments());
        }

        // Comments sorting
        const sortSelect = document.getElementById('commentsSortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.loadComments(this.currentPostId);
            });
        }

        // Event delegation за comment actions
        this.setupEventDelegation();
    }

    /**
     * Event delegation за по-ефективно handling
     */
    setupEventDelegation() {
        const commentsSection = document.getElementById('commentsSection');
        if (!commentsSection) return;

        commentsSection.addEventListener('click', (e) => {
            e.stopPropagation();

            // Emoji picker затваряне
            if (!e.target.closest('#commentEmojiPicker') && !e.target.closest('#commentEmojiBtn')) {
                const emojiPicker = document.getElementById('commentEmojiPicker');
                if (emojiPicker && emojiPicker.style.display === 'block') {
                    emojiPicker.style.display = 'none';
                }
            }

            // Comment menu затваряне
            if (!e.target.closest('.comment-menu-btn')) {
                document.querySelectorAll('.comment-menu-dropdown').forEach(menu => {
                    menu.style.display = 'none';
                });
            }

            // Comment actions
            const target = e.target.closest('[data-action]');
            if (target) {
                this.handleCommentAction(target, e);
            }
        });
    }

    /**
     * Унифициран handler за всички comment actions
     */
    handleCommentAction(element, event) {
        const action = element.dataset.action;
        const commentId = element.closest('[data-comment-id]')?.dataset.commentId;
        const replyId = element.closest('[data-reply-id]')?.dataset.replyId;

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
                console.warn('Unknown comment action:', action);
        }
    }

    setupAutoResize() {
        const commentsSection = document.getElementById('commentsSection');
        if (!commentsSection) return;

        commentsSection.addEventListener('input', (e) => {
            if (e.target.matches('.comment-textarea, .reply-textarea, .edit-comment-textarea, .edit-reply-textarea')) {
                this.autoResizeTextarea(e.target);
            }
        });
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        const maxHeight = 120;
        const newHeight = Math.min(textarea.scrollHeight, maxHeight);
        textarea.style.height = newHeight + 'px';
        textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'scroll' : 'hidden';
    }

    // ====== MAIN LOAD COMMENTS WITH VIEW COUNT ======

    async loadComments(postId) {
        if (this.isLoading) return;

        // Инициализираме ако не е направено
        if (!this.isInitialized) {
            if (!this.checkDOMElements()) {
                console.error('❌ Cannot load comments - missing DOM elements');
                return;
            }
            this.initialize();
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
            // ✅ 1. Първо зареждаме коментарите
            const response = await this.fetchComments(postId, 0);

            if (response.success && response.comments && response.comments.length > 0) {
                response.comments.forEach(comment => this.comments.set(comment.id, comment));
                this.renderComments();
                this.currentPage++;
                this.hasMoreComments = response.hasNext;
                this.updateLoadMoreButton();
            } else {
                this.showNoComments();
            }

            // ✅ 2. След това обновяваме view count (API го прави автоматично)
            await this.updateViewCount(postId);

            // ✅ 3. Обновяваме avatar-а
            this.updateCommentInputAvatar();

        } catch (error) {
            console.error('❌ Error loading comments:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * ✅ Обновява view count във всички места
     */
    async updateViewCount(postId) {
        try {
            // Fetch актуалните данни за публикацията (включва новия view count)
            const response = await fetch(`/api/publications/${postId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.ok) {
                const publicationData = await response.json();

                // ✅ Обновяваме view count на стената
                this.updateViewCountOnWall(postId, publicationData.viewsCount);

                // ✅ Обновяваме view count в модала
                this.updateViewCountInModal(publicationData.viewsCount);

                console.log('✅ View count updated:', publicationData.viewsCount);
            }
        } catch (error) {
            console.warn('⚠️ Failed to update view count:', error);
        }
    }

    /**
     * ✅ Обновява view count на стената (в publications списъка)
     */
    updateViewCountOnWall(postId, viewCount) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            const viewStatsCount = postElement.querySelector('.view-stats-count');
            if (viewStatsCount) {
                viewStatsCount.textContent = viewCount || 0;
                // Анимация при обновяване
                viewStatsCount.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    viewStatsCount.style.transform = '';
                }, 200);
            }
        }
    }

    /**
     * ✅ Обновява view count в модала
     */
    updateViewCountInModal(viewCount) {
        const modalViewCount = document.querySelector('#modalViewCount, .modal-view-count');
        if (modalViewCount) {
            modalViewCount.textContent = viewCount || 0;
        }
    }

    // ====== COMMENTS COUNT SYNC ======

    /**
     * ✅ Обновява comment count навсякъде (стена + модал)
     */
    updateCommentsCountEverywhere(postId, delta) {
        // Обновяваме в модала
        this.updateCommentsCountInModal(delta);

        // Обновяваме на стената
        this.updateCommentsCountOnWall(postId, delta);
    }

    /**
     * ✅ Обновява comment count в модала
     */
    updateCommentsCountInModal(delta) {
        const headerCount = document.getElementById('commentsHeaderCount');
        if (headerCount) {
            const current = parseInt(headerCount.textContent) || 0;
            const newCount = Math.max(0, current + delta);
            headerCount.textContent = newCount;

            // Анимация
            headerCount.style.transform = 'scale(1.1)';
            setTimeout(() => {
                headerCount.style.transform = '';
            }, 200);
        }
    }

    /**
     * ✅ Обновява comment count на стената
     */
    updateCommentsCountOnWall(postId, delta) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            const commentStatsCount = postElement.querySelector('.comment-stats-count');
            if (commentStatsCount) {
                const current = parseInt(commentStatsCount.textContent) || 0;
                const newCount = Math.max(0, current + delta);
                commentStatsCount.textContent = newCount;

                // Анимация
                commentStatsCount.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    commentStatsCount.style.transform = '';
                }, 200);
            }
        }
    }

    // ====== COMMENT INPUT HANDLING ======

    handleCommentInput() {
        const textarea = document.getElementById('commentTextarea');
        const submitBtn = document.getElementById('commentSubmitBtn');

        if (textarea && submitBtn) {
            const hasText = textarea.value.trim().length > 0;
            submitBtn.disabled = !hasText;
            this.autoResizeTextarea(textarea);
        }
    }

    showCommentActions() {
        const actions = document.getElementById('commentInputActions');
        if (actions) {
            actions.style.display = 'flex';
        }
    }

    hideCommentActions() {
        const actions = document.getElementById('commentInputActions');
        if (actions) {
            actions.style.display = 'none';
        }
    }

    async submitComment() {
        if (!window.isAuthenticated) {
            this.showLoginPrompt();
            return;
        }

        const textarea = document.getElementById('commentTextarea');
        const submitBtn = document.getElementById('commentSubmitBtn');

        if (!textarea || !this.currentPostId) return;

        const text = textarea.value.trim();
        if (!text) return;

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div> Публикуване...';

        try {
            const response = await this.createComment(this.currentPostId, text);

            if (response.success) {
                // Add to comments map
                this.comments.set(response.comment.id, response.comment);

                // Render new comment at top
                this.prependComment(response.comment);

                // Clear input
                textarea.value = '';
                this.hideCommentActions();
                this.autoResizeTextarea(textarea);

                // ✅ Обновяваме comment count навсякъде
                this.updateCommentsCountEverywhere(this.currentPostId, 1);

                this.showToast(response.message || 'Коментарът е добавен успешно!', 'success');
            }

        } catch (error) {
            console.error('❌ Error creating comment:', error);
            this.showToast('Възникна грешка при добавянето на коментара', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Коментирай';
        }
    }

    cancelComment() {
        const textarea = document.getElementById('commentTextarea');
        if (textarea) {
            textarea.value = '';
            this.autoResizeTextarea(textarea);
        }
        this.hideCommentActions();
    }

    // ====== REPLIES FUNCTIONALITY ======

    async showReplies(commentId) {
        const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentDiv) return;

        try {
            // Зареждаме replies ако не са заредени
            if (!this.replies.has(commentId)) {
                const response = await this.fetchReplies(commentId, 0);
                if (response.success && response.comments) {
                    this.replies.set(commentId, response.comments);
                }
            }

            const replies = this.replies.get(commentId) || [];
            const repliesList = commentDiv.querySelector('.replies-list');

            if (repliesList) {
                // Clear existing replies
                repliesList.innerHTML = '';

                // Render all replies
                replies.forEach(reply => {
                    const replyElement = this.createReplyElement(reply);
                    if (replyElement) {
                        repliesList.appendChild(replyElement);
                    }
                });

                // Show replies list
                repliesList.style.display = 'block';
            }

            // Update replies controls
            this.updateRepliesControls(commentDiv, replies.length);

        } catch (error) {
            console.error('❌ Error showing replies:', error);
            this.showToast('Възникна грешка при зареждането на отговорите', 'error');
        }
    }

    hideReplies(commentId) {
        const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentDiv) return;

        const repliesList = commentDiv.querySelector('.replies-list');
        if (repliesList) {
            repliesList.style.display = 'none';
        }

        // Update replies controls
        const comment = this.comments.get(commentId);
        const repliesCount = comment?.repliesCount || 0;
        this.updateRepliesControls(commentDiv, repliesCount, false);
    }

    updateRepliesControls(commentDiv, repliesCount, isVisible = true) {
        const showBtn = commentDiv.querySelector('.show-replies-btn');
        const hideBtn = commentDiv.querySelector('.hide-replies-btn');
        const repliesCountSpan = commentDiv.querySelector('.replies-count');

        if (repliesCount > 0) {
            if (repliesCountSpan) {
                repliesCountSpan.textContent = repliesCount;
            }

            if (isVisible) {
                if (showBtn) showBtn.style.display = 'none';
                if (hideBtn) hideBtn.style.display = 'inline-block';
            } else {
                if (showBtn) showBtn.style.display = 'inline-block';
                if (hideBtn) hideBtn.style.display = 'none';
            }
        } else {
            if (showBtn) showBtn.style.display = 'none';
            if (hideBtn) hideBtn.style.display = 'none';
        }
    }

    showReplyInput(commentId) {
        const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentDiv) return;

        const replyInput = commentDiv.querySelector('.reply-input-section');
        if (replyInput) {
            replyInput.style.display = 'block';

            // Focus textarea
            const textarea = replyInput.querySelector('.reply-textarea');
            if (textarea) {
                textarea.focus();
            }

            // Update reply avatar
            this.updateReplyInputAvatar(replyInput);

            // Setup reply form event listeners
            this.setupReplyForm(commentId, replyInput);
        }
    }

    setupReplyForm(commentId, replyInput) {
        const textarea = replyInput.querySelector('.reply-textarea');
        const submitBtn = replyInput.querySelector('.reply-submit-btn');
        const cancelBtn = replyInput.querySelector('.reply-cancel-btn');

        if (textarea) {
            // Auto-resize and validation
            textarea.addEventListener('input', () => {
                this.autoResizeTextarea(textarea);
                const hasText = textarea.value.trim().length > 0;
                if (submitBtn) submitBtn.disabled = !hasText;
            });
        }

        if (submitBtn) {
            submitBtn.onclick = () => this.submitReply(commentId);
        }

        if (cancelBtn) {
            cancelBtn.onclick = () => this.cancelReply(commentId);
        }
    }

    async submitReply(commentId) {
        if (!window.isAuthenticated) {
            this.showLoginPrompt();
            return;
        }

        const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentDiv) return;

        const replyInput = commentDiv.querySelector('.reply-input-section');
        const textarea = replyInput?.querySelector('.reply-textarea');
        const submitBtn = replyInput?.querySelector('.reply-submit-btn');

        if (!textarea) return;

        const text = textarea.value.trim();
        if (!text) return;

        // Show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div> Отговаряне...';

        try {
            const newReply = await this.createReply(commentId, text);

            if (newReply.success) {
                // Add to replies
                if (!this.replies.has(commentId)) {
                    this.replies.set(commentId, []);
                }
                this.replies.get(commentId).push(newReply.comment);

                // Update comment replies count
                const comment = this.comments.get(commentId);
                if (comment) {
                    comment.repliesCount = (comment.repliesCount || 0) + 1;
                }

                // Show replies if hidden
                await this.showReplies(commentId);

                // Clear input
                textarea.value = '';
                this.cancelReply(commentId);

                // ✅ Обновяваме общия comment count (replies също са коментари)
                this.updateCommentsCountEverywhere(this.currentPostId, 1);

                this.showToast('Отговорът е добавен успешно!', 'success');
            }

        } catch (error) {
            console.error('❌ Error creating reply:', error);
            this.showToast('Възникна грешка при добавянето на отговора', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Отговори';
        }
    }

    cancelReply(commentId) {
        const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentDiv) return;

        const replyInput = commentDiv.querySelector('.reply-input-section');
        if (replyInput) {
            replyInput.style.display = 'none';

            const textarea = replyInput.querySelector('.reply-textarea');
            if (textarea) {
                textarea.value = '';
                this.autoResizeTextarea(textarea);
            }
        }
    }

    // ====== REPLY REACTIONS ======

    async toggleReplyLike(replyId) {
        if (!window.isAuthenticated) {
            this.showLoginPrompt();
            return;
        }

        try {
            const response = await this.reactToComment(replyId, 'LIKE');

            if (response.success) {
                // Update reply in memory
                this.updateReplyInMemory(replyId, response);
                // Update reply UI
                this.updateReplyActions(replyId);
            }

        } catch (error) {
            console.error('❌ Error toggling reply like:', error);
            this.showToast('Възникна грешка при харесването', 'error');
        }
    }

    async toggleReplyDislike(replyId) {
        if (!window.isAuthenticated) {
            this.showLoginPrompt();
            return;
        }

        try {
            const response = await this.reactToComment(replyId, 'DISLIKE');

            if (response.success) {
                // Update reply in memory
                this.updateReplyInMemory(replyId, response);
                // Update reply UI
                this.updateReplyActions(replyId);
            }

        } catch (error) {
            console.error('❌ Error toggling reply dislike:', error);
            this.showToast('Възникна грешка при дислайкването', 'error');
        }
    }

    updateReplyInMemory(replyId, response) {
        // Find and update the reply in our replies map
        for (const [commentId, replies] of this.replies.entries()) {
            const reply = replies.find(r => r.id == replyId);
            if (reply) {
                reply.likesCount = response.likesCount;
                reply.dislikesCount = response.dislikesCount;
                reply.userReaction = response.userReaction;
                break;
            }
        }
    }

    updateReplyActions(replyId) {
        const replyDiv = document.querySelector(`[data-reply-id="${replyId}"]`);
        if (!replyDiv) return;

        // Find reply data
        let replyData = null;
        for (const replies of this.replies.values()) {
            replyData = replies.find(r => r.id == replyId);
            if (replyData) break;
        }

        if (!replyData) return;

        // Update counts
        const likesCount = replyDiv.querySelector('.reply-likes-count');
        const dislikesCount = replyDiv.querySelector('.reply-dislikes-count');

        if (likesCount) likesCount.textContent = replyData.likesCount || 0;
        if (dislikesCount) dislikesCount.textContent = replyData.dislikesCount || 0;

        // Update button states
        const likeBtn = replyDiv.querySelector('.reply-like-btn');
        const dislikeBtn = replyDiv.querySelector('.reply-dislike-btn');

        if (likeBtn) {
            const isLiked = replyData.userReaction === 'LIKE';
            likeBtn.classList.toggle('liked', isLiked);
            const icon = likeBtn.querySelector('i');
            if (icon) {
                icon.className = isLiked ? 'bi bi-hand-thumbs-up-fill' : 'bi bi-hand-thumbs-up';
            }
        }

        if (dislikeBtn) {
            const isDisliked = replyData.userReaction === 'DISLIKE';
            dislikeBtn.classList.toggle('disliked', isDisliked);
            const icon = dislikeBtn.querySelector('i');
            if (icon) {
                icon.className = isDisliked ? 'bi bi-hand-thumbs-down-fill' : 'bi bi-hand-thumbs-down';
            }
        }
    }

    // ====== COMMENT REACTIONS ======

    async toggleCommentLike(commentId) {
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
            }

        } catch (error) {
            console.error('❌ Error toggling comment like:', error);
            this.showToast('Възникна грешка при харесването', 'error');
        }
    }

    async toggleCommentDislike(commentId) {
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
            }

        } catch (error) {
            console.error('❌ Error toggling comment dislike:', error);
            this.showToast('Възникна грешка при дислайкването', 'error');
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

    // ====== COMMENTS LOADING ======

    async loadMoreComments() {
        if (this.isLoading || !this.hasMoreComments || !this.currentPostId) return;

        this.isLoading = true;
        this.showLoadMoreLoading();

        try {
            const response = await this.fetchComments(this.currentPostId, this.currentPage);

            if (response.success && response.comments) {
                response.comments.forEach(comment => this.comments.set(comment.id, comment));
                this.renderNewComments(response.comments);
                this.currentPage++;
                this.hasMoreComments = response.hasNext;
                this.updateLoadMoreButton();
            }

        } catch (error) {
            console.error('❌ Error loading more comments:', error);
            this.showToast('Възникна грешка при зареждане на повече коментари', 'error');
        } finally {
            this.isLoading = false;
            this.hideLoadMoreLoading();
        }
    }

    retryLoadComments() {
        if (this.currentPostId) {
            this.loadComments(this.currentPostId);
        }
    }

    // ====== RENDERING ======

    renderComments() {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;

        // Clear existing comments (except templates and static elements)
        const existingComments = commentsList.querySelectorAll('.comment-item');
        existingComments.forEach(comment => comment.remove());

        // Render all comments
        Array.from(this.comments.values())
            .forEach(comment => this.renderComment(comment));
    }

    renderNewComments(newComments) {
        newComments.forEach(comment => this.renderComment(comment));
    }

    prependComment(comment) {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;

        const commentElement = this.createCommentElement(comment);

        // Insert at the beginning, after loading/error messages
        const firstComment = commentsList.querySelector('.comment-item');
        if (firstComment) {
            commentsList.insertBefore(commentElement, firstComment);
        } else {
            // Insert after static elements
            const staticElements = commentsList.querySelectorAll('.comments-loading, .no-comments-message, .comments-error');
            const lastStatic = staticElements[staticElements.length - 1];
            if (lastStatic && lastStatic.nextSibling) {
                commentsList.insertBefore(commentElement, lastStatic.nextSibling);
            } else {
                commentsList.appendChild(commentElement);
            }
        }

        // Hide no comments message if visible
        this.hideNoComments();
    }

    renderComment(comment) {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;

        const commentElement = this.createCommentElement(comment);
        commentsList.appendChild(commentElement);
    }

    createCommentElement(comment) {
        const template = document.getElementById('commentTemplate');
        if (!template) return null;

        const commentElement = template.content.cloneNode(true);
        const commentDiv = commentElement.querySelector('.comment-item');

        // Set comment ID
        commentDiv.dataset.commentId = comment.id;

        // Fill comment content
        this.fillCommentContent(commentElement, comment);

        // Update replies controls based on replies count
        this.updateRepliesControls(commentDiv, comment.repliesCount || 0, false);

        return commentElement;
    }

    fillCommentContent(commentElement, comment) {
        // Avatar
        const avatar = commentElement.querySelector('.comment-avatar');
        if (avatar) {
            const avatarHTML = window.avatarUtils ?
                window.avatarUtils.createAvatar(
                    comment.authorImage,
                    comment.author,
                    32,
                    'comment-avatar'
                ) :
                `<img src="${comment.authorImage}" alt="${comment.author}" style="width:32px;height:32px;border-radius:50%;">`;
            avatar.innerHTML = avatarHTML;
        }

        // Author info
        const authorLink = commentElement.querySelector('.comment-author');
        const timeSpan = commentElement.querySelector('.comment-time');
        const onlineStatus = commentElement.querySelector('.comment-online-status');
        const fullTime = commentElement.querySelector('.comment-full-time');

        if (authorLink) {
            authorLink.textContent = comment.author;
            authorLink.href = `/users/${comment.author}`;
        }

        if (timeSpan) {
            timeSpan.textContent = this.formatTimeAgo(comment.createdAt);
        }

        if (onlineStatus) {
            onlineStatus.className = `bi bi-circle comment-online-status online`;
            onlineStatus.title = 'Онлайн';
        }

        if (fullTime) {
            fullTime.textContent = this.formatFullTime(comment.createdAt);
        }

        // Comment text
        const textDiv = commentElement.querySelector('.comment-text');
        if (textDiv) {
            textDiv.textContent = comment.text;
        }

        // Comment counts
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
    }

    createReplyElement(reply) {
        const template = document.getElementById('replyTemplate');
        if (!template) return null;

        const replyElement = template.content.cloneNode(true);
        const replyDiv = replyElement.querySelector('.reply-item');

        // Set reply ID
        replyDiv.dataset.replyId = reply.id;

        // Fill reply content
        this.fillReplyContent(replyElement, reply);

        return replyElement;
    }

    fillReplyContent(replyElement, reply) {
        // Avatar
        const avatar = replyElement.querySelector('.reply-avatar');
        if (avatar) {
            const avatarHTML = window.avatarUtils ?
                window.avatarUtils.createAvatar(
                    reply.authorImage,
                    reply.author,
                    28,
                    'reply-avatar'
                ) :
                `<img src="${reply.authorImage}" alt="${reply.author}" style="width:28px;height:28px;border-radius:50%;">`;
            avatar.innerHTML = avatarHTML;
        }

        // Author info
        const authorLink = replyElement.querySelector('.reply-author');
        const timeSpan = replyElement.querySelector('.reply-time');
        const onlineStatus = replyElement.querySelector('.reply-online-status');
        const fullTime = replyElement.querySelector('.reply-full-time');

        if (authorLink) {
            authorLink.textContent = reply.author;
            authorLink.href = `/users/${reply.author}`;
        }

        if (timeSpan) {
            timeSpan.textContent = this.formatTimeAgo(reply.createdAt);
        }

        if (onlineStatus) {
            onlineStatus.className = `bi bi-circle reply-online-status online`;
            onlineStatus.title = 'Онлайн';
        }

        if (fullTime) {
            fullTime.textContent = this.formatFullTime(reply.createdAt);
        }

        // Reply text
        const textDiv = replyElement.querySelector('.reply-text');
        if (textDiv) {
            textDiv.textContent = reply.text;
        }

        // Reply counts
        const likesCount = replyElement.querySelector('.reply-likes-count');
        const dislikesCount = replyElement.querySelector('.reply-dislikes-count');

        if (likesCount) likesCount.textContent = reply.likesCount || 0;
        if (dislikesCount) dislikesCount.textContent = reply.dislikesCount || 0;

        // Button states
        const likeBtn = replyElement.querySelector('.reply-like-btn');
        const dislikeBtn = replyElement.querySelector('.reply-dislike-btn');

        if (likeBtn) {
            const isLiked = reply.userReaction === 'LIKE';
            likeBtn.classList.toggle('liked', isLiked);
            const icon = likeBtn.querySelector('i');
            if (icon) {
                icon.className = isLiked ? 'bi bi-hand-thumbs-up-fill' : 'bi bi-hand-thumbs-up';
            }
        }

        if (dislikeBtn) {
            const isDisliked = reply.userReaction === 'DISLIKE';
            dislikeBtn.classList.toggle('disliked', isDisliked);
            const icon = dislikeBtn.querySelector('i');
            if (icon) {
                icon.className = isDisliked ? 'bi bi-hand-thumbs-down-fill' : 'bi bi-hand-thumbs-down';
            }
        }

        // Show menu for owner
        if (reply.canEdit) {
            const menuBtn = replyElement.querySelector('.reply-menu-btn');
            if (menuBtn) {
                menuBtn.style.display = 'flex';
            }
        }
    }

    // ====== CLEANUP ======

    cleanup() {
        console.log('🧹 Cleaning up CommentsManager...');

        // Премахваме делегираните събития
        const commentsSection = document.getElementById('commentsSection');
        if (commentsSection) {
            const newSection = commentsSection.cloneNode(true);
            commentsSection.parentNode.replaceChild(newSection, commentsSection);
        }

        this.isInitialized = false;
        console.log('✅ CommentsManager cleanup completed');
    }

    // ====== UI STATE MANAGEMENT ======

    showLoading() {
        const loading = document.getElementById('commentsLoading');
        if (loading) loading.style.display = 'flex';
        this.hideNoComments();
        this.hideError();
    }

    hideLoading() {
        const loading = document.getElementById('commentsLoading');
        if (loading) loading.style.display = 'none';
    }

    showNoComments() {
        const noComments = document.getElementById('noCommentsMessage');
        if (noComments) noComments.style.display = 'flex';
        this.hideLoading();
        this.hideError();
    }

    hideNoComments() {
        const noComments = document.getElementById('noCommentsMessage');
        if (noComments) noComments.style.display = 'none';
    }

    showError(message = 'Възникна грешка при зареждане на коментарите') {
        const error = document.getElementById('commentsError');
        if (error) {
            error.style.display = 'flex';
            const errorText = error.querySelector('p');
            if (errorText) errorText.textContent = message;
        }
        this.hideLoading();
        this.hideNoComments();
    }

    hideError() {
        const error = document.getElementById('commentsError');
        if (error) error.style.display = 'none';
    }

    showLoadMoreLoading() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.disabled = true;
            loadMoreBtn.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div> Зареждане...';
        }
    }

    hideLoadMoreLoading() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.disabled = false;
            loadMoreBtn.innerHTML = 'Покажи още коментари';
        }
    }

    updateLoadMoreButton() {
        const loadMoreContainer = document.getElementById('loadMoreComments');
        if (loadMoreContainer) {
            loadMoreContainer.style.display = this.hasMoreComments ? 'block' : 'none';
        }
    }

    // ====== HELPER METHODS ======

    showLoginPrompt() {
        if (window.showLoginModal) {
            window.showLoginModal();
        } else {
            window.location.href = '/login';
        }
    }

    showToast(message, type = 'info') {
        console.log(`📝 ${type.toUpperCase()}: ${message}`);
        // TODO: Implement proper toast notifications
    }

    updateCommentInputAvatar() {
        const avatarContainer = document.getElementById('commentUserAvatar');
        if (avatarContainer && window.currentUserImage) {
            avatarContainer.innerHTML = `<img src="${window.currentUserImage}" alt="Avatar" class="comment-avatar-img">`;
        }
    }

    updateReplyInputAvatar(replyInput) {
        const avatarContainer = replyInput.querySelector('.reply-user-avatar');
        if (avatarContainer && window.currentUserImage) {
            avatarContainer.innerHTML = `<img src="${window.currentUserImage}" alt="Avatar" class="reply-avatar-img">`;
        }
    }

    toggleEmojiPicker() {
        const emojiPicker = document.getElementById('commentEmojiPicker');
        if (emojiPicker) {
            const isVisible = emojiPicker.style.display === 'block';
            emojiPicker.style.display = isVisible ? 'none' : 'block';
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

            return await response.json();
        } catch (error) {
            console.error('❌ API Error fetching comments:', error);
            throw error;
        }
    }

    async fetchReplies(commentId, page) {
        try {
            const url = `/api/comments/${commentId}/replies?page=${page}&size=5`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ API Error fetching replies:', error);
            throw error;
        }
    }

    async createComment(postId, text) {
        try {
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

            return await response.json();
        } catch (error) {
            console.error('❌ API Error creating comment:', error);
            throw error;
        }
    }

    async createReply(commentId, text) {
        try {
            const formData = new FormData();
            formData.append('targetId', this.currentPostId);
            formData.append('parentId', commentId);
            formData.append('text', text);

            const response = await fetch('/api/comments/reply', {
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

            return await response.json();
        } catch (error) {
            console.error('❌ API Error creating reply:', error);
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
            console.error('❌ API Error reacting to comment:', error);
            throw error;
        }
    }
}

// ✅ НЕ инициализираме глобално - ще се инициализира при отваряне на модал
window.CommentsManager = CommentsManager;