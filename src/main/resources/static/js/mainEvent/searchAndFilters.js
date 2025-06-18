// ====== SEARCH AND FILTERS FUNCTIONALITY ======
// Файл: src/main/resources/static/js/searchAndFilters.js

/**
 * Инициализира функционалността за търсене
 */
function initializeSearchFunctionality() {
    const searchInput = document.getElementById('eventSearch');
    const searchForm = document.getElementById('searchForm');

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
 * Обработва натискането на клавиши в търсачката
 */
function handleSearchKeypress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        clearTimeout(window.searchTimeout);
        resetPageAndSubmit();
    }
}

/**
 * Обработва input в търсачката
 */
function handleSearchInput(event) {
    const input = event.target;

    // Валидация на дължината
    if (input.value.length > window.CONFIG.MAX_SEARCH_LENGTH) {
        input.value = input.value.substring(0, window.CONFIG.MAX_SEARCH_LENGTH);
        showWarningMessage(`Търсенето е ограничено до ${window.CONFIG.MAX_SEARCH_LENGTH} символа.`);
    }
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

    if (!window.CONFIG.PAGE_SIZE_OPTIONS.includes(parseInt(newSize))) {
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
 * Валидира формата преди submit
 */
function validateForm() {
    const searchInput = document.getElementById('eventSearch');

    if (searchInput && searchInput.value.length > window.CONFIG.MAX_SEARCH_LENGTH) {
        showErrorMessage(`Търсенето не може да бъде по-дълго от ${window.CONFIG.MAX_SEARCH_LENGTH} символа.`);
        searchInput.focus();
        return false;
    }

    return true;
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