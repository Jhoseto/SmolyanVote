// ===== MODERN SIGNAL MODAL =====


let currentModalSignal = null;
let isThreeDotsMenuOpen = false;
let likedSignals = new Set();

// Load liked signals когато се зареди страницата
document.addEventListener('DOMContentLoaded', async () => {
    if (window.isAuthenticated) {
        try {
            const likedSignalIds = await window.SignalAPI.getLikedSignals();
            likedSignalIds.forEach(id => likedSignals.add(id));
            console.log('✅ Loaded liked signals:', likedSignals);
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

        // Ако имаме isLikedByCurrentUser от backend-а, добави в Set-а
        if (signal.isLikedByCurrentUser === true) {
            likedSignals.add(signal.id);
        } else if (signal.isLikedByCurrentUser === false) {
            likedSignals.delete(signal.id);
        }

        // ВЕДНЪЖ updateModalContent
        updateModalContent(signal);
        modal.style.display = 'flex';
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });

        document.body.style.overflow = 'hidden';
        closeThreeDotsMenu();

        // САМО increment views в background - БЕЗ втора заявка
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

    // Update views count
    const viewsCount = document.getElementById('viewsCount');
    if (viewsCount) {
        viewsCount.textContent = signal.viewsCount || 0;
    }

    // Update like button state ПРОСТО - като в публикациите
    const likeBtn = document.getElementById('likeBtn');
    if (likeBtn) {
        if (window.isAuthenticated) {
            likeBtn.disabled = false;
            likeBtn.style.opacity = '1';

            // Провери Set-а
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

    // Запази оригиналните стойности
    const originalTitle = currentModalSignal.title || '';
    const originalDescription = currentModalSignal.description || '';

    // Конвертирай заглавието в input
    titleEl.innerHTML = `<input type="text" class="inline-edit-title" 
                         value="${escapeHtml(originalTitle)}" 
                         placeholder="Въведете заглавие..." 
                         maxlength="200">`;

    // Конвертирай описанието в textarea
    descriptionEl.innerHTML = `<textarea class="inline-edit-description" 
                               placeholder="Въведете описание..." 
                               maxlength="2000" 
                               rows="4">${escapeHtml(originalDescription)}</textarea>`;

    // Добави edit бутони
    addEditButtons();

    // Focus на заглавието
    setTimeout(() => {
        const titleInput = titleEl.querySelector('.inline-edit-title');
        titleInput.focus();
        titleInput.setSelectionRange(titleInput.value.length, titleInput.value.length);
    }, 100);

    // Добави клас за визуален индикатор
    titleEl.classList.add('editing');
    descriptionEl.classList.add('editing');
}

function addEditButtons() {
    // Провери дали вече има бутони
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

    // Вмъкни бутоните след описанието
    const descriptionEl = document.getElementById('modalSignalDescription');
    descriptionEl.parentNode.insertBefore(editActions, descriptionEl.nextSibling);

    // Setup event listeners
    editActions.querySelector('.edit-save-btn').addEventListener('click', saveInlineEdit);
    editActions.querySelector('.edit-cancel-btn').addEventListener('click', cancelInlineEdit);
}

function cancelInlineEdit() {
    const titleEl = document.getElementById('modalSignalTitle');
    const descriptionEl = document.getElementById('modalSignalDescription');
    const editActions = document.querySelector('.edit-actions');

    // Върни оригиналните стойности
    if (titleEl) {
        titleEl.textContent = currentModalSignal.title || 'Без заглавие';
        titleEl.classList.remove('editing');
    }

    if (descriptionEl) {
        descriptionEl.textContent = currentModalSignal.description || 'Няма описание';
        descriptionEl.classList.remove('editing');
    }

    // Премахни бутоните
    if (editActions) editActions.remove();
}

async function saveInlineEdit() {
    const titleInput = document.querySelector('.inline-edit-title');
    const descriptionTextarea = document.querySelector('.inline-edit-description');
    const saveBtn = document.querySelector('.edit-save-btn');

    if (!titleInput || !descriptionTextarea || !currentModalSignal) return;

    const newTitle = titleInput.value.trim();
    const newDescription = descriptionTextarea.value.trim();

    // Валидация
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

    // Показвай loading състояние
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Запазване...';

    try {
        // Подготви данните за обновление - ВКЛЮЧИ ВСИЧКИ НЕОБХОДИМИ ПОЛЕТА
        const updateData = {
            title: newTitle,
            description: newDescription,
            category: currentModalSignal.category,
            urgency: currentModalSignal.urgency,
            // ВАЖНО: Включи координатите от текущия сигнал
            latitude: currentModalSignal.coordinates ? currentModalSignal.coordinates[0] : null,
            longitude: currentModalSignal.coordinates ? currentModalSignal.coordinates[1] : null
        };

        // Изпрати към API
        const result = await window.SignalAPI.updateSignal(currentModalSignal.id, updateData);

        if (result.success) {
            // Обнови данните в currentModalSignal
            currentModalSignal.title = newTitle;
            currentModalSignal.description = newDescription;

            // Обнови DOM елементите с новите стойности
            const titleEl = document.getElementById('modalSignalTitle');
            const descriptionEl = document.getElementById('modalSignalDescription');

            titleEl.textContent = newTitle;
            titleEl.classList.remove('editing');

            descriptionEl.textContent = newDescription;
            descriptionEl.classList.remove('editing');

            // Премахни edit бутоните
            const editActions = document.querySelector('.edit-actions');
            if (editActions) editActions.remove();

            // Обнови кеша
            updateSignalInCache(currentModalSignal);

            // Покажи success нотификация
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

            // Обнови картата/списъка със сигнали
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

        // При грешка, върни формата в edit режим
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
            window.mapCore?.showNotification('🔒 Моля, влезте в профила си за да харесвате сигнали', 'warning', 4000);
        }
        return;
    }

    try {
        const response = await window.SignalAPI.toggleLike(currentModalSignal.id);

        if (response.success) {
            // Update Set (като в публикациите)
            if (response.liked) {
                likedSignals.add(currentModalSignal.id);
            } else {
                likedSignals.delete(currentModalSignal.id);
            }

            // Update count
            currentModalSignal.likesCount = (currentModalSignal.likesCount || 0) + (response.liked ? 1 : -1);

            // Update UI
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