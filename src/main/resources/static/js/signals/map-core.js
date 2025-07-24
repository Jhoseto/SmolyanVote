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
        showNotification('Геолокацията не е поддържана от вашия браузър', 'error');
        return;
    }

    const btn = document.getElementById('myLocationBtn');
    const originalHTML = btn.innerHTML;

    // Информираме потребителя че ще се покаже popup
    showNotification('🔍 Моля разрешете достъп до местоположението...', 'info', 3000);

    btn.innerHTML = '<i class="spinner-border spinner-border-sm"></i>';
    btn.disabled = true;

    const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000  // 1 минута кеш
    };

    // Директно извикваме геолокацията - това ще покаже popup ако не е блокирано
    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            map.setView([lat, lng], 16);

            btn.innerHTML = originalHTML;
            btn.disabled = false;

            showNotification(`✅ Локация намерена! (точност: ${Math.round(accuracy)}м)`, 'success', 4000);
        },
        function(error) {
            btn.innerHTML = originalHTML;
            btn.disabled = false;

            if (error.code === error.PERMISSION_DENIED) {
                // Ако е блокирано, показваме как да се reset-не
                showLocationPermissionHelp();
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                showNotification('📡 GPS сигналът не е достъпен. Опитайте на открито.', 'error', 6000);
            } else if (error.code === error.TIMEOUT) {
                showNotification('⏱️ Заявката за локация изтече. Опитайте отново.', 'error', 5000);
            } else {
                showNotification('Грешка при определяне на местоположението', 'error', 5000);
            }

            console.error('Geolocation error:', error);
        },
        options
    );
}

// Функция за показване на помощ при блокирано разрешение
function showLocationPermissionHelp() {
    // Детектираме типа устройство/браузър
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isChrome = /Chrome/i.test(navigator.userAgent);
    const isFirefox = /Firefox/i.test(navigator.userAgent);
    const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);

    let instructions = '';

    if (isMobile) {
        instructions = `
            📱 <strong>Как да разрешите локацията на мобилно устройство:</strong><br><br>
            1️⃣ Кликнете на иконката 🔒 или ⓘ до адреса<br>
            2️⃣ Изберете "Разрешения" или "Permissions"<br>
            3️⃣ Поставете "Местоположение" на "Разреши"<br>
            4️⃣ Обновете страницата и опитайте отново
        `;
    } else {
        if (isChrome) {
            instructions = `
                🖥️ <strong>Chrome - Как да разрешите локацията:</strong><br><br>
                1️⃣ Кликнете на иконката 🔒 в началото на адресния ред<br>
                2️⃣ Намерете "Местоположение" и променете на "Разреши"<br>
                3️⃣ Обновете страницата (F5) и опитайте отново
            `;
        } else if (isFirefox) {
            instructions = `
                🦊 <strong>Firefox - Как да разрешите локацията:</strong><br><br>
                1️⃣ Кликнете на иконката 🛡️ до адреса<br>
                2️⃣ Кликнете върху "Блокирано" до "Местоположение"<br>
                3️⃣ Изберете "Разреши" и обновете страницата
            `;
        } else if (isSafari) {
            instructions = `
                🧭 <strong>Safari - Как да разрешите локацията:</strong><br><br>
                1️⃣ Отидете в Safari → Preferences → Websites<br>
                2️⃣ Намерете "Location" в лявата колона<br>
                3️⃣ Поставете този сайт на "Allow"
            `;
        } else {
            instructions = `
                🌐 <strong>Как да разрешите локацията:</strong><br><br>
                1️⃣ Кликнете на иконката за сигурност до адреса<br>
                2️⃣ Намерете настройките за "Местоположение"<br>
                3️⃣ Променете на "Разреши" и обновете страницата
            `;
        }
    }

    showLocationHelpModal(instructions);
}

// Показване на модален прозорец с инструкции
function showLocationHelpModal(instructions) {
    // Премахваме съществуващ модал ако има
    const existingModal = document.getElementById('locationHelpModal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'locationHelpModal';
    modal.innerHTML = `
        <div class="location-help-overlay">
            <div class="location-help-modal">
                <div class="location-help-header">
                    <h3>🔐 Разрешете достъп до местоположението</h3>
                    <button class="location-help-close" onclick="closeLocationHelp()">✕</button>
                </div>
                <div class="location-help-content">
                    ${instructions}
                    <br><br>
                    <div class="location-help-note">
                        💡 <strong>Защо ни трябва локацията?</strong><br>
                        За да можем да центрираме картата на вашето местоположение и да ви улесним при създаване на сигнали.
                    </div>
                </div>
                <div class="location-help-actions">
                    <button class="btn-secondary" onclick="closeLocationHelp()">Затвори</button>
                    <button class="btn-primary" onclick="refreshPageForLocation()">Обнови страницата</button>
                </div>
            </div>
        </div>
    `;

    // Добавяме CSS стиловете
    const style = document.createElement('style');
    style.textContent = `
        .location-help-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .location-help-modal {
            background: white;
            border-radius: 12px;
            max-width: 500px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        .location-help-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            border-bottom: 1px solid #eee;
        }
        .location-help-header h3 {
            margin: 0;
            color: #333;
            font-size: 18px;
        }
        .location-help-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #999;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
        }
        .location-help-close:hover {
            background: #f5f5f5;
            color: #333;
        }
        .location-help-content {
            padding: 24px;
            line-height: 1.6;
            color: #555;
        }
        .location-help-note {
            background: #f8f9fa;
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid var(--primary-color);
        }
        .location-help-actions {
            padding: 20px 24px;
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            border-top: 1px solid #eee;
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(modal);
}

// Функции за модала
function closeLocationHelp() {
    const modal = document.getElementById('locationHelpModal');
    if (modal) {
        modal.remove();
    }
}

function refreshPageForLocation() {
    window.location.reload();
}

// Глобални функции
window.closeLocationHelp = closeLocationHelp;
window.refreshPageForLocation = refreshPageForLocation;
//




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