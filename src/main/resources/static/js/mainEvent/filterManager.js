// ====== FILTER MANAGER - URL & LOCALSTORAGE ======
// Файл: src/main/resources/static/js/mainEvent/filterManager.js

/**
 * Управление на филтрите - запазване в URL и localStorage
 */
class FilterManager {
    constructor() {
        this.storageKey = 'smolyanVote_eventFilters';
        this.preferencesKey = 'smolyanVote_filterPreferences';
        this.init();
    }

    /**
     * Инициализация
     */
    init() {
        // Възстановяване на предпочитанията при зареждане
        this.restorePreferences();
        
        // Слушане за промени в URL (back/forward бутони)
        window.addEventListener('popstate', () => {
            this.syncFromURL();
        });
        
        console.log('FilterManager initialized');
    }

    /**
     * Взима всички филтри от формата
     */
    getAllFilters() {
        const filters = {};
        
        // Търсене
        const searchInput = document.getElementById('eventSearch');
        if (searchInput && searchInput.value.trim()) {
            filters.search = searchInput.value.trim();
        }
        
        // Локация
        const locationSelect = document.querySelector('select[name="location"]');
        if (locationSelect && locationSelect.value) {
            filters.location = locationSelect.value;
        }
        
        // Тип събитие
        const typeSelect = document.querySelector('select[name="type"]');
        if (typeSelect && typeSelect.value) {
            filters.type = typeSelect.value;
        }
        
        // Статус
        const statusSelect = document.querySelector('select[name="status"]');
        if (statusSelect && statusSelect.value) {
            filters.status = statusSelect.value;
        }
        
        // Сортиране
        const sortSelect = document.querySelector('select[name="sort"]');
        if (sortSelect && sortSelect.value) {
            filters.sort = sortSelect.value;
        }
        
        // Дата период
        const datePeriodSelect = document.querySelector('select[name="datePeriod"]');
        if (datePeriodSelect && datePeriodSelect.value) {
            filters.datePeriod = datePeriodSelect.value;
        }
        
        // Популярност
        const popularitySelect = document.querySelector('select[name="popularity"]');
        if (popularitySelect && popularitySelect.value) {
            filters.popularity = popularitySelect.value;
        }
        
        // Quick filter
        const urlParams = new URLSearchParams(window.location.search);
        const quickFilter = urlParams.get('quickFilter');
        if (quickFilter) {
            filters.quickFilter = quickFilter;
        }
        
        // View mode
        const viewMode = localStorage.getItem('eventsViewMode') || 'grid';
        filters.viewMode = viewMode;
        
        // Page size
        const pageSizeSelect = document.getElementById('pageSizeSelect');
        if (pageSizeSelect && pageSizeSelect.value) {
            filters.size = pageSizeSelect.value;
        }
        
        return filters;
    }

    /**
     * Обновява URL с текущите филтри
     */
    updateURL(filters = null, options = {}) {
        if (!filters) {
            filters = this.getAllFilters();
        }
        
        const url = new URL(window.location);
        
        // Изчистване на старите параметри (освен page)
        const currentPage = url.searchParams.get('page') || '0';
        
        // Премахване на всички параметри освен page
        const paramsToKeep = options.keepPage ? ['page'] : [];
        for (const key of url.searchParams.keys()) {
            if (!paramsToKeep.includes(key)) {
                url.searchParams.delete(key);
            }
        }
        
        // Добавяне на новите филтри
        Object.keys(filters).forEach(key => {
            if (filters[key] && filters[key] !== 'all' && filters[key] !== '') {
                url.searchParams.set(key, filters[key]);
            }
        });
        
        // Възстановяване на страницата ако е нужно
        if (options.keepPage && currentPage !== '0') {
            url.searchParams.set('page', currentPage);
        } else if (!options.resetPage) {
            // Ако не се ресетва страницата, запазваме текущата
            if (currentPage !== '0') {
                url.searchParams.set('page', currentPage);
            }
        } else {
            // Ресетване на страницата
            url.searchParams.delete('page');
        }
        
        // Обновяване на URL без презареждане
        window.history.pushState({ filters }, '', url);
        
        // Запазване в localStorage
        this.saveToLocalStorage(filters);
    }

    /**
     * Запазва филтрите в localStorage
     */
    saveToLocalStorage(filters) {
        try {
            const data = {
                filters: filters,
                timestamp: Date.now()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save filters to localStorage:', e);
        }
    }

    /**
     * Запазва предпочитанията в localStorage
     */
    savePreferences(preferences) {
        try {
            localStorage.setItem(this.preferencesKey, JSON.stringify(preferences));
        } catch (e) {
            console.warn('Failed to save preferences to localStorage:', e);
        }
    }

    /**
     * Взима предпочитанията от localStorage
     */
    getPreferences() {
        try {
            const data = localStorage.getItem(this.preferencesKey);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.warn('Failed to get preferences from localStorage:', e);
            return {};
        }
    }

    /**
     * Възстановява предпочитанията при зареждане
     */
    restorePreferences() {
        const preferences = this.getPreferences();
        
        // Възстановяване на view mode
        if (preferences.viewMode) {
            const viewModeFromUrl = new URLSearchParams(window.location.search).get('viewMode');
            if (!viewModeFromUrl && preferences.viewMode) {
                localStorage.setItem('eventsViewMode', preferences.viewMode);
            }
        }
        
        // Възстановяване на page size
        if (preferences.pageSize) {
            const pageSizeSelect = document.getElementById('pageSizeSelect');
            if (pageSizeSelect && !pageSizeSelect.value) {
                pageSizeSelect.value = preferences.pageSize;
            }
        }
    }

    /**
     * Синхронизира филтрите от URL
     */
    syncFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Обновяване на формата с параметрите от URL
        const searchInput = document.getElementById('eventSearch');
        if (searchInput && urlParams.has('search')) {
            searchInput.value = urlParams.get('search');
        }
        
        const locationSelect = document.querySelector('select[name="location"]');
        if (locationSelect && urlParams.has('location')) {
            locationSelect.value = urlParams.get('location');
        }
        
        const typeSelect = document.querySelector('select[name="type"]');
        if (typeSelect && urlParams.has('type')) {
            typeSelect.value = urlParams.get('type');
        }
        
        const statusSelect = document.querySelector('select[name="status"]');
        if (statusSelect && urlParams.has('status')) {
            statusSelect.value = urlParams.get('status');
        }
        
        const sortSelect = document.querySelector('select[name="sort"]');
        if (sortSelect && urlParams.has('sort')) {
            sortSelect.value = urlParams.get('sort');
        }
        
        const datePeriodSelect = document.querySelector('select[name="datePeriod"]');
        if (datePeriodSelect && urlParams.has('datePeriod')) {
            datePeriodSelect.value = urlParams.get('datePeriod');
        }
        
        const popularitySelect = document.querySelector('select[name="popularity"]');
        if (popularitySelect && urlParams.has('popularity')) {
            popularitySelect.value = urlParams.get('popularity');
        }
        
        const pageSizeSelect = document.getElementById('pageSizeSelect');
        if (pageSizeSelect && urlParams.has('size')) {
            pageSizeSelect.value = urlParams.get('size');
        }
    }

    /**
     * Генерира shareable линк с текущите филтри
     */
    getShareableLink() {
        const filters = this.getAllFilters();
        const url = new URL(window.location.origin + window.location.pathname);
        
        Object.keys(filters).forEach(key => {
            if (filters[key] && filters[key] !== 'all' && filters[key] !== '') {
                url.searchParams.set(key, filters[key]);
            }
        });
        
        return url.toString();
    }

    /**
     * Копира shareable линк в clipboard
     */
    async copyShareableLink() {
        try {
            const link = this.getShareableLink();
            await navigator.clipboard.writeText(link);
            return true;
        } catch (e) {
            console.warn('Failed to copy link:', e);
            // Fallback за стари браузъри
            const textArea = document.createElement('textarea');
            textArea.value = this.getShareableLink();
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (err) {
                document.body.removeChild(textArea);
                return false;
            }
        }
    }

    /**
     * Изчиства всички филтри
     */
    clearAllFilters() {
        // Изчистване на формата
        const searchInput = document.getElementById('eventSearch');
        if (searchInput) {
            searchInput.value = '';
        }
        
        const selects = document.querySelectorAll('.filter-dropdown select');
        selects.forEach(select => {
            select.value = '';
        });
        
        // Изчистване на URL
        const url = new URL(window.location);
        url.search = '';
        window.history.pushState({}, '', url);
        
        // Изчистване на localStorage
        localStorage.removeItem(this.storageKey);
    }
}

// Създаване на глобален инстанс
window.filterManager = new FilterManager();

