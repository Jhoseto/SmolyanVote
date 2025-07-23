// ===== MAP CORE =====

let map;
let markersCluster;
let temporaryMarker;

// ===== ИНИЦИАЛИЗАЦИЯ =====
function initializeMap() {
    map = L.map('map', {
        center: [41.5766, 24.7014], // Смолян
        zoom: 14,
        minZoom: 10,
        maxZoom: 19,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false

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

}

// ===== MAP CLICK =====
function handleMapClick(e) {
    if (!window.signalManagement?.locationSelectionMode) return;

    const { lat, lng } = e.latlng;
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
        selectBtn.innerHTML = '<i class="bi bi-check-circle-fill"></i> <span>Местоположение избрано</span>';
        selectBtn.classList.add('selected');
        selectBtn.classList.remove('selecting');
    }

    if (window.signalManagement) {
        window.signalManagement.locationSelectionMode = false;
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
    updateFormCoordinates
};
window.updateFormCoordinates = updateFormCoordinates;
window.closeNotification = closeNotification;