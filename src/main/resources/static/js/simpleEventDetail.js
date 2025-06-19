// Complete Event Detail JavaScript - Optimized and Enhanced
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initializeVoteBars();
    initializeGalleryModal();
    initializeVoteButtons();
    initializeHoverEffects();
    initializeSmoothScrolling();

    console.log('Event Detail Page fully initialized');
});

/**
 * Initialize vote bars animation with smooth counting
 */
function initializeVoteBars() {
    const bars = document.querySelectorAll('.bar');
    const votingCard = document.querySelector('.voting-card');

    if (!votingCard || bars.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Animate each bar with staggered delay
                bars.forEach((bar, index) => {
                    const currentWidth = bar.style.width || bar.getAttribute('data-width') || '0%';
                    const targetWidth = currentWidth;
                    const targetPercent = parseInt(targetWidth.replace('%', '')) || 0;

                    // Reset bar width
                    bar.style.width = '0%';

                    // Set percentage to 0 initially
                    const percentText = bar.querySelector('.bar-percent');
                    if (percentText) {
                        percentText.textContent = '0%';
                    }

                    setTimeout(() => {
                        // Animate bar width
                        bar.style.transition = 'width 2s cubic-bezier(0.4, 0, 0.2, 1)';
                        bar.style.width = targetWidth;

                        // Animate percentage counter
                        if (percentText) {
                            animateCounter(percentText, 0, targetPercent, 2000, '%');
                        }
                    }, index * 300 + 800);
                });

                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    observer.observe(votingCard);
}

/**
 * Premium Gallery Modal - Enhanced with all features
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
    const modalOverlay = document.querySelector('.modal-overlay');

    const images = Array.from(document.querySelectorAll('.gallery-img'));

    if (images.length === 0) return;

    let currentIndex = 0;
    let isOpen = false;
    let isLoading = false;
    let hintTimer = null;

    // Touch support variables
    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 50;

    // Set total images
    if (totalImagesSpan) {
        totalImagesSpan.textContent = images.length;
    }

    // Add click listeners to gallery images
    images.forEach((img, index) => {
        img.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            currentIndex = index;
            openModal();
        });

        // Add cursor pointer
        img.style.cursor = 'pointer';
    });

    function openModal() {
        if (isOpen) return;

        isOpen = true;
        document.body.style.overflow = 'hidden';

        modal.style.display = 'block';

        // Force reflow then add active class for smooth animation
        requestAnimationFrame(() => {
            modal.classList.add('active');
            loadCurrentImage();
            updateCounter();
            updateNavigationButtons();
            showHintAfterDelay();

            // Focus close button for accessibility
            if (closeBtn) closeBtn.focus();
        });
    }

    function closeModal() {
        if (!isOpen) return;

        isOpen = false;
        modal.classList.remove('active', 'show-hint');

        // Clear hint timer
        if (hintTimer) {
            clearTimeout(hintTimer);
            hintTimer = null;
        }

        // Hide modal after animation
        setTimeout(() => {
            if (!isOpen) {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
        }, 400);
    }

    function loadCurrentImage() {
        if (!modalImage || !modalImageFrame || isLoading || !images[currentIndex]) return;

        isLoading = true;

        // Remove loaded state
        modalImage.classList.remove('loaded');
        modalImageFrame.classList.remove('loaded');

        // Preload image
        const img = new Image();
        img.onload = () => {
            modalImage.src = images[currentIndex].src;
            modalImage.alt = images[currentIndex].alt || 'Gallery image';
            isLoading = false;
        };

        img.onerror = () => {
            console.error('Грешка при зареждане на изображение:', images[currentIndex].src);
            modalImage.alt = 'Грешка при зареждане на изображението';
            modalImageFrame.classList.add('loaded');
            isLoading = false;
        };

        img.src = images[currentIndex].src;
    }

    function updateCounter() {
        if (currentImageSpan && totalImagesSpan) {
            // Smooth counter animation
            currentImageSpan.style.transform = 'scale(0.8)';
            currentImageSpan.style.opacity = '0.6';

            setTimeout(() => {
                currentImageSpan.textContent = currentIndex + 1;
                currentImageSpan.style.transform = 'scale(1)';
                currentImageSpan.style.opacity = '1';
            }, 150);
        }
    }

    function updateNavigationButtons() {
        if (!prevBtn || !nextBtn) return;

        const isFirstImage = currentIndex === 0;
        const isLastImage = currentIndex === images.length - 1;
        const isSingleImage = images.length <= 1;

        // Update disabled state
        prevBtn.disabled = isSingleImage || isFirstImage;
        nextBtn.disabled = isSingleImage || isLastImage;

        // Update visual state
        if (isSingleImage) {
            prevBtn.style.opacity = '0.3';
            nextBtn.style.opacity = '0.3';
        } else {
            prevBtn.style.opacity = isFirstImage ? '0.5' : '1';
            nextBtn.style.opacity = isLastImage ? '0.5' : '1';
        }
    }

    function showPrevImage() {
        if (currentIndex > 0 && !isLoading) {
            currentIndex--;
            loadCurrentImage();
            updateCounter();
            updateNavigationButtons();
        }
    }

    function showNextImage() {
        if (currentIndex < images.length - 1 && !isLoading) {
            currentIndex++;
            loadCurrentImage();
            updateCounter();
            updateNavigationButtons();
        }
    }

    function showHintAfterDelay() {
        hintTimer = setTimeout(() => {
            if (isOpen && images.length > 1) {
                modal.classList.add('show-hint');

                // Hide hint after 3 seconds
                setTimeout(() => {
                    modal.classList.remove('show-hint');
                }, 3000);
            }
        }, 2000);
    }

    // Event Listeners
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', showPrevImage);
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', showNextImage);
    }

    // Image load event
    if (modalImage) {
        modalImage.addEventListener('load', () => {
            modalImage.classList.add('loaded');
            modalImageFrame.classList.add('loaded');
        });

        modalImage.addEventListener('dragstart', (e) => e.preventDefault());
    }

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (!isOpen) return;

        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                showPrevImage();
                break;
            case 'ArrowRight':
                e.preventDefault();
                showNextImage();
                break;
            case ' ':
                e.preventDefault();
                showNextImage();
                break;
            case 'Escape':
                e.preventDefault();
                closeModal();
                break;
        }
    });

    // Touch/Swipe support
    if (modalImage) {
        modalImage.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        modalImage.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const swipeDistance = touchStartX - touchEndX;

            if (Math.abs(swipeDistance) > minSwipeDistance) {
                if (swipeDistance > 0) {
                    showNextImage();
                } else {
                    showPrevImage();
                }
            }
        }, { passive: true });
    }

    // Mouse wheel navigation
    modal.addEventListener('wheel', (e) => {
        if (!isOpen) return;

        e.preventDefault();

        if (e.deltaY > 0) {
            showNextImage();
        } else {
            showPrevImage();
        }
    }, { passive: false });

    // Add smooth transitions
    if (currentImageSpan) {
        currentImageSpan.style.transition = 'all 0.2s cubic-bezier(0.23, 1, 0.32, 1)';
    }

    console.log('Premium Gallery modal initialized with', images.length, 'images');
}

/**
 * Enhanced vote buttons functionality
 */
function initializeVoteButtons() {
    const voteButtons = document.querySelectorAll('.vote-btn');
    const voteForm = document.querySelector('.vote-form');

    // Add enhanced ripple effect
    voteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!this.disabled) {
                createRippleEffect(this, e);
            }
        });

        // Add hover sound effect (optional)
        button.addEventListener('mouseenter', function() {
            if (!this.disabled) {
                this.style.transform = 'translateY(-2px)';
            }
        });

        button.addEventListener('mouseleave', function() {
            if (!this.disabled) {
                this.style.transform = 'translateY(0)';
            }
        });
    });

    // Enhanced form submission
    if (voteForm) {
        voteForm.addEventListener('submit', function() {
            const submitButton = document.activeElement;
            const allButtons = this.querySelectorAll('.vote-btn');

            allButtons.forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.7';
                btn.style.cursor = 'not-allowed';

                if (btn === submitButton) {
                    btn.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                            <div class="spinner"></div>
                            <span>Изпраща се...</span>
                        </div>
                    `;
                }
            });

            // Add loading animation
            addLoadingSpinner();
        });
    }
}

/**
 * Enhanced hover effects with performance optimization
 */
function initializeHoverEffects() {
    // Card hover effects with throttling
    const cards = document.querySelectorAll('.description-card, .gallery-card, .voting-card, .voting-actions-card, .navigation-card');

    cards.forEach(card => {
        let hoverTimeout;

        card.addEventListener('mouseenter', function() {
            clearTimeout(hoverTimeout);
            this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            this.style.transform = 'translateY(-4px)';
            this.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
        });

        card.addEventListener('mouseleave', function() {
            hoverTimeout = setTimeout(() => {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '';
            }, 50);
        });
    });

    // Gallery images enhanced hover
    const galleryImages = document.querySelectorAll('.gallery-img');
    galleryImages.forEach(img => {
        img.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            this.style.transform = 'translateY(-8px) scale(1.05)';
            this.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.3)';
            this.style.zIndex = '10';
        });

        img.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '';
            this.style.zIndex = '';
        });
    });

    // Creator avatar enhanced effect
    const creatorLink = document.querySelector('.creator-link');
    if (creatorLink) {
        creatorLink.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            this.style.transform = 'translateX(4px)';

            const avatar = this.querySelector('.creator-avatar');
            if (avatar) {
                avatar.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                avatar.style.transform = 'scale(1.1) rotate(5deg)';
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
 * Initialize smooth scrolling for anchor links
 */
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Create enhanced ripple effect
 */
function createRippleEffect(button, event) {
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.2;
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement('div');
    ripple.className = 'ripple-effect';
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.4);
        transform: scale(0);
        animation: ripple-animation 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
        z-index: 1;
    `;

    // Ensure button has relative positioning
    const originalPosition = getComputedStyle(button).position;
    if (originalPosition === 'static') {
        button.style.position = 'relative';
    }

    button.appendChild(ripple);

    setTimeout(() => {
        if (ripple && ripple.parentNode) {
            ripple.remove();
        }
    }, 600);
}

/**
 * Animate counter numbers with easing
 */
function animateCounter(element, start, end, duration, suffix = '') {
    const startTime = performance.now();
    const startValue = start;
    const endValue = end;

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function - ease out cubic
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(startValue + (endValue - startValue) * easeOutCubic);

        element.textContent = current + suffix;

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = endValue + suffix;
        }
    }

    requestAnimationFrame(update);
}

/**
 * Add loading spinner for vote submission
 */
function addLoadingSpinner() {
    if (document.querySelector('.spinner')) return;

    const style = document.createElement('style');
    style.textContent = `
        .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
    `;
    document.head.appendChild(style);
}

// Add all required CSS animations
const globalStyles = document.createElement('style');
globalStyles.textContent = `
    @keyframes ripple-animation {
        to {
            transform: scale(2.5);
            opacity: 0;
        }
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    /* Smooth transitions for all interactive elements */
    .vote-btn, .control-btn, .modal-close, .creator-link, .back-btn, .gallery-img {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Enhanced focus states */
    .vote-btn:focus, .control-btn:focus, .modal-close:focus {
        outline: 2px solid rgba(15, 123, 89, 0.8);
        outline-offset: 2px;
    }
    
    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
        * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    }
`;
document.head.appendChild(globalStyles);

// Performance optimization - Debounce resize events
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Handle responsive adjustments if needed
        console.log('Window resized, adjusting layout');
    }, 250);
});

// Initialize intersection observer for performance
const observerOptions = {
    root: null,
    rootMargin: '10px',
    threshold: 0.1
};

// Lazy load optimization for images
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        }
    });
}, observerOptions);

// Apply lazy loading to gallery images
document.querySelectorAll('.gallery-img[data-src]').forEach(img => {
    imageObserver.observe(img);
});

console.log('Event Detail JavaScript fully loaded and optimized');