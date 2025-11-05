// ===== MODERN SIGNAL MODAL =====


let currentModalSignal = null;
let isThreeDotsMenuOpen = false;
let likedSignals = new Set();

document.addEventListener('DOMContentLoaded', async () => {
    if (window.isAuthenticated) {
        try {
            const likedSignalIds = await window.SignalAPI.getLikedSignals();
            likedSignalIds.forEach(id => likedSignals.add(id));
        } catch (error) {
            console.warn('Could not load liked signals:', error);
        }
    }
});

// ===== MAIN MODAL FUNCTIONS =====
async function openSignalModal(signal) {
    if (!signal) return;

    try {
        currentModalSignal = signal;
        const modal = document.getElementById('signalModal');
        if (!modal) {
            console.error('Modal not found!');
            return;
        }

        if (signal.isLikedByCurrentUser === true) {
            likedSignals.add(signal.id);
        } else if (signal.isLikedByCurrentUser === false) {
            likedSignals.delete(signal.id);
        }

        updateModalContent(signal);
        modal.style.display = 'flex';
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });

        document.body.style.overflow = 'hidden';
        closeThreeDotsMenu();

        window.SignalAPI.incrementViews(signal.id)
            .then(freshSignal => {
                if (freshSignal && currentModalSignal?.id === signal.id) {
                    updateModalViews(freshSignal);
                    updateSignalInCache(freshSignal);
                }
            })
            .catch(error => {
                console.warn('⚠️ Could not increment views:', error);
            });

    } catch (error) {
        console.error('❌ Error opening modal:', error);
    }
}

window.openSignalModal = async function(signal) {
    if (!signal) return;

    try {
        currentModalSignal = signal;
        const modal = document.getElementById('signalModal');
        if (!modal) {
            console.error('Signal modal not found');
            return;
        }

        updateModalContent(signal);

        modal.style.display = 'flex';
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });

        document.body.style.overflow = 'hidden';
        closeThreeDotsMenu();

        window.SignalAPI.incrementViews(signal.id)
            .then(freshSignal => {
                if (freshSignal && currentModalSignal?.id === signal.id) {
                    updateModalViews(freshSignal);
                    updateSignalInCache(freshSignal);
                }
            })
            .catch(error => {
                console.error('Could not increment views:', error);
            });

    } catch (error) {
        console.error('Error opening signal modal:', error);
    }
};


// ===== FUNCTION FOR CACHE UPDATE =====
function updateSignalInCache(updatedSignal) {
    if (window.signalManagement && window.signalManagement.getCurrentSignals) {
        const currentSignals = window.signalManagement.getCurrentSignals();
        const signalIndex = currentSignals.findIndex(s => s.id === updatedSignal.id);

        if (signalIndex !== -1) {
            currentSignals[signalIndex] = { ...currentSignals[signalIndex], ...updatedSignal };
        }
    }
}


function closeSignalModal() {
    const modal = document.getElementById('signalModal');
    if (!modal) return;

    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }, 300);

    currentModalSignal = null;
    closeThreeDotsMenu();

    if (window.signalCommentsManager) {
        window.signalCommentsManager = null;
    }
}

// ===== MODAL CONTENT UPDATE =====
function updateModalContent(signal) {
    if (!signal) {
        return;
    }
    
    const category = SIGNAL_CATEGORIES[signal.category] || {
        name: signal.category || 'Неизвестна',
        icon: 'bi-circle',
        color: '#6b7280'
    };

    // Период на активност
    const expirationColors = {
        1: { name: '1 ден', color: '#dc3545', icon: 'bi-clock' },
        3: { name: '3 дни', color: '#ffc107', icon: 'bi-clock-history' },
        7: { name: '7 дни', color: '#198754', icon: 'bi-calendar-check' }
    };
    const expirationDays = signal.expirationDays || 7;
    const expirationInfo = expirationColors[expirationDays] || {
        name: `${expirationDays} дни`,
        color: '#6c757d',
        icon: 'bi-clock'
    };

    const titleEl = document.getElementById('modalSignalTitle');
    if (titleEl) titleEl.textContent = signal.title || 'Без заглавие';

    const categoryIcon = document.getElementById('modalCategoryIcon');
    const categoryName = document.getElementById('modalCategoryName');
    const categoryBadge = document.getElementById('modalCategoryBadge');

    if (categoryIcon) categoryIcon.className = category.icon;
    if (categoryName) categoryName.textContent = category.name;
    if (categoryBadge) {
        categoryBadge.style.background = `${category.color}15`;
        categoryBadge.style.color = category.color;
        categoryBadge.style.borderColor = `${category.color}30`;
    }

    const expirationName = document.getElementById('modalExpirationName');
    const expirationIcon = document.getElementById('modalExpirationIcon');
    const expirationBadge = document.getElementById('modalExpirationBadge');

    if (expirationName) {
        if (signal.activeUntil) {
            const now = new Date();
            const activeUntilDate = new Date(signal.activeUntil);
            if (!isNaN(activeUntilDate.getTime())) {
                const daysLeft = Math.ceil((activeUntilDate - now) / (1000 * 60 * 60 * 24));
                if (daysLeft > 0) {
                    expirationName.textContent = `Активен ${daysLeft} ${daysLeft === 1 ? 'ден' : 'дни'}`;
                } else {
                    expirationName.textContent = 'Изтекъл';
                }
            } else {
                expirationName.textContent = expirationInfo.name;
            }
        } else {
            expirationName.textContent = expirationInfo.name;
        }
    }
    if (expirationIcon) {
        expirationIcon.className = expirationInfo.icon;
        expirationIcon.style.color = expirationInfo.color;
    }
    if (expirationBadge) {
        expirationBadge.style.background = `${expirationInfo.color}15`;
        expirationBadge.style.color = expirationInfo.color;
        expirationBadge.style.borderColor = `${expirationInfo.color}30`;
    }

    const authorAvatar = document.getElementById('modalAuthorAvatar');
    const authorName = document.getElementById('modalAuthorName');

    if (authorAvatar && window.avatarUtils) {
        authorAvatar.outerHTML = window.avatarUtils.createAvatar(
            signal.author?.imageUrl,
            signal.author?.username || 'Анонимен',
            28,
            'author-avatar'
        );
    }
    if (authorName) {
        authorName.textContent = signal.author?.username || 'Анонимен';
    }

    const relativeTime = document.getElementById('modalRelativeTime');
    if (relativeTime && signal.createdAt) {
        relativeTime.textContent = getRelativeTime(signal.createdAt);
    }

    const detailedTime = document.getElementById('modalDetailedTime');
    if (detailedTime && signal.createdAt) {
        const date = new Date(signal.createdAt);
        detailedTime.textContent = `Създаден на ${date.toLocaleDateString('bg-BG')} в ${date.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}`;
    }

    const description = document.getElementById('modalSignalDescription');
    if (description) {
        description.textContent = signal.description || 'Няма описание';
    }

    updateModalImage(signal);
    updateModalReactions(signal);

    const commentsCount = document.getElementById('commentsCount');
    if (commentsCount && signal.commentsCount !== undefined) {
        commentsCount.textContent = `(${signal.commentsCount})`;
    }

    updateThreeDotsMenuPermissions(signal);
    setTimeout(async () => {
        if (window.CommentsManager) {
            if (window.signalCommentsManager) {
                window.signalCommentsManager = null;
            }

            window.signalCommentsManager = new window.CommentsManager('signal', signal.id);
            await window.signalCommentsManager.loadComments(signal.id);

            if (window.isAuthenticated && window.currentUser) {
                const userAvatar = document.getElementById('currentUserAvatar');
                if (userAvatar) {
                    userAvatar.src = window.currentUser.imageUrl || '/images/default-avatar.png';
                }
            }
        } else {
            console.error('❌ CommentsManager not found!');
        }
    }, 100);
}

function updateModalImage(signal) {
    const imageSection = document.getElementById('modalImageSection');
    const modalImage = document.getElementById('modalSignalImage');

    if (signal.imageUrl && signal.imageUrl.trim() !== '') {
        if (imageSection) imageSection.style.display = 'block';
        if (modalImage) modalImage.src = signal.imageUrl;
    } else {
        if (imageSection) imageSection.style.display = 'none';
    }
}

// ===== UPDATE MODAL VIEWS =====
function updateModalViews(signal) {
    const viewsCount = document.getElementById('viewsCount');
    if (viewsCount && signal.viewsCount !== undefined) {
        viewsCount.textContent = signal.viewsCount;
        viewsCount.style.transform = 'scale(1.1)';
        viewsCount.style.color = '#4cb15c';

        setTimeout(() => {
            viewsCount.style.transform = 'scale(1)';
            viewsCount.style.color = '';
        }, 300);
    }
}

// ===== ОБНОВЕНА updateModalReactions =====
function updateModalReactions(signal) {
    const likesCount = document.getElementById('likesCount');
    if (likesCount) {
        likesCount.textContent = signal.likesCount || 0;
    }

    const viewsCount = document.getElementById('viewsCount');
    if (viewsCount) {
        viewsCount.textContent = signal.viewsCount || 0;
    }

    const likeBtn = document.getElementById('likeBtn');
    if (likeBtn) {
        if (window.isAuthenticated) {
            likeBtn.disabled = false;
            likeBtn.style.opacity = '1';

            const isLiked = likedSignals.has(signal.id);

            if (isLiked) {
                likeBtn.classList.add('liked');
                const icon = likeBtn.querySelector('i');
                if (icon) icon.className = 'bi bi-heart-fill';
            } else {
                likeBtn.classList.remove('liked');
                const icon = likeBtn.querySelector('i');
                if (icon) icon.className = 'bi bi-heart';
            }
        } else {
            likeBtn.disabled = true;
            likeBtn.style.opacity = '0.6';
        }
    }
}


// ===== PERMISSIONS & THREE DOTS MENU =====

function updateThreeDotsMenuPermissions(signal) {
    const threeDotsContainer = document.querySelector('.dropdown-menu-container');

    if (!threeDotsContainer || !window.isAuthenticated) {
        if (threeDotsContainer) threeDotsContainer.style.display = 'none';
        return;
    }

    threeDotsContainer.style.display = 'block';

    const isOwner = window.currentUser && window.currentUser.id === signal.author?.id;
    const isAdmin = window.appData && window.appData.isAdmin;
    const canManage = isOwner || isAdmin;

    const editBtn = document.getElementById('editSignalBtn');
    const deleteBtn = document.getElementById('deleteSignalBtn');

    if (canManage) {
        if (editBtn) editBtn.style.display = 'flex';
        if (deleteBtn) deleteBtn.style.display = 'flex';
    } else {
        threeDotsContainer.style.display = 'none';
    }
}

function toggleThreeDotsMenu() {
    const menu = document.getElementById('threeDotsMenu');
    if (!menu) return;

    if (isThreeDotsMenuOpen) {
        closeThreeDotsMenu();
    } else {
        openThreeDotsMenu();
    }
}

function openThreeDotsMenu() {
    const menu = document.getElementById('threeDotsMenu');
    if (menu) {
        menu.classList.add('active');
        isThreeDotsMenuOpen = true;
    }
}

function closeThreeDotsMenu() {
    const menu = document.getElementById('threeDotsMenu');
    if (menu) {
        menu.classList.remove('active');
        isThreeDotsMenuOpen = false;
    }
}

// ===== IMAGE LIGHTBOX =====

function openImageLightbox() {
    const modalImage = document.getElementById('modalSignalImage');
    const lightbox = document.getElementById('imageLightbox');
    const lightboxImage = document.getElementById('lightboxImage');

    if (modalImage && lightbox && lightboxImage && modalImage.src) {
        lightboxImage.src = modalImage.src;
        lightbox.style.display = 'flex';
        lightbox.style.opacity = '1';
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeImageLightbox() {
    const lightbox = document.getElementById('imageLightbox');
    if (lightbox) {
        console.log('Closing lightbox');
        lightbox.classList.remove('active');
        lightbox.style.opacity = '0';
        setTimeout(() => {
            lightbox.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }
}

// ===== ACTIONS =====
function centerMapOnSignal() {
    if (currentModalSignal?.coordinates && window.mapCore) {
        const map = window.mapCore.getMap();
        if (map) {
            map.setView(currentModalSignal.coordinates, 19);
            closeSignalModal();
            window.mapCore.showNotification('Фокус върху сигнала...', 'success');
        }
    }
}

// ===== EDIT SIGNAL FUNCTION =====
function editSignal() {
    if (!currentModalSignal) return;
    closeThreeDotsMenu();
    startInlineEdit();
}

// ===== INLINE EDIT FUNCTIONALITY =====
function startInlineEdit() {
    if (!currentModalSignal || isInEditMode()) return;

    const titleEl = document.getElementById('modalSignalTitle');
    const descriptionEl = document.getElementById('modalSignalDescription');

    if (!titleEl || !descriptionEl) return;

    const originalTitle = currentModalSignal.title || '';
    const originalDescription = currentModalSignal.description || '';

    titleEl.innerHTML = `<input type="text" class="inline-edit-title" 
                         value="${escapeHtml(originalTitle)}" 
                         placeholder="Въведете заглавие..." 
                         maxlength="200">`;

    descriptionEl.innerHTML = `<textarea class="inline-edit-description" 
                               placeholder="Въведете описание..." 
                               maxlength="2000" 
                               rows="4">${escapeHtml(originalDescription)}</textarea>`;
    addEditButtons();

    setTimeout(() => {
        const titleInput = titleEl.querySelector('.inline-edit-title');
        titleInput.focus();
        titleInput.setSelectionRange(titleInput.value.length, titleInput.value.length);
    }, 100);

    titleEl.classList.add('editing');
    descriptionEl.classList.add('editing');
}

function addEditButtons() {
    if (document.querySelector('.edit-actions')) return;

    const editActions = document.createElement('div');
    editActions.className = 'edit-actions';
    editActions.innerHTML = `
        <button class="edit-save-btn">
            <i class="bi bi-check"></i> Запази
        </button>
        <button class="edit-cancel-btn">
            <i class="bi bi-x"></i> Отказ
        </button>
    `;

    const descriptionEl = document.getElementById('modalSignalDescription');
    descriptionEl.parentNode.insertBefore(editActions, descriptionEl.nextSibling);

    editActions.querySelector('.edit-save-btn').addEventListener('click', saveInlineEdit);
    editActions.querySelector('.edit-cancel-btn').addEventListener('click', cancelInlineEdit);
}

function cancelInlineEdit() {
    const titleEl = document.getElementById('modalSignalTitle');
    const descriptionEl = document.getElementById('modalSignalDescription');
    const editActions = document.querySelector('.edit-actions');

    if (titleEl) {
        titleEl.textContent = currentModalSignal.title || 'Без заглавие';
        titleEl.classList.remove('editing');
    }

    if (descriptionEl) {
        descriptionEl.textContent = currentModalSignal.description || 'Няма описание';
        descriptionEl.classList.remove('editing');
    }

    if (editActions) editActions.remove();
}

async function saveInlineEdit() {
    const titleInput = document.querySelector('.inline-edit-title');
    const descriptionTextarea = document.querySelector('.inline-edit-description');
    const saveBtn = document.querySelector('.edit-save-btn');

    if (!titleInput || !descriptionTextarea || !currentModalSignal) return;

    const newTitle = titleInput.value.trim();
    const newDescription = descriptionTextarea.value.trim();

    if (!newTitle || newTitle.length < 5) {
        alert('Заглавието трябва да е поне 5 символа');
        titleInput.focus();
        return;
    }

    if (!newDescription || newDescription.length < 10) {
        alert('Описанието трябва да е поне 10 символа');
        descriptionTextarea.focus();
        return;
    }

    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Запазване...';

    try {
        // При update не изпращаме latitude/longitude - те остават същите
        // Конвертираме expirationDays в число - задължително трябва да е 1, 3 или 7
        let expirationDays = currentModalSignal.expirationDays;
        if (typeof expirationDays !== 'number') {
            expirationDays = expirationDays ? parseInt(expirationDays, 10) : null;
        }
        
        // Ако expirationDays е null или невалидно, използваме 7 дни по подразбиране
        if (!expirationDays || isNaN(expirationDays) || (expirationDays !== 1 && expirationDays !== 3 && expirationDays !== 7)) {
            expirationDays = 7; // Default стойност
        }
        
        const updateData = {
            title: newTitle,
            description: newDescription,
            category: currentModalSignal.category,
            expirationDays: expirationDays
        };

        const result = await window.SignalAPI.updateSignal(currentModalSignal.id, updateData);

        if (result.success) {
            currentModalSignal.title = newTitle;
            currentModalSignal.description = newDescription;

            const titleEl = document.getElementById('modalSignalTitle');
            const descriptionEl = document.getElementById('modalSignalDescription');

            titleEl.textContent = newTitle;
            titleEl.classList.remove('editing');

            descriptionEl.textContent = newDescription;
            descriptionEl.classList.remove('editing');

            const editActions = document.querySelector('.edit-actions');
            if (editActions) editActions.remove();
            updateSignalInCache(currentModalSignal);

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'Успех!',
                    text: 'Сигналът е обновен успешно',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });
            } else {
                if (window.showToast) {
                    window.showToast('Сигналът е обновен успешно', 'success');
                } else {
                    alert('Сигналът е обновен успешно');
                }
            }

            if (window.signalManagement && window.signalManagement.loadSignalsData) {
                await window.signalManagement.loadSignalsData();
            }

        } else {
            throw new Error(result.message || 'Грешка при обновяване');
        }

    } catch (error) {
        console.error('Error updating signal:', error);

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Грешка!',
                text: error.message || 'Възникна грешка при обновяване на сигнала',
                icon: 'error',
                confirmButtonColor: '#e74c3c'
            });
        } else {
            alert(error.message || 'Възникна грешка при обновяване на сигнала');
        }
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
    }
}

// Helper функции
function isInEditMode() {
    return document.querySelector('.inline-edit-title') !== null;
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ===== DELETE SIGNAL FUNCTION =====
async function deleteSignal() {
    if (!currentModalSignal) {
        console.error('No current signal to delete');
        return;
    }

    closeThreeDotsMenu();

    if (typeof Swal === 'undefined') {
        const confirmed = confirm('Сигурни ли сте, че искате да изтриете този сигнал?');
        if (!confirmed) return;
    } else {
        const result = await Swal.fire({
            title: 'Изтриване на сигнал',
            text: 'Сигурни ли сте, че искате да изтриете този сигнал? Всички коментари ще бъдат изтрити завинаги!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="bi bi-trash"></i> Да, изтрий',
            cancelButtonText: '<i class="bi bi-x"></i> Отказ',
            buttonsStyling: true,
            customClass: {
                popup: 'animated fadeInDown',
                confirmButton: 'btn btn-danger',
                cancelButton: 'btn btn-secondary'
            },
            reverseButtons: true,
            allowOutsideClick: false,
            allowEscapeKey: true
        });

        if (!result.isConfirmed) return;
    }

    const signalIdToDelete = currentModalSignal.id;

    try {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Изтриване...',
                html: 'Моля изчакайте, докато сигналът се изтрие.',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        }
        const result = await window.SignalAPI.deleteSignal(signalIdToDelete);

        if (result.success) {
            closeSignalModal();

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'Успех!',
                    text: 'Сигналът е изтрит успешно',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });
            } else {
                if (window.showToast) {
                    window.showToast('Сигналът е изтрит успешно', 'success');
                } else {
                    alert('Сигналът е изтрит успешно');
                }
            }

            if (window.signalManagement && window.signalManagement.loadSignalsData) {
                await window.signalManagement.loadSignalsData();
            }

            if (window.mapCore && typeof window.mapCore.removeSignalMarker === 'function') {
                window.mapCore.removeSignalMarker(signalIdToDelete);
            }

        } else {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'Грешка!',
                    text: result.message || 'Възникна грешка при изтриване на сигнала',
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            } else {
                alert(result.message || 'Възникна грешка при изтриване на сигнала');
            }
        }

    } catch (error) {
        console.error('Error deleting signal:', error);

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Грешка!',
                text: 'Възникна грешка при изтриване на сигнала',
                icon: 'error',
                confirmButtonColor: '#e74c3c'
            });
        } else {
            alert('Възникна грешка при изтриване на сигнала');
        }
    }
}

async function toggleLike() {
    if (!currentModalSignal || !window.isAuthenticated) {
        if (!window.isAuthenticated) {
            window.mapCore?.showNotification('🔒 Моля, влезте в профила си за да харесвате сигнали', 'warning', 4000);
        }
        return;
    }
    try {
        const response = await window.SignalAPI.toggleLike(currentModalSignal.id);

        if (response.success) {
            if (response.liked) {
                likedSignals.add(currentModalSignal.id);
            } else {
                likedSignals.delete(currentModalSignal.id);
            }

            currentModalSignal.likesCount = (currentModalSignal.likesCount || 0) + (response.liked ? 1 : -1);

            updateModalReactions(currentModalSignal);

            const message = response.liked ? '❤️ Сигналът е харесан' : '💔 Харесването е премахнато';
            window.mapCore?.showNotification(message, 'success', 2000);
        }
    } catch (error) {
        console.error('❌ Error toggling like:', error);
        window.mapCore?.showNotification('❌ Възникна грешка при харесването', 'error', 4000);
    }
}

// ===== UTILITY FUNCTIONS =====
function getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
        return 'току що';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `преди ${minutes} мин`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `преди ${hours} час${hours > 1 ? 'а' : ''}`;
    } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `преди ${days} д${days > 1 ? 'ни' : 'ен'}`;
    } else {
        return date.toLocaleDateString('bg-BG');
    }
}

// ===== EVENT LISTENERS =====
function initializeSignalModal() {
    const modal = document.getElementById('signalModal');
    if (!modal) return;

    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', closeSignalModal);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const lightbox = document.getElementById('imageLightbox');
            if (lightbox && lightbox.classList.contains('active')) {
                closeImageLightbox();
            } else if (modal.classList.contains('active')) {
                closeSignalModal();
            }
        }
    });

    const lightbox = document.getElementById('imageLightbox');
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeImageLightbox();
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-menu-container') && isThreeDotsMenuOpen) {
            closeThreeDotsMenu();
        }
    });

}

// ===== GLOBAL FUNCTIONS =====
window.openSignalModal = openSignalModal;
window.closeSignalModal = closeSignalModal;
window.centerMapOnSignal = centerMapOnSignal;
window.editSignal = editSignal;
window.deleteSignal = deleteSignal;
window.toggleLike = toggleLike;
window.toggleThreeDotsMenu = toggleThreeDotsMenu;
window.openImageLightbox = openImageLightbox;
window.closeImageLightbox = closeImageLightbox;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeSignalModal();
});

// ===== EXPORT FUNCTIONS =====
window.signalModalUtils = {
    getRelativeTime: getRelativeTime
};