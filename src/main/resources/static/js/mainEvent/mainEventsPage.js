// ====== MAIN EVENTS PAGE - CORE ======
// Файл: src/main/resources/static/js/mainEventsPage.js

// ====== КОНФИГУРАЦИЯ ======
window.CONFIG = {
    SEARCH_DELAY: 500,
    DEBOUNCE_DELAY: 300,
    MAX_SEARCH_LENGTH: 100,
    PAGE_SIZE_OPTIONS: [6, 12, 24, 50]
};

// ====== ГЛОБАЛНИ ПРОМЕНЛИВИ ======
window.searchTimeout = null;
window.debounceTimeout = null;
window.isLoading = false;

/**
 * Главна функция за инициализация
 */
function initializeMainEventsPage() {
    console.log('Initializing Main Events Page...');

    try {
        // Инициализация на компонентите
        initializeSearchFunctionality();
        initializeFilterFunctionality();
        initializePaginationFunctionality();
        initializeCustomDropdowns();

        // Скриване на loading състояние
        hideLoading();

        // Фокус върху търсенето ако няма активни филтри
        autoFocusSearch();

        console.log('Main Events Page initialized successfully');

    } catch (error) {
        console.error('Error initializing Main Events Page:', error);
        showErrorMessage('Възникна грешка при инициализацията на страницата.');
    }
}

/**
 * Ресетва страницата и submit-ва формата
 */
function resetPageAndSubmit() {
    const hiddenPageInput = document.getElementById('hiddenPage');
    if (hiddenPageInput) {
        hiddenPageInput.value = '0';
    }

    const form = document.getElementById('searchForm');
    if (form) {
        showLoading();
        form.submit();
    }
}

/**
 * Променя размера на страницата
 */
function changePageSize(newSize) {
    const form = document.getElementById('searchForm');
    if (!form) return;

    // Ресетване на страницата
    const hiddenPageInput = document.getElementById('hiddenPage');
    if (hiddenPageInput) {
        hiddenPageInput.value = '0';
    }

    // Намиране или създаване на size input
    let sizeInput = form.querySelector('input[name="size"]');
    if (sizeInput) {
        sizeInput.value = newSize;
    } else {
        sizeInput = document.createElement('input');
        sizeInput.type = 'hidden';
        sizeInput.name = 'size';
        sizeInput.value = newSize;
        form.appendChild(sizeInput);
    }

    showLoading();
    form.submit();
}

/**
 * Показва loading състояние
 */
function showLoading() {
    if (window.isLoading) return;

    window.isLoading = true;
    const overlay = document.getElementById('loadingOverlay');

    if (overlay) {
        overlay.classList.add('show');
    }

    // Деактивиране на submit бутона
    const submitBtn = document.querySelector('.search-button');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <div class="spinner-border spinner-border-sm" role="status">
                <span class="visually-hidden">Зареждане...</span>
            </div>
        `;
    }

    // Добавяне на loading клас към body
    document.body.classList.add('loading');
}

/**
 * Скрива loading състояние
 */
function hideLoading() {
    window.isLoading = false;
    const overlay = document.getElementById('loadingOverlay');

    if (overlay) {
        overlay.classList.remove('show');
    }

    // Възстановяване на submit бутона
    const submitBtn = document.querySelector('.search-button');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--medium-gray)" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
        `;
    }

    // Премахване на loading клас от body
    document.body.classList.remove('loading');
}

/**
 * Проверява дали input поле е фокусирано
 */
function isInputFocused() {
    const activeElement = document.activeElement;
    return activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT'
    );
}

/**
 * Получава текущата стойност на търсенето
 */
function getCurrentSearchValue() {
    const searchInput = document.getElementById('eventSearch');
    return searchInput ? searchInput.value.trim() : '';
}

/**
 * Инициализира keyboard shortcuts
 */
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        const isCtrl = event.ctrlKey || event.metaKey;

        // Ctrl/Cmd + K за фокус върху търсенето
        if (isCtrl && key === 'k') {
            event.preventDefault();
            focusSearchInput();
            return;
        }

        // Escape за изчистване на търсенето
        if (key === 'escape' && document.activeElement?.id === 'eventSearch') {
            clearSearch();
            return;
        }
    });
}

/**
 * Почиства ресурси при напускане на страницата
 */
function cleanup() {
    // Почистване на timeouts
    if (window.searchTimeout) clearTimeout(window.searchTimeout);
    if (window.debounceTimeout) clearTimeout(window.debounceTimeout);

    console.log('Main Events Page cleanup completed');
}

// ====== INITIALIZATION ======

// Инициализация при DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    initializeMainEventsPage();
    initializeKeyboardShortcuts();
});

// Cleanup при напускане на страницата
window.addEventListener('beforeunload', cleanup);

// Обработка на history changes
window.addEventListener('popstate', (event) => {
    if (event.state) {
        location.reload();
    }
});

// Export функции за external use
window.MainEventsPage = {
    showLoginWarning,
    resetPageAndSubmit,
    changePageSize,
    showLoading,
    hideLoading,
    focusSearchInput,
    clearSearch
};