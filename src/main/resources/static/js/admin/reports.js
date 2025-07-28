// ===== REPORTS MANAGEMENT - CLEAN VERSION =====

let selectedReports = new Set();
let currentReports = [];
let currentSort = { column: 'createdAt', direction: 'desc' };

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Refresh button
    document.getElementById('reports-refresh-btn').addEventListener('click', loadReportsData);

    // Bulk action buttons
    document.getElementById('mark-reviewed-btn').addEventListener('click', markSelectedAsReviewed);
    document.getElementById('delete-reports-btn').addEventListener('click', deleteSelectedReports);

    // Select all checkbox
    document.getElementById('select-all-reports').addEventListener('change', toggleSelectAll);
}

// ===== LOAD DATA =====
async function loadReportsData() {
    await Promise.all([
        loadReportsStatistics(),
        loadPendingReports()
    ]);
}

async function loadReportsStatistics() {
    try {
        const response = await fetch('/admin/api/reports/statistics');
        const data = await response.json();

        document.getElementById('reports-pending-count').textContent = data.pendingReports || '0';
        document.getElementById('reports-total-count').textContent = data.totalReports || '0';
    } catch (error) {
        console.error('Error loading reports statistics:', error);
    }
}

async function loadPendingReports() {
    const tableBody = document.getElementById('reports-table-body');

    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Loading...</td></tr>';

    try {
        // Load ALL reports, not just pending
        const response = await fetch('/admin/api/reports/all?size=500');
        const data = await response.json();

        if (data.content && data.content.length > 0) {
            currentReports = data.content;
            sortReports(currentSort.column, false); // Sort and render
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

// ===== SORTING =====
function sortReports(column, toggleDirection = true) {
    if (currentReports.length === 0) return;

    // Toggle direction if same column clicked
    if (toggleDirection && currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else if (toggleDirection) {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }

    // Sort the data
    currentReports.sort((a, b) => {
        let valueA, valueB;

        switch (column) {
            case 'entityType':
                valueA = a.entityType;
                valueB = b.entityType;
                break;
            case 'reporterUsername':
                valueA = a.reporterUsername;
                valueB = b.reporterUsername;
                break;
            case 'reason':
                valueA = a.reason;
                valueB = b.reason;
                break;
            case 'status':
                valueA = a.status;
                valueB = b.status;
                break;
            case 'createdAt':
                valueA = new Date(a.createdAt);
                valueB = new Date(b.createdAt);
                break;
            default:
                return 0;
        }

        // Compare values
        let comparison = 0;
        if (valueA > valueB) comparison = 1;
        if (valueA < valueB) comparison = -1;

        return currentSort.direction === 'desc' ? -comparison : comparison;
    });

    // Update sort indicators
    updateSortIndicators();

    // Re-render table
    renderReportsTable(currentReports);
}

function updateSortIndicators() {
    // Reset all headers
    document.querySelectorAll('.sortable').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
    });

    // Add class to current sorted column
    const currentHeader = document.querySelector(`[onclick="sortReports('${currentSort.column}')"]`);
    if (currentHeader) {
        currentHeader.classList.add(currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');
    }
}

// ===== RENDER TABLE =====
function renderReportsTable(reports) {
    const tableBody = document.getElementById('reports-table-body');

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
                           onchange="toggleReportSelection(${report.id}, this.checked)">
                </td>
                <td>${entityTypeBadge}</td>
                <td>${report.reporterUsername}</td>
                <td>${reasonBadge}</td>
                <td>${statusBadge}</td>
                <td>${reportDate}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" 
                            onclick="openReportedContent('${report.entityType}', ${report.entityId})">
                        <i class="bi bi-eye"></i> View
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = rows;

    // Reset selections
    selectedReports.clear();
    updateBulkActionButtons();
}

// ===== SELECTION LOGIC =====
function toggleSelectAll(event) {
    const isChecked = event.target.checked;
    const checkboxes = document.querySelectorAll('.report-checkbox');

    selectedReports.clear();

    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        if (isChecked) {
            selectedReports.add(parseInt(checkbox.value));
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

    // Update select all checkbox
    const selectAllCheckbox = document.getElementById('select-all-reports');
    const checkboxes = document.querySelectorAll('.report-checkbox');
    const checkedBoxes = document.querySelectorAll('.report-checkbox:checked');

    selectAllCheckbox.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < checkboxes.length;
    selectAllCheckbox.checked = checkedBoxes.length === checkboxes.length && checkboxes.length > 0;
}

function updateBulkActionButtons() {
    const hasSelection = selectedReports.size > 0;
    document.getElementById('mark-reviewed-btn').disabled = !hasSelection;
    document.getElementById('delete-reports-btn').disabled = !hasSelection;
}

// ===== BULK ACTIONS =====
async function markSelectedAsReviewed() {
    if (selectedReports.size === 0) return;

    if (!confirm(`Mark ${selectedReports.size} reports as reviewed?`)) {
        return;
    }

    try {
        // Use existing single review endpoint multiple times
        const promises = Array.from(selectedReports).map(reportId =>
            fetch(`/admin/api/reports/${reportId}/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken()
                },
                body: JSON.stringify({
                    status: 'REVIEWED',
                    adminNotes: 'Bulk marked as reviewed'
                })
            })
        );

        await Promise.all(promises);

        alert('Reports marked as reviewed');
        loadReportsData();

    } catch (error) {
        console.error('Error marking reports as reviewed:', error);
        alert('Error marking reports as reviewed');
    }
}

async function deleteSelectedReports() {
    if (selectedReports.size === 0) return;

    if (!confirm(`DELETE ${selectedReports.size} reports? This cannot be undone!`)) {
        return;
    }

    try {
        // Use simple delete endpoint for each report
        const promises = Array.from(selectedReports).map(reportId =>
            fetch(`/admin/api/reports/${reportId}/delete`, {
                method: 'DELETE',
                headers: {
                    'X-XSRF-TOKEN': getCsrfToken()
                }
            })
        );

        await Promise.all(promises);

        alert('Reports deleted');
        loadReportsData();

    } catch (error) {
        console.error('Error deleting reports:', error);
        alert('Error deleting reports');
    }
}

// ===== OPEN CONTENT =====
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
        default:
            alert('Неподдържан тип съдържание');
            return;
    }

    window.open(url, '_blank');
}

// ===== UTILITY FUNCTIONS =====
function getEntityTypeBadge(entityType) {
    const types = {
        PUBLICATION: 'Публикация',
        SIGNAL: 'Сигнал',
        REFERENDUM: 'Референдум',
        MULTI_POLL: 'Анкета',
        SIMPLE_EVENT: 'Събитие'
    };

    return `<span class="badge report-type-badge report-type-${entityType.toLowerCase()}">${types[entityType] || entityType}</span>`;
}

function getReasonBadge(reason) {
    const reasons = {
        SPAM: 'Spam',
        INAPPROPRIATE: 'Inappropriate',
        HARASSMENT: 'Harassment',
        FALSE_INFORMATION: 'False Info',
        OTHER: 'Other'
    };

    return `<span class="badge report-reason-badge">${reasons[reason] || reason}</span>`;
}

function getStatusBadge(status) {
    const statuses = {
        PENDING: 'Pending',
        REVIEWED: 'Reviewed',
        DISMISSED: 'Dismissed',
        RESOLVED: 'Resolved'
    };

    return `<span class="badge report-status-badge status-${status.toLowerCase()}">${statuses[status] || status}</span>`;
}

// ===== AUTO INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Setup event listeners when page loads
    setupEventListeners();
});

// ===== CSRF TOKEN HELPER =====
function getCsrfToken() {
    // Try cookie first (for CookieCsrfTokenRepository)
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'XSRF-TOKEN') {
            return decodeURIComponent(value);
        }
    }

    // Fallback to meta tag
    const metaToken = document.querySelector('meta[name="_csrf"]');
    return metaToken ? metaToken.getAttribute('content') : '';
}