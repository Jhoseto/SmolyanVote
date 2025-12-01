(function () {
  const normalize = (list = []) =>
    (Array.isArray(list) ? list : []).map(n => ({
      ...n,
      read: n.read !== undefined ? n.read : (n.isRead !== undefined ? n.isRead : false),
      isRead: n.isRead !== undefined ? n.isRead : (n.read !== undefined ? n.read : false)
    }));

  function group(list) {
    if (window.notificationSystem && typeof window.notificationSystem.groupNotifications === 'function') {
      return window.notificationSystem.groupNotifications(list);
    }
    if (typeof window.groupNotifications === 'function') {
      return window.groupNotifications(list);
    }
    return list;
  }

  function createMarkup(items) {
    if (window.notificationSystem && typeof window.notificationSystem.createNotificationHTML === 'function') {
      return items.map(item => window.notificationSystem.createNotificationHTML(item)).join('');
    }

    return items.map(item => `
      <div class="notification-item ${item.read ? 'read' : 'unread'}" data-notification-id="${item.id}" data-notification-ids="${item._ids?.join(',') || item.id}" data-action-url="${item.actionUrl || ''}" data-entity-type="${item.entityType || ''}" data-entity-id="${item.entityId || ''}">
        <div class="notification-icon">
          ${item.actorImageUrl ? `<img src="${item.actorImageUrl}" alt="${item.actorUsername || ''}">` : `<i class="${item.icon || 'bi-bell'}"></i>`}
        </div>
        <div class="notification-content">
          <p class="notification-message">${item.message || ''}${item._count > 1 ? ` <span class="notification-count">(${item._count})</span>` : ''}</p>
          <span class="notification-time">${item.timeAgo || ''}</span>
        </div>
        ${!item.read ? '<div class="notification-unread-dot"></div>' : ''}
      </div>
    `).join('');
  }

  function attachHandler(container) {
    if (container._profileNotifHandler) {
      container.removeEventListener('click', container._profileNotifHandler);
      container._profileNotifHandler = null;
    }

    container._profileNotifHandler = function (e) {
      const markBtn = e.target.closest('.notification-mark-read');
      const item = e.target.closest('.notification-item');
      if (!item) return;

      const idsAttr = markBtn
        ? markBtn.getAttribute('data-notification-ids')
        : item.getAttribute('data-notification-ids') || item.getAttribute('data-notification-id');

      const ids = (idsAttr || '')
        .split(',')
        .map(id => parseInt(id.trim(), 10))
        .filter(id => !Number.isNaN(id));

      const mainId = ids[0];

      if (markBtn) {
        if (ids.length && window.notificationSystem && typeof window.notificationSystem.markAsRead === 'function') {
          Promise.all(ids.map(id => window.notificationSystem.markAsRead(id).catch(() => {})));
        }
        item.classList.remove('unread');
        item.classList.add('read');
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (mainId && window.notificationSystem && typeof window.notificationSystem.markAsRead === 'function') {
        window.notificationSystem.markAsRead(mainId).catch(() => {});
      }

      item.classList.remove('unread');
      item.classList.add('read');

      const list = container._notifications || [];
      const match = list.find(n => String(n.id) === String(mainId));
      if (match) {
        match.read = true;
        match.isRead = true;
      }

      if (match && match.actionUrl) {
        if (window.notificationSystem && typeof window.notificationSystem.navigateToNotification === 'function') {
          window.notificationSystem.navigateToNotification(
            match.actionUrl, 
            match.id, 
            match.entityType || '', 
            match.entityId || ''
          );
        } else if (typeof window.showNotificationMissingModal === 'function') {
          window.showNotificationMissingModal();
        } else {
          window.location.href = match.actionUrl;
        }
        return;
      }

      if (typeof window.showNotificationMissingModal === 'function') {
        window.showNotificationMissingModal();
      } else {
        alert('Това съдържание вече не е налично.');
      }
    };

    container.addEventListener('click', container._profileNotifHandler);
  }

  function render(list, container) {
    if (!container) return;

    const grouped = group(normalize(list));
    container._notifications = grouped;

    if (!grouped.length) {
      container.innerHTML = '<div class="empty-state"><i class="bi bi-bell"></i><h4>Няма нотификации</h4></div>';
      if (container._profileNotifHandler) {
        container.removeEventListener('click', container._profileNotifHandler);
        container._profileNotifHandler = null;
      }
      return;
    }

    container.innerHTML = createMarkup(grouped);
    attachHandler(container);
  }

  window.renderProfileNotifications = function (list, target) {
    const container = target || document.querySelector('#profile-notifications');
    render(list, container);
  };

  window.renderNotificationsList = window.renderNotificationsList || window.renderProfileNotifications;
})();
