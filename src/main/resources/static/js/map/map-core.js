// ===== MAP CORE FUNCTIONALITY =====
// Основна карта, контроли, инициализация

// ===== GLOBAL VARIABLES =====
let map;
let markersCluster;
let temporaryMarker;
let isFullscreen = false;
let isMobile = window.innerWidth <= 768;

// ===== MAP CONFIGURATION =====
const MAP_CONFIG = {
    center: [41.5766, 24.7014], // Смолян център
    zoom: 14,
    minZoom: 10,
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};

// ===== MAP INITIALIZATION =====
function initializeMap() {
    // Създаване на картата
    map = L.map('map', {
        center: MAP_CONFIG.center,
        zoom: MAP_CONFIG.zoom,
        minZoom: MAP_CONFIG.minZoom,
        maxZoom: MAP_CONFIG.maxZoom,
        zoomControl: false,
        attributionControl: true
    });

    // Добавяне на tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: MAP_CONFIG.attribution,
        maxZoom: MAP_CONFIG.maxZoom
    }).addTo(map);

    // Създаване на markers cluster
    markersCluster = L.markerClusterGroup({
        chunkedLoading: true,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 50,
        iconCreateFunction: function(cluster) {
            const count = cluster.getChildCount();
            let size = 'small';

            if (count >= 10) size = 'large';
            else if (count >= 5) size = 'medium';

            return L.divIcon({
                html: `<div class="cluster-inner">${count}</div>`,
                className: `marker-cluster marker-cluster-${size}`,
                iconSize: new L.Point(40, 40)
            });
        }
    });

    map.addLayer(markersCluster);

    // Добавяне на event listeners
    map.on('click', handleMapClick);
    map.on('zoomend', handleZoomEnd);
    map.on('moveend', handleMoveEnd);

    // Zoom control на по-добра позиция
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    console.log('Map initialized successfully');
}

// ===== MAP EVENT HANDLERS =====
function handleMapClick(e) {
    if (!window.signalManagement?.locationSelectionMode) return;
    const { lat, lng } = e.latlng;
    const coordinates = [lat, lng];

    // Премахване на предишен временен marker
    if (temporaryMarker) {
        map.removeLayer(temporaryMarker);
    }

    // Добавяне на нов временен marker
    temporaryMarker = L.marker(coordinates, {
        icon: L.divIcon({
            className: 'temp-marker',
            html: '<div class="temp-marker-content"><i class="bi bi-geo-alt-fill"></i></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        })
    }).addTo(map);

    // Обновяване на координатите в формата
    updateFormCoordinates(coordinates);

    // Показване на notification
    showNotification(`Избрано местоположение: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, 'success');
}

function handleZoomEnd() {
    // Може да се добави логика при промяна на zoom
    const zoom = map.getZoom();
    console.log('Zoom changed to:', zoom);
}

function handleMoveEnd() {
    // Може да се добави логика при движение на картата
    const center = map.getCenter();
    console.log('Map moved to:', center);
}

// ===== MAP CONTROLS =====
function centerMap() {
    map.setView(MAP_CONFIG.center, MAP_CONFIG.zoom);
    showNotification('Картата е центрирана', 'info');
}

function getMyLocation() {
    if (!navigator.geolocation) {
        showNotification('Браузърът ви не поддържа геолокация', 'error');
        return;
    }

    const btn = document.getElementById('myLocationBtn');
    btn.innerHTML = '<i class="bi bi-arrow-repeat spinner"></i>';
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            map.setView([lat, lng], 16);

            // Добавяне на временен marker за локацията
            if (temporaryMarker) {
                map.removeLayer(temporaryMarker);
            }

            temporaryMarker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'my-location-marker',
                    html: '<div class="my-location-content"><i class="bi bi-geo-alt-fill"></i></div>',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                })
            }).addTo(map);

            showNotification('Намерена е вашата локация', 'success');

            // Премахване на marker след 3 секунди
            setTimeout(() => {
                if (temporaryMarker) {
                    map.removeLayer(temporaryMarker);
                    temporaryMarker = null;
                }
            }, 3000);
        },
        function(error) {
            let message = 'Грешка при определяне на локацията';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    message = 'Достъпът до локацията е отказан';
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = 'Информацията за локацията не е достъпна';
                    break;
                case error.TIMEOUT:
                    message = 'Заявката за локация изтече';
                    break;
            }
            showNotification(message, 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        }
    );

    // Възстановяване на бутона
    setTimeout(() => {
        btn.innerHTML = '<i class="bi bi-geo-alt-fill"></i>';
        btn.disabled = false;
    }, 2000);
}

function toggleFullscreen() {
    const mapContainer = document.querySelector('.map-container');
    const btn = document.getElementById('fullscreenBtn');

    if (!isFullscreen) {
        // Влизане в fullscreen
        if (mapContainer.requestFullscreen) {
            mapContainer.requestFullscreen();
        } else if (mapContainer.webkitRequestFullscreen) {
            mapContainer.webkitRequestFullscreen();
        } else if (mapContainer.mozRequestFullScreen) {
            mapContainer.mozRequestFullScreen();
        } else if (mapContainer.msRequestFullscreen) {
            mapContainer.msRequestFullscreen();
        }

        btn.innerHTML = '<i class="bi bi-fullscreen-exit"></i>';
        btn.title = 'Изход от цял екран';
        isFullscreen = true;
    } else {
        // Изход от fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }

        btn.innerHTML = '<i class="bi bi-arrows-fullscreen"></i>';
        btn.title = 'Цял екран';
        isFullscreen = false;
    }

    // Преоразмеряване на картата след кратко забавяне
    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 100);
}

// ===== HELPER FUNCTIONS =====
function updateFormCoordinates(coordinates) {
    // Обновяване на скритите полета в формата
    const latInput = document.getElementById('signalLatitude');
    const lngInput = document.getElementById('signalLongitude');

    if (latInput) latInput.value = coordinates[0];
    if (lngInput) lngInput.value = coordinates[1];

    // Обновяване на бутона за избор на локация
    const selectBtn = document.getElementById('selectLocationBtn');
    if (selectBtn) {
        selectBtn.innerHTML = '<i class="bi bi-check-circle-fill"></i> <span>Местоположение избрано</span>';
        selectBtn.classList.add('selected');
    }

    // Изключване на режима за избор
    locationSelectionMode = false;
    const btn = document.getElementById('selectLocationBtn');
    if (btn) {
        btn.classList.remove('selecting');
    }
}

function showNotification(message, type = 'info') {
    // Създаване на notification елемент
    const notification = document.createElement('div');
    notification.className = `map-notification notification-${type}`;

    const icon = {
        success: 'bi-check-circle-fill',
        error: 'bi-exclamation-circle-fill',
        warning: 'bi-exclamation-triangle-fill',
        info: 'bi-info-circle-fill'
    }[type] || 'bi-info-circle-fill';

    notification.innerHTML = `
        <i class="bi ${icon}"></i>
        <span>${message}</span>
    `;

    // Добавяне към страницата
    document.body.appendChild(notification);

    // Анимация за появяване
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Премахване след 3 секунди
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ===== RESPONSIVE HANDLING =====
function handleResize() {
    const newIsMobile = window.innerWidth <= 768;

    if (newIsMobile !== isMobile) {
        isMobile = newIsMobile;
        adaptForMobile();
    }

    // Винаги преоразмеряваме картата при resize
    if (map) {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }
}

function adaptForMobile() {
    const signalsPanel = document.getElementById('signalsPanel');
    const leftControls = document.querySelector('.left-controls');

    if (isMobile) {
        // Mobile адаптации
        if (signalsPanel) {
            signalsPanel.classList.add('mobile');
        }
        if (leftControls) {
            leftControls.classList.add('mobile');
        }
    } else {
        // Desktop адаптации
        if (signalsPanel) {
            signalsPanel.classList.remove('mobile');
        }
        if (leftControls) {
            leftControls.classList.remove('mobile');
        }
    }
}

// ===== FULLSCREEN EVENT LISTENERS =====
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);

function handleFullscreenChange() {
    const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
    );

    if (isCurrentlyFullscreen !== isFullscreen) {
        isFullscreen = isCurrentlyFullscreen;

        const btn = document.getElementById('fullscreenBtn');
        if (btn) {
            if (isFullscreen) {
                btn.innerHTML = '<i class="bi bi-fullscreen-exit"></i>';
                btn.title = 'Изход от цял екран';
            } else {
                btn.innerHTML = '<i class="bi bi-arrows-fullscreen"></i>';
                btn.title = 'Цял екран';
            }
        }

        // Преоразмеряване на картата
        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 100);
    }
}

// ===== EVENT LISTENERS INITIALIZATION =====
function initializeMapControls() {
    // Map controls
    const centerBtn = document.getElementById('centerMapBtn');
    const locationBtn = document.getElementById('myLocationBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    if (centerBtn) centerBtn.addEventListener('click', centerMap);
    if (locationBtn) locationBtn.addEventListener('click', getMyLocation);
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);

    // Resize listener
    window.addEventListener('resize', handleResize);

    console.log('Map controls initialized');
}

// ===== PUBLIC API =====
window.mapCore = {
    initializeMap,
    initializeMapControls,
    centerMap,
    getMyLocation,
    toggleFullscreen,
    showNotification,
    getMap: () => map,
    getMarkersCluster: () => markersCluster,
    handleResize,
    isMobile: () => mapIsMobile
};

// Export за modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.mapCore;
}