// ===== SMOLYAN MAP - MAIN COORDINATOR =====

let isInitialized = false;

// ===== ГЛАВНА ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {

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

document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.mapCore?.init === 'function') {
        window.mapCore.init();
    }

    if (typeof window.signalManagement?.init === 'function') {
        window.signalManagement.init();
    }

    setTimeout(() => {
        initializeDropdowns();
        initializeEventListeners();
        loadSignalsData();
        checkForAutoOpenSignal();
    }, 500);
});

async function checkForAutoOpenSignal() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const signalIdToOpen = urlParams.get('openSignal');

        if (signalIdToOpen) {
            setTimeout(async () => {
                try {
                    const response = await window.SignalAPI.getSignalById(signalIdToOpen);

                    if (response && typeof window.openSignalModal === 'function') {
                        window.openSignalModal(response);

                        if (response.coordinates && response.coordinates.length === 2) {
                            focusMapOnSignal(response.coordinates[0], response.coordinates[1]);
                        }

                        const newUrl = window.location.pathname;
                        window.history.replaceState({}, document.title, newUrl);
                    } else {
                        window.mapCore?.showNotification('Сигналът не е намерен', 'warning', 3000);
                    }
                } catch (error) {
                    console.error('Error auto-opening signal:', error);
                    window.mapCore?.showNotification('Грешка при отваряне на сигнала', 'error', 3000);
                }
            }, 2000);
        }
    } catch (error) {
        console.error('Error checking for auto-open signal:', error);
    }
}

function focusMapOnSignal(latitude, longitude) {
    try {
        if (window.mapCore && window.mapCore.map) {
            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);

            if (!isNaN(lat) && !isNaN(lng)) {
                window.mapCore.map.setView([lat, lng], 16);
                window.mapCore.showNotification('Картата е фокусирана върху сигнала', 'info', 2000);
            }
        }
    } catch (error) {
        console.error('Error focusing map on signal:', error);
    }
}

async function initializeMap() {
    if (isInitialized) return;

    try {
        if (window.mapCore) {
            window.mapCore.initializeMap();
            window.mapCore.initializeMapControls();
        }

        if (window.signalManagement) {
            window.signalManagement.initializeEventListeners();
            await window.signalManagement.loadSignalsData();
        }
        initializePanels();
        initializeAllDropdowns();
        isInitialized = true;

    } catch (error) {
        console.error('❌ Error during initialization:', error);
    }
}

// ===== ПАНЕЛИ =====
function initializePanels() {
    const newSignalTab = document.querySelector('.control-tab');
    if (newSignalTab) {
        newSignalTab.onclick = () => togglePanel('newSignal');
    }

    const signalsTab = document.getElementById('signalsTab');
    if (signalsTab) {
        signalsTab.onclick = toggleSignalsPanel;
    }

    const signalForm = document.getElementById('createSignalForm');
    if (signalForm) {
        signalForm.onsubmit = handleSignalSubmit;
    }

    // Initialize image upload functionality
    initializeImageUpload();

    const locationBtn = document.getElementById('selectLocationBtn');
    if (locationBtn) {
        locationBtn.onclick = function(e) {
            e.preventDefault();
            if (window.locationPicker && window.locationPicker.start) {
                window.locationPicker.start();
            } else {
                console.error('Location picker not initialized');
            }
        };
    }

    // FAB Button за mobile
    // Mobile Action Buttons
    const mobileActionButtons = document.getElementById('mobileActionButtons');
    const mobileSignalsBtn = document.getElementById('mobileSignalsBtn');
    const mobileFiltersBtn = document.getElementById('mobileFiltersBtn');
    const createSignalFab = document.getElementById('createSignalFabBtn');

    if (mobileActionButtons && mobileSignalsBtn && mobileFiltersBtn && createSignalFab) {
        // Покажи бутоните само на mobile
        if (window.innerWidth <= 768) {
            mobileActionButtons.style.display = 'flex';
            createSignalFab.style.display = 'flex';
        }

        // Event listeners
        mobileSignalsBtn.onclick = () => toggleMobileSignalsPanel();
        mobileFiltersBtn.onclick = () => toggleMobileFiltersPanel();
        createSignalFab.onclick = () => togglePanel('newSignal');

        // Скрий/покажи при resize
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                mobileActionButtons.style.display = 'flex';
                createSignalFab.style.display = 'flex';
            } else {
                mobileActionButtons.style.display = 'none';
                createSignalFab.style.display = 'none';
            }
        });
    }
}

// ===== DROPDOWN ФУНКЦИОНАЛНОСТ =====
function initializeAllDropdowns() {
    const dropdowns = document.querySelectorAll('.custom-dropdown');

    dropdowns.forEach(dropdown => {
        initializeSingleDropdown(dropdown);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown')) {
            closeAllDropdowns();
        }
    });
}

function initializeSingleDropdown(dropdown) {
    const trigger = dropdown.querySelector('.dropdown-trigger');
    const menu = dropdown.querySelector('.dropdown-menu');
    const options = dropdown.querySelectorAll('.dropdown-option');

    if (!trigger || !menu) {
        console.warn('Dropdown missing trigger or menu:', dropdown);
        return;
    }

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        dropdown.classList.toggle('active');

        const isActive = dropdown.classList.contains('active');
        trigger.setAttribute('aria-expanded', isActive);
    });

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
            const triggerText = trigger.querySelector('.dropdown-text');
            const triggerIcon = trigger.querySelector('i:not(.dropdown-arrow)');

            if (triggerText) {
                triggerText.textContent = text;
            }

            if (iconElement && triggerIcon) {
                triggerIcon.className = iconElement.className;
                triggerIcon.style.color = iconElement.style.color || '';
            }

            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            dropdown.classList.remove('active');
            trigger.setAttribute('aria-expanded', 'false');

            updateHiddenInput(dropdown, value);

            triggerFilterChange(dropdown, value);
        });
    });
    trigger.addEventListener('keydown', (e) => {
        handleDropdownKeyboard(e, dropdown);
    });
}

function updateHiddenInput(dropdown, value) {
    const parent = dropdown.parentElement;
    const hiddenInput = parent.querySelector('input[type="hidden"]');

    if (hiddenInput) {
        hiddenInput.value = value;
    }
}

// ===== DEBOUNCED FILTER TRIGGER =====
let triggerTimeout;

function triggerFilterChange(dropdown, value) {
    const dropdownName = dropdown.dataset.name;
    if (!dropdownName) return;

    clearTimeout(triggerTimeout);

    triggerTimeout = setTimeout(() => {
        if (dropdownName === 'categoryFilter' || dropdownName === 'expiredFilter' || dropdownName === 'sortFilter') {
            if (window.signalManagement && typeof window.signalManagement.applyFilters === 'function') {
                window.signalManagement.applyFilters();
            }
        }
    }, 100); // 100ms debounce
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
function togglePanel(panelName) {
    if (panelName === 'newSignal') {
        if (!window.isAuthenticated) {
            if (typeof window.showLoginWarning === 'function') {
                window.showLoginWarning();
            } else {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'info',
                        title: 'Моля, влезте в системата',
                        text: 'Трябва да сте влезли в профила си, за да създавате сигнали.',
                        showCancelButton: true,
                        confirmButtonText: 'Вход',
                        cancelButtonText: 'Затвори',
                        confirmButtonColor: '#4b9f3e',
                        cancelButtonColor: '#6c757d'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            const modal = document.getElementById('loginModal');
                            if (modal && typeof bootstrap !== 'undefined') {
                                const bsModal = new bootstrap.Modal(modal);
                                bsModal.show();
                            }
                        }
                    });
                } else {
                    alert('Моля, влезте в системата за да създавате сигнали.');
                }
            }
            return;
        }
    }

    const panel = document.getElementById(`${panelName}Panel`);
    if (!panel) return;

    const isVisible = panel.classList.contains('active');

    document.querySelectorAll('.floating-panel').forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-hidden', 'true');
    });

    if (!isVisible) {
        panel.classList.add('active');
        panel.setAttribute('aria-hidden', 'false');

        if (panelName === 'newSignal') {
            setTimeout(() => {
                const firstInput = panel.querySelector('input, textarea');
                if (firstInput) firstInput.focus();
                // Инициализираме image upload когато панелът се отвори
                initializeImageUpload();
            }, 300);
        }

        setTimeout(() => {
            const panelDropdowns = panel.querySelectorAll('.custom-dropdown');
            panelDropdowns.forEach(dropdown => {
                initializeSingleDropdown(dropdown);
            });
        }, 150);
    }
}

function closePanel(panelId) {
    const panel = document.getElementById(panelId + 'Panel');
    if (panel) {
        // За floating панели - премахваме active класа
        if (panel.classList.contains('floating-panel')) {
            panel.classList.remove('active');
            panel.setAttribute('aria-hidden', 'true');
        } else {
            // За стари панели - директно скриваме
            panel.style.display = 'none';
        }

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

        setTimeout(() => {
            const panelDropdowns = signalsContent.querySelectorAll('.custom-dropdown');
            panelDropdowns.forEach(dropdown => {
                initializeSingleDropdown(dropdown);
            });
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

        setTimeout(() => {
            const filterDropdowns = filtersContent.querySelectorAll('.custom-dropdown');
            filterDropdowns.forEach(dropdown => {
                initializeSingleDropdown(dropdown);
            });
        }, 100);
    }
}

// ===== SIGNAL FORM =====
async function handleSignalSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="spinner-border spinner-border-sm"></i> Изпращане...';
    }

    try {
        const formData = new FormData(form);
        const latitude = document.getElementById('signalLatitude').value;
        const longitude = document.getElementById('signalLongitude').value;

        if (!formData.get('title') || formData.get('title').trim().length < 5) {
            throw new Error('Заглавието трябва да е поне 5 символа');
        }

        if (!formData.get('description') || formData.get('description').trim().length < 10) {
            throw new Error('Описанието трябва да е поне 10 символа');
        }

        if (!latitude || !longitude) {
            throw new Error('Моля изберете местоположение на картата');
        }

        // Проверка дали координатите са в границите на област Смолян
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        if (window.isWithinSmolyanRegion && !window.isWithinSmolyanRegion(lat, lng)) {
            throw new Error('Местоположението трябва да е в границите на област Смолян');
        }

        const category = document.getElementById('signalCategory').value;
        const expirationDays = document.getElementById('signalExpirationDays').value;

        if (!category) {
            throw new Error('Моля изберете категория за сигнала');
        }

        if (!expirationDays || (expirationDays !== '1' && expirationDays !== '3' && expirationDays !== '7')) {
            throw new Error('Моля изберете период на активност (1, 3 или 7 дни)');
        }
        window.mapCore?.showNotification('Обработване на сигнала...', 'info', 2000);

        const signalData = {
            title: formData.get('title'),
            description: formData.get('description'),
            category: category,
            expirationDays: parseInt(expirationDays),
            latitude: latitude,  // като string
            longitude: longitude // като string
        };

        const imageInput = document.getElementById('signalImage');
        if (imageInput && imageInput.files && imageInput.files[0]) {
            signalData.image = imageInput.files[0];
        }

        const response = await window.SignalAPI.createSignal(signalData);
        const signalTitle = signalData.title.length > 30
            ? signalData.title.substring(0, 30) + '...'
            : signalData.title;

        window.mapCore?.showNotification(
            `✅ Сигнал "${signalTitle}" е публикуван успешно!`,
            'success',
            4000
        );

        resetSignalForm();
        closePanel('newSignal');

        // Веднага обновяваме картата с новия сигнал
        if (window.signalManagement) {
            // Зареждаме сигналите веднага (без изчакване)
            // Използваме малък timeout за да се уверяваме че backend-ът е обработил сигнала
            setTimeout(async () => {
                try {
                    await window.signalManagement.loadSignalsData(false);
                    window.mapCore?.showNotification('Картата е обновена с новия сигнал', 'info', 3000);
                } catch (error) {
                    console.error('Error refreshing signals after creation:', error);
                    // Опитваме се отново след малко
                    setTimeout(async () => {
                        await window.signalManagement.loadSignalsData(false);
                    }, 1000);
                }
            }, 500);
        }

    } catch (error) {
        console.error('Error creating signal:', error);

        if (error.status === 401) {
            window.mapCore?.showNotification(
                '🔒 Сесията ви е изтекла. Моля влезте отново в профила си.',
                'warning',
                6000
            );
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
        } else if (error.status === 400) {
            window.mapCore?.showNotification(
                `❌ Невалидни данни: ${error.message}`,
                'error',
                5000
            );
        } else if (error.status >= 500) {
            window.mapCore?.showNotification(
                '🔧 Възникна проблем със сървъра. Моля опитайте отново след малко.',
                'error',
                6000
            );
        } else {
            const errorMessage = error.message || 'Възникна неочаквана грешка при изпращане на сигнала';
            window.mapCore?.showNotification(`❌ ${errorMessage}`, 'error', 5000);
        }

    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-send"></i> Изпрати сигнал';
        }
    }
}


function resetSignalForm() {
    const form = document.getElementById('createSignalForm');
    if (form) form.reset();

    const formDropdowns = form.querySelectorAll('.custom-dropdown');
    formDropdowns.forEach(dropdown => {
        const trigger = dropdown.querySelector('.dropdown-trigger .dropdown-text');
        const options = dropdown.querySelectorAll('.dropdown-option');
        const hiddenInput = dropdown.parentElement.querySelector('input[type="hidden"]');

        if (trigger) {
            if (dropdown.dataset.name === 'category') {
                trigger.textContent = 'Изберете категория';
            } else if (dropdown.dataset.name === 'expirationDays') {
                trigger.textContent = 'Изберете период';
            }
        }
        options.forEach(opt => opt.classList.remove('selected'));

        if (hiddenInput) {
            hiddenInput.value = '';
        }
    });

    const latInput = document.getElementById('signalLatitude');
    const lngInput = document.getElementById('signalLongitude');
    const locationBtn = document.getElementById('selectLocationBtn');

    if (latInput) latInput.value = '';
    if (lngInput) lngInput.value = '';
    if (locationBtn) {
        locationBtn.innerHTML = '<i class="bi bi-geo-alt"></i> <span>Изберете местоположение</span>';
        locationBtn.classList.remove('selected', 'selecting');
    }

    // Изчистване на снимката
    const imageInput = document.getElementById('signalImage');
    if (imageInput) {
        imageInput.value = '';
    }
    const imagePreview = document.getElementById('imagePreview');
    const previewImage = document.getElementById('previewImage');
    const fileText = document.querySelector('.file-text');
    if (imagePreview) imagePreview.style.display = 'none';
    if (previewImage) previewImage.src = '';
    if (fileText) fileText.textContent = 'Изберете снимка';

    const map = window.mapCore?.getMap();
    if (map && temporaryMarker) {
        map.removeLayer(temporaryMarker);
        temporaryMarker = null;
    }

    if (window.signalManagement) {
        window.signalManagement.locationSelectionMode = false;
    }
}

// ===== LOGIN WARNING FUNCTION =====
function showLoginWarning() {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'info',
            title: 'Моля, влезте в системата',
            text: 'Трябва да сте влезли в профила си, за да създавате сигнали.',
            showCancelButton: true,
            confirmButtonText: 'Вход',
            cancelButtonText: 'Затвори',
            confirmButtonColor: '#4b9f3e',
            cancelButtonColor: '#6c757d',
            customClass: {
                popup: 'rounded-3 shadow'
            },
            allowOutsideClick: false
        }).then((result) => {
            if (result.isConfirmed) {
                const modal = document.getElementById('loginModal');
                if (modal && typeof bootstrap !== 'undefined') {
                    const bsModal = new bootstrap.Modal(modal);
                    bsModal.show();
                } else {
                    window.location.href = '/login';
                }
            }
        });
    } else {
        if (confirm('Моля, влезте в системата за да създавате сигнали.\n\nИскате ли да отидете към страницата за вход?')) {
            window.location.href = '/login';
        }
    }
}

// ===== HELPER FUNCTIONS =====
function refreshDropdowns() {
    initializeAllDropdowns();
}

function setDropdownValue(dropdownName, value) {
    const dropdown = document.querySelector(`[data-name="${dropdownName}"]`);
    if (!dropdown) return;

    const option = dropdown.querySelector(`[data-value="${value}"]`);
    if (option) {
        option.click();
    }
}

function getDropdownValue(dropdownName) {
    const dropdown = document.querySelector(`[data-name="${dropdownName}"]`);
    if (!dropdown) return null;

    const selected = dropdown.querySelector('.dropdown-option.selected');
    return selected ? selected.dataset.value : null;
}

window.showLoginWarning = showLoginWarning;

// ===== ГЛОБАЛНИ ПРОМЕНЛИВИ =====
let mobileActiveFilters = {
    category: 'all',
    showExpired: false,
    search: '',
    sort: 'newest'
};

// ===== ГЛОБАЛНИ ФУНКЦИИ =====
// ===== MOBILE SIGNALS PANEL =====
function toggleMobileSignalsPanel() {
    const panel = document.getElementById('mobileSignalsPanel');
    if (!panel) return;

    const isActive = panel.classList.contains('active');

    if (isActive) {
        closeMobileSignalsPanel();
    } else {
        openMobileSignalsPanel();
    }
}

function openMobileSignalsPanel() {
    const panel = document.getElementById('mobileSignalsPanel');
    if (!panel) return;

    panel.classList.add('active');

    // Load signals if not already loaded
    loadMobileSignals();
}

function closeMobileSignalsPanel() {
    const panel = document.getElementById('mobileSignalsPanel');
    if (panel) {
        panel.classList.remove('active');
    }
}

// ===== MOBILE FILTERS PANEL =====
function toggleMobileFiltersPanel() {
    const panel = document.getElementById('mobileFiltersPanel');
    if (!panel) return;

    const isActive = panel.classList.contains('active');

    if (isActive) {
        closeMobileFiltersPanel();
    } else {
        openMobileFiltersPanel();
    }
}

function openMobileFiltersPanel() {
    const panel = document.getElementById('mobileFiltersPanel');
    if (!panel) return;

    panel.classList.add('active');
    updateMobileFilterUI();
}

function closeMobileFiltersPanel() {
    const panel = document.getElementById('mobileFiltersPanel');
    if (panel) {
        panel.classList.remove('active');
    }
}

function setMobileFilter(filterType, value) {
    mobileActiveFilters[filterType] = value;
    updateMobileFilterUI();

    // If we're in the signals panel, reload the signals
    const signalsPanel = document.getElementById('mobileSignalsPanel');
    if (signalsPanel && signalsPanel.classList.contains('active')) {
        loadMobileSignals();
    }
}

function clearMobileFilters() {
    mobileActiveFilters = {
        category: 'all',
        showExpired: false,
        search: '',
        sort: 'newest'
    };
    updateMobileFilterUI();

    // If we're in the signals panel, reload the signals
    const signalsPanel = document.getElementById('mobileSignalsPanel');
    if (signalsPanel && signalsPanel.classList.contains('active')) {
        loadMobileSignals();
    }
}

function updateMobileFilterUI() {
    // Update category filter buttons
    const categoryButtons = document.querySelectorAll('.mobile-filter-option[data-value]');
    categoryButtons.forEach(btn => {
        const value = btn.getAttribute('data-value');
        const filterType = btn.closest('.mobile-filter-group').querySelector('.mobile-filter-label').textContent.toLowerCase();

        let isActive = false;

        if (filterType.includes('категория')) {
            isActive = mobileActiveFilters.category === value;
        } else if (filterType.includes('статус')) {
            if (value === 'active') {
                isActive = !mobileActiveFilters.showExpired;
            } else if (value === 'all') {
                isActive = mobileActiveFilters.showExpired;
            }
        } else if (filterType.includes('сортиране')) {
            isActive = mobileActiveFilters.sort === value;
        }

        if (isActive) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

async function loadMobileSignals() {
    const container = document.getElementById('mobileSignalsList');
    if (!container) return;

    try {
        // Show loading state
        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Зареждане на сигнали...</p>
            </div>
        `;

        // Use EXACTLY the same API logic as desktop version from signal-management.js
        const params = new URLSearchParams();
        if (mobileActiveFilters.category && mobileActiveFilters.category !== 'all') {
            params.append('category', mobileActiveFilters.category);
        }
        if (mobileActiveFilters.showExpired) {
            params.append('showExpired', 'true');
        }
        if (mobileActiveFilters.search && mobileActiveFilters.search.trim() !== '') {
            params.append('search', mobileActiveFilters.search.trim());
        }
        if (mobileActiveFilters.sort && mobileActiveFilters.sort !== 'newest') {
            params.append('sort', mobileActiveFilters.sort);
        }

        const url = `/signals${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        // Same response handling as desktop version
        const signalsArray = await response.json();

        if (!Array.isArray(signalsArray) || signalsArray.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #6c757d;">
                    <i class="bi bi-info-circle" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p>Няма намерени сигнали</p>
                </div>
            `;
            return;
        }

        // Render mobile signal cards
        const signalsHtml = signalsArray.map(signal => createMobileSignalCard(signal)).join('');
        container.innerHTML = signalsHtml;

    } catch (error) {
        console.error('Error loading mobile signals:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #dc3545;">
                <i class="bi bi-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                <p>Грешка при зареждане на сигналите</p>
            </div>
        `;
    }
}

function createMobileSignalCard(signal) {
    // Use the same categories and logic as desktop version
    const SIGNAL_CATEGORIES = {
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

    const category = SIGNAL_CATEGORIES[signal.category] || {
        name: signal.category || 'Неизвестна',
        icon: 'bi-circle',
        color: '#6b7280'
    };

    // Same expiration logic as desktop
    const expirationColors = {
        1: '#dc3545',
        3: '#ffc107',
        7: '#198754'
    };
    const expirationColor = expirationColors[signal.expirationDays] || '#6c757d';

    // Same expiration display logic
    const expirationDisplay = signal.expirationDays === 1 ? '1 ден' :
                             signal.expirationDays === 3 ? '3 дни' :
                             signal.expirationDays === 7 ? '7 дни' :
                             `${signal.expirationDays} дни`;

    // Same avatar logic as desktop
    let avatarHtml = '';
    if (window.avatarUtils && window.avatarUtils.createAvatar) {
        avatarHtml = window.avatarUtils.createAvatar(signal.author?.imageUrl, signal.author?.username, 24, 'user-avatar');
    } else {
        avatarHtml = `<div class="user-avatar" style="width:24px;height:24px;background:#4cb15c;border-radius:50%;display:inline-block;margin-right:6px;"></div>`;
    }

    // Same date formatting as desktop
    const timeAgo = window.signalModalUtils && window.signalModalUtils.getRelativeTime ?
                    window.signalModalUtils.getRelativeTime(signal.createdAt) :
                    formatDate(signal.createdAt);

    return `
        <div class="mobile-signal-card" onclick="openSignalModal(${JSON.stringify(signal).replace(/"/g, '&quot;')})">
            <div class="mobile-signal-header">
                <div class="mobile-signal-category">
                    <i class="${category.icon}"></i>
                    ${category.name}
                </div>
                <div class="mobile-signal-expiration" data-days="${signal.expirationDays}" style="color: ${expirationColor};">
                    <i class="bi bi-clock"></i>
                    ${expirationDisplay}
                </div>
            </div>
            <h4 class="mobile-signal-title">${escapeHtml(signal.title)}</h4>
            <p class="mobile-signal-description">${escapeHtml(signal.description?.substring(0, 100))}${signal.description?.length > 100 ? '...' : ''}</p>
            <div class="mobile-signal-meta">
                <span>${avatarHtml} ${escapeHtml(signal.author?.username || 'Анонимен')}</span>
                <span><i class="bi bi-calendar"></i> ${timeAgo}</span>
            </div>
        </div>
    `;
}

// Category names are now handled in createMobileSignalCard with full names

function formatDate(dateString) {
    if (!dateString) return 'Неизвестно';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('bg-BG', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return 'Неизвестно';
    }
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'току-що';
    if (diffMins < 60) return `преди ${diffMins} мин`;
    if (diffHours < 24) return `преди ${diffHours} ч`;
    if (diffDays < 7) return `преди ${diffDays} д`;
    return date.toLocaleDateString('bg-BG');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== IMAGE UPLOAD FUNCTIONALITY =====
function initializeImageUpload() {
    const imageInput = document.getElementById('signalImage');
    const fileDisplay = document.querySelector('.file-input-display');
    const imagePreview = document.getElementById('imagePreview');
    const previewImage = document.getElementById('previewImage');
    const fileText = document.querySelector('.file-text');

    if (!imageInput) return;

    // Премахваме старите event listeners ако има такива
    const newImageInput = imageInput.cloneNode(true);
    imageInput.parentNode.replaceChild(newImageInput, imageInput);

    // Event listener за change на file input
    newImageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            handleImageSelect(file);
        }
    });

    // Добавяме event listener на file-input-display за кликване
    if (fileDisplay) {
        // Премахваме стария onclick атрибут ако има такъв
        fileDisplay.removeAttribute('onclick');
        
        // Добавяме нов event listener
        fileDisplay.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (newImageInput) {
                newImageInput.click();
            }
        });
        
        // Уверяваме се че pointer-events са enabled
        fileDisplay.style.pointerEvents = 'auto';
        fileDisplay.style.cursor = 'pointer';
    }
}

function handleImageSelect(file) {
    const imageInput = document.getElementById('signalImage');
    const imagePreview = document.getElementById('imagePreview');
    const previewImage = document.getElementById('previewImage');
    const fileDisplay = document.querySelector('.file-input-display');
    const fileText = document.querySelector('.file-text');
    const imageFeedback = document.getElementById('imageFeedback');

    // Валидация на размера (максимум 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        if (imageFeedback) {
            imageFeedback.textContent = 'Снимката е твърде голяма. Максималният размер е 5MB.';
            imageFeedback.style.color = '#dc3545';
            imageFeedback.style.display = 'block';
        }
        if (imageInput) imageInput.value = '';
        return;
    }

    // Валидация на типа
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        if (imageFeedback) {
            imageFeedback.textContent = 'Невалиден формат. Разрешени са: JPG, PNG, WEBP.';
            imageFeedback.style.color = '#dc3545';
            imageFeedback.style.display = 'block';
        }
        if (imageInput) imageInput.value = '';
        return;
    }

    // Изчистване на грешки
    if (imageFeedback) {
        imageFeedback.textContent = '';
        imageFeedback.style.display = 'none';
    }

    // Показване на preview
    const reader = new FileReader();
    reader.onload = function(e) {
        if (previewImage) {
            previewImage.src = e.target.result;
        }
        if (imagePreview) {
            imagePreview.style.display = 'block';
        }
        if (fileDisplay) {
            fileDisplay.style.display = 'none';
        }
        if (fileText) {
            fileText.textContent = file.name;
        }
    };
    reader.onerror = function() {
        if (imageFeedback) {
            imageFeedback.textContent = 'Грешка при зареждане на снимката.';
            imageFeedback.style.color = '#dc3545';
            imageFeedback.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    const imageInput = document.getElementById('signalImage');
    const imagePreview = document.getElementById('imagePreview');
    const previewImage = document.getElementById('previewImage');
    const fileDisplay = document.querySelector('.file-input-display');
    const fileText = document.querySelector('.file-text');
    const imageFeedback = document.getElementById('imageFeedback');

    if (imageInput) imageInput.value = '';
    if (previewImage) previewImage.src = '';
    if (imagePreview) imagePreview.style.display = 'none';
    if (fileDisplay) fileDisplay.style.display = 'block';
    if (fileText) fileText.textContent = 'Изберете снимка';
    if (imageFeedback) {
        imageFeedback.textContent = '';
        imageFeedback.style.display = 'none';
    }
}

// Глобална функция за removeImage (извиква се от HTML)
window.removeImage = removeImage;

window.togglePanel = togglePanel;
window.closePanel = closePanel;
window.toggleSignalsPanel = toggleSignalsPanel;
window.toggleMobileSignalsPanel = toggleMobileSignalsPanel;
window.closeMobileSignalsPanel = closeMobileSignalsPanel;
window.toggleMobileFiltersPanel = toggleMobileFiltersPanel;
window.closeMobileFiltersPanel = closeMobileFiltersPanel;
window.setMobileFilter = setMobileFilter;
window.clearMobileFilters = clearMobileFilters;
window.toggleFilters = toggleFilters;
window.initializeAllDropdowns = initializeAllDropdowns;
window.refreshDropdowns = refreshDropdowns;
window.setDropdownValue = setDropdownValue;
window.getDropdownValue = getDropdownValue;
window.closeAllDropdowns = closeAllDropdowns;

