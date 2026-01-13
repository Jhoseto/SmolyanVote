/**
 * Enhanced Index JavaScript for SmolyanVote
 * Maintains all original functionality while adding new features
 */

document.addEventListener('DOMContentLoaded', function () {
    // Initialize all components
    initializeStatisticsAnimation();
    initializeDynamicText();
    initializeMotivationPanels();
    initializeAccessibility();
    initializePerformanceOptimizations();
});

/**
 * Statistics Animation (Preserved from original)
 */
function initializeStatisticsAnimation() {
    const statsContainer = document.querySelector('.stats-container');
    const statItems = document.querySelectorAll('.stat-item');
    let statsAnimated = false;

    if (!statsContainer || statItems.length === 0) {
        return;
    }

    const animateNumber = (element, target) => {
        let start = 0;
        const duration = 2000;
        const startTime = performance.now();

        const update = (currentTime) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const value = Math.floor(easeOutQuart * target);

            element.textContent = value;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = target;
            }
        };

        requestAnimationFrame(update);
    };

    const animateTitle = (element) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';

        setTimeout(() => {
            element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 100);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !statsAnimated) {
                statItems.forEach((item, index) => {
                    setTimeout(() => {
                        const title = item.querySelector('.stat-title');
                        const number = item.querySelector('.stat-number');
                        const target = parseInt(number.dataset.target);

                        if (title) animateTitle(title);
                        if (number && target) animateNumber(number, target);
                    }, index * 200); // Stagger animation
                });
                statsAnimated = true;
                observer.disconnect();
            }
        });
    }, {
        threshold: 0.3,
        rootMargin: '0px 0px -50px 0px'
    });

    observer.observe(statsContainer);
}

/**
 * Dynamic Text Animation (Preserved from original)
 */
function initializeDynamicText() {
    const dynamicTexts = document.querySelectorAll('.dynamic-text');

    if (dynamicTexts.length === 0) {
        return;
    }

    let currentIndex = 0;

    const showText = (index) => {
        dynamicTexts.forEach((text, i) => {
            text.classList.toggle('active', i === index);
        });
    };

    const cycleTexts = () => {
        showText(currentIndex);
        currentIndex = (currentIndex + 1) % dynamicTexts.length;
    };

    // Start the cycle
    cycleTexts();

    // Continue cycling
    setInterval(cycleTexts, 3000);
}

/**
 * Motivation Panels Functionality (Simplified & Clean)
 */
function initializeMotivationPanels() {
    const panels = document.querySelectorAll('.motivation-panel');

    if (panels.length === 0) {
        return;
    }

    // ENSURE ALL PANELS START COLLAPSED
    panels.forEach(panel => {
        panel.classList.remove('expanded');
        const header = panel.querySelector('.panel-header');
        if (header) {
            header.setAttribute('aria-expanded', 'false');
        }
    });

    panels.forEach(panel => {
        const header = panel.querySelector('.panel-header');

        if (!header) return;

        // Add expand indicator if not exists
        if (!header.querySelector('.panel-expand-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'panel-expand-indicator';
            indicator.innerHTML = '<i class="bi bi-chevron-down"></i>';
            header.appendChild(indicator);
        }

        // Add click handler
        header.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePanel(panel);
        });

        // Make header focusable for accessibility
        header.setAttribute('tabindex', '0');
        header.setAttribute('role', 'button');
        header.setAttribute('aria-expanded', 'false');

        // Add aria label
        const title = panel.querySelector('.panel-title');
        if (title) {
            header.setAttribute('aria-label', `Разгъни панел: ${title.textContent}`);
        }
    });

    function togglePanel(clickedPanel) {
        const isCurrentlyExpanded = clickedPanel.classList.contains('expanded');
        const header = clickedPanel.querySelector('.panel-header');

        // Close all panels first
        panels.forEach(panel => {
            panel.classList.remove('expanded');
            const panelHeader = panel.querySelector('.panel-header');
            if (panelHeader) {
                panelHeader.setAttribute('aria-expanded', 'false');
            }
        });

        // If the clicked panel wasn't expanded, expand it
        if (!isCurrentlyExpanded) {
            clickedPanel.classList.add('expanded');
            if (header) {
                header.setAttribute('aria-expanded', 'true');
            }

            // Analytics event
            if (typeof gtag !== 'undefined') {
                const panelType = clickedPanel.getAttribute('data-panel') || 'unknown';
                gtag('event', 'panel_expand', {
                    'panel_type': panelType
                });
            }
        }
    }

    // Close panels when clicking outside
    document.addEventListener('click', (e) => {
        // Fix: Ensure target is an element before calling closest
        // (react-native-webview or some extensions might trigger events where target is not an element)
        if (e.target && e.target.closest && !e.target.closest('.motivation-panel')) {
            panels.forEach(panel => {
                panel.classList.remove('expanded');
                const header = panel.querySelector('.panel-header');
                if (header) {
                    header.setAttribute('aria-expanded', 'false');
                }
            });
        }
    });
}

/**
 * Accessibility Enhancements
 */
function initializeAccessibility() {
    // Skip link functionality
    const skipLink = document.querySelector('.skip-link');
    const mainContent = document.getElementById('main-content');

    if (skipLink && mainContent) {
        skipLink.addEventListener('click', (e) => {
            e.preventDefault();
            mainContent.focus();
            mainContent.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Add ARIA landmarks where missing
    const hero = document.querySelector('.hero');
    if (hero && !hero.getAttribute('role')) {
        hero.setAttribute('role', 'banner');
    }

    // Enhanced focus management
    document.addEventListener('keydown', (e) => {
        // Escape key to close expanded panels
        if (e.key === 'Escape') {
            const expandedPanels = document.querySelectorAll('.motivation-panel.expanded');
            expandedPanels.forEach(panel => {
                panel.classList.remove('expanded');
                const header = panel.querySelector('.panel-header');
                if (header) {
                    header.setAttribute('aria-expanded', 'false');
                    header.focus();
                }
            });
        }
    });

    // Announce page loading completion to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = 'Страницата е заредена успешно';
    document.body.appendChild(announcement);

    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 3000);
}

/**
 * Performance Optimizations
 */
function initializePerformanceOptimizations() {
    // Lazy load images in motivation panels
    if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    }

    // Optimize scroll performance
    let ticking = false;

    function updateScrollPosition() {
        // Add scroll-based effects here if needed
        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateScrollPosition);
            ticking = true;
        }
    }

    window.addEventListener('scroll', requestTick, { passive: true });

    // Optimize video loading
    const muxPlayers = document.querySelectorAll('mux-player');
    muxPlayers.forEach(player => {
        player.addEventListener('loadstart', () => {
        });
        player.addEventListener('canplay', () => {
        });
    });
}

/**
 * Scroll to Features Function (Preserved from original)
 */
function scrollToFeatures() {
    const featuresSection = document.getElementById('motivation-section');
    if (featuresSection) {
        featuresSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

/**
 * Error Handling and Fallbacks
 */
window.addEventListener('error', (e) => {
    console.warn('SmolyanVote: An error occurred:', e.error);

    // Fallback for critical animations
    if (e.error && e.error.message && e.error.message.includes('animation')) {
        // Disable animations for this session
        document.documentElement.style.setProperty('--animation-normal', '0.01s');
        document.documentElement.style.setProperty('--animation-fast', '0.01s');
        document.documentElement.style.setProperty('--animation-slow', '0.01s');
    }
});

/**
 * Progressive Enhancement Checks
 */
function checkBrowserSupport() {
    const features = {
        intersectionObserver: 'IntersectionObserver' in window,
        customProperties: window.CSS && CSS.supports('color', 'var(--test)'),
        flexbox: window.CSS && CSS.supports('display', 'flex'),
        grid: window.CSS && CSS.supports('display', 'grid')
    };

    // Add browser capability classes
    Object.keys(features).forEach(feature => {
        if (features[feature]) {
            document.documentElement.classList.add(`supports-${feature}`);
        } else {
            document.documentElement.classList.add(`no-${feature}`);
        }
    });

    return features;
}

// Initialize browser support checks
checkBrowserSupport();

/**
 * Export functions for external use
 */
window.SmolyanVote = {
    scrollToFeatures,
    initializeStatisticsAnimation,
    initializeDynamicText,
    initializeMotivationPanels
};