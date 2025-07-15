/**
 * FAQ Page JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeFAQPage();
});

function initializeFAQPage() {
    initializeFAQAccordion();
    initializeSearch();
    initializeQuickLinks();
    initializeScrollToTop();

    console.log('FAQ page initialized successfully');
}

/**
 * FAQ Accordion функционалност
 */
function initializeFAQAccordion() {
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            toggleFAQItem(this);
        });

        // Keyboard navigation
        question.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleFAQItem(this);
            }
        });

        // Make focusable
        question.setAttribute('tabindex', '0');
        question.setAttribute('role', 'button');
        question.setAttribute('aria-expanded', 'false');
    });
}

function toggleFAQItem(questionElement) {
    const faqItem = questionElement.closest('.faq-item');
    const isActive = faqItem.classList.contains('active');

    // Затваряме всички други FAQ items в същата категория
    const category = faqItem.closest('.faq-category');
    const otherItems = category.querySelectorAll('.faq-item');

    otherItems.forEach(item => {
        if (item !== faqItem && item.classList.contains('active')) {
            item.classList.remove('active');
            const otherQuestion = item.querySelector('.faq-question');
            if (otherQuestion) {
                otherQuestion.setAttribute('aria-expanded', 'false');
            }
        }
    });

    // Toggle текущия item
    faqItem.classList.toggle('active', !isActive);
    questionElement.setAttribute('aria-expanded', !isActive);

    // Scroll до въпроса ако се отваря
    if (!isActive) {
        setTimeout(() => {
            const headerHeight = document.querySelector('.navbar')?.offsetHeight || 0;
            const elementPosition = faqItem.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - headerHeight - 20;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }, 100);
    }

    // Analytics tracking
    trackFAQInteraction(questionElement.querySelector('span').textContent, !isActive);
}

/**
 * Search функционалност
 */
function initializeSearch() {
    const searchInput = document.getElementById('faqSearch');
    const faqItems = document.querySelectorAll('.faq-item');
    const faqCategories = document.querySelectorAll('.faq-category');

    let searchTimeout;

    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(this.value.toLowerCase().trim());
        }, 300);
    });

    function performSearch(query) {
        let hasResults = false;

        // Премахваме предишни no-results съобщения
        const existingNoResults = document.querySelector('.no-results');
        if (existingNoResults) {
            existingNoResults.remove();
        }

        if (query === '') {
            // Показваме всички items и категории
            faqItems.forEach(item => {
                item.classList.remove('hidden', 'highlighted');
            });
            faqCategories.forEach(category => {
                category.classList.remove('hidden');
            });
            return;
        }

        faqCategories.forEach(category => {
            let categoryHasResults = false;
            const categoryItems = category.querySelectorAll('.faq-item');

            categoryItems.forEach(item => {
                const question = item.querySelector('.faq-question span').textContent.toLowerCase();
                const answer = item.querySelector('.faq-answer p').textContent.toLowerCase();

                if (question.includes(query) || answer.includes(query)) {
                    item.classList.remove('hidden');
                    item.classList.add('highlighted');
                    categoryHasResults = true;
                    hasResults = true;

                    // Автоматично отваряме намерените въпроси
                    if (!item.classList.contains('active')) {
                        item.classList.add('active');
                        const questionEl = item.querySelector('.faq-question');
                        if (questionEl) {
                            questionEl.setAttribute('aria-expanded', 'true');
                        }
                    }
                } else {
                    item.classList.add('hidden');
                    item.classList.remove('highlighted', 'active');
                    const questionEl = item.querySelector('.faq-question');
                    if (questionEl) {
                        questionEl.setAttribute('aria-expanded', 'false');
                    }
                }
            });

            // Показваме/скриваме цялата категория
            category.classList.toggle('hidden', !categoryHasResults);
        });

        // Показваме съобщение ако няма резултати
        if (!hasResults) {
            showNoResultsMessage(query);
        }

        // Analytics tracking
        if (query.length > 2) {
            trackSearchQuery(query, hasResults);
        }
    }

    function showNoResultsMessage(query) {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-results';
        noResultsDiv.innerHTML = `
            <i class="bi bi-search"></i>
            <h3>Не намерихме резултати за "${query}"</h3>
            <p>Опитайте с други ключови думи или се свържете с нас директно за помощ.</p>
        `;

        document.querySelector('.faq-categories').appendChild(noResultsDiv);
    }
}

/**
 * Quick Links навигация
 */
function initializeQuickLinks() {
    const quickLinks = document.querySelectorAll('.quick-link');

    quickLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                const headerHeight = document.querySelector('.navbar')?.offsetHeight || 0;
                const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - headerHeight - 20;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // Highlight категорията за кратко
                targetElement.style.backgroundColor = '#f8fff8';
                setTimeout(() => {
                    targetElement.style.backgroundColor = '';
                }, 2000);

                // Analytics tracking
                trackQuickLinkClick(targetId);
            }
        });

        // Keyboard navigation
        link.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.click();
            }
        });
    });
}

/**
 * Scroll to top функционалност
 */
function initializeScrollToTop() {
    const scrollButton = document.createElement('button');
    scrollButton.innerHTML = '<i class="bi bi-arrow-up"></i>';
    scrollButton.className = 'scroll-to-top-btn';
    scrollButton.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 50px;
        height: 50px;
        background: #4b9f3e;
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 1.2rem;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(75, 159, 62, 0.3);
    `;

    document.body.appendChild(scrollButton);

    // Show/hide button based on scroll position
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 400) {
            scrollButton.style.opacity = '1';
            scrollButton.style.visibility = 'visible';
        } else {
            scrollButton.style.opacity = '0';
            scrollButton.style.visibility = 'hidden';
        }
    });

    // Scroll to top when clicked
    scrollButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        trackScrollToTop();
    });

    // Hover effect
    scrollButton.addEventListener('mouseenter', function() {
        this.style.backgroundColor = '#5cb85c';
        this.style.transform = 'scale(1.1)';
    });

    scrollButton.addEventListener('mouseleave', function() {
        this.style.backgroundColor = '#4b9f3e';
        this.style.transform = 'scale(1)';
    });
}

/**
 * Analytics tracking функции
 */
function trackFAQInteraction(question, opened) {
    if (typeof gtag !== 'undefined') {
        gtag('event', opened ? 'faq_open' : 'faq_close', {
            event_category: 'FAQ',
            event_label: question,
            custom_parameter: opened ? 'opened' : 'closed'
        });
    }
}

function trackSearchQuery(query, hasResults) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'faq_search', {
            event_category: 'FAQ',
            event_label: query,
            custom_parameter: hasResults ? 'results_found' : 'no_results'
        });
    }
}

function trackQuickLinkClick(targetId) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'quick_link_click', {
            event_category: 'FAQ',
            event_label: targetId,
            custom_parameter: 'navigation'
        });
    }
}

function trackScrollToTop() {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'scroll_to_top', {
            event_category: 'FAQ',
            event_label: 'button_click'
        });
    }
}

/**
 * Accessibility improvements
 */
function enhanceAccessibility() {
    // Add skip link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Към основното съдържание';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: #4b9f3e;
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 10000;
        transition: top 0.3s;
    `;

    skipLink.addEventListener('focus', function() {
        this.style.top = '6px';
    });

    skipLink.addEventListener('blur', function() {
        this.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);

    // Add main content id
    document.querySelector('.faq-container').id = 'main-content';

    // Add ARIA labels
    document.querySelectorAll('.faq-item').forEach((item, index) => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        if (question && answer) {
            question.setAttribute('aria-controls', `faq-answer-${index}`);
            answer.setAttribute('id', `faq-answer-${index}`);
            answer.setAttribute('aria-labelledby', `faq-question-${index}`);
            question.setAttribute('id', `faq-question-${index}`);
        }
    });

    // Add search aria-label
    const searchInput = document.getElementById('faqSearch');
    if (searchInput) {
        searchInput.setAttribute('aria-label', 'Търсене в често задаваните въпроси');
    }
}

/**
 * URL hash navigation
 */
function initializeHashNavigation() {
    // Handle initial hash
    if (window.location.hash) {
        setTimeout(() => {
            const targetElement = document.querySelector(window.location.hash);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // Highlight категорията
                targetElement.style.backgroundColor = '#f8fff8';
                setTimeout(() => {
                    targetElement.style.backgroundColor = '';
                }, 2000);
            }
        }, 100);
    }

    // Handle hash changes
    window.addEventListener('hashchange', function() {
        const targetElement = document.querySelector(window.location.hash);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
}

/**
 * Performance optimizations
 */
function initializePerformanceOptimizations() {
    // Debounce scroll events
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            // Scroll-based optimizations here
        }, 16); // ~60fps
    }, { passive: true });

    // Intersection Observer for lazy loading
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        });

        document.querySelectorAll('.faq-category').forEach(category => {
            observer.observe(category);
        });
    }
}

// Initialize all enhancements
enhanceAccessibility();
initializeHashNavigation();
initializePerformanceOptimizations();

// Handle page unload
window.addEventListener('beforeunload', function() {
    // Cleanup any intervals or timeouts
    clearTimeout(window.searchTimeout);
    clearTimeout(window.scrollTimeout);
});

// Error handling
window.addEventListener('error', function(e) {
    console.error('FAQ Page Error:', e.error);
    // Track error if analytics available
    if (typeof gtag !== 'undefined') {
        gtag('event', 'javascript_error', {
            event_category: 'FAQ',
            event_label: e.error.message,
            custom_parameter: 'error'
        });
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeFAQPage,
        toggleFAQItem,
        performSearch: () => {} // Mock for testing
    };
}