/**
 * MultiPoll Detail View JavaScript
 * Adapted for multi-selection voting (1-3 options)
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeMultiPollDetail();
});

function initializeMultiPollDetail() {
    // Initialize all components
    initializeGalleryModal();
    initializeVotingForm();
    initializeAnimations();
    initializeEnhancements();

    console.log('MultiPoll detail view initialized successfully');
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
 * Multi-Selection Voting Form Functionality
 */
function initializeVotingForm() {
    const voteForm = document.getElementById('multiPollVoteForm');
    const checkboxes = document.querySelectorAll('.vote-checkbox');
    const submitBtn = document.getElementById('voteSubmitBtn');
    const selectedCountSpan = document.getElementById('selectedCount');

    if (!voteForm || !submitBtn) {
        return; // No voting form found
    }

    const MAX_SELECTIONS = 3;
    const MIN_SELECTIONS = 1;

    // Handle checkbox changes
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateSelectionState();
            updateSubmitButton();
        });
    });

    // Handle vote button click - show confirmation modal
    submitBtn.addEventListener('click', function(e) {
        e.preventDefault();

        const selectedCount = getSelectedCount();

        if (selectedCount < MIN_SELECTIONS) {
            showValidationError(`Моля изберете поне ${MIN_SELECTIONS} опция.`);
            return;
        }

        if (selectedCount > MAX_SELECTIONS) {
            showValidationError(`Моля изберете максимум ${MAX_SELECTIONS} опции.`);
            return;
        }

        showVoteConfirmationModal();
    });

    // Initialize vote confirmation modal
    initializeVoteConfirmationModal();

    function getSelectedCount() {
        return document.querySelectorAll('.vote-checkbox:checked').length;
    }

    function updateSelectionState() {
        const selectedCount = getSelectedCount();

        // Update counter
        if (selectedCountSpan) {
            selectedCountSpan.textContent = selectedCount;

            // Add visual feedback
            const counter = selectedCountSpan.parentElement;
            if (selectedCount === 0) {
                counter.style.color = 'var(--gray-500)';
            } else if (selectedCount <= MAX_SELECTIONS) {
                counter.style.color = 'var(--multipoll-primary)';
            } else {
                counter.style.color = 'var(--error-red)';
            }
        }

        // Disable other checkboxes if max reached
        if (selectedCount >= MAX_SELECTIONS) {
            checkboxes.forEach(checkbox => {
                if (!checkbox.checked) {
                    checkbox.disabled = true;
                    checkbox.parentElement.style.opacity = '0.5';
                }
            });
        } else {
            // Re-enable all checkboxes
            checkboxes.forEach(checkbox => {
                checkbox.disabled = false;
                checkbox.parentElement.style.opacity = '1';
            });
        }
    }

    function updateSubmitButton() {
        if (submitBtn) {
            const selectedCount = getSelectedCount();
            const isValid = selectedCount >= MIN_SELECTIONS && selectedCount <= MAX_SELECTIONS;

            submitBtn.disabled = !isValid;
            submitBtn.style.opacity = isValid ? '1' : '0.6';
        }
    }

    function showValidationError(message) {
        // Remove existing error
        const existingError = document.querySelector('.validation-error');
        if (existingError) {
            existingError.remove();
        }

        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-error message-card message-error';
        errorDiv.style.marginTop = '1rem';
        errorDiv.textContent = message;

        voteForm.appendChild(errorDiv);

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
            if (errorDiv && errorDiv.parentNode) {
                errorDiv.style.opacity = '0';
                setTimeout(() => {
                    if (errorDiv.parentNode) {
                        errorDiv.parentNode.removeChild(errorDiv);
                    }
                }, 300);
            }
        }, 5000);
    }

    function showVoteConfirmationModal() {
        const selectedCheckboxes = document.querySelectorAll('.vote-checkbox:checked');
        const selectedOptions = Array.from(selectedCheckboxes).map(checkbox =>
            checkbox.nextElementSibling.querySelector('.option-text').textContent
        );

        // Update modal content
        const selectedOptionsDisplay = document.getElementById('selectedOptionsDisplay');
        if (selectedOptionsDisplay) {
            selectedOptionsDisplay.innerHTML = selectedOptions.map(option =>
                `<span class="option-badge">${option}</span>`
            ).join('');
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
                    Потвърждавам гласовете си
                `;
            }, 300);
        }
    }

    // Initialize form state
    updateSelectionState();
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
            if (!checkbox.disabled) {
                createRippleEffect(this, e);
            }
        });

        // Enhanced keyboard navigation
        checkbox.addEventListener('keydown', function(e) {
            if ((e.key === 'Enter' || e.key === ' ') && !this.disabled) {
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
        background: rgba(23, 203, 234, 0.2);
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
            .animate-spin {
                animation: spin 1s linear infinite;
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
        background: ${type === 'error' ? 'var(--error-red)' : type === 'success' ? 'var(--success-green)' : 'var(--multipoll-primary)'};
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
    console.error('MultiPoll Detail Error:', e.error);
    showNotification('Възникна грешка. Моля опитайте отново.', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled Promise Rejection:', e.reason);
    showNotification('Възникна грешка при обработка на заявката.', 'error');
});

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

    // Add role and aria-describedby for selection counter
    const selectionCounter = document.getElementById('selectedCount');
    if (selectionCounter) {
        selectionCounter.setAttribute('aria-live', 'polite');
        selectionCounter.setAttribute('aria-atomic', 'true');
    }
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

/**
 * Form validation helpers
 */
function validateForm() {
    const selectedCount = document.querySelectorAll('.vote-checkbox:checked').length;
    return selectedCount >= 1 && selectedCount <= 3;
}

function resetFormState() {
    const checkboxes = document.querySelectorAll('.vote-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        checkbox.disabled = false;
        checkbox.parentElement.style.opacity = '1';
    });

    const selectedCountSpan = document.getElementById('selectedCount');
    if (selectedCountSpan) {
        selectedCountSpan.textContent = '0';
        selectedCountSpan.parentElement.style.color = 'var(--gray-500)';
    }

    const submitBtn = document.getElementById('voteSubmitBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
    }
}

/**
 * Initialize all enhancements
 */
function initializeEnhancements() {
    initializeLazyLoading();
    enhanceAccessibility();
    progressiveEnhancement();

    // Add custom event listeners for better UX
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Page is hidden, pause any animations
            const animatedElements = document.querySelectorAll('.animate-spin');
            animatedElements.forEach(el => el.style.animationPlayState = 'paused');
        } else {
            // Page is visible, resume animations
            const animatedElements = document.querySelectorAll('.animate-spin');
            animatedElements.forEach(el => el.style.animationPlayState = 'running');
        }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
        // Close any open modals when navigating back
        const openModals = document.querySelectorAll('.premium-modal.active, .vote-confirm-modal.active');
        openModals.forEach(modal => {
            modal.classList.remove('active');
            modal.style.display = 'none';
        });
        document.body.style.overflow = '';
    });
}

// Global error boundary for production debugging
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global Error:', {
        message,
        source,
        lineno,
        colno,
        error
    });

    // Only show user-friendly message in production
    if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        showNotification('Възникна неочаквана грешка. Моля презаредете страницата.', 'error', 8000);
    }

    return false; // Don't prevent default browser error handling
};

// Initialize enhancements after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancements);
} else {
    initializeEnhancements();
}

// Export functions for potential external use and testing
window.MultiPollDetail = {
    showNotification,
    smoothScrollTo,
    formatNumber,
    debounce,
    isInViewport,
    validateForm,
    resetFormState,
    // Debug helpers
    debug: {
        getCurrentSelections: () => document.querySelectorAll('.vote-checkbox:checked').length,
        getFormData: () => {
            const form = document.getElementById('multiPollVoteForm');
            return form ? new FormData(form) : null;
        },
        resetVoting: resetFormState
    }
};

// Development helpers
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    console.log('MultiPoll Detail Debug Mode Enabled');
    console.log('Available debug functions:', Object.keys(window.MultiPollDetail.debug));
}

console.log('MultiPoll Detail JavaScript loaded successfully');