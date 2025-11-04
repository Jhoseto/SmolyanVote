// ====== REACTION USERS MODAL ======

function showReactionUsersModal(publicationId, reactionType) {
  const modal = document.getElementById('reactionUsersModal');
  const title = document.getElementById('reactionUsersModalTitle');
  const body = document.getElementById('reactionUsersModalBody');
  
  title.textContent = reactionType === 'like' ? 'Харесали' : 'Не харесали';
  body.innerHTML = '<div class="loading-spinner"><i class="bi bi-arrow-repeat"></i> Зареждане...</div>';
  modal.style.display = 'flex';
  
  const endpoint = reactionType === 'like' 
    ? `/publications/api/${publicationId}/liked-users`
    : `/publications/api/${publicationId}/disliked-users`;
  
  fetch(endpoint)
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        body.innerHTML = `<div class="error-message">${data.error}</div>`;
        return;
      }
      
      const users = data.users || [];
      if (users.length === 0) {
        body.innerHTML = '<div class="empty-message">Няма потребители</div>';
        return;
      }
      
      const isAuthenticated = window.isAuthenticated === true;
      
      body.innerHTML = users.map((user, index) => `
        <div class="reaction-user-item" data-user-id="${user.id}" data-username="${user.username}">
          <div class="reaction-user-avatar">
            ${user.imageUrl 
              ? `<img src="${user.imageUrl}" alt="${user.username}">`
              : `<div class="avatar-placeholder">${(user.username || 'U').charAt(0).toUpperCase()}</div>`}
          </div>
          <div class="reaction-user-info">
            <div class="reaction-user-name">${user.fullName || user.username}</div>
          </div>
          ${isAuthenticated ? `
          <div class="reaction-user-menu-container">
            <button class="reaction-user-menu-btn" onclick="toggleReactionUserMenu(event, ${index})">
              <i class="bi bi-three-dots"></i>
            </button>
            <div class="reaction-user-menu-dropdown" id="reaction-user-menu-${index}" style="display: none;">
              <a href="/user/${user.username}" class="reaction-user-menu-item">
                <i class="bi bi-person"></i> Прегледай профил
              </a>
              <button class="reaction-user-menu-item reaction-follow-btn" data-user-id="${user.id}" data-username="${user.username}" onclick="handleReactionUserFollow(event, ${user.id})" style="display: none;">
                <i class="bi bi-person-plus"></i> <span class="follow-text">Следвай</span>
              </button>
              <button class="reaction-user-menu-item reaction-message-btn" data-user-id="${user.id}" data-username="${user.username}" onclick="handleReactionUserMessage(event, ${user.id})">
                <i class="bi bi-chat"></i> Съобщение
              </button>
            </div>
          </div>
          ` : ''}
        </div>
      `).join('');
      
      if (isAuthenticated) {
        setTimeout(() => loadReactionUsersFollowStatus(), 50);
      }
    })
    .catch(error => {
      console.error('Error loading reaction users:', error);
      body.innerHTML = '<div class="error-message">Възникна грешка при зареждането</div>';
    });
}

function closeReactionUsersModal() {
  document.getElementById('reactionUsersModal').style.display = 'none';
}

function toggleReactionUserMenu(event, index) {
  event.stopPropagation();
  const dropdown = document.getElementById(`reaction-user-menu-${index}`);
  const allDropdowns = document.querySelectorAll('.reaction-user-menu-dropdown');
  
  allDropdowns.forEach(d => {
    if (d !== dropdown) d.style.display = 'none';
  });
  
  dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

async function handleReactionUserFollow(event, userId) {
  event.stopPropagation();
  const btn = event.target.closest('.reaction-follow-btn');
  const followText = btn.querySelector('.follow-text');
  const isFollowing = btn.classList.contains('following');
  
  try {
    const csrfToken = document.querySelector('meta[name="_csrf"]')?.getAttribute('content');
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.getAttribute('content');
    
    const url = `/api/follow/${userId}`;
    const method = isFollowing ? 'DELETE' : 'POST';
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        [csrfHeader]: csrfToken
      }
    });
    
    if (response.ok) {
      const userItem = btn.closest('.reaction-user-item');
      const dropdown = userItem.querySelector('.reaction-user-menu-dropdown');
      const followBtn = dropdown.querySelector('.reaction-follow-btn');
      const messageBtn = dropdown.querySelector('.reaction-message-btn');
      
      if (isFollowing) {
        if (followBtn) followBtn.style.display = 'block';
        if (messageBtn) messageBtn.style.display = 'none';
        btn.classList.remove('following');
        followText.textContent = 'Следвай';
      } else {
        if (followBtn) followBtn.style.display = 'none';
        if (messageBtn) messageBtn.style.display = 'block';
        btn.classList.add('following');
      }
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
  }
  
  btn.closest('.reaction-user-menu-dropdown').style.display = 'none';
}

async function handleReactionUserMessage(event, userId) {
  event.stopPropagation();
  const dropdown = event.target.closest('.reaction-user-menu-dropdown');
  if (dropdown) dropdown.style.display = 'none';
  
  closeReactionUsersModal();
  
  try {
    if (window.SVMessenger && window.SVMessenger.startConversation) {
      const conversation = await window.SVMessenger.startConversation(userId);
      if (conversation && window.SVMessenger.openChat) {
        window.SVMessenger.openChat(conversation.id);
      }
    } else {
      let attempts = 0;
      const maxAttempts = 10;
      const checkInterval = setInterval(() => {
        attempts++;
        if (window.SVMessenger && window.SVMessenger.startConversation) {
          clearInterval(checkInterval);
          window.SVMessenger.startConversation(userId).then(conversation => {
            if (conversation && window.SVMessenger.openChat) {
              window.SVMessenger.openChat(conversation.id);
            }
          });
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          alert('Съобщенията не са налични в момента');
        }
      }, 200);
    }
  } catch (error) {
    console.error('Error opening chat:', error);
    alert('Възникна грешка при отварянето на чата');
  }
}

async function loadReactionUsersFollowStatus() {
  if (!window.isAuthenticated) return;
  
  const userItems = document.querySelectorAll('.reaction-user-item');
  if (userItems.length === 0) return;
  
  try {
    const currentUserData = document.getElementById('current-user-data');
    if (!currentUserData) return;
    
    const currentUserId = currentUserData.dataset.userId;
    if (!currentUserId) return;
    
    for (const item of userItems) {
      const userId = item.dataset.userId;
      if (!userId) continue;
      
      if (userId === currentUserId) {
        const dropdown = item.querySelector('.reaction-user-menu-dropdown');
        if (dropdown) {
          const followBtn = dropdown.querySelector('.reaction-follow-btn');
          if (followBtn) followBtn.style.display = 'none';
        }
        continue;
      }
      
      try {
        const response = await fetch(`/api/follow/${userId}/status`);
        if (!response.ok) {
          const dropdown = item.querySelector('.reaction-user-menu-dropdown');
          if (dropdown) {
            const followBtn = dropdown.querySelector('.reaction-follow-btn');
            if (followBtn) followBtn.style.display = 'block';
          }
          continue;
        }
        
        const data = await response.json();
        const dropdown = item.querySelector('.reaction-user-menu-dropdown');
        if (!dropdown) continue;
        
        const followBtn = dropdown.querySelector('.reaction-follow-btn');
        
        if (data.isFollowing === true) {
          if (followBtn) followBtn.style.display = 'none';
        } else {
          if (followBtn) followBtn.style.display = 'block';
        }
      } catch (error) {
        const dropdown = item.querySelector('.reaction-user-menu-dropdown');
        if (dropdown) {
          const followBtn = dropdown.querySelector('.reaction-follow-btn');
          if (followBtn) followBtn.style.display = 'block';
        }
      }
    }
  } catch (error) {
    console.error('Error loading follow statuses:', error);
  }
}

// Event delegation for stats clicks
document.addEventListener('DOMContentLoaded', function() {
  document.addEventListener('click', function(e) {
    const likeStats = e.target.closest('.like-stats-clickable');
    const dislikeStats = e.target.closest('.dislike-stats-clickable');
    
    if (likeStats) {
      const publicationId = likeStats.dataset.postId;
      const count = parseInt(likeStats.querySelector('.like-stats-count').textContent);
      if (count > 0) {
        showReactionUsersModal(publicationId, 'like');
      }
      e.preventDefault();
      e.stopPropagation();
    } else if (dislikeStats) {
      const publicationId = dislikeStats.dataset.postId;
      const count = parseInt(dislikeStats.querySelector('.dislike-stats-count').textContent);
      if (count > 0) {
        showReactionUsersModal(publicationId, 'dislike');
      }
      e.preventDefault();
      e.stopPropagation();
    }
  });
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.reaction-user-menu-container')) {
      document.querySelectorAll('.reaction-user-menu-dropdown').forEach(d => {
        d.style.display = 'none';
      });
    }
  });
});

