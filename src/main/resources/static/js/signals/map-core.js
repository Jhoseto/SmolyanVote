// ===== MAP CORE =====
// Основна карта и контроли

let map;
let markersCluster;
let temporaryMarker;

// ===== ИНИЦИАЛИЗАЦИЯ =====
function initializeMap() {
    map = L.map('map', {
        center: [41.5766, 24.7014], // Смолян
        zoom: 14,
        minZoom: 10,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false
    });

    // Tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);

    // Markers cluster
    markersCluster = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 50,
        iconCreateFunction: function(cluster) {
            const count = cluster.getChildCount();
            let size = count >= 10 ? 'large' : count >= 5 ? 'medium' : 'small';
            return L.divIcon({
                html: `<div class="cluster-inner">${count}</div>`,
                className: `marker-cluster marker-cluster-${size}`,
                iconSize: [40, 40]
            });
        }
    });

    map.addLayer(markersCluster);

    // Map click за избор на локация
    map.on('click', handleMapClick);

    // Zoom control
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    console.log('Map initialized');
}

// ===== MAP CLICK =====
function handleMapClick(e) {
    if (!window.signalManagement?.locationSelectionMode) return;

    const { lat, lng } = e.latlng;

    // Премахни стар marker
    if (temporaryMarker) {
        map.removeLayer(temporaryMarker);
    }

    // Добави нов marker
    temporaryMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'temp-marker',
            html: '<i class="bi bi-geo-alt-fill"></i>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        })
    }).addTo(map);

    // Обнови формата
    updateFormCoordinates([lat, lng]);
    showNotification(`Избрано: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, 'success');
}

// ===== КОНТРОЛИ =====
function centerMap() {
    map.setView([41.5766, 24.7014], 14);
    showNotification('Картата е центрирана', 'info');
}

function getMyLocation() {
    if (!navigator.geolocation) {
        showNotification('Геолокацията не е поддържана', 'error');
        return;
    }

    const btn = document.getElementById('myLocationBtn');
    btn.innerHTML = '<i class="spinner-border spinner-border-sm"></i>';
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            map.setView([lat, lng], 16);

            btn.innerHTML = '<i class="bi bi-geo-alt-fill"></i>';
            btn.disabled = false;
            showNotification('Намерена е вашата локация', 'success');
        },
        function(error) {
            btn.innerHTML = '<i class="bi bi-geo-alt-fill"></i>';
            btn.disabled = false;
            showNotification('Не може да се определи локацията', 'error');
        }
    );
}

function toggleFullscreen() {
    const mapContainer = document.getElementById('map').parentElement;
    const btn = document.getElementById('fullscreenBtn');

    if (!document.fullscreenElement) {
        mapContainer.requestFullscreen().then(() => {
            btn.innerHTML = '<i class="bi bi-fullscreen-exit"></i>';
            setTimeout(() => map.invalidateSize(), 100);
        });
    } else {
        document.exitFullscreen().then(() => {
            btn.innerHTML = '<i class="bi bi-arrows-fullscreen"></i>';
            setTimeout(() => map.invalidateSize(), 100);
        });
    }
}

// ===== ПОМОЩНИ ФУНКЦИИ =====
function updateFormCoordinates(coordinates) {
    const latInput = document.getElementById('signalLatitude');
    const lngInput = document.getElementById('signalLongitude');
    const selectBtn = document.getElementById('selectLocationBtn');

    if (latInput) latInput.value = coordinates[0];
    if (lngInput) lngInput.value = coordinates[1];

    if (selectBtn) {
        selectBtn.innerHTML = '<i class="bi bi-check-circle-fill"></i> <span>Избрано</span>';
        selectBtn.classList.add('selected');
    }

    if (window.signalManagement) {
        window.signalManagement.locationSelectionMode = false;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `map-notification notification-${type}`;
    notification.innerHTML = `
        <i class="bi bi-${type === 'success' ? 'check-circle-fill' : type === 'error' ? 'exclamation-circle-fill' : 'info-circle-fill'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function initializeMapControls() {
    const centerBtn = document.getElementById('centerMapBtn');
    const locationBtn = document.getElementById('myLocationBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const zoomInBtn = document.getElementById('zoomInMapBtn');
    const zoomOutBtn = document.getElementById('zoomOutMapBtn');

    if (centerBtn) centerBtn.onclick = centerMap;
    if (locationBtn) locationBtn.onclick = getMyLocation;
    if (fullscreenBtn) fullscreenBtn.onclick = toggleFullscreen;
    if (zoomInBtn) zoomInBtn.onclick = zoomInMap;
    if (zoomOutBtn) zoomOutBtn.onclick = zoomOutMap;

    window.addEventListener('resize', () => {
        setTimeout(() => map.invalidateSize(), 100);
    });
}
// ===== ZOOM IN =====
function zoomInMap() {
    const currentZoom = map.getZoom();
    const maxZoom = map.getMaxZoom();
    if (currentZoom < maxZoom) {
        map.setZoom(currentZoom + 1);
        showNotification(`Увеличено до ниво ${currentZoom + 1}`, 'info');
    } else {
        showNotification('Достигнато максимално увеличение', 'warning');
    }
}

// ===== ZOOM OUT =====
function zoomOutMap() {
    const currentZoom = map.getZoom();
    const minZoom = map.getMinZoom();
    if (currentZoom > minZoom) {
        map.setZoom(currentZoom - 1);
        showNotification(`Намалено до ниво ${currentZoom - 1}`, 'info');
    } else {
        showNotification('Достигнато минимално увеличение', 'warning');
    }
}

// ===== PUBLIC API =====
window.mapCore = {
    initializeMap,
    initializeMapControls,
    getMap: () => map,
    getMarkersCluster: () => markersCluster,
    showNotification
};