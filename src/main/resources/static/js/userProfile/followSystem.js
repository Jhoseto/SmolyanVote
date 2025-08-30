/**
 * Follow System for User Profiles
 */
class UserFollowSystem {
    constructor() {
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

        // Disable button during request
        this.setButtonLoading(button, true);

        try {
            let response;
            if (action === 'follow') {
                response = await this.followUser(userId);
            } else {
                response = await this.unfollowUser(userId);
            }

            if (response.success) {
                this.updateFollowButton(button, response.action);
                this.updateFollowersCount(response.followersCount);
                this.showNotification(response.message, 'success');
            } else {
                this.showNotification(response.message, 'error');
            }

        } catch (error) {
            console.error('Follow request failed:', error);
            this.showNotification('Възникна грешка. Опитайте отново.', 'error');
        } finally {
            this.setButtonLoading(button, false);
        }
    }

    async followUser(userId) {
        const response = await fetch(`/api/follow/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        return await response.json();
    }

    async unfollowUser(userId) {
        const response = await fetch(`/api/follow/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        return await response.json();
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
        const followersElements = document.querySelectorAll('.followers-count');
        followersElements.forEach(el => {
            el.textContent = newCount;
            // Add animation
            el.parentElement.classList.add('stat-updated');
            setTimeout(() => {
                el.parentElement.classList.remove('stat-updated');
            }, 1000);
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

    async loadInitialFollowStatus() {
        const followButton = document.getElementById('followButton');
        if (!followButton) return;

        const userId = followButton.dataset.userId;
        if (!userId) return;

        try {
            const response = await fetch(`/api/follow/${userId}/status`);
            const data = await response.json();

            if (data.success) {
                if (data.isFollowing) {
                    this.updateFollowButton(followButton, 'followed');
                }
                this.updateFollowersCount(data.followersCount);

                // Update following count if element exists
                const followingElements = document.querySelectorAll('.following-count');
                followingElements.forEach(el => {
                    el.textContent = data.followingCount;
                });
            }

        } catch (error) {
            console.error('Failed to load follow status:', error);
        }
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} notification-popup`;
        notification.innerHTML = `
            <i class="bi bi-${type === 'success' ? 'check-circle' : 'x-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on profile pages
    if (document.querySelector('.profile-hero')) {
        new UserFollowSystem();
    }
});