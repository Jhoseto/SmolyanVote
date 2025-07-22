// ===== SIGNAL MODAL =====
// Модал за подробности за сигналите

let currentModalSignal = null;

// ===== ОТВАРЯНЕ НА МОДАЛ =====
function openSignalModal(signal) {
    if (!signal) return;

    currentModalSignal = signal;
    const modal = document.getElementById('signalModal');
    if (!modal) return;

    // Обнови съдържанието
    updateModalContent(signal);

    // Покажи модала
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
    document.body.style.overflow = 'hidden';
}

// ===== ЗАТВАРЯНЕ НА МОДАЛ =====
function closeSignalModal() {
    const modal = document.getElementById('signalModal');
    if (!modal) return;

    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }, 300);

    currentModalSignal = null;
}

// ===== ОБНОВЯВАНЕ НА СЪДЪРЖАНИЕТО =====
function updateModalContent(signal) {
    const category = SIGNAL_CATEGORIES[signal.category] || { name: signal.category, icon: 'bi-circle', color: '#6c757d' };
    const urgency = URGENCY_LEVELS[signal.urgency] || { name: signal.urgency, color: '#6c757d' };

    // Title
    const titleEl = document.getElementById('signalModalTitle');
    if (titleEl) titleEl.textContent = signal.title;

    // Category
    const categoryEl = document.getElementById('signalModalCategory');
    if (categoryEl) {
        categoryEl.innerHTML = `<i class="${category.icon}"></i> ${category.name}`;
        categoryEl.style.color = category.color;
    }

    // Urgency
    const urgencyEl = document.getElementById('signalModalUrgency');
    if (urgencyEl) {
        urgencyEl.textContent = urgency.name;
        urgencyEl.className = `signal-urgency urgency-${signal.urgency}`;
    }

    // Description
    const descEl = document.getElementById('signalModalDescription');
    if (descEl) descEl.textContent = signal.description;

    // Author с avatar
    const authorEl = document.getElementById('signalModalAuthor');
    if (authorEl && signal.author) {
        authorEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            ${window.avatarUtils ? window.avatarUtils.createAvatar(signal.author?.imageUrl, signal.author?.username, 32, 'user-avatar') : ''}
            <span>${signal.author?.username || 'Анонимен'}</span>
        </div>
    `;
    } else if (authorEl) {
        authorEl.textContent = 'Анонимен';
    }

    // Date
    const dateEl = document.getElementById('signalModalDate');
    if (dateEl) {
        const date = new Date(signal.created);
        dateEl.textContent = date.toLocaleDateString('bg-BG');
    }

    // Coordinates
    const coordsEl = document.getElementById('signalModalCoords');
    if (coordsEl && signal.coordinates) {
        coordsEl.textContent = `${signal.coordinates[0].toFixed(4)}, ${signal.coordinates[1].toFixed(4)}`;
    }

    // Image
    const imageEl = document.getElementById('signalModalImage');
    if (imageEl) {
        if (signal.imageUrl) {
            imageEl.src = signal.imageUrl;
            imageEl.style.display = 'block';
        } else {
            imageEl.style.display = 'none';
        }
    }
}

// ===== ACTIONS =====
function centerMapOnSignal() {
    if (currentModalSignal?.coordinates && window.mapCore) {
        const map = window.mapCore.getMap();
        if (map) {
            map.setView(currentModalSignal.coordinates, 16);
            closeSignalModal();
            window.mapCore.showNotification('Картата е центрирана', 'success');
        }
    }
}

function reportSignal() {
    if (currentModalSignal && window.showEventReportModal) {
        window.showEventReportModal('SIGNAL', currentModalSignal.id, currentModalSignal.title);
    } else {
        alert('Функцията за докладване не е достъпна');
    }
}

function editSignal() {
    if (currentModalSignal) {
        alert('Функцията за редактиране ще бъде добавена скоро');
    }
}

function deleteSignal() {
    if (currentModalSignal) {
        const confirmed = confirm('Сигурни ли сте, че искате да изтриете този сигнал?');
        if (confirmed) {
            alert('Функцията за изтриване ще бъде добавена скоро');
        }
    }
}

// ===== EVENT LISTENERS =====
function initializeSignalModal() {
    const modal = document.getElementById('signalModal');
    if (!modal) return;

    // Затваряне при клик върху backdrop
    modal.onclick = (e) => {
        if (e.target === modal) closeSignalModal();
    };

    // Затваряне при ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeSignalModal();
        }
    });

    // Бутони
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.onclick = closeSignalModal;

    const centerBtn = document.getElementById('centerMapBtn');
    if (centerBtn) centerBtn.onclick = centerMapOnSignal;

    const reportBtn = document.getElementById('reportSignalBtn');
    if (reportBtn) reportBtn.onclick = reportSignal;

    const editBtn = document.getElementById('editSignalBtn');
    if (editBtn) editBtn.onclick = editSignal;

    const deleteBtn = document.getElementById('deleteSignalBtn');
    if (deleteBtn) deleteBtn.onclick = deleteSignal;
}

// ===== ГЛОБАЛНИ ФУНКЦИИ =====
window.openSignalModal = openSignalModal;
window.closeSignalModal = closeSignalModal;
window.centerMapOnSignal = centerMapOnSignal;
window.reportSignal = reportSignal;
window.editSignal = editSignal;
window.deleteSignal = deleteSignal;

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
    initializeSignalModal();
});