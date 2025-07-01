/**
 * Simple Event Detail View JavaScript
 * Enhanced with vote confirmation modal
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeSimpleEventDetail();
});

function initializeSimpleEventDetail() {
    // Initialize all components
    initializeGalleryModal();
    initializeVotingForm();
    initializeAnimations();

    console.log('Simple Event detail view initialized successfully');
}

/**
 * Gallery Modal Functionality
 */
function initializeGalleryModal() {
    const modal = document.getElementById('imageModal');
    if (!modal) return;

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

    if (galleryImages.length === 0) {
        return; // No images found
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

    function openModal(index) {
        currentImageIndex = index;
        isModalOpen = true;
        modal.style.display = 'flex';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        updateModalImage();
    }

    function closeModal() {
        isModalOpen = false;
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = '';
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
 * Simple Event Voting Form with Confirmation Modal
 */
function initializeVotingForm() {
    const voteForm = document.getElementById('simpleVoteForm');
    const voteButtons = document.querySelectorAll('.vote-btn[data-vote]');

    if (!voteForm || voteButtons.length === 0) {
        return; // No voting form found
    }

    let selectedVote = null;
    let selectedVoteText = '';

    // Handle vote button clicks
    voteButtons.forEach(button => {
        button.addEventListener('click', function() {
            selectedVote = this.getAttribute('data-vote');
            selectedVoteText = this.getAttribute('data-vote-text') || this.textContent;

            showVoteConfirmationModal();
        });

        // Add hover effects
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });

        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });

        // Add ripple effect
        button.addEventListener('click', function(e) {
            createRippleEffect(this, e);
        });
    });

    // Initialize vote confirmation modal
    initializeVoteConfirmationModal();

    function showVoteConfirmationModal() {
        if (!selectedVote || !selectedVoteText) return;

        // Update modal content
        const selectedOptionText = document.getElementById('selectedOptionText');
        if (selectedOptionText) {
            selectedOptionText.textContent = selectedVoteText;

            // Add appropriate styling based on vote type
            selectedOptionText.className = 'option-badge';
            if (selectedVote === '1') {
                selectedOptionText.style.background = 'linear-gradient(135deg, var(--success-green), var(--accent-green))';
            } else if (selectedVote === '2') {
                selectedOptionText.style.background = 'linear-gradient(135deg, var(--error-red), #c0392b)';
            } else {
                selectedOptionText.style.background = 'linear-gradient(135deg, var(--neutral-gray), #475569)';
            }
        }

        // Update selected vote text in modal
        const selectedVoteModalText = document.getElementById('selectedVoteText');
        if (selectedVoteModalText) {
            selectedVoteModalText.textContent = selectedVoteText;
        }

        // Show confirmation modal
        const confirmModal = document.getElementById('voteConfirmModal');
        if (confirmModal) {
            confirmModal.style.display = 'flex';
            confirmModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
}

/**
 * Vote Confirmation Modal
 */
function initializeVoteConfirmationModal() {
    const confirmModal = document.getElementById('voteConfirmModal');
    const cancelBtn = document.getElementById('cancelVote');
    const confirmBtn = document.getElementById('confirmVote');

    if (!confirmModal) return;

    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeVoteModal);
    }

    // Confirm button
    if (confirmBtn) {
        confirmBtn.addEventListener('click', handleVoteSubmission);
    }

    // Close on backdrop click
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
            closeVoteModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && confirmModal.classList.contains('active')) {
            closeVoteModal();
        }
    });

    function closeVoteModal() {
        confirmModal.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => {
            confirmModal.style.display = 'none';
        }, 200);
    }

    function handleVoteSubmission() {
        // Implementation would go here
        console.log('Vote submitted');
        closeVoteModal();
    }
}

/**
 * Animation System
 */
function initializeAnimations() {
    // Smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';

    // Add intersection observer for fade-in animations
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

    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.description-card, .gallery-card, .voting-card, .voting-actions-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

/**
 * Utility Functions
 */
function createRippleEffect(button, event) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    `;

    // Add ripple animation CSS if not already added
    if (!document.querySelector('#ripple-animation')) {
        const style = document.createElement('style');
        style.id = 'ripple-animation';
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

    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 600);
}

/**
 * Debounce utility
 */
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

/**
 * Show notification utility
 */
function showNotification(message, type = 'info', duration = 4000) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? 'var(--error-red)' : type === 'success' ? 'var(--success-green)' : 'var(--accent-green)'};
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
 * Enhanced Error Handling
 */
window.addEventListener('error', function(e) {
    console.error('Simple Event Detail Error:', e.error);
    showNotification('Възникна грешка. Моля опитайте отново.', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled Promise Rejection:', e.reason);
    showNotification('Възникна грешка при обработка на заявката.', 'error');
});

/**
 * Performance Optimizations
 */

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

    // Add ARIA labels where needed
    const voteButtons = document.querySelectorAll('.vote-btn[data-vote]');
    voteButtons.forEach((button, index) => {
        if (!button.getAttribute('aria-label')) {
            const voteText = button.textContent;
            button.setAttribute('aria-label', `Гласувай с: ${voteText}`);
        }
    });
}

/**
 * Initialize all enhancements
 */
function initializeEnhancements() {
    enhanceAccessibility();

    // Feature detection for touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.body.classList.add('touch-device');
    }

    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.body.classList.add('reduced-motion');
    }
}

// Initialize enhancements
initializeEnhancements();

// Export functions for potential external use
window.SimpleEventDetail = {
    showNotification,
    debounce
};

console.log('Simple Event Detail JavaScript loaded successfully');