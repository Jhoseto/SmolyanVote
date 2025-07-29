let selectedGroups = new Set(); // Променено от selectedReports
let currentReports = [];
let currentSort = { column: 'reportCount', direction: 'desc' }; // Сортиране по брой докладвания
let eventListenersSetup = false;

function setupEventListeners() {
    if (eventListenersSetup) return;

    document.getElementById('reports-refresh-btn')?.addEventListener('click', loadReportsData);
    document.getElementById('mark-reviewed-btn')?.addEventListener('click', bulkMarkAsReviewed);
    document.getElementById('delete-reports-btn')?.addEventListener('click', bulkDeleteReports);
    document.getElementById('select-all-reports')?.addEventListener('change', toggleSelectAll);

    document.querySelectorAll('.sortable').forEach(header => {
        const column = header.getAttribute('data-column');
        if (column) {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => sortReports(column));
        }
    });

    eventListenersSetup = true;
}

async function loadReportsData() {
    try {
        await Promise.all([
            loadReportsStatistics(),
            loadGroupedReports()
        ]);
    } catch (error) {
        console.error('Error loading reports data:', error);
    }
}

async function loadReportsStatistics() {
    try {
        const response = await fetch('/admin/manage-reports/statistics', {
            headers: { 'X-XSRF-TOKEN': getCsrfToken() }
        });
        const data = await response.json();
        document.getElementById('reports-pending-count').textContent = data.pendingReports || '0';
        document.getElementById('reports-total-count').textContent = data.totalReports || '0';
    } catch (error) {
        console.error('Error loading reports statistics:', error);
        document.getElementById('reports-pending-count').textContent = 'ERR';
        document.getElementById('reports-total-count').textContent = 'ERR';
    }
}

async function loadGroupedReports() {
    const tableBody = document.getElementById('reports-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Loading...</td></tr>';

    try {
        const response = await fetch('/admin/manage-reports/grouped?size=500', {
            headers: { 'X-XSRF-TOKEN': getCsrfToken() }
        });
        const data = await response.json();
        currentReports = data.content || [];
        if (currentReports.length > 0) {
            sortReports(currentSort.column, false);
        } else {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No reports found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading grouped reports:', error);
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error loading reports</td></tr>';
    }
}

function sortReports(column, toggleDirection = true) {
    if (!currentReports.length) return;

    if (toggleDirection && currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort = { column, direction: 'desc' }; // Default desc за числа
    }

    currentReports.sort((a, b) => {
        let valA, valB;

        switch (column) {
            case 'entityType':
                valA = a.entityType || '';
                valB = b.entityType || '';
                break;
            case 'reportCount':
                valA = a.reportCount || 0;
                valB = b.reportCount || 0;
                break;
            case 'mostCommonReason':
                valA = a.mostCommonReason || '';
                valB = b.mostCommonReason || '';
                break;
            case 'status':
                valA = a.status || '';
                valB = b.status || '';
                break;
            case 'lastReportDate':
                valA = new Date(a.lastReportDate || 0);
                valB = new Date(b.lastReportDate || 0);
                break;
            case 'firstReportDate':
                valA = new Date(a.firstReportDate || 0);
                valB = new Date(b.firstReportDate || 0);
                break;
            default:
                return 0;
        }

        let comparison = 0;
        if (valA > valB) comparison = 1;
        if (valA < valB) comparison = -1;

        return currentSort.direction === 'asc' ? comparison : -comparison;
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
        currentHeader.classList.add(`sort-${currentSort.direction}`);
    }
}

function renderReportsTable(reports) {
    const tableBody = document.getElementById('reports-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = reports.map(group => {
        const lastReportDate = new Date(group.lastReportDate).toLocaleString('bg-BG');
        const firstReportDate = group.firstReportDate ? new Date(group.firstReportDate).toLocaleString('bg-BG') : '';

        // Генериране на докладвачи секцията
        const reportersSection = generateReportersSection(group);

        // Дата секция с допълнителна информация
        const dateSection = group.reportCount > 1
            ? `<div><strong>Последен:</strong> ${lastReportDate}</div><div><small class="text-muted">Първи: ${firstReportDate}</small></div>`
            : `<div>${lastReportDate}</div>`;

        return `
        <tr>
            <td>
                <input type="checkbox" class="report-checkbox" 
                       data-entity-type="${group.entityType}" 
                       data-entity-id="${group.entityId}">
            </td>
            <td>${getEntityTypeBadge(group.entityType)}</td>
            <td>
                <span class="report-count-badge ${group.reportCount > 1 ? 'multiple' : 'single'}">${group.reportCount}</span>
                <small class="text-muted">${group.reportCount === 1 ? 'репорт' : 'репорта'}</small>
            </td>
            <td>${reportersSection}</td>
            <td>${getReasonBadge(group.mostCommonReason)}</td>
            <td>${getStatusBadge(group.status)}</td>
            <td>${dateSection}</td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary view-content-btn"
                            data-entity-type="${group.entityType}"
                            data-entity-id="${group.entityId}"
                            title="Прегледай съдържанието">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${group.reportCount > 1 ? `
                    <button class="btn btn-sm btn-outline-info view-reports-btn"
                            data-entity-type="${group.entityType}"
                            data-entity-id="${group.entityId}"
                            title="Виж всички ${group.reportCount} репорта">
                        <i class="bi bi-list"></i> ${group.reportCount}
                    </button>
                    ` : ''}
                </div>
            </td>
        </tr>`;
    }).join('');

    selectedGroups.clear();
    updateBulkActionButtons();
    addTableEventListeners();
}

function generateReportersSection(group) {
    if (!group.reporterUsernames || group.reporterUsernames.length === 0) {
        return '<span class="text-muted">N/A</span>';
    }

    if (group.reporterUsernames.length === 1) {
        return `<span class="single-reporter">${escapeHtml(group.reporterUsernames[0])}</span>`;
    }

    // Множество докладвачи - правим кликабел елемент
    const uniqueReporters = [...new Set(group.reporterUsernames)]; // Премахваме дубликати
    const displayText = `Докладвачи (${uniqueReporters.length})`;

    return `<span class="multiple-reporters" 
                  data-reporters='${JSON.stringify(uniqueReporters)}' 
                  onclick="showReportersModal(this)"
                  title="Кликни за всички имена">
                <i class="bi bi-people-fill"></i> ${displayText}
            </span>`;
}

function showReportersModal(element) {
    const reporters = JSON.parse(element.getAttribute('data-reporters'));

    const modalContent = `
        <div class="reporters-modal-overlay" onclick="closeReportersModal()">
            <div class="reporters-modal" onclick="event.stopPropagation()">
                <div class="reporters-modal-header">
                    <h5><i class="bi bi-people-fill"></i> Докладвачи (${reporters.length})</h5>
                    <button class="btn-close" onclick="closeReportersModal()">×</button>
                </div>
                <div class="reporters-modal-body">
                    <div class="reporters-list">
                        ${reporters.map((reporter, index) =>
        `<div class="reporter-item">
                                <i class="bi bi-person-circle"></i>
                                <span>${escapeHtml(reporter)}</span>
                            </div>`
    ).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalContent);
}

function closeReportersModal() {
    const modal = document.querySelector('.reporters-modal-overlay');
    if (modal) {
        modal.remove();
    }
}

function addTableEventListeners() {
    document.querySelectorAll('.report-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            const entityType = cb.getAttribute('data-entity-type');
            const entityId = cb.getAttribute('data-entity-id');
            const groupKey = `${entityType}-${entityId}`;

            if (cb.checked) {
                selectedGroups.add(groupKey);
            } else {
                selectedGroups.delete(groupKey);
            }

            updateBulkActionButtons();
            updateSelectAllCheckbox();
        });
    });

    document.querySelectorAll('.view-content-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            openReportedContent(btn.getAttribute('data-entity-type'), btn.getAttribute('data-entity-id'));
        });
    });

    document.querySelectorAll('.view-reports-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            showDetailedReportsModal(btn.getAttribute('data-entity-type'), btn.getAttribute('data-entity-id'));
        });
    });
}

function updateSelectAllCheckbox() {
    const all = document.querySelectorAll('.report-checkbox');
    const checked = document.querySelectorAll('.report-checkbox:checked');
    const selectAll = document.getElementById('select-all-reports');
    if (selectAll) {
        selectAll.indeterminate = checked.length > 0 && checked.length < all.length;
        selectAll.checked = checked.length === all.length && all.length > 0;
    }
}

function toggleSelectAll(e) {
    const checked = e.target.checked;
    selectedGroups.clear();
    document.querySelectorAll('.report-checkbox').forEach(cb => {
        cb.checked = checked;
        if (checked) {
            const entityType = cb.getAttribute('data-entity-type');
            const entityId = cb.getAttribute('data-entity-id');
            selectedGroups.add(`${entityType}-${entityId}`);
        }
    });
    updateBulkActionButtons();
}

function updateBulkActionButtons() {
    const hasSelection = selectedGroups.size > 0;

    // Изчисляваме общия брой репорти в избраните групи
    const totalReports = Array.from(selectedGroups).reduce((sum, groupKey) => {
        const report = currentReports.find(r => `${r.entityType}-${r.entityId}` === groupKey);
        return sum + (report ? report.reportCount : 0);
    }, 0);

    const markBtn = document.getElementById('mark-reviewed-btn');
    const deleteBtn = document.getElementById('delete-reports-btn');

    if (markBtn) {
        markBtn.disabled = !hasSelection;
        markBtn.textContent = hasSelection ? `Mark Reviewed (${totalReports})` : 'Mark Reviewed';
    }

    if (deleteBtn) {
        deleteBtn.disabled = !hasSelection;
        deleteBtn.textContent = hasSelection ? `Delete (${totalReports})` : 'Delete';
    }
}

async function bulkMarkAsReviewed() {
    if (!selectedGroups.size) return alert('Моля, изберете поне една група репорти');

    const totalReports = Array.from(selectedGroups).reduce((sum, groupKey) => {
        const report = currentReports.find(r => `${r.entityType}-${r.entityId}` === groupKey);
        return sum + (report ? report.reportCount : 0);
    }, 0);

    if (!confirm(`Маркиране на ${totalReports} репорта като прегледани?`)) return;

    try {
        const entityGroups = Array.from(selectedGroups).map(groupKey => {
            const [entityType, entityId] = groupKey.split('-');
            return { entityType, entityId: parseInt(entityId) };
        });

        const res = await fetch('/admin/manage-reports/grouped/bulk-review', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': getCsrfToken()
            },
            body: JSON.stringify({
                entityGroups: entityGroups,
                status: 'REVIEWED',
                adminNotes: 'Bulk reviewed'
            })
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Unknown error');
        alert(result.message);
        loadReportsData();
    } catch (e) {
        console.error('Review error:', e);
        alert('Грешка: ' + e.message);
    }
}

async function bulkDeleteReports() {
    if (!selectedGroups.size) return alert('Моля, изберете поне една група репорти');

    const totalReports = Array.from(selectedGroups).reduce((sum, groupKey) => {
        const report = currentReports.find(r => `${r.entityType}-${r.entityId}` === groupKey);
        return sum + (report ? report.reportCount : 0);
    }, 0);

    if (!confirm(`ИЗТРИВАНЕ на ${totalReports} репорта? Това действие е необратимо!`)) return;

    try {
        // Първо получаваме всички report ID-та за избраните групи
        const allReportIds = [];

        for (const groupKey of selectedGroups) {
            const [entityType, entityId] = groupKey.split('-');
            const response = await fetch(`/admin/manage-reports/entity/${entityType}/${entityId}/ids`);
            const reportIds = await response.json();
            allReportIds.push(...reportIds);
        }

        const res = await fetch('/admin/manage-reports/bulk-delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': getCsrfToken()
            },
            body: JSON.stringify(allReportIds)
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Unknown error');
        alert(result.message);
        loadReportsData();
    } catch (e) {
        console.error('Delete error:', e);
        alert('Грешка: ' + e.message);
    }
}

async function showDetailedReportsModal(entityType, entityId) {
    try {
        const response = await fetch(`/admin/manage-reports/entity/${entityType}/${entityId}/details`);
        const reports = await response.json();

        const modalContent = `
            <div class="detailed-reports-modal-overlay" onclick="closeDetailedReportsModal()">
                <div class="detailed-reports-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h5><i class="bi bi-flag-fill"></i> Всички репорти за ${getEntityDisplayName(entityType)}</h5>
                        <button class="btn-close" onclick="closeDetailedReportsModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="reports-detailed-list">
                            ${reports.map((report, index) => `
                                <div class="report-detail-item">
                                    <div class="report-header">
                                        <strong>#${index + 1}</strong>
                                        <span class="badge ${getReasonClass(report.reason)}">${getReasonText(report.reason)}</span>
                                        <span class="report-date">${new Date(report.createdAt).toLocaleString('bg-BG')}</span>
                                    </div>
                                    <div class="report-content">
                                        <div><strong>Докладвач:</strong> ${escapeHtml(report.reporterUsername)}</div>
                                        ${report.description ? `<div><strong>Описание:</strong> ${escapeHtml(report.description)}</div>` : ''}
                                        <div><strong>Статус:</strong> ${getStatusBadge(report.status)}</div>
                                        ${report.adminNotes ? `<div><strong>Админ бележки:</strong> ${escapeHtml(report.adminNotes)}</div>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalContent);
    } catch (error) {
        console.error('Error loading detailed reports:', error);
        alert('Грешка при зареждане на детайлите');
    }
}

function closeDetailedReportsModal() {
    const modal = document.querySelector('.detailed-reports-modal-overlay');
    if (modal) {
        modal.remove();
    }
}

function openReportedContent(entityType, entityId) {
    const urls = {
        SIMPLE_EVENT: `/event/${entityId}`,
        REFERENDUM: `/referendum/${entityId}`,
        SIGNAL: `/signals/${entityId}`,
        PUBLICATION: `/publications/${entityId}`,
        MULTI_POLL: `/multipoll/${entityId}`
    };

    if (!urls[entityType]) {
        alert('Непознат тип съдържание: ' + entityType);
        return;
    }

    window.open(urls[entityType], '_blank');
}

function getEntityTypeBadge(type) {
    const names = {
        PUBLICATION: 'Публикация',
        SIGNAL: 'Сигнал',
        REFERENDUM: 'Референдум',
        MULTI_POLL: 'Анкета',
        SIMPLE_EVENT: 'Събитие'
    };
    const name = names[type] || type;
    const className = type ? type.toLowerCase().replace('_', '-') : 'unknown';
    return `<span class="badge report-type-badge report-type-${className}">${escapeHtml(name)}</span>`;
}

function getEntityDisplayName(type) {
    const names = {
        PUBLICATION: 'публикация',
        SIGNAL: 'сигнал',
        REFERENDUM: 'референдум',
        MULTI_POLL: 'анкета',
        SIMPLE_EVENT: 'събитие'
    };
    return names[type] || type;
}

function getReasonBadge(reason) {
    const map = {
        SPAM: 'Spam',
        INAPPROPRIATE: 'Неуместно',
        HARASSMENT: 'Тормоз',
        FALSE_INFORMATION: 'Невярна информация',
        OTHER: 'Друго'
    };
    return `<span class="badge report-reason-badge">${escapeHtml(map[reason] || reason)}</span>`;
}

function getReasonText(reason) {
    const map = {
        SPAM: 'Spam',
        INAPPROPRIATE: 'Неуместно',
        HARASSMENT: 'Тормоз',
        FALSE_INFORMATION: 'Невярна информация',
        OTHER: 'Друго'
    };
    return map[reason] || reason;
}

function getReasonClass(reason) {
    return `reason-${reason.toLowerCase()}`;
}

function getStatusBadge(status) {
    const map = {
        PENDING: 'Чакащ',
        REVIEWED: 'Прегледан',
        DISMISSED: 'Отхвърлен',
        RESOLVED: 'Решен',
        MIXED: 'Смесен'
    };
    const className = status ? status.toLowerCase() : 'unknown';
    return `<span class="badge report-status-badge status-${className}">${escapeHtml(map[status] || status)}</span>`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

function getCsrfToken() {
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('XSRF-TOKEN='));
    return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
}

// CSS стилове за новите елементи
const style = document.createElement('style');
style.textContent = `
    .report-count-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-weight: bold;
        font-size: 0.85rem;
        margin-right: 6px;
        display: inline-block;
        min-width: 24px;
        text-align: center;
    }
    
    .report-count-badge.single {
        background: #6c757d;
        color: white;
    }
    
    .report-count-badge.multiple {
        background: #dc3545;
        color: white;
    }
    
    .multiple-reporters {
        color: #0066cc;
        cursor: pointer;
        text-decoration: underline;
        font-weight: 500;
    }
    
    .multiple-reporters:hover {
        color: #004499;
        background: #f0f8ff;
        padding: 2px 4px;
        border-radius: 3px;
    }
    
    .single-reporter {
        font-weight: 500;
    }
    
    .reporters-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 1050;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .reporters-modal {
        background: white;
        border-radius: 8px;
        max-width: 400px;
        max-height: 500px;
        width: 90%;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }
    
    .reporters-modal-header {
        padding: 1rem;
        border-bottom: 1px solid #dee2e6;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f8f9fa;
        border-radius: 8px 8px 0 0;
    }
    
    .reporters-modal-header h5 {
        margin: 0;
        color: #495057;
    }
    
    .btn-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #6c757d;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .btn-close:hover {
        color: #000;
        background: #e9ecef;
        border-radius: 50%;
    }
    
    .reporters-modal-body {
        padding: 1rem;
        max-height: 400px;
        overflow-y: auto;
    }
    
    .reporters-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .reporter-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: #f8f9fa;
        border-radius: 4px;
        border-left: 3px solid #007bff;
    }
    
    .reporter-item i {
        color: #007bff;
    }
    
    .detailed-reports-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 1050;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .detailed-reports-modal {
        background: white;
        border-radius: 8px;
        max-width: 800px;
        max-height: 600px;
        width: 90%;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }
    
    .reports-detailed-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-height: 450px;
        overflow-y: auto;
    }
    
    .report-detail-item {
        border: 1px solid #dee2e6;
        border-radius: 6px;
        padding: 1rem;
        background: #f8f9fa;
    }
    
    .report-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #dee2e6;
    }
    
    .report-content {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
    }
    
    .report-date {
        font-size: 0.85rem;
        color: #6c757d;
    }
    
    .reason-spam { background: #ffc107; color: #212529; }
    .reason-inappropriate { background: #dc3545; color: white; }
    .reason-harassment { background: #6f42c1; color: white; }
    .reason-false_information { background: #fd7e14; color: white; }
    .reason-other { background: #6c757d; color: white; }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadReportsData();
});