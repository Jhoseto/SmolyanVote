let selectedGroups = new Set();
let currentReports = [];
let currentSort = { column: 'reportCount', direction: 'desc' };
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

    tableBody.innerHTML = '<tr><td colspan="9" class="text-center" style="padding: 2rem; color: #6b7280;">Loading...</td></tr>';

    try {
        const response = await fetch('/admin/manage-reports/grouped?size=500', {
            headers: { 'X-XSRF-TOKEN': getCsrfToken() }
        });
        const data = await response.json();
        currentReports = data.content || [];
        if (currentReports.length > 0) {
            sortReports(currentSort.column, false);
        } else {
            tableBody.innerHTML = '<tr><td colspan="9" class="text-center" style="padding: 2rem; color: #9ca3af; font-style: italic;">No reports found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading grouped reports:', error);
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center" style="padding: 2rem; color: #dc2626;">Error loading reports</td></tr>';
    }
}

function sortReports(column, toggleDirection = true) {
    if (!currentReports.length) return;

    if (toggleDirection && currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort = { column, direction: 'desc' };
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
            case 'numberOfReporters':
                valA = a.reporterUsernames ? [...new Set(a.reporterUsernames)].length : 0;
                valB = b.reporterUsernames ? [...new Set(b.reporterUsernames)].length : 0;
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

        return `
        <tr>
            <td style="width: 40px;">
                <input type="checkbox" class="report-checkbox" 
                       data-entity-type="${group.entityType}" 
                       data-entity-id="${group.entityId}">
            </td>
            <td style="width: 120px;">${generateEntityTypeBadge(group.entityType)}</td>
            <td style="width: 100px;">${generateReportCountBadge(group.reportCount)}</td>
            <td style="width: 150px;">${generateReportersSection(group)}</td>
            <td style="width: 200px;">${generateDescriptionSection(group)}</td>
            <td style="width: 150px;">${generateReasonBadge(group.mostCommonReason)}</td>
            <td style="width: 100px;">${generateStatusBadge(group.status)}</td>
            <td style="width: 140px;">${generateDateSection(group, lastReportDate, firstReportDate)}</td>
            <td style="width: 100px;">${generateActionButtons(group)}</td>
        </tr>`;
    }).join('');

    selectedGroups.clear();
    updateBulkActionButtons();
    addTableEventListeners();
}

function generateEntityTypeBadge(entityType) {
    const typeMap = {
        PUBLICATION: 'Публикация',
        SIMPLE_EVENT: 'Събитие',
        REFERENDUM: 'Референдум',
        MULTI_POLL: 'Анкета'
    };

    const displayName = typeMap[entityType] || entityType;
    const cssClass = entityType ? entityType.toLowerCase() : 'unknown';

    return `<span class="entity-type-badge entity-type-${cssClass}">${displayName}</span>`;
}

function generateReportCountBadge(count) {
    const badgeClass = count > 1 ? 'report-count-multiple' : 'report-count-single';
    const label = count === 1 ? 'репорт' : 'репорта';

    return `
        <div style="display: flex; align-items: center;">
            <span class="report-count-badge ${badgeClass}">${count}</span>
            <span style="font-size: 0.75rem; color: #6b7280;">${label}</span>
        </div>
    `;
}

function generateReportersSection(group) {
    if (!group.reporterUsernames || group.reporterUsernames.length === 0) {
        return '<span class="no-description">N/A</span>';
    }

    if (group.reporterUsernames.length === 1) {
        return `<span class="single-reporter">${escapeHtml(group.reporterUsernames[0])}</span>`;
    }

    const uniqueReporters = [...new Set(group.reporterUsernames)];
    const displayText = `${uniqueReporters.length} докладчици`;

    return `<span class="multiple-reporters" 
                  data-reporters='${JSON.stringify(uniqueReporters)}' 
                  onclick="showReportersModal(this)"
                  title="Кликни за всички имена">
                <i class="bi bi-people-fill"></i> ${displayText}
            </span>`;
}

function generateDescriptionSection(group) {
    if (!group.mostRecentDescription || group.mostRecentDescription.trim() === '') {
        return '<span class="no-description">Няма описание</span>';
    }

    const description = group.mostRecentDescription.trim();

    return `<div class="description-display">
                <span class="description-text" ${description.length > 60 ? `title="${escapeHtml(description)}"` : ''}>
                    ${escapeHtml(description.length > 60 ? description.substring(0, 57) + '...' : description)}
                </span>
            </div>`;
}

function generateReasonBadge(reason) {
    if (!reason) return '<span class="no-description">N/A</span>';

    const reasonMap = {
        'SPAM': 'Спам',
        'HARASSMENT': 'Тормоз',
        'HATE_SPEECH': 'Език на омразата',
        'MISINFORMATION': 'Дезинформация',
        'INAPPROPRIATE': 'Неподходящо',
        'COPYRIGHT': 'Авторски права',
        'OTHER': 'Друго'
    };

    const displayName = reasonMap[reason] || reason;
    return `<span class="reason-badge">${displayName}</span>`;
}

function generateStatusBadge(status) {
    const statusMap = {
        'PENDING': 'Чака',
        'REVIEWED': 'Прегледан',
        'DISMISSED': 'Отхвърлен',
        'MIXED': 'Смесен'
    };

    const displayName = statusMap[status] || status;
    const cssClass = status ? status.toLowerCase() : 'mixed';

    return `<span class="status-badge status-${cssClass}">${displayName}</span>`;
}

function generateDateSection(group, lastReportDate, firstReportDate) {
    if (group.reportCount > 1) {
        return `<div class="date-display">
                    <div class="date-primary">Последен: ${lastReportDate}</div>
                    <div class="date-secondary">Първи: ${firstReportDate}</div>
                </div>`;
    } else {
        return `<div class="date-display">
                    <div class="date-primary">${lastReportDate}</div>
                </div>`;
    }
}

function generateActionButtons(group) {
    const viewButton = `<button class="action-btn action-btn-primary view-content-btn"
                               data-entity-type="${group.entityType}"
                               data-entity-id="${group.entityId}"
                               title="Прегледай съдържанието">
                            <i class="bi bi-eye"></i>
                        </button>`;

    const detailsButton = group.reportCount > 1 ?
        `<button class="action-btn action-btn-info view-reports-btn"
                 data-entity-type="${group.entityType}"
                 data-entity-id="${group.entityId}"
                 title="Виж всички ${group.reportCount} репорта">
            <i class="bi bi-list"></i>
        </button>` : '';

    return `<div class="action-buttons">${viewButton}${detailsButton}</div>`;
}

function showReportersModal(element) {
    const reporters = JSON.parse(element.getAttribute('data-reporters'));

    const modalContent = `
        <div class="modal-overlay" onclick="closeReportersModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h5><i class="bi bi-people-fill"></i> Докладчици (${reporters.length})</h5>
                    <button class="modal-close" onclick="closeReportersModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="reporters-list">
                        ${reporters.map(reporter => `
                            <div class="reporter-item">
                                <i class="bi bi-person-circle"></i>
                                <span class="reporter-name">${escapeHtml(reporter)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalContent);
}

function closeReportersModal() {
    const modal = document.querySelector('.modal-overlay');
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

function openReportedContent(entityType, entityId) {
    const urls = {
        SIMPLE_EVENT: `/event/${entityId}`,
        REFERENDUM: `/referendum/${entityId}`,
        PUBLICATION: `/publications/${entityId}`,
        MULTI_POLL: `/multipoll/${entityId}`
    };

    if (!urls[entityType]) {
        alert('Непознат тип съдържание: ' + entityType);
        return;
    }

    window.open(urls[entityType], '_blank');
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
        const allReportIds = [];

        for (const groupKey of selectedGroups) {
            const report = currentReports.find(r => `${r.entityType}-${r.entityId}` === groupKey);
            if (report && report.reportIds) {
                allReportIds.push(...report.reportIds);
            }
        }

        if (allReportIds.length === 0) {
            alert('Няма репорти за изтриване');
            return;
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
            <div class="modal-overlay" onclick="closeDetailedReportsModal()">
                <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 800px;">
                    <div class="modal-header">
                        <h5><i class="bi bi-flag-fill"></i> Всички репорти за ${getEntityDisplayName(entityType)}</h5>
                        <button class="modal-close" onclick="closeDetailedReportsModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div style="display: flex; flex-direction: column; gap: 1rem; max-height: 450px; overflow-y: auto;">
                            ${reports.map((report, index) => `
                                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; background: #f8fafc;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e5e7eb;">
                                        <strong>#${index + 1}</strong>
                                        <span class="reason-badge">${getReasonText(report.reason)}</span>
                                        <span style="font-size: 0.85rem; color: #6b7280;">${new Date(report.createdAt).toLocaleString('bg-BG')}</span>
                                    </div>
                                    <div style="display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.85rem;">
                                        <div><strong>Докладвач:</strong> ${escapeHtml(report.reporterUsername)}</div>
                                        ${report.description ? `<div><strong>Описание:</strong> ${escapeHtml(report.description)}</div>` : ''}
                                        <div><strong>Статус:</strong> ${generateStatusBadge(report.status)}</div>
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
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

function getEntityDisplayName(type) {
    const names = {
        PUBLICATION: 'Публикация',
        SIMPLE_EVENT: 'Събитие',
        REFERENDUM: 'Референдум',
        MULTI_POLL: 'Анкета'
    };
    return names[type] || type;
}

function getReasonText(reason) {
    const reasonMap = {
        'SPAM': 'Спам',
        'HARASSMENT': 'Тормоз',
        'HATE_SPEECH': 'Език на омразата',
        'MISINFORMATION': 'Дезинформация',
        'INAPPROPRIATE': 'Неподходящо',
        'COPYRIGHT': 'Авторски права',
        'OTHER': 'Друго'
    };
    return reasonMap[reason] || reason;
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

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadReportsData();
});