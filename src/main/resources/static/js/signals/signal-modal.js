// ===== MODERN SIGNAL MODAL =====


let currentModalSignal = null;
let isThreeDotsMenuOpen = false;

// ===== MAIN MODAL FUNCTIONS =====

async function openSignalModal(signal) {
    if (!signal) return;

    try {
        document.body.style.cursor = 'wait';

        const freshSignal = await window.SignalAPI.incrementViews(signal.id);
        const signalToShow = freshSignal || signal;

        currentModalSignal = signalToShow;
        const modal = document.getElementById('signalModal');
        if (!modal) {
            console.error('Modal not found!');
            return;
        }

        updateModalContent(signalToShow);

        modal.style.display = 'flex';
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });

        document.body.style.overflow = 'hidden';
        closeThreeDotsMenu();

        if (freshSignal) {
            updateSignalInCache(freshSignal);
        }

    } catch (error) {
        console.warn('⚠️ Could not get fresh data, using cached:', error);

        currentModalSignal = signal;
        const modal = document.getElementById('signalModal');
        if (modal) {
            updateModalContent(signal);
            modal.style.display = 'flex';
            requestAnimationFrame(() => {
                modal.classList.add('active');
            });
            document.body.style.overflow = 'hidden';
            closeThreeDotsMenu();
        }
    } finally {

        document.body.style.cursor = '';
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

    // Update permissions for three dots menu
    updateThreeDotsMenuPermissions(signal);

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
    if (!currentModalSignal?.imageUrl) return;

    console.log('Opening lightbox for image:', currentModalSignal.imageUrl);

    const lightbox = document.getElementById('imageLightbox');
    const lightboxImage = document.getElementById('lightboxImage');

    if (!lightbox) {
        console.error('Lightbox element not found!');
        return;
    }

    if (!lightboxImage) {
        console.error('Lightbox image element not found!');
        return;
    }

    // Set image source
    lightboxImage.src = currentModalSignal.imageUrl;

    // Show lightbox immediately with flex display
    lightbox.style.display = 'flex';
    lightbox.style.opacity = '0';

    console.log('Lightbox display set to flex');

    // Force reflow and add active class
    requestAnimationFrame(() => {
        lightbox.classList.add('active');
        lightbox.style.opacity = '1';
        console.log('Lightbox active class added');
    });

    // Prevent body scrolling
    document.body.style.overflow = 'hidden';

    console.log('Lightbox should now be visible');
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
            window.mapCore.showNotification('Картата е центрирана на сигнала с максимално увеличение', 'success');
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

function deleteSignal() {
    if (currentModalSignal) {
        closeThreeDotsMenu();
        const confirmed = confirm('Сигурни ли сте, че искате да изтриете този сигнал?');
        if (confirmed) {
            // TODO: Implement delete functionality
            alert('Функцията за изтриване ще бъде добавена скоро');
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

    console.log('Signal modal initialized');
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

console.log('✅ Modern Signal Modal loaded successfully');