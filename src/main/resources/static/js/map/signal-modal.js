// ===== SIGNAL MODAL JAVASCRIPT =====

// Global variable to store current signal
let currentModalSignal = null;

// ===== MODAL OPENING FUNCTION =====
function openSignalModal(signalData) {
    // Handle both signal object and signal ID
    const signal = typeof signalData === 'object' ? signalData : findSignalById(signalData);

    if (!signal) {
        console.error('Signal not found:', signalData);
        return;
    }

    currentModalSignal = signal;
    populateModalContent(signal);
    showModal();
}

// ===== FIND SIGNAL BY ID =====
function findSignalById(signalId) {
    // Try to find signal in currentSignals array from main app
    if (window.signalManagement && typeof window.signalManagement.getCurrentSignals === 'function') {
        const signals = window.signalManagement.getCurrentSignals();
        return signals.find(s => s.id == signalId);
    }

    // Try to find signal in global currentSignals variable
    if (typeof currentSignals !== 'undefined') {
        return currentSignals.find(s => s.id == signalId);
    }

    // If currentSignals is not available, try to find in SAMPLE_SIGNALS
    if (typeof SAMPLE_SIGNALS !== 'undefined') {
        return SAMPLE_SIGNALS.find(s => s.id == signalId);
    }

    return null;
}

// ===== POPULATE MODAL CONTENT =====
function populateModalContent(signal) {
    const category = SIGNAL_CATEGORIES[signal.category];
    const urgency = URGENCY_LEVELS[signal.urgency];

    // Update header badges
    updateCategoryBadge(category);
    updateUrgencyBadge(signal.urgency, urgency);

    // Update signal title and meta info
    const titleElement = document.getElementById('modalSignalTitle');
    const idElement = document.getElementById('modalSignalId');
    const dateElement = document.getElementById('modalSignalDate');

    if (titleElement) titleElement.textContent = signal.title;
    if (idElement) idElement.textContent = `#${signal.id.toString().padStart(4, '0')}`;
    if (dateElement) dateElement.textContent = formatDate(signal.createdAt);

    // Update description
    const descriptionElement = document.getElementById('modalSignalDescription');
    if (descriptionElement) descriptionElement.textContent = signal.description;

    // Update full date
    const fullDateElement = document.getElementById('modalFullDate');
    if (fullDateElement) fullDateElement.textContent = formatFullDate(signal.createdAt);

    // Update author information
    updateAuthorSection(signal.author);

    // Update image section
    updateImageSection(signal.imageUrl);

    // Store signal coordinates for map centering
    if (signal.coordinates) {
        window.currentModalSignalCoordinates = signal.coordinates;
    }
}

// ===== UPDATE AUTHOR SECTION =====
function updateAuthorSection(author) {
    // Намиране на автор секцията в модала (ще добавим в HTML-а)
    let authorSection = document.getElementById('modalAuthorSection');

    if (!authorSection) {
        // Създаване на автор секцията ако не съществува
        const descriptionSection = document.querySelector('.signal-description-section');
        if (descriptionSection) {
            authorSection = document.createElement('div');
            authorSection.id = 'modalAuthorSection';
            authorSection.className = 'signal-author-section';

            // Вмъкване преди description секцията
            descriptionSection.parentNode.insertBefore(authorSection, descriptionSection);
        }
    }

    if (authorSection && author) {
        // Създаване на avatar
        const authorAvatarHTML = window.avatarUtils ?
            window.avatarUtils.createAvatar(author.imageUrl, author.username, 48, 'modal-author-avatar') :
            `<img class="modal-author-avatar" src="${author.imageUrl || '/images/default-avatar.png'}" alt="${author.username}" style="width:48px;height:48px;border-radius:50%;">`;

        authorSection.innerHTML = `
            <h3 class="section-title">
                <i class="bi bi-person-circle"></i>
                Подадено от
            </h3>
            <div class="author-info-container">
                <div class="author-avatar-container">
                    ${authorAvatarHTML}
                </div>
                <div class="author-details">
                    <div class="author-name">${author.username}</div>
                    <div class="author-meta">Потребител на SmolyanVote</div>
                </div>
                <button class="author-profile-btn" onclick="viewAuthorProfile(${author.id})" title="Виж профила">
                    <i class="bi bi-arrow-right"></i>
                </button>
            </div>
        `;
    }
}

// ===== UPDATE IMAGE SECTION =====
function updateImageSection(imageUrl) {
    const imageElement = document.getElementById('modalSignalImage');
    const placeholderElement = document.getElementById('noImagePlaceholder');

    if (imageUrl) {
        if (imageElement) {
            imageElement.src = imageUrl;
            imageElement.style.display = 'block';
            imageElement.onload = function() {
                // Добавяне на click handler за пълен размер
                imageElement.onclick = function() {
                    openImageFullscreen(imageUrl);
                };
                imageElement.style.cursor = 'pointer';
                imageElement.title = 'Кликнете за пълен размер';
            };
        }
        if (placeholderElement) {
            placeholderElement.style.display = 'none';
        }
    } else {
        if (imageElement) {
            imageElement.style.display = 'none';
            imageElement.onclick = null;
        }
        if (placeholderElement) {
            placeholderElement.style.display = 'flex';
        }
    }
}

// ===== UPDATE CATEGORY BADGE =====
function updateCategoryBadge(category) {
    const categoryBadge = document.getElementById('modalCategoryBadge');
    const categoryIcon = document.getElementById('modalCategoryIcon');
    const categoryName = document.getElementById('modalCategoryName');

    if (categoryIcon) categoryIcon.className = `bi ${category.icon}`;
    if (categoryName) categoryName.textContent = category.name;
    if (categoryBadge) {
        categoryBadge.style.background = `${category.color}15`;
        categoryBadge.style.color = category.color;
        categoryBadge.style.borderColor = `${category.color}30`;
    }
}

// ===== UPDATE URGENCY BADGE =====
function updateUrgencyBadge(urgencyLevel, urgency) {
    const urgencyBadge = document.getElementById('modalUrgencyBadge');
    const urgencyIcon = document.getElementById('modalUrgencyIcon');
    const urgencyName = document.getElementById('modalUrgencyName');

    if (urgencyIcon) urgencyIcon.className = `bi ${urgency.icon}`;
    if (urgencyName) urgencyName.textContent = urgency.name;
    if (urgencyBadge) {
        urgencyBadge.style.background = `${urgency.color}15`;
        urgencyBadge.style.color = urgency.color;
        urgencyBadge.style.borderColor = `${urgency.color}30`;
        urgencyBadge.className = `modal-urgency-badge urgency-${urgencyLevel}`;
    }
}

// ===== DATE FORMATTING =====
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', {
        day: 'numeric',
        month: 'short'
    });
}

function formatFullDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ===== MODAL DISPLAY FUNCTIONS =====
function showModal() {
    const modal = document.getElementById('signalModal');
    if (modal) {
        modal.style.display = 'flex';

        // Добавяне на клас за анимация
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        // Предотвратяване на scroll на body
        document.body.style.overflow = 'hidden';
    }
}

function closeSignalModal() {
    const modal = document.getElementById('signalModal');
    if (modal) {
        modal.classList.remove('show');

        setTimeout(() => {
            modal.style.display = 'none';
            // Възстановяване на scroll на body
            document.body.style.overflow = '';
        }, 300);
    }

    currentModalSignal = null;
    window.currentModalSignalCoordinates = null;
}

// ===== MAP INTERACTION =====
function centerMapOnSignal() {
    if (window.currentModalSignalCoordinates && window.mapCore) {
        const map = window.mapCore.getMap();
        if (map) {
            map.setView(window.currentModalSignalCoordinates, 16);

            // Затваряне на модала след кратко забавяне
            setTimeout(() => {
                closeSignalModal();
            }, 500);

            // Показване на notification
            window.mapCore.showNotification('Картата е центрирана върху сигнала', 'info');
        }
    }
}

// ===== IMAGE FULLSCREEN =====
function openImageFullscreen(imageUrl) {
    // Създаване на fullscreen overlay
    const overlay = document.createElement('div');
    overlay.className = 'image-fullscreen-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 20000;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    `;

    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = `
        max-width: 95%;
        max-height: 95%;
        object-fit: contain;
        box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="bi bi-x-lg"></i>';
    closeBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 24px;
        padding: 10px;
        border-radius: 50%;
        cursor: pointer;
        transition: background 0.3s;
    `;

    closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
    closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';

    // Event listeners за затваряне
    const closeFullscreen = () => {
        document.body.removeChild(overlay);
        document.body.style.overflow = '';
    };

    overlay.onclick = closeFullscreen;
    closeBtn.onclick = closeFullscreen;
    img.onclick = (e) => e.stopPropagation(); // Предотвратяване на затваряне при клик върху снимката

    // ESC key за затваряне
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeFullscreen();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);

    overlay.appendChild(img);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
}

// ===== AUTHOR PROFILE =====
function viewAuthorProfile(authorId) {
    // TODO: Интеграция с профил система
    console.log('View author profile:', authorId);

    // Временно показване на notification
    if (window.mapCore) {
        window.mapCore.showNotification('Профилите ще бъдат достъпни скоро', 'info');
    }
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', function() {
    // Escape key за затваряне на модала
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeSignalModal();
        }
    });
});

// ===== GLOBAL FUNCTIONS =====
window.openSignalModal = openSignalModal;
window.closeSignalModal = closeSignalModal;
window.centerMapOnSignal = centerMapOnSignal;
window.viewAuthorProfile = viewAuthorProfile;

// Export за modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        openSignalModal,
        closeSignalModal,
        populateModalContent,
        centerMapOnSignal,
        formatDate,
        formatFullDate
    };
}