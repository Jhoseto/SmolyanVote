let selectedReports = new Set();
let currentReports = [];
let currentSort = { column: 'createdAt', direction: 'desc' };
let eventListenersSetup = false;

function setupEventListeners() {
    if (eventListenersSetup) {
        return;
    }

    try {
        const refreshBtn = document.getElementById('reports-refresh-btn');
        if (refreshBtn) {
            refreshBtn.removeEventListener('click', loadReportsData);
            refreshBtn.addEventListener('click', loadReportsData);
        }

        const markBtn = document.getElementById('mark-reviewed-btn');
        if (markBtn) {
            markBtn.removeEventListener('click', markSelectedAsReviewed);
            markBtn.addEventListener('click', markSelectedAsReviewed);
        }

        const deleteBtn = document.getElementById('delete-reports-btn');
        if (deleteBtn) {
            deleteBtn.removeEventListener('click', deleteSelectedReports);
            deleteBtn.addEventListener('click', deleteSelectedReports);
        }

        const selectAllBox = document.getElementById('select-all-reports');
        if (selectAllBox) {
            selectAllBox.removeEventListener('change', toggleSelectAll);
            selectAllBox.addEventListener('change', toggleSelectAll);
        }

        const sortableHeaders = document.querySelectorAll('.sortable');
        sortableHeaders.forEach(header => {
            const column = header.getAttribute('data-column');
            if (column) {
                header.style.cursor = 'pointer';
                header.removeEventListener('click', () => sortReports(column));
                header.addEventListener('click', () => sortReports(column));
            }
        });

        eventListenersSetup = true;

    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

async function loadReportsData() {
    try {
        await Promise.all([
            loadReportsStatistics(),
            loadPendingReports()
        ]);
    } catch (error) {
        console.error('Error loading reports data:', error);
    }
}

async function loadReportsStatistics() {
    try {
        const response = await fetch('/admin/manage-reports/statistics', {
            headers: {
                'X-XSRF-TOKEN': getCsrfToken()
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        const pendingElement = document.getElementById('reports-pending-count');
        const totalElement = document.getElementById('reports-total-count');

        if (pendingElement) pendingElement.textContent = data.pendingReports || '0';
        if (totalElement) totalElement.textContent = data.totalReports || '0';

    } catch (error) {
        console.error('Error loading reports statistics:', error);
        const pendingElement = document.getElementById('reports-pending-count');
        const totalElement = document.getElementById('reports-total-count');
        if (pendingElement) pendingElement.textContent = 'ERR';
        if (totalElement) totalElement.textContent = 'ERR';
    }
}

async function loadPendingReports() {
    const tableBody = document.getElementById('reports-table-body');

    if (!tableBody) {
        console.error('reports-table-body not found');
        return;
    }

    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Loading...</td></tr>';

    try {
        const response = await fetch('/admin/manage-reports/all?size=500', {
            headers: {
                'X-XSRF-TOKEN': getCsrfToken()
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.content && data.content.length > 0) {
            currentReports = data.content;
            sortReports(currentSort.column, false);
        } else {
            currentReports = [];
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No reports found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading reports:', error);
        currentReports = [];
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading reports</td></tr>';
    }
}

function sortReports(column, toggleDirection = true) {
    if (currentReports.length === 0) return;

    if (toggleDirection && currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else if (toggleDirection) {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }

    currentReports.sort((a, b) => {
        let valueA, valueB;

        switch (column) {
            case 'entityType':
                valueA = a.entityType || '';
                valueB = b.entityType || '';
                break;
            case 'reporterUsername':
                valueA = a.reporterUsername || '';
                valueB = b.reporterUsername || '';
                break;
            case 'reason':
                valueA = a.reason || '';
                valueB = b.reason || '';
                break;
            case 'status':
                valueA = a.status || '';
                valueB = b.status || '';
                break;
            case 'createdAt':
                valueA = new Date(a.createdAt || 0);
                valueB = new Date(b.createdAt || 0);
                break;
            default:
                return 0;
        }

        let comparison = 0;
        if (valueA > valueB) comparison = 1;
        if (valueA < valueB) comparison = -1;

        return currentSort.direction === 'desc' ? -comparison : comparison;
    });

    updateSortIndicators();
    renderReportsTable(currentReports);
}

function updateSortIndicators() {
    document.querySelectorAll('.sortable').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
    });

    const currentHeader = document.querySelector(`[data-column="${currentSort.column}"]`);
    if (currentHeader) {
        currentHeader.classList.add(currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');
    }
}

function renderReportsTable(reports) {
    const tableBody = document.getElementById('reports-table-body');

    if (!tableBody) {
        console.error('reports-table-body not found');
        return;
    }

    const rows = reports.map(report => {
        const reportDate = new Date(report.createdAt).toLocaleString('bg-BG');
        const entityTypeBadge = getEntityTypeBadge(report.entityType);
        const reasonBadge = getReasonBadge(report.reason);
        const statusBadge = getStatusBadge(report.status);

        return `
            <tr>
                <td>
                    <input type="checkbox" class="report-checkbox" 
                           value="${report.id}" 
                           data-report-id="${report.id}">
                </td>
                <td>${entityTypeBadge}</td>
                <td>${escapeHtml(report.reporterUsername || 'N/A')}</td>
                <td>${reasonBadge}</td>
                <td>${statusBadge}</td>
                <td>${reportDate}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-content-btn" 
                            data-entity-type="${report.entityType}" 
                            data-entity-id="${report.entityId}">
                        <i class="bi bi-eye"></i> View
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = rows;

    addTableEventListeners();

    selectedReports.clear();
    updateBulkActionButtons();
}

function addTableEventListeners() {
    document.querySelectorAll('.report-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const reportId = parseInt(this.getAttribute('data-report-id'));
            toggleReportSelection(reportId, this.checked);
        });
    });

    document.querySelectorAll('.view-content-btn').forEach(button => {
        button.addEventListener('click', function() {
            const entityType = this.getAttribute('data-entity-type');
            const entityId = parseInt(this.getAttribute('data-entity-id'));
            openReportedContent(entityType, entityId);
        });
    });
}

function toggleSelectAll(event) {
    const isChecked = event.target.checked;
    const checkboxes = document.querySelectorAll('.report-checkbox');

    selectedReports.clear();

    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        if (isChecked) {
            const reportId = parseInt(checkbox.getAttribute('data-report-id'));
            selectedReports.add(reportId);
        }
    });

    updateBulkActionButtons();
}

function toggleReportSelection(reportId, isSelected) {
    if (isSelected) {
        selectedReports.add(reportId);
    } else {
        selectedReports.delete(reportId);
    }

    updateBulkActionButtons();

    const selectAllCheckbox = document.getElementById('select-all-reports');
    const checkboxes = document.querySelectorAll('.report-checkbox');
    const checkedBoxes = document.querySelectorAll('.report-checkbox:checked');

    if (selectAllCheckbox) {
        selectAllCheckbox.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < checkboxes.length;
        selectAllCheckbox.checked = checkedBoxes.length === checkboxes.length && checkboxes.length > 0;
    }
}

function updateBulkActionButtons() {
    const hasSelection = selectedReports.size > 0;

    const markReviewedBtn = document.getElementById('mark-reviewed-btn');
    const deleteBtn = document.getElementById('delete-reports-btn');

    if (markReviewedBtn) markReviewedBtn.disabled = !hasSelection;
    if (deleteBtn) deleteBtn.disabled = !hasSelection;
}

async function markSelectedAsReviewed() {
    if (selectedReports.size === 0) {
        alert('Моля, изберете поне един репорт');
        return;
    }

    if (!confirm(`Маркиране на ${selectedReports.size} репорта като прегледани?`)) {
        return;
    }

    const csrfToken = getCsrfToken();
    if (!csrfToken) {
        alert('CSRF токенът не е намерен. Моля, обновете страницата.');
        console.error('CSRF token not found');
        return;
    }

    try {
        const promises = Array.from(selectedReports).map(async reportId => {
            const response = await fetch(`/admin/manage-reports/${reportId}/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': csrfToken
                },
                body: JSON.stringify({
                    status: 'REVIEWED',
                    adminNotes: 'Bulk marked as reviewed'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Error response for report ${reportId}:`, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            return response.json();
        });

        await Promise.all(promises);

        alert(`${selectedReports.size} репорта бяха маркирани като прегледани`);
        loadReportsData();

    } catch (error) {
        console.error('Error marking reports as reviewed:', error);
        alert('Грешка при маркиране на репортите: ' + error.message);
    }
}

async function deleteSelectedReports() {
    if (selectedReports.size === 0) {
        alert('Моля, изберете поне един репорт');
        return;
    }

    if (!confirm(`ИЗТРИВАНЕ на ${selectedReports.size} репорта? Това действие е необратимо!`)) {
        return;
    }

    const csrfToken = getCsrfToken();
    if (!csrfToken) {
        alert('CSRF токенът не е намерен. Моля, обновете страницата.');
        console.error('CSRF token not found');
        return;
    }

    try {
        const promises = Array.from(selectedReports).map(async reportId => {
            const response = await fetch(`/admin/manage-reports/${reportId}`, {
                method: 'DELETE',
                headers: {
                    'X-XSRF-TOKEN': csrfToken
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Delete error for report ${reportId}:`, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            return response.json();
        });

        await Promise.all(promises);

        alert(`${selectedReports.size} репорта бяха изтрити`);
        loadReportsData();

    } catch (error) {
        console.error('Error deleting reports:', error);
        alert('Грешка при изтриване на репортите: ' + error.message);
    }
}

function openReportedContent(entityType, entityId) {
    let url;

    switch(entityType) {
        case 'SIMPLE_EVENT':
            url = `/event/${entityId}`;
            break;
        case 'REFERENDUM':
            url = `/referendum/${entityId}`;
            break;
        case 'SIGNAL':
            url = `/signals/${entityId}`;
            break;
        case 'PUBLICATION':
            url = `/publications/${entityId}`;
            break;
        case 'MULTI_POLL':
            url = `/multipoll/${entityId}`;
            break;
        default:
            alert('Неподдържан тип съдържание: ' + entityType);
            console.error('Unsupported entity type:', entityType);
            return;
    }

    window.open(url, '_blank');
}

function getEntityTypeBadge(entityType) {
    const types = {
        PUBLICATION: 'Публикация',
        SIGNAL: 'Сигнал',
        REFERENDUM: 'Референдум',
        MULTI_POLL: 'Анкета',
        SIMPLE_EVENT: 'Събитие'
    };

    const displayName = types[entityType] || entityType;
    const className = entityType ? entityType.toLowerCase() : 'unknown';

    return `<span class="badge report-type-badge report-type-${className}">${escapeHtml(displayName)}</span>`;
}

function getReasonBadge(reason) {
    const reasons = {
        SPAM: 'Spam',
        INAPPROPRIATE: 'Неуместно',
        HARASSMENT: 'Тормоз',
        FALSE_INFORMATION: 'Невярна информация',
        OTHER: 'Друго'
    };

    const displayName = reasons[reason] || reason;
    return `<span class="badge report-reason-badge">${escapeHtml(displayName)}</span>`;
}

function getStatusBadge(status) {
    const statuses = {
        PENDING: 'Чакащ',
        REVIEWED: 'Прегледан',
        DISMISSED: 'Отхвърлен',
        RESOLVED: 'Решен'
    };

    const displayName = statuses[status] || status;
    const className = status ? status.toLowerCase() : 'unknown';

    return `<span class="badge report-status-badge status-${className}">${escapeHtml(displayName)}</span>`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getCsrfToken() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'XSRF-TOKEN' || name === 'CSRF-TOKEN' || name === '_csrf') {
            return decodeURIComponent(value);
        }
    }

    const metaToken = document.querySelector('meta[name="_csrf"]');
    if (metaToken) {
        const token = metaToken.getAttribute('content');
        return token;
    }

    console.error('CSRF token not found! Available cookies:', document.cookie);
    return null;
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        setupEventListeners();
        loadReportsData();
    }, 100);
});

window.setupEventListeners = setupEventListeners;
window.loadReportsData = loadReportsData;
window.toggleReportSelection = toggleReportSelection;
window.sortReports = sortReports;
window.openReportedContent = openReportedContent;
window.markSelectedAsReviewed = markSelectedAsReviewed;
window.deleteSelectedReports = deleteSelectedReports;
window.toggleSelectAll = toggleSelectAll;