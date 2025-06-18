// ====== CUSTOM DROPDOWN FUNCTIONALITY ======
// Файл: src/main/resources/static/js/customDropdowns.js

/**
 * Инициализира custom dropdown менютата
 */
function initializeCustomDropdowns() {
    const dropdowns = document.querySelectorAll('.filter-dropdown select');

    dropdowns.forEach(select => {
        createCustomDropdown(select);
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown')) {
            closeAllDropdowns();
        }
    });

    console.log('Custom dropdowns initialized');
}

/**
 * Създава custom dropdown от select елемент
 */
function createCustomDropdown(selectElement) {
    const container = selectElement.parentElement;

    // Създаване на custom dropdown структурата
    const customDropdown = document.createElement('div');
    customDropdown.className = 'custom-dropdown';
    customDropdown.dataset.name = selectElement.name;

    // Trigger елемент
    const trigger = document.createElement('div');
    trigger.className = 'custom-dropdown-trigger';
    trigger.tabIndex = 0;

    const triggerText = document.createElement('span');
    triggerText.className = 'dropdown-text';

    const arrow = document.createElement('svg');
    arrow.className = 'custom-dropdown-arrow';
    arrow.setAttribute('viewBox', '0 0 16 16');
    arrow.setAttribute('fill', 'none');
    arrow.setAttribute('stroke', 'currentColor');
    arrow.setAttribute('stroke-width', '2');
    arrow.innerHTML = '<path d="m2 5 6 6 6-6"/>';

    trigger.appendChild(triggerText);
    trigger.appendChild(arrow);

    // Menu елемент
    const menu = document.createElement('div');
    menu.className = 'custom-dropdown-menu';

    // Създаване на опции от оригиналния select
    const options = selectElement.querySelectorAll('option');
    let selectedValue = selectElement.value;
    let selectedText = '';

    options.forEach(option => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'custom-dropdown-option';
        optionDiv.dataset.value = option.value;
        optionDiv.textContent = option.textContent;

        if (option.selected || option.value === selectedValue) {
            optionDiv.classList.add('selected');
            selectedText = option.textContent;
        }

        // Click handler за опцията
        optionDiv.addEventListener('click', (e) => {
            selectCustomOption(customDropdown, selectElement, optionDiv);
        });

        menu.appendChild(optionDiv);
    });

    // Задаване на началния текст
    triggerText.textContent = selectedText || options[0]?.textContent || 'Избери...';

    // Event listeners
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCustomDropdown(customDropdown);
    });

    trigger.addEventListener('keydown', (e) => {
        handleDropdownKeyboard(e, customDropdown, selectElement);
    });

    // Сглобяване на dropdown-а
    customDropdown.appendChild(trigger);
    customDropdown.appendChild(menu);

    // Вмъкване в DOM-а
    container.insertBefore(customDropdown, selectElement);
}

/**
 * Отваря/затваря custom dropdown
 */
function toggleCustomDropdown(dropdown) {
    const isActive = dropdown.classList.contains('active');

    // Затваряне на всички други dropdowns
    closeAllDropdowns();

    if (!isActive) {
        dropdown.classList.add('active');
        dropdown.querySelector('.custom-dropdown-trigger').focus();
    }
}

/**
 * Затваря всички dropdowns
 */
function closeAllDropdowns() {
    const activeDropdowns = document.querySelectorAll('.custom-dropdown.active');
    activeDropdowns.forEach(dropdown => {
        dropdown.classList.remove('active');
    });
}

/**
 * Селектира опция в custom dropdown
 */
function selectCustomOption(dropdown, originalSelect, optionElement) {
    const value = optionElement.dataset.value;
    const text = optionElement.textContent;

    // Обновяване на оригиналния select
    originalSelect.value = value;

    // Обновяване на trigger текста
    const triggerText = dropdown.querySelector('.dropdown-text');
    triggerText.textContent = text;

    // Обновяване на selected клас
    const options = dropdown.querySelectorAll('.custom-dropdown-option');
    options.forEach(opt => opt.classList.remove('selected'));
    optionElement.classList.add('selected');

    // Затваряне на dropdown-а
    dropdown.classList.remove('active');

    // Trigger change event на оригиналния select
    const changeEvent = new Event('change', { bubbles: true });
    originalSelect.dispatchEvent(changeEvent);
}

/**
 * Обработва keyboard навигация в dropdown
 */
function handleDropdownKeyboard(event, dropdown, originalSelect) {
    const key = event.key;
    const options = dropdown.querySelectorAll('.custom-dropdown-option');
    const isOpen = dropdown.classList.contains('active');

    switch (key) {
        case 'Enter':
        case ' ':
            event.preventDefault();
            if (!isOpen) {
                toggleCustomDropdown(dropdown);
            } else {
                const selected = dropdown.querySelector('.custom-dropdown-option.selected');
                if (selected) {
                    selectCustomOption(dropdown, originalSelect, selected);
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
                toggleCustomDropdown(dropdown);
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

/**
 * Навигира между опциите с клавиатурата
 */
function navigateOptions(options, direction) {
    const currentSelected = Array.from(options).findIndex(opt => opt.classList.contains('selected'));
    let newIndex = currentSelected + direction;

    if (newIndex < 0) newIndex = options.length - 1;
    if (newIndex >= options.length) newIndex = 0;

    options.forEach(opt => opt.classList.remove('selected'));
    options[newIndex].classList.add('selected');

    // Scroll into view ако е необходимо
    options[newIndex].scrollIntoView({ block: 'nearest' });
}