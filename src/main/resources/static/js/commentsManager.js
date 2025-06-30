// ====== COMMENTS MANAGER JS С API ИНТЕГРАЦИЯ ======
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
        this.likedComments = new Set();
        this.dislikedComments = new Set();
        this.likedReplies = new Set();
        this.dislikedReplies = new Set();
        this.currentSort = 'newest';
        this.totalComments = 0; // Добавен за правилно броене
        this.repliesPages = new Map(); // Track current page for each comment's replies
        this.repliesHasMore = new Map(); // Track if more replies available

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAutoResize();
    }

    setupEventListeners() {
        // Comments toggle
        const toggleBtn = document.getElementById('commentsToggleBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleComments());
        }

        // Comment input events
        const commentTextarea = document.getElementById('commentTextarea');
        if (commentTextarea) {
            commentTextarea.addEventListener('input', () => this.handleCommentInput());
            commentTextarea.addEventListener('focus', () => this.showCommentActions());
            commentTextarea.addEventListener('keydown', (e) => this.handleCommentKeydown(e));
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

        // Sort functionality - настройка се прави динамично когато се зареди коментарите

        // Global click to close menus
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.comment-menu-dropdown') && !e.target.closest('.comment-menu-btn') &&
                !e.target.closest('.reply-menu-dropdown') && !e.target.closest('.reply-menu-btn')) {
                this.closeAllMenus();
            }
            if (!e.target.closest('#commentEmojiPicker') && !e.target.closest('#commentEmojiBtn') &&
                !e.target.closest('.reply-emoji-picker') && !e.target.closest('.reply-emoji-btn')) {
                this.hideEmojiPicker();
            }
        });

        // Load more comments
        const loadMoreBtn = document.getElementById('loadMoreCommentsBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreComments());
        }
    }

    setupAutoResize() {
        // Auto-resize functionality for textareas
        this.autoResizeTextarea = (textarea) => {
            if (!textarea) return;

            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        };
    }

    // ====== MAIN LOADING METHODS ======

    async loadComments(postId) {
        try {
            this.currentPostId = postId;
            this.isLoading = true;
            this.showLoading();

            const response = await this.fetchComments(postId, 0);

            if (response.success && response.comments) {
                // Clear existing comments
                this.comments.clear();
                this.replies.clear();

                // Add new comments
                response.comments.forEach(comment => this.comments.set(comment.id, comment));

                // Set total comments count from server response
                this.totalComments = response.totalElements;

                // Update UI count displays
                this.updateCommentsCountDisplay(this.totalComments);

                // Render comments
                this.renderComments(response.comments);

                // Setup pagination
                this.currentPage = 0;
                this.hasMoreComments = response.hasNext;
                this.updateLoadMoreButton();

                // Update input avatar
                this.updateCommentInputAvatar();

                // Setup sort functionality
                const sortSelect = document.getElementById('commentsSortSelect');
                if (sortSelect) {
                    sortSelect.value = this.currentSort;
                    sortSelect.onchange = (e) => {
                        this.currentSort = e.target.value;
                        this.loadComments(this.currentPostId);
                    };
                }
            }

        } catch (error) {
            console.error('Error loading comments:', error);
            this.showError('Възникна грешка при зареждането на коментарите.');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    async loadMoreComments() {
        if (this.isLoading || !this.hasMoreComments) return;

        try {
            this.isLoading = true;
            this.showLoadMoreLoading();

            const nextPage = this.currentPage + 1;
            const response = await this.fetchComments(this.currentPostId, nextPage);

            if (response.success && response.comments && response.comments.length > 0) {
                response.comments.forEach(comment => this.comments.set(comment.id, comment));
                this.renderNewComments(response.comments);
                this.currentPage++;
                this.hasMoreComments = response.hasNext;
            } else {
                this.hasMoreComments = false;
            }

            this.updateLoadMoreButton();

        } catch (error) {
            console.error('Error loading more comments:', error);
            this.showToast('Възникна грешка при зареждането на още коментари', 'error');
        } finally {
            this.isLoading = false;
            this.hideLoadMoreLoading();
        }
    }

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
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error fetching comments:', error);
            throw error;
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

    handleCommentKeydown(e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            this.submitComment();
        } else if (e.key === 'Escape') {
            this.cancelComment();
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

                // Update comments count
                this.updateCommentsCount(1);

                this.showToast(response.message || 'Коментарът е добавен успешно!', 'success');
            } else {
                throw new Error(response.error || 'Възникна грешка');
            }

        } catch (error) {
            console.error('Error creating comment:', error);
            this.showToast(error.message || 'Възникна грешка при добавянето на коментара', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Публикувай';
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

    // ====== COMMENTS RENDERING ======

    renderComments(comments) {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;

        // Clear existing comments (except templates and static elements)
        const existingComments = commentsList.querySelectorAll('.comment-item');
        existingComments.forEach(comment => comment.remove());

        // Render all comments
        comments.forEach(comment => this.renderComment(comment));
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
        this.fillCommentHeader(commentElement, comment);
        this.fillCommentContent(commentElement, comment);
        this.fillCommentActions(commentElement, comment);

        // Setup event listeners
        this.setupCommentEventListeners(commentDiv, comment);
        this.setupRepliesControls(commentDiv, comment);

        return commentElement;
    }

    fillCommentHeader(commentElement, comment) {
        const avatar = commentElement.querySelector('.comment-avatar');
        const authorLink = commentElement.querySelector('.comment-author');
        const timeSpan = commentElement.querySelector('.comment-time');
        const onlineStatus = commentElement.querySelector('.comment-online-status');

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
    }

    fillCommentContent(commentElement, comment) {
        const textDiv = commentElement.querySelector('.comment-text');
        const fullTimeSpan = commentElement.querySelector('.comment-full-time');

        if (textDiv) {
            textDiv.textContent = comment.text;
        }

        if (fullTimeSpan) {
            fullTimeSpan.textContent = this.formatFullTime(comment.createdAt);
        }

        // Check if own comment
        if (window.currentUserId && comment.canEdit) {
            const bubble = commentElement.querySelector('.comment-bubble');
            if (bubble) {
                bubble.classList.add('own');
            }
        }
    }

    fillCommentActions(commentElement, comment) {
        const likesCount = commentElement.querySelector('.comment-likes-count');
        const dislikesCount = commentElement.querySelector('.comment-dislikes-count');
        const likeBtn = commentElement.querySelector('.comment-like-btn');
        const dislikeBtn = commentElement.querySelector('.comment-dislike-btn');

        if (likesCount) likesCount.textContent = comment.likesCount || 0;
        if (dislikesCount) dislikesCount.textContent = comment.dislikesCount || 0;

        // Set initial button states based on user reaction
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

        // Show/hide menu for owner
        const menuBtn = commentElement.querySelector('.comment-menu-btn');
        if (menuBtn) {
            menuBtn.style.display = comment.canEdit ? 'flex' : 'none';
        }
    }

    setupCommentEventListeners(commentDiv, comment) {
        // Like button
        const likeBtn = commentDiv.querySelector('.comment-like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => this.toggleCommentLike(comment.id));
        }

        // Dislike button
        const dislikeBtn = commentDiv.querySelector('.comment-dislike-btn');
        if (dislikeBtn) {
            dislikeBtn.addEventListener('click', () => this.toggleCommentDislike(comment.id));
        }

        // Reply button
        const replyBtn = commentDiv.querySelector('.comment-reply-btn');
        if (replyBtn) {
            replyBtn.addEventListener('click', () => this.showReplyInput(comment.id));
        }

        // Menu button
        const menuBtn = commentDiv.querySelector('.comment-menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleCommentMenu(comment.id);
            });
        }

        // Edit button
        const editBtn = commentDiv.querySelector('.edit-comment-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.startEditComment(comment.id));
        }

        // Delete button
        const deleteBtn = commentDiv.querySelector('.delete-comment-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteComment(comment.id));
        }
    }

    setupRepliesControls(commentDiv, comment) {
        const showRepliesBtn = commentDiv.querySelector('.show-replies-btn');
        const hideRepliesBtn = commentDiv.querySelector('.hide-replies-btn');
        const loadMoreRepliesBtn = commentDiv.querySelector('.load-more-replies-btn');

        if (showRepliesBtn) {
            showRepliesBtn.addEventListener('click', () => this.showReplies(comment.id));
        }

        if (hideRepliesBtn) {
            hideRepliesBtn.addEventListener('click', () => this.hideReplies(comment.id));
        }

        if (loadMoreRepliesBtn) {
            loadMoreRepliesBtn.addEventListener('click', () => this.loadMoreReplies(comment.id));
        }

        // Update replies UI based on comment data
        this.updateRepliesControls(commentDiv, comment);
    }

    updateRepliesControls(commentDiv, comment) {
        const showRepliesBtn = commentDiv.querySelector('.show-replies-btn');
        const hideRepliesBtn = commentDiv.querySelector('.hide-replies-btn');
        const repliesCount = commentDiv.querySelector('.replies-count');
        const repliesList = commentDiv.querySelector('.replies-list');

        const hasReplies = comment.repliesCount > 0;
        const repliesVisible = repliesList && repliesList.style.display !== 'none';

        if (showRepliesBtn) {
            showRepliesBtn.style.display = hasReplies && !repliesVisible ? 'flex' : 'none';
        }

        if (hideRepliesBtn) {
            hideRepliesBtn.style.display = hasReplies && repliesVisible ? 'flex' : 'none';
        }

        if (repliesCount) {
            repliesCount.textContent = comment.repliesCount || 0;
        }

        // Update load more replies button
        this.updateLoadMoreRepliesButton(comment.id);
    }

    updateLoadMoreRepliesButton(commentId) {
        const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentDiv) return;

        const loadMoreBtn = commentDiv.querySelector('.load-more-replies-btn');
        const hasMore = this.repliesHasMore.get(commentId);
        const repliesList = commentDiv.querySelector('.replies-list');
        const repliesVisible = repliesList && repliesList.style.display !== 'none';

        if (loadMoreBtn) {
            // Show button only if replies are visible and there are more to load
            loadMoreBtn.style.display = (repliesVisible && hasMore) ? 'flex' : 'none';
        }
    }

    // ====== REPLIES FUNCTIONALITY ======

    async loadReplies(commentId) {
        try {
            const response = await this.fetchReplies(commentId, 0);

            if (response.success && response.comments) {
                this.replies.set(commentId, response.comments);
                this.repliesPages.set(commentId, 0);
                this.repliesHasMore.set(commentId, response.hasNext);
                return response.comments;
            }

            return [];
        } catch (error) {
            console.error('Error loading replies:', error);
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
            console.error('API Error fetching replies:', error);
            throw error;
        }
    }

    async showReplies(commentId) {
        const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentDiv) return;

        const repliesList = commentDiv.querySelector('.replies-list');
        const showBtn = commentDiv.querySelector('.show-replies-btn');
        const hideBtn = commentDiv.querySelector('.hide-replies-btn');

        if (repliesList) {
            // Load replies if not loaded yet
            if (!this.replies.has(commentId)) {
                try {
                    const replies = await this.loadReplies(commentId);

                    // Render all replies (newest first)
                    repliesList.innerHTML = ''; // Clear existing
                    // Sort replies by date (newest first) before rendering
                    const sortedReplies = [...replies].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    sortedReplies.forEach(reply => {
                        const replyElement = this.createReplyElement(reply);
                        if (replyElement) {
                            repliesList.appendChild(replyElement);
                        }
                    });
                } catch (error) {
                    console.error('Error loading replies:', error);
                    this.showToast('Грешка при зареждане на отговорите', 'error');
                    return;
                }
            }

            // Show replies
            repliesList.style.display = 'block';
            if (showBtn) showBtn.style.display = 'none';
            if (hideBtn) hideBtn.style.display = 'flex';
        }
    }

    hideReplies(commentId) {
        const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentDiv) return;

        const repliesList = commentDiv.querySelector('.replies-list');
        const showBtn = commentDiv.querySelector('.show-replies-btn');
        const hideBtn = commentDiv.querySelector('.hide-replies-btn');

        if (repliesList) {
            repliesList.style.display = 'none';
            if (showBtn) showBtn.style.display = 'flex';
            if (hideBtn) hideBtn.style.display = 'none';

            // Hide load more button
            this.updateLoadMoreRepliesButton(commentId);
        }
    }

    async loadMoreReplies(commentId) {
        const currentPage = this.repliesPages.get(commentId) || 0;
        const hasMore = this.repliesHasMore.get(commentId);

        if (!hasMore) {
            console.log('No more replies to load for comment:', commentId);
            return;
        }

        try {
            const nextPage = currentPage + 1;
            const response = await this.fetchReplies(commentId, nextPage);

            if (response.success && response.comments && response.comments.length > 0) {
                // Add new replies to existing ones
                const existingReplies = this.replies.get(commentId) || [];
                const updatedReplies = [...existingReplies, ...response.comments];
                this.replies.set(commentId, updatedReplies);

                // Update pagination tracking
                this.repliesPages.set(commentId, nextPage);
                this.repliesHasMore.set(commentId, response.hasNext);

                // Render new replies
                const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
                if (commentDiv) {
                    const repliesList = commentDiv.querySelector('.replies-list');
                    if (repliesList) {
                        response.comments.forEach(reply => {
                            const replyElement = this.createReplyElement(reply);
                            if (replyElement) {
                                repliesList.appendChild(replyElement);
                            }
                        });
                    }
                }

                // Update load more button visibility
                this.updateLoadMoreRepliesButton(commentId);

                console.log(`Loaded ${response.comments.length} more replies for comment ${commentId}`);
            } else {
                this.repliesHasMore.set(commentId, false);
                this.updateLoadMoreRepliesButton(commentId);
            }

        } catch (error) {
            console.error('Error loading more replies:', error);
            this.showToast('Възникна грешка при зареждането на още отговори', 'error');
        }
    }

    renderReply(commentDiv, reply) {
        const repliesList = commentDiv.querySelector('.replies-list');
        if (!repliesList) return;

        const replyElement = this.createReplyElement(reply);

        // Insert new reply at the beginning (first position)
        const firstReply = repliesList.querySelector('.reply-item');
        if (firstReply) {
            repliesList.insertBefore(replyElement, firstReply);
        } else {
            repliesList.appendChild(replyElement);
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

        // Setup event listeners
        this.setupReplyEventListeners(replyDiv, reply);

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

        // Reply counts and button states
        const likesCount = replyElement.querySelector('.reply-likes-count');
        const dislikesCount = replyElement.querySelector('.reply-dislikes-count');
        const likeBtn = replyElement.querySelector('.reply-like-btn');
        const dislikeBtn = replyElement.querySelector('.reply-dislike-btn');

        if (likesCount) likesCount.textContent = reply.likesCount || 0;
        if (dislikesCount) dislikesCount.textContent = reply.dislikesCount || 0;

        // Set initial button states based on user reaction
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

        // Check if own reply
        if (reply.canEdit) {
            const bubble = replyElement.querySelector('.reply-bubble');
            if (bubble) {
                bubble.classList.add('own');
            }
        }

          // Show/hide menu based on permissions
        const menuBtn = replyElement.querySelector('.reply-menu-btn');
        if (menuBtn) {
            menuBtn.style.display = reply.canEdit ? 'flex' : 'none';
        }
    }

    setupReplyEventListeners(replyDiv, reply) {
        // Like button
        const likeBtn = replyDiv.querySelector('.reply-like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => this.toggleReplyLike(reply.id));
        }

        // Dislike button
        const dislikeBtn = replyDiv.querySelector('.reply-dislike-btn');
        if (dislikeBtn) {
            dislikeBtn.addEventListener('click', () => this.toggleReplyDislike(reply.id));
        }

        // Menu button
        const menuBtn = replyDiv.querySelector('.reply-menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleReplyMenu(reply.id);
            });
        }

        // Edit button
        const editBtn = replyDiv.querySelector('.edit-reply-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.startEditReply(reply.id));
        }

        // Delete button
        const deleteBtn = replyDiv.querySelector('.delete-reply-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteReply(reply.id));
        }
    }

    // ====== ПОПРАВЕНИ МЕТОДИ ЗА LIKE/DISLIKE НА ОТГОВОРИ ======

    async toggleReplyLike(replyId) {
        if (!window.isAuthenticated) {
            this.showLoginPrompt();
            return;
        }

        try {
            const response = await this.reactToComment(replyId, 'LIKE');

            if (response.success) {
                // Update reply data in replies collection
                const reply = this.findReplyById(replyId);
                if (reply) {
                    reply.likesCount = response.likesCount;
                    reply.dislikesCount = response.dislikesCount;
                    reply.userReaction = response.userReaction;
                }
                this.updateReplyActions(replyId);
            }

        } catch (error) {
            console.error('Error toggling reply like:', error);
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
                // Update reply data in replies collection
                const reply = this.findReplyById(replyId);
                if (reply) {
                    reply.likesCount = response.likesCount;
                    reply.dislikesCount = response.dislikesCount;
                    reply.userReaction = response.userReaction;
                }
                this.updateReplyActions(replyId);
            }

        } catch (error) {
            console.error('Error toggling reply dislike:', error);
            this.showToast('Възникна грешка при дислайкването', 'error');
        }
    }

    // Helper методи за отговори
    findReplyById(replyId) {
        for (let [commentId, replies] of this.replies) {
            const reply = replies.find(r => r.id === replyId);
            if (reply) return reply;
        }
        return null;
    }

    updateReplyActions(replyId) {
        const replyElement = document.querySelector(`[data-reply-id="${replyId}"]`);
        if (!replyElement) return;

        const reply = this.findReplyById(replyId);
        if (!reply) return;

        const likeBtn = replyElement.querySelector('.reply-like-btn');
        const dislikeBtn = replyElement.querySelector('.reply-dislike-btn');
        const likesCount = replyElement.querySelector('.reply-likes-count');
        const dislikesCount = replyElement.querySelector('.reply-dislikes-count');

        if (likesCount) likesCount.textContent = reply.likesCount || 0;
        if (dislikesCount) dislikesCount.textContent = reply.dislikesCount || 0;

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
    }

    toggleReplyMenu(replyId) {
        const replyDiv = document.querySelector(`[data-reply-id="${replyId}"]`);
        if (!replyDiv) return;

        const dropdown = replyDiv.querySelector('.reply-menu-dropdown');
        if (dropdown) {
            const isVisible = dropdown.style.display === 'block';

            // Close all other menus
            document.querySelectorAll('.reply-menu-dropdown, .comment-menu-dropdown').forEach(menu => {
                menu.style.display = 'none';
            });

            dropdown.style.display = isVisible ? 'none' : 'block';
        }
    }

    closeAllMenus() {
        document.querySelectorAll('.comment-menu-dropdown, .reply-menu-dropdown').forEach(menu => {
            menu.style.display = 'none';
        });
    }

    async startEditReply(replyId) {
        const replyDiv = document.querySelector(`[data-reply-id="${replyId}"]`);
        if (!replyDiv) return;

        const reply = this.findReplyById(replyId);
        if (!reply) return;

        const bubble = replyDiv.querySelector('.reply-bubble');
        const editForm = replyDiv.querySelector('.edit-reply-form, .edit-comment-form');

        if (bubble && editForm) {
            // Hide bubble, show edit form
            bubble.style.display = 'none';
            editForm.style.display = 'block';

            // Fill textarea with current text
            const textarea = editForm.querySelector('.edit-reply-textarea, .edit-comment-textarea');
            if (textarea) {
                textarea.value = reply.text;
                textarea.focus();
                this.autoResizeTextarea(textarea);
            }

            // Setup edit form buttons
            this.setupEditReplyFormButtons(replyId, editForm);
        }

        // Close menu
        this.toggleReplyMenu(replyId);
    }

    setupEditReplyFormButtons(replyId, editForm) {
        const saveBtn = editForm.querySelector('.edit-reply-save-btn, .edit-save-btn');
        const cancelBtn = editForm.querySelector('.edit-reply-cancel-btn, .edit-cancel-btn');

        if (saveBtn) {
            // Remove existing listeners
            saveBtn.onclick = null;
            saveBtn.addEventListener('click', () => this.saveEditReply(replyId));
        }

        if (cancelBtn) {
            // Remove existing listeners
            cancelBtn.onclick = null;
            cancelBtn.addEventListener('click', () => this.cancelEditReply(replyId));
        }
    }

    async saveEditReply(replyId) {
        const replyDiv = document.querySelector(`[data-reply-id="${replyId}"]`);
        if (!replyDiv) return;

        const editForm = replyDiv.querySelector('.edit-reply-form, .edit-comment-form');
        const textarea = editForm.querySelector('.edit-reply-textarea, .edit-comment-textarea');

        if (!textarea) return;

        const newText = textarea.value.trim();
        if (!newText) {
            this.showToast('Отговорът не може да бъде празен', 'error');
            return;
        }

        try {
            const response = await this.updateComment(replyId, newText);

            if (response.success) {
                // Update reply in memory
                const reply = this.findReplyById(replyId);
                if (reply) {
                    reply.text = newText;
                    reply.edited = true;
                }

                // Update UI
                const textDiv = replyDiv.querySelector('.reply-text');
                if (textDiv) {
                    textDiv.textContent = newText;
                }

                // Hide edit form, show bubble
                const bubble = replyDiv.querySelector('.reply-bubble');
                if (bubble) {
                    bubble.style.display = 'block';
                    editForm.style.display = 'none';
                }

                this.showToast(response.message || 'Отговорът е обновен успешно!', 'success');
            } else {
                throw new Error(response.error || 'Възникна грешка');
            }

        } catch (error) {
            console.error('Error updating reply:', error);
            this.showToast(error.message || 'Възникна грешка при обновяването', 'error');
        }
    }

    cancelEditReply(replyId) {
        const replyDiv = document.querySelector(`[data-reply-id="${replyId}"]`);
        if (!replyDiv) return;

        const bubble = replyDiv.querySelector('.reply-bubble');
        const editForm = replyDiv.querySelector('.edit-reply-form, .edit-comment-form');

        if (bubble && editForm) {
            bubble.style.display = 'block';
            editForm.style.display = 'none';
        }
    }

    async deleteReply(replyId) {
        if (!confirm('Сигурни ли сте, че искате да изтриете отговора?')) return;

        try {
            const response = await this.removeComment(replyId);

            if (response.success) {
                // Remove from memory
                for (let [commentId, replies] of this.replies) {
                    const index = replies.findIndex(r => r.id === replyId);
                    if (index !== -1) {
                        replies.splice(index, 1);

                        // Update parent comment replies count
                        const comment = this.comments.get(commentId);
                        if (comment) {
                            comment.repliesCount = Math.max(0, (comment.repliesCount || 0) - 1);
                            this.updateRepliesControls(
                                document.querySelector(`[data-comment-id="${commentId}"]`),
                                comment
                            );
                        }
                        break;
                    }
                }

                // Remove from DOM
                const replyDiv = document.querySelector(`[data-reply-id="${replyId}"]`);
                if (replyDiv) {
                    replyDiv.remove();
                }

                this.showToast(response.message || 'Отговорът е изтрит успешно!', 'success');
            } else {
                throw new Error(response.error || 'Възникна грешка');
            }

        } catch (error) {
            console.error('Error deleting reply:', error);
            this.showToast(error.message || 'Възникна грешка при изтриването', 'error');
        }
    }

    // ====== COMMENT INTERACTIONS ======

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
            console.error('Error toggling comment like:', error);
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
            console.error('Error toggling comment dislike:', error);
            this.showToast('Възникна грешка при дислайкването', 'error');
        }
    }

    async reactToComment(commentId, type) {
        try {
            const response = await fetch(`/api/comments/${commentId}/reaction/${type}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
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
            console.error('API Error reacting to comment:', error);
            throw error;
        }
    }

    updateCommentActions(commentId) {
        const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentDiv) return;

        const comment = this.comments.get(commentId);
        if (!comment) return;

        const likeBtn = commentDiv.querySelector('.comment-like-btn');
        const dislikeBtn = commentDiv.querySelector('.comment-dislike-btn');
        const likesCount = commentDiv.querySelector('.comment-likes-count');
        const dislikesCount = commentDiv.querySelector('.comment-dislikes-count');

        if (likesCount) likesCount.textContent = comment.likesCount || 0;
        if (dislikesCount) dislikesCount.textContent = comment.dislikesCount || 0;

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

    // ====== REPLY INPUT HANDLING ======

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
        const emojiBtn = replyInput.querySelector('.reply-emoji-btn');

        if (textarea) {
            // Auto-resize and validation
            textarea.addEventListener('input', () => {
                this.autoResizeTextarea(textarea);
                const hasText = textarea.value.trim().length > 0;
                if (submitBtn) submitBtn.disabled = !hasText;
            });

            // Keyboard shortcuts
            textarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    this.submitReply(commentId);
                } else if (e.key === 'Escape') {
                    this.cancelReply(commentId);
                }
            });
        }

        if (submitBtn) {
            submitBtn.onclick = () => this.submitReply(commentId);
        }

        if (cancelBtn) {
            cancelBtn.onclick = () => this.cancelReply(commentId);
        }

        if (emojiBtn) {
            emojiBtn.onclick = () => this.toggleReplyEmojiPicker(commentId);
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
            const response = await this.createReply(this.currentPostId, commentId, text);

            if (response.success) {
                // Add to replies (at the beginning for newest-first order)
                if (!this.replies.has(commentId)) {
                    this.replies.set(commentId, []);
                }
                this.replies.get(commentId).unshift(response.comment); // unshift adds to beginning

                // Update comment replies count
                const comment = this.comments.get(commentId);
                if (comment) {
                    comment.repliesCount = (comment.repliesCount || 0) + 1;
                }

                // Show replies if hidden
                await this.showReplies(commentId);

                // Render new reply
                this.renderReply(commentDiv, response.comment);

                // Clear input
                textarea.value = '';
                this.cancelReply(commentId);

                this.showToast(response.message || 'Отговорът е добавен успешно!', 'success');
            } else {
                throw new Error(response.error || 'Възникна грешка');
            }

        } catch (error) {
            console.error('Error creating reply:', error);
            this.showToast(error.message || 'Възникна грешка при добавянето на отговора', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Отговори';
        }
    }

    async createReply(postId, commentId, text) {
        try {
            const response = await fetch('/api/comments/reply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest',
                    [window.appData.csrfHeader]: window.appData.csrfToken
                },
                body: new URLSearchParams({
                    targetId: postId,
                    text: text,
                    parentId: commentId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error creating reply:', error);
            throw error;
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

    // ====== COMMENT MANAGEMENT ======

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

    closeAllMenus() {
        document.querySelectorAll('.comment-menu-dropdown').forEach(menu => {
            menu.style.display = 'none';
        });
    }

    startEditComment(commentId) {
        const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentDiv) return;

        const comment = this.comments.get(commentId);
        if (!comment) return;

        const bubble = commentDiv.querySelector('.comment-bubble');
        const editForm = commentDiv.querySelector('.edit-comment-form');

        if (bubble && editForm) {
            // Hide bubble, show edit form
            bubble.style.display = 'none';
            editForm.style.display = 'block';

            // Fill textarea with current text
            const textarea = editForm.querySelector('.edit-comment-textarea');
            if (textarea) {
                textarea.value = comment.text;
                textarea.focus();
                this.autoResizeTextarea(textarea);
            }

            // Setup edit form buttons
            this.setupEditFormButtons(commentId, editForm);
        }

        // Close menu
        this.toggleCommentMenu(commentId);
    }

    setupEditFormButtons(commentId, editForm) {
        const saveBtn = editForm.querySelector('.edit-save-btn');
        const cancelBtn = editForm.querySelector('.edit-cancel-btn');

        if (saveBtn) {
            saveBtn.onclick = () => this.saveEditComment(commentId);
        }

        if (cancelBtn) {
            cancelBtn.onclick = () => this.cancelEditComment(commentId);
        }
    }

    async saveEditComment(commentId) {
        const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentDiv) return;

        const editForm = commentDiv.querySelector('.edit-comment-form');
        const textarea = editForm.querySelector('.edit-comment-textarea');

        if (!textarea) return;

        const newText = textarea.value.trim();
        if (!newText) {
            this.showToast('Коментарът не може да бъде празен', 'error');
            return;
        }

        try {
            const response = await this.updateComment(commentId, newText);

            if (response.success) {
                // Update comment in memory
                const comment = this.comments.get(commentId);
                if (comment) {
                    comment.text = newText;
                    comment.edited = true;
                }

                // Update UI
                const textDiv = commentDiv.querySelector('.comment-text');
                if (textDiv) {
                    textDiv.textContent = newText;
                }

                // Hide edit form, show bubble
                const bubble = commentDiv.querySelector('.comment-bubble');
                if (bubble) {
                    bubble.style.display = 'block';
                    editForm.style.display = 'none';
                }

                this.showToast(response.message || 'Коментарът е обновен успешно!', 'success');
            } else {
                throw new Error(response.error || 'Възникна грешка');
            }

        } catch (error) {
            console.error('Error updating comment:', error);
            this.showToast(error.message || 'Възникна грешка при обновяването', 'error');
        }
    }

    cancelEditComment(commentId) {
        const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentDiv) return;

        const bubble = commentDiv.querySelector('.comment-bubble');
        const editForm = commentDiv.querySelector('.edit-comment-form');

        if (bubble && editForm) {
            bubble.style.display = 'block';
            editForm.style.display = 'none';
        }
    }

    async deleteComment(commentId) {
        if (!confirm('Сигурни ли сте, че искате да изтриете коментара?')) return;

        try {
            const response = await this.removeComment(commentId);

            if (response.success) {
                // Remove from memory
                this.comments.delete(commentId);

                // Remove from DOM
                const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
                if (commentDiv) {
                    commentDiv.remove();
                }

                // Update count
                this.updateCommentsCount(-1);

                this.showToast(response.message || 'Коментарът е изтрит успешно!', 'success');
            } else {
                throw new Error(response.error || 'Възникна грешка');
            }

        } catch (error) {
            console.error('Error deleting comment:', error);
            this.showToast(error.message || 'Възникна грешка при изтриването', 'error');
        }
    }

    // ====== API METHODS ======

    async createComment(postId, text) {
        try {
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest',
                    [window.appData.csrfHeader]: window.appData.csrfToken
                },
                body: new URLSearchParams({
                    targetId: postId,
                    text: text
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error creating comment:', error);
            throw error;
        }
    }

    async updateComment(commentId, newText) {
        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    [window.appData.csrfHeader]: window.appData.csrfToken
                },
                body: JSON.stringify({ text: newText })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error updating comment:', error);
            throw error;
        }
    }

    async removeComment(commentId) {
        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
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
            console.error('API Error deleting comment:', error);
            throw error;
        }
    }

    // ====== COMMENTS TOGGLE ======

    toggleComments() {
        const commentsList = document.getElementById('commentsList');
        const toggleBtn = document.getElementById('commentsToggleBtn');

        if (!commentsList || !toggleBtn) return;

        this.isCommentsVisible = !this.isCommentsVisible;

        commentsList.classList.toggle('collapsed', !this.isCommentsVisible);
        toggleBtn.classList.toggle('collapsed', !this.isCommentsVisible);

        const icon = toggleBtn.querySelector('i');
        const text = toggleBtn.querySelector('span');

        if (icon && text) {
            if (this.isCommentsVisible) {
                icon.className = 'bi bi-chevron-down';
                text.textContent = 'Скрий коментарите';
            } else {
                icon.className = 'bi bi-chevron-right';
                text.textContent = 'Покажи коментарите';
            }
        }
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

    showLoadMoreLoading() {
        const loadMoreBtn = document.getElementById('loadMoreCommentsBtn');
        if (loadMoreBtn) {
            loadMoreBtn.disabled = true;
            loadMoreBtn.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div> Зареждане...';
        }
    }

    hideLoadMoreLoading() {
        const loadMoreBtn = document.getElementById('loadMoreCommentsBtn');
        if (loadMoreBtn) {
            loadMoreBtn.disabled = false;
            loadMoreBtn.innerHTML = 'Зареди още коментари';
        }
    }

    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreCommentsBtn');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = this.hasMoreComments ? 'block' : 'none';
        }
    }

    showNoComments() {
        const noComments = document.getElementById('noCommentsMessage');
        if (noComments) noComments.style.display = 'block';
    }

    hideNoComments() {
        const noComments = document.getElementById('noCommentsMessage');
        if (noComments) noComments.style.display = 'none';
    }

    showError(message) {
        const errorDiv = document.getElementById('commentsError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    hideError() {
        const errorDiv = document.getElementById('commentsError');
        if (errorDiv) errorDiv.style.display = 'none';
    }

    // ====== EMOJI FUNCTIONALITY ======

    // ====== EMOJI FUNCTIONALITY ======

    toggleEmojiPicker() {
        const emojiPicker = document.getElementById('commentEmojiPicker');
        if (emojiPicker) {
            const isVisible = emojiPicker.style.display === 'block';
            emojiPicker.style.display = isVisible ? 'none' : 'block';

            if (!isVisible) {
                this.setupEmojiPicker(emojiPicker, 'commentTextarea');
            }
        }
    }

    toggleReplyEmojiPicker(commentId) {
        const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentDiv) return;

        const emojiPicker = commentDiv.querySelector('.reply-emoji-picker');
        if (emojiPicker) {
            const isVisible = emojiPicker.style.display === 'block';
            emojiPicker.style.display = isVisible ? 'none' : 'block';

            if (!isVisible) {
                const textarea = commentDiv.querySelector('.reply-textarea');
                this.setupEmojiPicker(emojiPicker, textarea);
            }
        }
    }

    setupEmojiPicker(picker, textareaOrId) {
        if (!picker) return;

        // Clear existing content
        picker.innerHTML = '';

        // Common emojis
        const emojis = ['😀', '😂', '🤔', '👍', '👎', '❤️', '😍', '😢', '😡', '🎉', '🔥', '💯', '🙏', '👏', '🤝', '💪'];

        emojis.forEach(emoji => {
            const span = document.createElement('span');
            span.className = 'emoji-item';
            span.textContent = emoji;
            span.style.cursor = 'pointer';
            span.style.padding = '5px';
            span.style.fontSize = '18px';
            span.addEventListener('click', () => {
                this.insertEmojiIntoTextarea(emoji, textareaOrId);
                picker.style.display = 'none';
            });
            picker.appendChild(span);
        });
    }

    insertEmojiIntoTextarea(emoji, textareaOrId) {
        let textarea;
        if (typeof textareaOrId === 'string') {
            textarea = document.getElementById(textareaOrId);
        } else {
            textarea = textareaOrId;
        }

        if (textarea && emoji) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;

            textarea.value = text.substring(0, start) + emoji + text.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + emoji.length;

            // Trigger input event
            textarea.dispatchEvent(new Event('input'));
            textarea.focus();
        }
    }

    hideEmojiPicker() {
        const emojiPicker = document.getElementById('commentEmojiPicker');
        if (emojiPicker) {
            emojiPicker.style.display = 'none';
        }

        // Hide all reply emoji pickers
        document.querySelectorAll('.reply-emoji-picker').forEach(picker => {
            picker.style.display = 'none';
        });
    }

    insertEmoji(emoji) {
        this.insertEmojiIntoTextarea(emoji, 'commentTextarea');
        this.hideEmojiPicker();
    }

    // ====== ПОПРАВЕНИ МЕТОДИ ЗА БРОЕНЕ НА КОМЕНТАРИ ======

    updateCommentsCount(delta) {
        this.totalComments = Math.max(0, this.totalComments + delta);
        this.updateCommentsCountDisplay(this.totalComments);
    }

    updateCommentsCountDisplay(count) {
        // Calculate total including replies
        let totalWithReplies = count;

        // Add replies count
        for (let [commentId, replies] of this.replies) {
            totalWithReplies += replies.length;
        }

        // Also add repliesCount from comments data
        for (let [commentId, comment] of this.comments) {
            if (comment.repliesCount && !this.replies.has(commentId)) {
                totalWithReplies += comment.repliesCount;
            }
        }

        // Update count in comments header
        const headerCount = document.getElementById('commentsHeaderCount');
        if (headerCount) {
            headerCount.textContent = totalWithReplies;
        }

        // Update count in modal header
        const modalHeaderCount = document.getElementById('modalCommentsCount');
        if (modalHeaderCount) {
            modalHeaderCount.textContent = totalWithReplies;
        }

        // Update count in main feed
        if (this.currentPostId) {
            const postElement = document.querySelector(`[data-post-id="${this.currentPostId}"]`);
            if (postElement) {
                const commentStatsCount = postElement.querySelector('.comment-stats-count');
                if (commentStatsCount) {
                    commentStatsCount.textContent = totalWithReplies;
                }
            }
        }
    }

    updateCommentInputAvatar() {
        const avatar = document.getElementById('commentUserAvatar');
        if (avatar && window.currentUserImage && window.currentUsername) {
            const avatarHTML = window.avatarUtils ?
                window.avatarUtils.createAvatar(
                    window.currentUserImage,
                    window.currentUsername,
                    32,
                    'comment-user-avatar'
                ) :
                `<img src="${window.currentUserImage}" alt="${window.currentUsername}" style="width:32px;height:32px;border-radius:50%;">`;
            avatar.innerHTML = avatarHTML;
        }
    }

    updateReplyInputAvatar(replyInput) {
        const avatar = replyInput.querySelector('.reply-user-avatar');
        if (avatar && window.currentUserImage && window.currentUsername) {
            const avatarHTML = window.avatarUtils ?
                window.avatarUtils.createAvatar(
                    window.currentUserImage,
                    window.currentUsername,
                    28,
                    'reply-user-avatar'
                ) :
                `<img src="${window.currentUserImage}" alt="${window.currentUsername}" style="width:28px;height:28px;border-radius:50%;">`;
            avatar.innerHTML = avatarHTML;
        }
    }

    // ====== UTILITY METHODS ======

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'току-що';
        if (minutes < 60) return `${minutes}м`;
        if (hours < 24) return `${hours}ч`;
        if (days < 7) return `${days}д`;

        return date.toLocaleDateString('bg-BG');
    }

    formatFullTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('bg-BG');
    }

    showLoginPrompt() {
        if (window.showLoginWarning) {
            window.showLoginWarning();
        } else {
            alert('Моля, влезте в профила си за да коментирате.');
        }
    }

    showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // ====== PUBLIC API ======

    getCommentsCount() {
        return this.totalComments;
    }

    getComment(commentId) {
        return this.comments.get(commentId);
    }

    hasComments() {
        return this.comments.size > 0;
    }

    scrollToComment(commentId) {
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement) {
            commentElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            // Highlight comment briefly
            commentElement.style.backgroundColor = 'rgba(75, 177, 92, 0.1)';
            setTimeout(() => {
                commentElement.style.backgroundColor = '';
            }, 2000);
        }
    }

    cleanup() {
        this.comments.clear();
        this.replies.clear();
        this.repliesPages.clear();
        this.repliesHasMore.clear();
        this.currentPostId = null;
        this.isLoading = false;
        this.hasMoreComments = true;
        this.currentPage = 0;
        this.totalComments = 0;
    }
}

// CSS Animation for slide out
const slideOutAnimation = `
@keyframes slideOutRight {
    from {
        opacity: 1;
        transform: translateX(0);
    }
    to {
        opacity: 0;
        transform: translateX(100%);
    }
}
`;

// Add animation to document
if (!document.querySelector('#comments-animations')) {
    const style = document.createElement('style');
    style.id = 'comments-animations';
    style.textContent = slideOutAnimation;
    document.head.appendChild(style);
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.commentsManager = new CommentsManager();
    } catch (error) {
        console.error('Failed to initialize CommentsManager:', error);
    }
});