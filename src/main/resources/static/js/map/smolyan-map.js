// ===== SMOLYAN MAP - MAIN COORDINATOR =====
// Файл: src/main/resources/static/js/map/smolyan-map.js

// ===== GLOBAL VARIABLES =====
let panelsExpanded = {
    newSignal: false,
    signals: false
};

let isInitialized = false;
let initializationPromise = null;
let errorRetryCount = 0;
const MAX_RETRY_COUNT = 3;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🗺️ SmolyanVote Map initializing...');

    // Проверка за наличие на основни елементи
    if (!document.getElementById('map')) {
        console.error('❌ Map container not found!');
        showInitializationError('Контейнерът за картата не е намерен');
        return;
    }

    // Проверка за наличие на Leaflet
    if (typeof L === 'undefined') {
        console.error('❌ Leaflet library not loaded!');
        showInitializationError('Leaflet библиотеката не е заредена');
        return;
    }

    // Начало на инициализацията
    initializationPromise = initializeInSequence();
});

async function initializeInSequence() {
    if (isInitialized) {
        console.log('ℹ️ Map already initialized');
        return;
    }

    try {
        showLoadingState('Инициализиране на картата...');

        // 1. Инициализация на основната карта
        console.log('📍 Initializing map core...');
        await initializeMapCore();

        // 2. Инициализация на signal management
        console.log('📊 Initializing signal management...');
        await initializeSignalManagement();

        // 3. Инициализация на модалите
        console.log('🪟 Initializing modals...');
        await initializeModals();

        // 4. Инициализация на панелите
        console.log('🎛️ Initializing panels...');
        await initializePanels();

        // 5. Инициализация на търсенето
        console.log('🔍 Initializing search...');
        await initializeSearch();

        // 6. Инициализация на tooltip системата
        console.log('💬 Initializing tooltips...');
        await initializeTooltips();

        // 7. Зареждане на данните за сигналите
        console.log('📋 Loading signals data...');
        await loadInitialData();

        // 8. Финални настройки
        console.log('⚙️ Final setup...');
        await finalSetup();

        // Успешна инициализация
        isInitialized = true;
        hideLoadingState();
        console.log('✅ SmolyanVote Map initialized successfully!');

        // Показване на успешна инициализация
        if (window.mapCore && window.mapCore.showNotification) {
            window.mapCore.showNotification('Картата е готова за употреба', 'success');
        }

        errorRetryCount = 0; // Reset retry count on success

    } catch (error) {
        console.error('❌ Error during map initialization:', error);
        hideLoadingState();

        if (errorRetryCount < MAX_RETRY_COUNT) {
            errorRetryCount++;
            console.log(`🔄 Retrying initialization (${errorRetryCount}/${MAX_RETRY_COUNT})...`);

            setTimeout(() => {
                initializationPromise = initializeInSequence();
            }, 2000 * errorRetryCount); // Exponential backoff
        } else {
            showInitializationError('Не можах да инициализирам картата. Моля опреснете страницата.');
        }
    }
}

// ===== INITIALIZATION STEPS =====
async function initializeMapCore() {
    return new Promise((resolve, reject) => {
        try {
            if (window.mapCore) {
                window.mapCore.initializeMap();
                window.mapCore.initializeMapControls();
                initializeSignalManagement();

                // Проверка дали картата е успешно създадена
                const map = window.mapCore.getMap();
                if (map) {
                    resolve();
                } else {
                    reject(new Error('Map core initialization failed'));
                }
            } else {
                reject(new Error('mapCore not available'));
            }
        } catch (error) {
            reject(error);
        }
    });
}

async function initializeSignalManagement() {
    return new Promise((resolve, reject) => {
        try {
            if (window.signalManagement) {
                if (typeof window.signalManagement.initialize === 'function') {
                    window.signalManagement.initialize();
                }
                resolve();
            } else {
                console.warn('⚠️ signalManagement not available, continuing...');
                resolve(); // Continue even if not available
            }
        } catch (error) {
            reject(error);
        }
    });
}

async function initializeModals() {
    return new Promise((resolve, reject) => {
        try {
            // Signal modal
            if (window.signalModal) {
                if (typeof window.signalModal.initialize === 'function') {
                    window.signalModal.initialize();
                }
            }

            // Event reporting modal
            if (window.eventReporting) {
                if (typeof window.eventReporting.initialize === 'function') {
                    window.eventReporting.initialize();
                }
            }

            resolve();
        } catch (error) {
            console.warn('⚠️ Modal initialization warning:', error);
            resolve(); // Continue even if modals fail
        }
    });
}

async function initializePanels() {
    return new Promise((resolve) => {
        try {
            // Инициализация на всички панели в затворено състояние
            const panels = ['newSignal', 'signals'];

            panels.forEach(panelId => {
                const panel = document.getElementById(panelId + 'Panel');
                if (panel) {
                    panel.classList.remove('active');
                    panelsExpanded[panelId] = false;
                }
            });

            // Настройка на signals панела
            const signalsPanel = document.getElementById('signalsPanel');
            if (signalsPanel) {
                signalsPanel.classList.remove('expanded');
            }

            // Настройка на филтрите да са свити в началото
            setupInitialFilterState();

            resolve();
        } catch (error) {
            console.warn('⚠️ Panels initialization warning:', error);
            resolve();
        }
    });
}

async function initializeSearch() {
    return new Promise((resolve) => {
        try {
            if (window.signalManagement && typeof window.signalManagement.initializeSearch === 'function') {
                window.signalManagement.initializeSearch();
            }
            resolve();
        } catch (error) {
            console.warn('⚠️ Search initialization warning:', error);
            resolve();
        }
    });
}

async function initializeTooltips() {
    return new Promise((resolve) => {
        try {
            if (window.signalTooltip && typeof window.signalTooltip.initialize === 'function') {
                // Инициализира tooltip само на desktop
                if (!mapIsMobile()) {
                    window.signalTooltip.initialize();
                }
            }
            resolve();
        } catch (error) {
            console.warn('⚠️ Tooltip initialization warning:', error);
            resolve();
        }
    });
}

async function loadInitialData() {
    return new Promise((resolve, reject) => {
        try {
            if (window.signalManagement && typeof window.signalManagement.loadSignalsData === 'function') {
                window.signalManagement.loadSignalsData()
                    .then(() => resolve())
                    .catch((error) => {
                        console.warn('⚠️ Initial data loading warning:', error);
                        resolve(); // Continue even if data loading fails
                    });
            } else {
                resolve();
            }
        } catch (error) {
            console.warn('⚠️ Initial data loading warning:', error);
            resolve();
        }
    });
}

async function finalSetup() {
    return new Promise((resolve) => {
        try {
            // Mobile адаптации
            if (mapIsMobile()) {
                adaptForMobile();
            }

            // Инициализация на event listeners
            initializeEventListeners();

            // Инициализация на resize handler
            setupResizeHandler();

            // Финални проверки
            performFinalChecks();

            resolve();
        } catch (error) {
            console.warn('⚠️ Final setup warning:', error);
            resolve();
        }
    });
}

// ===== PANELS MANAGEMENT =====
function togglePanel(panelId) {
    if (!panelId) {
        console.warn('Panel ID not provided');
        return;
    }

    const panel = document.getElementById(panelId + 'Panel');
    if (!panel) {
        console.warn(`Panel ${panelId} not found`);
        return;
    }

    const isExpanded = panelsExpanded[panelId];

    try {
        if (isExpanded) {
            // Затваряне на панела
            closePanel(panelId);
        } else {
            // Затваряне на други панели преди отваряне на новия
            Object.keys(panelsExpanded).forEach(id => {
                if (id !== panelId && panelsExpanded[id]) {
                    closePanel(id);
                }
            });

            // Отваряне на текущия панел
            openPanel(panelId);
        }

        // Преоразмеряване на картата след анимация
        setTimeout(() => {
            if (window.mapCore) {
                const map = window.mapCore.getMap();
                if (map) map.invalidateSize();
            }
        }, 400);

    } catch (error) {
        console.error('Error toggling panel:', error);
        if (window.mapCore && window.mapCore.showNotification) {
            window.mapCore.showNotification('Грешка при отваряне на панела', 'error');
        }
    }
}

function openPanel(panelId) {
    const panel = document.getElementById(panelId + 'Panel');
    if (panel) {
        panel.classList.add('active');
        panelsExpanded[panelId] = true;

        // Специална логика за различни панели
        if (panelId === 'newSignal') {
            // Focus на първото поле при отваряне на форма за нов сигнал
            setTimeout(() => {
                const titleInput = document.getElementById('signalTitle');
                if (titleInput) titleInput.focus();
            }, 300);
        }

        console.log(`Panel ${panelId} opened`);
    }
}

function closePanel(panelId) {
    const panel = document.getElementById(panelId + 'Panel');
    if (panel) {
        panel.classList.remove('active');
        panelsExpanded[panelId] = false;

        // Специална логика за различни панели
        if (panelId === 'newSignal') {
            resetLocationSelection();
            clearFormErrors();
        }

        console.log(`Panel ${panelId} closed`);
    }
}

function resetLocationSelection() {
    try {
        // Изчистване на location selection mode
        if (window.signalManagement && typeof window.signalManagement.clearLocationSelection === 'function') {
            window.signalManagement.clearLocationSelection();
        }

        // Reset на location button
        const locationBtn = document.getElementById('selectLocationBtn');
        if (locationBtn) {
            locationBtn.innerHTML = '<i class="bi bi-geo-alt"></i> <span>Изберете местоположение</span>';
            locationBtn.classList.remove('selecting', 'selected');
        }

        // Изчистване на скритите полета
        const latInput = document.getElementById('signalLatitude');
        const lngInput = document.getElementById('signalLongitude');
        if (latInput) latInput.value = '';
        if (lngInput) lngInput.value = '';

    } catch (error) {
        console.warn('Warning during location reset:', error);
    }
}

function clearFormErrors() {
    try {
        // Изчистване на всички error states
        const errorElements = document.querySelectorAll('.form-feedback.error');
        errorElements.forEach(element => {
            element.style.display = 'none';
        });

        // Изчистване на error класове от form controls
        const errorControls = document.querySelectorAll('.form-control.error');
        errorControls.forEach(control => {
            control.classList.remove('error');
        });

    } catch (error) {
        console.warn('Warning during form errors clearing:', error);
    }
}

// ===== SIGNALS PANEL MANAGEMENT =====
function toggleSignalsPanel() {
    const signalsContent = document.getElementById('signalsContent');
    const arrow = document.getElementById('signalsTabArrow');

    if (!signalsContent) {
        console.warn('Signals content not found');
        return;
    }

    try {
        const isExpanded = signalsContent.classList.contains('active');

        if (isExpanded) {
            // Затваряне
            signalsContent.classList.remove('active');
            if (arrow) {
                arrow.style.transform = 'rotate(0deg)';
            }
        } else {
            // Отваряне
            signalsContent.classList.add('active');
            if (arrow) {
                arrow.style.transform = 'rotate(180deg)';
            }
        }

        // Обновяване на размера на картата след анимация
        setTimeout(() => {
            if (window.mapCore) {
                const map = window.mapCore.getMap();
                if (map) map.invalidateSize();
            }
        }, 400);

    } catch (error) {
        console.error('Error toggling signals panel:', error);
    }
}

// ===== FILTERS MANAGEMENT =====
function toggleFilters() {
    const filtersContent = document.getElementById('filtersContent');
    const arrow = document.getElementById('filtersArrow');

    if (!filtersContent) {
        console.warn('Filters content not found');
        return;
    }

    try {
        const isExpanded = !filtersContent.classList.contains('collapsed');

        if (isExpanded) {
            // Свиване
            filtersContent.classList.add('collapsed');
            if (arrow) {
                arrow.style.transform = 'rotate(0deg)';
            }
        } else {
            // Разгъване
            filtersContent.classList.remove('collapsed');
            if (arrow) {
                arrow.style.transform = 'rotate(180deg)';
            }
        }

    } catch (error) {
        console.error('Error toggling filters:', error);
    }
}

function setupInitialFilterState() {
    try {
        const filtersContent = document.getElementById('filtersContent');
        const filtersArrow = document.getElementById('filtersArrow');

        if (filtersContent && filtersArrow) {
            filtersContent.classList.add('collapsed');
            filtersArrow.style.transform = 'rotate(0deg)';
        }
    } catch (error) {
        console.warn('Warning during filter state setup:', error);
    }
}

// ===== MOBILE ADAPTATIONS =====
function adaptForMobile() {
    console.log('📱 Adapting for mobile...');

    try {
        const signalsPanel = document.getElementById('signalsPanel');
        const leftControls = document.querySelector('.left-controls');

        if (signalsPanel) {
            signalsPanel.classList.add('mobile');
        }
        if (leftControls) {
            leftControls.classList.add('mobile');
        }

        // Скриване на tooltip системата на mobile
        if (window.signalTooltip && typeof window.signalTooltip.destroy === 'function') {
            window.signalTooltip.destroy();
        }

        // Мобилни специфични настройки
        setupMobileGestures();

    } catch (error) {
        console.warn('Warning during mobile adaptation:', error);
    }
}

function setupMobileGestures() {
    try {
        // Добавяне на swipe gesture за панелите
        let startX = 0;
        let startY = 0;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!e.changedTouches[0]) return;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = startX - endX;
            const diffY = startY - endY;

            // Проверка за хоризонтален swipe
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    // Swipe left - затваряне на панели
                    Object.keys(panelsExpanded).forEach(panelId => {
                        if (panelsExpanded[panelId]) {
                            closePanel(panelId);
                        }
                    });
                }
            }
        }, { passive: true });

    } catch (error) {
        console.warn('Warning during mobile gestures setup:', error);
    }
}

// ===== UTILITY FUNCTIONS =====
function mapIsMobile() {
    return window.innerWidth <= 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function showLoadingState(message = 'Зареждане...') {
    let loadingOverlay = document.getElementById('loadingOverlay');

    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loadingOverlay';
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p>${message}</p>
            </div>
        `;
        document.body.appendChild(loadingOverlay);
    } else {
        const messageElement = loadingOverlay.querySelector('p');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }

    loadingOverlay.style.display = 'flex';
}

function hideLoadingState() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

function showInitializationError(message) {
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div class="initialization-error">
                <div class="error-content">
                    <i class="bi bi-exclamation-triangle"></i>
                    <h3>Грешка при инициализация</h3>
                    <p>${message}</p>
                    <button class="btn-retry" onclick="location.reload()">
                        <i class="bi bi-arrow-clockwise"></i>
                        Опреснете страницата
                    </button>
                </div>
            </div>
        `;
    }
}

// ===== EVENT LISTENERS =====
function initializeEventListeners() {
    try {
        // Click listeners за панелите (ако не са вече добавени)
        const newSignalTab = document.querySelector('.control-tab');
        if (newSignalTab && !newSignalTab.hasAttribute('data-listener')) {
            newSignalTab.addEventListener('click', () => togglePanel('newSignal'));
            newSignalTab.setAttribute('data-listener', 'true');
        }

        const signalsTab = document.getElementById('signalsTab');
        if (signalsTab && !signalsTab.hasAttribute('data-listener')) {
            signalsTab.addEventListener('click', toggleSignalsPanel);
            signalsTab.setAttribute('data-listener', 'true');
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);

        // Cleanup on page unload
        window.addEventListener('beforeunload', cleanup);

        console.log('✅ Event listeners initialized');

    } catch (error) {
        console.warn('Warning during event listeners setup:', error);
    }
}

function handleKeyboardShortcuts(e) {
    try {
        // ESC key - затваряне на панели
        if (e.key === 'Escape') {
            Object.keys(panelsExpanded).forEach(panelId => {
                if (panelsExpanded[panelId]) {
                    closePanel(panelId);
                }
            });

            // Затваряне на signals panel ако е отворен
            const signalsContent = document.getElementById('signalsContent');
            if (signalsContent && signalsContent.classList.contains('active')) {
                toggleSignalsPanel();
            }
        }

        // Ctrl/Cmd + K - focus на search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('signalSearch');
            if (searchInput) {
                searchInput.focus();
            }
        }

        // Ctrl/Cmd + N - нов сигнал
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            if (!panelsExpanded.newSignal) {
                togglePanel('newSignal');
            }
        }

    } catch (error) {
        console.warn('Warning during keyboard shortcut handling:', error);
    }
}

// ===== RESIZE HANDLING =====
function setupResizeHandler() {
    let resizeTimeout;

    const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            try {
                const currentIsMobile = mapIsMobile();

                if (currentIsMobile) {
                    adaptForMobile();
                } else {
                    // Desktop adaptations
                    const signalsPanel = document.getElementById('signalsPanel');
                    const leftControls = document.querySelector('.left-controls');

                    if (signalsPanel) {
                        signalsPanel.classList.remove('mobile');
                    }
                    if (leftControls) {
                        leftControls.classList.remove('mobile');
                    }

                    // Възстановяване на tooltip система на desktop
                    if (window.signalTooltip && typeof window.signalTooltip.initialize === 'function') {
                        window.signalTooltip.initialize();
                    }
                }

                // Делегиране към mapCore
                if (window.mapCore && typeof window.mapCore.handleResize === 'function') {
                    window.mapCore.handleResize();
                }

            } catch (error) {
                console.warn('Warning during resize handling:', error);
            }
        }, 250);
    };

    window.addEventListener('resize', handleResize);
}

// ===== FINAL CHECKS =====
function performFinalChecks() {
    try {
        // Проверка дали картата е правилно инициализирана
        if (window.mapCore) {
            const map = window.mapCore.getMap();
            if (!map) {
                throw new Error('Map not properly initialized');
            }
        }

        // Проверка на основните UI елементи
        const requiredElements = ['map', 'signalSearch'];
        for (const elementId of requiredElements) {
            if (!document.getElementById(elementId)) {
                console.warn(`Required element ${elementId} not found`);
            }
        }

        // Проверка на функционалностите
        const requiredGlobals = ['mapCore', 'signalManagement'];
        for (const globalName of requiredGlobals) {
            if (!window[globalName]) {
                console.warn(`Required global ${globalName} not available`);
            }
        }

        console.log('✅ Final checks completed');

    } catch (error) {
        console.error('Error during final checks:', error);
        throw error;
    }
}

// ===== ERROR HANDLING =====
function handleError(error, context = 'Unknown') {
    console.error(`Map Error in ${context}:`, error);

    if (window.mapCore && typeof window.mapCore.showNotification === 'function') {
        window.mapCore.showNotification(`Възникна грешка: ${error.message}`, 'error');
    }

    // Запис на грешката за debugging
    if (window.SmolyanMapDebug) {
        window.SmolyanMapDebug.lastError = {
            error: error,
            context: context,
            timestamp: new Date().toISOString()
        };
    }
}

function cleanup() {
    try {
        console.log('🧹 Cleaning up SmolyanVote Map...');

        // Изчистване на event listeners
        document.removeEventListener('keydown', handleKeyboardShortcuts);

        // Cleanup на модулите
        if (window.signalTooltip && typeof window.signalTooltip.destroy === 'function') {
            window.signalTooltip.destroy();
        }

        // Изчистване на timers
        const highestTimeoutId = setTimeout(";");
        for (let i = 0; i < highestTimeoutId; i++) {
            clearTimeout(i);
        }

        console.log('✅ Cleanup completed');

    } catch (error) {
        console.warn('Warning during cleanup:', error);
    }
}

// ===== GLOBAL ERROR HANDLERS =====
window.addEventListener('error', (e) => {
    if (e.filename && (e.filename.includes('map') || e.filename.includes('signal'))) {
        handleError(e.error, 'Global');
    }
});

window.addEventListener('unhandledrejection', (e) => {
    if (e.reason && e.reason.message &&
        (e.reason.message.includes('map') || e.reason.message.includes('signal'))) {
        handleError(e.reason, 'Promise');
    }
});

// ===== PUBLIC API =====
window.togglePanel = togglePanel;
window.closePanel = closePanel;
window.toggleSignalsPanel = toggleSignalsPanel;
window.toggleFilters = toggleFilters;

// Глобален обект за debugging и състояние
window.SmolyanMapDebug = {
    version: '2.0.0',
    isInitialized: () => isInitialized,
    panelsState: () => ({ ...panelsExpanded }),
    currentSignals: () => window.signalManagement ? window.signalManagement.getCurrentSignals() : [],
    activeFilters: () => window.signalManagement ? window.signalManagement.getActiveFilters() : {},
    mapInstance: () => window.mapCore ? window.mapCore.getMap() : null,
    markersCluster: () => window.mapCore ? window.mapCore.getMarkersCluster() : null,
    reinitialize: () => {
        isInitialized = false;
        initializationPromise = null;
        return initializeInSequence();
    },
    errorCount: () => errorRetryCount,
    lastError: null,
    moduleStatus: () => ({
        mapCore: !!window.mapCore,
        signalManagement: !!window.signalManagement,
        signalModal: !!window.signalModal,
        signalTooltip: !!window.signalTooltip,
        eventReporting: !!window.eventReporting
    })
};

// Експортиране за модули
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        togglePanel,
        closePanel,
        toggleSignalsPanel,
        toggleFilters,
        SmolyanMapDebug: window.SmolyanMapDebug
    };
}
