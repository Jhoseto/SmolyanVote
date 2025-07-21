// ===== SIGNAL MANAGEMENT =====
// Управление на сигнали

// ===== КОНСТАНТИ =====
const SIGNAL_CATEGORIES = {
    ROAD_DAMAGE: { name: 'Дупки в пътищата', icon: 'bi-cone-striped', color: '#dc3545' },
    SIDEWALK_DAMAGE: { name: 'Счупени тротоари', icon: 'bi-bricks', color: '#6f42c1' },
    LIGHTING: { name: 'Неработещо осветление', icon: 'bi-lightbulb', color: '#fd7e14' },
    TRAFFIC_SIGNS: { name: 'Повредени пътни знаци', icon: 'bi-sign-stop', color: '#e83e8c' },
    WATER_SEWER: { name: 'Водопровод/канализация', icon: 'bi-droplet', color: '#20c997' },
    WASTE_MANAGEMENT: { name: 'Замърсяване', icon: 'bi-trash', color: '#6c757d' },
    ILLEGAL_DUMPING: { name: 'Незаконно изхвърляне', icon: 'bi-exclamation-triangle', color: '#dc3545' },
    TREE_ISSUES: { name: 'Проблеми с дървета', icon: 'bi-tree', color: '#198754' },
    AIR_POLLUTION: { name: 'Замърсяване на въздуха', icon: 'bi-cloud-fog', color: '#495057' },
    NOISE_POLLUTION: { name: 'Шумово замърсяване', icon: 'bi-volume-up', color: '#dc3545' },
    HEALTHCARE: { name: 'Здравеопазване', icon: 'bi-heart-pulse', color: '#dc3545' },
    EDUCATION: { name: 'Образование', icon: 'bi-book', color: '#0d6efd' },
    TRANSPORT: { name: 'Обществен транспорт', icon: 'bi-bus-front', color: '#0dcaf0' },
    PARKING: { name: 'Паркиране', icon: 'bi-p-square', color: '#6c757d' },
    SECURITY: { name: 'Обществена безопасност', icon: 'bi-shield-check', color: '#dc3545' },
    VANDALISM: { name: 'Вандализъм', icon: 'bi-hammer', color: '#dc3545' },
    ACCESSIBILITY: { name: 'Достъпност', icon: 'bi-universal-access', color: '#0d6efd' },
    OTHER: { name: 'Други', icon: 'bi-three-dots', color: '#6c757d' }
};

const URGENCY_LEVELS = {
    low: { name: 'Ниска', color: '#198754' },
    medium: { name: 'Средна', color: '#fd7e14' },
    high: { name: 'Висока', color: '#dc3545' }
};

// ===== ГЛОБАЛНИ ПРОМЕНЛИВИ =====
let currentSignals = [];
let activeFilters = {
    category: 'all',
    urgency: 'all',
    sort: 'newest'
};
let locationSelectionMode = false;

// ===== ЗАРЕЖДАНЕ НА СИГНАЛИ =====
async function loadSignalsData() {
    try {
        const params = new URLSearchParams();
        if (activeFilters.category !== 'all') params.append('category', activeFilters.category);
        if (activeFilters.urgency !== 'all') params.append('urgency', activeFilters.urgency);
        if (activeFilters.sort) params.append('sort', activeFilters.sort);

        const url = '/signals' + (params.toString() ? '?' + params.toString() : '');
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const signals = await response.json();
        currentSignals = Array.isArray(signals) ? signals : [];

        loadSignals();
        updateSignalsList(currentSignals);
        updateStats();

        window.mapCore?.showNotification(`Заредени ${signals.length} сигнала`, 'success');

    } catch (error) {
        console.error('Грешка при зареждане:', error);
        window.mapCore?.showNotification('Грешка при зареждане', 'error');
    }
}

// ===== СЪЗДАВАНЕ НА MARKERS =====
function createSignalMarker(signal) {
    if (!signal?.coordinates || !Array.isArray(signal.coordinates)) {
        return null;
    }

    const category = SIGNAL_CATEGORIES[signal.category];
    const urgency = URGENCY_LEVELS[signal.urgency];

    if (!category || !urgency) {
        console.warn('Неизвестна категория/спешност:', signal.category, signal.urgency);
        return null;
    }

    const icon = L.divIcon({
        className: 'signal-marker',
        html: `<div class="signal-marker-content" style="background-color: ${category.color}; border-color: ${urgency.color};">
                <i class="${category.icon}"></i>
               </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });

    const marker = L.marker(signal.coordinates, { icon });
    marker.signalData = signal;

    marker.on('click', function() {
        if (window.openSignalModal) {
            window.openSignalModal(signal);
        }
    });

    return marker;
}

// ===== ЗАРЕЖДАНЕ НА MARKERS =====
function loadSignals() {
    const markersCluster = window.mapCore?.getMarkersCluster();
    if (!markersCluster) return;

    markersCluster.clearLayers();

    currentSignals.forEach(signal => {
        const marker = createSignalMarker(signal);
        if (marker) {
            markersCluster.addLayer(marker);
        }
    });
}

// ===== ФИЛТРИРАНЕ =====
async function applyFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const urgencyFilter = document.getElementById('urgencyFilter');
    const sortFilter = document.getElementById('sortFilter');

    if (categoryFilter) activeFilters.category = categoryFilter.value || 'all';
    if (urgencyFilter) activeFilters.urgency = urgencyFilter.value || 'all';
    if (sortFilter) activeFilters.sort = sortFilter.value || 'newest';

    await loadSignalsData();
}

function clearFilters() {
    activeFilters = { category: 'all', urgency: 'all', sort: 'newest' };

    const categoryFilter = document.getElementById('categoryFilter');
    const urgencyFilter = document.getElementById('urgencyFilter');
    const sortFilter = document.getElementById('sortFilter');

    if (categoryFilter) categoryFilter.value = 'all';
    if (urgencyFilter) urgencyFilter.value = 'all';
    if (sortFilter) sortFilter.value = 'newest';

    loadSignalsData();
}

// ===== СПИСЪК СЪС СИГНАЛИ =====
function updateSignalsList(signals) {
    const signalsList = document.getElementById('signalsList');
    if (!signalsList) return;

    if (!signals || signals.length === 0) {
        signalsList.innerHTML = '<div class="no-signals">Няма сигнали за показване</div>';
        return;
    }

    signalsList.innerHTML = signals.map(signal => {
        const category = SIGNAL_CATEGORIES[signal.category];
        const urgency = URGENCY_LEVELS[signal.urgency];

        return `
            <div class="signal-card" onclick="openSignalModal(${JSON.stringify(signal).replace(/"/g, '&quot;')})">
                <div class="signal-header">
                    <div class="signal-category">
                        <i class="${category?.icon || 'bi-circle'}"></i>
                        ${category?.name || signal.category}
                    </div>
                    <div class="signal-urgency urgency-${signal.urgency}">
                        ${urgency?.name || signal.urgency}
                    </div>
                </div>
                <h4 class="signal-title">${signal.title}</h4>
                <p class="signal-description">${signal.description?.substring(0, 100)}${signal.description?.length > 100 ? '...' : ''}</p>
                <div class="signal-meta">
                    <span><i class="bi bi-person"></i> ${signal.author || 'Анонимен'}</span>
                    <span><i class="bi bi-calendar"></i> ${formatDate(signal.created)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ===== СТАТИСТИКИ =====
function updateStats() {
    const counter = document.getElementById('signalsTabCounter');
    if (counter) {
        counter.textContent = currentSignals.length;
    }
}

// ===== DROPDOWN ФУНКЦИОНАЛНОСТ =====
function initializeDropdowns() {
    const dropdowns = document.querySelectorAll('.custom-select select');

    dropdowns.forEach(select => {
        const container = select.parentElement;
        select.style.display = 'none';

        const dropdown = document.createElement('div');
        dropdown.className = 'custom-dropdown';

        const trigger = document.createElement('div');
        trigger.className = 'custom-dropdown-trigger';
        trigger.innerHTML = `<span>${select.options[select.selectedIndex].text}</span><i class="bi bi-chevron-down"></i>`;

        const menu = document.createElement('div');
        menu.className = 'custom-dropdown-menu';

        Array.from(select.options).forEach(option => {
            const item = document.createElement('div');
            item.className = 'custom-dropdown-option';
            item.textContent = option.text;
            item.onclick = () => {
                select.value = option.value;
                trigger.querySelector('span').textContent = option.text;
                dropdown.classList.remove('active');
                select.dispatchEvent(new Event('change'));
            };
            menu.appendChild(item);
        });

        trigger.onclick = () => {
            document.querySelectorAll('.custom-dropdown').forEach(d => d.classList.remove('active'));
            dropdown.classList.toggle('active');
        };

        dropdown.appendChild(trigger);
        dropdown.appendChild(menu);
        container.appendChild(dropdown);
    });

    document.onclick = (e) => {
        if (!e.target.closest('.custom-dropdown')) {
            document.querySelectorAll('.custom-dropdown').forEach(d => d.classList.remove('active'));
        }
    };
}

// ===== ПОМОЩНИ ФУНКЦИИ =====
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG');
}

function startLocationSelection() {
    locationSelectionMode = true;
    const btn = document.getElementById('selectLocationBtn');
    if (btn) {
        btn.innerHTML = '<i class="bi bi-crosshair"></i> <span>Кликнете на картата</span>';
        btn.classList.add('selecting');
    }
    window.mapCore?.showNotification('Кликнете на картата за избор на местоположение', 'info');
}

// ===== EVENT LISTENERS =====
function initializeEventListeners() {
    // Филтри event listeners
    const categoryFilter = document.getElementById('categoryFilter');
    const urgencyFilter = document.getElementById('urgencyFilter');
    const sortFilter = document.getElementById('sortFilter');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }
    if (urgencyFilter) {
        urgencyFilter.addEventListener('change', applyFilters);
    }
    if (sortFilter) {
        sortFilter.addEventListener('change', applyFilters);
    }

    // Clear filters button
    const clearBtn = document.querySelector('.btn-clear-filters');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearFilters);
    }

    // Location selection
    const locationBtn = document.getElementById('selectLocationBtn');
    if (locationBtn) {
        locationBtn.addEventListener('click', startLocationSelection);
    }

    console.log('Signal management event listeners initialized');
}

// ===== PUBLIC API =====
window.signalManagement = {
    loadSignalsData,
    applyFilters,
    clearFilters,
    initializeDropdowns,
    initializeEventListeners,
    locationSelectionMode: false,
    getCurrentSignals: () => currentSignals,
    getActiveFilters: () => activeFilters
};

// Глобални функции
window.clearAllFilters = clearFilters;
window.applyFilters = applyFilters;
