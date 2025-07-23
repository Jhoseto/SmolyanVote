// ===== MODERN SIGNAL MODAL =====


let currentModalSignal = null;
let isThreeDotsMenuOpen = false;

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

        // 1. ПОКАЖИ МОДАЛА ВЕДНАГА с наличните данни
        updateModalContent(signal);
        modal.style.display = 'flex';
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });

        document.body.style.overflow = 'hidden';
        closeThreeDotsMenu();

        // 2. АСИНХРОННО обнови views в background
        window.SignalAPI.incrementViews(signal.id)
            .then(freshSignal => {
                if (freshSignal && currentModalSignal?.id === signal.id) {
                    // Обнови само views count-а в модала
                    updateModalViews(freshSignal);
                    // Обнови кеша
                    updateSignalInCache(freshSignal);
                }
            })
            .catch(error => {
                console.warn('⚠️ Could not increment views:', error);
                // Modal остава отворен дори при грешка
            });

    } catch (error) {
        console.error('❌ Error opening modal:', error);
    }
}

// ===== FUNCTION FOR CACHE UPDATE =====

function updateSignalInCache(updatedSignal) {
    // Обнови сигнала в currentSignals масива
    if (window.signalManagement && window.signalManagement.getCurrentSignals) {
        const currentSignals = window.signalManagement.getCurrentSignals();
        const signalIndex = currentSignals.findIndex(s => s.id === updatedSignal.id);

        if (signalIndex !== -1) {
            // Merge новите данни със старите (запази всички полета)
            currentSignals[signalIndex] = { ...currentSignals[signalIndex], ...updatedSignal };
            console.log('📝 Signal cache updated for ID:', updatedSignal.id);
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
    console.log('Updating modal content:', signal);

    // Get category and urgency info
    const category = SIGNAL_CATEGORIES[signal.category] || {
        name: signal.category,
        icon: 'bi-circle',
        color: '#6b7280'
    };

    const urgency = URGENCY_LEVELS[signal.urgency] || {
        name: signal.urgency,
        color: '#6b7280'
    };

    // Update title
    const titleEl = document.getElementById('modalSignalTitle');
    if (titleEl) titleEl.textContent = signal.title || 'Без заглавие';

    // Update category badge
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

    // Update urgency badge
    const urgencyName = document.getElementById('modalUrgencyName');
    const urgencyBadge = document.getElementById('modalUrgencyBadge');

    if (urgencyName) urgencyName.textContent = urgency.name;
    if (urgencyBadge) {
        urgencyBadge.className = `urgency-badge urgency-${signal.urgency}`;
    }

    // Update author info with avatar
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

    // Update relative time
    const relativeTime = document.getElementById('modalRelativeTime');
    if (relativeTime && signal.createdAt) {
        relativeTime.textContent = getRelativeTime(signal.createdAt);
    }

    // Update detailed time
    const detailedTime = document.getElementById('modalDetailedTime');
    if (detailedTime && signal.createdAt) {
        const date = new Date(signal.createdAt);
        detailedTime.textContent = `Създаден на ${date.toLocaleDateString('bg-BG')} в ${date.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Update description
    const description = document.getElementById('modalSignalDescription');
    if (description) {
        description.textContent = signal.description || 'Няма описание';
    }

    // Update image
    updateModalImage(signal);

    // Update reactions
    updateModalReactions(signal);

    // ➕ НОВА СЕКЦИЯ: Update comments count
    const commentsCount = document.getElementById('commentsCount');
    if (commentsCount && signal.commentsCount !== undefined) {
        commentsCount.textContent = `(${signal.commentsCount})`;
    }

    // Update permissions for three dots menu
    updateThreeDotsMenuPermissions(signal);

    // ➕ НОВА СЕКЦИЯ: Initialize comments
    setTimeout(async () => {
        if (window.CommentsManager) {
            // Cleanup existing instance
            if (window.signalCommentsManager) {
                window.signalCommentsManager = null;
            }

            window.signalCommentsManager = new window.CommentsManager('signal', signal.id);

            // ➕ ВАЖНО: Зареди коментарите като в publikation
            await window.signalCommentsManager.loadComments(signal.id);

            if (window.isAuthenticated && window.currentUser) {
                const userAvatar = document.getElementById('currentUserAvatar');
                if (userAvatar) {
                    userAvatar.src = window.currentUser.imageUrl || '/images/default-avatar.png';
                }
            }

            console.log('✅ Comments initialized for signal:', signal.id);
        } else {
            console.error('❌ CommentsManager not found!');
        }
    }, 100);

    console.log('Modal content updated successfully');
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
    // Обнови само views count-а без да пресъздаваме целия modal
    const viewsCount = document.getElementById('viewsCount');
    if (viewsCount && signal.viewsCount !== undefined) {
        viewsCount.textContent = signal.viewsCount;

        // Малка анимация за показване на промяната
        viewsCount.style.transform = 'scale(1.1)';
        viewsCount.style.color = '#4cb15c';

        setTimeout(() => {
            viewsCount.style.transform = 'scale(1)';
            viewsCount.style.color = '';
        }, 300);

        console.log(`👁️ Views updated to: ${signal.viewsCount}`);
    }
}

// ===== ОБНОВЕНА updateModalReactions БЕЗ локално увеличаване =====

function updateModalReactions(signal) {
    // Update likes count
    const likesCount = document.getElementById('likesCount');
    if (likesCount) {
        likesCount.textContent = signal.likesCount || 0;
    }

    // Update views count - БЕЗ локално увеличаване, използваме данните от сървъра
    const viewsCount = document.getElementById('viewsCount');
    if (viewsCount) {
        viewsCount.textContent = signal.viewsCount || 0;
    }

    // Update like button state (if user is authenticated)
    const likeBtn = document.getElementById('likeBtn');
    if (likeBtn && window.isAuthenticated) {
        // TODO: Check if user has liked this signal
        // For now, just ensure it's clickable
        likeBtn.disabled = false;
    } else if (likeBtn) {
        likeBtn.disabled = true;
        likeBtn.style.opacity = '0.6';
    }
}

// ===== PERMISSIONS & THREE DOTS MENU =====

function updateThreeDotsMenuPermissions(signal) {
    const editBtn = document.getElementById('editSignalBtn');
    const deleteBtn = document.getElementById('deleteSignalBtn');

    // Show/hide buttons based on permissions
    const canEdit = canUserEditSignal(signal);

    if (editBtn) editBtn.style.display = canEdit ? 'flex' : 'none';
    if (deleteBtn) deleteBtn.style.display = canEdit ? 'flex' : 'none';
}

function canUserEditSignal(signal) {
    // Check if user is authenticated
    if (!window.isAuthenticated || !window.currentUser) {
        return false;
    }

    // Check if user is admin or author
    const isAdmin = window.currentUser.role === 'ADMIN';
    const isAuthor = signal.author?.id === window.currentUser.id;

    return isAdmin || isAuthor;
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
        console.log('Opening lightbox with image:', modalImage.src);
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

function editSignal() {
    if (currentModalSignal) {
        closeThreeDotsMenu();
        // TODO: Implement edit functionality
        alert('Функцията за редактиране ще бъде добавена скоро');
    }
}

// ===== DELETE SIGNAL FUNCTION =====
async function deleteSignal() {
    if (!currentModalSignal) {
        console.error('No current signal to delete');
        return;
    }

    closeThreeDotsMenu();

    // Проверка за SweetAlert2
    if (typeof Swal === 'undefined') {
        // Fallback за случаи когато SweetAlert2 не е достъпен
        const confirmed = confirm('Сигурни ли сте, че искате да изтриете този сигнал?');
        if (!confirmed) return;
    } else {
        // Използвай SweetAlert за по-хубав modal
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

    // ВАЖНО: Запази ID-то преди да затвориш модала
    const signalIdToDelete = currentModalSignal.id;

    try {
        // Показвай loading състояние
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

        // Използвай готовия SignalAPI метод
        const result = await window.SignalAPI.deleteSignal(signalIdToDelete);

        if (result.success) {
            // Успешно изтриване - затвори модала първо
            closeSignalModal();

            // Покажи success нотификация
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
                // Fallback нотификация
                if (window.showToast) {
                    window.showToast('Сигналът е изтрит успешно', 'success');
                } else {
                    alert('Сигналът е изтрит успешно');
                }
            }

            // Обнови картата/списъка със сигнали
            if (window.signalManagement && window.signalManagement.loadSignalsData) {
                await window.signalManagement.loadSignalsData();
            }

            // Ако има карта и методът съществува, премахни маркера
            if (window.mapCore && typeof window.mapCore.removeSignalMarker === 'function') {
                window.mapCore.removeSignalMarker(signalIdToDelete);
            }

        } else {
            // Грешка от сървъра
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
            alert('Моля, влезте в профила си за да харесвате сигнали');
        }
        return;
    }

    try {
        // TODO: Implement API call to toggle like
        console.log('Toggle like for signal:', currentModalSignal.id);

        // For now, just update UI optimistically
        const likesCountEl = document.getElementById('likesCount');
        const likeBtn = document.getElementById('likeBtn');

        if (likesCountEl && likeBtn) {
            const currentCount = parseInt(likesCountEl.textContent) || 0;
            const isLiked = likeBtn.classList.contains('active');

            if (isLiked) {
                likesCountEl.textContent = Math.max(0, currentCount - 1);
                likeBtn.classList.remove('active');
            } else {
                likesCountEl.textContent = currentCount + 1;
                likeBtn.classList.add('active');
            }
        }

    } catch (error) {
        console.error('Error toggling like:', error);
        alert('Възникна грешка при харесването');
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

    // Close on overlay click
    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', closeSignalModal);
    }

    // Close on ESC key
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

    // Close lightbox on click outside image
    const lightbox = document.getElementById('imageLightbox');
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeImageLightbox();
            }
        });
    }

    // Close three dots menu on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-menu-container') && isThreeDotsMenuOpen) {
            closeThreeDotsMenu();
        }
    });

}

// ===== COMMENTS INITIALIZATION =====
function initializeCommentsForSignal(signalId) {
    if (!signalId || !window.CommentsManager) {
        console.warn('Cannot initialize comments: missing signalId or CommentsManager');
        return;
    }
    // Създаваме CommentsManager instance за signal
    if (window.signalCommentsManager) {
        window.signalCommentsManager = null; // cleanup
    }
    window.signalCommentsManager = new window.CommentsManager('signal', signalId);

    // Setup user avatar if authenticated
    if (window.isAuthenticated && window.currentUser) {
        const userAvatar = document.getElementById('currentUserAvatar');
        if (userAvatar) {
            userAvatar.src = window.currentUser.imageUrl || '/images/default-avatar.png';
        }
    }
}

// ===== UPDATE COMMENTS COUNT =====
function updateCommentsCount(signal) {
    const commentsCount = document.getElementById('commentsCount');
    if (commentsCount && signal.commentsCount !== undefined) {
        commentsCount.textContent = `(${signal.commentsCount})`;
    }
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