// ====== EVENT REPORTING FUNCTIONALITY ======
// Файл: src/main/resources/static/js/mainEvent/eventReporting.js

/**
 * Универсална функция за докладване на събития
 * @param {string} eventType - Тип на събитието (SIMPLE_EVENT, REFERENDUM, MULTI_POLL)
 * @param {number} eventId - ID на събитието
 */
function showEventReportModal(eventType, eventId) {
    if (!eventType || !eventId) {
        console.error('Invalid parameters for showEventReportModal:', { eventType, eventId });
        return;
    }

    // Проверка за автентикация
    if (!window.isAuthenticated) {
        if (typeof window.showLoginWarning === 'function') {
            window.showLoginWarning();
        } else {
            alert('За да докладвате събитие, моля влезте в системата!');
        }
        return;
    }

    // Проверка за SweetAlert2
    if (typeof Swal === 'undefined') {
        console.error('SweetAlert2 не е достъпен');
        alert('Възникна проблем със системата. Моля опитайте отново.');
        return;
    }

    // Определяне на текста според типа събитие
    const eventTypeText = getEventTypeText(eventType);

    Swal.fire({
        title: `Докладвай ${eventTypeText}`,
        html: `
            <div style="text-align: left; margin-bottom: 20px;">
                <p style="margin-bottom: 15px; color: #666; font-size: 14px;">Защо докладвате това ${eventTypeText.toLowerCase()}?</p>
                <select id="reportReason" class="swal2-select" style="width: 85%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px;">
                    <option value="SPAM">🚫 Спам или нежелано съдържание</option>
                    <option value="HARASSMENT">⚠️ Тормоз или заплахи</option>
                    <option value="HATE_SPEECH">😡 Език на омразата</option>
                    <option value="MISINFORMATION">❌ Дезинформация или фалшиви новини</option>
                    <option value="INAPPROPRIATE">🔞 Неподходящо съдържание</option>
                    <option value="COPYRIGHT">📝 Нарушение на авторски права</option>
                    <option value="OTHER">❓ Друго</option>
                </select>
                
                <!-- Поле за описание - показва се само при "Друго" -->
                <div id="descriptionContainer" style="margin-top: 15px; display: none;">
                    <label for="reportDescription" style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
                        Опишете проблема:
                    </label>
                    <textarea 
                        id="reportDescription" 
                        placeholder="Моля, опишете подробно защо докладвате това ${eventTypeText.toLowerCase()}..."
                        style="width: 85%; min-height: 80px; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; resize: vertical; font-family: inherit;"
                        maxlength="500"
                    ></textarea>
                    <div style="text-align: right; font-size: 12px; color: #999; margin-top: 5px;">
                        <span id="charCounter">0/500 знака</span>
                    </div>
                </div>
                
                <p style="margin-top: 15px; font-size: 12px; color: #999;">
                    Вашият доклад ще бъде прегледан от нашия екип в рамките на 24 часа.
                </p>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="bi bi-flag-fill"></i> Изпрати доклад',
        cancelButtonText: '<i class="bi bi-x"></i> Отказ',
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#6c757d',
        buttonsStyling: true,
        customClass: {
            popup: 'animated fadeInDown',
            confirmButton: 'btn btn-danger',
            cancelButton: 'btn btn-secondary'
        },
        didOpen: () => {
            // Настройване на event listeners за динамичното показване на описанието
            const reasonSelect = document.getElementById('reportReason');
            const descriptionContainer = document.getElementById('descriptionContainer');
            const reportDescription = document.getElementById('reportDescription');
            const charCounter = document.getElementById('charCounter');

            if (reasonSelect && descriptionContainer) {
                reasonSelect.addEventListener('change', () => {
                    if (reasonSelect.value === 'OTHER') {
                        descriptionContainer.style.display = 'block';
                        reportDescription.focus();
                    } else {
                        descriptionContainer.style.display = 'none';
                    }
                });
            }

            // Character counter за описанието
            if (reportDescription && charCounter) {
                reportDescription.addEventListener('input', () => {
                    const length = reportDescription.value.length;
                    charCounter.textContent = `${length}/500 знака`;

                    if (length > 450) {
                        charCounter.style.color = '#e74c3c';
                    } else if (length > 400) {
                        charCounter.style.color = '#f39c12';
                    } else {
                        charCounter.style.color = '#999';
                    }
                });
            }
        },
        preConfirm: () => {
            const reason = document.getElementById('reportReason').value;
            const description = document.getElementById('reportDescription').value.trim();

            if (!reason) {
                Swal.showValidationMessage('<i class="bi bi-exclamation-triangle"></i> Моля, изберете причина за докладването!');
                return false;
            }

            // Валидация за описанието при избор "Друго"
            if (reason === 'OTHER' && !description) {
                Swal.showValidationMessage('<i class="bi bi-exclamation-triangle"></i> Моля, опишете причината за докладването!');
                return false;
            }

            // Валидация за дължина на описанието
            if (description && description.length < 10) {
                Swal.showValidationMessage('<i class="bi bi-exclamation-triangle"></i> Описанието трябва да е поне 10 знака!');
                return false;
            }

            if (description && description.length > 500) {
                Swal.showValidationMessage('<i class="bi bi-exclamation-triangle"></i> Описанието не може да бъде повече от 500 знака!');
                return false;
            }

            return { reason, description };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            await submitEventReport(eventType, eventId, result.value.reason, result.value.description);
        }
    });
}

/**
 * Изпраща доклада към сървъра
 */
async function submitEventReport(eventType, eventId, reason, description) {
    try {
        // Показваме loading състояние
        Swal.fire({
            title: 'Изпращане на доклад...',
            html: 'Моля изчакайте, докато обработваме вашия доклад.',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Получаване на CSRF токен
        const csrfToken = document.querySelector('meta[name="_csrf"]')?.getAttribute('content');
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.getAttribute('content');

        const headers = {
            'Content-Type': 'application/json'
        };

        if (csrfToken && csrfHeader) {
            headers[csrfHeader] = csrfToken;
        }

        // Изпращане на заявката
        const response = await fetch(`/api/reports/${eventType}/${eventId}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                reason: reason,
                description: description || ''
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Успешно изпратен доклад
            Swal.fire({
                icon: 'success',
                title: 'Докладът е изпратен успешно!',
                text: 'Благодарим ви! Нашият екип ще прегледа доклада в най-скоро време.',
                confirmButtonColor: '#28a745',
                confirmButtonText: 'Разбрано'
            });
        } else {
            // Грешка от сървъра
            handleReportError(response.status, data.message || 'Възникна неочаквана грешка');
        }

    } catch (error) {
        console.error('Error submitting event report:', error);
        Swal.fire({
            icon: 'error',
            title: 'Проблем с връзката',
            text: 'Възникна проблем с връзката. Моля проверете интернет връзката си и опитайте отново.',
            confirmButtonColor: '#e74c3c',
            confirmButtonText: 'Опитай отново'
        });
    }
}

/**
 * Обработка на грешки при докладване
 */
function handleReportError(status, message) {
    let title, text, icon;

    switch (status) {
        case 400:
            title = 'Невалидни данни';
            text = message || 'Моля проверете въведените данни и опитайте отново.';
            icon = 'warning';
            break;
        case 401:
            title = 'Необходима автентикация';
            text = 'Моля влезте в системата и опитайте отново.';
            icon = 'warning';
            break;
        case 403:
            title = 'Няmate разрешение';
            text = message || 'Не можете да докладвате това събитие.';
            icon = 'error';
            break;
        case 409:
            title = 'Докладът вече съществува';
            text = 'Вече сте докладвали това събитие.';
            icon = 'info';
            break;
        case 429:
            title = 'Твърде много доклади';
            text = message || 'Превишили сте лимита за доклади. Моля опитайте по-късно.';
            icon = 'warning';
            break;
        default:
            title = 'Грешка на сървъра';
            text = message || 'Възникна проблем със сървъра. Моля опитайте отново.';
            icon = 'error';
    }

    Swal.fire({
        icon: icon,
        title: title,
        text: text,
        confirmButtonColor: '#e74c3c',
        confirmButtonText: 'Опитай отново'
    });
}

/**
 * Помощна функция за определяне на текста според типа събитие
 */
function getEventTypeText(eventType) {
    switch (eventType.toUpperCase()) {
        case 'SIMPLE_EVENT':
            return 'събитие';
        case 'REFERENDUM':
            return 'референдум';
        case 'MULTI_POLL':
            return 'анкета';
        default:
            return 'събитие';
    }
}

// ====== ГЛОБАЛНИ ФУНКЦИИ ЗА BACKWARD COMPATIBILITY ======

/**
 * Специфични функции за всеки тип събитие (за използване в HTML onclick)
 */
window.reportEvent = function(eventId) {
    showEventReportModal('SIMPLE_EVENT', eventId);
};

window.reportReferendum = function(eventId) {
    showEventReportModal('REFERENDUM', eventId);
};

window.reportPoll = function(eventId) {
    showEventReportModal('MULTI_POLL', eventId);
};

// Основната универсална функция
window.showEventReportModal = showEventReportModal;

// ====== INITIALIZATION ======
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Event Reporting functionality loaded successfully');
});

console.log('✅ eventReporting.js loaded successfully');