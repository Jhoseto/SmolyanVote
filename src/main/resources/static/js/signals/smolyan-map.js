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

    // Location selection button - важно!
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

// ===== DEBOUNCED FILTER TRIGGER =====
let triggerTimeout;

function triggerFilterChange(dropdown, value) {
    const dropdownName = dropdown.dataset.name;

    if (!dropdownName) return;

    clearTimeout(triggerTimeout);

    triggerTimeout = setTimeout(() => {
        if (dropdownName === 'categoryFilter' || dropdownName === 'urgencyFilter' || dropdownName === 'sortFilter') {
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
function togglePanel(panelName) {
    // Специална проверка за newSignal панела
    if (panelName === 'newSignal') {
        if (!window.isAuthenticated) {
            // Използваме същия showLoginWarning като при publications
            if (typeof window.showLoginWarning === 'function') {
                window.showLoginWarning();
            } else {
                // Fallback ако функцията не съществува
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
            return; // Спира изпълнението без да отвори панела
        }
    }

    const panel = document.getElementById(`${panelName}Panel`);
    if (!panel) return;

    const isVisible = panel.classList.contains('active');

    // Затвори всички останали панели
    document.querySelectorAll('.floating-panel').forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-hidden', 'true');
    });

    if (!isVisible) {
        // Отвори панела
        panel.classList.add('active');
        panel.setAttribute('aria-hidden', 'false');

        // Фокусирай първото поле ако е newSignal панел
        if (panelName === 'newSignal') {
            setTimeout(() => {
                const firstInput = panel.querySelector('input, textarea');
                if (firstInput) firstInput.focus();
            }, 300);
        }

        // Инициализиране на dropdown менютата в панела
        setTimeout(() => {
            const panelDropdowns = panel.querySelectorAll('.custom-dropdown');
            panelDropdowns.forEach(dropdown => {
                initializeSingleDropdown(dropdown);
            });
            console.log(`Initialized ${panelDropdowns.length} dropdowns in ${panelName} panel`);
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
async function handleSignalSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    // Disable submit button during processing
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="spinner-border spinner-border-sm"></i> Изпращане...';
    }

    try {
        // Get form data
        const formData = new FormData(form);
        const latitude = document.getElementById('signalLatitude').value;
        const longitude = document.getElementById('signalLongitude').value;

        // Validation with specific error messages
        if (!formData.get('title') || formData.get('title').trim().length < 5) {
            throw new Error('Заглавието трябва да е поне 5 символа');
        }

        if (!formData.get('description') || formData.get('description').trim().length < 10) {
            throw new Error('Описанието трябва да е поне 10 символа');
        }

        if (!latitude || !longitude) {
            throw new Error('Моля изберете местоположение на картата');
        }

        // Get dropdown values
        const category = document.getElementById('signalCategory').value;
        const urgency = document.getElementById('signalUrgency').value;

        if (!category) {
            throw new Error('Моля изберете категория за сигнала');
        }

        if (!urgency) {
            throw new Error('Моля изберете спешност на сигнала');
        }

        // Show processing notification
        window.mapCore?.showNotification('Обработване на сигнала...', 'info', 2000);

        // Prepare signal data
        const signalData = {
            title: formData.get('title'),
            description: formData.get('description'),
            category: category,
            urgency: urgency,
            latitude: latitude,  // като string
            longitude: longitude // като string
        };

        // Add image if uploaded
        const imageInput = document.getElementById('signalImage');
        if (imageInput && imageInput.files && imageInput.files[0]) {
            signalData.image = imageInput.files[0];
            console.log('📷 Image attached:', imageInput.files[0].name);
        }

        console.log('Submitting signal data:', signalData);

        // Call API to create signal
        const response = await window.SignalAPI.createSignal(signalData);

        console.log('Signal created successfully:', response);

        // Show success message with more details
        const signalTitle = signalData.title.length > 30
            ? signalData.title.substring(0, 30) + '...'
            : signalData.title;

        window.mapCore?.showNotification(
            `✅ Сигнал "${signalTitle}" е публикуван успешно!`,
            'success',
            4000
        );

        // Reset and close form
        resetSignalForm();
        closePanel('newSignal');

        // Reload signals to show the new one
        if (window.signalManagement) {
            setTimeout(async () => {
                await window.signalManagement.loadSignalsData();
                window.mapCore?.showNotification('Картата е обновена с новия сигнал', 'info', 3000);
            }, 1000);
        }

    } catch (error) {
        console.error('Error creating signal:', error);

        // Специално третиране на различни типове грешки
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
            // Общо съобщение за грешка
            const errorMessage = error.message || 'Възникна неочаквана грешка при изпращане на сигнала';
            window.mapCore?.showNotification(`❌ ${errorMessage}`, 'error', 5000);
        }

    } finally {
        // Re-enable submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-send"></i> Изпрати сигнал';
        }
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
    if (map && temporaryMarker) {
        map.removeLayer(temporaryMarker);
        temporaryMarker = null;
    }

    // Reset location selection mode
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
                    // Fallback - redirect to login page
                    window.location.href = '/login';
                }
            }
        });
    } else {
        // Fallback без SweetAlert2
        if (confirm('Моля, влезте в системата за да създавате сигнали.\n\nИскате ли да отидете към страницата за вход?')) {
            window.location.href = '/login';
        }
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

