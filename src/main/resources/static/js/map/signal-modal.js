// Additional modal utility functions

function centerMapOnSignal() {
    if (window.currentModalSignalCoordinates && window.mapCore) {
        const map = window.mapCore.getMap();
        if (map && Array.isArray(window.currentModalSignalCoordinates)) {
            map.setView(window.currentModalSignalCoordinates, 16);
            closeSignalModal();

            if (window.mapCore.showNotification) {
                window.mapCore.showNotification('Картата е центрирана на сигнала', 'success');
            }
        }
    }
}

function reportSignal() {
    if (window.currentModalSignal && typeof window.showEventReportModal === 'function') {
        const signal = window.currentModalSignal;
        window.showEventReportModal('SIGNAL', signal.id, signal.title);
    } else {
        alert('Функцията за докладване не е достъпна в момента');
    }
}

function editSignal() {
    if (window.currentModalSignal) {
        // TODO: Implement edit functionality
        alert('Функцията за редактиране ще бъде добавена скоро');
    }
}

function resolveSignal() {
    if (window.currentModalSignal) {
        // TODO: Implement resolve functionality
        const confirmed = confirm('Сигурни ли сте, че искате да маркирате този сигнал като решен?');
        if (confirmed) {
            alert('Функцията за решаване ще бъде добавена скоро');
        }
    }
}

function deleteSignal() {
    if (window.currentModalSignal) {
        // TODO: Implement delete functionality
        const confirmed = confirm('ВНИМАНИЕ: Това действие е необратимо!\n\nСигурни ли сте, че искате да изтриете този сигнал?');
        if (confirmed) {
            alert('Функцията за изтриване ще бъде добавена скоро');
        }
    }
}

function showSignalModalLoading() {
    const loadingEl = document.getElementById('signalModalLoading');
    if (loadingEl) {
        loadingEl.style.display = 'flex';
    }
}

function hideSignalModalLoading() {
    const loadingEl = document.getElementById('signalModalLoading');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

function showSignalModalError(message) {
    const errorEl = document.getElementById('signalModalError');
    const errorMsg = document.getElementById('signalModalErrorMessage');

    if (errorEl && errorMsg) {
        errorMsg.textContent = message || 'Възникна неочаквана грешка';
        errorEl.style.display = 'flex';
    }
}

function closeSignalModalError() {
    const errorEl = document.getElementById('signalModalError');
    if (errorEl) {
        errorEl.style.display = 'none';
    }
}

function retryLoadSignal() {
    closeSignalModalError();
    if (window.currentModalSignal && window.currentModalSignal.id) {
        openSignalModal(window.currentModalSignal.id);
    }
}

// Update location coordinates display
function updateLocationDisplay(coordinates) {
    const locationEl = document.getElementById('modalLocationCoordinates');
    if (locationEl && coordinates && Array.isArray(coordinates)) {
        const [lat, lng] = coordinates;
        locationEl.innerHTML = `
            <i class="bi bi-pin-map"></i>
            <span>${lat.toFixed(6)}, ${lng.toFixed(6)}</span>
        `;
    }
}

// Update modified date
function updateModifiedDate(modifiedDate) {
    const modifiedEl = document.getElementById('modalModifiedDate');
    if (modifiedEl && modifiedDate) {
        try {
            const date = new Date(modifiedDate);
            modifiedEl.textContent = date.toLocaleString('bg-BG', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            modifiedEl.textContent = 'Невалидна дата';
        }
    }
}

// Update signal status
function updateSignalStatus(status) {
    const statusEl = document.getElementById('modalSignalStatus');
    if (statusEl) {
        // Remove existing status classes
        statusEl.className = 'status-badge';

        // Add appropriate status class and text
        switch (status) {
            case 'RESOLVED':
                statusEl.classList.add('status-resolved');
                statusEl.textContent = 'Решен';
                break;
            case 'REJECTED':
                statusEl.classList.add('status-rejected');
                statusEl.textContent = 'Отхвърлен';
                break;
            case 'PENDING':
            default:
                statusEl.classList.add('status-pending');
                statusEl.textContent = 'В очакване';
                break;
        }
    }
}

// Show/hide admin actions based on user permissions
function updateAdminActions(canEdit) {
    const adminSection = document.getElementById('modalAdminActions');
    if (adminSection) {
        adminSection.style.display = canEdit ? 'block' : 'none';
    }
}