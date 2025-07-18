// ===== MODERN COMPACT MAP JAVASCRIPT =====

// ===== CONFIGURATION & CONSTANTS =====
const SMOLYAN_CENTER = [41.5736, 24.7127];
const DEFAULT_ZOOM = 11;

// Граници на Смолянска област
const SMOLYAN_BOUNDS = {
    north: 41.7500,
    south: 41.3500,
    east: 24.9500,
    west: 24.4500
};

// Категории със SmolyanVote стил - пълен списък
const SIGNAL_CATEGORIES = {
    // Инфраструктура
    road_damage: { name: 'Дупки в пътищата', icon: 'bi-exclamation-triangle-fill', color: '#e74c3c', group: 'infrastructure' },
    sidewalk_damage: { name: 'Счупени тротоари', icon: 'bi-exclamation-circle-fill', color: '#e67e22', group: 'infrastructure' },
    lighting: { name: 'Неработещо осветление', icon: 'bi-lightbulb-fill', color: '#f39c12', group: 'infrastructure' },
    traffic_signs: { name: 'Повредени пътни знаци', icon: 'bi-sign-stop-fill', color: '#d35400', group: 'infrastructure' },
    water_sewer: { name: 'Водопровод/канализация', icon: 'bi-droplet-fill', color: '#3498db', group: 'infrastructure' },

    // Околна среда
    illegal_waste: { name: 'Незаконни сметища', icon: 'bi-trash-fill', color: '#8b4513', group: 'environment' },
    dangerous_trees: { name: 'Мъртви/опасни дървета', icon: 'bi-tree-fill', color: '#27ae60', group: 'environment' },
    air_pollution: { name: 'Замърсяване на въздуха', icon: 'bi-cloud-haze-fill', color: '#95a5a6', group: 'environment' },
    noise: { name: 'Шум', icon: 'bi-volume-up-fill', color: '#9b59b6', group: 'environment' },
    parks_issues: { name: 'Проблеми с паркове', icon: 'bi-tree', color: '#2ecc71', group: 'environment' },

    // Обществен ред
    illegal_parking: { name: 'Незаконно паркиране', icon: 'bi-car-front-fill', color: '#e67e22', group: 'public_order' },
    vandalism: { name: 'Вандализъм', icon: 'bi-hammer', color: '#c0392b', group: 'public_order' },
    abandoned_vehicles: { name: 'Изоставени автомобили', icon: 'bi-car-front', color: '#7f8c8d', group: 'public_order' },
    security_issues: { name: 'Проблеми с безопасност', icon: 'bi-shield-exclamation', color: '#c0392b', group: 'public_order' },

    // Комунални услуги
    waste_collection: { name: 'Проблеми със сметосъбиране', icon: 'bi-trash3-fill', color: '#795548', group: 'municipal' },
    bus_stops: { name: 'Неработещи автобусни спирки', icon: 'bi-bus-front', color: '#2980b9', group: 'municipal' },
    public_transport: { name: 'Проблеми с обществен транспорт', icon: 'bi-bus-front-fill', color: '#3498db', group: 'municipal' },

    // Социални проблеми
    accessibility: { name: 'Недостъпност за хора с увреждания', icon: 'bi-person-wheelchair', color: '#8e44ad', group: 'social' },
    playgrounds: { name: 'Опасни детски площадки', icon: 'bi-exclamation-triangle-fill', color: '#e74c3c', group: 'social' },
    stray_animals: { name: 'Бездомни животни', icon: 'bi-heart-fill', color: '#e91e63', group: 'social' }
};

const URGENCY_LEVELS = {
    low: { name: 'Ниска', icon: 'bi-circle-fill', color: '#28a745' },
    medium: { name: 'Средна', icon: 'bi-exclamation-circle-fill', color: '#ffc107' },
    high: { name: 'Висока', icon: 'bi-exclamation-triangle-fill', color: '#dc3545' }
};

const STATUS_TYPES = {
    new: { name: 'Нов', icon: 'bi-clock-fill', color: '#007bff' },
    in_progress: { name: 'В процес', icon: 'bi-gear-fill', color: '#fd7e14' },
    resolved: { name: 'Решен', icon: 'bi-check-circle-fill', color: '#28a745' }
};

// Sample data с разнообразни категории
const SAMPLE_SIGNALS = [
    {
        id: 1,
        title: "Голяма дупка на главния път",
        category: "road_damage",
        description: "Опасна дупка на пътя към центъра, създава риск за автомобилите",
        coordinates: [41.5750, 24.7150],
        urgency: "high",
        status: "new",
        reporter: "Жител на Смолян",
        createdAt: "2025-01-15T10:30:00Z"
    },
    {
        id: 2,
        title: "Неработещо улично осветление",
        category: "lighting",
        description: "Няколко лампи на ул. Централна не светят от седмици",
        coordinates: [41.5720, 24.7100],
        urgency: "medium",
        status: "in_progress",
        reporter: "Анонимно",
        createdAt: "2025-01-10T16:45:00Z"
    },
    {
        id: 3,
        title: "Незаконно сметище в гората",
        category: "illegal_waste",
        description: "Натрупани отпадъци в близост до туристическа пътека",
        coordinates: [41.5680, 24.7200],
        urgency: "high",
        status: "new",
        reporter: "Турист",
        createdAt: "2025-01-12T14:20:00Z"
    },
    {
        id: 4,
        title: "Вандализъм в парка",
        category: "vandalism",
        description: "Счупени пейки и боядисани графити в централния парк",
        coordinates: [41.5730, 24.7130],
        urgency: "medium",
        status: "new",
        reporter: "Родител",
        createdAt: "2025-01-14T09:15:00Z"
    },
    {
        id: 5,
        title: "Опасна детска площадка",
        category: "playgrounds",
        description: "Счупени люлки и острі ръбове, опасно за децата",
        coordinates: [41.5710, 24.7080],
        urgency: "high",
        status: "resolved",
        reporter: "Майка",
        createdAt: "2025-01-08T14:30:00Z"
    },
    {
        id: 6,
        title: "Проблем с водопровода",
        category: "water_sewer",
        description: "Авария в тръбопровода, липсва вода от 2 дни",
        coordinates: [41.5760, 24.7160],
        urgency: "high",
        status: "in_progress",
        reporter: "Жител",
        createdAt: "2025-01-16T08:00:00Z"
    }
];

// ===== GLOBAL VARIABLES =====
let map;
let markersCluster;
let currentSignals = [...SAMPLE_SIGNALS];
let activeFilters = {
    category: 'all',
    urgency: 'all',
    status: 'all'
};
let isSelectingLocation = false;
let selectedCoordinates = null;
let isMobile = window.innerWidth <= 768;

// Panel states
let activePanel = null;
let signalsPanelExpanded = false;
let filtersExpanded = false;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    initializeControls();
    loadSignals();
    updateStats();
    initializeLayout();

    // Handle window resize
    window.addEventListener('resize', handleResize);
});

// ===== LAYOUT INITIALIZATION =====
function initializeLayout() {
    // Всички панели започват затворени
    closePanels();

    // Филтрите започват прибрани
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
        spiderfyOnMaxZoom: false,
        showCoverageOnHover: false,
        maxClusterRadius: 50,
        iconCreateFunction: function(cluster) {
            const count = cluster.getChildCount();
            let className = 'marker-cluster-small';
            if (count > 10) className = 'marker-cluster-medium';
            if (count > 20) className = 'marker-cluster-large';

            return new L.DivIcon({
                html: `<div><span>${count}</span></div>`,
                className: `marker-cluster ${className}`,
                iconSize: new L.Point(40, 40)
            });
        }
    });

    map.addLayer(markersCluster);
    map.on('click', onMapClick);
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
        opacity: 0.6,
        fillOpacity: 0.1,
        fillColor: '#4cb15c'
    }).addTo(map);
}

// ===== CONTROLS INITIALIZATION =====
function initializeControls() {
    // Form submission
    document.getElementById('createSignalForm').addEventListener('submit', handleCreateSignal);

    // Location selection
    document.getElementById('selectLocationBtn').addEventListener('click', toggleLocationSelection);

    // Map controls
    document.getElementById('centerMapBtn').addEventListener('click', centerMap);
    document.getElementById('myLocationBtn').addEventListener('click', getMyLocation);
    document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);

    // Filter controls
    document.getElementById('categoryFilter').addEventListener('change', applyFilters);
    document.getElementById('urgencyFilter').addEventListener('change', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('sortFilter').addEventListener('change', applyFilters);

    // Modal controls
    document.getElementById('closeSignalModal').addEventListener('click', closeSignalModal);
    document.getElementById('signalModal').addEventListener('click', function(e) {
        if (e.target === this) closeSignalModal();
    });
}

// ===== PANEL MANAGEMENT =====
function togglePanel(panelName) {
    const panel = document.getElementById(panelName + 'Panel');

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
        const statusMatch = activeFilters.status === 'all' || signal.status === activeFilters.status;
        return categoryMatch && urgencyMatch && statusMatch;
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
        showSignalDetails(signal);
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
    const status = STATUS_TYPES[signal.status];

    return `
        <div class="signal-card" onclick="showSignalDetails(${signal.id})">
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
                <div class="signal-status status-${signal.status}">
                    <i class="${status.icon}"></i>
                    <span>${status.name}</span>
                </div>
            </div>
        </div>
    `;
}

function updateStats() {
    const total = currentSignals.length;
    const active = currentSignals.filter(s => s.status !== 'resolved').length;
    const resolved = currentSignals.filter(s => s.status === 'resolved').length;

    document.getElementById('totalSignals').textContent = total;
    document.getElementById('activeSignals').textContent = active;
    document.getElementById('resolvedSignals').textContent = resolved;
    document.getElementById('signalsTabCounter').textContent = total;
}

// ===== SIGNAL DETAILS =====
function showSignalDetails(signalId) {
    const signal = typeof signalId === 'object' ? signalId : currentSignals.find(s => s.id == signalId);
    if (!signal) return;

    const category = SIGNAL_CATEGORIES[signal.category];
    const urgency = URGENCY_LEVELS[signal.urgency];
    const status = STATUS_TYPES[signal.status];

    document.getElementById('modalTitle').textContent = signal.title;
    document.getElementById('modalBody').innerHTML = `
        <div class="signal-details">
            <div class="detail-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <div class="detail-category" style="display: flex; align-items: center; gap: 0.5rem;">
                    <i class="${category.icon}" style="color: ${category.color}; font-size: 1.2rem;"></i>
                    <span style="font-weight: 600;">${category.name}</span>
                </div>
                <div class="detail-badges" style="display: flex; gap: 0.5rem;">
                    <span class="badge urgency-${signal.urgency}" style="padding: 0.25rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 500;">
                        <i class="${urgency.icon}"></i> ${urgency.name}
                    </span>
                    <span class="badge status-${signal.status}" style="padding: 0.25rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 500;">
                        <i class="${status.icon}"></i> ${status.name}
                    </span>
                </div>
            </div>
            
            <div class="detail-description" style="margin-bottom: 1.5rem;">
                <h5 style="color: var(--gray-700); margin-bottom: 0.5rem;">Описание</h5>
                <p style="color: var(--gray-600); line-height: 1.5;">${signal.description}</p>
            </div>
            
            <div class="detail-location" style="margin-bottom: 1.5rem;">
                <h5 style="color: var(--gray-700); margin-bottom: 0.5rem;">Местоположение</h5>
                <p style="color: var(--gray-600); margin-bottom: 1rem;">Координати: ${signal.coordinates[0].toFixed(6)}, ${signal.coordinates[1].toFixed(6)}</p>
                <button class="btn-secondary" onclick="centerMapOnSignal(${signal.id})" style="padding: 0.5rem 1rem; border: none; border-radius: var(--radius-md); background: var(--gray-200); color: var(--gray-700); cursor: pointer;">
                    <i class="bi bi-geo-alt-fill"></i> Покажи на картата
                </button>
            </div>
            
            <div class="detail-meta">
                <h5 style="color: var(--gray-700); margin-bottom: 0.75rem;">Информация</h5>
                <div class="meta-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="meta-item">
                        <strong>Подаден от:</strong><br>
                        <span style="color: var(--gray-600);">${signal.reporter}</span>
                    </div>
                    <div class="meta-item">
                        <strong>Дата:</strong><br>
                        <span style="color: var(--gray-600);">${new Date(signal.createdAt).toLocaleString('bg-BG')}</span>
                    </div>
                    <div class="meta-item">
                        <strong>ID:</strong><br>
                        <span style="color: var(--gray-600);">#${signal.id}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('signalModal').classList.add('open');
}

function closeSignalModal() {
    document.getElementById('signalModal').classList.remove('open');
}

function centerMapOnSignal(signalId) {
    const signal = currentSignals.find(s => s.id == signalId);
    if (signal) {
        map.setView(signal.coordinates, 16);
        closeSignalModal();
        showNotification('Картата е центрирана на сигнала', 'success');
    }
}

// Make globally available
window.showSignalDetails = showSignalDetails;
window.centerMapOnSignal = centerMapOnSignal;

// ===== LOCATION SELECTION =====
function toggleLocationSelection() {
    isSelectingLocation = !isSelectingLocation;
    const btn = document.getElementById('selectLocationBtn');

    if (isSelectingLocation) {
        btn.innerHTML = '<i class="bi bi-geo-alt-fill"></i> <span>Кликнете на картата</span>';
        btn.classList.add('selecting');
        showNotification('Кликнете на картата за избор на местоположение', 'info');
    } else {
        btn.innerHTML = '<i class="bi bi-geo-alt"></i> <span>Изберете местоположение</span>';
        btn.classList.remove('selecting');
    }
}

function onMapClick(e) {
    if (!isSelectingLocation) return;

    const coords = [e.latlng.lat, e.latlng.lng];

    if (!isWithinSmolyanBounds(coords)) {
        showNotification('Моля изберете местоположение в рамките на Смолянска област', 'error');
        return;
    }

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
        status: 'new',
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
}

// Make globally available
window.resetForm = resetForm;

// ===== FILTERING =====
function applyFilters() {
    activeFilters.category = document.getElementById('categoryFilter').value;
    activeFilters.urgency = document.getElementById('urgencyFilter').value;
    activeFilters.status = document.getElementById('statusFilter').value;
    loadSignals();
}

function clearFilters() {
    document.getElementById('categoryFilter').value = 'all';
    document.getElementById('urgencyFilter').value = 'all';
    document.getElementById('statusFilter').value = 'all';
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
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const coords = [position.coords.latitude, position.coords.longitude];
                if (isWithinSmolyanBounds(coords)) {
                    map.setView(coords, 15);
                    showNotification('Показана е вашата локация', 'success');
                } else {
                    showNotification('Вие сте извън границите на Смолянска област', 'warning');
                }
            },
            error => {
                showNotification('Не може да се определи локацията', 'error');
            }
        );
    } else {
        showNotification('Браузърът не поддържа геолокация', 'error');
    }
}

function toggleFullscreen() {
    const mapContainer = document.querySelector('.map-container');
    if (!document.fullscreenElement) {
        mapContainer.requestFullscreen().then(() => {
            setTimeout(() => map.invalidateSize(), 100);
            showNotification('Режим на цял екран', 'info');
        });
    } else {
        document.exitFullscreen().then(() => {
            setTimeout(() => map.invalidateSize(), 100);
        });
    }
}

// ===== MOBILE CONTROLS =====
function toggleMobileControls() {
    // On mobile, toggle new signal panel
    togglePanel('newSignal');
}

// Make globally available
window.toggleMobileControls = toggleMobileControls;

// ===== NOTIFICATIONS =====
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');

    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="bi bi-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;

    container.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle-fill';
        case 'error': return 'x-circle-fill';
        case 'warning': return 'exclamation-triangle-fill';
        default: return 'info-circle-fill';
    }
}

// ===== UTILITY FUNCTIONS =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}