// ===== MAP CORE =====

let map;
let markersCluster;
let temporaryMarker;

// Граници на област Смолян (bounding box) - актуализирани според точния полигон
const SMOLYAN_REGION_BOUNDS = [
    [41.336, 24.318], // Югозападен ъгъл (min lat, min lng)
    [41.926, 25.168]  // Североизточен ъгъл (max lat, max lng)
];

// Полигон на границите на област Смолян - точни координати
const SMOLYAN_REGION_POLYGON = [
    [41.795888098191426, 24.318237304687504],
    [41.828642001860544, 24.337463378906254],
    [41.85728792769137, 24.367675781250004],
    [41.86956082699455, 24.406127929687504],
    [41.89205502378826, 24.42672729492188],
    [41.92578147109541, 24.444580078125004],
    [41.917606998887024, 24.510498046875],
    [41.880808915193874, 24.559936523437504],
    [41.91249742196845, 24.66018676757813],
    [41.881831370505594, 24.765930175781254],
    [41.73340458018376, 24.78927612304688],
    [41.70880422215806, 24.87167358398438],
    [41.62673502076991, 24.919738769531254],
    [41.58360681482734, 25.01312255859375],
    [41.49726393195056, 25.05294799804688],
    [41.498292501398545, 25.16830444335938],
    [41.3737170273134, 25.15457153320313],
    [41.33660710626426, 25.106506347656254],
    [41.40668586105652, 24.916992187500004],
    [41.395354710280166, 24.827728271484375],
    [41.34691753986531, 24.80850219726563],
    [41.41904486310779, 24.71649169921875],
    [41.42625319507272, 24.614868164062504],
    [41.56819689811343, 24.524230957031254],
    [41.52708581365465, 24.44869995117188],
    [41.52502957323801, 24.36904907226563],
    [41.64110468287587, 24.34982299804688],
    [41.68111756290652, 24.342956542968754],
    [41.7200805552871, 24.34158325195313],
    [41.7559466348148, 24.32235717773438]
];

let smolyanRegionPolygon = null;

// Проверка дали точка е вътре в полигон (Ray casting algorithm)
// Полигонът е масив от [lat, lng] координати
function isPointInPolygon(lat, lng, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const lati = polygon[i][0], lngi = polygon[i][1]; // Текуща точка
        const latj = polygon[j][0], lngj = polygon[j][1]; // Предишна точка
        
        // Проверка дали лъчът от точката (вдясно) пресича ръба
        const intersect = ((lngi > lng) !== (lngj > lng)) && 
                         (lat < (latj - lati) * (lng - lngi) / (lngj - lngi) + lati);
        if (intersect) inside = !inside;
    }
    return inside;
}

// Проверка дали координатите са в границите на област Смолян
function isWithinSmolyanRegion(lat, lng) {
    // Първо проверка с bounding box за бързо отхвърляне
    if (lat < SMOLYAN_REGION_BOUNDS[0][0] || lat > SMOLYAN_REGION_BOUNDS[1][0] ||
        lng < SMOLYAN_REGION_BOUNDS[0][1] || lng > SMOLYAN_REGION_BOUNDS[1][1]) {
        return false;
    }
    // След това точна проверка с полигон
    return isPointInPolygon(lat, lng, SMOLYAN_REGION_POLYGON);
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
function initializeMap() {
    map = L.map('map', {
        center: [41.5766, 24.7014], // Смолян
        zoom: 14,
        minZoom: 10,
        maxZoom: 19,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        maxBounds: SMOLYAN_REGION_BOUNDS, // Ограничаване на картата до границите на областта
        maxBoundsViscosity: 1.0 // Пълно ограничаване - не позволява излизане извън границите

    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

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
    map.on('click', handleMapClick);

    // Добавяне на видим полигон на границите на област Смолян
    smolyanRegionPolygon = L.polygon(SMOLYAN_REGION_POLYGON, {
        color: '#ffffff',
        weight: 2,
        opacity: 0.9,
        fillColor: '#ffffff',
        fillOpacity: 0.1, // 10% прозрачност
        dashArray: '8, 4',
        interactive: false // Не блокира събитията на мишката
    }).addTo(map);

    // Добавяне на tooltip към полигона
    smolyanRegionPolygon.bindTooltip('Граници на област Смолян', {
        permanent: false,
        direction: 'center',
        className: 'region-boundary-tooltip'
    });

}

// ===== MAP CLICK =====
function handleMapClick(e) {
    if (!window.signalManagement?.locationSelectionMode) return;

    const { lat, lng } = e.latlng;
    
    // Проверка дали координатите са в границите на област Смолян
    if (!isWithinSmolyanRegion(lat, lng)) {
        showNotification('Моля изберете местоположение в границите на област Смолян', 'error', 5000);
        return;
    }
    
    if (temporaryMarker) {
        map.removeLayer(temporaryMarker);
    }

    temporaryMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'temp-marker',
            html: `<div class="temp-marker-content">
                    <i class="bi bi-geo-alt-fill"></i>
                   </div>`,
            iconSize: [32, 40],
            iconAnchor: [16, 40]
        })
    }).addTo(map);

    if (window.updateFormCoordinates) {
        window.updateFormCoordinates([lat, lng]);
    }
    showNotification(`Избрано: ${lat.toFixed(5)}, ${lng.toFixed(5)}`, 'success');
}

// ===== КОНТРОЛИ =====
function centerMap() {
    map.setView([41.5766, 24.7014], 14);
    showNotification('Картата е центрирана', 'info');
}

//==== ЛОКАЦИЯ ====
function getMyLocation() {
    if (!navigator.geolocation) {
        showNotification('Геолокацията не е поддържана от вашия браузър', 'error');
        return;
    }

    const btn = document.getElementById('myLocationBtn');
    const originalHTML = btn.innerHTML;

    showNotification('🔍 Моля разрешете достъп до местоположението...', 'info', 3000);

    btn.innerHTML = '<i class="spinner-border spinner-border-sm"></i>';
    btn.disabled = true;

    const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            // Проверка дали локацията е в границите на област Смолян
            if (!isWithinSmolyanRegion(lat, lng)) {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
                showNotification('Вашата локация е извън границите на област Смолян. Моля изберете местоположение върху картата.', 'warning', 6000);
                // Центрираме картата обратно в Смолян
                map.setView([41.5766, 24.7014], 14);
                return;
            }

            map.setView([lat, lng], 16);

            btn.innerHTML = originalHTML;
            btn.disabled = false;

            showNotification(`✅ Локация намерена! (точност: ${Math.round(accuracy)}м)`, 'success', 4000);
        },
        function(error) {
            btn.innerHTML = originalHTML;
            btn.disabled = false;

            if (error.code === error.PERMISSION_DENIED) {
                showNotification('🔒 Моля разрешете достъп до местоположението в браузъра', 'warning', 6000);
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                showNotification('📡 GPS сигналът не е достъпен', 'error', 5000);
            } else if (error.code === error.TIMEOUT) {
                showNotification('⏱️ Заявката за локация изтече', 'error', 5000);
            } else {
                showNotification('Грешка при определяне на местоположението', 'error', 5000);
            }

            console.error('Geolocation error:', error);
        },
        options
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

    document.getElementById('map').classList.remove('location-selecting');

    if (latInput) latInput.value = coordinates[0];
    if (lngInput) lngInput.value = coordinates[1];
    if (selectBtn) {
        selectBtn.innerHTML = '<i class="bi bi-check-circle-fill"></i> <span>Местоположение избрано</span>';
        selectBtn.classList.add('selected');
        selectBtn.classList.remove('selecting');
    }

    if (window.signalManagement) {
        window.signalManagement.locationSelectionMode = false;
    }
    
    // На мобилен: връщаме панела след като е избрано местоположение
    if (window.innerWidth <= 768) {
        const panel = document.getElementById('newSignalPanel');
        if (panel && panel.classList.contains('minimized')) {
            panel.classList.remove('minimized');
            // Скриваме cancel бутона
            const cancelBtn = document.querySelector('.cancel-location-btn');
            if (cancelBtn) {
                cancelBtn.style.display = 'none';
            }
            // Малко забавяне за плавна анимация
            setTimeout(() => {
                const locationRow = panel.querySelector('.form-row.location-row');
                if (locationRow) {
                    locationRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 300);
        }
    }
}

function showNotification(message, type = 'info', duration = 5000) {
    if (window.globalShowNotification && window.globalShowNotification !== showNotification) {
        return window.globalShowNotification(message, type, duration);
    }

    const existingNotifications = document.querySelectorAll('.notification, .signal-alert-toast');
    existingNotifications.forEach(notif => {
        if (notif.parentNode) notif.parentNode.removeChild(notif);
    });

    let alertSystem = document.querySelector('.signal-alert-system');
    if (!alertSystem) {
        alertSystem = document.createElement('div');
        alertSystem.className = 'signal-alert-system';
        document.body.appendChild(alertSystem);
    }
    const icons = {
        success: 'bi-check-circle-fill',
        error: 'bi-exclamation-circle-fill',
        warning: 'bi-exclamation-triangle-fill',
        info: 'bi-info-circle-fill'
    };

    const toast = document.createElement('div');
    toast.className = `signal-alert-toast ${type}`;

    const toastId = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    toast.id = toastId;

    toast.innerHTML = `
        <i class="bi ${icons[type] || icons.info} alert-icon"></i>
        <div class="alert-message">${message}</div>
        <button class="alert-close" onclick="closeNotification('${toastId}')" title="Затвори">
            <i class="bi bi-x"></i>
        </button>
    `;

    alertSystem.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        closeNotification(toastId);
    }, duration);
}

window.globalShowNotification = showNotification;
window.showNotification = showNotification;

function closeNotification(toastId) {
    const toast = document.getElementById(toastId);
    if (!toast) return;

    toast.classList.remove('show');

    setTimeout(() => {
        if (toast && toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }

        const alertSystem = document.querySelector('.signal-alert-system');
        if (alertSystem && alertSystem.children.length === 0) {
            alertSystem.remove();
        }
    }, 300);
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
    } else {
    }
}
// ===== ZOOM OUT =====
function zoomOutMap() {
    const currentZoom = map.getZoom();
    const minZoom = map.getMinZoom();
    if (currentZoom > minZoom) {
        map.setZoom(currentZoom - 1);
    } else {
    }
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.showNotification = window.globalShowNotification;
    }, 100);
});

// ===== PUBLIC API =====
window.mapCore = {
    initializeMap,
    initializeMapControls,
    getMap: () => map,
    getMarkersCluster: () => markersCluster,
    showNotification,
    updateFormCoordinates,
    isWithinSmolyanRegion
};
window.updateFormCoordinates = updateFormCoordinates;
window.closeNotification = closeNotification;
window.isWithinSmolyanRegion = isWithinSmolyanRegion;