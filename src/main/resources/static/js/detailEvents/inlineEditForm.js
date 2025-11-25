// Inline Edit Form Handler for Events
document.addEventListener('DOMContentLoaded', function() {
    initializeEditForms();
});

/**
 * Toggle edit form visibility
 */
function toggleEditForm(eventType) {
    const formId = `editForm${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`;
    const form = document.getElementById(formId);
    
    if (!form) return;
    
    const isVisible = form.style.display !== 'none';
    
    if (isVisible) {
        form.style.display = 'none';
        form.style.opacity = '0';
    } else {
        form.style.display = 'block';
        form.style.opacity = '0';
        setTimeout(() => {
            form.style.transition = 'opacity 0.3s ease';
            form.style.opacity = '1';
        }, 10);
        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Handle image preview for edit forms
 */
function handleImagePreview(input, previewId, uploadAreaId) {
    const file = input.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Моля, изберете валиден image файл.');
        input.value = '';
        return;
    }
    
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        alert('Файлът е твърде голям. Максимален размер: 5MB.');
        input.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById(previewId);
        const uploadArea = document.getElementById(uploadAreaId);
        const removeBtn = input.nextElementSibling;
        
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        if (uploadArea) {
            uploadArea.style.display = 'none';
        }
        if (removeBtn) {
            removeBtn.style.display = 'flex';
        }
        
        // Add animation
        if (preview) {
            preview.style.opacity = '0';
            preview.style.transform = 'scale(0.8)';
            setTimeout(() => {
                preview.style.transition = 'all 0.3s ease';
                preview.style.opacity = '1';
                preview.style.transform = 'scale(1)';
            }, 10);
        }
    };
    reader.readAsDataURL(file);
}

/**
 * Remove image preview
 */
function removeImagePreview(index) {
    const preview = document.getElementById(`previewEdit${index}`);
    const uploadArea = document.getElementById(`uploadAreaEdit${index}`);
    const input = document.getElementById(`editImage${index}`);
    const removeBtn = document.getElementById(`removeEdit${index}`);
    
    if (preview) preview.style.display = 'none';
    if (uploadArea) uploadArea.style.display = 'flex';
    if (input) input.value = '';
    if (removeBtn) removeBtn.style.display = 'none';
}

function removeImagePreviewReferendum(index) {
    const preview = document.getElementById(`previewEditReferendum${index}`);
    const uploadArea = document.getElementById(`uploadAreaEditReferendum${index}`);
    const input = document.getElementById(`editReferendumImage${index}`);
    const removeBtn = document.getElementById(`removeEditReferendum${index}`);
    
    if (preview) preview.style.display = 'none';
    if (uploadArea) uploadArea.style.display = 'flex';
    if (input) input.value = '';
    if (removeBtn) removeBtn.style.display = 'none';
}

function removeImagePreviewMultiPoll(index) {
    const preview = document.getElementById(`previewEditMultiPoll${index}`);
    const uploadArea = document.getElementById(`uploadAreaEditMultiPoll${index}`);
    const input = document.getElementById(`editMultiPollImage${index}`);
    const removeBtn = document.getElementById(`removeEditMultiPoll${index}`);
    
    if (preview) preview.style.display = 'none';
    if (uploadArea) uploadArea.style.display = 'flex';
    if (input) input.value = '';
    if (removeBtn) removeBtn.style.display = 'none';
}

/**
 * Remove existing image
 */
function removeExistingImage(index, eventType) {
    if (!confirm('Сигурни ли сте, че искате да премахнете тази снимка?')) {
        return;
    }
    
    const form = document.getElementById(`editForm${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`);
    if (!form) return;
    
    const imageItem = form.querySelector(`[onclick*="removeExistingImage(${index}"]`)?.closest('.image-edit-item');
    if (imageItem) {
        // Add hidden input to mark image for deletion
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = `deleteImage${index}`;
        hiddenInput.value = 'true';
        form.appendChild(hiddenInput);
        
        // Hide the image item
        imageItem.style.display = 'none';
    }
}

/**
 * Add option for Referendum
 */
function addReferendumOption() {
    const container = document.getElementById('referendumOptionsContainer');
    if (!container) return;
    
    const optionCount = container.querySelectorAll('.option-input-group').length;
    const newOption = document.createElement('div');
    newOption.className = 'option-input-group';
    newOption.innerHTML = `
        <input type="text" name="options" class="form-control option-input" placeholder="Нова опция" required>
        <button type="button" class="remove-option-btn" onclick="removeOption(this)">
            <i class="bi bi-trash"></i>
        </button>
    `;
    container.appendChild(newOption);
}

/**
 * Add option for MultiPoll
 */
function addMultiPollOption() {
    const container = document.getElementById('multiPollOptionsContainer');
    if (!container) return;
    
    const optionCount = container.querySelectorAll('.option-input-group').length;
    const newOption = document.createElement('div');
    newOption.className = 'option-input-group';
    newOption.innerHTML = `
        <input type="text" name="options" class="form-control option-input" placeholder="Нова опция" required>
        <button type="button" class="remove-option-btn" onclick="removeOption(this)">
            <i class="bi bi-trash"></i>
        </button>
    `;
    container.appendChild(newOption);
}

/**
 * Remove option
 */
function removeOption(button) {
    if (!confirm('Сигурни ли сте, че искате да премахнете тази опция?')) {
        return;
    }
    
    const optionGroup = button.closest('.option-input-group');
    if (optionGroup) {
        optionGroup.remove();
    }
}

/**
 * Initialize edit forms
 */
function initializeEditForms() {
    // Add form submit handlers
    const forms = ['editSimpleEventForm', 'editReferendumForm', 'editMultiPollForm'];
    
    forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', function(e) {
                // Show loading state
                const submitBtn = form.querySelector('.btn-submit-edit');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Запазване...';
                }
            });
        }
    });
}

