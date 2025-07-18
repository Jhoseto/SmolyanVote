// ===== MODERN SMOLYANVOTE MAP JAVASCRIPT =====

// ===== GLOBAL VARIABLES =====
let map = null;
let markersCluster = null;
let selectedCoordinates = null;
let locationSelectionMode = false;
let temporaryMarker = null;
let activePanel = null;
let signalsPanelExpanded = false;
let filtersExpanded = false;
let isMobile = window.innerWidth <= 768;

// ===== MAP CONSTANTS =====
const SMOLYAN_CENTER = [41.5766, 24.7014];
const DEFAULT_ZOOM = 13;
const SMOLYAN_BOUNDS = {
    north: 41.6200,
    south: 41.5300,
    east: 24.7800,
    west: 24.6200
};

// ===== SIGNAL CATEGORIES (БЕЗ СТАТУСИ) =====
const SIGNAL_CATEGORIES = {
    road_damage: { name: 'Дупки в пътищата', icon: 'bi-cone-striped', color: '#ef4444' },
    sidewalk_damage: { name: 'Счупени тротоари', icon: 'bi-house-slash', color: '#f97316' },
    lighting: { name: 'Неработещо осветление', icon: 'bi-lightbulb-off', color: '#eab308' },
    traffic_signs: { name: 'Повредени пътни знаци', icon: 'bi-sign-stop', color: '#dc2626' },
    water_sewer: { name: 'Водопровод/канализация', icon: 'bi-droplet-half', color: '#2563eb' },
    waste_management: { name: 'Замърсяване на околната среда', icon: 'bi-trash3', color: '#16a34a' },
    illegal_dumping: { name: 'Незаконно изхвърляне на отпадъци', icon: 'bi-recycle', color: '#059669' },
    tree_issues: { name: 'Проблеми с дървета и растителност', icon: 'bi-tree', color: '#65a30d' },
    air_pollution: { name: 'Замърсяване на въздуха', icon: 'bi-cloud-haze', color: '#6b7280' },
    noise_pollution: { name: 'Шумово замърсяване', icon: 'bi-volume-up', color: '#7c2d12' },
    vandalism: { name: 'Вандализъм', icon: 'bi-hammer', color: '#7c2d12' },
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

// ===== SAMPLE DATA =====
let currentSignals = [];

// ===== FILTERS =====
let activeFilters = {
    category: 'all',
    urgency: 'all',
    search: ''
};

// ===== REAL-TIME SEARCH =====
let searchTimeout = null;
let searchResults = [];

function initializeSearch() {
    const searchInput = document.getElementById('signalSearch');
    const clearButton = document.getElementById('clearSearch');
    const resultsContainer = document.getElementById('searchResults');

    searchInput.addEventListener('input', handleSearchInput);
    clearButton.addEventListener('click', clearSearch);

    // Затваряне на резултатите при клик извън тях
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            hideSearchResults();
        }
    });
}

function handleSearchInput(e) {
    const query = e.target.value.trim();
    const clearButton = document.getElementById('clearSearch');

    // Показване/скриване на clear бутона
    if (query.length > 0) {
        clearButton.style.display = 'block';
    } else {
        clearButton.style.display = 'none';
        hideSearchResults();
        activeFilters.search = '';
        loadSignals();
        return;
    }

    // Debounce search
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        performSearch(query);
    }, 300);
}

function performSearch(query) {
    if (query.length < 2) {
        hideSearchResults();
        return;
    }

    // Търсене в данните
    searchResults = currentSignals.filter(signal => {
        const titleMatch = signal.title.toLowerCase().includes(query.toLowerCase());
        const descriptionMatch = signal.description.toLowerCase().includes(query.toLowerCase());
        const categoryMatch = SIGNAL_CATEGORIES[signal.category].name.toLowerCase().includes(query.toLowerCase());
        return titleMatch || descriptionMatch || categoryMatch;
    });

    activeFilters.search = query;
    showSearchResults(searchResults, query);
    loadSignals(); // Обновяване на картата и списъка
}

function showSearchResults(results, query) {
    const resultsContainer = document.getElementById('searchResults');

    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="search-result-item">
                <div class="search-result-icon">
                    <i class="bi bi-search"></i>
                </div>
                <div class="search-result-content">
                    <div class="search-result-title">Няма намерени резултати</div>
                    <div class="search-result-description">Опитайте с различни ключови думи</div>
                </div>
            </div>
        `;
    } else {
        resultsContainer.innerHTML = results.slice(0, 5).map(signal => {
            const category = SIGNAL_CATEGORIES[signal.category];
            const highlightedTitle = highlightText(signal.title, query);

            return `
                <div class="search-result-item" onclick="selectSearchResult(${signal.id})">
                    <div class="search-result-icon">
                        <i class="${category.icon}" style="color: ${category.color}"></i>
                    </div>
                    <div class="search-result-content">
                        <div class="search-result-title">${highlightedTitle}</div>
                        <div class="search-result-description">${category.name}</div>
                    </div>
                </div>
            `;
        }).join('');

        if (results.length > 5) {
            resultsContainer.innerHTML += `
                <div class="search-result-item" style="font-style: italic; color: var(--gray-500);">
                    <div class="search-result-content">
                        <div class="search-result-title">+${results.length - 5} още резултата</div>
                    </div>
                </div>
            `;
        }
    }

    resultsContainer.style.display = 'block';
}

function highlightText(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<strong style="color: var(--primary-green);">$1</strong>');
}

function selectSearchResult(signalId) {
    const signal = currentSignals.find(s => s.id === signalId);
    if (signal) {
        hideSearchResults();

        // Центриране на картата към сигнала
        map.setView(signal.coordinates, 18, {
            animate: true,
            duration: 1.0
        });

        // Показване на детайлите
        setTimeout(() => {
            openSignalModal(signal);
        }, 500);
    }
}

function hideSearchResults() {
    document.getElementById('searchResults').style.display = 'none';
}

function clearSearch() {
    const searchInput = document.getElementById('signalSearch');
    const clearButton = document.getElementById('clearSearch');

    searchInput.value = '';
    clearButton.style.display = 'none';
    hideSearchResults();
    activeFilters.search = '';
    loadSignals();
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    loadSignalsData();
    initializeMap();
    initializeEventListeners();
    initializeSearch();

    // Настройка на филтрите да са свити в началото
    const filtersContent = document.getElementById('filtersContent');
    const filtersArrow = document.getElementById('filtersArrow');

    if (filtersContent && filtersArrow) {
        filtersContent.classList.add('collapsed');
        filtersArrow.style.transform = 'rotate(0deg)';
        filtersExpanded = false;
    }

    // Handle mobile layout
    if (isMobile) {
        adaptForMobile();
    }
});

// ===== LOAD SIGNALS DATA =====
async function loadSignalsData() {
    try {
        // Try to load from external file first
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
        // Fallback data in case file is not found
        currentSignals = [
            {
                id: 1,
                title: 'Примерен сигнал',
                category: 'road_damage',
                description: 'Това е примерен сигнал за тестване.',
                coordinates: [41.5766, 24.7014],
                urgency: 'medium',
                reporter: 'Система',
                createdAt: new Date().toISOString()
            }
        ];
    }

    // Load signals after data is ready
    loadSignals();
    updateStats();
}

window.addEventListener('resize', handleResize);

function initializeEventListeners() {
    // Map controls
    document.getElementById('centerMapBtn')?.addEventListener('click', centerMap);
    document.getElementById('myLocationBtn')?.addEventListener('click', getMyLocation);
    document.getElementById('fullscreenBtn')?.addEventListener('click', toggleFullscreen);

    // Form events
    document.getElementById('selectLocationBtn')?.addEventListener('click', toggleLocationSelection);

    // Filter events
    document.getElementById('categoryFilter')?.addEventListener('change', applyFilters);
    document.getElementById('urgencyFilter')?.addEventListener('change', applyFilters);
    document.getElementById('sortFilter')?.addEventListener('change', applyFilters);
}

function adaptForMobile() {
    const mapContainer = document.querySelector('.map-container');
    if (mapContainer) {
        mapContainer.style.display = 'flex';
        mapContainer.style.flexDirection = 'column';
    }

    // Show FAB on mobile
    const fab = document.querySelector('.fab');
    if (fab && isMobile) {
        fab.style.display = 'flex';
    }

    // Auto-expand signals panel on mobile
    const signalsPanel = document.querySelector('.signals-panel');
    if (signalsPanel && isMobile) {
        signalsPanel.classList.add('expanded');
        signalsPanelExpanded = true;
    }
}

function handleResize() {
    const wasMobile = isMobile;
    isMobile = window.innerWidth <= 768;

    if (wasMobile !== isMobile) {
        if (isMobile) {
            adaptForMobile();
        } else {
            // Reset to desktop layout
            location.reload(); // Simple approach for demo
        }
    }

    if (map) {
        setTimeout(() => map.invalidateSize(), 100);
    }
}

// ===== MAP INITIALIZATION =====
function initializeMap() {
    const bounds = L.latLngBounds(
        L.latLng(SMOLYAN_BOUNDS.south, SMOLYAN_BOUNDS.west),
        L.latLng(SMOLYAN_BOUNDS.north, SMOLYAN_BOUNDS.east)
    );

    map = L.map('map', {
        center: SMOLYAN_CENTER,
        zoom: DEFAULT_ZOOM,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0,
        minZoom: 10,
        maxZoom: 18,
        attributionControl: false,
        zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '',
        maxZoom: 18,
        bounds: bounds
    }).addTo(map);

    // Add boundary
    addSmolyanBoundary();

    // Initialize marker cluster
    markersCluster = L.markerClusterGroup({
        chunkedLoading: true,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        maxClusterRadius: 40,
        disableClusteringAtZoom: 16,
        iconCreateFunction: function(cluster) {
            const count = cluster.getChildCount();
            const size = count < 10 ? 'small' : count < 100 ? 'medium' : 'large';
            return L.divIcon({
                html: `<div>${count}</div>`,
                className: `marker-cluster marker-cluster-${size}`,
                iconSize: L.point(40, 40)
            });
        }
    });

    map.addLayer(markersCluster);

    // Map click for location selection
    map.on('click', handleMapClick);
}

function addSmolyanBoundary() {
    const boundaryCoords = [
        [SMOLYAN_BOUNDS.north, SMOLYAN_BOUNDS.west],
        [SMOLYAN_BOUNDS.north, SMOLYAN_BOUNDS.east],
        [SMOLYAN_BOUNDS.south, SMOLYAN_BOUNDS.east],
        [SMOLYAN_BOUNDS.south, SMOLYAN_BOUNDS.west]
    ];

    L.polygon(boundaryCoords, {
        color: '#4cb15c',
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.1,
        fillColor: '#4cb15c'
    }).addTo(map);
}

// ===== PANEL MANAGEMENT =====
function togglePanel(panelName) {
    if (activePanel === panelName) {
        // Close current panel
        closePanel(panelName);
    } else {
        // Close other panels and open this one
        closePanels();
        openPanel(panelName);
    }
}

function openPanel(panelName) {
    const panel = document.getElementById(panelName + 'Panel');
    if (panel) {
        panel.classList.add('active');
        activePanel = panelName;

        // Update map size after animation
        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 400);
    }
}

function closePanel(panelName) {
    const panel = document.getElementById(panelName + 'Panel');
    if (panel) {
        panel.classList.remove('active');
        if (activePanel === panelName) {
            activePanel = null;
        }

        // Update map size after animation
        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 400);
    }
}

function closePanels() {
    const panels = document.querySelectorAll('.floating-panel');
    panels.forEach(panel => {
        panel.classList.remove('active');
    });
    activePanel = null;
}

// ===== SIGNALS PANEL MANAGEMENT =====
function toggleSignalsPanel() {
    const signalsPanel = document.querySelector('.signals-panel');
    const arrow = document.getElementById('signalsTabArrow');

    signalsPanelExpanded = !signalsPanelExpanded;

    if (signalsPanelExpanded) {
        signalsPanel.classList.add('expanded');
        arrow.style.transform = 'translateY(-50%) rotate(180deg)';
    } else {
        signalsPanel.classList.remove('expanded');
        arrow.style.transform = 'translateY(-50%) rotate(0deg)';
    }

    // Update map size after animation
    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 400);
}

// ===== FILTERS MANAGEMENT =====
function toggleFilters() {
    const filtersContent = document.getElementById('filtersContent');
    const arrow = document.getElementById('filtersArrow');

    filtersExpanded = !filtersExpanded;

    if (filtersExpanded) {
        filtersContent.classList.remove('collapsed');
        filtersContent.classList.add('expanded');
        arrow.style.transform = 'rotate(180deg)';
    } else {
        filtersContent.classList.add('collapsed');
        filtersContent.classList.remove('expanded');
        arrow.style.transform = 'rotate(0deg)';
    }
}

// Make functions globally available
window.togglePanel = togglePanel;
window.closePanel = closePanel;
window.toggleSignalsPanel = toggleSignalsPanel;
window.toggleFilters = toggleFilters;

// ===== SIGNAL MANAGEMENT =====
function loadSignals() {
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
            searchMatch = titleMatch || descriptionMatch || categoryMatch;
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

    marker.signalData = signal;
    marker.on('click', function() {
        openSignalModal(signal);
    });

    return marker;
}

function updateSignalsList(signals) {
    const container = document.getElementById('signalsList');

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

    // Sort signals
    const sortBy = document.getElementById('sortFilter').value;
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
                <span class="signal-date">${new Date(signal.createdAt).toLocaleDateString('bg-BG')}</span>
                <span class="signal-reporter">от ${signal.reporter}</span>
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
            searchMatch = titleMatch || descriptionMatch || categoryMatch;
        }

        return categoryMatch && urgencyMatch && searchMatch;
    }).length;

    document.getElementById('signalsTabCounter').textContent = filteredCount;
}

// ===== LOCATION SELECTION =====
function toggleLocationSelection() {
    locationSelectionMode = !locationSelectionMode;
    const btn = document.getElementById('selectLocationBtn');

    if (locationSelectionMode) {
        btn.innerHTML = '<i class="bi bi-geo-alt-fill"></i> <span>Кликнете на картата</span>';
        btn.classList.add('selecting');
        showNotification('Кликнете на картата за да изберете местоположение', 'info');
    } else {
        btn.innerHTML = '<i class="bi bi-geo-alt"></i> <span>Изберете местоположение</span>';
        btn.classList.remove('selecting');
        if (temporaryMarker) {
            map.removeLayer(temporaryMarker);
            temporaryMarker = null;
        }
    }
}

function handleMapClick(e) {
    if (!locationSelectionMode) return;

    const { lat, lng } = e.latlng;
    const coords = [lat, lng];

    if (!isWithinSmolyanBounds(coords)) {
        showNotification('Моля, изберете местоположение в рамките на Смолян', 'error');
        return;
    }

    // Remove previous temporary marker
    if (temporaryMarker) {
        map.removeLayer(temporaryMarker);
    }

    // Add new temporary marker
    temporaryMarker = L.marker(coords, {
        icon: L.divIcon({
            className: 'temporary-marker',
            html: '<div style="background: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        })
    }).addTo(map);

    selectedCoordinates = coords;
    updateCoordsDisplay();
    toggleLocationSelection();
    showNotification('Местоположението е избрано успешно', 'success');
}

function updateCoordsDisplay() {
    const display = document.getElementById('selectedCoords');
    if (selectedCoordinates) {
        display.textContent = `${selectedCoordinates[0].toFixed(6)}, ${selectedCoordinates[1].toFixed(6)}`;
        display.classList.add('selected');
    } else {
        display.textContent = 'Няма избрано местоположение';
        display.classList.remove('selected');
    }
}

function isWithinSmolyanBounds(coords) {
    const [lat, lng] = coords;
    return (
        lat >= SMOLYAN_BOUNDS.south &&
        lat <= SMOLYAN_BOUNDS.north &&
        lng >= SMOLYAN_BOUNDS.west &&
        lng <= SMOLYAN_BOUNDS.east
    );
}

// ===== FORM HANDLING =====
function handleCreateSignal(e) {
    e.preventDefault();

    if (!selectedCoordinates) {
        showNotification('Моля, изберете местоположение на картата', 'error');
        return;
    }

    const newSignal = {
        id: currentSignals.length + 1,
        title: document.getElementById('signalTitle').value,
        category: document.getElementById('signalCategory').value,
        description: document.getElementById('signalDescription').value,
        coordinates: selectedCoordinates,
        urgency: document.getElementById('signalUrgency').value,
        reporter: 'Анонимно', // Will be replaced with actual user data
        createdAt: new Date().toISOString()
    };

    currentSignals.push(newSignal);
    loadSignals();
    resetForm();
    closePanel('newSignal');
    showNotification('Сигналът е изпратен успешно!', 'success');
}

function resetForm() {
    document.getElementById('createSignalForm').reset();
    selectedCoordinates = null;
    updateCoordsDisplay();
    document.getElementById('selectLocationBtn').innerHTML = '<i class="bi bi-geo-alt"></i> <span>Изберете местоположение</span>';
    document.getElementById('selectLocationBtn').classList.remove('selecting');

    if (temporaryMarker) {
        map.removeLayer(temporaryMarker);
        temporaryMarker = null;
    }
}

// Make globally available
window.resetForm = resetForm;

// ===== FILTERING =====
function applyFilters() {
    activeFilters.category = document.getElementById('categoryFilter').value;
    activeFilters.urgency = document.getElementById('urgencyFilter').value;
    loadSignals();
}

function clearFilters() {
    document.getElementById('categoryFilter').value = 'all';
    document.getElementById('urgencyFilter').value = 'all';
    document.getElementById('sortFilter').value = 'newest';
    applyFilters();
    showNotification('Филтрите са изчистени', 'info');
}

// Make globally available
window.clearFilters = clearFilters;

// ===== MAP CONTROLS =====
function centerMap() {
    map.setView(SMOLYAN_CENTER, DEFAULT_ZOOM);
    showNotification('Картата е центрирана', 'info');
}

function getMyLocation() {
    if (!navigator.geolocation) {
        showNotification('Геолокацията не е поддържана от този браузър', 'error');
        return;
    }

    showNotification('Търсене на вашата локация...', 'info');

    navigator.geolocation.getCurrentPosition(
        function(position) {
            const { latitude, longitude } = position.coords;
            const coords = [latitude, longitude];

            if (isWithinSmolyanBounds(coords)) {
                map.setView(coords, 18, {
                    animate: true,
                    duration: 1.0
                });

                // Add temporary marker for user location
                const userMarker = L.marker(coords, {
                    icon: L.divIcon({
                        className: 'user-location-marker',
                        html: '<div style="background: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                    })
                }).addTo(map);

                // Remove marker after 5 seconds
                setTimeout(() => {
                    map.removeLayer(userMarker);
                }, 5000);

                showNotification('Вашата локация е намерена', 'success');
            } else {
                showNotification('Вашата локация е извън границите на Смолян', 'error');
            }
        },
        function(error) {
            let message = 'Грешка при намиране на локацията';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    message = 'Достъпът до локацията е отказан';
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = 'Информацията за локацията не е достъпна';
                    break;
                case error.TIMEOUT:
                    message = 'Изтече времето за намиране на локацията';
                    break;
            }
            showNotification(message, 'error');
        },
        {
            timeout: 10000,
            maximumAge: 300000, // 5 minutes
            enableHighAccuracy: true
        }
    );
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            showNotification('Режим на цял екран е активиран', 'info');
            setTimeout(() => {
                if (map) map.invalidateSize();
            }, 100);
        }).catch(() => {
            showNotification('Не може да се активира режим на цял екран', 'error');
        });
    } else {
        document.exitFullscreen().then(() => {
            showNotification('Режимът на цял екран е деактивиран', 'info');
            setTimeout(() => {
                if (map) map.invalidateSize();
            }, 100);
        });
    }
}

// ===== NOTIFICATIONS =====
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    container.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Hide and remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (container.contains(notification)) {
                container.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ===== MOBILE SUPPORT =====
function toggleMobileControls() {
    // Mobile FAB functionality
    const fab = document.querySelector('.fab');
    if (fab) {
        togglePanel('newSignal');
    }
}

window.toggleMobileControls = toggleMobileControls;