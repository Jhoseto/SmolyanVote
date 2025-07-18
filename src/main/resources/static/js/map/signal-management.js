// ===== SIGNAL MANAGEMENT =====
// Създаване, филтриране, показване на сигнали

// ===== GLOBAL VARIABLES =====
let currentSignals = [];
let activeFilters = {
    category: 'all',
    urgency: 'all',
    search: ''
};
let filtersExpanded = false;
let locationSelectionMode = false;

// ===== SIGNAL DATA LOADING =====
async function loadSignalsData() {
    try {
        // Опит за зареждане от външен файл
        const response = await fetch('/js/map/signals-data.js');
        if (response.ok) {
            const scriptText = await response.text();
            eval(scriptText);
            if (typeof SAMPLE_SIGNALS !== 'undefined') {
                currentSignals = SAMPLE_SIGNALS;
            }
        }
    } catch (error) {
        console.log('Could not load external signals data, using fallback');
        // Fallback данни в случай че файлът не се намери
        currentSignals = [
            {
                id: 1,
                title: 'Примерен сигнал',
                category: 'road_damage',
                description: 'Това е примерен сигнал за тестване.',
                coordinates: [41.5766, 24.7014],
                urgency: 'medium',
                imageUrl: null,
                author: {
                    id: 1,
                    username: 'Система',
                    imageUrl: null
                },
                createdAt: new Date().toISOString()
            }
        ];
    }

    // Зареждане на сигналите след готовността на данните
    loadSignals();
    updateStats();
    console.log('Signals data loaded:', currentSignals.length);
}

// ===== SIGNAL MARKERS CREATION =====
function createSignalMarker(signal) {
    const category = SIGNAL_CATEGORIES[signal.category];
    const urgency = URGENCY_LEVELS[signal.urgency];

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

    // Hover events за tooltip (ще се добави в signal-tooltip.js)
    marker.on('mouseover', function(e) {
        if (window.signalTooltip && !window.mapCore.isMobile()) {
            window.signalTooltip.show(signal, e.originalEvent);
        }
    });

    marker.on('mouseout', function() {
        if (window.signalTooltip && !window.mapCore.isMobile()) {
            window.signalTooltip.hide();
        }
    });

    return marker;
}

// ===== SIGNALS LOADING AND FILTERING =====
function loadSignals() {
    const markersCluster = window.mapCore.getMarkersCluster();
    if (!markersCluster) return;

    markersCluster.clearLayers();

    const filteredSignals = currentSignals.filter(signal => {
        const categoryMatch = activeFilters.category === 'all' || signal.category === activeFilters.category;
        const urgencyMatch = activeFilters.urgency === 'all' || signal.urgency === activeFilters.urgency;

        // Search filter
        let searchMatch = true;
        if (activeFilters.search) {
            const query = activeFilters.search.toLowerCase();
            const titleMatch = signal.title.toLowerCase().includes(query);
            const descriptionMatch = signal.description.toLowerCase().includes(query);
            const categoryMatch = SIGNAL_CATEGORIES[signal.category].name.toLowerCase().includes(query);
            const authorMatch = signal.author.username.toLowerCase().includes(query);
            searchMatch = titleMatch || descriptionMatch || categoryMatch || authorMatch;
        }

        return categoryMatch && urgencyMatch && searchMatch;
    });

    filteredSignals.forEach(signal => {
        const marker = createSignalMarker(signal);
        markersCluster.addLayer(marker);
    });

    updateSignalsList(filteredSignals);
    updateStats();
}

function applyFilters() {
    activeFilters.category = document.getElementById('categoryFilter')?.value || 'all';
    activeFilters.urgency = document.getElementById('urgencyFilter')?.value || 'all';

    loadSignals();
}

function clearFilters() {
    activeFilters = {
        category: 'all',
        urgency: 'all',
        search: ''
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

    loadSignals();
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
    const sortBy = document.getElementById('sortFilter')?.value || 'newest';
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
                return a.category.localeCompare(b.category);
            default:
                return 0;
        }
    });

    container.innerHTML = signals.map(signal => createSignalCard(signal)).join('');
}

function createSignalCard(signal) {
    const category = SIGNAL_CATEGORIES[signal.category];
    const urgency = URGENCY_LEVELS[signal.urgency];

    // Създаване на avatar за автора
    const authorAvatarHTML = window.avatarUtils ?
        window.avatarUtils.createAvatar(signal.author.imageUrl, signal.author.username, 32, 'author-avatar') :
        `<img class="author-avatar" src="${signal.author.imageUrl || '/images/default-avatar.png'}" alt="${signal.author.username}" style="width:32px;height:32px;">`;

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
            <h4 class="signal-title">${signal.title}</h4>
            <p class="signal-description">${signal.description}</p>
            <div class="signal-footer">
                <div class="signal-author">
                    ${authorAvatarHTML}
                    <span class="author-name">${signal.author.username}</span>
                </div>
                <span class="signal-date">${new Date(signal.createdAt).toLocaleDateString('bg-BG')}</span>
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
            const titleMatch = signal.title.toLowerCase().includes(query);
            const descriptionMatch = signal.description.toLowerCase().includes(query);
            const categoryMatch = SIGNAL_CATEGORIES[signal.category].name.toLowerCase().includes(query);
            const authorMatch = signal.author.username.toLowerCase().includes(query);
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
        searchTimeout = setTimeout(() => {
            activeFilters.search = value;
            loadSignals();

            if (value.length >= 2) {
                showSearchResults(value);
            } else {
                hideSearchResults();
            }
        }, 300);
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
        const titleMatch = signal.title.toLowerCase().includes(queryLower);
        const descriptionMatch = signal.description.toLowerCase().includes(queryLower);
        const categoryMatch = SIGNAL_CATEGORIES[signal.category].name.toLowerCase().includes(queryLower);
        const authorMatch = signal.author.username.toLowerCase().includes(queryLower);
        return titleMatch || descriptionMatch || categoryMatch || authorMatch;
    }).slice(0, 5); // Показване само на първите 5 резултата

    if (matchingSignals.length === 0) {
        resultsContainer.innerHTML = '<div class="search-no-results">Няма намерени резултати</div>';
    } else {
        resultsContainer.innerHTML = matchingSignals.map(signal => {
            const category = SIGNAL_CATEGORIES[signal.category];
            return `
                <div class="search-result-item" onclick="selectSignalFromSearch(${signal.id})">
                    <div class="search-result-icon" style="color: ${category.color}">
                        <i class="${category.icon}"></i>
                    </div>
                    <div class="search-result-content">
                        <div class="search-result-title">${signal.title}</div>
                        <div class="search-result-category">${category.name} • ${signal.author.username}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    resultsContainer.style.display = 'block';

    // Auto-hide след 5 секунди
    setTimeout(() => {
        hideSearchResults();
    }, 5000);
}

function hideSearchResults() {
    const resultsContainer = document.getElementById('searchResults');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
}

function selectSignalFromSearch(signalId) {
    hideSearchResults();

    // Намиране на сигнала
    const signal = currentSignals.find(s => s.id === signalId);
    if (signal) {
        // Центриране на картата върху сигнала
        const map = window.mapCore.getMap();
        if (map) {
            map.setView(signal.coordinates, 16);
        }

        // Отваряне на модала
        setTimeout(() => {
            openSignalModal(signal);
        }, 500);
    }
}

function clearSearch() {
    const searchInput = document.getElementById('signalSearch');
    const clearButton = document.getElementById('clearSearch');

    if (searchInput) searchInput.value = '';
    if (clearButton) clearButton.style.display = 'none';

    hideSearchResults();
    activeFilters.search = '';
    loadSignals();
}

// ===== LOCATION SELECTION =====
function toggleLocationSelection() {
    locationSelectionMode = !locationSelectionMode;
    const btn = document.getElementById('selectLocationBtn');

    if (locationSelectionMode) {
        btn.innerHTML = '<i class="bi bi-geo-alt-fill"></i> <span>Кликнете на картата</span>';
        btn.classList.add('selecting');
        window.mapCore.showNotification('Кликнете на картата за да изберете местоположение', 'info');
    } else {
        btn.innerHTML = '<i class="bi bi-geo-alt"></i> <span>Изберете местоположение</span>';
        btn.classList.remove('selecting');
    }
}

// ===== SIGNAL CREATION =====
function handleCreateSignal(event) {
    event.preventDefault();

    const formData = {
        title: document.getElementById('signalTitle')?.value,
        category: document.getElementById('signalCategory')?.value,
        description: document.getElementById('signalDescription')?.value,
        urgency: document.getElementById('signalUrgency')?.value,
        latitude: document.getElementById('signalLatitude')?.value,
        longitude: document.getElementById('signalLongitude')?.value,
        image: document.getElementById('signalImage')?.files[0]
    };

    // Валидация
    if (!formData.title || !formData.category || !formData.description || !formData.urgency) {
        window.mapCore.showNotification('Моля попълнете всички задължителни полета', 'error');
        return;
    }

    if (!formData.latitude || !formData.longitude) {
        window.mapCore.showNotification('Моля изберете местоположение на картата', 'error');
        return;
    }

    // TODO: Изпращане към сървъра
    console.log('Creating signal:', formData);

    // Временно - симулация на създаване
    window.mapCore.showNotification('Сигналът е изпратен успешно!', 'success');

    // Reset на формата
    document.getElementById('createSignalForm')?.reset();

    // Затваряне на панела
    if (window.closePanel) {
        window.closePanel('newSignal');
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

    console.log('Signal event listeners initialized');
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
    getActiveFilters: () => activeFilters
};

// Export за modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.signalManagement;
}