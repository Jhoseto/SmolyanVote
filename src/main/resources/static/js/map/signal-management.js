// ===== SIGNAL MANAGEMENT JAVASCRIPT =====
// Файл: src/main/resources/static/js/map/signal-management.js

// ===== CONSTANTS =====
const SIGNAL_CATEGORIES = {
    ROAD_DAMAGE: { name: 'Дупки в пътищата', icon: 'bi-cone-striped', color: '#dc3545' },
    SIDEWALK_DAMAGE: { name: 'Счупени тротоари', icon: 'bi-bricks', color: '#6f42c1' },
    LIGHTING: { name: 'Неработещо осветление', icon: 'bi-lightbulb', color: '#fd7e14' },
    TRAFFIC_SIGNS: { name: 'Повредени пътни знаци', icon: 'bi-sign-stop', color: '#e83e8c' },
    WATER_SEWER: { name: 'Водопровод/канализация', icon: 'bi-droplet', color: '#20c997' },
    WASTE_MANAGEMENT: { name: 'Замърсяване на околната среда', icon: 'bi-trash', color: '#6c757d' },
    ILLEGAL_DUMPING: { name: 'Незаконно изхвърляне на отпадъци', icon: 'bi-exclamation-triangle', color: '#dc3545' },
    TREE_ISSUES: { name: 'Проблеми с дървета и растителност', icon: 'bi-tree', color: '#198754' },
    AIR_POLLUTION: { name: 'Замърсяване на въздуха', icon: 'bi-cloud-fog', color: '#495057' },
    NOISE_POLLUTION: { name: 'Шумово замърсяване', icon: 'bi-volume-up', color: '#dc3545' },
    HEALTHCARE: { name: 'Здравеопазване', icon: 'bi-heart-pulse', color: '#dc3545' },
    EDUCATION: { name: 'Образование', icon: 'bi-book', color: '#0d6efd' },
    TRANSPORT: { name: 'Обществен транспорт', icon: 'bi-bus-front', color: '#0dcaf0' },
    PARKING: { name: 'Паркиране', icon: 'bi-p-square', color: '#6c757d' },
    SECURITY: { name: 'Обществена безопасност', icon: 'bi-shield-check', color: '#dc3545' },
    VANDALISM: { name: 'Вандализъм', icon: 'bi-hammer', color: '#dc3545' },
    ACCESSIBILITY: { name: 'Достъпност', icon: 'bi-universal-access', color: '#0d6efd' },
    OTHER: { name: 'Други', icon: 'bi-three-dots', color: '#6c757d' }
};

const URGENCY_LEVELS = {
    low: { name: 'Ниска', icon: 'bi-info-circle', color: '#198754' },
    medium: { name: 'Средна', icon: 'bi-exclamation-circle', color: '#fd7e14' },
    high: { name: 'Висока', icon: 'bi-exclamation-triangle', color: '#dc3545' }
};

// ===== GLOBAL VARIABLES =====
let currentSignals = [];
let activeFilters = {
    category: 'all',
    urgency: 'all',
    search: '',
    sort: 'newest'
};
let locationSelectionMode = false;
let searchTimeout = null;
let isLoading = false;

// ===== STATE MANAGEMENT =====
function saveStateToSessionStorage() {
    try {
        sessionStorage.setItem('signalsState', JSON.stringify({
            currentSignals: currentSignals,
            activeFilters: activeFilters
        }));
    } catch (e) {
        console.warn('Не можах да запазя състоянието:', e);
    }
}

function loadStateFromSessionStorage() {
    try {
        const saved = sessionStorage.getItem('signalsState');
        if (saved) {
            const state = JSON.parse(saved);
            currentSignals = state.currentSignals || [];
            activeFilters = { ...activeFilters, ...state.activeFilters };
            updateUIFromState();
        }
    } catch (e) {
        console.warn('Не можах да заредя запазеното състояние:', e);
    }
}

function updateUIFromState() {
    // Обновяване на филтрите в UI
    const categoryFilter = document.getElementById('categoryFilter');
    const urgencyFilter = document.getElementById('urgencyFilter');
    const sortFilter = document.getElementById('sortFilter');
    const searchInput = document.getElementById('signalSearch');

    if (categoryFilter && activeFilters.category) {
        categoryFilter.value = activeFilters.category;
    }
    if (urgencyFilter && activeFilters.urgency) {
        urgencyFilter.value = activeFilters.urgency;
    }
    if (sortFilter && activeFilters.sort) {
        sortFilter.value = activeFilters.sort;
    }
    if (searchInput && activeFilters.search) {
        searchInput.value = activeFilters.search;
        updateSearchUI();
    }

    // Обновяване на списъка и статистиките
    if (currentSignals.length > 0) {
        updateSignalsList(currentSignals);
        updateStats();
        loadSignals(); // Презареждане на markers
    }
}

// ===== LOADING STATE MANAGEMENT =====
function showLoadingState() {
    isLoading = true;
    const signalsList = document.getElementById('signalsList');
    if (signalsList) {
        signalsList.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Зареждане на сигнали...</p>
            </div>
        `;
    }
}

function hideLoadingState() {
    isLoading = false;
}

function showErrorState(message) {
    const signalsList = document.getElementById('signalsList');
    if (signalsList) {
        signalsList.innerHTML = `
            <div class="error-state">
                <i class="bi bi-exclamation-triangle"></i>
                <p>Грешка: ${message}</p>
                <button class="btn-retry" onclick="loadSignalsData()">
                    <i class="bi bi-arrow-clockwise"></i>
                    Опитай отново
                </button>
            </div>
        `;
    }
}

// ===== DATA LOADING =====
async function loadSignalsData() {
    if (isLoading) return;

    showLoadingState();

    try {
        const params = new URLSearchParams();

        // Добавяне на филтри като параметри
        if (activeFilters.search) params.append('search', activeFilters.search);
        if (activeFilters.category !== 'all') params.append('category', activeFilters.category);
        if (activeFilters.urgency !== 'all') params.append('urgency', activeFilters.urgency);
        if (activeFilters.sort) params.append('sort', activeFilters.sort);

        const url = '/signals' + (params.toString() ? '?' + params.toString() : '');

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const signals = await response.json();

        // Валидация на данните
        if (!Array.isArray(signals)) {
            throw new Error('Невалиден формат на данните от сървъра');
        }

        currentSignals = signals;

        // Запазване на състоянието
        saveStateToSessionStorage();

        // Обновяване на UI
        loadSignals();
        updateSignalsList(currentSignals);
        updateStats();

        hideLoadingState();

        if (window.mapCore && window.mapCore.showNotification) {
            window.mapCore.showNotification(`Заредени са ${signals.length} сигнала`, 'success');
        }

    } catch (error) {
        console.error('Грешка при зареждане на сигнали:', error);
        hideLoadingState();
        showErrorState(error.message);

        if (window.mapCore && window.mapCore.showNotification) {
            window.mapCore.showNotification('Грешка при зареждане на сигналите', 'error');
        }
    }
}

// ===== SIGNAL MARKERS CREATION =====
function createSignalMarker(signal) {
    // Валидация на сигнала
    if (!signal || !signal.coordinates || !Array.isArray(signal.coordinates)) {
        console.warn('Невалиден сигнал за marker:', signal);
        return null;
    }

    const category = SIGNAL_CATEGORIES[signal.category];
    const urgency = URGENCY_LEVELS[signal.urgency];

    if (!category || !urgency) {
        console.warn('Неизвестна категория или спешност:', signal.category, signal.urgency);
        return null;
    }

    const icon = L.divIcon({
        className: 'signal-marker',
        html: `<div class="signal-marker-content" style="background-color: ${category.color}; border-color: ${urgency.color};">
                <i class="${category.icon}"></i>
               </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
    });

    const marker = L.marker(signal.coordinates, { icon });

    // Добавяне на данни към marker-а
    marker.signalData = signal;

    // Event listeners
    marker.on('click', function() {
        if (typeof openSignalModal === 'function') {
            openSignalModal(signal);
        } else {
            console.warn('openSignalModal функцията не е достъпна');
        }
    });

    // Hover events за tooltip само на desktop
    if (!window.mapCore?.isMobile()) {
        marker.on('mouseover', function(e) {
            if (window.signalTooltip && typeof window.signalTooltip.show === 'function') {
                window.signalTooltip.show(signal, e.originalEvent);
            }
        });

        marker.on('mouseout', function() {
            if (window.signalTooltip && typeof window.signalTooltip.hide === 'function') {
                window.signalTooltip.hide();
            }
        });
    }

    return marker;
}

// ===== SIGNALS LOADING AND FILTERING =====
function loadSignals() {
    const markersCluster = window.mapCore?.getMarkersCluster();
    if (!markersCluster) {
        console.warn('Map cluster не е готов още');
        return;
    }

    try {
        // Изчистваме старите markers
        markersCluster.clearLayers();

        // Добавяме новите markers
        let addedMarkers = 0;
        currentSignals.forEach(signal => {
            const marker = createSignalMarker(signal);
            if (marker) {
                markersCluster.addLayer(marker);
                addedMarkers++;
            }
        });

        console.log(`Добавени ${addedMarkers} markers от ${currentSignals.length} сигнала`);

    } catch (error) {
        console.error('Грешка при зареждане на markers:', error);
    }
}

// ===== FILTERING =====
async function applyFilters() {
    if (isLoading) return;

    try {
        // Актуализиране на филтрите от UI
        const categoryFilter = document.getElementById('categoryFilter');
        const urgencyFilter = document.getElementById('urgencyFilter');
        const sortFilter = document.getElementById('sortFilter');

        if (categoryFilter) activeFilters.category = categoryFilter.value || 'all';
        if (urgencyFilter) activeFilters.urgency = urgencyFilter.value || 'all';
        if (sortFilter) activeFilters.sort = sortFilter.value || 'newest';

        // Зареждане на данните с новите филтри
        await loadSignalsData();

    } catch (error) {
        console.error('Грешка при прилагане на филтрите:', error);
        if (window.mapCore && window.mapCore.showNotification) {
            window.mapCore.showNotification('Грешка при прилагане на филтрите', 'error');
        }
    }
}

function clearFilters() {
    // Reset на филтрите
    activeFilters = {
        category: 'all',
        urgency: 'all',
        search: '',
        sort: 'newest'
    };

    // Reset на UI елементите
    updateUIFromState();

    // Скриване на search резултатите
    hideSearchResults();

    // Презареждане на данните
    loadSignalsData();
}

// ===== SEARCH FUNCTIONALITY =====
function initializeSearch() {
    const searchInput = document.getElementById('signalSearch');
    const clearButton = document.getElementById('clearSearch');

    if (!searchInput) return;

    // Input event за search
    searchInput.addEventListener('input', function(e) {
        const value = e.target.value.trim();

        updateSearchUI();

        // Debounce search
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(value);
        }, 500);
    });

    // Clear button event
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            searchInput.value = '';
            activeFilters.search = '';
            updateSearchUI();
            hideSearchResults();
            loadSignalsData();
        });
    }

    // Enter key submit
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(searchTimeout);
            performSearch(e.target.value.trim());
        }
    });
}

function updateSearchUI() {
    const searchInput = document.getElementById('signalSearch');
    const clearButton = document.getElementById('clearSearch');

    if (!searchInput) return;

    const hasValue = searchInput.value.trim().length > 0;

    if (clearButton) {
        clearButton.style.display = hasValue ? 'flex' : 'none';
    }
}

async function performSearch(searchTerm) {
    activeFilters.search = searchTerm;

    if (searchTerm.length === 0) {
        hideSearchResults();
    }

    await loadSignalsData();
}

function hideSearchResults() {
    // Скриване на search overlay ако има такъв
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
        searchResults.style.display = 'none';
    }
}

// ===== SIGNALS LIST UPDATE =====
function updateSignalsList(signals) {
    const signalsList = document.getElementById('signalsList');
    if (!signalsList) return;

    if (!signals || signals.length === 0) {
        signalsList.innerHTML = `
            <div class="no-signals-message">
                <i class="bi bi-inbox"></i>
                <h4>Няма намерени сигнали</h4>
                <p>Опитайте да промените филтрите или създайте нов сигнал.</p>
            </div>
        `;
        return;
    }

    const signalsHTML = signals.map(signal => createSignalCard(signal)).join('');
    signalsList.innerHTML = signalsHTML;
}

function createSignalCard(signal) {
    // Валидация на сигнала
    if (!signal) return '';

    const category = SIGNAL_CATEGORIES[signal.category];
    const urgency = URGENCY_LEVELS[signal.urgency];

    if (!category || !urgency) {
        console.warn('Неизвестна категория или спешност за карта:', signal.category, signal.urgency);
        return '';
    }

    // Безопасно създаване на avatar
    const authorAvatarHTML = signal.author && window.avatarUtils ?
        window.avatarUtils.createAvatar(signal.author.imageUrl, signal.author.username, 32, 'author-avatar') :
        `<img class="author-avatar" src="${signal.author?.imageUrl || '/images/default-avatar.png'}" 
             alt="${signal.author?.username || 'Неизвестен'}" 
             style="width:32px;height:32px;border-radius:50%;" 
             onerror="this.src='/images/default-avatar.png'">`;

    // Безопасно форматиране на дата
    const formattedDate = signal.createdAt ?
        new Date(signal.createdAt).toLocaleDateString('bg-BG') :
        'Неизвестна дата';

    return `
        <div class="signal-card" onclick="openSignalModal(${signal.id})" data-signal-id="${signal.id}">
            <div class="signal-header">
                <div class="signal-category">
                    <i class="${category.icon}" style="color: ${category.color}"></i>
                    <span>${category.name}</span>
                </div>
                <div class="signal-urgency urgency-${signal.urgency}">
                    <i class="${urgency.icon}"></i>
                    ${urgency.name}
                </div>
            </div>
            <h4 class="signal-title">${signal.title || 'Без заглавие'}</h4>
            <p class="signal-description">${(signal.description || 'Без описание').substring(0, 150)}${signal.description && signal.description.length > 150 ? '...' : ''}</p>
            <div class="signal-footer">
                <div class="signal-author">
                    ${authorAvatarHTML}
                    <span class="author-name">${signal.author?.username || 'Неизвестен'}</span>
                </div>
                <span class="signal-date">${formattedDate}</span>
            </div>
        </div>
    `;
}

// ===== STATISTICS =====
function updateStats() {
    const totalCount = currentSignals.length;
    const urgencyStats = {
        high: currentSignals.filter(s => s.urgency === 'high').length,
        medium: currentSignals.filter(s => s.urgency === 'medium').length,
        low: currentSignals.filter(s => s.urgency === 'low').length
    };

    // Обновяване на брояча в tab-а
    const signalsTabCounter = document.getElementById('signalsTabCounter');
    if (signalsTabCounter) {
        signalsTabCounter.textContent = totalCount;
    }

    // Обновяване на други статистики ако има такива
    const totalCountElement = document.getElementById('totalSignalsCount');
    if (totalCountElement) {
        totalCountElement.textContent = totalCount;
    }

    // Обновяване на urgency статистики
    Object.keys(urgencyStats).forEach(urgency => {
        const element = document.getElementById(`${urgency}UrgencyCount`);
        if (element) {
            element.textContent = urgencyStats[urgency];
        }
    });
}

// ===== FORM HANDLING =====
function validateSignalForm(formData) {
    const errors = [];

    // Валидация на заглавието
    const title = formData.get('title')?.trim();
    if (!title || title.length < 5) {
        errors.push('Заглавието трябва да е поне 5 символа');
    }
    if (title && title.length > 200) {
        errors.push('Заглавието не може да е повече от 200 символа');
    }

    // Валидация на описанието
    const description = formData.get('description')?.trim();
    if (!description || description.length < 10) {
        errors.push('Описанието трябва да е поне 10 символа');
    }
    if (description && description.length > 2000) {
        errors.push('Описанието не може да е повече от 2000 символа');
    }

    // Валидация на категорията
    const category = formData.get('category');
    if (!category || !SIGNAL_CATEGORIES[category]) {
        errors.push('Моля изберете валидна категория');
    }

    // Валидация на спешността
    const urgency = formData.get('urgency');
    if (!urgency || !URGENCY_LEVELS[urgency]) {
        errors.push('Моля изберете валидна спешност');
    }

    // Валидация на координатите
    const latitude = formData.get('latitude');
    const longitude = formData.get('longitude');
    if (!latitude || !longitude) {
        errors.push('Моля изберете местоположение на картата');
    } else {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        if (isNaN(lat) || isNaN(lng)) {
            errors.push('Невалидни координати');
        }
        // Проверка дали координатите са в разумни граници за България
        if (lat < 41.0 || lat > 44.5 || lng < 22.0 || lng > 29.0) {
            errors.push('Координатите трябва да са в България');
        }
    }

    // Валидация на снимката (ако има)
    const image = formData.get('image');
    if (image && image.size > 0) {
        // Проверка на размера (5MB максимум)
        if (image.size > 5 * 1024 * 1024) {
            errors.push('Снимката не може да е по-голяма от 5MB');
        }

        // Проверка на типа
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(image.type)) {
            errors.push('Снимката трябва да е във формат JPG, PNG или WebP');
        }
    }

    return errors;
}

async function handleCreateSignal(event) {
    event.preventDefault();

    // Проверка за автентикация
    if (!window.isAuthenticated) {
        if (typeof window.showLoginWarning === 'function') {
            window.showLoginWarning();
        } else {
            alert('За да създадете сигнал, моля влезте в системата!');
        }
        return;
    }

    const form = event.target;
    const formData = new FormData(form);

    // Валидация на формата
    const errors = validateSignalForm(formData);
    if (errors.length > 0) {
        showFormErrors(errors);
        return;
    }

    try {
        // Показване на loading състояние
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<div class="loading-spinner"></div> Изпращане...';

        const response = await fetch('/signals', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `HTTP ${response.status}`);
        }

        // Успешно създаване
        if (window.mapCore && window.mapCore.showNotification) {
            window.mapCore.showNotification('Сигналът беше създаден успешно!', 'success');
        }

        // Reset на формата
        form.reset();
        clearLocationSelection();

        // Затваряне на панела
        if (window.closePanel) {
            window.closePanel('newSignal');
        }

        // Презареждане на данните
        await loadSignalsData();

        // Възстановяване на бутона
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;

    } catch (error) {
        console.error('Грешка при създаване на сигнал:', error);

        if (window.mapCore && window.mapCore.showNotification) {
            window.mapCore.showNotification('Грешка при създаване на сигнала: ' + error.message, 'error');
        }

        // Възстановяване на бутона
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="bi bi-send"></i> Изпрати сигнал';
        }
    }
}

function showFormErrors(errors) {
    // Премахване на стари грешки
    const existingErrors = document.querySelectorAll('.form-error');
    existingErrors.forEach(error => error.remove());

    // Показване на нови грешки
    if (window.mapCore && window.mapCore.showNotification) {
        window.mapCore.showNotification(errors.join('; '), 'error');
    } else {
        alert('Грешки в формата:\n' + errors.join('\n'));
    }
}

// ===== LOCATION SELECTION =====
function toggleLocationSelection() {
    const btn = document.getElementById('selectLocationBtn');
    if (!btn) return;

    if (locationSelectionMode) {
        // Изключване на режима
        disableLocationSelection();
    } else {
        // Включване на режима
        enableLocationSelection();
    }
}

function enableLocationSelection() {
    locationSelectionMode = true;
    const btn = document.getElementById('selectLocationBtn');
    if (btn) {
        btn.innerHTML = '<i class="bi bi-geo-alt"></i> <span>Кликнете на картата</span>';
        btn.classList.add('selecting');
        btn.classList.remove('selected');
    }

    // Промяна на курсора на картата
    if (window.mapCore && window.mapCore.getMap) {
        const map = window.mapCore.getMap();
        if (map) {
            map.getContainer().style.cursor = 'crosshair';
        }
    }

    if (window.mapCore && window.mapCore.showNotification) {
        window.mapCore.showNotification('Кликнете на картата за да изберете местоположение', 'info');
    }
}

function disableLocationSelection() {
    locationSelectionMode = false;
    const btn = document.getElementById('selectLocationBtn');
    if (btn) {
        btn.innerHTML = '<i class="bi bi-geo-alt"></i> <span>Изберете местоположение</span>';
        btn.classList.remove('selecting');
    }

    // Възстановяване на курсора на картата
    if (window.mapCore && window.mapCore.getMap) {
        const map = window.mapCore.getMap();
        if (map) {
            map.getContainer().style.cursor = '';
        }
    }
}

function clearLocationSelection() {
    const latInput = document.getElementById('signalLatitude');
    const lngInput = document.getElementById('signalLongitude');
    const btn = document.getElementById('selectLocationBtn');

    if (latInput) latInput.value = '';
    if (lngInput) lngInput.value = '';

    if (btn) {
        btn.innerHTML = '<i class="bi bi-geo-alt"></i> <span>Изберете местоположение</span>';
        btn.classList.remove('selecting', 'selected');
    }

    disableLocationSelection();
}

// ===== MAP CLICK HANDLER FOR LOCATION SELECTION =====
function onMapClick(e) {
    if (!locationSelectionMode || !e.latlng) return;

    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    // Проверка дали координатите са в България
    if (lat < 41.0 || lat > 44.5 || lng < 22.0 || lng > 29.0) {
        if (window.mapCore && window.mapCore.showNotification) {
            window.mapCore.showNotification('Моля изберете местоположение в България', 'warning');
        }
        return;
    }

    // Записваме координатите в формуляра
    const latInput = document.getElementById('signalLatitude');
    const lngInput = document.getElementById('signalLongitude');

    if (latInput) latInput.value = lat.toFixed(6);
    if (lngInput) lngInput.value = lng.toFixed(6);

    // Обновяваме бутона
    const btn = document.getElementById('selectLocationBtn');
    if (btn) {
        btn.innerHTML = '<i class="bi bi-geo-alt-fill"></i> <span>Местоположение избрано</span>';
        btn.classList.remove('selecting');
        btn.classList.add('selected');
    }

    // Изключваме режима за избор
    disableLocationSelection();

    if (window.mapCore && window.mapCore.showNotification) {
        window.mapCore.showNotification('Местоположението е избрано', 'success');
    }
}

// ===== UTILITY FUNCTIONS =====
function selectSignalFromSearch(signalId) {
    const signal = currentSignals.find(s => s.id == signalId);
    if (signal && typeof openSignalModal === 'function') {
        openSignalModal(signal);
        hideSearchResults();
    }
}

function getCurrentSignals() {
    return currentSignals;
}

function getActiveFilters() {
    return { ...activeFilters };
}

function getSignalById(id) {
    return currentSignals.find(s => s.id == id);
}

// ===== EVENT LISTENERS INITIALIZATION =====
function initializeSignalEventListeners() {
    console.log('🔧 Инициализиране на signal event listeners...');

    // Filter events
    const categoryFilter = document.getElementById('categoryFilter');
    const urgencyFilter = document.getElementById('urgencyFilter');
    const sortFilter = document.getElementById('sortFilter');
    const selectLocationBtn = document.getElementById('selectLocationBtn');
    const createSignalForm = document.getElementById('createSignalForm');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
        console.log('✅ Category filter listener добавен');
    }

    if (urgencyFilter) {
        urgencyFilter.addEventListener('change', applyFilters);
        console.log('✅ Urgency filter listener добавен');
    }

    if (sortFilter) {
        sortFilter.addEventListener('change', applyFilters);
        console.log('✅ Sort filter listener добавен');
    }

    if (selectLocationBtn) {
        selectLocationBtn.addEventListener('click', toggleLocationSelection);
        console.log('✅ Location selection listener добавен');
    }

    if (createSignalForm) {
        createSignalForm.addEventListener('submit', handleCreateSignal);
        console.log('✅ Create signal form listener добавен');
    }

    // Инициализиране на search функционалността
    initializeSearch();

    console.log('✅ Signal event listeners инициализирани');
}

// ===== INITIALIZATION =====
function initializeSignalManagement() {
    console.log('🚀 Инициализиране на signal management...');

    // Зареждане на запазеното състояние
    loadStateFromSessionStorage();

    // Инициализиране на event listeners
    initializeSignalEventListeners();

    // Зареждане на данните ако няма запазени
    if (currentSignals.length === 0) {
        loadSignalsData();
    }

    console.log('✅ Signal management инициализиран');
}

// ===== PUBLIC API =====
window.signalManagement = {
    // Data methods
    loadSignalsData,
    getCurrentSignals,
    getActiveFilters,
    getSignalById,

    // UI methods
    loadSignals,
    createSignalMarker,
    updateSignalsList,
    updateStats,

    // Filter methods
    applyFilters,
    clearFilters,

    // Search methods
    initializeSearch,
    performSearch: (term) => performSearch(term),
    hideSearchResults,
    selectSignalFromSearch,

    // Form methods
    handleCreateSignal,
    validateSignalForm,

    // Location methods
    toggleLocationSelection,
    onMapClick,
    clearLocationSelection,

    // Event listeners
    initializeSignalEventListeners,

    // Initialization
    initialize: initializeSignalManagement,

    // Constants export
    SIGNAL_CATEGORIES,
    URGENCY_LEVELS,

    // Legacy methods for backward compatibility
    refreshSignals: loadSignalsData
};

// ===== AUTO INITIALIZATION =====
// Автоматично инициализиране когато DOM е готов
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSignalManagement);
} else {
    // DOM вече е зареден
    initializeSignalManagement();
}

// Export за modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.signalManagement;
}