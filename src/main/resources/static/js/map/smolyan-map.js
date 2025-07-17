// ===== CONFIGURATION & CONSTANTS =====
const SMOLYAN_CENTER = [41.5736, 24.7127];
const DEFAULT_ZOOM = 11;

// Граници на Смолянска област (приблизителни)
const SMOLYAN_BOUNDS = {
    north: 41.7500,  // Северна граница
    south: 41.3500,  // Южна граница
    east: 24.9500,   // Източна граница
    west: 24.4500    // Западна граница
};

// Категории с Bootstrap икони в SmolyanVote стил
const SIGNAL_CATEGORIES = {
    // Инфраструктура
    road_damage: { name: 'Дупки в пътищата', icon: 'bi-exclamation-triangle', color: '#e74c3c', group: 'infrastructure' },
    sidewalk_damage: { name: 'Счупени тротоари', icon: 'bi-exclamation-circle', color: '#e67e22', group: 'infrastructure' },
    lighting: { name: 'Неработещо осветление', icon: 'bi-lightbulb', color: '#f39c12', group: 'infrastructure' },
    traffic_signs: { name: 'Повредени пътни знаци', icon: 'bi-sign-stop', color: '#d35400', group: 'infrastructure' },
    water_sewer: { name: 'Водопровод/канализация', icon: 'bi-droplet', color: '#3498db', group: 'infrastructure' },

    // Околна среда
    illegal_waste: { name: 'Незаконни сметища', icon: 'bi-trash', color: '#8b4513', group: 'environment' },
    dangerous_trees: { name: 'Мъртви/опасни дървета', icon: 'bi-tree', color: '#27ae60', group: 'environment' },
    air_pollution: { name: 'Замърсяване на въздуха', icon: 'bi-cloud-haze', color: '#95a5a6', group: 'environment' },
    noise: { name: 'Шум', icon: 'bi-volume-up', color: '#9b59b6', group: 'environment' },
    parks_issues: { name: 'Проблеми с паркове', icon: 'bi-tree-fill', color: '#2ecc71', group: 'environment' },

    // Обществен ред
    illegal_parking: { name: 'Незаконно паркиране', icon: 'bi-car-front', color: '#e67e22', group: 'public_order' },
    vandalism: { name: 'Вандализъм', icon: 'bi-hammer', color: '#c0392b', group: 'public_order' },
    abandoned_vehicles: { name: 'Изоставени автомобили', icon: 'bi-car-front-fill', color: '#7f8c8d', group: 'public_order' },
    security_issues: { name: 'Проблеми с безопасност', icon: 'bi-shield-exclamation', color: '#c0392b', group: 'public_order' },

    // Комунални услуги
    waste_collection: { name: 'Проблеми със сметосъбиране', icon: 'bi-trash3', color: '#795548', group: 'municipal' },
    bus_stops: { name: 'Неработещи автобусни спирки', icon: 'bi-bus-front', color: '#2980b9', group: 'municipal' },
    public_transport: { name: 'Проблеми с обществен транспорт', icon: 'bi-bus-front-fill', color: '#3498db', group: 'municipal' },

    // Социални проблеми
    accessibility: { name: 'Недостъпност за хора с увреждания', icon: 'bi-person-wheelchair', color: '#8e44ad', group: 'social' },
    playgrounds: { name: 'Опасни детски площадки', icon: 'bi-exclamation-triangle-fill', color: '#e74c3c', group: 'social' },
    stray_animals: { name: 'Бездомни животни', icon: 'bi-heart', color: '#e91e63', group: 'social' }
};

// Приоритети с цветове
const URGENCY_LEVELS = {
    low: { name: 'Ниска', color: '#27ae60', icon: 'bi-circle-fill' },
    medium: { name: 'Средна', color: '#f39c12', icon: 'bi-circle-fill' },
    high: { name: 'Висока', color: '#e74c3c', icon: 'bi-circle-fill' }
};

// Статуси
const STATUS_TYPES = {
    new: { name: 'Нови', color: '#3498db', icon: 'bi-plus-circle' },
    in_progress: { name: 'В процес', color: '#f39c12', icon: 'bi-arrow-repeat' },
    resolved: { name: 'Решени', color: '#27ae60', icon: 'bi-check-circle' }
};

// Sample data за тестване
const SAMPLE_SIGNALS = [
    {
        id: 1,
        title: "Голяма дупка на главния път",
        category: "road_damage",
        description: "Опасна дупка на главния път към центъра на Смолян",
        coordinates: [41.5740, 24.7130],
        urgency: "high",
        status: "new",
        reporter: "Иван Петров",
        createdAt: "2025-01-15T10:30:00Z",
        photo: null
    },
    {
        id: 2,
        title: "Счупен тротоар до училището",
        category: "sidewalk_damage",
        description: "Счупен тротоар пред СОУ 'Никола Вапцаров' - опасно за деца",
        coordinates: [41.5720, 24.7140],
        urgency: "medium",
        status: "in_progress",
        reporter: "Мария Георгиева",
        createdAt: "2025-01-12T14:15:00Z",
        photo: null
    },
    {
        id: 3,
        title: "Неработещо осветление в парка",
        category: "lighting",
        description: "Няколко лампи в централния парк не работят",
        coordinates: [41.5730, 24.7120],
        urgency: "low",
        status: "new",
        reporter: "Анонимно",
        createdAt: "2025-01-10T18:20:00Z",
        photo: null
    },
    {
        id: 4,
        title: "Незаконно сметище в горичката",
        category: "illegal_waste",
        description: "Голямо количество строителни отпадъци в горичката до блоковете",
        coordinates: [41.5750, 24.7110],
        urgency: "medium",
        status: "new",
        reporter: "Стоян Николов",
        createdAt: "2025-01-08T09:45:00Z",
        photo: null
    },
    {
        id: 5,
        title: "Бездомни кучета в жилищен район",
        category: "stray_animals",
        description: "Група от 5-6 агресивни кучета в района на ул. Родопи",
        coordinates: [41.5760, 24.7090],
        urgency: "high",
        status: "new",
        reporter: "Анонимно",
        createdAt: "2025-01-05T16:30:00Z",
        photo: null
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

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    initializeControls();
    loadSignals();
    updateSignalsCount();
    initializeCollapsibles();
});

// ===== COLLAPSIBLE FUNCTIONALITY =====
function initializeCollapsibles() {
    // Initially show panels
    document.getElementById('leftPanelContent').classList.remove('collapsed');
    document.getElementById('rightPanelContent').classList.remove('collapsed');
    document.getElementById('filtersContent').classList.remove('collapsed');
}

function toggleLeftPanel() {
    const content = document.getElementById('leftPanelContent');
    const arrow = document.getElementById('leftPanelArrow');

    content.classList.toggle('collapsed');
    arrow.classList.toggle('rotated');
}

function toggleRightPanel() {
    const content = document.getElementById('rightPanelContent');
    const arrow = document.getElementById('rightPanelArrow');

    content.classList.toggle('collapsed');
    arrow.classList.toggle('rotated');
}

function toggleFilters() {
    const content = document.getElementById('filtersContent');
    const arrow = document.getElementById('filtersArrow');

    content.classList.toggle('collapsed');
    arrow.classList.toggle('rotated');
}

// Make functions globally available for onclick handlers
window.toggleLeftPanel = toggleLeftPanel;
window.toggleRightPanel = toggleRightPanel;
window.toggleFilters = toggleFilters;

// ===== MAP INITIALIZATION =====
function initializeMap() {
    // Дефинираме точните граници на областта
    const bounds = L.latLngBounds(
        L.latLng(SMOLYAN_BOUNDS.south, SMOLYAN_BOUNDS.west), // southwest
        L.latLng(SMOLYAN_BOUNDS.north, SMOLYAN_BOUNDS.east)  // northeast
    );

    // Initialize Leaflet map с ограничени граници
    map = L.map('map', {
        center: SMOLYAN_CENTER,
        zoom: DEFAULT_ZOOM,
        maxBounds: bounds,           // Не позволява излизане извън границите
        maxBoundsViscosity: 1.0,     // Силно ограничение
        minZoom: 10,                 // Минимално отдалечаване
        maxZoom: 18,                 // Максимално приближаване
        attributionControl: false    // Премахва attribution контролата
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '', // Премахваме attribution текста
        maxZoom: 18,
        bounds: bounds  // Ограничаваме tile-овете до областта
    }).addTo(map);

    // Добавяме граничната линия на областта
    addSmolyanBoundary();

    // Initialize marker cluster group
    markersCluster = L.markerClusterGroup({
        chunkedLoading: true,
        spiderfyOnMaxZoom: false,
        showCoverageOnHover: false,
        maxClusterRadius: 50
    });

    map.addLayer(markersCluster);

    // Add map click handler for selecting location
    map.on('click', onMapClick);
}

// ===== CONTROLS INITIALIZATION =====
function initializeControls() {
    // Create signal form
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
        if (e.target === this) {
            closeSignalModal();
        }
    });
}

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
    updateSignalsCount();
}

function createSignalMarker(signal) {
    const category = SIGNAL_CATEGORIES[signal.category];
    const urgency = URGENCY_LEVELS[signal.urgency];

    const icon = L.divIcon({
        className: 'signal-marker',
        html: `<div class="signal-marker-content" style="background-color: ${category.color}; border-color: ${urgency.color};">
                <i class="${category.icon}"></i>
               </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
    });

    const marker = L.marker(signal.coordinates, { icon }).bindPopup(createSignalPopup(signal));

    marker.signalData = signal;
    marker.on('click', function() {
        showSignalDetails(signal);
    });

    return marker;
}

function createSignalPopup(signal) {
    const category = SIGNAL_CATEGORIES[signal.category];
    const urgency = URGENCY_LEVELS[signal.urgency];
    const status = STATUS_TYPES[signal.status];

    return `
        <div class="signal-popup">
            <div class="popup-header">
                <h4>${signal.title}</h4>
                <div class="popup-badges">
                    <span class="badge urgency-${signal.urgency}">${urgency.name}</span>
                    <span class="badge status-${signal.status}">${status.name}</span>
                </div>
            </div>
            <div class="popup-content">
                <div class="popup-category">
                    <i class="${category.icon}"></i>
                    <span>${category.name}</span>
                </div>
                <p class="popup-description">${signal.description}</p>
                <div class="popup-meta">
                    <small>От: ${signal.reporter}</small>
                    <small>Дата: ${new Date(signal.createdAt).toLocaleDateString('bg-BG')}</small>
                </div>
            </div>
            <div class="popup-actions">
                <button class="btn-primary" onclick="showSignalDetails(${signal.id})">
                    <i class="bi bi-eye"></i> Детайли
                </button>
            </div>
        </div>
    `;
}

// ===== LOCATION SELECTION =====
function toggleLocationSelection() {
    isSelectingLocation = !isSelectingLocation;
    const btn = document.getElementById('selectLocationBtn');

    if (isSelectingLocation) {
        btn.innerHTML = '<i class="bi bi-x-circle"></i> Отказ';
        btn.classList.add('selecting');
        showNotification('Кликнете на картата за да изберете местоположение', 'info');
    } else {
        btn.innerHTML = '<i class="bi bi-geo-alt"></i> Кликнете на картата';
        btn.classList.remove('selecting');
        selectedCoordinates = null;
        updateCoordsDisplay();
    }
}

function onMapClick(e) {
    if (!isSelectingLocation) return;

    const clickedCoords = [e.latlng.lat, e.latlng.lng];

    // Проверяваме дали точката е в границите на областта
    if (!isWithinSmolyanBounds(clickedCoords)) {
        showNotification('Моля, изберете местоположение в границите на Смолянска област', 'error');
        return;
    }

    selectedCoordinates = clickedCoords;
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

// ===== SIGNAL CREATION =====
function handleCreateSignal(e) {
    e.preventDefault();

    if (!selectedCoordinates) {
        showNotification('Моля, изберете местоположение на картата', 'error');
        return;
    }

    const formData = new FormData(e.target);

    // For logged users, we'll use their username and profile picture
    // For now, we use "Анонимно" as default
    const reporter = "Анонимно"; // Will be replaced with actual user data when integrated

    const newSignal = {
        id: currentSignals.length + 1,
        title: document.getElementById('signalTitle').value,
        category: document.getElementById('signalCategory').value,
        description: document.getElementById('signalDescription').value,
        coordinates: selectedCoordinates,
        urgency: document.getElementById('signalUrgency').value,
        status: 'new',
        reporter: reporter,
        createdAt: new Date().toISOString(),
        photo: null // Will be implemented later
    };

    currentSignals.push(newSignal);
    loadSignals();

    // Reset form
    e.target.reset();
    selectedCoordinates = null;
    updateCoordsDisplay();
    document.getElementById('selectLocationBtn').innerHTML = '<i class="bi bi-geo-alt"></i> Кликнете на картата';

    showNotification('Сигналът е изпратен успешно!', 'success');
}

// ===== FILTERING =====
function applyFilters() {
    activeFilters.category = document.getElementById('categoryFilter').value;
    activeFilters.urgency = document.getElementById('urgencyFilter').value;
    activeFilters.status = document.getElementById('statusFilter').value;

    loadSignals();
}

function updateSignalsList(signals) {
    const container = document.getElementById('signalsList');

    if (signals.length === 0) {
        container.innerHTML = `
            <div class="no-signals">
                <i class="bi bi-inbox"></i>
                <h4>Няма сигнали</h4>
                <p>Не са намерени сигнали отговарящи на филтрите</p>
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
                </div>
            </div>
            <h4 class="signal-title">${signal.title}</h4>
            <p class="signal-description">${signal.description}</p>
            <div class="signal-footer">
                <div class="signal-meta">
                    <span class="signal-reporter">${signal.reporter}</span>
                    <span class="signal-date">${new Date(signal.createdAt).toLocaleDateString('bg-BG')}</span>
                </div>
                <div class="signal-status status-${signal.status}">
                    <i class="${status.icon}"></i>
                    <span>${status.name}</span>
                </div>
            </div>
        </div>
    `;
}

function updateSignalsCount() {
    const count = currentSignals.length;
    document.getElementById('signalsCount').textContent = count;
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
            <div class="detail-header">
                <div class="detail-category">
                    <i class="${category.icon}" style="color: ${category.color}"></i>
                    <span>${category.name}</span>
                </div>
                <div class="detail-badges">
                    <span class="badge urgency-${signal.urgency}">
                        <i class="${urgency.icon}"></i> ${urgency.name}
                    </span>
                    <span class="badge status-${signal.status}">
                        <i class="${status.icon}"></i> ${status.name}
                    </span>
                </div>
            </div>
            
            <div class="detail-description">
                <h5>Описание</h5>
                <p>${signal.description}</p>
            </div>
            
            <div class="detail-location">
                <h5>Местоположение</h5>
                <p>Координати: ${signal.coordinates[0].toFixed(6)}, ${signal.coordinates[1].toFixed(6)}</p>
                <button class="btn-secondary" onclick="centerMapOnSignal(${signal.id})">
                    <i class="bi bi-geo-alt"></i> Покажи на картата
                </button>
            </div>
            
            <div class="detail-meta">
                <h5>Информация</h5>
                <div class="meta-grid">
                    <div class="meta-item">
                        <strong>Подаден от:</strong>
                        <span>${signal.reporter}</span>
                    </div>
                    <div class="meta-item">
                        <strong>Дата:</strong>
                        <span>${new Date(signal.createdAt).toLocaleString('bg-BG')}</span>
                    </div>
                    <div class="meta-item">
                        <strong>ID:</strong>
                        <span>#${signal.id}</span>
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
    const mapContainer = document.querySelector('.map-section');
    if (!document.fullscreenElement) {
        mapContainer.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// ===== UTILITY FUNCTIONS =====
function addSmolyanBoundary() {
    // Полигон на Смолянска област (опростен)
    const smolyanPolygon = [
        [41.7500, 24.4500], // северозапад
        [41.7500, 24.9500], // североизток
        [41.3500, 24.9500], // югоизток
        [41.3500, 24.4500], // югозапад
        [41.7500, 24.4500]  // затваряме полигона
    ];

    // Създаваме полигон със стил
    const boundaryPolygon = L.polygon(smolyanPolygon, {
        color: '#16a085',
        weight: 2,
        opacity: 0.6,
        fillColor: '#16a085',
        fillOpacity: 0.03,
        dashArray: '8, 8'
    }).addTo(map);

    // Popup с информация за областта
    boundaryPolygon.bindPopup(`
        <div style="text-align: center; font-weight: bold; color: #16a085;">
            <h4><i class="bi bi-geo-alt"></i> Смолянска област</h4>
            <p>Граждански сигнали само в границите на областта</p>
        </div>
    `);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    const iconMap = {
        success: 'bi-check-circle',
        error: 'bi-x-circle',
        warning: 'bi-exclamation-triangle',
        info: 'bi-info-circle'
    };

    notification.innerHTML = `
        <i class="${iconMap[type]}"></i>
        <span>${message}</span>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Show with animation
    setTimeout(() => notification.classList.add('show'), 100);

    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Make functions globally available for onclick handlers
window.showSignalDetails = showSignalDetails;
window.centerMapOnSignal = centerMapOnSignal;

