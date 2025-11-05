// ============================================
// LOCATION PICKER MODULE
// Управление на избор на местоположение
// за създаване на сигнали (Mobile + Desktop)
// ============================================

(function() {
    'use strict';

    // Глобален обект за location picker
    window.locationPicker = {
        isActive: false,
        isMobile: false,
        tempLocation: null,

        // Инициализация
        init: function() {
            console.log('🗺️ Location Picker: Initializing...');
            this.isMobile = window.innerWidth <= 768;
            this.setupEventListeners();
            console.log('✅ Location Picker: Initialized (Mobile:', this.isMobile + ')');
        },

        // Event Listeners
        setupEventListeners: function() {
            const cancelBtn = document.getElementById('locationPickerCancelBtn');
            const cancelBtn2 = document.getElementById('cancelLocationBtn');
            const confirmBtn = document.getElementById('confirmLocationBtn');
            const myLocationBtn = document.getElementById('locationPickerMyLocationBtn');

            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.cancel());
            }

            if (cancelBtn2) {
                cancelBtn2.addEventListener('click', () => this.cancel());
            }

            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => this.confirm());
            }

            if (myLocationBtn) {
                myLocationBtn.addEventListener('click', () => this.getMyLocation());
            }

            // Resize listener
            window.addEventListener('resize', () => {
                this.isMobile = window.innerWidth <= 768;
            });
        },

        // Старт на избор
        start: function() {
            console.log('📍 Location Picker: Starting selection...');

            if (this.isMobile) {
                this.startMobilePicker();
            } else {
                this.startDesktopPicker();
            }
        },

        // ===== MOBILE PICKER =====
        startMobilePicker: function() {
            console.log('📱 Starting Mobile Location Picker');

            const overlay = document.getElementById('locationPickerOverlay');
            if (!overlay) {
                console.error('❌ Location picker overlay not found!');
                return;
            }

            // Покажи overlay
            overlay.classList.add('active');
            this.isActive = true;

            // Инициализирай картата в picker
            setTimeout(() => {
                if (window.mapCore && window.mapCore.map) {
                    window.mapCore.map.invalidateSize();

                    // Event listener за движение на картата
                    window.mapCore.map.on('moveend', () => this.updateCoordinates());

                    // Първоначално update на координатите
                    this.updateCoordinates();
                }
            }, 300);

            // Notification
            if (window.mapCore && window.mapCore.showNotification) {
                window.mapCore.showNotification('📍 Преместете картата за избор на местоположение', 'info', 3000);
            }
        },

        // Update координати (mobile)
        updateCoordinates: function() {
            if (!window.mapCore || !window.mapCore.map) return;

            const center = window.mapCore.map.getCenter();
            const lat = center.lat.toFixed(6);
            const lng = center.lng.toFixed(6);

            // Update текста
            const coordsText = document.getElementById('selectedCoordsText');
            if (coordsText) {
                coordsText.textContent = `${lat}, ${lng}`;
            }

            // Enable confirm button
            const confirmBtn = document.getElementById('confirmLocationBtn');
            if (confirmBtn) {
                confirmBtn.disabled = false;
            }

            // Запази координатите
            this.tempLocation = { lat: parseFloat(lat), lng: parseFloat(lng) };

            console.log('📍 Coordinates updated:', this.tempLocation);
        },

        // Get my location (mobile picker)
        getMyLocation: function() {
            console.log('📍 Getting user location...');

            if (!navigator.geolocation) {
                if (window.mapCore && window.mapCore.showNotification) {
                    window.mapCore.showNotification('❌ Геолокацията не е поддържана', 'error');
                }
                return;
            }

            const btn = document.getElementById('locationPickerMyLocationBtn');
            const originalHTML = btn ? btn.innerHTML : '';

            if (btn) {
                btn.innerHTML = '<i class="spinner-border spinner-border-sm"></i>';
                btn.disabled = true;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

                    console.log('✅ Location found:', lat, lng);

                    // Центрирай картата
                    if (window.mapCore && window.mapCore.map) {
                        window.mapCore.map.setView([lat, lng], 16);
                    }

                    // Restore button
                    if (btn) {
                        btn.innerHTML = originalHTML;
                        btn.disabled = false;
                    }

                    // Notification
                    if (window.mapCore && window.mapCore.showNotification) {
                        window.mapCore.showNotification('✅ Локация намерена!', 'success');
                    }
                },
                (error) => {
                    console.error('❌ Geolocation error:', error);

                    // Restore button
                    if (btn) {
                        btn.innerHTML = originalHTML;
                        btn.disabled = false;
                    }

                    let errorMsg = 'Грешка при определяне на местоположението';

                    if (error.code === error.PERMISSION_DENIED) {
                        errorMsg = '🔒 Моля разрешете достъп до местоположението';
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        errorMsg = '📡 GPS сигналът не е достъпен';
                    } else if (error.code === error.TIMEOUT) {
                        errorMsg = '⏱️ Заявката изтече';
                    }

                    if (window.mapCore && window.mapCore.showNotification) {
                        window.mapCore.showNotification(errorMsg, 'warning', 5000);
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        },

        // Confirm selection (mobile)
        confirm: function() {
            console.log('✅ Location confirmed:', this.tempLocation);

            if (!this.tempLocation) {
                console.error('❌ No location selected!');
                return;
            }

            // Запълни формата
            this.fillForm(this.tempLocation.lat, this.tempLocation.lng);

            // Затвори picker
            this.closeMobilePicker();

            // Notification
            if (window.mapCore && window.mapCore.showNotification) {
                window.mapCore.showNotification(
                    `✅ Местоположение избрано: ${this.tempLocation.lat.toFixed(5)}, ${this.tempLocation.lng.toFixed(5)}`,
                    'success',
                    4000
                );
            }
        },

        // Cancel selection
        cancel: function() {
            console.log('❌ Location selection cancelled');

            if (this.isMobile) {
                this.closeMobilePicker();
            } else {
                this.closeDesktopPicker();
            }

            if (window.mapCore && window.mapCore.showNotification) {
                window.mapCore.showNotification('Избор на местоположение отказан', 'info');
            }
        },

        // Затвори mobile picker
        closeMobilePicker: function() {
            const overlay = document.getElementById('locationPickerOverlay');
            if (overlay) {
                overlay.classList.remove('active');
            }

            this.isActive = false;
            this.tempLocation = null;

            // Премахни event listener
            if (window.mapCore && window.mapCore.map) {
                window.mapCore.map.off('moveend');
            }

            // Reset confirm button
            const confirmBtn = document.getElementById('confirmLocationBtn');
            if (confirmBtn) {
                confirmBtn.disabled = true;
            }

            // Reset координати текст
            const coordsText = document.getElementById('selectedCoordsText');
            if (coordsText) {
                coordsText.textContent = 'Преместете картата за избор';
            }
        },

        // ===== DESKTOP PICKER =====
        startDesktopPicker: function() {
            console.log('🖥️ Starting Desktop Location Picker');

            const panel = document.getElementById('newSignalPanel');

            // Минимизирай панела
            if (panel) {
                panel.style.transform = 'translateY(calc(100% - 80px))';
                panel.style.opacity = '0.7';
                panel.style.transition = 'all 0.3s ease';
            }

            // Активирай selection mode
            if (window.signalManagement) {
                window.signalManagement.locationSelectionMode = true;
            }

            this.isActive = true;

            // Visual feedback
            const mapElement = document.getElementById('map');
            if (mapElement) {
                mapElement.classList.add('location-selecting');
            }

            // Update button
            const btn = document.getElementById('selectLocationBtn');
            if (btn) {
                btn.innerHTML = '<i class="bi bi-crosshair"></i> <span>Кликнете на картата</span>';
                btn.classList.add('selecting');
                btn.classList.remove('selected');
            }

            // Notification
            if (window.mapCore && window.mapCore.showNotification) {
                window.mapCore.showNotification('🎯 Кликнете на картата за избор на местоположение', 'info', 5000);
            }
        },

        // Desktop location selected (извиква се от map-core.js)
        onDesktopLocationSelected: function(lat, lng) {
            console.log('✅ Desktop location selected:', lat, lng);

            // Запълни формата
            this.fillForm(lat, lng);

            // Възстанови панела
            const panel = document.getElementById('newSignalPanel');
            if (panel) {
                panel.style.transform = '';
                panel.style.opacity = '';
            }

            // Премахни visual feedback
            const mapElement = document.getElementById('map');
            if (mapElement) {
                mapElement.classList.remove('location-selecting');
            }

            // Деактивирай selection mode
            if (window.signalManagement) {
                window.signalManagement.locationSelectionMode = false;
            }

            this.isActive = false;

            // Notification
            if (window.mapCore && window.mapCore.showNotification) {
                window.mapCore.showNotification(
                    `✅ Местоположение избрано: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
                    'success',
                    3000
                );
            }
        },

        // Затвори desktop picker
        closeDesktopPicker: function() {
            const panel = document.getElementById('newSignalPanel');
            if (panel) {
                panel.style.transform = '';
                panel.style.opacity = '';
            }

            const mapElement = document.getElementById('map');
            if (mapElement) {
                mapElement.classList.remove('location-selecting');
            }

            if (window.signalManagement) {
                window.signalManagement.locationSelectionMode = false;
            }

            const btn = document.getElementById('selectLocationBtn');
            if (btn) {
                btn.innerHTML = '<i class="bi bi-geo-alt"></i> <span>Изберете местоположение</span>';
                btn.classList.remove('selecting');
            }

            this.isActive = false;
        },

        // ===== HELPERS =====
        fillForm: function(lat, lng) {
            console.log('📝 Filling form with coordinates:', lat, lng);

            const latInput = document.getElementById('signalLatitude');
            const lngInput = document.getElementById('signalLongitude');
            const selectBtn = document.getElementById('selectLocationBtn');

            if (latInput) latInput.value = lat;
            if (lngInput) lngInput.value = lng;

            if (selectBtn) {
                selectBtn.innerHTML = '<i class="bi bi-check-circle-fill"></i> <span>Местоположение избрано</span>';
                selectBtn.classList.add('selected');
                selectBtn.classList.remove('selecting');
            }
        }
    };

    // Auto-init при зареждане на DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            window.locationPicker.init();
        });
    } else {
        window.locationPicker.init();
    }

})();

// Експортиране на helper функции за съвместимост
window.updateFormCoordinates = function(coordinates) {
    if (window.locationPicker && !window.locationPicker.isMobile) {
        window.locationPicker.onDesktopLocationSelected(coordinates[0], coordinates[1]);
    }
};