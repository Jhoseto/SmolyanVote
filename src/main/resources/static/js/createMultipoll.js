/**
 * Create Multipoll - Interactive JavaScript
 * Handles all form interactions, validation, and dynamic content for multiple choice polls
 */

// State management
let optionsCount = 2;
const maxOptions = 10;
const minOptions = 2;

// DOM Elements cache
const elements = {
    form: null,
    optionsContainer: null,
    addOptionBtn: null,
    removeOptionBtn: null,
    optionsCountDisplay: null,
    submitBtn: null,
    confirmationModal: null,
    successModal: null,
    cancelSubmitBtn: null,
    confirmSubmitBtn: null,
    stayHereBtn: null,
    allCheckboxes: null,
    titleInput: null,
    descriptionInput: null,
    locationSelect: null
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    initializeCharacterCounters();
    initializeImageUpload();
    initializeOptionsManagement();
    initializeFormValidation();
    initializeModals();
    initializeAlerts();
    populateExistingOptions();
});

/**
 * Cache DOM elements for better performance
 */
function initializeElements() {
    elements.form = document.querySelector('.multipoll-form');
    elements.optionsContainer = document.getElementById('optionsContainer');
    elements.addOptionBtn = document.getElementById('addOptionBtn');
    elements.removeOptionBtn = document.getElementById('removeOptionBtn');
    elements.optionsCountDisplay = document.getElementById('optionsCount');
    elements.submitBtn = document.getElementById('submitMultipollBtn');
    elements.confirmationModal = document.getElementById('confirmationModal');
    elements.successModal = document.getElementById('successModal');
    elements.cancelSubmitBtn = document.getElementById('cancelSubmit');
    elements.confirmSubmitBtn = document.getElementById('confirmSubmit');
    elements.stayHereBtn = document.getElementById('stayHereBtn');
    elements.titleInput = document.getElementById('title');
    elements.descriptionInput = document.getElementById('description');
    elements.locationSelect = document.getElementById('location');
}

/**
 * Populate existing options from server (for validation errors)
 */
function populateExistingOptions() {
    const existingInputs = document.querySelectorAll('.option-input');
    const existingOptionsCount = existingInputs.length;

    if (existingOptionsCount > 2) {
        optionsCount = existingOptionsCount;

        // Add additional option groups if needed
        for (let i = 3; i <= existingOptionsCount; i++) {
            if (!document.querySelector(`[data-option="${i}"]`)) {
                const optionHtml = createOptionHTML(i);
                elements.optionsContainer.insertAdjacentHTML('beforeend', optionHtml);
            }
        }

        // Setup character counters for all existing options
        document.querySelectorAll('.option-input').forEach(input => {
            setupOptionCharacterCounter(input);
        });

        updateOptionsControls();
        updateOptionsCount();
    }
}

/**
 * Character counter functionality
 */
function initializeCharacterCounters() {
    // Main form fields counters
    setupCharacterCounter('title', 150);
    setupCharacterCounter('description', 1000);

    // Initial option counters
    document.querySelectorAll('.option-input').forEach(input => {
        setupOptionCharacterCounter(input);
    });
}

function setupCharacterCounter(fieldId, maxLength) {
    const field = document.getElementById(fieldId);
    const counter = field.parentElement.querySelector('.char-counter');

    if (!field || !counter) return;

    const currentSpan = counter.querySelector('.current');

    function updateCounter() {
        const length = field.value.length;
        currentSpan.textContent = length;

        // Add warning/danger classes
        currentSpan.classList.remove('warning', 'danger');
        if (length > maxLength * 0.8) {
            currentSpan.classList.add('warning');
        }
        if (length > maxLength * 0.95) {
            currentSpan.classList.add('danger');
        }
    }

    // Update counter on page load for existing values
    updateCounter();

    field.addEventListener('input', updateCounter);
    field.addEventListener('paste', () => setTimeout(updateCounter, 10));
}

function setupOptionCharacterCounter(input) {
    const counter = input.parentElement.querySelector('.char-counter');
    if (!counter) return;

    const currentSpan = counter.querySelector('.current');
    const maxLength = 100;

    function updateCounter() {
        const length = input.value.length;
        currentSpan.textContent = length;

        currentSpan.classList.remove('warning', 'danger');
        if (length > maxLength * 0.8) {
            currentSpan.classList.add('warning');
        }
        if (length > maxLength * 0.95) {
            currentSpan.classList.add('danger');
        }
    }

    // Update counter on page load for existing values
    updateCounter();

    input.addEventListener('input', updateCounter);
    input.addEventListener('paste', () => setTimeout(updateCounter, 10));
}

/**
 * Image upload and preview functionality
 */
function initializeImageUpload() {
    for (let i = 1; i <= 3; i++) {
        setupImageUpload(i);
    }
}

function setupImageUpload(index) {
    const fileInput = document.getElementById(`image${index}`);
    const uploadArea = document.getElementById(`uploadArea${index}`);
    const preview = document.getElementById(`preview${index}`);
    const removeBtn = document.getElementById(`remove${index}`);
    const label = uploadArea.parentElement;

    // File input change
    fileInput.addEventListener('change', function(e) {
        handleFileSelect(e.target.files[0], index);
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
        document.querySelector('.images-grid').classList.add('drag-active');
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        document.querySelector('.images-grid').classList.remove('drag-active');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        document.querySelector('.images-grid').classList.remove('drag-active');

        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            handleFileSelect(files[0], index);
            fileInput.files = files;
        }
    });

    // Remove image
    removeBtn.addEventListener('click', function() {
        removeImage(index);
    });

    // Preview hover effect
    preview.addEventListener('mouseenter', function() {
        removeBtn.style.display = 'flex';
    });

    label.addEventListener('mouseleave', function() {
        removeBtn.style.display = 'none';
    });
}

function handleFileSelect(file, index) {
    if (!file || !file.type.startsWith('image/')) {
        showAlert('Моля, изберете валиден image файл.', 'error');
        return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showAlert('Размерът на файла трябва да бъде под 5MB.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        showImagePreview(e.target.result, index);
    };
    reader.readAsDataURL(file);
}

function showImagePreview(src, index) {
    const uploadArea = document.getElementById(`uploadArea${index}`);
    const preview = document.getElementById(`preview${index}`);

    uploadArea.style.display = 'none';
    preview.src = src;
    preview.style.display = 'block';

    // Add smooth transition
    preview.style.opacity = '0';
    setTimeout(() => {
        preview.style.opacity = '1';
    }, 50);
}

function removeImage(index) {
    const fileInput = document.getElementById(`image${index}`);
    const uploadArea = document.getElementById(`uploadArea${index}`);
    const preview = document.getElementById(`preview${index}`);
    const removeBtn = document.getElementById(`remove${index}`);

    fileInput.value = '';
    preview.style.display = 'none';
    preview.src = '';
    uploadArea.style.display = 'flex';
    removeBtn.style.display = 'none';
}

/**
 * Options management functionality
 */
function initializeOptionsManagement() {
    elements.addOptionBtn.addEventListener('click', addOption);
    elements.removeOptionBtn.addEventListener('click', removeLastOption);

    updateOptionsControls();
}

function addOption() {
    if (optionsCount >= maxOptions) return;

    optionsCount++;
    const optionHtml = createOptionHTML(optionsCount);

    // Add with animation
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = optionHtml;
    const newOption = tempDiv.firstElementChild;

    elements.optionsContainer.appendChild(newOption);

    // Setup character counter for new option
    const input = newOption.querySelector('.option-input');
    setupOptionCharacterCounter(input);

    // Focus new input
    setTimeout(() => {
        input.focus();
    }, 300);

    updateOptionsControls();
    updateOptionsCount();
}

function removeLastOption() {
    if (optionsCount <= minOptions) return;

    const lastOption = elements.optionsContainer.querySelector(`[data-option="${optionsCount}"]`);
    if (lastOption) {
        lastOption.classList.add('removing');

        setTimeout(() => {
            lastOption.remove();
            optionsCount--;
            updateOptionsControls();
            updateOptionsCount();
        }, 300);
    }
}

function createOptionHTML(number) {
    const labels = {
        1: 'Първа', 2: 'Втора', 3: 'Трета', 4: 'Четвърта', 5: 'Пета',
        6: 'Шеста', 7: 'Седма', 8: 'Осма', 9: 'Девета', 10: 'Десета'
    };

    const placeholders = [
        'Спорт, Музика, Технологии',
        'Култура, Образование, Развлечения',
        'Наука, Изкуство, Бизнес',
        'Здравеопазване, Екология, Туризъм',
        'Храна, Мода, Автомобили',
        'Филми, Книги, Игри',
        'Социални медии, Блогове, Подкасти',
        'Фотография, Видео, Графика'
    ];

    const placeholder = placeholders[number - 1] || `Опция ${number}`;

    return `
        <div class="option-group" data-option="${number}">
            <label class="option-label">
                <span class="option-number">${number}</span>
                <span>${labels[number]} опция</span>
                <span class="required">*</span>
            </label>
            <div class="option-input-group">
                <input type="text" class="form-control option-input" name="options" required maxlength="100" 
                       placeholder="Напр. ${placeholder}">
                <div class="char-counter">
                    <span class="current">0</span>/<span class="max">100</span>
                </div>
            </div>
        </div>
    `;
}

function updateOptionsControls() {
    elements.addOptionBtn.disabled = optionsCount >= maxOptions;
    elements.removeOptionBtn.disabled = optionsCount <= minOptions;
    elements.removeOptionBtn.style.display = optionsCount > minOptions ? 'inline-flex' : 'none';
}

function updateOptionsCount() {
    elements.optionsCountDisplay.textContent = optionsCount;
}

/**
 * Form validation
 */
function initializeFormValidation() {
    elements.form.addEventListener('submit', function(e) {
        e.preventDefault();

        if (validateForm()) {
            showConfirmationModal();
        }
    });

    // Real-time validation
    elements.titleInput.addEventListener('blur', validateTitle);
    elements.descriptionInput.addEventListener('blur', validateDescription);
    elements.locationSelect.addEventListener('change', validateLocation);

    // Options validation
    elements.optionsContainer.addEventListener('blur', function(e) {
        if (e.target.classList.contains('option-input')) {
            validateOption(e.target);
        }
    }, true);
}

function validateForm() {
    let isValid = true;

    // Clear previous errors
    document.querySelectorAll('.form-control.error').forEach(el => {
        el.classList.remove('error');
    });

    // Validate title
    if (!validateTitle()) isValid = false;

    // Validate description
    if (!validateDescription()) isValid = false;

    // Validate location
    if (!validateLocation()) isValid = false;

    // Validate options
    if (!validateOptions()) isValid = false;

    if (!isValid) {
        showAlert('Моля, поправете грешките във формата.', 'error');
        // Scroll to first error
        const firstError = document.querySelector('.form-control.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstError.focus();
        }
    }

    return isValid;
}

function validateTitle() {
    const value = elements.titleInput.value.trim();
    const isValid = value.length >= 10 && value.length <= 150;

    if (!isValid) {
        elements.titleInput.classList.add('error');
    } else {
        elements.titleInput.classList.remove('error');
    }

    return isValid;
}

function validateDescription() {
    const value = elements.descriptionInput.value.trim();
    const isValid = value.length >= 50 && value.length <= 1000;

    if (!isValid) {
        elements.descriptionInput.classList.add('error');
    } else {
        elements.descriptionInput.classList.remove('error');
    }

    return isValid;
}

function validateLocation() {
    const value = elements.locationSelect.value;
    const isValid = value && value !== 'NONE';

    if (!isValid) {
        elements.locationSelect.classList.add('error');
    } else {
        elements.locationSelect.classList.remove('error');
    }

    return isValid;
}

function validateOptions() {
    const options = document.querySelectorAll('.option-input');
    let isValid = true;
    const values = new Set();

    options.forEach(input => {
        const value = input.value.trim();

        // Check if empty
        if (!value) {
            input.classList.add('error');
            isValid = false;
            return;
        }

        // Check minimum length
        if (value.length < 3) {
            input.classList.add('error');
            isValid = false;
            return;
        }

        // Check for duplicates
        if (values.has(value.toLowerCase())) {
            input.classList.add('error');
            isValid = false;
            return;
        }

        values.add(value.toLowerCase());
        input.classList.remove('error');
    });

    return isValid;
}

function validateOption(input) {
    const value = input.value.trim();
    const isValid = value.length >= 3 && value.length <= 100;

    if (!isValid) {
        input.classList.add('error');
    } else {
        input.classList.remove('error');
    }

    return isValid;
}

/**
 * Modal functionality
 */
function initializeModals() {
    // Confirmation modal
    elements.cancelSubmitBtn.addEventListener('click', hideConfirmationModal);
    elements.confirmSubmitBtn.addEventListener('click', submitForm);

    // Success modal
    elements.stayHereBtn.addEventListener('click', function() {
        hideSuccessModal();
        resetForm();
    });

    // Checkbox validation for confirmation
    elements.allCheckboxes = document.querySelectorAll('#confirmationModal input[type="checkbox"]');
    elements.allCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateConfirmButton);
    });

    // Close modals on outside click
    elements.confirmationModal.addEventListener('click', function(e) {
        if (e.target === this) {
            hideConfirmationModal();
        }
    });

    elements.successModal.addEventListener('click', function(e) {
        if (e.target === this) {
            hideSuccessModal();
        }
    });
}

function showConfirmationModal() {
    updateModalSummary();
    elements.confirmationModal.classList.add('active');
    elements.confirmationModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function hideConfirmationModal() {
    elements.confirmationModal.classList.remove('active');
    setTimeout(() => {
        elements.confirmationModal.style.display = 'none';
        document.body.style.overflow = '';
    }, 300);
}

function showSuccessModal() {
    elements.successModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function hideSuccessModal() {
    elements.successModal.style.display = 'none';
    document.body.style.overflow = '';
}

function updateModalSummary() {
    // Update title
    document.getElementById('summaryTitle').textContent = elements.titleInput.value || '-';

    // Update location
    const locationText = elements.locationSelect.selectedOptions[0]?.textContent || '-';
    document.getElementById('summaryLocation').textContent = locationText;

    // Update options count
    document.getElementById('summaryOptionsCount').textContent = optionsCount;

    // Update options list
    const optionsList = document.getElementById('summaryOptionsList');
    optionsList.innerHTML = '';

    document.querySelectorAll('.option-input').forEach((input, index) => {
        if (input.value.trim()) {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option-summary';
            optionDiv.textContent = `${index + 1}. ${input.value.trim()}`;
            optionsList.appendChild(optionDiv);
        }
    });
}

function updateConfirmButton() {
    const allChecked = Array.from(elements.allCheckboxes).every(cb => cb.checked);
    elements.confirmSubmitBtn.disabled = !allChecked;
}

function submitForm() {
    elements.confirmSubmitBtn.classList.add('loading');
    elements.confirmSubmitBtn.disabled = true;

    // Create form data and submit
    const formData = new FormData(elements.form);

    // Add CSRF token
    const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

    fetch(elements.form.action, {
        method: 'POST',
        body: formData,
        headers: {
            [csrfHeader]: csrfToken
        }
    })
        .then(response => {
            if (response.ok) {
                hideConfirmationModal();
                showSuccessModal();
                showAlert('Анкетата е създадена успешно!', 'success');
            } else {
                throw new Error('Server error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Възникна грешка при създаването на анкетата. Моля, опитайте отново.', 'error');
        })
        .finally(() => {
            elements.confirmSubmitBtn.classList.remove('loading');
            elements.confirmSubmitBtn.disabled = false;
        });
}

/**
 * Alert system
 */
function initializeAlerts() {
    // Close button functionality for existing alerts
    document.querySelectorAll('.alert-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const alert = this.closest('.alert');
            hideAlert(alert);
        });
    });
}

function showAlert(message, type = 'error') {
    const alertHtml = `
        <div class="alert alert-${type}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${type === 'success'
        ? '<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/>'
        : '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
    }
            </svg>
            <span>${message}</span>
            <button type="button" class="alert-close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
        </div>
    `;

    const alertsContainer = document.querySelector('.alerts-container');
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = alertHtml;
    const alertElement = tempDiv.firstElementChild;

    alertsContainer.appendChild(alertElement);

    // Add close functionality
    alertElement.querySelector('.alert-close').addEventListener('click', function() {
        hideAlert(alertElement);
    });

    // Auto hide after 5 seconds
    setTimeout(() => {
        if (alertElement.parentElement) {
            hideAlert(alertElement);
        }
    }, 5000);

    // Scroll to alert
    alertElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideAlert(alertElement) {
    alertElement.style.opacity = '0';
    alertElement.style.transform = 'translateY(-10px)';

    setTimeout(() => {
        if (alertElement.parentElement) {
            alertElement.remove();
        }
    }, 300);
}

/**
 * Form reset functionality
 */
function resetForm() {
    // Reset basic fields
    elements.form.reset();

    // Reset character counters
    document.querySelectorAll('.char-counter .current').forEach(span => {
        span.textContent = '0';
        span.classList.remove('warning', 'danger');
    });

    // Reset images
    for (let i = 1; i <= 3; i++) {
        removeImage(i);
    }

    // Reset options to initial state
    optionsCount = 2;
    elements.optionsContainer.innerHTML = '';

    for (let i = 1; i <= 2; i++) {
        const optionHtml = createOptionHTML(i);
        elements.optionsContainer.insertAdjacentHTML('beforeend', optionHtml);
    }

    // Setup character counters for new options
    document.querySelectorAll('.option-input').forEach(input => {
        setupOptionCharacterCounter(input);
    });

    updateOptionsControls();
    updateOptionsCount();

    // Reset validation states
    document.querySelectorAll('.form-control.error').forEach(el => {
        el.classList.remove('error');
    });

    // Reset checkboxes
    elements.allCheckboxes.forEach(cb => {
        cb.checked = false;
    });
    updateConfirmButton();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Utility functions
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add some keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Escape to close modals
    if (e.key === 'Escape') {
        if (elements.confirmationModal.classList.contains('active')) {
            hideConfirmationModal();
        } else if (elements.successModal.style.display === 'block') {
            hideSuccessModal();
        }
    }

    // Ctrl/Cmd + Enter to submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (elements.confirmationModal.classList.contains('active')) {
            if (!elements.confirmSubmitBtn.disabled) {
                submitForm();
            }
        } else {
            elements.submitBtn.click();
        }
    }
});

// Prevent form submission on Enter in text inputs (except textarea)
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type === 'text') {
        e.preventDefault();
    }
});

console.log('✅ Create Multipoll JavaScript initialized successfully');