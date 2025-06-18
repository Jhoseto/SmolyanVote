// ====== UI UTILITIES AND MESSAGES ======
// Файл: src/main/resources/static/js/uiUtils.js

/**
 * Показва съобщение за грешка
 */
function showErrorMessage(message) {
    console.error('Error:', message);

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: 'Грешка',
            text: message,
            confirmButtonColor: '#dc3545',
            timer: 5000,
            timerProgressBar: true
        });
    } else {
        alert('Грешка: ' + message);
    }
}

/**
 * Показва предупредително съобщение
 */
function showWarningMessage(message) {
    console.warn('Warning:', message);

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'warning',
            title: 'Внимание',
            text: message,
            confirmButtonColor: '#ffc107',
            timer: 3000,
            timerProgressBar: true
        });
    }
}

/**
 * Показва success съобщение
 */
function showSuccessMessage(message) {
    console.log('Success:', message);

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: 'Успешно',
            text: message,
            confirmButtonColor: '#28a745',
            timer: 2000,
            timerProgressBar: true
        });
    }
}

/**
 * Показва confirm диалог
 */
function showConfirmDialog(title, message, onConfirm, onCancel = null) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'question',
            title: title,
            text: message,
            showCancelButton: true,
            confirmButtonText: 'Да',
            cancelButtonText: 'Не',
            confirmButtonColor: '#19851c',
            cancelButtonColor: '#6c757d'
        }).then((result) => {
            if (result.isConfirmed && onConfirm) {
                onConfirm();
            } else if (result.isDismissed && onCancel) {
                onCancel();
            }
        });
    } else {
        if (confirm(`${title}\n\n${message}`) && onConfirm) {
            onConfirm();
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
            confirmButtonColor: '#19841c',
            cancelButtonColor: '#6c757d',
            customClass: {
                popup: 'rounded-3 shadow'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const modal = document.getElementById('loginModal');
                if (modal && typeof bootstrap !== 'undefined') {
                    const bsModal = new bootstrap.Modal(modal);
                    bsModal.show();
                }
            }
        });
    }
}

/**
 * Debounce функция
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Почиства input от потенциално опасни символи
 */
function sanitizeInput(input) {
    if (!input) return '';

    return input
        .replace(/<[^>]*>/g, '') // HTML тагове
        .replace(/[<>\"']/g, '') // Опасни символи
        .trim();
}

/**
 * Форматира числа за по-добро четене
 */
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'М';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'К';
    }
    return num.toString();
}

/**
 * Проверява дали устройството е мобилно
 */
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Получава viewport размерите
 */
function getViewportSize() {
    return {
        width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
        height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    };
}

/**
 * Получава URL параметър
 */
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}