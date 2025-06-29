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

        // Close emoji picker when clicking outside
        document.addEventListener('click', (e) => {
            const emojiPicker = document.getElementById('commentEmojiPicker');
            const emojiBtn = document.getElementById('commentEmojiBtn');

            if (emojiPicker && emojiPicker.style.display === 'block' &&
                !emojiPicker.contains(e.target) && !emojiBtn.contains(e.target)) {
                emojiPicker.style.display = 'none';
            }
        });

        // Close comment menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.comment-menu-btn')) {
                document.querySelectorAll('.comment-menu-dropdown').forEach(menu => {
                    menu.style.display = 'none';
                });
            }
        });
    }

    setupAutoResize() {
        // Auto-resize textareas
        document.addEventListener('input', (e) => {
            if (e.target.matches('.comment-textarea, .reply-textarea, .edit-comment-textarea, .edit-reply-textarea')) {
                this.autoResizeTextarea(e.target);
            }
        });
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    // ====== MAIN COMMENTS FUNCTIONALITY ======

    async loadComments(postId) {
        if (this.isLoading) return;

        this.currentPostId = postId;
        this.currentPage = 0;
        this.hasMoreComments = true;
        this.comments.clear();
        this.replies.clear();

        this.showLoading();
        this.hideNoComments();
        this.hideError();

        try {
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

            // Update user avatar in comment input
            this.updateCommentInputAvatar();

        } catch (error) {
            console.error('Error loading comments:', error);
            this.showError();
        } finally {
            this.hideLoading();
        }
    }

    async loadMoreComments() {
        if (this.isLoading || !this.hasMoreComments || !this.currentPostId) return;

        this.isLoading = true;
        this.showLoadMoreLoading();

        try {
            const response = await this.fetchComments(this.currentPostId, this.currentPage);

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

                // Update comments count in modal
                this.updateCommentsCount(1);

                this.showToast(response.message || 'Коментарът е добавен успешно!', 'success');
            } else {
                throw new Error(response.error || 'Възникна грешка');
            }

        } catch (error) {
            console.error('Error creating comment:', error);
            this.showToast(error.message || 'Възникна грешка при добавянето на коментара', 'error');
        } finally {
            // Reset button
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Коментирай';
        }
    }

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

    cancelComment() {
        const textarea = document.getElementById('commentTextarea');
        if (textarea) {
            textarea.value = '';
            this.hideCommentActions();
            this.autoResizeTextarea(textarea);
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

    // ====== COMMENTS RENDERING ======

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

        // Fill author info
        this.fillCommentAuthorInfo(commentElement, comment);

        // Fill comment content
        this.fillCommentContent(commentElement, comment);

        // Fill comment stats and actions
        this.fillCommentActions(commentElement, comment);

        // Setup event listeners
        this.setupCommentEventListeners(commentDiv, comment);

        // Setup replies functionality
        this.setupRepliesControls(commentDiv, comment);

        return commentElement;
    }

    fillCommentAuthorInfo(commentElement, comment) {
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

        if (likesCount) likesCount.textContent = comment.likesCount || 0;
        if (dislikesCount) dislikesCount.textContent = comment.dislikesCount || 0;

        // Update button states
        const likeBtn = commentElement.querySelector('.comment-like-btn');
        const dislikeBtn = commentElement.querySelector('.comment-dislike-btn');

        if (likeBtn) {
            const isLiked = comment.userReaction === 'LIKE';
            if (isLiked) {
                likeBtn.classList.add('liked');
                likeBtn.querySelector('i').className = 'bi bi-hand-thumbs-up-fill';
            }
        }

        if (dislikeBtn) {
            const isDisliked = comment.userReaction === 'DISLIKE';
            if (isDisliked) {
                dislikeBtn.classList.add('disliked');
                dislikeBtn.querySelector('i').className = 'bi bi-hand-thumbs-down-fill';
            }
        }

        // Show/hide menu for owner
        const menuBtn = commentElement.querySelector('.comment-menu-btn');
        if (menuBtn && comment.canEdit) {
            menuBtn.style.display = 'flex';
        } else if (menuBtn) {
            menuBtn.style.display = 'none';
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
                await this.loadReplies(commentId);
            }

            // Show replies
            repliesList.style.display = 'block';
            showBtn.style.display = 'none';
            hideBtn.style.display = 'flex';
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
            showBtn.style.display = 'flex';
            hideBtn.style.display = 'none';
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
            console.error('API Error reacting to comment:', error);
            throw error;
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

    // ====== ОСТНАЛИТЕ МЕТОДИ ОСТАВАТ СЪЩИТЕ ======

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
                // Add to replies
                if (!this.replies.has(commentId)) {
                    this.replies.set(commentId, []);
                }
                this.replies.get(commentId).push(response.comment);

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

    async updateComment(commentId, text) {
        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    [window.appData.csrfHeader]: window.appData.csrfToken
                },
                body: JSON.stringify({ text: text })
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
        try {
            const result = await Swal.fire({
                title: 'Сигурни ли сте?',
                text: 'Този коментар ще бъде изтрит завинаги!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#e74c3c',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Да, изтрий',
                cancelButtonText: 'Отказ'
            });

            if (!result.isConfirmed) return;

            const response = await this.deleteCommentFromAPI(commentId);

            if (response.success) {
                // Remove from UI
                const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
                if (commentDiv) {
                    commentDiv.style.animation = 'slideOutRight 0.3s ease-out';
                    setTimeout(() => {
                        commentDiv.remove();
                    }, 300);
                }

                // Remove from memory
                this.comments.delete(commentId);

                // Update comments count
                this.updateCommentsCount(-1);

                this.showToast(response.message || 'Коментарът е изтрит успешно', 'success');
            } else {
                throw new Error(response.error || 'Възникна грешка');
            }

        } catch (error) {
            console.error('Error deleting comment:', error);
            this.showToast(error.message || 'Възникна грешка при изтриването', 'error');
        }
    }

    async deleteCommentFromAPI(commentId) {
        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
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
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div> Зареждане...';
            loadMoreBtn.disabled = true;
        }
    }

    hideLoadMoreLoading() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.innerHTML = 'Покажи още коментари';
            loadMoreBtn.disabled = false;
        }
    }

    showNoComments() {
        const noComments = document.getElementById('noCommentsMessage');
        if (noComments) noComments.style.display = 'block';

        this.hideLoading();
        this.hideError();
    }

    hideNoComments() {
        const noComments = document.getElementById('noCommentsMessage');
        if (noComments) noComments.style.display = 'none';
    }

    showError() {
        const error = document.getElementById('commentsError');
        if (error) error.style.display = 'block';

        this.hideLoading();
        this.hideNoComments();
    }

    hideError() {
        const error = document.getElementById('commentsError');
        if (error) error.style.display = 'none';
    }

    updateLoadMoreButton() {
        const loadMoreContainer = document.getElementById('loadMoreComments');
        if (loadMoreContainer) {
            loadMoreContainer.style.display = this.hasMoreComments ? 'block' : 'none';
        }
    }

    updateCommentsCount(delta) {
        // Update count in comments header
        const headerCount = document.getElementById('commentsHeaderCount');
        if (headerCount) {
            const currentCount = parseInt(headerCount.textContent) || 0;
            const newCount = Math.max(0, currentCount + delta);
            headerCount.textContent = newCount;
        }

        // Update count in modal header
        const modalHeaderCount = document.getElementById('modalCommentsCount');
        if (modalHeaderCount) {
            const currentCount = parseInt(modalHeaderCount.textContent) || 0;
            const newCount = Math.max(0, currentCount + delta);
            modalHeaderCount.textContent = newCount;
        }

        // Update count in main feed
        if (this.currentPostId && window.publicationsManager) {
            const postElement = document.querySelector(`[data-post-id="${this.currentPostId}"]`);
            if (postElement) {
                const commentStatsCount = postElement.querySelector('.comment-stats-count');
                if (commentStatsCount) {
                    const currentCount = parseInt(commentStatsCount.textContent) || 0;
                    const newCount = Math.max(0, currentCount + delta);
                    commentStatsCount.textContent = newCount;
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

        if (diffInSeconds < 60) return 'сега';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}м`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}ч`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}д`;

        return date.toLocaleDateString('bg-BG', {
            day: 'numeric',
            month: 'short'
        });
    }

    formatFullTime(dateInput) {
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

        return date.toLocaleDateString('bg-BG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showToast(message, type = 'success') {
        if (window.postInteractions) {
            window.postInteractions.showToast(message, type);
        } else if (typeof Swal !== 'undefined') {
            Swal.fire({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                icon: type,
                title: message
            });
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    showLoginPrompt() {
        if (window.postInteractions) {
            window.postInteractions.showLoginPrompt();
        } else if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'info',
                title: 'Вход необходим',
                text: 'Моля, влезте в профила си за да коментирате.',
                confirmButtonText: 'Вход',
                showCancelButton: true,
                confirmButtonColor: '#4cb15c'
            }).then((result) => {
                if (result.isConfirmed) {
                    document.querySelector('[data-bs-target="#loginModal"]')?.click();
                }
            });
        }
    }

    retryLoadComments() {
        if (this.currentPostId) {
            this.loadComments(this.currentPostId);
        }
    }

    // ====== PUBLIC API ======

    clearComments() {
        this.currentPostId = null;
        this.comments.clear();
        this.replies.clear();
        this.likedComments.clear();
        this.dislikedComments.clear();
        this.likedReplies.clear();
        this.dislikedReplies.clear();
        this.currentPage = 0;
        this.hasMoreComments = true;
        this.isCommentsVisible = true;

        // Clear UI
        const commentsList = document.getElementById('commentsList');
        if (commentsList) {
            const existingComments = commentsList.querySelectorAll('.comment-item');
            existingComments.forEach(comment => comment.remove());
        }

        // Reset input
        const textarea = document.getElementById('commentTextarea');
        if (textarea) {
            textarea.value = '';
            this.autoResizeTextarea(textarea);
        }

        this.hideCommentActions();
        this.hideLoading();
        this.hideError();
        this.hideNoComments();
    }

    getCommentsCount() {
        return this.comments.size;
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

    // ====== REPLIES FUNCTIONALITY ======

    async loadReplies(commentId) {
        try {
            const response = await this.fetchReplies(commentId, 0);

            if (response.success && response.comments) {
                this.replies.set(commentId, response.comments);
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

    async loadMoreReplies(commentId) {
        // TODO: Implement load more replies
        console.log('Load more replies for comment:', commentId);
    }

    renderReply(commentDiv, reply) {
        const repliesList = commentDiv.querySelector('.replies-list');
        if (!repliesList) return;

        const replyElement = this.createReplyElement(reply);
        repliesList.appendChild(replyElement);
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

        // Reply counts
        const likesCount = replyElement.querySelector('.reply-likes-count');
        const dislikesCount = replyElement.querySelector('.reply-dislikes-count');

        if (likesCount) likesCount.textContent = reply.likesCount || 0;
        if (dislikesCount) dislikesCount.textContent = reply.dislikesCount || 0;

        // Check if own reply
        if (reply.canEdit) {
            const bubble = replyElement.querySelector('.reply-bubble');
            if (bubble) {
                bubble.classList.add('own');
            }

            // Show menu for owner
            const menuBtn = replyElement.querySelector('.reply-menu-btn');
            if (menuBtn) {
                menuBtn.style.display = 'flex';
            }
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
    }

    async toggleReplyLike(replyId) {
        // Similar to comment like but for replies
        console.log('Toggle reply like:', replyId);
        // Implement using same API as comments
    }

    async toggleReplyDislike(replyId) {
        // Similar to comment dislike but for replies
        console.log('Toggle reply dislike:', replyId);
        // Implement using same API as comments
    }

    toggleReplyMenu(replyId) {
        // Similar to comment menu but for replies
        console.log('Toggle reply menu:', replyId);
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