// ====== UI UTILITIES AND MESSAGES ======
// Файл: src/main/resources/static/js/uiUtils.js

// ====== КОНСТАНТИ ======
const UI_CONSTANTS = {
    TIMERS: {
        ERROR: 5000,
        WARNING: 3000,
        SUCCESS: 2000
    },
    COLORS: {
        ERROR: '#dc3545',
        WARNING: '#ffc107',
        SUCCESS: '#28a745',
        PRIMARY: '#19851c',
        SECONDARY: '#6c757d'
    },
    DEBOUNCE_DELAY: 300
};

// ====== СЪОБЩЕНИЯ ======

/**
 * Показва съобщение за грешка
 * @param {string} message - Съобщението за грешка
 */
function showErrorMessage(message) {
    if (!message) {
        console.error('No error message provided');
        return;
    }

    console.error('Error:', message);

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: 'Грешка',
            text: message,
            confirmButtonColor: UI_CONSTANTS.COLORS.ERROR,
            timer: UI_CONSTANTS.TIMERS.ERROR,
            timerProgressBar: true,
            allowOutsideClick: false
        });
    } else {
        alert('Грешка: ' + message);
    }
}

/**
 * Показва предупредително съобщение
 * @param {string} message - Предупредителното съобщение
 */
function showWarningMessage(message) {
    if (!message) {
        console.warn('No warning message provided');
        return;
    }

    console.warn('Warning:', message);

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'warning',
            title: 'Внимание',
            text: message,
            confirmButtonColor: UI_CONSTANTS.COLORS.WARNING,
            timer: UI_CONSTANTS.TIMERS.WARNING,
            timerProgressBar: true
        });
    } else {
        alert('Внимание: ' + message);
    }
}

/**
 * Показва success съобщение
 * @param {string} message - Съобщението за успех
 */
function showSuccessMessage(message) {
    if (!message) {
        console.log('No success message provided');
        return;
    }

    console.log('Success:', message);

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: 'Успешно',
            text: message,
            confirmButtonColor: UI_CONSTANTS.COLORS.SUCCESS,
            timer: UI_CONSTANTS.TIMERS.SUCCESS,
            timerProgressBar: true
        });
    } else {
        alert('Успешно: ' + message);
    }
}

/**
 * Показва confirm диалог
 * @param {string} title - Заглавие на диалога
 * @param {string} message - Съобщението
 * @param {function} onConfirm - Callback при потвърждение
 * @param {function|null} onCancel - Callback при отказ
 */
function showConfirmDialog(title, message, onConfirm, onCancel = null) {
    if (!title || !message || typeof onConfirm !== 'function') {
        console.error('Invalid parameters for confirm dialog');
        return;
    }

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'question',
            title: title,
            text: message,
            showCancelButton: true,
            confirmButtonText: 'Да',
            cancelButtonText: 'Не',
            confirmButtonColor: UI_CONSTANTS.COLORS.PRIMARY,
            cancelButtonColor: UI_CONSTANTS.COLORS.SECONDARY,
            allowOutsideClick: false,
            allowEscapeKey: true
        }).then((result) => {
            if (result.isConfirmed) {
                onConfirm();
            } else if (result.isDismissed && typeof onCancel === 'function') {
                onCancel();
            }
        });
    } else {
        if (confirm(`${title}\n\n${message}`)) {
            onConfirm();
        } else if (typeof onCancel === 'function') {
            onCancel();
        }
    }
}

/**
 * Показва login warning
 */
function showLoginWarning() {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'info',
            title: 'Моля, влезте в системата',
            text: 'Трябва да сте влезли в профила си, за да достъпите това съдържание.',
            showCancelButton: true,
            confirmButtonText: 'Вход',
            cancelButtonText: 'Затвори',
            confirmButtonColor: UI_CONSTANTS.COLORS.PRIMARY,
            cancelButtonColor: UI_CONSTANTS.COLORS.SECONDARY,
            customClass: {
                popup: 'rounded-3 shadow'
            },
            allowOutsideClick: false
        }).then((result) => {
            if (result.isConfirmed) {
                const modal = document.getElementById('loginModal');
                if (modal && typeof bootstrap !== 'undefined') {
                    const bsModal = new bootstrap.Modal(modal);
                    bsModal.show();
                } else {
                    console.warn('Login modal not found or Bootstrap not available');
                }
            }
        });
    } else {
        alert('Моля, влезте в системата за да достъпите това съдържание.');
    }
}

// ====== UTILITY ФУНКЦИИ ======

/**
 * Debounce функция за оптимизиране на performance
 * @param {function} func - Функцията за debounce
 * @param {number} wait - Времето за изчакване в ms
 * @returns {function} Debounced функция
 */
function debounce(func, wait = UI_CONSTANTS.DEBOUNCE_DELAY) {
    if (typeof func !== 'function') {
        console.error('First parameter must be a function');
        return func;
    }

    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Почиства input от потенциално опасни символи
 * @param {string} input - Входният текст
 * @returns {string} Почистеният текст
 */
function sanitizeInput(input) {
    if (!input || typeof input !== 'string') {
        return '';
    }

    return input
        .replace(/<[^>]*>/g, '') // HTML тагове
        .replace(/[<>"'&]/g, '') // Опасни символи
        .trim()
        .substring(0, 1000); // Ограничение на дължината
}

/**
 * Форматира числа за по-добро четене
 * @param {number} num - Числото за форматиране
 * @returns {string} Форматираното число
 */
function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) {
        return '0';
    }

    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'М';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'К';
    }
    return num.toString();
}

/**
 * Проверява дали устройството е мобилно
 * @returns {boolean} True ако е мобилно устройство
 */
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
}

/**
 * Получава viewport размерите
 * @returns {Object} Обект със width и height
 */
function getViewportSize() {
    return {
        width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
        height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    };
}

/**
 * Получава URL параметър
 * @param {string} name - Името на параметъра
 * @returns {string|null} Стойността на параметъра или null
 */
function getUrlParameter(name) {
    if (!name || typeof name !== 'string') {
        return null;
    }

    try {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    } catch (error) {
        console.error('Error parsing URL parameters:', error);
        return null;
    }
}

// ====== DELETE EVENT MODAL ФУНКЦИИ ======

/**
 * Показва modal за потвърждение на изтриване на събитие
 * @param {number|string} eventId - ID на събитието за изтриване
 * @param {string} eventTitle - Заглавие на събитието
 * @param {function} onSuccess - Callback функция при успешно изтриване
 */
function showDeleteEventModal(eventId, eventTitle, onSuccess) {
    if (!eventId) {
        console.error('Event ID is required');
        showErrorMessage('Невалиден ID на събитие');
        return;
    }

    const modalElement = document.getElementById('deleteEventModal');
    if (!modalElement) {
        console.error('Delete event modal not found');
        showErrorMessage('Modal за изтриване не е намерен');
        return;
    }

    const modal = new bootstrap.Modal(modalElement);
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    if (!confirmBtn) {
        console.error('Confirm delete button not found');
        showErrorMessage('Бутон за потвърждение не е намерен');
        return;
    }

    // Обновяваме заглавието с името на събитието
    const titleElement = modalElement.querySelector('.modal-body h5');
    if (titleElement && eventTitle) {
        titleElement.textContent = `Сигурни ли сте, че искате да изтриете събитието "${sanitizeInput(eventTitle)}"?`;
    }

    // Премахваме стари event listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    // Добавяме нов event listener
    newConfirmBtn.addEventListener('click', function() {
        deleteEvent(eventId, onSuccess);
        modal.hide();
    });

    modal.show();
}

/**
 * Изтрива събитие чрез AJAX
 * @param {number|string} eventId - ID на събитието
 * @param {function} onSuccess - Callback при успех
 */
async function deleteEvent(eventId, onSuccess) {
    if (!eventId) {
        showErrorMessage('Невалиден ID на събитие');
        return;
    }

    // Показваме loading
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('show');
    }

    try {
        // CSRF token
        const csrfToken = document.querySelector('meta[name="_csrf"]')?.getAttribute('content');
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.getAttribute('content');

        if (!csrfToken || !csrfHeader) {
            throw new Error('CSRF токен не е намерен');
        }

        const response = await fetch(`/events/${eventId}/delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                [csrfHeader]: csrfToken
            }
        });

        if (response.ok) {
            showSuccessMessage('Събитието беше изтрито успешно!');

            if (typeof onSuccess === 'function') {
                onSuccess();
            } else {
                // Пренасочване към главната страница със събития
                setTimeout(() => {
                    window.location.href = '/mainEvents';
                }, 1000);
            }
        } else {
            const errorMsg = await response.text();
            throw new Error(errorMsg || `HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Delete event error:', error);
        showErrorMessage(error.message || 'Възникна грешка при изтриването на събитието.');
    } finally {
        // Скриваме loading
        if (loadingOverlay) {
            loadingOverlay.classList.remove('show');
        }
    }
}

/**
 * Инициализира delete бутон в карта на събитие
 * @param {HTMLElement} deleteBtn - Delete бутонът
 * @param {number|string} eventId - ID на събитието
 * @param {string} eventTitle - Заглавие на събитието
 */
function initDeleteButton(deleteBtn, eventId, eventTitle) {
    if (!deleteBtn || !eventId) {
        console.error('Invalid parameters for delete button initialization');
        return;
    }

    deleteBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        showDeleteEventModal(eventId, eventTitle, () => {
            // Премахваме картата от DOM при успех с анимация
            const eventCard = deleteBtn.closest('.col-md-4') || deleteBtn.closest('.event-card');
            if (eventCard) {
                eventCard.style.transition = 'all 0.3s ease';
                eventCard.style.opacity = '0';
                eventCard.style.transform = 'translateY(-20px)';

                setTimeout(() => {
                    eventCard.remove();
                }, 300);
            }
        });
    });
}

