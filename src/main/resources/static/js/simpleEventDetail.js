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
                selectedOptionText.style.background = 'linear-gradient(135deg, var(--error-red), #ef4444)';
            } else if (selectedVote === '3') {
                selectedOptionText.style.background = 'linear-gradient(135deg, var(--neutral-gray), #6b7280)';
            }
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
            selectedVote = null;
            selectedVoteText = '';
        });

        // Confirm vote - submit form
        confirmBtn.addEventListener('click', () => {
            if (!selectedVote) return;

            // Show loading state
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Гласуване...
            `;

            // Set the vote value and submit
            const selectedVoteInput = document.getElementById('selectedVoteValue');
            if (selectedVoteInput) {
                selectedVoteInput.value = selectedVote;
            }

            // Submit the form after short delay
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
    const cards = document.querySelectorAll('.description-card, .gallery-card, .voting-card, .voting-actions-card, .navigation-card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Animate vote bars
    animateVoteBars();

    // Add enhanced hover effects
    enhanceInteractiveElements();
}

/**
 * Animate voting result bars
 */
function animateVoteBars() {
    const voteBars = document.querySelectorAll('.bar');

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
 * Enhanced interactions for elements
 */
function enhanceInteractiveElements() {
    // Enhanced gallery image hover
    const galleryImages = document.querySelectorAll('.gallery-img');
    galleryImages.forEach(img => {
        img.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
            this.style.zIndex = '10';
        });

        img.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.zIndex = '';
        });
    });

    // Creator avatar enhanced effect
    const creatorLink = document.querySelector('.creator-link');
    if (creatorLink) {
        creatorLink.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(4px)';
            const avatar = this.querySelector('.creator-avatar');
            if (avatar) {
                avatar.style.transform = 'scale(1.05) rotate(2deg)';
            }
        });

        creatorLink.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
            const avatar = this.querySelector('.creator-avatar');
            if (avatar) {
                avatar.style.transform = 'scale(1) rotate(0deg)';
            }
        });
    }

    // Back button enhanced effect
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(-4px)';
            const svg = this.querySelector('svg');
            if (svg) {
                svg.style.transform = 'translateX(-2px)';
            }
        });

        backBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
            const svg = this.querySelector('svg');
            if (svg) {
                svg.style.transform = 'translateX(0)';
            }
        });
    }
}

/**
 * Create ripple effect for vote buttons
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
        background: rgba(255, 255, 255, 0.3);
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

// Initialize enhancements after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancements);
} else {
    initializeEnhancements();
}

// Export functions for potential external use
window.SimpleEventDetail = {
    showNotification,
    debounce
};

console.log('Simple Event Detail JavaScript loaded successfully');