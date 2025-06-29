/**
 * Comments Manager for Publications
 * Handles comment loading, creation, reactions, and real-time updates
 */
class CommentsManager {
    constructor() {
        this.isInitialized = false;
        this.isLoading = false;
        this.currentPostId = null;
        this.currentPage = 0;
        this.commentsPerPage = 10;
        this.hasMoreComments = true;
        this.currentSort = 'newest';

        // Data storage
        this.comments = new Map();
        this.replies = new Map();

        // Elements cache
        this.elements = {};

        console.log('🔧 DEBUG: CommentsManager constructed');
    }

    // ====== INITIALIZATION ======

    initialize() {
        console.log('🔧 DEBUG: Initializing CommentsManager');

        // Cache DOM elements (със правилните ID-та от HTML-а)
        this.elements = {
            commentsList: document.getElementById('commentsList'),
            loadMoreBtn: document.getElementById('loadMoreBtn'),
            sortSelect: document.getElementById('commentsSortSelect'),
            commentTextarea: document.getElementById('commentTextarea'),
            submitBtn: document.getElementById('commentSubmitBtn'), // ✅ ПОПРАВЕНО
            cancelBtn: document.getElementById('commentCancelBtn'), // ✅ ПОПРАВЕНО
            commentsActions: document.getElementById('commentInputActions'), // ✅ ПОПРАВЕНО
            loadingDiv: document.getElementById('commentsLoading'),
            errorDiv: document.getElementById('commentsError'),
            noCommentsDiv: document.getElementById('noComments'),
            retryBtn: document.getElementById('retryCommentsBtn')
        };

        // Check required elements (само най-важните)
        const requiredElements = ['commentsList', 'commentTextarea', 'submitBtn'];
        const missingElements = requiredElements.filter(key => !this.elements[key]);

        if (missingElements.length > 0) {
            console.error('❌ DEBUG: Missing required elements:', missingElements);
            return false;
        }

        console.log('✅ DEBUG: Required elements found:', requiredElements.filter(key => this.elements[key]));
        console.log('🔧 DEBUG: Optional elements status:', {
            loadMoreBtn: !!this.elements.loadMoreBtn,
            sortSelect: !!this.elements.sortSelect,
            loadingDiv: !!this.elements.loadingDiv,
            errorDiv: !!this.elements.errorDiv,
            noCommentsDiv: !!this.elements.noCommentsDiv
        });

        // Bind event listeners
        this.bindEventListeners();

        this.isInitialized = true;
        console.log('✅ DEBUG: CommentsManager initialized successfully');
        return true;
    }

    bindEventListeners() {
        // Comment form events
        if (this.elements.commentTextarea) {
            this.elements.commentTextarea.addEventListener('input', () => this.handleCommentInput());
            this.elements.commentTextarea.addEventListener('focus', () => this.showCommentActions());
            console.log('✅ DEBUG: Textarea events bound');
        }

        if (this.elements.submitBtn) {
            this.elements.submitBtn.addEventListener('click', () => this.submitComment());
            console.log('✅ DEBUG: Submit button event bound');
        }

        if (this.elements.cancelBtn) {
            this.elements.cancelBtn.addEventListener('click', () => this.cancelComment());
            console.log('✅ DEBUG: Cancel button event bound');
        }

        // Load more button (optional)
        if (this.elements.loadMoreBtn) {
            this.elements.loadMoreBtn.addEventListener('click', () => this.loadMoreComments());
            console.log('✅ DEBUG: Load more button event bound');
        }

        // Sort dropdown (optional)
        if (this.elements.sortSelect) {
            this.elements.sortSelect.addEventListener('change', (e) => this.handleSort(e.target.value));
            console.log('✅ DEBUG: Sort select event bound');
        }

        // Retry button (optional)
        if (this.elements.retryBtn) {
            this.elements.retryBtn.addEventListener('click', () => this.retryLoading());
            console.log('✅ DEBUG: Retry button event bound');
        }

        // Global click handler for comment actions
        document.addEventListener('click', (e) => this.handleGlobalClick(e));

        console.log('✅ DEBUG: Event listeners bound successfully');
    }

    // ====== GLOBAL CLICK HANDLER ======

    handleGlobalClick(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        e.preventDefault();
        e.stopPropagation();

        const action = target.dataset.action;
        const commentId = target.closest('[data-comment-id]')?.dataset.commentId;
        const replyId = target.closest('[data-reply-id]')?.dataset.replyId;

        console.log('🔧 DEBUG: Global click action:', action, 'commentId:', commentId, 'replyId:', replyId);

        switch (action) {
            case 'like-comment':
                if (commentId) this.toggleCommentLike(parseInt(commentId));
                break;
            case 'dislike-comment':
                if (commentId) this.toggleCommentDislike(parseInt(commentId));
                break;
            case 'reply-comment':
                if (commentId) this.showReplyInput(parseInt(commentId));
                break;
            case 'edit-comment':
                if (commentId) this.editComment(parseInt(commentId));
                break;
            case 'delete-comment':
                if (commentId) this.deleteComment(parseInt(commentId));
                break;
            case 'menu-comment':
                if (commentId) this.toggleCommentMenu(parseInt(commentId));
                break;
            case 'show-replies':
                if (commentId) this.showReplies(parseInt(commentId));
                break;
            case 'hide-replies':
                if (commentId) this.hideReplies(parseInt(commentId));
                break;
            case 'like-reply':
                if (replyId) this.toggleReplyLike(parseInt(replyId));
                break;
            case 'dislike-reply':
                if (replyId) this.toggleReplyDislike(parseInt(replyId));
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

        // Initialize if not done
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
            const response = await fetch(`/publications/api/${postId}/stats`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.ok) {
                const publicationData = await response.json();
                console.log('🔧 DEBUG: Publication stats:', publicationData);

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

    // ====== LOAD MORE COMMENTS ======

    async loadMoreComments() {
        if (this.isLoading || !this.hasMoreComments) {
            console.log('🔧 DEBUG: Cannot load more - loading:', this.isLoading, 'hasMore:', this.hasMoreComments);
            return;
        }

        console.log('🔧 DEBUG: Loading more comments, page:', this.currentPage);

        this.isLoading = true;
        this.updateLoadMoreButton();

        try {
            const response = await this.fetchComments(this.currentPostId, this.currentPage);
            console.log('🔧 DEBUG: Load more response:', response);

            if (response.success && response.comments && response.comments.length > 0) {
                // Add new comments to existing map
                response.comments.forEach(comment => {
                    this.comments.set(comment.id, comment);
                });

                this.renderComments();
                this.currentPage++;
                this.hasMoreComments = response.hasNext;

                console.log('✅ DEBUG: More comments loaded, total:', this.comments.size);
            } else {
                this.hasMoreComments = false;
                console.log('🔧 DEBUG: No more comments to load');
            }

        } catch (error) {
            console.error('❌ DEBUG: Error loading more comments:', error);
            this.showError(error.message);
        } finally {
            this.isLoading = false;
            this.updateLoadMoreButton();
        }
    }

    // ====== COMMENT INPUT HANDLING ======

    handleCommentInput() {
        const textarea = this.elements.commentTextarea;
        if (!textarea) return;

        const hasText = textarea.value.trim().length > 0;

        if (hasText) {
            this.showCommentActions();
        }

        // Auto-resize textarea
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    showCommentActions() {
        if (this.elements.commentsActions) {
            this.elements.commentsActions.style.display = 'flex';
            console.log('🔧 DEBUG: Comment actions shown');
        }
    }

    hideCommentActions() {
        if (this.elements.commentsActions) {
            this.elements.commentsActions.style.display = 'none';
            console.log('🔧 DEBUG: Comment actions hidden');
        }

        // Също така рестартираме textarea size
        if (this.elements.commentTextarea) {
            this.elements.commentTextarea.style.height = 'auto';
        }
    }

    updateCommentInputAvatar() {
        const avatarContainer = document.querySelector('#commentUserAvatar'); // ✅ ПОПРАВЕНО
        if (avatarContainer && window.avatarUtils && window.currentUsername) {
            // ✅ ПОПРАВЕНО: използваме createAvatar вместо createAvatarHTML
            avatarContainer.innerHTML = window.avatarUtils.createAvatar(
                window.currentUserImage || '/images/default-avatar.png',
                window.currentUsername,
                40,
                'user-avatar'
            );
            console.log('✅ DEBUG: Comment input avatar updated');
        } else {
            console.log('🔧 DEBUG: Cannot update comment input avatar - missing elements or data');
        }
    }

    // ====== COMMENT SUBMISSION ======

    async submitComment() {
        const textarea = this.elements.commentTextarea;
        const submitBtn = this.elements.submitBtn;

        if (!textarea || !submitBtn) {
            console.error('❌ DEBUG: Comment form elements not found');
            return;
        }

        const text = textarea.value.trim();
        if (!text) {
            console.warn('🔧 DEBUG: Empty comment text');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Публикуване...';

        try {
            const result = await this.createComment(this.currentPostId, text);

            if (result && result.success) {
                // Clear form
                textarea.value = '';
                this.hideCommentActions();

                console.log('✅ DEBUG: Comment submitted successfully');
            }

        } catch (error) {
            console.error('❌ DEBUG: Error submitting comment:', error);
            this.showError(error.message || 'Възникна грешка при създаването на коментара');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Коментирай';
        }
    }

    async createComment(postId, text) {
        if (!window.isAuthenticated) {
            this.showLoginPrompt();
            return null;
        }

        if (!text?.trim()) {
            console.warn('🔧 DEBUG: Empty comment text');
            return null;
        }

        try {
            console.log('🔧 DEBUG: Creating comment API call');
            const formData = new FormData();
            formData.append('targetId', postId);
            formData.append('text', text.trim());

            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log('🔧 DEBUG: Comment creation result:', result);

            if (result.success) {
                // Add new comment to the map
                if (result.comment) {
                    this.comments.set(result.comment.id, result.comment);

                    // Re-render comments
                    this.renderComments();

                    // ✅ ПОПРАВКА: Актуализираме броя коментари с абсолютната стойност
                    if (result.newCommentsCount !== undefined) {
                        this.updateCommentsCountEverywhere(postId, result.newCommentsCount);
                    }
                }

                return result;
            } else {
                throw new Error(result.error || 'Възникна грешка');
            }

        } catch (error) {
            console.error('❌ DEBUG: API Error creating comment:', error);
            throw error;
        }
    }

    cancelComment() {
        const textarea = this.elements.commentTextarea;
        if (textarea) {
            textarea.value = '';
            textarea.style.height = 'auto';
        }
        this.hideCommentActions();
        console.log('🔧 DEBUG: Comment cancelled');
    }

    // ====== COMMENT COUNT SYNC WITH ABSOLUTE VALUES ======

    updateCommentsCountEverywhere(postId, newCount) {
        console.log('🔧 DEBUG: Setting comment count to:', newCount);
        this.updateCommentsCountInModal(newCount);
        this.updateCommentsCountOnWall(postId, newCount);
    }

    updateCommentsCountInModal(newCount) {
        const headerCount = document.getElementById('commentsHeaderCount');
        if (headerCount) {
            headerCount.textContent = newCount;
            console.log('🔧 DEBUG: Modal comment count set to:', newCount);
        }
    }

    updateCommentsCountOnWall(postId, newCount) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            const commentStatsCount = postElement.querySelector('.comment-stats-count');
            if (commentStatsCount) {
                commentStatsCount.textContent = newCount;
                console.log('🔧 DEBUG: Wall comment count set to:', newCount);
            }
        }
    }

    // ====== REACTIONS USING EXISTING ENDPOINTS ======

    async toggleCommentLike(commentId) {
        console.log('🔧 DEBUG: Toggle comment like:', commentId);
        if (!window.isAuthenticated) {
            this.showLoginPrompt();
            return;
        }

        try {
            const formData = new FormData();
            formData.append('type', 'like');

            const response = await fetch(`/api/comments/${commentId}/react`, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                // Update comment in memory
                const comment = this.comments.get(commentId);
                if (comment) {
                    comment.userReaction = result.userReaction;
                    comment.likeCount = result.likesCount;
                    comment.unlikeCount = result.dislikesCount;

                    // Update UI
                    this.updateCommentReactionUI(commentId, comment);
                }
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
            const formData = new FormData();
            formData.append('type', 'unlike');

            const response = await fetch(`/api/comments/${commentId}/react`, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                // Update comment in memory
                const comment = this.comments.get(commentId);
                if (comment) {
                    comment.userReaction = result.userReaction;
                    comment.likeCount = result.likesCount;
                    comment.unlikeCount = result.dislikesCount;

                    // Update UI
                    this.updateCommentReactionUI(commentId, comment);
                }
            }
        } catch (error) {
            console.error('❌ DEBUG: Error toggling comment dislike:', error);
        }
    }

    updateCommentReactionUI(commentId, comment) {
        const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentDiv) return;

        const likeBtn = commentDiv.querySelector('.comment-like-btn');
        const dislikeBtn = commentDiv.querySelector('.comment-dislike-btn');

        if (likeBtn) {
            const isLiked = comment.userReaction === 'LIKE';
            likeBtn.classList.toggle('liked', isLiked);

            const likesSpan = likeBtn.querySelector('.comment-likes-count');
            if (likesSpan) {
                likesSpan.textContent = comment.likeCount || 0;
            }

            const icon = likeBtn.querySelector('i');
            if (icon) {
                icon.className = isLiked ? 'bi bi-hand-thumbs-up-fill' : 'bi bi-hand-thumbs-up';
            }
        }

        if (dislikeBtn) {
            const isDisliked = comment.userReaction === 'UNLIKE';
            dislikeBtn.classList.toggle('disliked', isDisliked);

            const dislikesSpan = dislikeBtn.querySelector('.comment-dislikes-count');
            if (dislikesSpan) {
                dislikesSpan.textContent = comment.unlikeCount || 0;
            }

            const icon = dislikeBtn.querySelector('i');
            if (icon) {
                icon.className = isDisliked ? 'bi bi-hand-thumbs-down-fill' : 'bi bi-hand-thumbs-down';
            }
        }
    }

    // ====== COMMENT MENU ======

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

    // ====== REPLIES (BASIC IMPLEMENTATION) ======

    showReplyInput(commentId) {
        console.log('🔧 DEBUG: Show reply input:', commentId);

        // Hide all other reply inputs
        document.querySelectorAll('.reply-input-container').forEach(container => {
            container.style.display = 'none';
        });

        const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentDiv) return;

        // Check if reply input already exists
        let replyContainer = commentDiv.querySelector('.reply-input-container');
        if (!replyContainer) {
            // Create reply input
            replyContainer = this.createReplyInput(commentId);
            commentDiv.appendChild(replyContainer);
        }

        replyContainer.style.display = 'block';

        // Focus on textarea
        const textarea = replyContainer.querySelector('.reply-textarea');
        if (textarea) {
            textarea.focus();
        }
    }

    createReplyInput(commentId) {
        const container = document.createElement('div');
        container.className = 'reply-input-container';

        // ✅ ПОПРАВЕНО: използваме правилното име на метода
        const avatarHTML = window.avatarUtils && window.currentUsername
            ? window.avatarUtils.createAvatar(
                window.currentUserImage || '/images/default-avatar.png',
                window.currentUsername,
                32,
                'user-avatar'
            )
            : '<div class="avatar-placeholder">👤</div>';

        container.innerHTML = `
            <div class="reply-input-form">
                <div class="reply-input-wrapper">
                    <div class="reply-avatar">
                        ${avatarHTML}
                    </div>
                    <textarea 
                        class="reply-textarea" 
                        placeholder="Напишете отговор..."
                        rows="2"
                    ></textarea>
                </div>
                <div class="reply-actions">
                    <button class="reply-cancel-btn" onclick="commentsManager.hideReplyInput(${commentId})">
                        Отказ
                    </button>
                    <button class="reply-submit-btn" onclick="commentsManager.submitReply(${commentId})">
                        Отговори
                    </button>
                </div>
            </div>
        `;

        return container;
    }

    hideReplyInput(commentId) {
        console.log('🔧 DEBUG: Hide reply input:', commentId);
        const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentDiv) {
            const replyContainer = commentDiv.querySelector('.reply-input-container');
            if (replyContainer) {
                replyContainer.style.display = 'none';

                // Clear textarea
                const textarea = replyContainer.querySelector('.reply-textarea');
                if (textarea) {
                    textarea.value = '';
                }
            }
        }
    }

    async submitReply(commentId) {
        console.log('🔧 DEBUG: Submit reply to comment:', commentId);

        if (!window.isAuthenticated) {
            this.showLoginPrompt();
            return;
        }

        const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentDiv) return;

        const textarea = commentDiv.querySelector('.reply-textarea');
        const submitBtn = commentDiv.querySelector('.reply-submit-btn');

        if (!textarea || !submitBtn) return;

        const text = textarea.value.trim();
        if (!text) {
            console.warn('🔧 DEBUG: Empty reply text');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Изпращане...';

        try {
            const formData = new FormData();
            formData.append('targetId', this.currentPostId);
            formData.append('text', text);
            formData.append('parentId', commentId);

            const response = await fetch('/api/comments', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();

            if (result.success) {
                // Add reply to parent comment
                const parentComment = this.comments.get(commentId);
                if (parentComment) {
                    if (!parentComment.replies) {
                        parentComment.replies = [];
                    }
                    parentComment.replies.push(result.comment);

                    // Update replies count
                    parentComment.repliesCount = (parentComment.repliesCount || 0) + 1;

                    // Re-render this specific comment
                    this.renderSingleComment(parentComment);
                }

                // Hide reply input
                this.hideReplyInput(commentId);

                console.log('✅ DEBUG: Reply submitted successfully');
            } else {
                this.showError(result.error || 'Възникна грешка');
            }

        } catch (error) {
            console.error('❌ DEBUG: Error submitting reply:', error);
            this.showError('Възникна грешка при изпращането на отговора');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Отговори';
        }
    }

    async showReplies(commentId) {
        console.log('🔧 DEBUG: Show replies for comment:', commentId);

        const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentDiv) return;

        const repliesList = commentDiv.querySelector('.replies-list');
        const showBtn = commentDiv.querySelector('.show-replies-btn');
        const hideBtn = commentDiv.querySelector('.hide-replies-btn');

        if (!repliesList) return;

        // Check if replies are already loaded
        if (repliesList.children.length === 0) {
            // Load replies from server
            try {
                const response = await fetch(`/api/comments/${commentId}/replies?page=0&size=10`);
                const result = await response.json();

                if (result.success && result.comments) {
                    // Render replies
                    result.comments.forEach(reply => {
                        const replyElement = this.createReplyElement(reply);
                        repliesList.appendChild(replyElement);
                    });
                }
            } catch (error) {
                console.error('❌ DEBUG: Error loading replies:', error);
                return;
            }
        }

        // Show replies
        repliesList.style.display = 'block';
        if (showBtn) showBtn.style.display = 'none';
        if (hideBtn) hideBtn.style.display = 'inline-flex';
    }

    hideReplies(commentId) {
        console.log('🔧 DEBUG: Hide replies for comment:', commentId);

        const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentDiv) return;

        const repliesList = commentDiv.querySelector('.replies-list');
        const showBtn = commentDiv.querySelector('.show-replies-btn');
        const hideBtn = commentDiv.querySelector('.hide-replies-btn');

        if (repliesList) {
            repliesList.style.display = 'none';
        }
        if (showBtn) showBtn.style.display = 'inline-flex';
        if (hideBtn) hideBtn.style.display = 'none';
    }

    // ====== FIXED SORTING (NO MULTIPLE RELOADS) ======

    async handleSort(newSort) {
        console.log('🔧 DEBUG: Handling sort change to:', newSort);

        if (this.currentSort === newSort) {
            console.log('🔧 DEBUG: Same sort, skipping');
            return;
        }

        this.currentSort = newSort;

        // ✅ ВАЖНА ПОПРАВКА: НЕ презареждаме от сървъра, а само пренареждаме в паметта
        this.sortCommentsInMemory();
        this.renderComments();
    }

    sortCommentsInMemory() {
        const commentsArray = Array.from(this.comments.values());

        commentsArray.sort((a, b) => {
            switch (this.currentSort) {
                case 'newest':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'popular':
                    return (b.likeCount || 0) - (a.likeCount || 0);
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });

        // Update the map with sorted order
        this.comments.clear();
        commentsArray.forEach(comment => {
            this.comments.set(comment.id, comment);
        });
    }

    // ====== RENDERING ======

    renderComments() {
        console.log('🔧 DEBUG: Rendering comments...');
        const commentsList = this.elements.commentsList;
        if (!commentsList) {
            console.error('❌ DEBUG: commentsList element not found! Cannot render comments.');
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

        // Update UI states
        this.updateLoadMoreButton();

        if (rendered === 0) {
            this.showNoComments();
        } else {
            this.hideNoComments();
        }
    }

    renderSingleComment(comment) {
        const commentsList = this.elements.commentsList;
        if (!commentsList) return;

        // Find existing comment element
        const existingElement = commentsList.querySelector(`[data-comment-id="${comment.id}"]`);

        // Create new element
        const newElement = this.createCommentElement(comment);

        if (existingElement && newElement) {
            // Replace existing
            existingElement.replaceWith(newElement);
        } else if (newElement) {
            // Add new
            commentsList.appendChild(newElement);
        }
    }

    createCommentElement(comment) {
        const template = document.getElementById('commentTemplate');
        if (!template) {
            console.error('❌ DEBUG: Comment template not found');
            // Създаваме basic element като fallback
            const fallbackDiv = document.createElement('div');
            fallbackDiv.className = 'comment-item';
            fallbackDiv.dataset.commentId = comment.id;
            fallbackDiv.innerHTML = `
                <div class="comment-main">
                    <div class="comment-content">
                        <div class="comment-author">${comment.author || 'Анонимен'}</div>
                        <div class="comment-text">${comment.text || ''}</div>
                        <div class="comment-time">${this.formatTimeAgo(comment.createdAt)}</div>
                    </div>
                </div>
            `;
            return fallbackDiv;
        }

        const commentElement = template.content.cloneNode(true);
        const commentDiv = commentElement.querySelector('.comment-item');

        if (!commentDiv) {
            console.error('❌ DEBUG: Comment template structure invalid');
            return null;
        }

        // Set comment ID
        commentDiv.dataset.commentId = comment.id;

        // Set avatar
        const avatar = commentDiv.querySelector('.comment-avatar');
        if (avatar && window.avatarUtils) {
            // ✅ ПОПРАВЕНО: използваме createAvatar вместо createAvatarHTML
            avatar.innerHTML = window.avatarUtils.createAvatar(
                comment.authorImage || '/images/default-avatar.png',
                comment.author || 'Анонимен',
                40,
                'user-avatar'
            );
        }

        // Set author name
        const authorLink = commentDiv.querySelector('.comment-author');
        if (authorLink) {
            authorLink.textContent = comment.author || 'Анонимен';
            authorLink.href = `/profile/${comment.author || ''}`;
        }

        // Set time
        const timeSpan = commentDiv.querySelector('.comment-time');
        if (timeSpan) {
            timeSpan.textContent = this.formatTimeAgo(comment.createdAt);
        }

        // Set text
        const textDiv = commentDiv.querySelector('.comment-text');
        if (textDiv) {
            textDiv.textContent = comment.text || '';
        }

        // Set reaction counts
        const likesSpan = commentDiv.querySelector('.comment-likes-count');
        if (likesSpan) {
            likesSpan.textContent = comment.likeCount || 0;
        }

        const dislikesSpan = commentDiv.querySelector('.comment-dislikes-count');
        if (dislikesSpan) {
            dislikesSpan.textContent = comment.unlikeCount || 0;
        }

        // Set user reactions if authenticated
        if (window.isAuthenticated && comment.userReaction) {
            const likeBtn = commentDiv.querySelector('.comment-like-btn');
            const dislikeBtn = commentDiv.querySelector('.comment-dislike-btn');

            if (comment.userReaction === 'LIKE' && likeBtn) {
                likeBtn.classList.add('liked');
                const icon = likeBtn.querySelector('i');
                if (icon) icon.className = 'bi bi-hand-thumbs-up-fill';
            }

            if (comment.userReaction === 'UNLIKE' && dislikeBtn) {
                dislikeBtn.classList.add('disliked');
                const icon = dislikeBtn.querySelector('i');
                if (icon) icon.className = 'bi bi-hand-thumbs-down-fill';
            }
        }

        // Handle replies count
        const repliesCount = comment.repliesCount || 0;
        const showRepliesBtn = commentDiv.querySelector('.show-replies-btn');
        const repliesCountSpan = commentDiv.querySelector('.replies-count');

        if (repliesCount > 0) {
            if (showRepliesBtn) showRepliesBtn.style.display = 'inline-flex';
            if (repliesCountSpan) repliesCountSpan.textContent = repliesCount;
        } else {
            if (showRepliesBtn) showRepliesBtn.style.display = 'none';
        }

        console.log('✅ DEBUG: Comment element created for:', comment.id);
        return commentDiv;
    }

    createReplyElement(reply) {
        const template = document.getElementById('replyTemplate');
        if (!template) {
            console.error('❌ DEBUG: Reply template not found');
            // Създаваме basic element като fallback
            const fallbackDiv = document.createElement('div');
            fallbackDiv.className = 'reply-item';
            fallbackDiv.dataset.replyId = reply.id;
            fallbackDiv.innerHTML = `
                <div class="reply-main">
                    <div class="reply-content">
                        <div class="reply-author">${reply.author || 'Анонимен'}</div>
                        <div class="reply-text">${reply.text || ''}</div>
                        <div class="reply-time">${this.formatTimeAgo(reply.createdAt)}</div>
                    </div>
                </div>
            `;
            return fallbackDiv;
        }

        const replyElement = template.content.cloneNode(true);
        const replyDiv = replyElement.querySelector('.reply-item');

        if (!replyDiv) {
            console.error('❌ DEBUG: Reply template structure invalid');
            return document.createElement('div');
        }

        // Set reply ID
        replyDiv.dataset.replyId = reply.id;

        // Set avatar
        const avatar = replyDiv.querySelector('.reply-avatar');
        if (avatar && window.avatarUtils) {
            // ✅ ПОПРАВЕНО: използваме createAvatar вместо createAvatarHTML
            avatar.innerHTML = window.avatarUtils.createAvatar(
                reply.authorImage || '/images/default-avatar.png',
                reply.author || 'Анонимен',
                32,
                'user-avatar'
            );
        }

        // Set author name
        const authorLink = replyDiv.querySelector('.reply-author');
        if (authorLink) {
            authorLink.textContent = reply.author || 'Анонимен';
            authorLink.href = `/profile/${reply.author || ''}`;
        }

        // Set time
        const timeSpan = replyDiv.querySelector('.reply-time');
        if (timeSpan) {
            timeSpan.textContent = this.formatTimeAgo(reply.createdAt);
        }

        // Set text
        const textDiv = replyDiv.querySelector('.reply-text');
        if (textDiv) {
            textDiv.textContent = reply.text || '';
        }

        console.log('✅ DEBUG: Reply element created for:', reply.id);
        return replyDiv;
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

    // ====== UI STATE MANAGEMENT ======

    showLoading() {
        if (this.elements.loadingDiv) {
            this.elements.loadingDiv.style.display = 'block';
            console.log('🔧 DEBUG: Loading shown');
        }
    }

    hideLoading() {
        if (this.elements.loadingDiv) {
            this.elements.loadingDiv.style.display = 'none';
            console.log('🔧 DEBUG: Loading hidden');
        }
    }

    showError(message) {
        if (this.elements.errorDiv) {
            this.elements.errorDiv.style.display = 'block';
            const errorMsg = this.elements.errorDiv.querySelector('p');
            if (errorMsg) {
                errorMsg.textContent = message || 'Възникна грешка при зареждането';
            }
            console.log('🔧 DEBUG: Error shown:', message);
        } else {
            // Fallback: показваме alert ако няма error div
            console.error('❌ DEBUG: Error (no error div):', message);
            alert(message || 'Възникна грешка при зареждането');
        }
    }

    hideError() {
        if (this.elements.errorDiv) {
            this.elements.errorDiv.style.display = 'none';
            console.log('🔧 DEBUG: Error hidden');
        }
    }

    showNoComments() {
        if (this.elements.noCommentsDiv) {
            this.elements.noCommentsDiv.style.display = 'block';
            console.log('🔧 DEBUG: No comments message shown');
        }
    }

    hideNoComments() {
        if (this.elements.noCommentsDiv) {
            this.elements.noCommentsDiv.style.display = 'none';
            console.log('🔧 DEBUG: No comments message hidden');
        }
    }

    updateLoadMoreButton() {
        if (!this.elements.loadMoreBtn) {
            console.log('🔧 DEBUG: No load more button found');
            return;
        }

        if (this.isLoading) {
            this.elements.loadMoreBtn.innerHTML = 'Зареждане...';
            this.elements.loadMoreBtn.disabled = true;
        } else if (this.hasMoreComments) {
            this.elements.loadMoreBtn.innerHTML = 'Покажи още коментари';
            this.elements.loadMoreBtn.disabled = false;
            this.elements.loadMoreBtn.style.display = 'block';
        } else {
            this.elements.loadMoreBtn.style.display = 'none';
        }

        console.log('🔧 DEBUG: Load more button updated');
    }

    showLoginPrompt() {
        // Show login modal or redirect
        if (window.loginModal) {
            window.loginModal.show();
        } else {
            alert('Моля, влезте в профила си за да коментирате.');
        }
    }

    retryLoading() {
        console.log('🔧 DEBUG: Retrying comment loading');
        this.hideError();
        this.loadComments(this.currentPostId);
    }

    // ====== UTILITY METHODS ======

    formatTimeAgo(dateString) {
        if (!dateString) return '';

        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMinutes = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMinutes / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffMinutes < 1) return 'току-що';
            if (diffMinutes < 60) return `преди ${diffMinutes} мин`;
            if (diffHours < 24) return `преди ${diffHours} ч`;
            if (diffDays < 7) return `преди ${diffDays} дни`;

            return date.toLocaleDateString('bg-BG', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            console.warn('Error formatting date:', error);
            return '';
        }
    }

    // ====== CLEANUP ======

    cleanup() {
        console.log('🔧 DEBUG: Cleaning up CommentsManager');

        // Clear data
        this.comments.clear();
        this.replies.clear();

        // Reset state
        this.currentPostId = null;
        this.currentPage = 0;
        this.hasMoreComments = true;
        this.isLoading = false;

        // Hide UI elements
        this.hideError();
        this.hideLoading();
        this.hideNoComments();

        console.log('✅ DEBUG: CommentsManager cleaned up');
    }

    // ====== PLACEHOLDER METHODS FOR FUTURE IMPLEMENTATION ======

    editComment(commentId) {
        console.log('🔧 DEBUG: Edit comment:', commentId, '(not implemented yet)');
    }

    deleteComment(commentId) {
        console.log('🔧 DEBUG: Delete comment:', commentId, '(not implemented yet)');
    }

    toggleReplyLike(replyId) {
        console.log('🔧 DEBUG: Toggle reply like:', replyId, '(not implemented yet)');
    }

    toggleReplyDislike(replyId) {
        console.log('🔧 DEBUG: Toggle reply dislike:', replyId, '(not implemented yet)');
    }
}

// Global initialization
window.CommentsManager = CommentsManager;

// Make sure commentsManager is globally accessible for onclick handlers
if (typeof window.commentsManager === 'undefined') {
    console.log('🔧 DEBUG: Creating global commentsManager instance');
    // Не създаваме автоматично инстанция, защото ще се създаде в modal
}

console.log('✅ DEBUG: CommentsManager class loaded and ready');