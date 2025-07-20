// ===== SIGNAL MANAGEMENT =====
// Създаване, филтриране, показване на сигнали с API интеграция

// ===== GLOBAL VARIABLES =====
let currentSignals = [];
let activeFilters = {
    category: 'all',
    urgency: 'all',
    search: '',
    sort: 'newest'
};
let filtersExpanded = false;
let locationSelectionMode = false;

// ===== SIGNAL CATEGORIES & URGENCY LEVELS =====
// ⚠️ ВАЖНО: Тези трябва да съвпадат с HTML option values!
// ===== SIGNAL CATEGORIES CONFIGURATION =====
const SIGNAL_CATEGORIES = {
    // Инфраструктура
    'ROAD_DAMAGE': {name: 'Дупки в пътищата', icon: 'bi-exclamation-triangle-fill', color: '#ef4444'},
    'SIDEWALK_DAMAGE': {name: 'Счупени тротоари', icon: 'bi-bricks', color: '#f97316'},
    'LIGHTING': {name: 'Неработещо осветление', icon: 'bi-lightbulb', color: '#eab308'},
    'TRAFFIC_SIGNS': {name: 'Повредени пътни знаци', icon: 'bi-sign-stop', color: '#dc2626'},
    'WATER_SEWER': {name: 'Водопровод/канализация', icon: 'bi-droplet-fill', color: '#0ea5e9'},
    // Околна среда
    'WASTE_MANAGEMENT': {name: 'Замърсяване на околната среда', icon: 'bi-trash-fill', color: '#16a34a'},
    'ILLEGAL_DUMPING': {name: 'Незаконно изхвърляне на отпадъци', icon: 'bi-exclamation-octagon-fill', color: '#dc2626'},
    'TREE_ISSUES': {name: 'Проблеми с дървета и растителност', icon: 'bi-tree-fill', color: '#059669'},
    'AIR_POLLUTION': {name: 'Замърсяване на въздуха', icon: 'bi-cloud-fog-fill', color: '#6b7280'},
    'NOISE_POLLUTION': {name: 'Шумово замърсяване', icon: 'bi-volume-up-fill', color: '#7c3aed'},
    // Обществени услуги
    'HEALTHCARE': {name: 'Здравеопазване', icon: 'bi-heart-pulse-fill', color: '#ec4899'},
    'EDUCATION': {name: 'Образование', icon: 'bi-book-fill', color: '#3b82f6'},
    'TRANSPORT': {name: 'Обществен транспорт', icon: 'bi-bus-front-fill', color: '#8b5cf6'},
    'PARKING': {name: 'Паркиране', icon: 'bi-car-front-fill', color: '#06b6d4'},
    // Безопасност
    'SECURITY': {name: 'Обществена безопасност', icon: 'bi-shield-fill-exclamation', color: '#dc2626'},
    'VANDALISM': {name: 'Вандализъм', icon: 'bi-hammer', color: '#b91c1c'},
    'ACCESSIBILITY': {name: 'Достъпност', icon: 'bi-universal-access-circle', color: '#0891b2'},
    // Други
    'OTHER': {name: 'Други', icon: 'bi-three-dots', color: '#6b7280'}
};

// ===== URGENCY LEVELS CONFIGURATION =====
const URGENCY_LEVELS = {
    'HIGH': {name: 'Висока', icon: 'bi-exclamation-triangle-fill', color: '#dc2626'},
    'MEDIUM': {name: 'Средна', icon: 'bi-exclamation-circle-fill', color: '#ea580c'},
    'LOW': {name: 'Ниска', icon: 'bi-info-circle-fill', color: '#16a34a'}
};

// ===== SIGNAL DATA LOADING =====
async function loadSignalsData() {
    try {
        console.log('🔄 Loading signals data...');

        // Зареждане на сигналите от API
        const response = await fetch(`/signals${buildQueryString()}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const signals = await response.json();
        currentSignals = signals || [];

        // Зареждане на сигналите на картата и в списъка
        loadSignals();
        updateStats();

        console.log('✅ Signals data loaded successfully:', currentSignals.length);

    } catch (error) {
        console.error('❌ Error loading signals data:', error);

        // Показване на грешката
        if (window.mapCore && window.mapCore.showNotification) {
            window.mapCore.showNotification('Грешка при зареждане на сигналите', 'error');
        }

        // Fallback към празен масив при грешка
        currentSignals = [];
        loadSignals();
        updateStats();
    }
}

// Помощна функция за query string
function buildQueryString() {
    const params = new URLSearchParams();

    if (activeFilters.category && activeFilters.category !== 'all') {
        params.append('category', activeFilters.category);
    }

    if (activeFilters.urgency && activeFilters.urgency !== 'all') {
        params.append('urgency', activeFilters.urgency);
    }

    if (activeFilters.search && activeFilters.search.trim()) {
        params.append('search', activeFilters.search.trim());
    }

    if (activeFilters.sort) {
        params.append('sort', activeFilters.sort);
    }

    return params.toString() ? '?' + params.toString() : '';
}

// ===== SIGNAL MARKERS CREATION =====
function createSignalMarker(signal) {
    const category = SIGNAL_CATEGORIES[signal.category];
    const urgency = URGENCY_LEVELS[signal.urgency];

    if (!category || !urgency) {
        console.warn('Unknown category or urgency:', signal.category, signal.urgency);
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
        openSignalModal(signal);
    });

    // Hover events за tooltip
    marker.on('mouseover', function(e) {
        if (window.signalTooltip && !window.mapCore?.isMobile()) {
            window.signalTooltip.show(signal, e.originalEvent);
        }
    });

    marker.on('mouseout', function() {
        if (window.signalTooltip && !window.mapCore?.isMobile()) {
            window.signalTooltip.hide();
        }
    });

    return marker;
}

// ===== SIGNALS LOADING AND FILTERING =====
function loadSignals() {
    const markersCluster = window.mapCore?.getMarkersCluster();
    if (!markersCluster) {
        console.warn('Map cluster not ready yet');
        return;
    }

    // Изчистваме старите markers
    markersCluster.clearLayers();

    // Добавяме новите markers
    currentSignals.forEach(signal => {
        const marker = createSignalMarker(signal);
        if (marker) {
            markersCluster.addLayer(marker);
        }
    });

    // Обновяваме списъка със сигнали
    updateSignalsList(currentSignals);
}

// ===== FILTERING =====
async function applyFilters() {
    try {
        // Актуализиране на филтрите от UI
        activeFilters.category = document.getElementById('categoryFilter')?.value || 'all';
        activeFilters.urgency = document.getElementById('urgencyFilter')?.value || 'all';
        activeFilters.sort = document.getElementById('sortFilter')?.value || 'newest';

        // Зареждане на данните с новите филтри
        await loadSignalsData();

    } catch (error) {
        console.error('Error applying filters:', error);
        if (window.mapCore && window.mapCore.showNotification) {
            window.mapCore.showNotification('Грешка при прилагане на филтрите', 'error');
        }
    }
}

function clearFilters() {
    activeFilters = {
        category: 'all',
        urgency: 'all',
        search: '',
        sort: 'newest'
    };

    // Reset UI elements
    const categoryFilter = document.getElementById('categoryFilter');
    const urgencyFilter = document.getElementById('urgencyFilter');
    const sortFilter = document.getElementById('sortFilter');
    const searchInput = document.getElementById('signalSearch');

    if (categoryFilter) categoryFilter.value = 'all';
    if (urgencyFilter) urgencyFilter.value = 'all';
    if (sortFilter) sortFilter.value = 'newest';
    if (searchInput) searchInput.value = '';

    // Hide clear search button
    const clearButton = document.getElementById('clearSearch');
    if (clearButton) clearButton.style.display = 'none';

    // Reload data
    loadSignalsData();
    hideSearchResults();
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

    console.log('📊 Stats updated:', { total: totalCount, urgency: urgencyStats });
}

// ===== SIGNALS LIST DISPLAY =====
function updateSignalsList(signals) {
    const container = document.getElementById('signalsList');
    if (!container) return;

    if (signals.length === 0) {
        container.innerHTML = `
            <div class="no-signals" style="text-align: center; padding: 2rem 1rem; color: var(--gray-500);">
                <i class="bi bi-inbox" style="font-size: 2rem; margin-bottom: 1rem; color: var(--gray-400);"></i>
                <h4 style="font-size: 1rem; margin-bottom: 0.5rem;">Няма сигнали</h4>
                <p style="font-size: 0.85rem;">Не са намерени сигнали отговарящи на филтрите</p>
            </div>
        `;
        return;
    }

    // Сортиране на сигналите
    const sortBy = activeFilters.sort;
    signals.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'oldest':
                return new Date(a.createdAt) - new Date(b.createdAt);
            case 'urgency':
                const urgencyOrder = { high: 3, medium: 2, low: 1 };
                return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
            case 'category':
                return a.category?.localeCompare(b.category) || 0;
            default:
                return 0;
        }
    });

    container.innerHTML = signals.map(signal => createSignalCard(signal)).join('');
}

function createSignalCard(signal) {
    const category = SIGNAL_CATEGORIES[signal.category];
    const urgency = URGENCY_LEVELS[signal.urgency];

    if (!category || !urgency) {
        console.warn('Missing category or urgency data for signal:', signal.id);
        return '';
    }

    // Създаване на avatar за автора
    const authorAvatarHTML = window.avatarUtils ?
        window.avatarUtils.createAvatar(signal.author?.imageUrl, signal.author?.username, 32, 'author-avatar') :
        `<img class="author-avatar" src="${signal.author?.imageUrl || '/images/default-avatar.png'}" alt="${signal.author?.username || 'Неизвестен'}" style="width:32px;height:32px;border-radius:50%;">`;

    return `
        <div class="signal-card" onclick="openSignalModal(${signal.id})">
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
            <p class="signal-description">${signal.description || 'Без описание'}</p>
            <div class="signal-footer">
                <div class="signal-author">
                    ${authorAvatarHTML}
                    <span class="author-name">${signal.author?.username || 'Неизвестен'}</span>
                </div>
                <span class="signal-date">${signal.createdAt ?
        new Date(signal.createdAt).toLocaleDateString('bg-BG') : ''}</span>
            </div>
        </div>
    `;
}

// ===== SEARCH FUNCTIONALITY =====
let searchTimeout;

function initializeSearch() {
    const searchInput = document.getElementById('signalSearch');
    const clearButton = document.getElementById('clearSearch');

    if (!searchInput) return;

    searchInput.addEventListener('input', function(e) {
        const value = e.target.value.trim();

        // Show/hide clear button
        if (clearButton) {
            clearButton.style.display = value ? 'block' : 'none';
        }

        // Debounce search
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            activeFilters.search = value;

            if (value.length >= 2) {
                try {
                    await loadSignalsData(); // Зареждане с нов search filter
                    showSearchResults(value);
                } catch (error) {
                    console.error('Search error:', error);
                }
            } else {
                await loadSignalsData(); // Зареждане без search filter
                hideSearchResults();
            }
        }, 500); // Увеличен debounce за API заявки
    });

    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            clearSearch();
        }
    });

    if (clearButton) {
        clearButton.addEventListener('click', clearSearch);
    }
}

function showSearchResults(query) {
    const resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) return;

    const matchingSignals = currentSignals.filter(signal => {
        const queryLower = query.toLowerCase();
        const titleMatch = signal.title?.toLowerCase().includes(queryLower);
        const descriptionMatch = signal.description?.toLowerCase().includes(queryLower);
        const categoryMatch = SIGNAL_CATEGORIES[signal.category]?.name.toLowerCase().includes(queryLower);
        const authorMatch = signal.author?.username?.toLowerCase().includes(queryLower);
        return titleMatch || descriptionMatch || categoryMatch || authorMatch;
    }).slice(0, 5); // Показване само на първите 5 резултата

    if (matchingSignals.length === 0) {
        resultsContainer.innerHTML = '<div class="search-no-results">Няма намерени резултати</div>';
    } else {
        resultsContainer.innerHTML = matchingSignals.map(signal => {
            const category = SIGNAL_CATEGORIES[signal.category];
            return `
                <div class="search-result-item" onclick="selectSignalFromSearch(${signal.id})">
                    <div class="search-result-category">
                        <i class="${category?.icon || 'bi-info-circle'}" style="color: ${category?.color || '#666'}"></i>
                        <span>${category?.name || 'Неизвестна категория'}</span>
                    </div>
                    <div class="search-result-title">${signal.title || 'Без заглавие'}</div>
                    <div class="search-result-date">${signal.createdAt ?
                new Date(signal.createdAt).toLocaleDateString('bg-BG') : ''}</div>
                </div>
            `;
        }).join('');
    }

    resultsContainer.style.display = 'block';
}

function hideSearchResults() {
    const resultsContainer = document.getElementById('searchResults');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
}

function clearSearch() {
    const searchInput = document.getElementById('signalSearch');
    const clearButton = document.getElementById('clearSearch');

    if (searchInput) searchInput.value = '';
    if (clearButton) clearButton.style.display = 'none';

    hideSearchResults();
    activeFilters.search = '';
    loadSignalsData();
}

function selectSignalFromSearch(signalId) {
    const signal = currentSignals.find(s => s.id == signalId);
    if (signal) {
        openSignalModal(signal);
        hideSearchResults();
    }
}

// ===== LOCATION SELECTION =====
function toggleLocationSelection() {
    locationSelectionMode = !locationSelectionMode;
    const btn = document.getElementById('selectLocationBtn');

    if (locationSelectionMode) {
        btn.innerHTML = '<i class="bi bi-geo-alt-fill"></i> <span>Кликнете на картата</span>';
        btn.classList.add('selecting');

        if (window.mapCore && window.mapCore.showNotification) {
            window.mapCore.showNotification('Кликнете на картата за да изберете местоположение', 'info');
        }
    } else {
        btn.innerHTML = '<i class="bi bi-geo-alt"></i> <span>Изберете местоположение</span>';
        btn.classList.remove('selecting');
    }
}

// ===== SIGNAL CREATION =====
async function handleCreateSignal(event) {
    event.preventDefault();

    try {
        // Вземаме данните от формуляра
        const formData = new FormData(event.target);

        // Проверяваме дали координатите са зададени
        const latitude = formData.get('latitude');
        const longitude = formData.get('longitude');

        if (!latitude || !longitude) {
            if (window.mapCore && window.mapCore.showNotification) {
                window.mapCore.showNotification('Моля изберете местоположение на картата', 'error');
            }
            return;
        }

        // Показване на loading състояние
        if (window.mapCore && window.mapCore.showNotification) {
            window.mapCore.showNotification('Създаване на сигнала...', 'info');
        }

        // Изпращане към сървъра
        const response = await fetch('/api/signals', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();

        // Успешно създаване
        if (window.mapCore && window.mapCore.showNotification) {
            window.mapCore.showNotification('Сигналът е създаден успешно!', 'success');
        }

        // Reset на формата
        event.target.reset();

        // Изчистваме координатите
        document.getElementById('signalLatitude').value = '';
        document.getElementById('signalLongitude').value = '';

        // Затваряне на панела
        if (window.closePanel) {
            window.closePanel('newSignal');
        }

        // Презареждане на данните за да се покаже новия сигнал
        await loadSignalsData();

    } catch (error) {
        console.error('Error creating signal:', error);

        if (window.mapCore && window.mapCore.showNotification) {
            window.mapCore.showNotification('Грешка при създаване на сигнала: ' + error.message, 'error');
        }
    }
}

// ===== MAP CLICK HANDLER FOR LOCATION SELECTION =====
function onMapClick(e) {
    if (locationSelectionMode) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        // Записваме координатите в формуляра
        document.getElementById('signalLatitude').value = lat;
        document.getElementById('signalLongitude').value = lng;

        // Обновяваме бутона
        const btn = document.getElementById('selectLocationBtn');
        btn.innerHTML = '<i class="bi bi-geo-alt-fill"></i> <span>Местоположение избрано</span>';
        btn.classList.remove('selecting');
        btn.classList.add('selected');

        // Изключваме режима за избор
        locationSelectionMode = false;

        if (window.mapCore && window.mapCore.showNotification) {
            window.mapCore.showNotification('Местоположението е избрано', 'success');
        }
    }
}

// ===== EVENT LISTENERS =====
function initializeSignalEventListeners() {
    // Filter events
    const categoryFilter = document.getElementById('categoryFilter');
    const urgencyFilter = document.getElementById('urgencyFilter');
    const sortFilter = document.getElementById('sortFilter');
    const selectLocationBtn = document.getElementById('selectLocationBtn');
    const createSignalForm = document.getElementById('createSignalForm');

    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (urgencyFilter) urgencyFilter.addEventListener('change', applyFilters);
    if (sortFilter) sortFilter.addEventListener('change', applyFilters);
    if (selectLocationBtn) selectLocationBtn.addEventListener('click', toggleLocationSelection);
    if (createSignalForm) createSignalForm.addEventListener('submit', handleCreateSignal);

    console.log('✅ Signal event listeners initialized');
}

// ===== PUBLIC API =====
window.signalManagement = {
    loadSignalsData,
    loadSignals,
    createSignalMarker,
    applyFilters,
    clearFilters,
    updateSignalsList,
    updateStats,
    initializeSearch,
    initializeSignalEventListeners,
    handleCreateSignal,
    toggleLocationSelection,
    selectSignalFromSearch,
    onMapClick,
    getCurrentSignals: () => currentSignals,
    getActiveFilters: () => activeFilters,
    SIGNAL_CATEGORIES, // Export за modal
    URGENCY_LEVELS, // Export за modal

    // Нови методи за external API използване
    refreshSignals: loadSignalsData,
    getSignalById: (id) => currentSignals.find(s => s.id == id)
};

// Export за modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.signalManagement;
}