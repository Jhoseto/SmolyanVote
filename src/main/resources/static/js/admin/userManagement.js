/**
 * User Management JavaScript - SmolyanVote Admin
 * Robust version that works with collapsed/expanded sections
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
    } else {
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// Enhanced element detection
function elementExists(id) {
    const element = $(id);
    const exists = element !== null;
    const visible = exists && element.offsetParent !== null;
    console.log(`${id}: ${exists ? '✅ Exists' : '❌ Missing'} ${visible ? '(Visible)' : '(Hidden)'}`);
    return exists;
}

function debugElements() {
    console.log('🔍 Checking HTML elements...');
    const elements = [
        'users-table-body',
        'users-table',
        'user-search-input',
        'total-users-count',
        'bulk-operations-bar'
    ];

    elements.forEach(elementExists);
}

// Robust element waiting
function waitForElement(id, maxAttempts = 20) {
    return new Promise((resolve, reject) => {
        let attempts = 0;

        const checkElement = () => {
            attempts++;
            const element = $(id);

            if (element) {
                console.log(`✅ Found ${id} after ${attempts} attempts`);
                resolve(element);
            } else if (attempts >= maxAttempts) {
                console.warn(`⚠️ Element ${id} not found after ${maxAttempts} attempts`);
                reject(new Error(`Element ${id} not found`));
            } else {
                setTimeout(checkElement, 100);
            }
        };

        checkElement();
    });
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 User Management initializing...');
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
        console.error('❌ Initialization error:', error);
        // Retry after delay
        setTimeout(() => {
            console.log('🔄 Retrying initialization...');
            initializeWithRetry();
        }, 1000);
    }
}

async function initializeUI() {
    console.log('🎨 Initializing UI...');

    // Wait for critical elements
    try {
        debugElements();

        // Initialize event listeners (works even if some elements are missing)
        initializeEventListeners();

        // Try to update UI if elements exist
        if ($(users-table-body)) {
            updateUsersTable();
            updatePagination();
        }

        UserManagement.initialized = true;
        console.log('✅ User Management fully initialized');

    } catch (error) {
        console.warn('⚠️ UI initialization partial:', error.message);
        UserManagement.initialized = true; // Still mark as initialized
    }
}

function initializeEventListeners() {
    console.log('🔗 Setting up event listeners...');

    // Safe event listener setup - only attach if element exists
    const setupListener = (id, event, handler) => {
        const element = $(id);
        if (element) {
            element.addEventListener(event, handler);
            console.log(`✅ Listener added: ${id}`);
        } else {
            console.log(`⚠️ Element missing: ${id}`);
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

    // Modal actions
    setupListener('modal-ban-user-btn', 'click', () => showBanModal());
    setupListener('modal-promote-user-btn', 'click', () => showRoleChangeModal());
    setupListener('confirm-ban-btn', 'click', confirmBanUser);

    // Table sorting - use querySelectorAll for dynamic elements
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => handleSort(header.dataset.column));
    });

    console.log('✅ Event listeners setup complete');
}

// ===== API CALLS =====
async function loadUserStatistics() {
    try {
        console.log('📊 Loading statistics...');
        const response = await fetch('/admin/users/statistics');

        if (!response.ok) {
            throw new Error(`Statistics failed: ${response.status}`);
        }

        const stats = await response.json();
        console.log('📊 Statistics loaded:', stats);
        updateStatisticsDisplay(stats);
    } catch (error) {
        console.error('❌ Statistics error:', error);
        showNotification('Грешка при зареждане на статистиките: ' + error.message, 'error');
    }
}

async function loadAllUsers() {
    try {
        console.log('👥 Loading users from API...');

        const response = await fetch('/admin/users');
        console.log('👥 API response status:', response.status);

        if (!response.ok) {
            throw new Error(`API failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('👥 API response data:', data);

        UserManagement.users = data.users || [];
        console.log(`📊 Loaded ${UserManagement.users.length} users`);

        if (UserManagement.users.length === 0) {
            console.warn('⚠️ No users returned from API');
        }

        // Apply filters and update UI if initialized
        applyFiltersAndUpdate();

    } catch (error) {
        console.error('❌ Users loading error:', error);
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
        } else {
            console.log(`⚠️ Stats element missing: ${id}`);
        }
    };

    safeUpdate('total-users-count', stats.totalUsers || 0);
    safeUpdate('active-users-count', stats.activeUsers || 0);
    safeUpdate('online-users-count', stats.onlineUsers || 0);
    safeUpdate('admin-users-count', stats.adminCount || 0);
    safeUpdate('pending-users-count', stats.pendingUsers || 0);
    safeUpdate('banned-users-count', (stats.tempBannedUsers || 0) + (stats.permBannedUsers || 0));
    safeUpdate('total-users-change', `+${stats.weekRegistrations || 0}`);
    safeUpdate('user-stats-period', 'Обновено: ' + new Date().toLocaleTimeString('bg-BG'));
}

function updateUsersTable() {
    console.log('📋 Updating users table...');

    const tbody = $('users-table-body');
    if (!tbody) {
        console.log('⚠️ Table body not available, skipping update');
        return;
    }

    const start = (UserManagement.pagination.currentPage - 1) * UserManagement.pagination.usersPerPage;
    const end = start + UserManagement.pagination.usersPerPage;
    const paginatedUsers = UserManagement.filteredUsers.slice(start, end);

    console.log(`📊 Displaying ${paginatedUsers.length} users (${start}-${end} of ${UserManagement.filteredUsers.length})`);

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
        tbody.innerHTML = paginatedUsers.map(user => createUserRow(user)).join('');
        console.log('✅ Table updated successfully');

        // Add event listeners to checkboxes
        tbody.querySelectorAll('.user-select').forEach(checkbox => {
            checkbox.addEventListener('change', handleUserSelect);
        });

        updateBulkOperationsBar();
    } catch (error) {
        console.error('❌ Error updating table:', error);
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
    const activityScore = (user.userEventsCount || 0) + (user.publicationsCount || 0) + (user.totalVotes || 0);
    const activityLevel = activityScore >= 10 ? 'high' : activityScore >= 3 ? 'medium' : activityScore > 0 ? 'low' : 'inactive';
    const registrationDate = user.created ? new Date(user.created).toLocaleDateString('bg-BG') : '-';
    const lastOnlineDate = user.lastOnline ? formatRelativeTime(new Date(user.lastOnline)) : 'Никога';

    return `
        <tr>
            <td><input type="checkbox" class="form-check-input user-select" data-user-id="${user.id}"></td>
            <td>
                <div class="d-flex align-items-center">
                    <img src="${user.imageUrl || '/images/default-avatar.png'}" alt="Avatar" class="rounded-circle me-2" style="width: 32px; height: 32px; object-fit: cover;">
                    <span class="fw-medium">${user.username || '-'}</span>
                </div>
            </td>
            <td class="text-muted">${user.email || '-'}</td>
            <td><span class="role-badge ${user.role?.toLowerCase() || 'user'}">${user.role || 'USER'}</span></td>
            <td><span class="user-status-badge ${getStatusClass(user.status)}">${getStatusText(user.status)}</span></td>
            <td class="text-muted">${registrationDate}</td>
            <td class="text-muted">${lastOnlineDate}</td>
            <td>
                <div class="activity-score">
                    <div class="activity-bar">
                        <div class="activity-fill ${activityLevel}" style="width: ${Math.min(activityScore * 10, 100)}%"></div>
                    </div>
                    <span class="activity-score-text">${activityScore}</span>
                </div>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button type="button" class="btn btn-outline-primary" onclick="showUserDetails(${user.id})" title="Детайли">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button type="button" class="btn btn-outline-warning" onclick="toggleUserBan(${user.id})" title="${user.status?.includes('BANNED') ? 'Отблокирай' : 'Блокирай'}">
                        <i class="bi bi-${user.status?.includes('BANNED') ? 'check-circle' : 'ban'}"></i>
                    </button>
                    <button type="button" class="btn btn-outline-success" onclick="toggleUserRole(${user.id})" title="Промени роля">
                        <i class="bi bi-arrow-up-circle"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger" onclick="deleteUser(${user.id})" title="Изтрий">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
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

// ===== BULK OPERATIONS =====
function handleSelectAll(e) {
    const isChecked = e.target.checked;
    document.querySelectorAll('.user-select').forEach(checkbox => {
        checkbox.checked = isChecked;
        const userId = parseInt(checkbox.dataset.userId);
        isChecked ? UserManagement.selectedUsers.add(userId) : UserManagement.selectedUsers.delete(userId);
    });
    updateBulkOperationsBar();
}

function handleUserSelect(e) {
    const userId = parseInt(e.target.dataset.userId);
    e.target.checked ? UserManagement.selectedUsers.add(userId) : UserManagement.selectedUsers.delete(userId);
    updateBulkOperationsBar();
    updateSelectAllCheckbox();
}

function updateBulkOperationsBar() {
    const bulkBar = $('bulk-operations-bar');
    const countElement = $('selected-users-count');

    if (bulkBar && countElement) {
        if (UserManagement.selectedUsers.size > 0) {
            bulkBar.style.display = 'flex';
            countElement.textContent = UserManagement.selectedUsers.size;
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

        selectAllCheckbox.checked = checkedCount === userCheckboxes.length;
        selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < userCheckboxes.length;
    }
}

// ===== PAGINATION =====
function updatePagination() {
    UserManagement.pagination.totalPages = Math.ceil(UserManagement.filteredUsers.length / UserManagement.pagination.usersPerPage);

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

        const modal = $('user-details-modal');
        if (modal) {
            new bootstrap.Modal(modal).show();
        }
    } catch (error) {
        console.error('User details error:', error);
        showNotification('Грешка при зареждане на детайлите', 'error');
    }
}

function populateUserDetailsModal(user) {
    const safeUpdate = (id, value) => {
        const element = $(id);
        if (element) element.textContent = value;
    };

    safeUpdate('modal-user-username', user.username || '-');
    safeUpdate('modal-user-email', user.email || '-');
    safeUpdate('modal-user-role', user.role || '-');
    safeUpdate('modal-user-status-text', getStatusText(user.status));
    safeUpdate('modal-user-registration', user.created ? new Date(user.created).toLocaleDateString('bg-BG') : '-');

    const avatar = $('modal-user-avatar');
    if (avatar) avatar.src = user.imageUrl || '/images/default-avatar.png';

    const statusIndicator = $('modal-user-status');
    if (statusIndicator) {
        statusIndicator.className = `user-status-indicator ${user.onlineStatus === 1 ? 'online' : 'offline'}`;
    }

    const banBtn = $('modal-ban-user-btn');
    const promoteBtn = $('modal-promote-user-btn');
    if (banBtn) banBtn.dataset.userId = user.id;
    if (promoteBtn) promoteBtn.dataset.userId = user.id;
}

function showBanModal(userId) {
    const targetUserId = userId || $('modal-ban-user-btn')?.dataset.userId;
    const confirmBtn = $('confirm-ban-btn');
    if (confirmBtn) confirmBtn.dataset.userId = targetUserId;

    const modal = $('ban-user-modal');
    if (modal) {
        new bootstrap.Modal(modal).show();
    }
}

function showRoleChangeModal() {
    const userId = $('modal-promote-user-btn')?.dataset.userId;
    if (userId) toggleUserRole(userId);
}

async function confirmBanUser() {
    const userId = $('confirm-ban-btn')?.dataset.userId;
    const banType = document.querySelector('input[name="ban-type"]:checked')?.value || 'permanent';
    const reason = $('ban-reason')?.value || 'Нарушение на правилата';
    const duration = $('ban-duration')?.value;

    try {
        const requestBody = { banType, reason };
        if (banType === 'temporary' && duration) {
            requestBody.durationDays = parseInt(duration);
        }

        const response = await fetch(`/admin/users/${userId}/ban`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        showNotification(result.message, response.ok ? 'success' : 'error');

        if (response.ok) {
            loadAllUsers();
            const modal = $('ban-user-modal');
            if (modal) bootstrap.Modal.getInstance(modal)?.hide();
        }
    } catch (error) {
        console.error('Ban user error:', error);
        showNotification('Грешка при блокиране', 'error');
    }
}

async function toggleUserBan(userId) {
    const user = UserManagement.users.find(u => u.id === userId);
    if (!user) return;

    const isBanned = user.status?.includes('BANNED');

    if (isBanned) {
        if (!confirm('Сигурни ли сте че искате да отблокирате този потребител?')) return;

        try {
            const response = await fetch(`/admin/users/${userId}/unban`, { method: 'POST' });
            const result = await response.json();
            showNotification(result.message, response.ok ? 'success' : 'error');
            if (response.ok) loadAllUsers();
        } catch (error) {
            console.error('Unban error:', error);
            showNotification('Грешка при отблокиране', 'error');
        }
    } else {
        showBanModal(userId);
    }
}

async function toggleUserRole(userId) {
    const user = UserManagement.users.find(u => u.id === userId);
    if (!user) return;

    const isAdmin = user.role === 'ADMIN';
    const action = isAdmin ? 'понижите до потребител' : 'повишите до администратор';

    if (!confirm(`Сигурни ли сте че искате да ${action} този потребител?`)) return;

    try {
        const newRole = isAdmin ? 'USER' : 'ADMIN';
        const response = await fetch(`/admin/users/${userId}/role`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole })
        });

        const result = await response.json();
        showNotification(result.message, response.ok ? 'success' : 'error');
        if (response.ok) loadAllUsers();
    } catch (error) {
        console.error('Role change error:', error);
        showNotification('Грешка при промяна на ролята', 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('ВНИМАНИЕ: Това действие е необратимо! Сигурни ли сте че искате да изтриете този потребител?')) return;

    try {
        const response = await fetch(`/admin/users/${userId}`, { method: 'DELETE' });
        const result = await response.json();
        showNotification(result.message, response.ok ? 'success' : 'error');

        if (response.ok) {
            loadAllUsers();
            loadUserStatistics();
        }
    } catch (error) {
        console.error('Delete user error:', error);
        showNotification('Грешка при изтриване', 'error');
    }
}

// ===== BULK ACTIONS =====
async function handleBulkPromote() {
    if (UserManagement.selectedUsers.size === 0) return;
    if (!confirm(`Повишаване на ${UserManagement.selectedUsers.size} потребители до администратори?`)) return;
    await bulkAction('/admin/users/bulk-role', { userIds: Array.from(UserManagement.selectedUsers), role: 'ADMIN' });
}

async function handleBulkDemote() {
    if (UserManagement.selectedUsers.size === 0) return;
    if (!confirm(`Понижаване на ${UserManagement.selectedUsers.size} потребители до обикновени потребители?`)) return;
    await bulkAction('/admin/users/bulk-role', { userIds: Array.from(UserManagement.selectedUsers), role: 'USER' });
}

async function handleBulkBan() {
    if (UserManagement.selectedUsers.size === 0) return;
    const reason = prompt(`Причина за блокиране на ${UserManagement.selectedUsers.size} потребители:`);
    if (!reason) return;
    await bulkAction('/admin/users/bulk-ban', {
        userIds: Array.from(UserManagement.selectedUsers),
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

        const result = await response.json();
        showNotification(result.message, response.ok ? 'success' : 'error');

        if (response.ok) {
            UserManagement.selectedUsers.clear();
            loadAllUsers();
        }
    } catch (error) {
        console.error('Bulk action error:', error);
        showNotification('Грешка при групова операция', 'error');
    }
}

// ===== UTILITY FUNCTIONS =====
function formatRelativeTime(date) {
    const diff = new Date() - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Сега';
    if (minutes < 60) return `${minutes} мин`;
    if (hours < 24) return `${hours} ч`;
    if (days < 7) return `${days} дни`;
    return date.toLocaleDateString('bg-BG');
}

function getStatusClass(status) {
    const statusMap = {
        'ACTIVE': 'active',
        'PENDING_ACTIVATION': 'inactive',
        'TEMPORARILY_BANNED': 'banned',
        'PERMANENTLY_BANNED': 'banned'
    };
    return statusMap[status] || 'inactive';
}

function getStatusText(status) {
    const statusMap = {
        'ACTIVE': 'Активен',
        'PENDING_ACTIVATION': 'Чака активация',
        'TEMPORARILY_BANNED': 'Временно блокиран',
        'PERMANENTLY_BANNED': 'Перманентно блокиран'
    };
    return statusMap[status] || 'Неизвестен';
}

function refreshUsers() {
    loadUserStatistics();
    loadAllUsers();
    showNotification('Данните са обновени', 'success');
}

// ===== GLOBAL EXPORTS =====
window.showUserDetails = showUserDetails;
window.toggleUserBan = toggleUserBan;
window.toggleUserRole = toggleUserRole;
window.deleteUser = deleteUser;
window.loadAllUsers = loadAllUsers;