// ====== MAIN EVENTS PAGE JAVASCRIPT ======
// Файл: src/main/resources/static/js/mainEventsPage.js

/**
 * Main Events Page JavaScript
 * Управлява функционалността на страницата със събития
 */

// ====== КОНСТАНТИ И КОНФИГУРАЦИЯ ======
const CONFIG = {
    SEARCH_DELAY: 500, // Забавяне преди търсене в милисекунди
    DEBOUNCE_DELAY: 300, // Debounce за други действия
    ANIMATION_DURATION: 300, // Продължителност на анимациите
    MAX_SEARCH_LENGTH: 100, // Максимална дължина на търсенето
    PAGE_SIZE_OPTIONS: [6, 12, 24, 50], // Възможни размери на страница
    KEYBOARD_SHORTCUTS: {
        SEARCH_FOCUS: ['ctrl+k', 'cmd+k'],
        CLEAR_SEARCH: ['escape'],
        FIRST_PAGE: ['home'],
        LAST_PAGE: ['end']
    }
};

// ====== ГЛОБАЛНИ ПРОМЕНЛИВИ ======
let searchTimeout;
let debounceTimeout;
let isLoading = false;
let tooltips = new Map();

// ====== CORE FUNCTIONS ======

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
        initializeKeyboardShortcuts();
        initializeTooltips();
        initializeAccessibility();
        initializePerformanceOptimizations();

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
 * Инициализира функционалността за търсене
 */
function initializeSearchFunctionality() {
    const searchInput = document.getElementById('eventSearch');
    const searchForm = document.getElementById('searchForm');
    const searchButton = document.querySelector('.search-button');

    if (!searchInput || !searchForm) {
        console.warn('Search elements not found');
        return;
    }

    // Event listeners за търсенето
    searchInput.addEventListener('keypress', handleSearchKeypress);
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('blur', validateSearchInput);

    // Event listener за формата
    searchForm.addEventListener('submit', handleFormSubmit);

    // Добавяне на visual feedback за търсенето
    searchInput.addEventListener('focus', () => {
        searchInput.parentElement.classList.add('search-focused');
    });

    searchInput.addEventListener('blur', () => {
        searchInput.parentElement.classList.remove('search-focused');
    });

    console.log('Search functionality initialized');
}

/**
 * Инициализира функционалността на филтрите
 */
function initializeFilterFunctionality() {
    const filterSelects = document.querySelectorAll('.filter-dropdown select');

    filterSelects.forEach(select => {
        select.addEventListener('change', handleFilterChange);
        select.addEventListener('focus', () => {
            select.parentElement.classList.add('filter-focused');
        });
        select.addEventListener('blur', () => {
            select.parentElement.classList.remove('filter-focused');
        });
    });

    // Инициализация на reset бутона
    const resetButton = document.querySelector('.filter-reset .btn');
    if (resetButton) {
        resetButton.addEventListener('click', handleFilterReset);
    }

    console.log('Filter functionality initialized');
}

/**
 * Инициализира функционалността на пагинацията
 */
function initializePaginationFunctionality() {
    const pageSizeSelect = document.getElementById('pageSizeSelect');

    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', handlePageSizeChange);
    }

    // Добавяне на event listeners за pagination links
    const paginationLinks = document.querySelectorAll('.pagination .page-link');
    paginationLinks.forEach(link => {
        if (!link.parentElement.classList.contains('disabled')) {
            link.addEventListener('click', handlePaginationClick);
        }
    });

    console.log('Pagination functionality initialized');
}

/**
 * Инициализира keyboard shortcuts
 */
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    console.log('Keyboard shortcuts initialized');
}

/**
 * Инициализира tooltips
 */
function initializeTooltips() {
    const tooltipElements = document.querySelectorAll('[title], [data-bs-title]');

    tooltipElements.forEach(element => {
        try {
            const tooltip = new bootstrap.Tooltip(element, {
                placement: 'top',
                trigger: 'hover focus',
                delay: { show: 500, hide: 100 },
                html: false,
                sanitize: true
            });
            tooltips.set(element, tooltip);
        } catch (error) {
            console.warn('Failed to initialize tooltip:', error);
        }
    });

    console.log(`Initialized ${tooltips.size} tooltips`);
}

/**
 * Инициализира accessibility подобрения
 */
function initializeAccessibility() {
    // ARIA labels и roles
    addAccessibilityAttributes();

    // Focus management
    initializeFocusManagement();

    // Screen reader announcements
    initializeScreenReaderSupport();

    console.log('Accessibility features initialized');
}

/**
 * Инициализира performance оптимизации
 */
function initializePerformanceOptimizations() {
    // Lazy loading за images (ако има)
    initializeLazyLoading();

    // Intersection Observer за анимации
    initializeAnimationObserver();

    // Debouncing за resize events
    window.addEventListener('resize', debounce(handleWindowResize, CONFIG.DEBOUNCE_DELAY));

    console.log('Performance optimizations initialized');
}

// ====== EVENT HANDLERS ======

/**
 * Обработва натискането на клавиши в търсачката
 */
function handleSearchKeypress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        clearTimeout(searchTimeout);
        resetPageAndSubmit();
    }
}

/**
 * Обработва input в търсачката с debouncing
 */
function handleSearchInput(event) {
    const input = event.target;

    // Валидация на дължината
    if (input.value.length > CONFIG.MAX_SEARCH_LENGTH) {
        input.value = input.value.substring(0, CONFIG.MAX_SEARCH_LENGTH);
        showWarningMessage(`Търсенето е ограничено до ${CONFIG.MAX_SEARCH_LENGTH} символа.`);
    }

    // Опционално: Live search (можеш да го активираш)
    // clearTimeout(searchTimeout);
    // searchTimeout = setTimeout(() => {
    //     if (input.value.trim() !== getCurrentSearchValue()) {
    //         resetPageAndSubmit();
    //     }
    // }, CONFIG.SEARCH_DELAY);
}

/**
 * Валидира input полето за търсене
 */
function validateSearchInput(event) {
    const input = event.target;
    const value = input.value.trim();

    // Премахване на потенциално опасни символи
    const sanitizedValue = sanitizeInput(value);
    if (sanitizedValue !== value) {
        input.value = sanitizedValue;
        showWarningMessage('Някои символи бяха премахнати от търсенето.');
    }
}

/**
 * Обработва промяна във филтрите
 */
function handleFilterChange(event) {
    const select = event.target;

    // Добавяне на visual feedback
    select.parentElement.classList.add('filter-changing');

    setTimeout(() => {
        resetPageAndSubmit();
    }, 100);
}

/**
 * Обработва reset на филтрите
 */
function handleFilterReset(event) {
    event.preventDefault();

    showConfirmDialog(
        'Изчистване на филтри',
        'Сигурни ли сте, че искате да изчистите всички филтри?',
        () => {
            window.location.href = event.target.href;
        }
    );
}

/**
 * Обработва промяна в размера на страницата
 */
function handlePageSizeChange(event) {
    const newSize = event.target.value;

    if (!CONFIG.PAGE_SIZE_OPTIONS.includes(parseInt(newSize))) {
        console.warn('Invalid page size:', newSize);
        return;
    }

    changePageSize(newSize);
}

/**
 * Обработва clicks на pagination links
 */
function handlePaginationClick(event) {
    const link = event.target.closest('.page-link');

    if (link && !link.parentElement.classList.contains('disabled')) {
        showLoading();
        // Default браузърното поведение ще се погрижи за навигацията
    }
}

/**
 * Обработва submit на формата
 */
function handleFormSubmit(event) {
    if (!validateForm()) {
        event.preventDefault();
        return false;
    }

    showLoading();
    return true;
}

/**
 * Обработва keyboard shortcuts
 */
function handleKeyboardShortcuts(event) {
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

    // Home/End за първа/последна страница (само ако не сме в input поле)
    if (!isInputFocused()) {
        if (key === 'home') {
            event.preventDefault();
            goToFirstPage();
        } else if (key === 'end') {
            event.preventDefault();
            goToLastPage();
        }
    }
}

/**
 * Обработва resize на прозореца
 */
function handleWindowResize() {
    // Преизчисляване на layout ако е необходимо
    updateResponsiveElements();
}

// ====== UTILITY FUNCTIONS ======

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
    if (isLoading) return;

    isLoading = true;
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
    isLoading = false;
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
 * Фокусира search input-а
 */
function focusSearchInput() {
    const searchInput = document.getElementById('eventSearch');
    if (searchInput) {
        searchInput.focus();
        searchInput.select();
    }
}

/**
 * Изчиства търсенето
 */
function clearSearch() {
    const searchInput = document.getElementById('eventSearch');
    if (searchInput && searchInput.value.trim() !== '') {
        searchInput.value = '';
        resetPageAndSubmit();
    }
}

/**
 * Автоматично фокусира търсенето ако няма активни филтри
 */
function autoFocusSearch() {
    const hasActiveFilters = document.querySelector('.active-filters');
    const searchInput = document.getElementById('eventSearch');

    if (!hasActiveFilters && searchInput && !searchInput.value) {
        setTimeout(() => {
            searchInput.focus();
        }, 100);
    }
}

/**
 * Отива към първата страница
 */
function goToFirstPage() {
    const firstPageLink = document.querySelector('.pagination .page-item:first-child .page-link');
    if (firstPageLink && !firstPageLink.parentElement.classList.contains('disabled')) {
        showLoading();
        firstPageLink.click();
    }
}

/**
 * Отива към последната страница
 */
function goToLastPage() {
    const lastPageLink = document.querySelector('.pagination .page-item:last-child .page-link');
    if (lastPageLink && !lastPageLink.parentElement.classList.contains('disabled')) {
        showLoading();
        lastPageLink.click();
    }
}

/**
 * Валидира формата преди submit
 */
function validateForm() {
    const searchInput = document.getElementById('eventSearch');

    if (searchInput && searchInput.value.length > CONFIG.MAX_SEARCH_LENGTH) {
        showErrorMessage(`Търсенето не може да бъде по-дълго от ${CONFIG.MAX_SEARCH_LENGTH} символа.`);
        searchInput.focus();
        return false;
    }

    return true;
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
 * Почиства input от потенциално опасни символи
 */
function sanitizeInput(input) {
    if (!input) return '';

    // Премахване на HTML тагове и специални символи
    return input
        .replace(/<[^>]*>/g, '') // HTML тагове
        .replace(/[<>\"']/g, '') // Опасни символи
        .trim();
}

/**
 * Debounce функция
 */
function debounce(func, wait) {
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(debounceTimeout);
            func(...args);
        };
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(later, wait);
    };
}

// ====== ACCESSIBILITY FUNCTIONS ======

/**
 * Добавя accessibility атрибути
 */
function addAccessibilityAttributes() {
    // Search input
    const searchInput = document.getElementById('eventSearch');
    if (searchInput) {
        searchInput.setAttribute('role', 'searchbox');
        searchInput.setAttribute('aria-label', 'Търси събития по заглавие или потребител');
    }

    // Filter selects
    const filterSelects = document.querySelectorAll('.filter-dropdown select');
    filterSelects.forEach((select, index) => {
        select.setAttribute('aria-label', `Филтър ${index + 1}`);
    });

    // Pagination
    const pagination = document.querySelector('.pagination');
    if (pagination) {
        pagination.setAttribute('role', 'navigation');
        pagination.setAttribute('aria-label', 'Пагинация на събития');
    }
}

/**
 * Инициализира focus management
 */
function initializeFocusManagement() {
    // Skip links за keyboard навигация
    addSkipLinks();

    // Focus trap в модали ако има такива
    initializeFocusTrap();
}

/**
 * Инициализира screen reader support
 */
function initializeScreenReaderSupport() {
    // Live region за announcements
    createLiveRegion();

    // Announce page changes
    announcePageChanges();
}

/**
 * Добавя skip links
 */
function addSkipLinks() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Прескочи към основното съдържание';
    skipLink.className = 'skip-link visually-hidden-focusable';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: var(--primary-color);
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 10000;
    `;

    // Show on focus
    skipLink.addEventListener('focus', () => {
        skipLink.style.top = '6px';
    });

    skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
}

/**
 * Създава live region за announcements
 */
function createLiveRegion() {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'visually-hidden';
    document.body.appendChild(liveRegion);
}

/**
 * Announce промени в страницата
 */
function announcePageChanges() {
    const liveRegion = document.getElementById('live-region');
    if (!liveRegion) return;

    // Announce results count
    const resultsInfo = document.querySelector('.results-info');
    if (resultsInfo) {
        const text = resultsInfo.textContent.trim();
        setTimeout(() => {
            liveRegion.textContent = text;
        }, 500);
    }
}

/**
 * Инициализира focus trap (за модали)
 */
function initializeFocusTrap() {
    // Ще се имплементира при нужда
}

// ====== PERFORMANCE FUNCTIONS ======

/**
 * Инициализира lazy loading
 */
function initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }
}

/**
 * Инициализира animation observer
 */
function initializeAnimationObserver() {
    if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const animatedElements = document.querySelectorAll('.event-container .col-md-4');

        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                }
            });
        }, {
            threshold: 0.1
        });

        animatedElements.forEach(el => {
            el.style.animationPlayState = 'paused';
            animationObserver.observe(el);
        });
    }
}

/**
 * Обновява responsive елементи
 */
function updateResponsiveElements() {
    // Може да се добави логика за responsive adjustments
}

// ====== UI FEEDBACK FUNCTIONS ======

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
            confirmButtonColor: '#25afb4',
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
 * Показва login warning (от оригиналния код)
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
            confirmButtonColor: '#25afb4',
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

// ====== UTILITY FUNCTIONS ======

/**
 * Проверява дали браузърът поддържа определена функционалност
 */
function supportsFeature(feature) {
    switch (feature) {
        case 'intersectionObserver':
            return 'IntersectionObserver' in window;
        case 'localStorage':
            try {
                return 'localStorage' in window && window.localStorage !== null;
            } catch {
                return false;
            }
        case 'serviceWorker':
            return 'serviceWorker' in navigator;
        default:
            return false;
    }
}

/**
 * Throttle функция
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
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

// ====== URL MANAGEMENT ======

/**
 * Получава URL параметър
 */
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

/**
 * Обновява URL без презареждане на страницата
 */
function updateUrlWithoutReload(params) {
    if ('history' in window && 'pushState' in window.history) {
        const url = new URL(window.location);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== '') {
                url.searchParams.set(key, params[key]);
            } else {
                url.searchParams.delete(key);
            }
        });
        window.history.pushState({}, '', url);
    }
}

// ====== CLEANUP ======

/**
 * Почиства ресурси при напускане на страницата
 */
function cleanup() {
    // Почистване на timeouts
    if (searchTimeout) clearTimeout(searchTimeout);
    if (debounceTimeout) clearTimeout(debounceTimeout);

    // Почистване на tooltips
    tooltips.forEach(tooltip => {
        try {
            tooltip.dispose();
        } catch (error) {
            console.warn('Error disposing tooltip:', error);
        }
    });
    tooltips.clear();

    // Почистване на observers
    // (observers се почистват автоматично)

    console.log('Main Events Page cleanup completed');
}

// ====== INITIALIZATION ======

// Инициализация при DOMContentLoaded
document.addEventListener('DOMContentLoaded', initializeMainEventsPage);

// Cleanup при напускане на страницата
window.addEventListener('beforeunload', cleanup);

// Обработка на history changes
window.addEventListener('popstate', (event) => {
    if (event.state) {
        location.reload();
    }
});

// Export функции за external use (ако е необходимо)
window.MainEventsPage = {
    showLoginWarning,
    resetPageAndSubmit,
    changePageSize,
    showLoading,
    hideLoading,
    focusSearchInput,
    clearSearch
};

// Debug mode за development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.MainEventsPageDebug = {
        CONFIG,
        showErrorMessage,
        showWarningMessage,
        showSuccessMessage,
        validateForm,
        sanitizeInput,
        getUrlParameter,
        formatNumber,
        isMobileDevice,
        getViewportSize
    };

    console.log('Main Events Page Debug mode enabled');
}