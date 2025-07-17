// ====== EVENT DELETE FUNCTIONALITY ======
// Файл: src/main/resources/static/js/mainEvent/eventDelete.js

/**
 * Потвърждение за изтриване на SimpleEvent
 * @param {number} eventId - ID на събитието
 */
function confirmDeleteEvent(eventId) {
    if (!eventId) {
        console.error('Event ID is required');
        return;
    }

    // Проверка за автентикация
    if (!window.isAuthenticated) {
        if (typeof window.showLoginWarning === 'function') {
            window.showLoginWarning();
        } else {
            alert('За да изтриете събитие, моля влезте в системата!');
        }
        return;
    }

    // Проверка за SweetAlert2
    if (typeof Swal === 'undefined') {
        // Fallback за случаи когато SweetAlert2 не е достъпен
        if (confirm('Сигурни ли сте, че искате да изтриете това събитие?')) {
            submitDeleteForm('/event/' + eventId + '/delete');
        }
        return;
    }

    Swal.fire({
        title: 'Изтриване на събитие',
        text: 'Сигурни ли сте, че искате да изтриете това събитие? Това действие не може да бъде отменено!',
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
    }).then((result) => {
        if (result.isConfirmed) {
            submitDeleteForm('/event/' + eventId + '/delete');
        }
    });
}

/**
 * Потвърждение за изтриване на Referendum
 * @param {number} referendumId - ID на референдума
 */
function confirmDeleteReferendum(referendumId) {
    if (!referendumId) {
        console.error('Referendum ID is required');
        return;
    }

    // Проверка за автентикация
    if (!window.isAuthenticated) {
        if (typeof window.showLoginWarning === 'function') {
            window.showLoginWarning();
        } else {
            alert('За да изтриете референдум, моля влезте в системата!');
        }
        return;
    }

    // Проверка за SweetAlert2
    if (typeof Swal === 'undefined') {
        if (confirm('Сигурни ли сте, че искате да изтриете този референдум?')) {
            submitDeleteForm('/referendum/' + referendumId + '/delete');
        }
        return;
    }

    Swal.fire({
        title: 'Изтриване на референдум',
        text: 'Сигурни ли сте, че искате да изтриете този референдум? Всички гласове и коментари ще бъдат изтрити завинаги!',
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
    }).then((result) => {
        if (result.isConfirmed) {
            submitDeleteForm('/referendum/' + referendumId + '/delete');
        }
    });
}

/**
 * Потвърждение за изтриване на MultiPoll
 * @param {number} pollId - ID на анкетата
 */
function confirmDeletePoll(pollId) {
    if (!pollId) {
        console.error('Poll ID is required');
        return;
    }

    // Проверка за автентикация
    if (!window.isAuthenticated) {
        if (typeof window.showLoginWarning === 'function') {
            window.showLoginWarning();
        } else {
            alert('За да изтриете анкета, моля влезте в системата!');
        }
        return;
    }

    // Проверка за SweetAlert2
    if (typeof Swal === 'undefined') {
        if (confirm('Сигурни ли сте, че искате да изтриете тази анкета?')) {
            submitDeleteForm('/multipoll/' + pollId + '/delete');
        }
        return;
    }

    Swal.fire({
        title: 'Изтриване на анкета',
        text: 'Сигурни ли сте, че искате да изтриете тази анкета? Всички гласове и коментари ще бъдат изтрити завинаги!',
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
    }).then((result) => {
        if (result.isConfirmed) {
            submitDeleteForm('/multipoll/' + pollId + '/delete');
        }
    });
}

/**
 * Помощна функция за submitване на delete формата
 * @param {string} actionUrl - URL към POST endpoint-а
 */
function submitDeleteForm(actionUrl) {
    try {
        // Показваме loading състояние
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Изтриване...',
                html: 'Моля изчакайте, докато събитието се изтрие.',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        }

        // Получаване на CSRF токен
        const csrfToken = document.querySelector('meta[name="_csrf"]')?.getAttribute('content');
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.getAttribute('content');

        if (!csrfToken || !csrfHeader) {
            console.error('CSRF token not found');
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Грешка в сигурността',
                    text: 'CSRF токен не е намерен. Моля презаредете страницата.',
                    confirmButtonColor: '#e74c3c'
                });
            } else {
                alert('Грешка в сигурността. Моля презаредете страницата.');
            }
            return;
        }

        // Създаване на форма за изпращане
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = actionUrl;

        // Добавяне на CSRF токен
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = '_csrf';
        csrfInput.value = csrfToken;
        form.appendChild(csrfInput);

        // Добавяне на формата към DOM и submitване
        document.body.appendChild(form);
        form.submit();

        // Забележка: След submit страницата ще се презареди и ще пренасочи към /mainEvents

    } catch (error) {
        console.error('Error submitting delete form:', error);

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Възникна грешка',
                text: 'Възникна проблем при изтриването. Моля опитайте отново.',
                confirmButtonColor: '#e74c3c'
            });
        } else {
            alert('Възникна проблем при изтриването. Моля опитайте отново.');
        }
    }
}

// ====== ГЛОБАЛНИ ФУНКЦИИ ======

// Експорт на функциите към window обекта за използване в HTML onclick
window.confirmDeleteEvent = confirmDeleteEvent;
window.confirmDeleteReferendum = confirmDeleteReferendum;
window.confirmDeletePoll = confirmDeletePoll;

// ====== INITIALIZATION ======
document.addEventListener('DOMContentLoaded', function() {
});

