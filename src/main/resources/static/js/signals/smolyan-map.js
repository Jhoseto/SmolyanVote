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

    const locationBtn = document.getElementById('selectLocationBtn');
    if (locationBtn) {
        locationBtn.onclick = function(e) {
            e.preventDefault();
            if (window.startLocationSelection) {
                window.startLocationSelection();
            }
        };
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

        if (window.signalManagement) {
            setTimeout(async () => {
                await window.signalManagement.loadSignalsData();
                window.mapCore?.showNotification('Картата е обновена с новия сигнал', 'info', 3000);
            }, 1000);
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

