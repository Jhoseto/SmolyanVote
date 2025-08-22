/**
 * User Management JavaScript - SmolyanVote Admin
 * COMPLETE VERSION - всички функции от оригинала + фиксове
 */

// ===== STATE MANAGEMENT =====
const UserManagement = {
    users: [],
    filteredUsers: [],
    selectedUsers: new Set(),
    currentSort: { column: 'created', direction: 'desc' },
    currentFilters: { search: '', role: '', status: '', activity: '', dateFrom: '', dateTo: '' },
    pagination: { currentPage: 1, usersPerPage: 20, totalPages: 1 },
    initialized: false
};

// ===== UTILITIES =====
function $(id) {
    return document.getElementById(id);
}

function $$(selector) {
    return document.querySelector(selector);
}

function update(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
}

function showNotification(message, type = 'info') {
    if (window.showToast) {
        window.showToast(message, type);
    } else if (window.Swal) {
        window.Swal.fire({
            title: type === 'error' ? 'Грешка!' : 'Информация',
            text: message,
            icon: type === 'error' ? 'error' : 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
    } else {
        console.log(`${type.toUpperCase()}: ${message}`);
        alert(message);
    }
}

// Enhanced element detection
function elementExists(id) {
    const element = $(id);
    const exists = element !== null;
    const visible = exists && element.offsetParent !== null;
    return exists;
}

function debugElements() {
    const elements = [
        'users-table-body',
        'users-table',
        'user-search-input',
        'total-users-count',
        'bulk-operations-bar'
    ];
    elements.forEach(elementExists);
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeWithRetry();
});

async function initializeWithRetry() {
    try {
        // Always load statistics and users first (they don't depend on DOM elements)
        await loadUserStatistics();
        await loadAllUsers();

        // Then initialize UI when elements are available
        await initializeUI();

    } catch (error) {
        console.error('Initialization error:', error);
        // Retry after delay
        setTimeout(() => {
            initializeWithRetry();
        }, 1000);
    }
}

async function initializeUI() {
    // Wait for critical elements
    try {
        debugElements();

        // Initialize event listeners (works even if some elements are missing)
        initializeEventListeners();

        if ($('users-table-body')) {
            updateUsersTable();
            updatePagination();
        }

        UserManagement.initialized = true;

        // Update table with loaded data after UI initialization
        if (UserManagement.filteredUsers.length > 0) {
            updateUsersTable();
            updatePagination();
        } else if (UserManagement.users.length > 0) {
            applyFiltersAndUpdate();
        }

    } catch (error) {
        console.warn('UI initialization partial:', error.message);
        UserManagement.initialized = true; // Still mark as initialized
    }
}

function initializeEventListeners() {
    const setupListener = (id, event, handler) => {
        const element = $(id);
        if (element) {
            element.addEventListener(event, handler);
        }
    };

    // Search and filters
    setupListener('user-search-input', 'input', handleSearch);
    setupListener('role-filter', 'change', handleRoleFilter);
    setupListener('status-filter', 'change', handleStatusFilter);
    setupListener('activity-filter', 'change', handleActivityFilter);
    setupListener('registration-from', 'change', handleDateFilter);
    setupListener('registration-to', 'change', handleDateFilter);
    setupListener('clear-filters-btn', 'click', clearAllFilters);
    setupListener('users-refresh-btn', 'click', refreshUsers);

    // Bulk operations
    setupListener('select-all-users', 'change', handleSelectAll);
    setupListener('bulk-promote-btn', 'click', handleBulkPromote);
    setupListener('bulk-demote-btn', 'click', handleBulkDemote);
    setupListener('bulk-ban-btn', 'click', handleBulkBan);
    setupListener('bulk-unban-btn', 'click', handleBulkUnban);

    // Pagination
    setupListener('prev-page-btn', 'click', () => changePage(-1));
    setupListener('next-page-btn', 'click', () => changePage(1));

    // Modal form actions
    setupListener('confirm-ban-btn', 'click', confirmBanUser);
    setupListener('confirm-role-change-btn', 'click', confirmRoleChange);

    // Table sorting
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => handleSort(header.dataset.column));
    });

    // FIXED: Event delegation for user checkboxes
    const tableBody = $('users-table-body');
    if (tableBody) {
        tableBody.addEventListener('change', function(e) {
            if (e.target.classList.contains('user-select')) {
                handleUserSelect(e);
            }
        });
    }
}

// ===== API CALLS =====
async function loadUserStatistics() {
    try {
        const response = await fetch('/admin/users/statistics');

        if (!response.ok) {
            throw new Error(`Statistics failed: ${response.status}`);
        }

        const stats = await response.json();
        updateStatisticsDisplay(stats);
    } catch (error) {
        console.error('Statistics error:', error);
        showNotification('Грешка при зареждане на статистиките: ' + error.message, 'error');
    }
}

async function loadAllUsers() {
    try {
        const response = await fetch('/admin/users');

        if (!response.ok) {
            throw new Error(`API failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        UserManagement.users = data.users || [];

        if (UserManagement.users.length === 0) {
            console.warn('No users returned from API');
        }

        // Apply filters and update UI if initialized
        applyFiltersAndUpdate();

    } catch (error) {
        console.error('Users loading error:', error);
        showNotification('Грешка при зареждане на потребителите: ' + error.message, 'error');

        // Show error in table if element exists
        const tbody = $('users-table-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4 text-danger">
                        <i class="bi bi-exclamation-triangle"></i>
                        <p class="mb-2">Грешка при зареждане: ${error.message}</p>
                        <button class="btn btn-sm btn-outline-primary" onclick="loadAllUsers()">
                            <i class="bi bi-arrow-clockwise"></i> Опитай отново
                        </button>
                    </td>
                </tr>
            `;
        }
    }
}

// ===== DISPLAY UPDATES =====
function updateStatisticsDisplay(stats) {
    // Safe updates - only update if element exists
    const safeUpdate = (id, value) => {
        const element = $(id);
        if (element) {
            element.textContent = value;
        }
    };

    safeUpdate('total-users-count', stats.totalUsers || 0);
    safeUpdate('active-users-count', stats.activeUsers || 0);
    safeUpdate('online-users-count', stats.onlineUsers || 0);
    safeUpdate('admin-users-count', stats.adminCount || 0);
    safeUpdate('total-users-change', `+${stats.weekRegistrations || 0}`);
    safeUpdate('user-stats-period', 'Обновено: ' + new Date().toLocaleTimeString('bg-BG'));
}

function updateUsersTable() {
    const tbody = $('users-table-body');
    if (!tbody) {
        return;
    }

    const start = (UserManagement.pagination.currentPage - 1) * UserManagement.pagination.usersPerPage;
    const end = start + UserManagement.pagination.usersPerPage;
    const paginatedUsers = UserManagement.filteredUsers.slice(start, end);

    if (paginatedUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <i class="bi bi-inbox text-muted"></i>
                    <p class="text-muted mb-0">Няма намерени потребители</p>
                    <small class="text-muted">Общо: ${UserManagement.users.length}, Филтрирани: ${UserManagement.filteredUsers.length}</small>
                </td>
            </tr>
        `;
        return;
    }

    try {
        const userRows = paginatedUsers.map((user, index) => {
            return createUserRow(user);
        });

        tbody.innerHTML = userRows.join('');

        // Initialize avatars using avatarUtils.js if available
        if (window.avatarUtils) {
            setTimeout(() => {
                window.avatarUtils.initializeAllAvatars();
            }, 100);
        }

        updateBulkOperationsBar();
    } catch (error) {
        console.error('Error updating table:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle"></i>
                    <p class="mb-0">Грешка при показване: ${error.message}</p>
                </td>
            </tr>
        `;
    }
}

function createUserRow(user) {
    try {
        const activityScore = (user.userEventsCount || 0) + (user.publicationsCount || 0) + (user.totalVotes || 0);
        const activityLevel = activityScore >= 10 ? 'high' : activityScore >= 3 ? 'medium' : activityScore > 0 ? 'low' : 'inactive';
        const registrationDate = user.created ? new Date(user.created).toLocaleDateString('bg-BG') : '-';
        const lastOnlineDate = user.lastOnline ? new Date(user.lastOnline).toLocaleDateString('bg-BG') : 'Никога';

        // Status badge styling
        const getStatusBadge = (status) => {
            const statusMap = {
                'ACTIVE': { class: 'success', text: 'Активен' },
                'PENDING_ACTIVATION': { class: 'warning', text: 'Чакащ' },
                'TEMPORARILY_BANNED': { class: 'danger', text: 'Временно блокиран' },
                'PERMANENTLY_BANNED': { class: 'dark', text: 'Перманентно блокиран' }
            };
            const statusInfo = statusMap[status] || { class: 'secondary', text: status };
            return `<span class="badge bg-${statusInfo.class}">${statusInfo.text}</span>`;
        };

        // Role badge styling
        const getRoleBadge = (role) => {
            return role === 'ADMIN'
                ? '<span class="badge bg-primary">ADMIN</span>'
                : '<span class="badge bg-info">USER</span>';
        };

        // Online status indicator
        const getOnlineIndicator = (onlineStatus) => {
            return onlineStatus === 1
                ? '<i class="bi bi-circle-fill text-success" title="Онлайн"></i>'
                : '<i class="bi bi-circle text-muted" title="Офлайн"></i>';
        };

        // Activity level styling
        const getActivityBadge = (level, score) => {
            const levelMap = {
                'high': { class: 'success', text: 'Висока' },
                'medium': { class: 'warning', text: 'Средна' },
                'low': { class: 'info', text: 'Ниска' },
                'inactive': { class: 'secondary', text: 'Неактивен' }
            };
            const levelInfo = levelMap[level] || { class: 'secondary', text: 'N/A' };
            return `<span class="badge bg-${levelInfo.class}" title="${score} действия">${levelInfo.text}</span>`;
        };

        const avatarHtml = `<img src="${user.imageUrl || '/images/default-avatar.png'}" 
                           alt="${user.username}" class="rounded-circle me-2" 
                           style="width: 32px; height: 32px; object-fit: cover;"
                           onerror="this.src='/images/default-avatar.png'">`;

        const rowHtml = `
            <tr>
                <td>
                    <input type="checkbox" class="form-check-input user-select" data-user-id="${user.id}">
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        ${avatarHtml}
                        <div>
                            <div class="fw-bold">${user.username || 'N/A'}</div>
                            <small class="text-muted">${user.realName || ''}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div>${user.email || 'N/A'}</div>
                    <small class="text-muted">${user.location || ''}</small>
                </td>
                <td>
                    ${getRoleBadge(user.role)}
                </td>
                <td>
                    ${getStatusBadge(user.status)}
                    ${user.banReason ? `<br><small class="text-danger">${user.banReason}</small>` : ''}
                </td>
                <td>
                    <small class="text-muted">${registrationDate}</small>
                </td>
                <td>
                    ${getOnlineIndicator(user.onlineStatus)}
                    <small class="d-block text-muted">${lastOnlineDate}</small>
                </td>
                <td>
                    ${getActivityBadge(activityLevel, activityScore)}
                    <small class="d-block text-muted">
                        П: ${user.publicationsCount || 0} | 
                        Г: ${user.totalVotes || 0}
                    </small>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-info" onclick="showUserDetails(${user.id})" title="Детайли">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-${user.status?.includes('BANNED') ? 'success' : 'warning'}" 
                                onclick="showBanModal(${user.id})" title="${user.status?.includes('BANNED') ? 'Отблокирай' : 'Блокирай'}">
                            <i class="bi bi-${user.status?.includes('BANNED') ? 'check-circle' : 'ban'}"></i>
                        </button>
                        <button type="button" class="btn btn-outline-primary" onclick="showRoleChangeModal(${user.id})" title="Промени роля">
                            <i class="bi bi-arrow-up-circle"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger" onclick="deleteUser(${user.id})" title="Изтрий">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;

        return rowHtml;

    } catch (error) {
        console.error('Error creating row for user:', user.username, error);
        return `<tr><td colspan="9" class="text-danger">Грешка при зареждане на ${user.username}</td></tr>`;
    }
}

// ===== FILTERING & SEARCH =====
function handleSearch(e) {
    UserManagement.currentFilters.search = e.target.value.toLowerCase();
    applyFiltersAndUpdate();
}

function handleRoleFilter(e) {
    UserManagement.currentFilters.role = e.target.value;
    applyFiltersAndUpdate();
}

function handleStatusFilter(e) {
    UserManagement.currentFilters.status = e.target.value;
    applyFiltersAndUpdate();
}

function handleActivityFilter(e) {
    UserManagement.currentFilters.activity = e.target.value;
    applyFiltersAndUpdate();
}

function handleDateFilter() {
    UserManagement.currentFilters.dateFrom = $('registration-from')?.value || '';
    UserManagement.currentFilters.dateTo = $('registration-to')?.value || '';
    applyFiltersAndUpdate();
}

function clearAllFilters() {
    ['user-search-input', 'role-filter', 'status-filter', 'activity-filter', 'registration-from', 'registration-to'].forEach(id => {
        const element = $(id);
        if (element) element.value = '';
    });

    UserManagement.currentFilters = { search: '', role: '', status: '', activity: '', dateFrom: '', dateTo: '' };
    applyFiltersAndUpdate();
    showNotification('Филтрите са изчистени', 'success');
}

function applyFiltersAndUpdate() {
    UserManagement.filteredUsers = UserManagement.users.filter(user => {
        const { search, role, status, activity, dateFrom, dateTo } = UserManagement.currentFilters;

        // Search filter
        if (search && !['username', 'email', 'realName'].some(field =>
            user[field]?.toLowerCase().includes(search))) return false;

        // Role filter
        if (role && user.role !== role) return false;

        // Status filter
        if (status) {
            if (status === 'active' && user.status !== 'ACTIVE') return false;
            if (status === 'inactive' && user.status === 'ACTIVE') return false;
            if (status === 'online' && user.onlineStatus !== 1) return false;
            if (status === 'banned' && !user.status?.includes('BANNED')) return false;
        }

        // Activity filter
        if (activity) {
            const totalActivity = (user.userEventsCount || 0) + (user.publicationsCount || 0) + (user.totalVotes || 0);
            if (activity === 'high' && totalActivity < 10) return false;
            if (activity === 'medium' && (totalActivity < 3 || totalActivity >= 10)) return false;
            if (activity === 'low' && (totalActivity < 1 || totalActivity >= 3)) return false;
            if (activity === 'inactive' && totalActivity > 0) return false;
        }

        // Date filters
        if (dateFrom || dateTo) {
            const userDate = new Date(user.created);
            if (dateFrom && userDate < new Date(dateFrom)) return false;
            if (dateTo && userDate > new Date(dateTo)) return false;
        }

        return true;
    });

    applySorting();
    UserManagement.pagination.currentPage = 1;

    // Only update UI if initialized
    if (UserManagement.initialized) {
        updateUsersTable();
        updatePagination();
    }
}

// ===== SORTING =====
function handleSort(column) {
    if (UserManagement.currentSort.column === column) {
        UserManagement.currentSort.direction = UserManagement.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        UserManagement.currentSort.column = column;
        UserManagement.currentSort.direction = 'asc';
    }

    applySorting();
    updateUsersTable();
    updateSortingIcons();
}

function applySorting() {
    UserManagement.filteredUsers.sort((a, b) => {
        const { column, direction } = UserManagement.currentSort;
        let aVal = a[column];
        let bVal = b[column];

        if (column === 'created' || column === 'lastOnline') {
            aVal = new Date(aVal || 0);
            bVal = new Date(bVal || 0);
        }

        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = (bVal || '').toLowerCase();
        }

        let result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return direction === 'desc' ? -result : result;
    });
}

function updateSortingIcons() {
    document.querySelectorAll('.sort-icon').forEach(icon => {
        icon.className = 'bi bi-chevron-down sort-icon';
    });

    const currentHeader = document.querySelector(`[data-column="${UserManagement.currentSort.column}"] .sort-icon`);
    if (currentHeader) {
        currentHeader.className = UserManagement.currentSort.direction === 'asc'
            ? 'bi bi-chevron-up sort-icon'
            : 'bi bi-chevron-down sort-icon';
    }
}

// FIXED: Bulk operations with proper event handling
function handleSelectAll(e) {
    const isChecked = e.target.checked;
    const checkboxes = document.querySelectorAll('.user-select');

    UserManagement.selectedUsers.clear(); // Clear first

    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        const userId = parseInt(checkbox.dataset.userId);
        if (userId && isChecked) {
            UserManagement.selectedUsers.add(userId);
        }
    });
    updateBulkOperationsBar();
}

function handleUserSelect(e) {
    const userId = parseInt(e.target.dataset.userId);
    if (!userId) return;

    if (e.target.checked) {
        UserManagement.selectedUsers.add(userId);
    } else {
        UserManagement.selectedUsers.delete(userId);
    }

    updateBulkOperationsBar();
    updateSelectAllCheckbox();
}

function updateBulkOperationsBar() {
    const bulkBar = $('bulk-operations-bar');
    const countElement = $('selected-users-count');

    if (bulkBar && countElement) {
        const selectedCount = UserManagement.selectedUsers.size;
        if (selectedCount > 0) {
            bulkBar.style.display = 'flex';
            countElement.textContent = selectedCount;
        } else {
            bulkBar.style.display = 'none';
        }
    }
}

function updateSelectAllCheckbox() {
    const selectAllCheckbox = $('select-all-users');
    if (selectAllCheckbox) {
        const userCheckboxes = document.querySelectorAll('.user-select');
        const checkedCount = document.querySelectorAll('.user-select:checked').length;

        selectAllCheckbox.checked = checkedCount === userCheckboxes.length && userCheckboxes.length > 0;
        selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < userCheckboxes.length;
    }
}

// ===== PAGINATION =====
function updatePagination() {
    UserManagement.pagination.totalPages = Math.ceil(UserManagement.filteredUsers.length / UserManagement.pagination.usersPerPage) || 1;

    const start = (UserManagement.pagination.currentPage - 1) * UserManagement.pagination.usersPerPage + 1;
    const end = Math.min(start + UserManagement.pagination.usersPerPage - 1, UserManagement.filteredUsers.length);

    // Safe updates
    const safeUpdate = (id, value) => {
        const element = $(id);
        if (element) element.textContent = value;
    };

    safeUpdate('users-from', start);
    safeUpdate('users-to', end);
    safeUpdate('users-total', UserManagement.filteredUsers.length);
    safeUpdate('current-page', UserManagement.pagination.currentPage);
    safeUpdate('total-pages', UserManagement.pagination.totalPages);

    const prevBtn = $('prev-page-btn');
    const nextBtn = $('next-page-btn');
    if (prevBtn) prevBtn.disabled = UserManagement.pagination.currentPage === 1;
    if (nextBtn) nextBtn.disabled = UserManagement.pagination.currentPage === UserManagement.pagination.totalPages;
}

function changePage(direction) {
    const newPage = UserManagement.pagination.currentPage + direction;
    if (newPage >= 1 && newPage <= UserManagement.pagination.totalPages) {
        UserManagement.pagination.currentPage = newPage;
        updateUsersTable();
        updatePagination();
    }
}

// ===== USER ACTIONS =====
async function showUserDetails(userId) {
    try {
        const response = await fetch(`/admin/users/${userId}`);
        if (!response.ok) throw new Error('User details failed');

        const user = await response.json();
        populateUserDetailsModal(user);

        // ===== FIXED: Enhanced modal opening with multiple fallbacks
        const modal = $('user-details-modal');
        if (modal) {
            // Method 1: Bootstrap 5 Modal (preferred)
            if (window.bootstrap && window.bootstrap.Modal) {
                try {
                    const bsModal = new window.bootstrap.Modal(modal, {
                        backdrop: true,
                        keyboard: true,
                        focus: true
                    });
                    bsModal.show();
                    return;
                } catch (bsError) {
                    console.error('Bootstrap 5 Modal failed:', bsError);
                }
            }

            // Method 2: jQuery Bootstrap Modal (fallback)
            if (window.$ && window.$.fn && window.$.fn.modal) {
                try {
                    window.$(modal).modal('show');
                    return;
                } catch (jqError) {
                    console.error('jQuery Modal failed:', jqError);
                }
            }

            // Method 3: Manual display (last resort)
            modal.style.display = 'block';
            modal.classList.add('show');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('role', 'dialog');
            modal.removeAttribute('aria-hidden');
            document.body.classList.add('modal-open');

            // Create backdrop manually
            let backdrop = document.querySelector('.modal-backdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.className = 'modal-backdrop fade show';
                backdrop.style.zIndex = '1040';
                backdrop.onclick = () => closeUserDetailsModal();
                document.body.appendChild(backdrop);
            }

            // Add close button listener
            const closeBtn = modal.querySelector('.btn-close, [data-bs-dismiss="modal"]');
            if (closeBtn) {
                closeBtn.onclick = () => closeUserDetailsModal();
            }
        }
    } catch (error) {
        console.error('User details error:', error);
        showNotification('Грешка при зареждане на детайлите', 'error');
    }
}

// Helper function to close modal manually
function closeUserDetailsModal() {
    const modal = $('user-details-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        modal.removeAttribute('aria-modal');
        modal.removeAttribute('role');
        document.body.classList.remove('modal-open');

        // Remove backdrop
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
    }
}

function populateUserDetailsModal(user) {
    const safeUpdate = (id, value) => {
        const element = $(id);
        if (element) element.textContent = value;
    };

    const safeUpdateHTML = (id, html) => {
        const element = $(id);
        if (element) element.innerHTML = html;
    };

    // Basic information
    safeUpdate('modal-user-username', user.username || '-');
    safeUpdate('modal-user-email', user.email || '-');
    safeUpdate('modal-user-role', user.role || '-');
    safeUpdate('modal-user-registration', user.created ? new Date(user.created).toLocaleDateString('bg-BG') : '-');
    safeUpdate('modal-user-real-name', user.realName || 'Не е указано');
    safeUpdate('modal-user-bio', user.bio || 'Няма био информация');
    safeUpdate('modal-user-location', user.location || 'Не е указано');
    safeUpdate('modal-user-last-online', getLastOnlineDisplay(user.lastOnline, user.onlineStatus));
    safeUpdate('modal-user-last-modified', user.modified ? new Date(user.modified).toLocaleString('bg-BG') : '-');

    const statusHTML = getEnhancedStatusDisplay(user);
    safeUpdateHTML('modal-user-status-text', statusHTML);

    populateActivityStats(user);
    populateBanInformation(user);

    const avatar = $('modal-user-avatar');
    if (avatar) {
        avatar.src = user.imageUrl || '/images/default-avatar.png';
        avatar.onerror = function() { this.src = '/images/default-avatar.png'; };
    }

    const statusIndicator = $('modal-user-status');
    if (statusIndicator) {
        statusIndicator.className = `user-status-indicator ${user.onlineStatus === 1 ? 'online' : 'offline'}`;
    }

    // FIXED: Modal action buttons with proper event listeners
    const banBtn = $('modal-ban-user-btn');
    const promoteBtn = $('modal-promote-user-btn');

    if (banBtn) {
        banBtn.dataset.userId = user.id;
        banBtn.onclick = () => showBanModal(user.id);

        if (user.status?.includes('BANNED')) {
            banBtn.className = 'btn btn-success';
            banBtn.innerHTML = '<i class="bi bi-check-circle"></i> Отблокирай';
        } else {
            banBtn.className = 'btn btn-warning';
            banBtn.innerHTML = '<i class="bi bi-ban"></i> Блокирай';
        }
    }

    if (promoteBtn) {
        promoteBtn.dataset.userId = user.id;
        promoteBtn.onclick = () => showRoleChangeModal(user.id);

        if (user.role === 'ADMIN') {
            promoteBtn.className = 'btn btn-outline-secondary';
            promoteBtn.innerHTML = '<i class="bi bi-arrow-down-circle"></i> Понижи до User';
        } else {
            promoteBtn.className = 'btn btn-success';
            promoteBtn.innerHTML = '<i class="bi bi-arrow-up-circle"></i> Повиши до Admin';
        }
    }
}

function populateActivityStats(user) {
    const safeUpdate = (id, value) => {
        const element = $(id);
        if (element) element.textContent = value;
    };

    // FIXED: Use correct HTML element IDs from template
    safeUpdate('modal-user-publications', user.publicationsCount || 0);
    safeUpdate('modal-user-votes', user.totalVotes || 0);
    safeUpdate('modal-user-events', user.userEventsCount || 0);
    safeUpdate('modal-user-comments', user.commentsCount || 0);
    safeUpdate('modal-user-reports', user.reportsCount || 0);

    // Calculate and display activity score
    const activityScore = (user.publicationsCount || 0) + (user.totalVotes || 0) + (user.userEventsCount || 0);
    safeUpdate('modal-user-activity-score', activityScore);
}

function populateBanInformation(user) {
    const banInfoSection = $('modal-ban-info-section');
    if (!banInfoSection) return;

    if (user.status?.includes('BANNED')) {
        banInfoSection.style.display = 'block';
        const safeUpdate = (id, value) => {
            const element = $(id);
            if (element) element.textContent = value;
        };

        safeUpdate('modal-ban-reason', user.banReason || 'Няма указана причина');
        safeUpdate('modal-ban-date', user.bannedDate ? new Date(user.bannedDate).toLocaleString('bg-BG') : '-');
        safeUpdate('modal-ban-until', user.bannedUntil ? new Date(user.bannedUntil).toLocaleString('bg-BG') : 'Перманентно');
        safeUpdate('modal-ban-by', user.bannedBy || 'Система');
    } else {
        banInfoSection.style.display = 'none';
    }
}

function getLastOnlineDisplay(lastOnline, onlineStatus) {
    if (onlineStatus === 1) return 'Онлайн сега';
    if (!lastOnline) return 'Никога';

    const lastDate = new Date(lastOnline);
    const now = new Date();
    const diffMs = now - lastDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Днес';
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `Преди ${diffDays} дни`;
    if (diffDays < 30) return `Преди ${Math.floor(diffDays / 7)} седмици`;
    if (diffDays < 365) return `Преди ${Math.floor(diffDays / 30)} месеца`;
    return `Преди ${Math.floor(diffDays / 365)} години`;
}

function getEnhancedStatusDisplay(user) {
    let statusText = getStatusText(user.status);
    let statusClass = 'user-status-badge ';

    if (user.status?.includes('BANNED')) {
        statusClass += 'banned';
        if (user.banReason) {
            statusText += `<br><small class="text-muted">Причина: ${user.banReason}</small>`;
        }
        if (user.bannedUntil) {
            const bannedDate = new Date(user.bannedUntil).toLocaleDateString('bg-BG');
            statusText += `<br><small class="text-muted">До: ${bannedDate}</small>`;
        }
    } else if (user.status === 'ACTIVE') {
        statusClass += 'active';
    } else {
        statusClass += 'pending';
    }

    return `<span class="${statusClass}">${statusText}</span>`;
}

function getStatusText(status) {
    const statusMap = {
        'ACTIVE': 'Активен',
        'PENDING_ACTIVATION': 'Чакащ активация',
        'TEMPORARILY_BANNED': 'Временно блокиран',
        'PERMANENTLY_BANNED': 'Перманентно блокиран'
    };
    return statusMap[status] || status;
}

// ===== BAN MODAL =====
async function showBanModal(userId) {
    if (!userId) {
        showNotification('Грешка: Няма избран потребител', 'error');
        return;
    }

    // Find user data
    const user = UserManagement.users.find(u => u.id == userId);
    if (!user) {
        showNotification('Потребителят не е намерен', 'error');
        return;
    }

    // Check if already banned
    if (user.status?.includes('BANNED')) {
        if (confirm('Потребителят вече е блокиран. Искате ли да го отблокирате?')) {
            await unbanUser(userId);
        }
        return;
    }

    // Set user info in modal
    const confirmBtn = $('confirm-ban-btn');
    if (confirmBtn) {
        confirmBtn.dataset.userId = userId;
        confirmBtn.dataset.username = user.username;
    }

    // Set username in modal
    const usernameSpan = $('ban-username');
    if (usernameSpan) usernameSpan.textContent = user.username;

    // Reset form using REAL HTML element IDs
    resetBanForm();

    // Setup ban type change listener for REAL HTML structure
    setupBanTypeListener();

    // Show modal
    const modal = $('ban-user-modal');
    if (modal) {
        new bootstrap.Modal(modal).show();
    }
}

function resetBanForm() {
    // Reset ban type select
    const banTypeSelect = $('ban-type-select');
    if (banTypeSelect) {
        banTypeSelect.value = 'permanent';
    }

    // Reset duration select
    const durationSelect = $('ban-duration-select');
    if (durationSelect) {
        durationSelect.value = '7';
    }

    // Reset custom date
    const customDate = $('custom-ban-date');
    if (customDate) {
        customDate.value = '';
    }

    // Reset reason select
    const reasonSelect = $('ban-reason-select');
    if (reasonSelect) {
        reasonSelect.value = 'violation';
    }

    // Reset notes
    const notesField = $('ban-notes');
    if (notesField) {
        notesField.value = '';
    }

    // Initially hide duration sections
    toggleBanDurationVisibility();
}

function setupBanTypeListener() {
    const banTypeSelect = $('ban-type-select');
    if (banTypeSelect) {
        // Remove existing listeners
        banTypeSelect.removeEventListener('change', toggleBanDurationVisibility);
        // Add new listener
        banTypeSelect.addEventListener('change', toggleBanDurationVisibility);
    }
}

function toggleBanDurationVisibility() {
    const banTypeSelect = $('ban-type-select');
    const durationSection = $('ban-duration-section');

    if (!banTypeSelect || !durationSection) {
        console.warn('Ban form elements not found');
        return;
    }

    if (banTypeSelect.value === 'temporary') {
        durationSection.style.display = 'block';
    } else {
        durationSection.style.display = 'none';
    }

    // Also handle custom date section
    setupDurationListener();
}

function setupDurationListener() {
    const durationSelect = $('ban-duration-select');
    const customDateSection = $('custom-ban-date-section');

    if (durationSelect && customDateSection) {
        durationSelect.removeEventListener('change', toggleCustomDate);
        durationSelect.addEventListener('change', toggleCustomDate);
    }
}

function toggleCustomDate() {
    const durationSelect = $('ban-duration-select');
    const customDateSection = $('custom-ban-date-section');

    if (durationSelect && customDateSection) {
        if (durationSelect.value === 'custom') {
            customDateSection.style.display = 'block';
        } else {
            customDateSection.style.display = 'none';
        }
    }
}

async function confirmBanUser() {
    const confirmBtn = $('confirm-ban-btn');
    if (!confirmBtn) {
        showNotification('Грешка: Бутон за потвърждение не е намерен', 'error');
        return;
    }

    const userId = confirmBtn.dataset.userId;
    const username = confirmBtn.dataset.username;

    if (!userId) {
        showNotification('Грешка: Няма избран потребител', 'error');
        return;
    }

    // Get form data using REAL HTML element IDs
    const banTypeSelect = $('ban-type-select');
    const banType = banTypeSelect ? banTypeSelect.value : 'permanent';

    const reasonSelect = $('ban-reason-select');
    const reasonCode = reasonSelect ? reasonSelect.value : 'violation';

    const notesField = $('ban-notes');
    const notes = notesField ? notesField.value.trim() : '';

    let durationDays = null;

    // Handle duration for temporary bans
    if (banType === 'temporary') {
        const durationSelect = $('ban-duration-select');
        if (durationSelect) {
            if (durationSelect.value === 'custom') {
                const customDate = $('custom-ban-date');
                if (customDate && customDate.value) {
                    const endDate = new Date(customDate.value);
                    const now = new Date();
                    durationDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

                    if (durationDays <= 0) {
                        showNotification('Крайната дата трябва да е в бъдещето', 'error');
                        return;
                    }
                } else {
                    showNotification('Моля въведете крайна дата', 'error');
                    return;
                }
            } else {
                durationDays = parseInt(durationSelect.value);
            }
        }

        if (!durationDays || durationDays < 1) {
            showNotification('Моля въведете валидна продължителност', 'error');
            return;
        }
    }

    // Build reason text
    const reasonTexts = {
        'spam': 'Спам съдържание',
        'inappropriate': 'Неподходящо съдържание',
        'harassment': 'Тормоз',
        'fake_account': 'Фалшив акаунт',
        'violation': 'Нарушение на правилата',
        'other': 'Друго'
    };

    let fullReason = reasonTexts[reasonCode] || 'Нарушение на правилата';
    if (notes) {
        fullReason += ` - ${notes}`;
    }

    // Confirmation
    const banDurationText = banType === 'permanent' ? 'перманентно' : `за ${durationDays} дни`;
    if (!confirm(`Сигурни ли сте че искате да блокирате ${username} ${banDurationText}?\n\nПричина: ${fullReason}`)) {
        return;
    }

    try {
        // Disable button
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Блокиране...';

        // Prepare request
        const requestBody = {
            banType,
            reason: fullReason
        };

        if (banType === 'temporary' && durationDays) {
            requestBody.durationDays = durationDays;
        }

        // Send request
        const response = await fetch(`/admin/users/${userId}/ban`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        showNotification(result.message || 'Потребителят е блокиран успешно', 'success');

        // Refresh data and close modal
        await loadAllUsers();
        await loadUserStatistics();

        const modal = bootstrap.Modal.getInstance($('ban-user-modal'));
        if (modal) modal.hide();

    } catch (error) {
        console.error('Ban user error:', error);
        showNotification('Грешка при блокиране: ' + error.message, 'error');
    } finally {
        // Re-enable button
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="bi bi-ban"></i> Блокирай потребителя';
    }
}

// ===== ROLE CHANGE MODAL =====
async function showRoleChangeModal(userId) {
    if (!userId) {
        showNotification('Грешка: Няма избран потребител', 'error');
        return;
    }

    // Find user data
    const user = UserManagement.users.find(u => u.id == userId);
    if (!user) {
        showNotification('Потребителят не е намерен', 'error');
        return;
    }

    // Set user info in modal
    const confirmBtn = $('confirm-role-change-btn');
    if (confirmBtn) {
        confirmBtn.dataset.userId = userId;
        confirmBtn.dataset.username = user.username;
        confirmBtn.dataset.currentRole = user.role;
    }

    // Set current role in dropdown
    const roleSelect = $('new-role-select');
    if (roleSelect) {
        // Set opposite role as selected
        roleSelect.value = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    }

    // Update modal text
    const usernameSpan = $('role-change-username');
    if (usernameSpan) usernameSpan.textContent = user.username;

    // Reset reason field
    const reasonField = $('role-change-reason');
    if (reasonField) reasonField.value = '';

    // Show modal
    const modal = $('role-change-modal');
    if (modal) {
        new bootstrap.Modal(modal).show();
    }
}

async function confirmRoleChange() {
    const confirmBtn = $('confirm-role-change-btn');
    if (!confirmBtn) {
        console.error('Confirm role change button not found');
        showNotification('Грешка: Бутонът за потвърждение не е намерен', 'error');
        return;
    }

    const userId = confirmBtn.dataset.userId;
    const username = confirmBtn.dataset.username;
    const currentRole = confirmBtn.dataset.currentRole;

    if (!userId) {
        showNotification('Грешка: Няма избран потребител', 'error');
        return;
    }

    // Get form data
    const roleSelect = $('new-role-select');
    const newRole = roleSelect ? roleSelect.value : null;
    const reasonField = $('role-change-reason');
    const reason = reasonField ? reasonField.value.trim() : '';

    if (!newRole) {
        showNotification('Моля изберете нова роля', 'error');
        return;
    }

    if (newRole === currentRole) {
        showNotification('Новата роля е същата като текущата', 'warning');
        return;
    }

    if (!reason) {
        showNotification('Моля въведете причина за промяната', 'error');
        return;
    }

    // Role change text
    const roleTexts = {
        'USER': 'Потребител',
        'ADMIN': 'Администратор'
    };

    const roleChangeText = `${roleTexts[currentRole]} → ${roleTexts[newRole]}`;

    // Confirmation
    if (!confirm(`Сигурни ли сте че искате да промените ролята на ${username}?\n\n${roleChangeText}\n\nПричина: ${reason}`)) {
        return;
    }

    try {
        // Disable button
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Променяне...';

        // Send request
        const response = await fetch(`/admin/users/${userId}/role`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole, reason })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Role change failed:', errorText);
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        showNotification(result.message || 'Ролята е променена успешно', 'success');

        // Refresh data and close modal
        await loadAllUsers();
        await loadUserStatistics();

        const modal = bootstrap.Modal.getInstance($('role-change-modal'));
        if (modal) modal.hide();

    } catch (error) {
        console.error('Role change error:', error);
        showNotification('Грешка при промяна на ролята: ' + error.message, 'error');
    } finally {
        // Re-enable button
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="bi bi-check-circle"></i> Потвърди промяната';
    }
}

async function unbanUser(userId) {
    if (!userId) return;

    try {
        const response = await fetch(`/admin/users/${userId}/unban`, {
            method: 'POST'
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        showNotification(result.message || 'Потребителят е отблокиран успешно', 'success');

        await loadAllUsers();
        await loadUserStatistics();
    } catch (error) {
        console.error('Unban user error:', error);
        showNotification('Грешка при отблокиране: ' + error.message, 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('ВНИМАНИЕ: Това действие е необратимо! Сигурни ли сте че искате да изтриете този потребител?')) return;

    try {
        const response = await fetch(`/admin/users/${userId}`, { method: 'DELETE' });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        showNotification(result.message || 'Потребителят е изтрит успешно', 'success');

        await loadAllUsers();
        await loadUserStatistics();
    } catch (error) {
        console.error('Delete user error:', error);
        showNotification('Грешка при изтриване: ' + error.message, 'error');
    }
}

// ===== BULK ACTIONS =====
async function handleBulkPromote() {
    if (UserManagement.selectedUsers.size === 0) return;
    if (!confirm(`Повишаване на ${UserManagement.selectedUsers.size} потребители до администратори?`)) return;
    await bulkAction('/admin/users/bulk-role', { userIds: Array.from(UserManagement.selectedUsers).map(String), role: 'ADMIN' });
}

async function handleBulkDemote() {
    if (UserManagement.selectedUsers.size === 0) return;
    if (!confirm(`Понижаване на ${UserManagement.selectedUsers.size} потребители до обикновени потребители?`)) return;
    await bulkAction('/admin/users/bulk-role', { userIds: Array.from(UserManagement.selectedUsers).map(String), role: 'USER' });
}

async function handleBulkBan() {
    if (UserManagement.selectedUsers.size === 0) return;
    const reason = prompt(`Причина за блокиране на ${UserManagement.selectedUsers.size} потребители:`);
    if (!reason) return;
    await bulkAction('/admin/users/bulk-ban', {
        userIds: Array.from(UserManagement.selectedUsers).map(String),
        banType: 'permanent',
        reason
    });
}

async function handleBulkUnban() {
    if (UserManagement.selectedUsers.size === 0) return;
    if (!confirm(`Отблокиране на ${UserManagement.selectedUsers.size} потребители?`)) return;

    try {
        await Promise.all(Array.from(UserManagement.selectedUsers).map(userId =>
            fetch(`/admin/users/${userId}/unban`, { method: 'POST' })
        ));

        showNotification(`${UserManagement.selectedUsers.size} потребители отблокирани`, 'success');
        UserManagement.selectedUsers.clear();
        loadAllUsers();
    } catch (error) {
        console.error('Bulk unban error:', error);
        showNotification('Грешка при отблокиране', 'error');
    }
}

async function bulkAction(url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        showNotification(result.message || 'Операцията е извършена успешно', 'success');

        UserManagement.selectedUsers.clear();
        await loadAllUsers();
        await loadUserStatistics();
    } catch (error) {
        console.error('Bulk action error:', error);
        showNotification('Грешка при bulk операцията: ' + error.message, 'error');
    }
}

// ===== UTILITY FUNCTIONS =====
function refreshUsers() {
    loadAllUsers();
    showNotification('Потребителите са обновени', 'success');
}

// ===== GLOBAL FUNCTIONS =====
window.showUserDetails = showUserDetails;
window.showBanModal = showBanModal;
window.confirmBanUser = confirmBanUser;
window.showRoleChangeModal = showRoleChangeModal;
window.confirmRoleChange = confirmRoleChange;
window.loadAllUsers = loadAllUsers;
window.loadUserStatistics = loadUserStatistics;