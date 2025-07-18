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
const SIGNAL_CATEGORIES = {
    road_damage: { name: 'Повредени пътища', icon: 'bi-exclamation-triangle', color: '#dc2626' },
    infrastructure: { name: 'Инфраструктурни проблеми', icon: 'bi-tools', color: '#ea580c' },
    lighting: { name: 'Проблеми с осветлението', icon: 'bi-lightbulb', color: '#ca8a04' },
    water_sewer: { name: 'Водопровод и канализация', icon: 'bi-droplet', color: '#0369a1' },
    parks_green: { name: 'Паркове и зелени площи', icon: 'bi-tree', color: '#16a34a' },
    traffic: { name: 'Движение и паркиране', icon: 'bi-car-front', color: '#7c3aed' },
    noise: { name: 'Шум и замърсяване', icon: 'bi-volume-up', color: '#be123c' },
    vandalism: { name: 'Вандализъм', icon: 'bi-hammer', color: '#991b1b' },
    abandoned_vehicles: { name: 'Изоставени автомобили', icon: 'bi-car-front', color: '#374151' },
    security_issues: { name: 'Проблеми с безопасност', icon: 'bi-shield-exclamation', color: '#991b1b' },
    waste_collection: { name: 'Проблеми със сметосъбиране', icon: 'bi-trash', color: '#0f766e' },
    bus_stops: { name: 'Неработещи автобусни спирки', icon: 'bi-bus-front', color: '#1e40af' },
    public_transport: { name: 'Проблеми с обществен транспорт', icon: 'bi-train-front', color: '#3730a3' },
    accessibility: { name: 'Недостъпност за хора с увреждания', icon: 'bi-universal-access', color: '#7c3aed' },
    playgrounds: { name: 'Опасни детски площадки', icon: 'bi-playground', color: '#be185d' },
    stray_animals: { name: 'Бездомни животни', icon: 'bi-heart', color: '#a21caf' }
};

const URGENCY_LEVELS = {
    low: { name: 'Ниска', icon: 'bi-circle', color: '#16a34a' },
    medium: { name: 'Средна', icon: 'bi-exclamation-circle', color: '#f97316' },
    high: { name: 'Висока', icon: 'bi-exclamation-triangle', color: '#ef4444' }
};

// ===== SIGNAL DATA LOADING =====
async function loadSignalsData() {
    try {
        console.log('🔄 Loading signals data...');

        // Зареждане на сигналите от API
        const response = await fetch(`/api/signals${buildQueryString()}`);

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
    if (!markersCluster) return;

    markersCluster.clearLayers();

    // Клиентско филтриране (ако сървърът не поддържа всички филтри)
    const filteredSignals = currentSignals.filter(signal => {
        const categoryMatch = activeFilters.category === 'all' || signal.category === activeFilters.category;
        const urgencyMatch = activeFilters.urgency === 'all' || signal.urgency === activeFilters.urgency;

        // Search filter
        let searchMatch = true;
        if (activeFilters.search) {
            const query = activeFilters.search.toLowerCase();
            const titleMatch = signal.title?.toLowerCase().includes(query);
            const descriptionMatch = signal.description?.toLowerCase().includes(query);
            const categoryMatch = SIGNAL_CATEGORIES[signal.category]?.name.toLowerCase().includes(query);
            const authorMatch = signal.author?.username?.toLowerCase().includes(query);
            searchMatch = titleMatch || descriptionMatch || categoryMatch || authorMatch;
        }

        return categoryMatch && urgencyMatch && searchMatch;
    });

    // Добавяне на маркерите на картата
    filteredSignals.forEach(signal => {
        const marker = createSignalMarker(signal);
        if (marker) {
            markersCluster.addLayer(marker);
        }
    });

    updateSignalsList(filteredSignals);
    updateStats();
}

async function applyFilters() {
    try {
        activeFilters.category = document.getElementById('categoryFilter')?.value || 'all';
        activeFilters.urgency = document.getElementById('urgencyFilter')?.value || 'all';
        activeFilters.sort = document.getElementById('sortFilter')?.value || 'newest';

        // Зареждане на данните с новите филтри
        await loadSignalsData();

    } catch (error) {
        console.error('Error applying filters:', error);
        window.handleAPIError(error, 'Applying filters');
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
                <span class="signal-date">${signal.createdAt ? new Date(signal.createdAt).toLocaleDateString('bg-BG') : 'Неизвестна дата'}</span>
            </div>
        </div>
    `;
}

function updateStats() {
    const total = currentSignals.length;
    const filteredCount = currentSignals.filter(signal => {
        const categoryMatch = activeFilters.category === 'all' || signal.category === activeFilters.category;
        const urgencyMatch = activeFilters.urgency === 'all' || signal.urgency === activeFilters.urgency;

        let searchMatch = true;
        if (activeFilters.search) {
            const query = activeFilters.search.toLowerCase();
            const titleMatch = signal.title?.toLowerCase().includes(query);
            const descriptionMatch = signal.description?.toLowerCase().includes(query);
            const categoryMatch = SIGNAL_CATEGORIES[signal.category]?.name.toLowerCase().includes(query);
            const authorMatch = signal.author?.username?.toLowerCase().includes(query);
            searchMatch = titleMatch || descriptionMatch || categoryMatch || authorMatch;
        }

        return categoryMatch && urgencyMatch && searchMatch;
    }).length;

    const counter = document.getElementById('signalsTabCounter');
    if (counter) {
        counter.textContent = filteredCount;
    }
}

// ===== SEARCH FUNCTIONALITY =====
function initializeSearch() {
    const searchInput = document.getElementById('signalSearch');
    const clearButton = document.getElementById('clearSearch');

    if (!searchInput) return;

    let searchTimeout;

    searchInput.addEventListener('input', function() {
        const value = this.value.trim();

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
                    window.handleAPIError(error, 'Search');
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
                    <div class="search-result-date">${signal.createdAt ? new Date(signal.createdAt).toLocaleDateString('bg-BG') : ''}</div>
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
        const formData = new FormData(event.target);

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
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const newSignal = await response.json();

        // Успешно създаване
        if (window.mapCore && window.mapCore.showNotification) {
            window.mapCore.showNotification('Сигналът е създаден успешно!', 'success');
        }

        // Reset на формата
        event.target.reset();

        // Затваряне на панела
        if (window.closePanel) {
            window.closePanel('newSignal');
        }

        // Презареждане на данните за да се покаже новия сигнал
        await loadSignalsData();

    } catch (error) {
        console.error('Error creating signal:', error);

        if (window.mapCore && window.mapCore.showNotification) {
            window.mapCore.showNotification('Грешка при създаване на сигнала', 'error');
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
    getCurrentSignals: () => currentSignals,
    getActiveFilters: () => activeFilters,

    // Нови методи за external API използване
    refreshSignals: loadSignalsData,
    getSignalById: (id) => currentSignals.find(s => s.id == id)
};

// Export за modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.signalManagement;
}

console.log('✅ Signal Management with API integration loaded');