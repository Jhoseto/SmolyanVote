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

            // Инициализирай отделна карта в picker overlay
            setTimeout(() => {
                this.initMobilePickerMap();
            }, 300);

            // Notification
            if (window.mapCore && window.mapCore.showNotification) {
                window.mapCore.showNotification('📍 Преместете картата за избор на местоположение', 'info', 3000);
            }
        },

        // Инициализиране на отделна карта за mobile picker
        initMobilePickerMap: function() {
            const mapContainer = document.getElementById('locationPickerMap');
            if (!mapContainer) {
                console.error('❌ Location picker map container not found!');
                return;
            }

            // Премахни старата карта ако съществува
            if (this.mobilePickerMap) {
                this.mobilePickerMap.remove();
            }

            // Граници на област Смолян (актуализирани според точния полигон)
            const SMOLYAN_BOUNDS = [
                [41.336, 24.318], // Югозападен ъгъл
                [41.926, 25.168]  // Североизточен ъгъл
            ];
            
            // Създай нова карта с ограничения
            this.mobilePickerMap = L.map('locationPickerMap', {
                center: [41.576, 24.701], // Smolyan coordinates
                zoom: 14,
                zoomControl: false,
                attributionControl: false,
                maxBounds: SMOLYAN_BOUNDS,
                maxBoundsViscosity: 1.0
            });

            // Добави tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.mobilePickerMap);

            // Добави marker cluster group
            this.mobilePickerMarkerCluster = L.markerClusterGroup({
                chunkedLoading: true,
                maxClusterRadius: 50
            });

            // Зареди сигналите (ще създаде маркери с mobile клас)
            this.loadSignalsForPicker();

            // Добавяне на видим полигон на границите на област Смолян
            const regionPolygon = L.polygon(this.SMOLYAN_POLYGON, {
                color: '#ffffff',
                weight: 2,
                opacity: 0.9,
                fillColor: '#ffffff',
                fillOpacity: 0.1, // 10% прозрачност
                dashArray: '8, 4',
                interactive: false // Не блокира събитията на мишката
            }).addTo(this.mobilePickerMap);

            // Добавяне на tooltip към полигона
            regionPolygon.bindTooltip('Граници на област Смолян', {
                permanent: false,
                direction: 'center',
                className: 'region-boundary-tooltip'
            });

            // Event listener за движение на картата
            this.mobilePickerMap.on('moveend', () => this.updateCoordinates());

            // Първоначално update на координатите
            this.updateCoordinates();

            console.log('✅ Mobile picker map initialized');
        },

        // Зарежда сигналите за picker картата
        loadSignalsForPicker: async function() {
            try {
                const response = await fetch('/api/signals/map-data');
                if (!response.ok) throw new Error('Failed to load signals');

                const signals = await response.json();

                // Добави markers за сигналите
                signals.forEach(signal => {
                    // Създай marker с mobile клас за mobile picker картата
                    const category = this.getCategoryInfo(signal.category);
                    const icon = L.divIcon({
                        className: 'signal-marker',
                        html: `<div class="signal-marker-content" style="background-color: ${category.color}; border-color: ${category.color}; border-width: 3px;">
                                <i class="${category.icon}"></i>
                               </div>`,
                        iconSize: [32, 32],
                        iconAnchor: [16, 16]
                    });

                    const marker = L.marker([signal.latitude, signal.longitude], { icon });

                    // Popup content
                    const popupContent = `
                        <div class="signal-popup">
                            <h4>${signal.title}</h4>
                            <p>${signal.description.substring(0, 100)}${signal.description.length > 100 ? '...' : ''}</p>
                            <small>Категория: ${this.getCategoryDisplayName(signal.category)}</small>
                        </div>
                    `;

                    marker.bindPopup(popupContent);
                    this.mobilePickerMarkerCluster.addLayer(marker);
                });

                this.mobilePickerMap.addLayer(this.mobilePickerMarkerCluster);
            } catch (error) {
                console.error('Error loading signals for picker:', error);
            }
        },

        // Полигон на границите на област Смолян (същият като в map-core.js)
        // Точни координати
        SMOLYAN_POLYGON: [
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
        ],

        // Проверка дали точка е вътре в полигон (Ray casting algorithm)
        // Полигонът е масив от [lat, lng] координати
        isPointInPolygon: function(lat, lng, polygon) {
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
        },

        // Проверка дали координатите са в границите на област Смолян
        isWithinSmolyanRegion: function(lat, lng) {
            // Първо проверка с bounding box за бързо отхвърляне (актуализирани граници)
            if (lat < 41.336 || lat > 41.926 || lng < 24.318 || lng > 25.168) {
                return false;
            }
            // След това точна проверка с полигон
            return this.isPointInPolygon(lat, lng, this.SMOLYAN_POLYGON);
        },

        // Update координати (mobile)
        updateCoordinates: function() {
            if (!this.mobilePickerMap) return;

            const center = this.mobilePickerMap.getCenter();
            const lat = center.lat.toFixed(6);
            const lng = center.lng.toFixed(6);
            const latNum = parseFloat(lat);
            const lngNum = parseFloat(lng);

            // Проверка дали координатите са в границите
            const isValid = this.isWithinSmolyanRegion(latNum, lngNum);

            // Update текста
            const coordsText = document.getElementById('selectedCoordsText');
            if (coordsText) {
                coordsText.textContent = `${lat}, ${lng}`;
                if (!isValid) {
                    coordsText.style.color = '#dc3545';
                    coordsText.title = 'Местоположението е извън границите на област Смолян';
                } else {
                    coordsText.style.color = '';
                    coordsText.title = '';
                }
            }

            // Enable/disable confirm button според валидността
            const confirmBtn = document.getElementById('confirmLocationBtn');
            if (confirmBtn) {
                confirmBtn.disabled = !isValid;
                if (!isValid) {
                    confirmBtn.title = 'Моля изберете местоположение в границите на област Смолян';
                } else {
                    confirmBtn.title = '';
                }
            }

            // Запази координатите
            this.tempLocation = { lat: latNum, lng: lngNum, valid: isValid };

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

                    // Проверка дали локацията е в границите на област Смолян
                    if (!this.isWithinSmolyanRegion(lat, lng)) {
                        if (btn) {
                            btn.innerHTML = originalHTML;
                            btn.disabled = false;
                        }
                        if (window.mapCore && window.mapCore.showNotification) {
                            window.mapCore.showNotification('Вашата локация е извън границите на област Смолян. Моля изберете местоположение върху картата.', 'warning', 6000);
                        }
                        // Центрираме картата обратно в Смолян
                        if (this.mobilePickerMap) {
                            this.mobilePickerMap.setView([41.576, 24.701], 14);
                        }
                        return;
                    }

                    // Центрирай картата
                    if (this.mobilePickerMap) {
                        this.mobilePickerMap.setView([lat, lng], 16);
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

            // Проверка дали локацията е валидна (в границите на област Смолян)
            if (!this.tempLocation.valid) {
                if (window.mapCore && window.mapCore.showNotification) {
                    window.mapCore.showNotification('Моля изберете местоположение в границите на област Смолян', 'error', 5000);
                }
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

            // Премахни картата и event listeners
            if (this.mobilePickerMap) {
                this.mobilePickerMap.off('moveend');
                this.mobilePickerMap.remove();
                this.mobilePickerMap = null;
            }

            if (this.mobilePickerMarkerCluster) {
                this.mobilePickerMarkerCluster.clearLayers();
                this.mobilePickerMarkerCluster = null;
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
            
            // Проверка дали координатите са в границите на област Смолян
            if (!this.isWithinSmolyanRegion(lat, lng)) {
                if (window.mapCore && window.mapCore.showNotification) {
                    window.mapCore.showNotification('Местоположението трябва да е в границите на област Смолян', 'error', 5000);
                }
                return;
            }

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
        },

        // Helper функция за показване на имена на категории
        getCategoryDisplayName: function(category) {
            const categoryNames = {
                'ROAD_DAMAGE': 'Дупки в пътищата',
                'SIDEWALK_DAMAGE': 'Счупени тротоари',
                'LIGHTING': 'Неработещо осветление',
                'TRAFFIC_SIGNS': 'Повредени пътни знаци',
                'WATER_SEWER': 'Водопровод/канализация',
                'WASTE_MANAGEMENT': 'Замърсяване',
                'ILLEGAL_DUMPING': 'Незаконно изхвърляне',
                'TREE_ISSUES': 'Проблеми с дървета',
                'AIR_POLLUTION': 'Замърсяване на въздуха',
                'NOISE_POLLUTION': 'Шумово замърсяване',
                'HEALTHCARE': 'Здравеопазване',
                'EDUCATION': 'Образование',
                'TRANSPORT': 'Обществен транспорт',
                'PARKING': 'Паркиране',
                'SECURITY': 'Обществена безопасност',
                'VANDALISM': 'Вандализъм',
                'ACCESSIBILITY': 'Достъпност',
                'OTHER': 'Други'
            };
            return categoryNames[category] || 'Други';
        },

        // Helper функция за информация за категория (цвят и икона)
        getCategoryInfo: function(category) {
            const categoryData = {
                'ROAD_DAMAGE': { name: 'Дупки в пътищата', icon: 'bi-cone-striped', color: '#dc3545' },
                'SIDEWALK_DAMAGE': { name: 'Счупени тротоари', icon: 'bi-bricks', color: '#fd7e14' },
                'LIGHTING': { name: 'Неработещо осветление', icon: 'bi-lightbulb', color: '#ffc107' },
                'TRAFFIC_SIGNS': { name: 'Повредени пътни знаци', icon: 'bi-sign-stop', color: '#20c997' },
                'WATER_SEWER': { name: 'Водопровод/канализация', icon: 'bi-droplet', color: '#17a2b8' },
                'WASTE_MANAGEMENT': { name: 'Замърсяване', icon: 'bi-trash', color: '#6f42c1' },
                'ILLEGAL_DUMPING': { name: 'Незаконно изхвърляне', icon: 'bi-exclamation-triangle', color: '#e83e8c' },
                'TREE_ISSUES': { name: 'Проблеми с дървета', icon: 'bi-tree', color: '#28a745' },
                'AIR_POLLUTION': { name: 'Замърсяване на въздуха', icon: 'bi-cloud-fog', color: '#6c757d' },
                'NOISE_POLLUTION': { name: 'Шумово замърсяване', icon: 'bi-volume-up', color: '#007bff' },
                'HEALTHCARE': { name: 'Здравеопазване', icon: 'bi-heart-pulse', color: '#fd7e14' },
                'EDUCATION': { name: 'Образование', icon: 'bi-book', color: '#20c997' },
                'TRANSPORT': { name: 'Обществен транспорт', icon: 'bi-bus-front', color: '#17a2b8' },
                'PARKING': { name: 'Паркиране', icon: 'bi-p-square', color: '#6f42c1' },
                'SECURITY': { name: 'Обществена безопасност', icon: 'bi-shield-check', color: '#dc3545' },
                'VANDALISM': { name: 'Вандализъм', icon: 'bi-hammer', color: '#e83e8c' },
                'ACCESSIBILITY': { name: 'Достъпност', icon: 'bi-universal-access', color: '#ffc107' },
                'OTHER': { name: 'Други', icon: 'bi-three-dots', color: '#6c757d' }
            };
            return categoryData[category] || { name: 'Други', icon: 'bi-three-dots', color: '#6c757d' };
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