/**
 * Right Sidebar Manager - Platform Overview Stats
 * Минимален код, максимална функционалност
 */
class RightSideBarManager {
    constructor() {
        this.refreshInterval = null;
        this.isRefreshing = false;
        this.autoRefreshSeconds = 60;
        this.init();
    }

    init() {
        this.setupRefreshButton();
        this.loadAllData();
        this.startAutoRefresh();
    }

    // ===== REFRESH CONTROL =====
    
    setupRefreshButton() {
        const btn = document.getElementById('refreshSidebarBtn');
        if (btn) {
            btn.addEventListener('click', () => this.manualRefresh());
        }
    }

    async manualRefresh() {
        if (this.isRefreshing) return;
        const btn = document.getElementById('refreshSidebarBtn');
        if (btn) {
            btn.classList.add('spinning');
            btn.disabled = true;
        }
        await this.loadAllData();
        if (btn) {
            setTimeout(() => {
                btn.classList.remove('spinning');
                btn.disabled = false;
            }, 500);
        }
    }

    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            if (!document.hidden) this.loadAllData();
        }, this.autoRefreshSeconds * 1000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }

    // ===== DATA LOADING =====

          async loadAllData() {
              if (this.isRefreshing) return;
              this.isRefreshing = true;

              try {
                  await Promise.all([
                      this.loadStatistics(),
                      this.loadTopAuthors(),
                      this.loadTrending(),
                      this.loadLastActivity(),
                      this.loadMostCommented(),
                      this.loadTopViewed(),
                      this.loadLastPublished()
                  ]);
              } catch (error) {
                  console.error('Error loading sidebar data:', error);
              } finally {
                  this.isRefreshing = false;
              }
          }

    async loadStatistics() {
        try {
            const res = await fetch('/publications/api/sidebar/stats');
            if (!res.ok) return;
            const data = await res.json();
            
            this.updateElement('.stat-total', data.totalPublications || 0);
            this.updateElement('.stat-today', data.todayPublications || 0);
            this.updateElement('.stat-week', data.weekPublications || 0);
            this.updateElement('.stat-online', data.onlineUsers || 0);
        } catch (err) {
            console.error('Stats error:', err);
        }
    }

          async loadTopAuthors() {
              try {
                  const res = await fetch('/publications/api/sidebar/top-authors');
                  if (!res.ok) return;
                  const data = await res.json();
                  
                  const container = document.getElementById('topAuthorsToday');
                  if (!container) return;

                  if (!data.authors || !data.authors.length) {
                      container.innerHTML = '<div class="empty-widget">Няма публикации днес</div>';
                      return;
                  }

                  // Вземи информация за следване
                  const followingIds = data.followingIds || [];

                  container.innerHTML = data.authors.slice(0, 5).map(a => {
                      const isFollowing = followingIds.includes(a.id);
                      const isCurrentUser = window.currentUserId && a.id == window.currentUserId;
                      
                      return `
                          <div class="author-item">
                              <div class="author-avatar avatar-placeholder"
                                   data-user-image="${a.imageUrl || '/images/default-avatar.png'}"
                                   data-username="${this.escape(a.username)}"
                                   data-user-id="${a.id}"
                                   onclick="window.open('/user/${this.escape(a.username)}', '_blank')"
                                   style="cursor: pointer;">
                              </div>
                              <div class="author-info" onclick="window.open('/user/${this.escape(a.username)}', '_blank')" style="cursor: pointer;">
                                  <div class="author-name">${this.escape(a.username)}</div>
                                  <div class="author-stats">${a.publicationsCount} публикации</div>
                              </div>
                              ${!isCurrentUser && window.isAuthenticated ? `
                                  <button class="follow-btn ${isFollowing ? 'following' : ''}" 
                                          data-author-id="${a.id}"
                                          onclick="rightSideBar.followAuthor(${a.id}, event)">
                                      <i class="bi ${isFollowing ? 'bi-check' : 'bi-person-plus'}"></i>
                                  </button>
                              ` : ''}
                          </div>
                      `;
                  }).join('');

                  // Инициализирай аватарите
                  if (window.createAvatar) {
                      setTimeout(() => {
                          document.querySelectorAll('#topAuthorsToday .avatar-placeholder').forEach(placeholder => {
                              const imageUrl = placeholder.getAttribute('data-user-image');
                              const username = placeholder.getAttribute('data-username');
                              const size = 40; // Размер за топ автори
                              const className = 'author-avatar';
                              
                              if (username) {
                                  placeholder.outerHTML = window.createAvatar(imageUrl, username, size, className);
                              }
                          });
                      }, 100);
                  }
              } catch (err) {
                  console.error('Authors error:', err);
              }
          }

    async loadTrending() {
        try {
            const res = await fetch('/publications/api/sidebar/trending');
            if (!res.ok) return;
            const topics = await res.json();
            
            const container = document.getElementById('trendingTopics');
            if (!container) return;

            if (!topics.length) {
                container.innerHTML = '<div class="empty-widget">Няма trending</div>';
                return;
            }

            container.innerHTML = topics.slice(0, 5).map(t => `
                <div class="trending-item" onclick="rightSideBar.searchTopic('${this.escape(t.topic)}')">
                    <span class="hashtag">#${this.escape(t.topic)}</span>
                    <span class="count">${t.count}</span>
                </div>
            `).join('');
        } catch (err) {
            console.error('Trending error:', err);
        }
    }

    async loadLastActivity() {
        try {
            const res = await fetch('/publications/api/sidebar/last-activity');
            if (!res.ok) return;
            const data = await res.json();
            
            const container = document.getElementById('lastActivityWidget');
            if (!container) return;

            container.innerHTML = `
                <div class="activity-item" ${data.lastPostId ? `onclick="rightSideBar.openPost(${data.lastPostId})"` : ''}>
                    <i class="bi bi-newspaper"></i>
                    <div class="activity-info">
                        <div class="activity-label">Последна публикация</div>
                        <div class="activity-time">${this.formatTime(data.lastPostTime)}</div>
                    </div>
                </div>
            `;
        } catch (err) {
            console.error('Activity error:', err);
        }
    }

    async loadMostCommented() {
        try {
            const res = await fetch('/publications/api/sidebar/most-commented');
            if (!res.ok) return;
            const post = await res.json();
            
            const container = document.getElementById('mostCommentedWidget');
            if (!container || !post.id) return;

            container.innerHTML = `
                <div class="featured-post" onclick="rightSideBar.openPost(${post.id})">
                    <div class="featured-header">
                        <div class="featured-author">
                            <div class="author-avatar-sm avatar-placeholder"
                                 data-user-image="${post.authorImage || '/images/default-avatar.png'}"
                                 data-username="${post.authorName}"
                                 data-user-id="${post.authorId}">
                            </div>
                            <span class="author-name-sm">${this.escape(post.authorName)}</span>
                        </div>
                        <div class="featured-badge">
                            <i class="bi bi-fire"></i> Hot
                        </div>
                    </div>
                    <div class="featured-title">${this.escape(post.title)}</div>
                    <div class="featured-stats">
                        <span><i class="bi bi-chat-fill"></i> ${post.commentsCount}</span>
                        <span><i class="bi bi-heart-fill"></i> ${post.likesCount}</span>
                    </div>
                </div>
            `;

            // Инициализирай аватарите
            if (window.createAvatar) {
                setTimeout(() => {
                    document.querySelectorAll('#mostCommentedWidget .avatar-placeholder').forEach(placeholder => {
                        const imageUrl = placeholder.getAttribute('data-user-image');
                        const username = placeholder.getAttribute('data-username');
                        const size = 24; // Малък размер за featured post
                        const className = 'author-avatar-sm';
                        
                        if (username) {
                            placeholder.outerHTML = window.createAvatar(imageUrl, username, size, className);
                        }
                    });
                }, 100);
            }
        } catch (err) {
            console.error('Most commented error:', err);
        }
    }

    async loadTopViewed() {
        try {
            const res = await fetch('/publications/api/sidebar/top-viewed');
            if (!res.ok) return;
            const posts = await res.json();
            
            const container = document.getElementById('topViewedWidget');
            if (!container) return;

            if (!posts || !posts.length) {
                container.innerHTML = '<div class="empty-widget">Няма данни днес</div>';
                return;
            }

            container.innerHTML = posts.map((post, index) => `
                <div class="compact-card" onclick="rightSideBar.openPost(${post.id})">
                    <div class="card-header">
                        <div class="card-rank">#${index + 1}</div>
                        <div class="card-author">
                            <div class="author-avatar-xs avatar-placeholder"
                                 data-user-image="${post.authorImage || '/images/default-avatar.png'}"
                                 data-username="${post.authorName}"
                                 data-user-id="${post.authorId}">
                            </div>
                            <span class="author-name-xs">${this.escape(post.authorName)}</span>
                        </div>
                    </div>
                    <div class="card-title">${this.escape(post.title)}</div>
                    <div class="card-stats">
                        <span><i class="bi bi-eye-fill"></i> ${post.viewsCount}</span>
                        <span><i class="bi bi-heart-fill"></i> ${post.likesCount}</span>
                    </div>
                </div>
            `).join('');

            // Инициализирай аватарите
            if (window.createAvatar) {
                setTimeout(() => {
                    document.querySelectorAll('#topViewedWidget .avatar-placeholder').forEach(placeholder => {
                        const imageUrl = placeholder.getAttribute('data-user-image');
                        const username = placeholder.getAttribute('data-username');
                        const size = 20;
                        const className = 'author-avatar-xs';
                        
                        if (username) {
                            placeholder.outerHTML = window.createAvatar(imageUrl, username, size, className);
                        }
                    });
                }, 100);
            }
        } catch (err) {
            console.error('Top viewed error:', err);
        }
    }

    async loadLastPublished() {
        try {
            const res = await fetch('/publications/api/sidebar/last-activity');
            if (!res.ok) return;
            const data = await res.json();
            
            const container = document.getElementById('lastPublishedWidget');
            if (!container || !data.lastPostId) return;

            container.innerHTML = `
                <div class="compact-card" onclick="rightSideBar.openPost(${data.lastPostId})">
                    <div class="card-header">
                        <div class="card-badge">
                            <i class="bi bi-clock"></i> Ново
                        </div>
                        <div class="card-author">
                            <div class="author-avatar-xs avatar-placeholder"
                                 data-user-image="${data.lastPostAuthorImage || '/images/default-avatar.png'}"
                                 data-username="${data.lastPostAuthor || 'Автор'}"
                                 data-user-id="0">
                            </div>
                            <span class="author-name-xs">${this.escape(data.lastPostAuthor || 'Автор')}</span>
                        </div>
                    </div>
                    <div class="card-title">${this.escape(data.lastPostTitle || 'Последна публикация')}</div>
                    <div class="card-stats">
                        <span><i class="bi bi-clock"></i> ${this.formatTime(data.lastPostTime)}</span>
                        <span><i class="bi bi-heart-fill"></i> ${data.lastPostLikes || 0}</span>
                        <span><i class="bi bi-chat-fill"></i> ${data.lastPostComments || 0}</span>
                    </div>
                </div>
            `;

            // Инициализирай аватарите
            if (window.createAvatar) {
                setTimeout(() => {
                    document.querySelectorAll('#lastPublishedWidget .avatar-placeholder').forEach(placeholder => {
                        const imageUrl = placeholder.getAttribute('data-user-image');
                        const username = placeholder.getAttribute('data-username');
                        const size = 20;
                        const className = 'author-avatar-xs';
                        
                        if (username) {
                            placeholder.outerHTML = window.createAvatar(imageUrl, username, size, className);
                        }
                    });
                }, 100);
            }
        } catch (err) {
            console.error('Last published error:', err);
        }
    }

    // ===== ACTIONS =====

    openProfile(username) {
        window.open(`/user/${username}`, '_blank');
    }

    openPost(postId) {
        if (window.openPublicationModal) {
            window.openPublicationModal(postId);
        }
    }

    searchTopic(topic) {
        if (window.filtersManager) {
            window.filtersManager.set('search', topic);
        }
    }

          async followAuthor(authorId, event) {
              event.stopPropagation();
              
              if (!window.isAuthenticated) {
                  if (window.postInteractions) {
                      window.postInteractions.showLoginPrompt();
                  }
                  return;
              }

              const btn = event.target.closest('.follow-btn');
              if (!btn) return;

              const isFollowing = btn.classList.contains('following');

              try {
                  // Използвай съществуващия /api/follow endpoint
                  const res = await fetch(`/api/follow/${authorId}`, {
                      method: isFollowing ? 'DELETE' : 'POST',
                      headers: {
                          'Content-Type': 'application/json',
                          [window.appData?.csrfHeader || 'X-CSRF-TOKEN']: window.appData?.csrfToken || ''
                      }
                  });

                  if (!res.ok) throw new Error('Failed to toggle follow');
                  const data = await res.json();
                  
                  // data.action ще е "followed" или "unfollowed"
                  if (data.action === 'followed') {
                      btn.classList.add('following');
                      btn.querySelector('i').className = 'bi bi-check';
                  } else {
                      btn.classList.remove('following');
                      btn.querySelector('i').className = 'bi bi-person-plus';
                  }
              } catch (err) {
                  console.error('Follow error:', err);
              }
          }

    // ===== HELPERS =====

    renderFollowButton(authorId) {
        if (!window.isAuthenticated || authorId == window.currentUserId) {
            return '';
        }
        return `<button class="follow-btn" onclick="rightSideBar.followAuthor(${authorId}, event)">
            <i class="bi bi-person-plus"></i>
        </button>`;
    }

    formatTime(timestamp) {
        if (!timestamp) return 'Няма данни';
        const now = new Date();
        const time = new Date(timestamp);
        const diff = Math.floor((now - time) / 1000);

        if (diff < 60) return 'Преди секунди';
        if (diff < 3600) return `Преди ${Math.floor(diff / 60)} мин`;
        if (diff < 86400) return `Преди ${Math.floor(diff / 3600)} ч`;
        return `Преди ${Math.floor(diff / 86400)} дни`;
    }

    updateElement(selector, value) {
        const el = document.querySelector(selector);
        if (el) el.textContent = value;
    }

    escape(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    window.rightSideBar = new RightSideBarManager();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.rightSideBar) {
        window.rightSideBar.stopAutoRefresh();
    }
});
