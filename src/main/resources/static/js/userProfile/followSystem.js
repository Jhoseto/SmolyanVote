/**
 * Follow System for User Profiles
 */
class UserFollowSystem {
    constructor() {
        // Вземаме CSRF токена и header името от meta таговете
        const csrfMeta = document.querySelector('meta[name="_csrf"]');
        const csrfHeaderMeta = document.querySelector('meta[name="_csrf_header"]');
        this.csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';
        this.csrfHeader = csrfHeaderMeta ? csrfHeaderMeta.getAttribute('content') : '';

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadInitialFollowStatus();
    }

    bindEvents() {
        // Follow/Unfollow button click
        document.addEventListener('click', (e) => {
            if (e.target.matches('.follow-btn, .follow-btn *')) {
                e.preventDefault();
                const button = e.target.closest('.follow-btn');
                this.handleFollowClick(button);
            }
        });
    }

    async handleFollowClick(button) {
        const userId = button.dataset.userId;
        const action = button.dataset.action;

        if (!userId) {
            console.error('User ID not found');
            return;
        }

        this.setButtonLoading(button, true);

        try {
            let response;
            if (action === 'follow') {
                response = await this.followUser(userId);
            } else {
                response = await this.unfollowUser(userId);
            }

            if (response && response.success) {
                this.updateFollowButton(button, response.action);
                this.updateFollowersCount(response.followersCount);
                this.showNotification(response.message, 'success');
            } else if (response) {
                this.showNotification(response.message, 'error');
            } else {
                this.showNotification('Възникна грешка. Опитайте отново.', 'error');
            }

        } catch (error) {
            console.error('Follow request failed:', error);
            this.showNotification('Възникна грешка. Опитайте отново.', 'error');
        } finally {
            this.setButtonLoading(button, false);
        }
    }

    async followUser(userId) {
        const res = await fetch(`/api/follow/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                [this.csrfHeader]: this.csrfToken
            }
        });
        return this.parseJSON(res);
    }

    async unfollowUser(userId) {
        const res = await fetch(`/api/follow/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                [this.csrfHeader]: this.csrfToken
            }
        });
        return this.parseJSON(res);
    }

    async loadInitialFollowStatus() {
        const followButton = document.getElementById('followButton');
        if (!followButton) return;

        const userId = followButton.dataset.userId;
        if (!userId) return;

        try {
            const res = await fetch(`/api/follow/${userId}/status`, {
                headers: {
                    [this.csrfHeader]: this.csrfToken
                }
            });
            const data = await this.parseJSON(res);

            if (data && data.success) {
                if (data.isFollowing) {
                    this.updateFollowButton(followButton, 'followed');
                }
                this.updateFollowersCount(data.followersCount);
                document.querySelectorAll('.following-count').forEach(el => el.textContent = data.followingCount);
            }

        } catch (error) {
            console.error('Failed to load follow status:', error);
        }
    }

    async parseJSON(response) {
        try {
            return await response.json();
        } catch (err) {
            console.error('Invalid JSON response:', await response.text());
            return null;
        }
    }

    updateFollowButton(button, action) {
        if (action === 'followed') {
            button.dataset.action = 'unfollow';
            button.className = 'btn btn-outline-secondary action-btn follow-btn';
            button.innerHTML = '<i class="bi bi-person-dash"></i> <span>Не следвай</span>';
        } else {
            button.dataset.action = 'follow';
            button.className = 'btn btn-primary action-btn follow-btn';
            button.innerHTML = '<i class="bi bi-person-plus"></i> <span>Следвай</span>';
        }
    }

    updateFollowersCount(newCount) {
        document.querySelectorAll('.followers-count').forEach(el => {
            el.textContent = newCount;
            el.parentElement.classList.add('stat-updated');
            setTimeout(() => el.parentElement.classList.remove('stat-updated'), 1000);
        });
    }

    setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<i class="bi bi-hourglass-split"></i> <span>Зареждане...</span>';
        } else {
            button.disabled = false;
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} notification-popup`;
        notification.innerHTML = `<i class="bi bi-${type === 'success' ? 'check-circle' : 'x-circle'}"></i> <span>${message}</span>`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.profile-hero')) {
        new UserFollowSystem();
    }
});
