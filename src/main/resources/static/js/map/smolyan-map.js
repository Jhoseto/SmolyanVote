// ===== SMOLYAN MAP - MAIN COORDINATOR =====

// ===== GLOBAL VARIABLES =====
let panelsExpanded = {
    newSignal: false,
    signals: false
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🗺️ SmolyanVote Map initializing...');

    // Проверка за наличие на основни елементи
    if (!document.getElementById('map')) {
        console.error('Map container not found!');
        return;
    }

    // Инициализация в правилния ред
    initializeInSequence();
});

async function initializeInSequence() {
    try {
        // 1. Инициализация на основната карта
        console.log('📍 Initializing map core...');
        if (window.mapCore) {
            window.mapCore.initializeMap();
            window.mapCore.initializeMapControls();
        }

        // 2. Зареждане на данните за сигналите
        console.log('📊 Loading signals data...');
        if (window.signalManagement) {
            await window.signalManagement.loadSignalsData();
        }

        // 3. Инициализация на търсенето и event listeners
        console.log('🔍 Initializing search and interactions...');
        if (window.signalManagement) {
            window.signalManagement.initializeSearch();
            window.signalManagement.initializeSignalEventListeners();
        }

        // 4. Инициализация на tooltip системата
        console.log('💬 Initializing tooltips...');
        if (window.signalTooltip) {
            window.signalTooltip.initialize();
        }

        // 5. Инициализация на панелите
        console.log('🎛️ Initializing panels...');
        initializePanels();

        // 6. Настройка на филтрите да са свити в началото
        setupInitialFilterState();

        // 7. Mobile адаптации
        if (window.mapCore && window.mapCore.isMobile()) {
            adaptForMobile();
        }

        console.log('✅ SmolyanVote Map initialized successfully!');

    } catch (error) {
        console.error('❌ Error during map initialization:', error);

        // Fallback инициализация при грешка
        setTimeout(() => {
            if (window.mapCore) {
                window.mapCore.initializeMap();
            }
        }, 1000);
    }
}

// ===== PANELS MANAGEMENT =====
function initializePanels() {
    // Инициализация на всички панели в затворено състояние
    const panels = ['newSignal', 'signals'];

    panels.forEach(panelId => {
        const panel = document.getElementById(panelId + 'Panel');
        if (panel) {
            panel.classList.remove('active');
            panelsExpanded[panelId] = false;
        }
    });

    // Настройка на signals панела да е свит в началото
    const signalsPanel = document.getElementById('signalsPanel');
    if (signalsPanel) {
        signalsPanel.classList.remove('expanded');
    }
}

function togglePanel(panelId) {
    const panel = document.getElementById(panelId + 'Panel');
    const isExpanded = panelsExpanded[panelId];

    if (panel) {
        if (isExpanded) {
            // Затваряне на панела
            panel.classList.remove('active');
            panelsExpanded[panelId] = false;

            // Специална логика за location selection при затваряне на newSignal панела
            if (panelId === 'newSignal') {
                resetLocationSelection();
            }
        } else {
            // Затваряне на други панели
            Object.keys(panelsExpanded).forEach(id => {
                if (id !== panelId && panelsExpanded[id]) {
                    closePanel(id);
                }
            });

            // Отваряне на текущия панел
            panel.classList.add('active');
            panelsExpanded[panelId] = true;
        }

        // Преоразмеряване на картата след анимацията
        setTimeout(() => {
            if (window.mapCore) {
                window.mapCore.handleResize();
            }
        }, 400);
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
        }

        // Преоразмеряване на картата
        setTimeout(() => {
            if (window.mapCore) {
                window.mapCore.handleResize();
            }
        }, 400);
    }
}

function resetLocationSelection() {
    // Резет на location selection състоянието
    const btn = document.getElementById('selectLocationBtn');
    if (btn) {
        btn.innerHTML = '<i class="bi bi-geo-alt"></i> <span>Изберете местоположение</span>';
        btn.classList.remove('selecting', 'selected');
    }

    // Изчистване на координатите от формата
    const latInput = document.getElementById('signalLatitude');
    const lngInput = document.getElementById('signalLongitude');
    if (latInput) latInput.value = '';
    if (lngInput) lngInput.value = '';
}

// ===== SIGNALS PANEL MANAGEMENT =====
function toggleSignalsPanel() {
    const signalsPanel = document.getElementById('signalsPanel');
    const arrow = document.getElementById('signalsTabArrow');

    if (!signalsPanel || !arrow) return;

    const isExpanded = signalsPanel.classList.contains('expanded');

    if (isExpanded) {
        signalsPanel.classList.remove('expanded');
        arrow.style.transform = 'translateY(-50%) rotate(0deg)';
    } else {
        signalsPanel.classList.add('expanded');
        arrow.style.transform = 'translateY(-50%) rotate(180deg)';
    }

    // Обновяване на размера на картата след анимация
    setTimeout(() => {
        if (window.mapCore) {
            const map = window.mapCore.getMap();
            if (map) map.invalidateSize();
        }
    }, 400);
}

// ===== FILTERS MANAGEMENT =====
function toggleFilters() {
    const filtersContent = document.getElementById('filtersContent');
    const arrow = document.getElementById('filtersArrow');

    if (!filtersContent || !arrow) return;

    const isExpanded = filtersContent.classList.contains('expanded');

    if (isExpanded) {
        filtersContent.classList.remove('expanded');
        filtersContent.classList.add('collapsed');
        arrow.style.transform = 'rotate(0deg)';
    } else {
        filtersContent.classList.add('expanded');
        filtersContent.classList.remove('collapsed');
        arrow.style.transform = 'rotate(180deg)';
    }
}

function setupInitialFilterState() {
    const filtersContent = document.getElementById('filtersContent');
    const filtersArrow = document.getElementById('filtersArrow');

    if (filtersContent && filtersArrow) {
        filtersContent.classList.add('collapsed');
        filtersArrow.style.transform = 'rotate(0deg)';
    }
}

// ===== MOBILE ADAPTATIONS =====
function adaptForMobile() {
    console.log('📱 Adapting for mobile...');

    const signalsPanel = document.getElementById('signalsPanel');
    const leftControls = document.querySelector('.left-controls');

    if (signalsPanel) {
        signalsPanel.classList.add('mobile');
    }
    if (leftControls) {
        leftControls.classList.add('mobile');
    }

    // Скриване на tooltip системата на mobile
    if (window.signalTooltip) {
        window.signalTooltip.destroy();
    }
}

// ===== RESIZE HANDLING =====
function handleResize() {
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        adaptForMobile();
    } else {
        // Desktop адаптации
        const signalsPanel = document.getElementById('signalsPanel');
        const leftControls = document.querySelector('.left-controls');

        if (signalsPanel) {
            signalsPanel.classList.remove('mobile');
        }
        if (leftControls) {
            leftControls.classList.remove('mobile');
        }

        // Пускане на tooltip система на desktop
        if (window.signalTooltip && !document.querySelector('.signal-tooltip')) {
            window.signalTooltip.initialize();
        }
    }

    // Делегиране към mapCore
    if (window.mapCore) {
        window.mapCore.handleResize();
    }
}

// ===== ERROR HANDLING =====
function handleError(error, context = 'Unknown') {
    console.error(`Map Error in ${context}:`, error);

    if (window.mapCore) {
        window.mapCore.showNotification(`Възникна грешка: ${error.message}`, 'error');
    }
}

// ===== EVENT LISTENERS =====
window.addEventListener('resize', handleResize);

// Глобални error handlers
window.addEventListener('error', (e) => {
    if (e.filename && e.filename.includes('map')) {
        handleError(e.error, 'Global');
    }
});

window.addEventListener('unhandledrejection', (e) => {
    if (e.reason && e.reason.message && e.reason.message.includes('map')) {
        handleError(e.reason, 'Promise');
    }
});

// ===== PUBLIC API =====
window.togglePanel = togglePanel;
window.closePanel = closePanel;
window.toggleSignalsPanel = toggleSignalsPanel;
window.toggleFilters = toggleFilters;

// Глобален debug обект
window.SmolyanMapDebug = {
    currentSignals: () => window.signalManagement ? window.signalManagement.getCurrentSignals() : [],
    activeFilters: () => window.signalManagement ? window.signalManagement.getActiveFilters() : {},
    panelsState: () => panelsExpanded,
    mapInstance: () => window.mapCore ? window.mapCore.getMap() : null,
    reinitialize: initializeInSequence
};

// ===== PANEL CONTROL FUNCTIONS =====

function openPanel(panelName) {
    const panel = document.getElementById(panelName + 'Panel');
    if (panel) {
        // Затваряне на други панели
        Object.keys(panelsExpanded).forEach(key => {
            if (key !== panelName && panelsExpanded[key]) {
                closePanel(key);
            }
        });

        panel.classList.add('active');
        panelsExpanded[panelName] = true;
    }
}

// Export за modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        togglePanel,
        closePanel,
        toggleSignalsPanel,
        toggleFilters,
        handleResize,
        initializeInSequence
    };
}