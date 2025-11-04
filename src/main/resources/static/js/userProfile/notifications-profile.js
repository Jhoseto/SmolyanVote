(function () {
  async function fetchAll(page = 0, size = 50) {
    const res = await fetch(`/api/notifications?page=${page}&size=${size}`);
    if (!res.ok) return [];
    return await res.json();
  }

  function render(list) {
    const container = document.querySelector('#profile-notifications');
    if (!container) return;

    if (!list || list.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="bi bi-bell"></i><h4>Няма нотификации</h4></div>';
      return;
    }

    const grouped = (window.groupNotifications ? window.groupNotifications(list) : list);
    container.innerHTML = grouped.map(item => `
      <div class="notif-row ${item.read ? 'read' : 'unread'}" data-id="${item.id}">
        <div class="icon">${item.actorImageUrl ? `<img src="${item.actorImageUrl}"/>` : `<i class="${item.icon || 'bi-bell'}"></i>`}</div>
        <div class="content">
          <div class="title">${item.displayName || ''}</div>
          <div class="message">${item.message || ''}${item._count > 1 ? ` <span class="notification-count">(${item._count})</span>` : ''}</div>
          <div class="time">${item.timeAgo || ''}</div>
        </div>
        ${!item.read ? '<div class="dot"></div>' : ''}
      </div>
    `).join('');

    container.addEventListener('click', function (e) {
      const row = e.target.closest('.notif-row');
      if (!row) return;
      const id = row.getAttribute('data-id');
      if (id) {
        fetch(`/api/notifications/${id}/read`, { method: 'PUT' }).catch(() => {});
      }
      const idx = grouped.findIndex(n => String(n.id) === String(id));
      const url = idx >= 0 ? grouped[idx].actionUrl : null;
      if (url) window.location.href = url;
    });
  }

  function init() {
    const container = document.querySelector('#profile-notifications');
    if (!container) return; // Контейнерът не съществува - не е собствен профил
    
    // Проверка дали е собствен профил - ако контейнерът е скрит или не съществува, не зареждаме нотификации
    const notificationsCard = container.closest('.content-card');
    if (!notificationsCard || notificationsCard.offsetParent === null) {
      return; // Картата е скрита (не е собствен профил)
    }
    
    fetchAll(0, 100).then(render).catch(() => render([]));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


