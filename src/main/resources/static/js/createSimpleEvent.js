// CREATE SIMPLE EVENT - INTERACTIVE FUNCTIONALITY WITH CHECKBOXES
document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const form = document.querySelector('.event-form');
    const submitBtn = document.getElementById('submitEventBtn');
    const modal = document.getElementById('confirmationModal');
    const cancelBtn = document.getElementById('cancelSubmit');
    const confirmBtn = document.getElementById('confirmSubmit');

    // Character counters
    initCharacterCounters();

    // Image upload functionality
    initImageUploads();

    // Form validation
    initFormValidation();

    // Modal functionality
    initModalFunctionality();

    // Checkbox validation
    initCheckboxValidation();

    /**
     * Initialize character counters for all text inputs and textareas
     */
    function initCharacterCounters() {
        const fieldsWithCounters = [
            { id: 'title', max: 150 },
            { id: 'description', max: 1000 },
            { id: 'positiveLabel', max: 80 },
            { id: 'negativeLabel', max: 80 },
            { id: 'neutralLabel', max: 80 }
        ];

        fieldsWithCounters.forEach(field => {
            const input = document.getElementById(field.id);
            const counter = input.closest('.form-group').querySelector('.char-counter .current');

            if (input && counter) {
                // Update counter on input
                input.addEventListener('input', () => {
                    const currentLength = input.value.length;
                    counter.textContent = currentLength;

                    // Add warning/danger classes
                    counter.classList.remove('warning', 'danger');
                    if (currentLength > field.max * 0.9) {
                        counter.classList.add('warning');
                    }
                    if (currentLength > field.max * 0.95) {
                        counter.classList.add('danger');
                    }
                });

                // Initialize counter
                input.dispatchEvent(new Event('input'));
            }
        });
    }

    /**
     * Initialize image upload functionality with previews
     */
    function initImageUploads() {
        for (let i = 1; i <= 3; i++) {
            const input = document.getElementById(`image${i}`);
            const preview = document.getElementById(`preview${i}`);
            const uploadArea = document.getElementById(`uploadArea${i}`);
            const removeBtn = document.getElementById(`remove${i}`);

            if (!input || !preview || !uploadArea || !removeBtn) continue;

            // File input change event
            input.addEventListener('change', (e) => {
                handleImageUpload(e.target.files[0], preview, uploadArea, removeBtn);
            });

            // Drag and drop functionality
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('drag-over');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    input.files = e.dataTransfer.files;
                    handleImageUpload(file, preview, uploadArea, removeBtn);
                }
            });

            // Remove image functionality
            removeBtn.addEventListener('click', () => {
                input.value = '';
                preview.src = '';
                preview.style.display = 'none';
                uploadArea.style.display = 'flex';
                removeBtn.style.display = 'none';
            });
        }
    }

    /**
     * Handle individual image upload
     */
    function handleImageUpload(file, preview, uploadArea, removeBtn) {
        if (!file || !file.type.startsWith('image/')) {
            showAlert('Моля, изберете валиден image файл.', 'error');
            return;
        }

        // Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            showAlert('Файлът е твърде голям. Максимален размер: 5MB.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.style.display = 'block';
            uploadArea.style.display = 'none';
            removeBtn.style.display = 'flex';

            // Add upload animation
            preview.style.opacity = '0';
            preview.style.transform = 'scale(0.8)';
            setTimeout(() => {
                preview.style.transition = 'all 0.3s ease';
                preview.style.opacity = '1';
                preview.style.transform = 'scale(1)';
            }, 10);
        };
        reader.readAsDataURL(file);
    }

    /**
     * Initialize form validation
     */
    function initFormValidation() {
        const requiredFields = ['title', 'description', 'location', 'positiveLabel', 'negativeLabel', 'neutralLabel'];

        // Real-time validation
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => validateField(field));
                field.addEventListener('input', () => clearFieldError(field));
            }
        });

        // Update submit button state
        form.addEventListener('input', updateSubmitButtonState);
        form.addEventListener('change', updateSubmitButtonState);

        // Initial state
        updateSubmitButtonState();
    }

    /**
     * Validate individual field
     */
    function validateField(field) {
        const value = field.value.trim();
        const isValid = value.length > 0;

        field.classList.toggle('error', !isValid);

        // Special validation for location
        if (field.id === 'location' && value === 'NONE') {
            field.classList.add('error');
            return false;
        }

        return isValid;
    }

    /**
     * Clear field error state
     */
    function clearFieldError(field) {
        field.classList.remove('error');
    }

    /**
     * Update submit button state based on form validity
     */
    function updateSubmitButtonState() {
        const isFormValid = isFormCompletelyValid();
        submitBtn.disabled = !isFormValid;
        submitBtn.classList.toggle('disabled', !isFormValid);
    }

    /**
     * Check if entire form is valid
     */
    function isFormCompletelyValid() {
        const requiredFields = ['title', 'description', 'location', 'positiveLabel', 'negativeLabel', 'neutralLabel'];

        for (const fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            if (!field) continue;

            const value = field.value.trim();
            if (!value || (fieldId === 'location' && value === 'NONE')) {
                return false;
            }
        }

        return true;
    }

    /**
     * Initialize checkbox validation functionality
     */
    function initCheckboxValidation() {
        const checkboxes = ['confirmCheck1', 'confirmCheck2', 'confirmCheck3', 'confirmCheck4'];

        // Add event listeners to all checkboxes
        checkboxes.forEach(checkboxId => {
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    updateConfirmButtonState();
                    animateCheckbox(checkbox);
                });
            }
        });

        // Initial state
        updateConfirmButtonState();
    }

    /**
     * Update confirm button state based on checkboxes
     */
    function updateConfirmButtonState() {
        const checkboxes = ['confirmCheck1', 'confirmCheck2', 'confirmCheck3', 'confirmCheck4'];
        const allChecked = checkboxes.every(id => {
            const checkbox = document.getElementById(id);
            return checkbox && checkbox.checked;
        });

        confirmBtn.disabled = !allChecked;

        if (allChecked) {
            confirmBtn.classList.remove('disabled');
            confirmBtn.style.animation = 'pulse 0.6s ease-out';
            setTimeout(() => {
                confirmBtn.style.animation = '';
            }, 600);
        } else {
            confirmBtn.classList.add('disabled');
        }
    }

    /**
     * Animate checkbox when checked/unchecked
     */
    function animateCheckbox(checkbox) {
        const customCheckbox = checkbox.closest('.custom-checkbox');
        const checkmark = checkbox.nextElementSibling;

        if (checkbox.checked) {
            // Add success animation
            customCheckbox.style.animation = 'checkboxSuccess 0.4s ease-out';
            checkmark.style.animation = 'checkmarkPop 0.3s ease-out';

            // Add temporary success styling
            customCheckbox.style.background = 'rgba(22, 163, 74, 0.1)';
            customCheckbox.style.borderColor = 'var(--success-green)';

            setTimeout(() => {
                customCheckbox.style.animation = '';
                checkmark.style.animation = '';
                customCheckbox.style.background = '';
                customCheckbox.style.borderColor = '';
            }, 400);
        } else {
            // Add unchecked animation
            customCheckbox.style.animation = 'checkboxUnchecked 0.2s ease-out';
            setTimeout(() => {
                customCheckbox.style.animation = '';
            }, 200);
        }
    }

    /**
     * Initialize modal functionality
     */
    function initModalFunctionality() {
        // Show confirmation modal on submit button click
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();

            if (!isFormCompletelyValid()) {
                showAlert('Моля, попълнете всички задължителни полета.', 'error');
                return;
            }

            updateModalSummary();
            resetCheckboxes();
            showConfirmationModal();
        });

        // Cancel button
        cancelBtn.addEventListener('click', hideConfirmationModal);

        // Confirm button - submit form normally
        confirmBtn.addEventListener('click', () => {
            if (confirmBtn.disabled) {
                showAlert('Моля, потвърдете всички условия преди да продължите.', 'error');
                return;
            }

            hideConfirmationModal();

            // Add loading state
            confirmBtn.classList.add('loading');
            confirmBtn.disabled = true;

            // Show loading message
            showAlert('Създавам събитието...', 'success');

            // Submit form normally (Thymeleaf handles everything)
            setTimeout(() => {
                form.submit();
            }, 800);
        });

        // Close modal on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideConfirmationModal();
            }
        });

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                hideConfirmationModal();
            }
        });

        // Initialize success modal if present
        initSuccessModal();
    }

    /**
     * Reset all checkboxes in modal
     */
    function resetCheckboxes() {
        const checkboxes = ['confirmCheck1', 'confirmCheck2', 'confirmCheck3', 'confirmCheck4'];
        checkboxes.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.checked = false;
            }
        });
        updateConfirmButtonState();
    }

    /**
     * Show confirmation modal
     */
    function showConfirmationModal() {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Trigger animation
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);

        // Focus management - focus on first checkbox
        modal.setAttribute('aria-hidden', 'false');
        const firstCheckbox = document.getElementById('confirmCheck1');
        if (firstCheckbox) {
            setTimeout(() => {
                firstCheckbox.focus();
            }, 350);
        }
    }

    /**
     * Hide confirmation modal
     */
    function hideConfirmationModal() {
        modal.classList.remove('active');

        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);

        // Focus management
        modal.setAttribute('aria-hidden', 'true');
        submitBtn.focus();
    }

    /**
     * Initialize success modal functionality
     */
    function initSuccessModal() {
        const successModal = document.getElementById('successModal');
        const stayHereBtn = document.getElementById('stayHereBtn');

        if (!successModal) return;

        // Show success modal with animation if it exists
        if (successModal.style.display === 'block') {
            document.body.style.overflow = 'hidden';

            // Trigger animation
            setTimeout(() => {
                successModal.style.opacity = '1';
                successModal.style.visibility = 'visible';
                successModal.style.backdropFilter = 'blur(8px)';
            }, 100);

            // Clear form
            clearForm();

            // Auto-focus stay button
            setTimeout(() => {
                if (stayHereBtn) {
                    stayHereBtn.focus();
                }
            }, 600);
        }

        // Stay here button functionality
        if (stayHereBtn) {
            stayHereBtn.addEventListener('click', () => {
                hideSuccessModal();
            });
        }

        // Close on overlay click
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                hideSuccessModal();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && successModal.style.display === 'block') {
                hideSuccessModal();
            }
        });
    }

    /**
     * Hide success modal
     */
    function hideSuccessModal() {
        const successModal = document.getElementById('successModal');
        if (!successModal) return;

        successModal.style.opacity = '0';
        successModal.style.visibility = 'hidden';
        successModal.style.backdropFilter = 'blur(0px)';

        setTimeout(() => {
            successModal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }

    /**
     * Clear form after successful submission
     */
    function clearForm() {
        // Clear text inputs
        ['title', 'description', 'positiveLabel', 'negativeLabel', 'neutralLabel'].forEach(id => {
            const field = document.getElementById(id);
            if (field) {
                field.value = '';
                field.dispatchEvent(new Event('input')); // Update character counters
            }
        });

        // Reset location
        const locationField = document.getElementById('location');
        if (locationField) {
            locationField.value = 'NONE';
        }

        // Clear images
        for (let i = 1; i <= 3; i++) {
            const input = document.getElementById(`image${i}`);
            const preview = document.getElementById(`preview${i}`);
            const uploadArea = document.getElementById(`uploadArea${i}`);
            const removeBtn = document.getElementById(`remove${i}`);

            if (input) input.value = '';
            if (preview) {
                preview.src = '';
                preview.style.display = 'none';
            }
            if (uploadArea) uploadArea.style.display = 'flex';
            if (removeBtn) removeBtn.style.display = 'none';
        }

        // Clear autosave
        localStorage.removeItem('create_event_draft');

        // Reset form validation
        updateSubmitButtonState();

        // Show success message
        showAlert('Формата е изчистена за ново събитие', 'success');
    }

    /**
     * Update modal summary with current form values
     */
    function updateModalSummary() {
        const title = document.getElementById('title').value.trim();
        const location = document.getElementById('location');
        const positiveLabel = document.getElementById('positiveLabel').value.trim();
        const negativeLabel = document.getElementById('negativeLabel').value.trim();
        const neutralLabel = document.getElementById('neutralLabel').value.trim();

        // Update summary values
        document.getElementById('summaryTitle').textContent = title || '-';
        document.getElementById('summaryLocation').textContent =
            location.selectedOptions[0]?.textContent || '-';
        document.getElementById('summaryPositive').textContent = positiveLabel || '-';
        document.getElementById('summaryNegative').textContent = negativeLabel || '-';
        document.getElementById('summaryNeutral').textContent = neutralLabel || '-';
    }

    /**
     * Show alert message
     */
    function showAlert(message, type = 'info') {
        // Create alert system container if it doesn't exist
        let alertSystem = document.querySelector('.alert-system');
        if (!alertSystem) {
            alertSystem = document.createElement('div');
            alertSystem.className = 'alert-system';
            document.body.appendChild(alertSystem);
        }

        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert-toast ${type}`;

        // Create alert content
        const icon = type === 'success'
            ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>'
            : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';

        alert.innerHTML = `
            ${icon}
            <span>${message}</span>
            <button type="button" class="alert-close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
        `;

        // Add close functionality
        const closeBtn = alert.querySelector('.alert-close');
        closeBtn.addEventListener('click', () => {
            removeAlert(alert);
        });

        // Add to container
        alertSystem.appendChild(alert);

        // Trigger animation
        setTimeout(() => {
            alert.classList.add('show');
        }, 10);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                removeAlert(alert);
            }
        }, 5000);
    }

    /**
     * Remove alert with animation
     */
    function removeAlert(alert) {
        alert.classList.remove('show');
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 300);
    }

    /**
     * Handle drag and drop for the entire form
     */
    function initGlobalDragDrop() {
        // Prevent default drag behaviors on document
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Highlight drop area when item is dragged over the page
        ['dragenter', 'dragover'].forEach(eventName => {
            document.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, unhighlight, false);
        });

        function highlight() {
            document.querySelector('.images-grid')?.classList.add('drag-active');
        }

        function unhighlight() {
            document.querySelector('.images-grid')?.classList.remove('drag-active');
        }
    }

    /**
     * Initialize keyboard shortcuts
     */
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to submit form
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (!submitBtn.disabled && isFormCompletelyValid()) {
                    submitBtn.click();
                }
            }

            // Escape to cancel modal
            if (e.key === 'Escape') {
                if (modal.classList.contains('active')) {
                    hideConfirmationModal();
                }
            }

            // Space to toggle checkboxes when focused
            if (e.key === ' ' && e.target.type === 'checkbox') {
                e.preventDefault();
                e.target.click();
            }
        });
    }

    /**
     * Initialize form autosave (optional feature)
     */
    function initAutosave() {
        const STORAGE_KEY = 'create_event_draft';
        let saveTimeout;

        // Load saved data
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                Object.keys(data).forEach(key => {
                    const field = document.getElementById(key);
                    if (field && field.type !== 'file') {
                        field.value = data[key];
                        // Trigger events to update counters
                        field.dispatchEvent(new Event('input'));
                    }
                });

                showAlert('Възстановен е запазен черновик.', 'info');
            } catch (error) {
                console.error('Error loading autosave data:', error);
            }
        }

        // Save data on form changes
        function saveData() {
            const data = {};
            ['title', 'description', 'location', 'positiveLabel', 'negativeLabel', 'neutralLabel'].forEach(id => {
                const field = document.getElementById(id);
                if (field) {
                    data[id] = field.value;
                }
            });

            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }

        // Debounced save
        function debouncedSave() {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveData, 1000);
        }

        // Add save listeners
        form.addEventListener('input', debouncedSave);
        form.addEventListener('change', debouncedSave);

        // Clear autosave on successful submission
        confirmBtn.addEventListener('click', () => {
            localStorage.removeItem(STORAGE_KEY);
        });
    }

    /**
     * Initialize smooth scrolling to errors
     */
    function scrollToFirstError() {
        const firstError = document.querySelector('.form-control.error');
        if (firstError) {
            firstError.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            firstError.focus();
        }
    }

    /**
     * Enhanced form validation with error messages
     */
    function validateFormWithMessages() {
        const fields = [
            { id: 'title', name: 'Заглавие', required: true, maxLength: 150 },
            { id: 'description', name: 'Описание', required: true, maxLength: 1000 },
            { id: 'location', name: 'Локация', required: true },
            { id: 'positiveLabel', name: 'Положителен вот', required: true, maxLength: 80 },
            { id: 'negativeLabel', name: 'Отрицателен вот', required: true, maxLength: 80 },
            { id: 'neutralLabel', name: 'Неутрален вот', required: true, maxLength: 80 }
        ];

        let isValid = true;
        let firstErrorField = null;

        fields.forEach(fieldConfig => {
            const field = document.getElementById(fieldConfig.id);
            if (!field) return;

            const value = field.value.trim();
            let fieldValid = true;
            let errorMessage = '';

            // Required validation
            if (fieldConfig.required && !value) {
                fieldValid = false;
                errorMessage = `${fieldConfig.name} е задължително поле.`;
            }

            // Location specific validation
            if (fieldConfig.id === 'location' && value === 'NONE') {
                fieldValid = false;
                errorMessage = 'Моля, изберете локация.';
            }

            // Length validation
            if (fieldConfig.maxLength && value.length > fieldConfig.maxLength) {
                fieldValid = false;
                errorMessage = `${fieldConfig.name} може да съдържа максимум ${fieldConfig.maxLength} символа.`;
            }

            // Update field state
            field.classList.toggle('error', !fieldValid);

            if (!fieldValid) {
                isValid = false;
                if (!firstErrorField) {
                    firstErrorField = field;
                }

                // Show error message
                let errorElement = field.parentNode.querySelector('.error-message');
                if (!errorElement) {
                    errorElement = document.createElement('div');
                    errorElement.className = 'error-message';
                    field.parentNode.appendChild(errorElement);
                }
                errorElement.textContent = errorMessage;
                errorElement.style.display = 'block';
            } else {
                // Clear error message
                const errorElement = field.parentNode.querySelector('.error-message');
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
            }
        });

        if (!isValid && firstErrorField) {
            scrollToFirstError();
        }

        return isValid;
    }

    // Initialize all functionality
    initGlobalDragDrop();
    initKeyboardShortcuts();
    initAutosave();

    // Update submit button to use enhanced validation
    submitBtn.addEventListener('click', (e) => {
        e.preventDefault();

        if (!validateFormWithMessages()) {
            showAlert('Моля, поправете грешките във формата.', 'error');
            return;
        }

        updateModalSummary();
        resetCheckboxes();
        showConfirmationModal();
    });

    // Initialize alert dismissal for existing alerts
    document.querySelectorAll('.alert .alert-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const alert = e.target.closest('.alert');
            if (alert) {
                alert.style.opacity = '0';
                alert.style.transform = 'translateY(-20px)';
                setTimeout(() => {
                    alert.remove();
                }, 300);
            }
        });
    });

    // Add CSS animations for checkboxes if not already present
    if (!document.querySelector('#checkbox-animations')) {
        const style = document.createElement('style');
        style.id = 'checkbox-animations';
        style.textContent = `
            @keyframes checkboxSuccess {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            @keyframes checkboxUnchecked {
                0% { transform: scale(1); }
                50% { transform: scale(0.95); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }

    console.log('Create Simple Event form with checkboxes initialized successfully');
});