/* ============================================
   MOBILE MENU JAVASCRIPT
   Управлява mobile navigation menu
   ============================================ */

// Wrap in IIFE to avoid global variable conflicts
(function() {
    let mobileMenuOpen = false;
    let voteMenuOpen = false;

/**
 * Toggle Mobile Menu
 */
function toggleMobileMenu() {
    const navSection = document.getElementById('navbarNavSection');
    const body = document.body;
    
    if (!navSection) {
        console.error('navbarNavSection not found!');
        return;
    }
    
    if (mobileMenuOpen) {
        // Close menu
        navSection.classList.remove('show');
        body.classList.remove('mobile-menu-open');
        mobileMenuOpen = false;
    } else {
        // Open menu
        navSection.classList.add('show');
        body.classList.add('mobile-menu-open');
        mobileMenuOpen = true;
    }
}

/**
 * Toggle Vote Menu (Accordion in mobile)
 */
function toggleVoteMenu(event) {
    event.preventDefault();
    
    const container = document.getElementById('voteMenuContainer');
    const arrow = document.querySelector('.vote-arrow-glass');
    const voteToggle = document.querySelector('.vote-toggle-glass');
    
    if (!container) {
        console.error('voteMenuContainer not found!');
        return;
    }
    
    // Check if we're on mobile
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Mobile: Accordion behavior INSIDE the mobile menu
        if (voteMenuOpen) {
            container.classList.remove('show');
            if (arrow) arrow.classList.remove('rotated');
            if (voteToggle) voteToggle.classList.remove('active');
            voteMenuOpen = false;
        } else {
            container.classList.add('show');
            if (arrow) arrow.classList.add('rotated');
            if (voteToggle) voteToggle.classList.add('active');
            voteMenuOpen = true;
        }
    } else {
        // Desktop: Original dropdown behavior
        const overlay = document.getElementById('voteOverlay');
        
        if (voteMenuOpen) {
            container.classList.remove('show');
            if (arrow) arrow.classList.remove('rotated');
            if (overlay) overlay.classList.remove('show');
            voteMenuOpen = false;
        } else {
            container.classList.add('show');
            if (arrow) arrow.classList.add('rotated');
            if (overlay) overlay.classList.add('show');
            voteMenuOpen = true;
        }
    }
}

/**
 * Close Vote Menu
 */
function closeVoteMenu() {
    const container = document.getElementById('voteMenuContainer');
    const arrow = document.querySelector('.vote-arrow-glass');
    const overlay = document.getElementById('voteOverlay');
    const voteToggle = document.querySelector('.vote-toggle-glass');
    
    if (container) container.classList.remove('show');
    if (arrow) arrow.classList.remove('rotated');
    if (overlay) overlay.classList.remove('show');
    if (voteToggle) voteToggle.classList.remove('active');
    voteMenuOpen = false;
}

/**
 * Close Mobile Menu
 */
function closeMobileMenu() {
    const navSection = document.getElementById('navbarNavSection');
    const body = document.body;
    
    if (navSection) {
        navSection.classList.remove('show');
        body.classList.remove('mobile-menu-open');
        mobileMenuOpen = false;
    }
}

/**
 * Close menu when clicking outside (only on mobile)
 */
document.addEventListener('click', function(e) {
    if (window.innerWidth > 768) return; // Desktop only

    const navSection = document.getElementById('navbarNavSection');
    const toggler = document.querySelector('.mobile-toggler-glass');
    const voteContainer = document.getElementById('voteMenuContainer');
    const voteToggle = document.querySelector('.vote-toggle-glass');
    const languageDropdown = document.getElementById('languageDropdown');
    const languageToggle = document.querySelector('.language-toggle');

    // Close vote menu if clicking outside of it (but inside mobile menu)
    if (voteMenuOpen &&
        voteContainer &&
        !voteContainer.contains(e.target) &&
        voteToggle &&
        !voteToggle.contains(e.target) &&
        navSection &&
        navSection.contains(e.target)) {
        closeVoteMenu();
    }

    // Don't close mobile menu if clicking on language elements
    const isLanguageElement = e.target.closest('.language-switcher-item') ||
                             e.target.closest('.language-dropdown') ||
                             e.target.classList.contains('language-option') ||
                             e.target.classList.contains('language-toggle');

    // Close mobile menu if clicking outside (but not on language elements)
    if (mobileMenuOpen &&
        navSection &&
        !navSection.contains(e.target) &&
        toggler &&
        !toggler.contains(e.target) &&
        !isLanguageElement) {
        closeMobileMenu();
    }
});

/**
 * Close menu on Escape key
 */
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Close vote menu first if open
        if (voteMenuOpen) {
            closeVoteMenu();
        }
        // Then close mobile menu
        else if (mobileMenuOpen) {
            closeMobileMenu();
        }
    }
});

/**
 * Handle window resize
 */
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        // Close mobile menu if resizing to desktop
        if (window.innerWidth > 768 && mobileMenuOpen) {
            closeMobileMenu();
        }
        
        // Reset vote menu on resize
        if (window.innerWidth > 768 && voteMenuOpen) {
            // On desktop, vote menu is dropdown, not accordion
            const container = document.getElementById('voteMenuContainer');
            if (container) {
                container.style.maxHeight = '';
            }
        }
    }, 250);
});

/**
 * Initialize mobile menu
 */
document.addEventListener('DOMContentLoaded', function() {
    // Check if mobile menu elements exist
    const toggler = document.querySelector('.mobile-toggler-glass');
    const navSection = document.getElementById('navbarNavSection');
    const voteContainer = document.getElementById('voteMenuContainer');
    
    if (!toggler) {
        console.warn('⚠️ Mobile toggler NOT found');
    }
    
    if (!navSection) {
        console.warn('⚠️ Nav section NOT found');
    }
    
    if (!voteContainer) {
        console.warn('⚠️ Vote container NOT found');
    }
    
    // Add click listener to all nav links to close menu on mobile (except language toggle)
    const navLinks = document.querySelectorAll('.nav-link-glass:not(.vote-toggle-glass):not(.language-toggle)');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                setTimeout(() => closeMobileMenu(), 100);
            }
        });
    });
    
    // Add click listener to vote items
    const voteItems = document.querySelectorAll('.vote-item-glass');
    voteItems.forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    closeVoteMenu();
                    closeMobileMenu();
                }, 100);
            }
        });
    });

    // Add click listener to language options to prevent mobile menu from closing
    const languageOptions = document.querySelectorAll('.language-option');
    languageOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling that might close mobile menu
            // The onclick attribute will still execute translateTo()
        });
    });
});

})(); // End IIFE
