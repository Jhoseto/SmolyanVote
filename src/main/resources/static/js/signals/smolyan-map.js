// ===== SMOLYAN MAP - MAIN COORDINATOR =====
// Главен файл за координация на всички модули

let isInitialized = false;

// ===== ГЛАВНА ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🗺️ SmolyanVote Map initializing...');

    if (!document.getElementById('map')) {
        console.error('❌ Map container not found!');
        return;
    }

    if (typeof L === 'undefined') {
        console.error('❌ Leaflet library not loaded!');
        return;
    }

    initializeMap();
});

async function initializeMap() {
    if (isInitialized) return;

    try {
        // 1. Карта
        console.log('📍 Initializing map...');
        if (window.mapCore) {
            window.mapCore.initializeMap();
            window.mapCore.initializeMapControls();
        }

        // 2. Signal management
        console.log('📊 Initializing signals...');
        if (window.signalManagement) {
            window.signalManagement.initializeEventListeners();
            await window.signalManagement.loadSignalsData();
        }

        // 3. Панели
        console.log('🎛️ Initializing panels...');
        initializePanels();

        // 4. Dropdown менюта
        console.log('🔽 Initializing dropdowns...');
        initializeAllDropdowns();

        isInitialized = true;
        console.log('✅ Map initialized successfully!');

    } catch (error) {
        console.error('❌ Error during initialization:', error);
    }
}

// ===== ПАНЕЛИ =====
function initializePanels() {
    // New signal panel
    const newSignalTab = document.querySelector('.control-tab');
    if (newSignalTab) {
        newSignalTab.onclick = () => togglePanel('newSignal');
    }

    // Signals panel
    const signalsTab = document.getElementById('signalsTab');
    if (signalsTab) {
        signalsTab.onclick = toggleSignalsPanel;
    }

    // Form submission
    const signalForm = document.getElementById('createSignalForm');
    if (signalForm) {
        signalForm.onsubmit = handleSignalSubmit;
    }
}

// ===== DROPDOWN ФУНКЦИОНАЛНОСТ =====
function initializeAllDropdowns() {
    // Инициализиране на всички dropdown менюта на страницата
    const dropdowns = document.querySelectorAll('.custom-dropdown');

    dropdowns.forEach(dropdown => {
        initializeSingleDropdown(dropdown);
    });

    // Глобален listener за затваряне при клик навън
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown')) {
            closeAllDropdowns();
        }
    });

    console.log(`Initialized ${dropdowns.length} dropdown menus`);
}

function initializeSingleDropdown(dropdown) {
    const trigger = dropdown.querySelector('.dropdown-trigger');
    const menu = dropdown.querySelector('.dropdown-menu');
    const options = dropdown.querySelectorAll('.dropdown-option');

    if (!trigger || !menu) {
        console.warn('Dropdown missing trigger or menu:', dropdown);
        return;
    }

    // Click на trigger
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();

        // Затвори всички други dropdown менюта
        closeAllDropdowns();

        // Toggle текущия dropdown
        dropdown.classList.toggle('active');

        // Update aria-expanded
        const isActive = dropdown.classList.contains('active');
        trigger.setAttribute('aria-expanded', isActive);
    });

    // Click на опции
    options.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();

            const value = option.dataset.value;
            const textElement = option.querySelector('span');
            const iconElement = option.querySelector('i');

            if (!textElement) {
                console.warn('Dropdown option missing text span:', option);
                return;
            }

            const text = textElement.textContent;

            // Обнови trigger текста и иконата
            const triggerText = trigger.querySelector('.dropdown-text');
            const triggerIcon = trigger.querySelector('i:not(.dropdown-arrow)');

            if (triggerText) {
                triggerText.textContent = text;
            }

            // Копирай иконата ако има
            if (iconElement && triggerIcon) {
                triggerIcon.className = iconElement.className;
                triggerIcon.style.color = iconElement.style.color || '';
            }

            // Маркирай избраната опция
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');

            // Затвори dropdown
            dropdown.classList.remove('active');
            trigger.setAttribute('aria-expanded', 'false');

            // Обнови скритото поле ако има
            updateHiddenInput(dropdown, value);

            // Trigger change event за филтрите
            triggerFilterChange(dropdown, value);

            console.log(`Dropdown selection: ${dropdown.dataset.name} = ${value}`);
        });
    });

    // Keyboard navigation
    trigger.addEventListener('keydown', (e) => {
        handleDropdownKeyboard(e, dropdown);
    });
}

function updateHiddenInput(dropdown, value) {
    // Търси скрито поле в същия parent element
    const parent = dropdown.parentElement;
    const hiddenInput = parent.querySelector('input[type="hidden"]');

    if (hiddenInput) {
        hiddenInput.value = value;
        console.log(`Updated hidden input: ${hiddenInput.name} = ${value}`);
    }
}

function triggerFilterChange(dropdown, value) {
    const dropdownName = dropdown.dataset.name;

    if (!dropdownName) return;

    // За филтрите в signals панела
    if (dropdownName === 'categoryFilter' || dropdownName === 'urgencyFilter' || dropdownName === 'sortFilter') {
        // Обнови стойността в signal management
        if (window.signalManagement) {
            // Simulate change event
            setTimeout(() => {
                if (typeof window.signalManagement.applyFilters === 'function') {
                    window.signalManagement.applyFilters();
                }
            }, 10);
        }
    }
}

function handleDropdownKeyboard(event, dropdown) {
    const key = event.key;
    const trigger = dropdown.querySelector('.dropdown-trigger');
    const options = dropdown.querySelectorAll('.dropdown-option');
    const isOpen = dropdown.classList.contains('active');

    switch (key) {
        case 'Enter':
        case ' ':
            event.preventDefault();
            if (!isOpen) {
                dropdown.classList.add('active');
                trigger.setAttribute('aria-expanded', 'true');
            } else {
                const selected = dropdown.querySelector('.dropdown-option.selected');
                if (selected) {
                    selected.click();
                }
            }
            break;

        case 'Escape':
            event.preventDefault();
            closeAllDropdowns();
            break;

        case 'ArrowDown':
            event.preventDefault();
            if (!isOpen) {
                dropdown.classList.add('active');
                trigger.setAttribute('aria-expanded', 'true');
            } else {
                navigateOptions(options, 1);
            }
            break;

        case 'ArrowUp':
            event.preventDefault();
            if (isOpen) {
                navigateOptions(options, -1);
            }
            break;
    }
}

function navigateOptions(options, direction) {
    const currentSelected = Array.from(options).findIndex(opt => opt.classList.contains('selected'));
    let newIndex = currentSelected + direction;

    if (newIndex < 0) newIndex = options.length - 1;
    if (newIndex >= options.length) newIndex = 0;

    options.forEach(opt => opt.classList.remove('selected'));
    options[newIndex].classList.add('selected');

    // Scroll into view
    options[newIndex].scrollIntoView({ block: 'nearest' });
}

function closeAllDropdowns() {
    const activeDropdowns = document.querySelectorAll('.custom-dropdown.active');
    activeDropdowns.forEach(dropdown => {
        dropdown.classList.remove('active');
        const trigger = dropdown.querySelector('.dropdown-trigger');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
    });
}

// ===== TOGGLE PANELS =====
function togglePanel(panelId) {
    const panel = document.getElementById(panelId + 'Panel');
    if (!panel) return;

    const isVisible = panel.style.display === 'flex';

    if (isVisible) {
        panel.style.display = 'none';
        if (panelId === 'newSignal') {
            resetSignalForm();
        }
    } else {
        panel.style.display = 'flex';

        // Инициализиране на dropdown менютата в панела
        if (panelId === 'newSignal') {
            setTimeout(() => {
                const panelDropdowns = panel.querySelectorAll('.custom-dropdown');
                panelDropdowns.forEach(dropdown => {
                    initializeSingleDropdown(dropdown);
                });
            }, 100);
        }
    }
}

function closePanel(panelId) {
    const panel = document.getElementById(panelId + 'Panel');
    if (panel) {
        panel.style.display = 'none';
        if (panelId === 'newSignal') {
            resetSignalForm();
        }
    }
}

function toggleSignalsPanel() {
    const signalsContent = document.getElementById('signalsContent');
    const arrow = document.getElementById('signalsTabArrow');

    if (!signalsContent) return;

    const isExpanded = signalsContent.style.display === 'flex';

    if (isExpanded) {
        signalsContent.style.display = 'none';
        if (arrow) arrow.style.transform = 'rotate(0deg)';
    } else {
        signalsContent.style.display = 'flex';
        if (arrow) arrow.style.transform = 'rotate(180deg)';

        // Инициализиране на dropdown менютата в signals панела
        setTimeout(() => {
            const panelDropdowns = signalsContent.querySelectorAll('.custom-dropdown');
            panelDropdowns.forEach(dropdown => {
                initializeSingleDropdown(dropdown);
            });
            console.log(`Initialized ${panelDropdowns.length} dropdowns in signals panel`);
        }, 150);
    }
}

// ===== ФИЛТРИ =====
function toggleFilters() {
    const filtersContent = document.getElementById('filtersContent');
    const arrow = document.getElementById('filtersArrow');

    if (!filtersContent) return;

    const isExpanded = filtersContent.style.display === 'block';

    if (isExpanded) {
        filtersContent.style.display = 'none';
        if (arrow) arrow.style.transform = 'rotate(0deg)';
    } else {
        filtersContent.style.display = 'block';
        if (arrow) arrow.style.transform = 'rotate(180deg)';

        // Инициализиране на dropdown менютата във филтрите
        setTimeout(() => {
            const filterDropdowns = filtersContent.querySelectorAll('.custom-dropdown');
            filterDropdowns.forEach(dropdown => {
                initializeSingleDropdown(dropdown);
            });
        }, 100);
    }
}

// ===== SIGNAL FORM =====
function handleSignalSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const latitude = document.getElementById('signalLatitude').value;
    const longitude = document.getElementById('signalLongitude').value;

    if (!latitude || !longitude) {
        alert('Моля изберете местоположение на картата');
        return;
    }

    // Вземи стойностите от dropdown менютата
    const categoryDropdown = document.querySelector('[data-name="category"]');
    const urgencyDropdown = document.querySelector('[data-name="urgency"]');

    const category = document.getElementById('signalCategory').value;
    const urgency = document.getElementById('signalUrgency').value;

    if (!category) {
        alert('Моля изберете категория');
        return;
    }

    if (!urgency) {
        alert('Моля изберете спешност');
        return;
    }

    // TODO: Submit to server
    console.log('Signal data:', {
        title: formData.get('title'),
        category: category,
        urgency: urgency,
        description: formData.get('description'),
        coordinates: [parseFloat(latitude), parseFloat(longitude)]
    });

    alert('Сигналът е изпратен успешно!');
    closePanel('newSignal');

    // Reload signals
    if (window.signalManagement) {
        window.signalManagement.loadSignalsData();
    }
}

function resetSignalForm() {
    const form = document.getElementById('createSignalForm');
    if (form) form.reset();

    // Reset dropdown менютата
    const formDropdowns = form.querySelectorAll('.custom-dropdown');
    formDropdowns.forEach(dropdown => {
        const trigger = dropdown.querySelector('.dropdown-trigger .dropdown-text');
        const options = dropdown.querySelectorAll('.dropdown-option');
        const hiddenInput = dropdown.parentElement.querySelector('input[type="hidden"]');

        // Reset trigger text
        if (trigger) {
            if (dropdown.dataset.name === 'category') {
                trigger.textContent = 'Изберете категория';
            } else if (dropdown.dataset.name === 'urgency') {
                trigger.textContent = 'Изберете спешност';
            }
        }

        // Reset selected options
        options.forEach(opt => opt.classList.remove('selected'));

        // Reset hidden input
        if (hiddenInput) {
            hiddenInput.value = '';
        }
    });

    // Reset location
    const latInput = document.getElementById('signalLatitude');
    const lngInput = document.getElementById('signalLongitude');
    const locationBtn = document.getElementById('selectLocationBtn');

    if (latInput) latInput.value = '';
    if (lngInput) lngInput.value = '';
    if (locationBtn) {
        locationBtn.innerHTML = '<i class="bi bi-geo-alt"></i> <span>Изберете местоположение</span>';
        locationBtn.classList.remove('selected', 'selecting');
    }

    // Remove temporary marker
    const map = window.mapCore?.getMap();
    if (map && window.temporaryMarker) {
        map.removeLayer(window.temporaryMarker);
        window.temporaryMarker = null;
    }

    // Reset location selection mode
    if (window.signalManagement) {
        window.signalManagement.locationSelectionMode = false;
    }
}

// ===== HELPER FUNCTIONS =====
function refreshDropdowns() {
    // Функция за ръчно обновяване на dropdown менютата
    initializeAllDropdowns();
}

function setDropdownValue(dropdownName, value) {
    // Функция за програмно задаване на стойност в dropdown
    const dropdown = document.querySelector(`[data-name="${dropdownName}"]`);
    if (!dropdown) return;

    const option = dropdown.querySelector(`[data-value="${value}"]`);
    if (option) {
        option.click();
    }
}

function getDropdownValue(dropdownName) {
    // Функция за получаване на стойност от dropdown
    const dropdown = document.querySelector(`[data-name="${dropdownName}"]`);
    if (!dropdown) return null;

    const selected = dropdown.querySelector('.dropdown-option.selected');
    return selected ? selected.dataset.value : null;
}

// ===== ГЛОБАЛНИ ФУНКЦИИ =====
window.togglePanel = togglePanel;
window.closePanel = closePanel;
window.toggleSignalsPanel = toggleSignalsPanel;
window.toggleFilters = toggleFilters;
window.initializeAllDropdowns = initializeAllDropdowns;
window.refreshDropdowns = refreshDropdowns;
window.setDropdownValue = setDropdownValue;
window.getDropdownValue = getDropdownValue;
window.closeAllDropdowns = closeAllDropdowns;

// ===== DEBUG ФУНКЦИИ =====
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.mapDebug = {
        dropdowns: () => document.querySelectorAll('.custom-dropdown'),
        activeDropdowns: () => document.querySelectorAll('.custom-dropdown.active'),
        reinitDropdowns: initializeAllDropdowns,
        testDropdown: (name, value) => setDropdownValue(name, value)
    };
    console.log('🔧 Map debug functions available at window.mapDebug');
}