// ====== POST INTERACTIONS JS ======
// Файл: src/main/resources/static/js/publications/postInteractions.js

class PostInteractions {
    constructor() {
        this.likedPosts = new Set();
        this.bookmarkedPosts = new Set();
        this.followedAuthors = new Set();
        this.pendingRequests = new Map();
        this.notificationPermission = false;

        this.init();
    }

    init() {
        this.loadUserPreferences();
        this.setupEventListeners();
        this.setupRealtimeUpdates();
        this.requestNotificationPermission();
    }

    async loadUserPreferences() {
        if (!window.isAuthenticated) return;

        try {
            // Load user's liked posts, bookmarks, followed authors
            const response = await window.publicationsAPI.request('/api/user/preferences');

            this.likedPosts = new Set(response.likedPosts || []);
            this.bookmarkedPosts = new Set(response.bookmarkedPosts || []);
            this.followedAuthors = new Set(response.followedAuthors || []);

        } catch (error) {
            console.error('Error loading user preferences:', error);
        }
    }

    setupEventListeners() {
        // Handle dynamic post menu toggles
        document.addEventListener('click', (e) => {
            if (e.target.closest('.post-menu')) {
                e.stopPropagation();
                this.handlePostMenuClick(e.target.closest('.post-menu'));
            }
        });

        // Close all menus when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.post-menu-dropdown').forEach(menu => {
                menu.style.display = 'none';
            });
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // L key for like (when focused on a post)
            if (e.key === 'l' && e.target.closest('.post')) {
                const postId = e.target.closest('.post').dataset.postId;
                if (postId) this.toggleLike(parseInt(postId));
            }

            // S key for share
            if (e.key === 's' && e.target.closest('.post')) {
                const postId = e.target.closest('.post').dataset.postId;
                if (postId) this.sharePublication(parseInt(postId));
            }
        });
    }

    setupRealtimeUpdates() {
        // Setup Server-Sent Events for real-time updates
        if (typeof EventSource !== 'undefined') {
            try {
                this.eventSource = new EventSource('/api/publications/updates');

                this.eventSource.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleRealtimeUpdate(data);
                    } catch (error) {
                        console.error('Error parsing SSE data:', error);
                    }
                };

                this.eventSource.onerror = (error) => {
                    console.error('SSE connection error:', error);
                    // Try to reconnect after 5 seconds
                    setTimeout(() => {
                        if (this.eventSource.readyState === EventSource.CLOSED) {
                            this.setupRealtimeUpdates();
                        }
                    }, 5000);
                };
            } catch (error) {
                console.error('Failed to setup SSE:', error);
            }
        }
    }

    handleRealtimeUpdate(data) {
        switch (data.type) {
            case 'NEW_POST':
                this.handleNewPost(data.post);
                break;
            case 'POST_LIKED':
                this.updateLikeCount(data.postId, data.likesCount);
                break;
            case 'POST_COMMENTED':
                this.updateCommentCount(data.postId, data.commentsCount);
                break;
            case 'POST_SHARED':
                this.updateShareCount(data.postId, data.sharesCount);
                break;
            case 'POST_DELETED':
                this.handlePostDeleted(data.postId);
                break;
        }
    }

    handleNewPost(post) {
        // Show notification for new posts from followed authors
        if (this.followedAuthors.has(post.author.id)) {
            this.showNewPostNotification(post);
        }

        // Add to feed if filters allow
        if (window.publicationsManager) {
            window.publicationsManager.addPost(post);
        }
    }

    handlePostDeleted(postId) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            postElement.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (postElement.parentNode) {
                    postElement.parentNode.removeChild(postElement);
                }
            }, 300);
        }
    }

    showNewPostNotification(post) {
        if (this.notificationPermission) {
            const notification = new Notification(`Нова публикация от ${post.author.username}`, {
                body: post.title,
                icon: '/images/logo.png',
                tag: `post-${post.id}`,
                badge: '/images/logo.png',
                requireInteraction: false,
                silent: false
            });

            notification.onclick = () => {
                window.focus();
                window.location.href = `/publications/${post.id}`;
                notification.close();
            };

            // Auto close after 5 seconds
            setTimeout(() => notification.close(), 5000);
        }
    }

    handlePostMenuClick(menuElement) {
        const dropdown = menuElement.querySelector('.post-menu-dropdown');
        const isVisible = dropdown.style.display === 'block';

        // Close all other menus first
        document.querySelectorAll('.post-menu-dropdown').forEach(menu => {
            menu.style.display = 'none';
        });

        // Toggle current menu
        dropdown.style.display = isVisible ? 'none' : 'block';

        // Position dropdown if it goes off screen
        const rect = dropdown.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            dropdown.style.right = '0';
            dropdown.style.left = 'auto';
        }
    }

    async toggleLike(postId) {
        if (!window.isAuthenticated) {
            this.showLoginPrompt();
            return;
        }

        // Prevent duplicate requests
        const requestKey = `like-${postId}`;
        if (this.pendingRequests.has(requestKey)) {
            return;
        }

        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (!postElement) return;

        const likeButton = postElement.querySelector('.post-action');
        const likeIcon = likeButton.querySelector('i');
        const likeCount = postElement.querySelector('.reaction-count span');

        // Optimistic update
        const isCurrentlyLiked = this.likedPosts.has(postId);
        const currentCount = parseInt(likeCount.textContent) || 0;
        const newLikeCount = currentCount + (isCurrentlyLiked ? -1 : 1);

        this.updateLikeUI(postElement, !isCurrentlyLiked, newLikeCount);
        this.pendingRequests.set(requestKey, true);

        try {
            const response = await window.publicationsAPI.toggleLike(postId);

            // Update with actual data from server
            this.updateLikeUI(postElement, response.isLiked, response.likesCount);

            if (response.isLiked) {
                this.likedPosts.add(postId);
                this.showLikeAnimation(postElement);
                this.trackInteraction('like', postId);
            } else {
                this.likedPosts.delete(postId);
                this.trackInteraction('unlike', postId);
            }

        } catch (error) {
            console.error('Error toggling like:', error);

            // Revert optimistic update on error
            this.updateLikeUI(postElement, isCurrentlyLiked, currentCount);
            this.showError('Възникна грешка при харесването.');

        } finally {
            this.pendingRequests.delete(requestKey);
        }
    }

    updateLikeUI(postElement, isLiked, count) {
        const likeButton = postElement.querySelector('.post-action');
        const likeIcon = likeButton.querySelector('i');
        const likeCount = postElement.querySelector('.reaction-count span');

        if (isLiked) {
            likeButton.classList.add('liked');
            likeIcon.className = 'bi bi-hand-thumbs-up-fill';
        } else {
            likeButton.classList.remove('liked');
            likeIcon.className = 'bi bi-hand-thumbs-up';
        }

        likeCount.textContent = count;

        // Add pulse animation
        likeButton.style.transform = 'scale(1.1)';
        setTimeout(() => {
            likeButton.style.transform = '';
        }, 150);
    }

    showLikeAnimation(postElement) {
        const likeButton = postElement.querySelector('.post-action');
        const rect = likeButton.getBoundingClientRect();

        // Create floating heart
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
            transform-origin: center;
        `;

        document.body.appendChild(heart);

        setTimeout(() => {
            if (document.body.contains(heart)) {
                document.body.removeChild(heart);
            }
        }, 1000);
    }

    async sharePublication(postId) {
        try {
            const post = await this.getPostData(postId);
            const url = `${window.location.origin}/publications/${postId}`;

            const shareData = {
                title: post.title || 'Публикация от SmolyanVote',
                text: post.excerpt || 'Интересна публикация от SmolyanVote',
                url: url
            };

            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);

                // Track share on server
                await window.publicationsAPI.sharePublication(postId);
                this.updateShareCount(postId);
                this.trackInteraction('share_native', postId);

            } else {
                // Fallback to clipboard
                await navigator.clipboard.writeText(url);

                this.showToast('Линкът е копиран в клипборда', 'success');

                // Track share
                await window.publicationsAPI.sharePublication(postId);
                this.updateShareCount(postId);
                this.trackInteraction('share_clipboard', postId);
            }
        } catch (error) {
            console.error('Error sharing publication:', error);
            this.showError('Възникна грешка при споделянето.');
        }
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
                confirmButtonColor: '#1877f2',
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

            // Animate removal
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

            // Remove from manager
            if (window.publicationsManager) {
                window.publicationsManager.removePost(postId);
            }

        } catch (error) {
            console.error('Error deleting post:', error);
            this.showError('Възникна грешка при изтриването.');
        }
    }

    async getPostData(postId) {
        try {
            return await window.publicationsAPI.getPublication(postId);
        } catch (error) {
            console.error('Error getting post data:', error);
            return {
                title: 'Публикация от SmolyanVote',
                excerpt: 'Вижте тази интересна публикация от SmolyanVote'
            };
        }
    }

    // Real-time update handlers
    updateLikeCount(postId, count) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            const likeCount = postElement.querySelector('.reaction-count span');
            if (likeCount) {
                likeCount.textContent = count;
                // Add subtle animation
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

    // UI Helper methods
    showLoginPrompt() {
        Swal.fire({
            title: 'Влезте в профила си',
            text: 'За да извършите това действие, трябва да се влезете в профила си.',
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Вход',
            cancelButtonText: 'Отказ',
            confirmButtonColor: '#1877f2',
            cancelButtonColor: '#6c757d'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = '/login?returnUrl=' + encodeURIComponent(window.location.pathname);
            }
        });
    }

    showToast(message, type = 'success') {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });

        Toast.fire({
            icon: type,
            title: message
        });
    }

    showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Грешка',
            text: message,
            confirmButtonColor: '#1877f2'
        });
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            // Ask after user interaction
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

    // Analytics tracking
    trackInteraction(type, targetId) {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackInteraction(type, targetId);
        }
    }

    // Public API methods
    isPostLiked(postId) {
        return this.likedPosts.has(postId);
    }

    isPostBookmarked(postId) {
        return this.bookmarkedPosts.has(postId);
    }

    isAuthorFollowed(authorId) {
        return this.followedAuthors.has(authorId);
    }

    getLikedPosts() {
        return Array.from(this.likedPosts);
    }

    getBookmarkedPosts() {
        return Array.from(this.bookmarkedPosts);
    }

    getFollowedAuthors() {
        return Array.from(this.followedAuthors);
    }

    // Event emitter for other modules
    emit(eventName, data) {
        document.dispatchEvent(new CustomEvent(`publication:${eventName}`, { detail: data }));
    }

    on(eventName, callback) {
        document.addEventListener(`publication:${eventName}`, callback);
    }

    off(eventName, callback) {
        document.removeEventListener(`publication:${eventName}`, callback);
    }

    // Cleanup
    destroy() {
        if (this.eventSource) {
            this.eventSource.close();
        }
        this.pendingRequests.clear();
    }
}

// Global functions for template usage
window.showCreateModal = function() {
    if (!window.isAuthenticated) {
        window.postInteractions.showLoginPrompt();
        return;
    }
    window.location.href = '/publications/create';
};

window.togglePostMenu = function(element) {
    window.postInteractions.handlePostMenuClick(element);
};

window.toggleLike = function(postId) {
    window.postInteractions.toggleLike(postId);
};

window.sharePublication = function(postId) {
    window.postInteractions.sharePublication(postId);
};

window.toggleBookmark = function(postId) {
    window.postInteractions.toggleBookmark(postId);
};

window.followAuthor = function(authorId) {
    window.postInteractions.followAuthor(authorId);
};

window.showReportModal = function(postId) {
    window.postInteractions.showReportModal(postId);
};

window.confirmDelete = function(postId) {
    window.postInteractions.deletePost(postId);
};

window.showLikesModal = function(postId) {
    // Future implementation for showing who liked the post
    console.log('Show likes modal for post:', postId);
    // Could show a modal with list of users who liked
};

// CSS animations
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
    
    .post-action {
        transition: all 0.2s ease;
    }
    
    .post-action:active {
        transform: scale(0.95);
    }
    
    .post-action.liked {
        color: #1877f2 !important;
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
    
    .reaction-count {
        transition: transform 0.2s ease;
    }
    
    .reaction-count:hover {
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
    window.postInteractions = new PostInteractions();
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