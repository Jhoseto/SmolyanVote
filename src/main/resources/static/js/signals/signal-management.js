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
    LOW: { name: 'Ниска', color: '#198754' },
    MEDIUM: { name: 'Средна', color: '#fd7e14' },
    HIGH: { name: 'Висока', color: '#dc3545' }
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
async function loadSignalsData(showNotifications = true) {
    try {
        if (showNotifications) {
        }

        const filters = {
            category: activeFilters.category,
            urgency: activeFilters.urgency,
            search: activeFilters.search,
            sort: activeFilters.sort
        };

        // Построяване на URL с параметри
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key] && filters[key] !== 'all' && filters[key] !== '') {
                params.append(key, filters[key]);
            }
        });

        const url = `/signals${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const signals = await response.json();
        currentSignals = Array.isArray(signals) ? signals : [];

        loadSignals();
        updateSignalsList(currentSignals);
        updateStats();

        if (showNotifications) {
            if (signals.length === 0) {
                window.mapCore?.showNotification('📭 Няма намерени сигнали с избраните филтри', 'warning', 4000);
            } else {
                window.mapCore?.showNotification(
                    `📍 Заредени ${signals.length} сигнал${signals.length === 1 ? '' : 'а'}`,
                    'success',
                    3000
                );
            }
        }

        console.log(`✅ Loaded ${signals.length} signals successfully`);

    } catch (error) {
        console.error('Грешка при зареждане:', error);

        if (showNotifications) {
            if (error.message.includes('Failed to fetch')) {
                window.mapCore?.showNotification(
                    '🔌 Проблем с мрежовата връзка. Проверете интернет свързаността си.',
                    'error',
                    6000
                );
            } else {
                window.mapCore?.showNotification(
                    '❌ Грешка при зареждане на сигналите. Опитайте да обновите страницата.',
                    'error',
                    5000
                );
            }
        }
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

    // Click event за modal
    marker.on('click', function() {
        if (window.openSignalModal) {
            window.openSignalModal(signal);
        }
    });

    // Hover events за tooltip
    marker.on('mouseover', function(e) {
        if (window.signalTooltip && window.signalTooltip.show) {
            // Преобразуваме Leaflet event в обикновен mouse event
            const mouseEvent = {
                clientX: e.containerPoint.x + map.getContainer().getBoundingClientRect().left,
                clientY: e.containerPoint.y + map.getContainer().getBoundingClientRect().top
            };
            window.signalTooltip.show(signal, mouseEvent);
        }
    });

    marker.on('mouseout', function() {
        if (window.signalTooltip && window.signalTooltip.hide) {
            window.signalTooltip.hide();
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
// ===== ФИЛТРИРАНЕ =====
async function applyFilters() {
    // Вземи стойностите от dropdown менютата по data-name
    const categoryDropdown = document.querySelector('[data-name="categoryFilter"]');
    const urgencyDropdown = document.querySelector('[data-name="urgencyFilter"]');
    const sortDropdown = document.querySelector('[data-name="sortFilter"]');

    // Обнови activeFilters от dropdown стойностите
    if (categoryDropdown) {
        const selectedCategory = categoryDropdown.querySelector('.dropdown-option.selected');
        activeFilters.category = selectedCategory ? selectedCategory.dataset.value : 'all';
    }

    if (urgencyDropdown) {
        const selectedUrgency = urgencyDropdown.querySelector('.dropdown-option.selected');
        activeFilters.urgency = selectedUrgency ? selectedUrgency.dataset.value : 'all';
    }

    if (sortDropdown) {
        const selectedSort = sortDropdown.querySelector('.dropdown-option.selected');
        activeFilters.sort = selectedSort ? selectedSort.dataset.value : 'newest';
    }

    console.log('Applying filters:', activeFilters); // DEBUG

    await loadSignalsData();
}

async function clearFilters() {
    // Запомни предишния брой сигнали
    const previousCount = currentSignals.length;

    activeFilters = {
        category: 'all',
        urgency: 'all',
        search: '',
        sort: 'newest'
    };

    // Изчисти search field
    const searchInput = document.getElementById('signalSearch');
    if (searchInput) {
        searchInput.value = '';
    }

    // Рестартирай dropdown менютата
    const dropdowns = document.querySelectorAll('.custom-dropdown');
    dropdowns.forEach(dropdown => {
        const options = dropdown.querySelectorAll('.dropdown-option');
        options.forEach(opt => opt.classList.remove('selected'));

        // Избери първата опция (обикновено "Всички")
        if (options.length > 0) {
            options[0].classList.add('selected');
            const trigger = dropdown.querySelector('.dropdown-trigger .dropdown-text');
            if (trigger) {
                trigger.textContent = options[0].textContent;
            }
        }
    });

    // Презареди данните
    await loadSignalsData(false); // Без показване на "зареждане" notification

    // Покажи notification за резултата
    const newCount = currentSignals.length;
    if (newCount > previousCount) {
        window.mapCore?.showNotification(
            `🔄 Филтрите са изчистени! Показани ${newCount} сигнала (преди: ${previousCount})`,
            'success',
            4000
        );
    } else if (newCount === previousCount) {
        window.mapCore?.showNotification('✅ Филтрите са изчистени', 'info', 3000);
    } else {
        window.mapCore?.showNotification(
            `🔄 Филтрите са изчистени! Показани ${newCount} сигнала`,
            'info',
            4000
        );
    }

    console.log('Filters cleared and signals reloaded');
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
                    <span>${window.avatarUtils ? window.avatarUtils.createAvatar(signal.author?.imageUrl, signal.author?.username, 24, 'user-avatar') : '<div class="user-avatar" ' +
                       'style="width:24px;height:24px;background:#4cb15c;border-radius:50%;display:inline-block;margin-right:6px;"></div>'} ${signal.author?.username || 'Анонимен'}</span>
                    <span><i class="bi bi-calendar"></i> ${formatDate(signal.createdAt)}</span>
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
    if (window.signalManagement) {
        window.signalManagement.locationSelectionMode = true;
    }

    const btn = document.getElementById('selectLocationBtn');
    if (btn) {
        btn.innerHTML = '<i class="bi bi-crosshair"></i> <span>Кликнете на картата</span>';
        btn.classList.add('selecting');
        btn.classList.remove('selected');
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

    // Location selection - правилен event listener
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
window.startLocationSelection = startLocationSelection;
window.updateFormCoordinates = updateFormCoordinates;
