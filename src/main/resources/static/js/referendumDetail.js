/**
 * Referendum Detail View JavaScript
 * Adapted from Simple Event Detail for referendum-specific functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeReferendumDetail();
});

function initializeReferendumDetail() {
    // Initialize all components
    initializeGalleryModal();
    initializeVotingForm();
    initializeAnimations();

    console.log('Referendum detail view initialized successfully');
}

/**
 * Gallery Modal Functionality
 */
function initializeGalleryModal() {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalImageFrame = document.querySelector('.modal-image-frame');
    const closeBtn = document.getElementById('closeModal');
    const prevBtn = document.getElementById('prevImage');
    const nextBtn = document.getElementById('nextImage');
    const currentImageSpan = document.getElementById('currentImage');
    const totalImagesSpan = document.getElementById('totalImages');

    const galleryImages = Array.from(document.querySelectorAll('.gallery-img'));
    let currentImageIndex = 0;
    let isModalOpen = false;

    if (!modal || galleryImages.length === 0) {
        return; // No modal or images found
    }

    // Set total images count
    totalImagesSpan.textContent = galleryImages.length;

    // Open modal when clicking on gallery image
    galleryImages.forEach((img, index) => {
        img.addEventListener('click', () => {
            openModal(index);
        });
    });

    // Close modal
    closeBtn.addEventListener('click', closeModal);

    // Close modal when clicking overlay
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-overlay')) {
            closeModal();
        }
    });

    // Navigation buttons
    prevBtn.addEventListener('click', () => navigateImage(-1));
    nextBtn.addEventListener('click', () => navigateImage(1));

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!isModalOpen) return;

        switch(e.key) {
            case 'Escape':
                closeModal();
                break;
            case 'ArrowLeft':
                navigateImage(-1);
                break;
            case 'ArrowRight':
                navigateImage(1);
                break;
        }
    });

    // Touch/swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    modal.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    modal.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                navigateImage(1); // Swipe left - next image
            } else {
                navigateImage(-1); // Swipe right - previous image
            }
        }
    }

    function openModal(index) {
        currentImageIndex = index;
        isModalOpen = true;

        // Show modal
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Trigger animations
        requestAnimationFrame(() => {
            modal.classList.add('active');
            setTimeout(() => {
                modal.classList.add('show-hint');
            }, 1000);
        });

        updateModalImage();
        updateNavigationButtons();
    }

    function closeModal() {
        isModalOpen = false;
        modal.classList.remove('active', 'show-hint');
        document.body.style.overflow = '';

        setTimeout(() => {
            modal.style.display = 'none';
        }, 400);
    }

    function navigateImage(direction) {
        const newIndex = currentImageIndex + direction;

        if (newIndex >= 0 && newIndex < galleryImages.length) {
            currentImageIndex = newIndex;
            updateModalImage();
            updateNavigationButtons();
        }
    }

    function updateModalImage() {
        const imgSrc = galleryImages[currentImageIndex].src;

        // Add loading state
        modalImageFrame.classList.remove('loaded');
        modalImage.classList.remove('loaded');

        // Create new image to preload
        const newImg = new Image();
        newImg.onload = () => {
            modalImage.src = imgSrc;
            modalImageFrame.classList.add('loaded');

            // Small delay for smooth transition
            setTimeout(() => {
                modalImage.classList.add('loaded');
            }, 100);
        };
        newImg.src = imgSrc;

        // Update counter
        currentImageSpan.textContent = currentImageIndex + 1;
    }

    function updateNavigationButtons() {
        prevBtn.disabled = currentImageIndex === 0;
        nextBtn.disabled = currentImageIndex === galleryImages.length - 1;
    }
}

/**
 * Voting Form Functionality
 */
function initializeVotingForm() {
    const voteForm = document.getElementById('referendumVoteForm');
    const checkboxes = document.querySelectorAll('.vote-checkbox');
    const submitBtn = document.getElementById('voteSubmitBtn');

    if (!voteForm || !submitBtn) {
        return; // No voting form found
    }

    // Ensure only one checkbox can be selected (radio button behavior)
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                // Uncheck all other checkboxes
                checkboxes.forEach(cb => {
                    if (cb !== this) {
                        cb.checked = false;
                    }
                });

                // Enable submit button
                updateSubmitButton();
            }
        });
    });

    // Handle vote button click - show confirmation modal
    submitBtn.addEventListener('click', function(e) {
        e.preventDefault();

        if (!validateSingleVote()) {
            showValidationError('Моля изберете точно една опция.');
            return;
        }

        showVoteConfirmationModal();
    });

    // Initialize vote confirmation modal
    initializeVoteConfirmationModal();

    function validateSingleVote() {
        const checkedBoxes = document.querySelectorAll('.vote-checkbox:checked');
        return checkedBoxes.length === 1;
    }

    function updateSubmitButton() {
        if (submitBtn) {
            const hasSelection = document.querySelector('.vote-checkbox:checked');
            submitBtn.disabled = !hasSelection;
            submitBtn.style.opacity = hasSelection ? '1' : '0.6';
        }
    }

    function showValidationError(message) {
        // Create or update error message
        let errorDiv = document.querySelector('.validation-error');

        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'validation-error message-card message-error';
            errorDiv.style.marginTop = '1rem';
            voteForm.appendChild(errorDiv);
        }

        errorDiv.textContent = message;
        errorDiv.style.display = 'block';

        // Animate in
        errorDiv.style.opacity = '0';
        errorDiv.style.transform = 'translateY(-10px)';

        requestAnimationFrame(() => {
            errorDiv.style.transition = 'all 0.3s ease';
            errorDiv.style.opacity = '1';
            errorDiv.style.transform = 'translateY(0)';
        });

        // Auto hide after 5 seconds
        setTimeout(() => {
            if (errorDiv) {
                errorDiv.style.opacity = '0';
                setTimeout(() => {
                    if (errorDiv && errorDiv.parentNode) {
                        errorDiv.parentNode.removeChild(errorDiv);
                    }
                }, 300);
            }
        }, 5000);
    }

    function showVoteConfirmationModal() {
        const selectedCheckbox = document.querySelector('.vote-checkbox:checked');
        if (!selectedCheckbox) return;

        const selectedOption = selectedCheckbox.nextElementSibling.querySelector('.option-text').textContent;

        // Update modal content
        const selectedOptionText = document.getElementById('selectedOptionText');
        if (selectedOptionText) {
            selectedOptionText.textContent = selectedOption;
        }

        // Show modal
        const modal = document.getElementById('voteConfirmModal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';

            requestAnimationFrame(() => {
                modal.classList.add('active');
            });
        }
    }

    function initializeVoteConfirmationModal() {
        const modal = document.getElementById('voteConfirmModal');
        const cancelBtn = document.getElementById('cancelVote');
        const confirmBtn = document.getElementById('confirmVote');

        if (!modal || !cancelBtn || !confirmBtn) return;

        // Cancel vote
        cancelBtn.addEventListener('click', () => {
            closeVoteConfirmationModal();
        });

        // Confirm vote - submit form
        confirmBtn.addEventListener('click', () => {
            // Show loading state
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    <path d="M9 12l2 2 4-4"/>
                </svg>
                Гласуване...
            `;

            // Submit the form
            setTimeout(() => {
                voteForm.submit();
            }, 500);
        });

        // Close modal when clicking overlay
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('modal-overlay')) {
                closeVoteConfirmationModal();
            }
        });

        // Close modal with ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeVoteConfirmationModal();
            }
        });

        function closeVoteConfirmationModal() {
            modal.classList.remove('active');
            document.body.style.overflow = '';

            setTimeout(() => {
                modal.style.display = 'none';
                // Reset confirm button
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 13l4 4L19 7"/>
                    </svg>
                    Потвърждавам гласа си
                `;
            }, 300);
        }
    }

    // Initialize submit button state
    updateSubmitButton();
}

/**
 * Smooth Animations and Interactions
 */
function initializeAnimations() {
    // Animate cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all cards
    const cards = document.querySelectorAll('.description-card, .gallery-card, .voting-card, .voting-actions-card, .navigation-card, .message-card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Animate vote bars
    animateVoteBars();

    // Add hover effects to vote options
    enhanceVoteOptions();
}

/**
 * Animate voting result bars
 */
function animateVoteBars() {
    const voteBars = document.querySelectorAll('.bar-option');

    // Reset bars to 0 width initially
    voteBars.forEach(bar => {
        const targetWidth = bar.style.width;
        bar.style.width = '0%';
        bar.dataset.targetWidth = targetWidth;
    });

    // Animate bars after a short delay
    setTimeout(() => {
        voteBars.forEach((bar, index) => {
            setTimeout(() => {
                bar.style.width = bar.dataset.targetWidth;
            }, index * 200); // Stagger animation
        });
    }, 500);
}

/**
 * Enhanced interactions for vote options
 */
function enhanceVoteOptions() {
    const voteOptions = document.querySelectorAll('.vote-option');

    voteOptions.forEach(option => {
        const label = option.querySelector('.vote-option-label');
        const checkbox = option.querySelector('.vote-checkbox');

        if (!label || !checkbox) return;

        // Add ripple effect on click
        label.addEventListener('click', function(e) {
            createRippleEffect(this, e);
        });

        // Enhanced keyboard navigation
        checkbox.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.checked = !this.checked;
                this.dispatchEvent(new Event('change'));
            }
        });
    });
}

/**
 * Create ripple effect for vote options
 */
function createRippleEffect(element, event) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(30, 61, 50, 0.2);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
        z-index: 1;
    `;

    // Add ripple keyframe if not exists
    if (!document.querySelector('#ripple-styles')) {
        const style = document.createElement('style');
        style.id = 'ripple-styles';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    // Remove ripple after animation
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 600);
}

/**
 * Utility Functions
 */

/**
 * Debounce function to limit rapid function calls
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

/**
 * Smooth scroll to element
 */
function smoothScrollTo(element, offset = 0) {
    if (!element) return;

    const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;

    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
}

/**
 * Check if element is in viewport
 */
function isInViewport(element, threshold = 0) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    return (
        rect.top >= -threshold &&
        rect.left >= -threshold &&
        rect.bottom <= windowHeight + threshold &&
        rect.right <= windowWidth + threshold
    );
}

/**
 * Format numbers with proper Bulgarian formatting
 */
function formatNumber(num) {
    return new Intl.NumberFormat('bg-BG').format(num);
}

/**
 * Enhanced Error Handling
 */
window.addEventListener('error', function(e) {
    console.error('Referendum Detail Error:', e.error);

    // Show user-friendly error message
    showNotification('Възникна грешка. Моля опитайте отново.', 'error');
});

/**
 * Show notification to user
 */
function showNotification(message, type = 'info', duration = 5000) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? 'var(--error-red)' : type === 'success' ? 'var(--success-green)' : 'var(--blue-accent)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        font-weight: 500;
        max-width: 300px;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
    });

    // Auto remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}

/**
 * Performance Optimizations
 */

// Lazy load images
function initializeLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }
}

// Optimize scroll performance
const optimizedScrollHandler = debounce(() => {
    // Handle scroll-based animations or updates here
    const scrollTop = window.pageYOffset;
    const documentHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    const scrollPercentage = scrollTop / (documentHeight - windowHeight);

    // Update any scroll-based elements
    document.documentElement.style.setProperty('--scroll-progress', scrollPercentage);
}, 16); // ~60fps

window.addEventListener('scroll', optimizedScrollHandler, { passive: true });

/**
 * Accessibility Enhancements
 */
function enhanceAccessibility() {
    // Add skip links
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Към основното съдържание';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: var(--primary-green);
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 1000;
        transition: top 0.3s;
    `;

    skipLink.addEventListener('focus', () => {
        skipLink.style.top = '6px';
    });

    skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
    });

    document.body.prepend(skipLink);

    // Enhance keyboard navigation
    const focusableElements = document.querySelectorAll(
        'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach(element => {
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && element.tagName === 'A') {
                element.click();
            }
        });
    });

    // Add ARIA labels where needed
    const voteButtons = document.querySelectorAll('.vote-option-label');
    voteButtons.forEach((button, index) => {
        if (!button.getAttribute('aria-label')) {
            const optionText = button.querySelector('.option-text')?.textContent;
            button.setAttribute('aria-label', `Избери опция: ${optionText}`);
        }
    });
}

/**
 * Progressive Enhancement
 */
function progressiveEnhancement() {
    // Check for modern browser features
    const hasIntersectionObserver = 'IntersectionObserver' in window;
    const hasCustomProperties = CSS.supports('color', 'var(--test)');
    const hasGridSupport = CSS.supports('display', 'grid');

    if (!hasGridSupport) {
        // Fallback for older browsers
        document.body.classList.add('no-grid');
    }

    if (!hasCustomProperties) {
        // Fallback for CSS custom properties
        document.body.classList.add('no-custom-properties');
    }

    // Feature detection for touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.body.classList.add('touch-device');
    }

    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.body.classList.add('reduced-motion');
    }
}

// ====== DROPDOWN MENU FUNCTIONALITY ======

/**
 * Initialize dropdown menu functionality
 */
function initializeDropdownMenu() {
    // Find all options buttons and dropdowns
    const optionsButtons = document.querySelectorAll('.options-btn');
    const dropdowns = document.querySelectorAll('.options-dropdown');

    optionsButtons.forEach((button, index) => {
        const dropdown = dropdowns[index];
        if (!dropdown) return;

        // Toggle dropdown on button click
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(button, dropdown);
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!button.contains(e.target) && !dropdown.contains(e.target)) {
                closeDropdown(button, dropdown);
            }
        });

        // Close dropdown on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeDropdown(button, dropdown);
            }
        });
    });
}

/**
 * Toggle dropdown open/close
 */
function toggleDropdown(button, dropdown) {
    const isOpen = dropdown.classList.contains('show');

    // Close all other dropdowns first
    closeAllDropdowns();

    if (!isOpen) {
        openDropdown(button, dropdown);
    }
}

/**
 * Open dropdown
 */
function openDropdown(button, dropdown) {
    button.classList.add('active');
    dropdown.classList.add('show');
    dropdown.style.display = 'block';
}

/**
 * Close specific dropdown
 */
function closeDropdown(button, dropdown) {
    button.classList.remove('active');
    dropdown.classList.remove('show');

    // Wait for animation to complete before hiding
    setTimeout(() => {
        if (!dropdown.classList.contains('show')) {
            dropdown.style.display = 'none';
        }
    }, 300);
}

/**
 * Close all dropdowns
 */
function closeAllDropdowns() {
    const buttons = document.querySelectorAll('.options-btn');
    const dropdowns = document.querySelectorAll('.options-dropdown');

    buttons.forEach(button => button.classList.remove('active'));
    dropdowns.forEach(dropdown => {
        dropdown.classList.remove('show');
        setTimeout(() => {
            if (!dropdown.classList.contains('show')) {
                dropdown.style.display = 'none';
            }
        }, 300);
    });
}

// ====== INITIALIZE ON DOM READY ======
document.addEventListener('DOMContentLoaded', function() {
    initializeDropdownMenu();
});


/**
 * Initialize all enhancements
 */
function initializeEnhancements() {
    initializeLazyLoading();
    enhanceAccessibility();
    progressiveEnhancement();
}

// Initialize enhancements after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancements);
} else {
    initializeEnhancements();
}

// Export functions for potential external use
window.ReferendumDetail = {
    showNotification,
    smoothScrollTo,
    formatNumber,
    debounce
};