/* ============================================
   MOBILE MENU JAVASCRIPT
   Управлява mobile navigation menu
   ============================================ */

let mobileMenuOpen = false;
let voteMenuOpen = false;

/**
 * Toggle Mobile Menu
 */
function toggleMobileMenu() {
    const navSection = document.getElementById('navbarNavSection');
    const body = document.body;
    
    if (!navSection) return;
    
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
    
    if (!container || !arrow) return;
    
    // Check if we're on mobile
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Mobile: Accordion behavior
        if (voteMenuOpen) {
            container.classList.remove('show');
            arrow.classList.remove('rotated');
            voteMenuOpen = false;
        } else {
            container.classList.add('show');
            arrow.classList.add('rotated');
            voteMenuOpen = true;
        }
    } else {
        // Desktop: Original behavior (dropdown with overlay)
        const overlay = document.getElementById('voteOverlay');
        
        if (voteMenuOpen) {
            container.classList.remove('show');
            arrow.classList.remove('rotated');
            if (overlay) overlay.classList.remove('show');
            voteMenuOpen = false;
        } else {
            container.classList.add('show');
            arrow.classList.add('rotated');
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
    
    if (container) container.classList.remove('show');
    if (arrow) arrow.classList.remove('rotated');
    if (overlay) overlay.classList.remove('show');
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
 * Close menu when clicking outside
 */
document.addEventListener('click', function(e) {
    const navSection = document.getElementById('navbarNavSection');
    const toggler = document.querySelector('.mobile-toggler-glass');
    
    // Close mobile menu if clicking outside
    if (mobileMenuOpen && 
        navSection && 
        !navSection.contains(e.target) && 
        toggler && 
        !toggler.contains(e.target)) {
        closeMobileMenu();
    }
});

/**
 * Close menu on Escape key
 */
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (mobileMenuOpen) closeMobileMenu();
        if (voteMenuOpen) closeVoteMenu();
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
        
        // Reset vote menu behavior on resize
        if (window.innerWidth > 768 && voteMenuOpen) {
            const container = document.getElementById('voteMenuContainer');
            if (container) {
                container.style.maxHeight = '';
            }
        }
    }, 250);
});

/**
 * Prevent body scroll when mobile menu is open
 */
function preventBodyScroll() {
    if (mobileMenuOpen) {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
    } else {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
    }
}

/**
 * Initialize mobile menu
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Mobile menu initialized');
    
    // Check if mobile menu elements exist
    const toggler = document.querySelector('.mobile-toggler-glass');
    const navSection = document.getElementById('navbarNavSection');
    
    if (toggler && navSection) {
        console.log('✅ Mobile menu elements found');
    } else {
        console.warn('⚠️ Mobile menu elements not found');
    }
    
    // Add click listener to all nav links to close menu
    const navLinks = document.querySelectorAll('.nav-link-glass:not(.vote-toggle-glass)');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                closeMobileMenu();
            }
        });
    });
    
    // Add click listener to vote items
    const voteItems = document.querySelectorAll('.vote-item-glass');
    voteItems.forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                closeMobileMenu();
            }
        });
    });
});

console.log('✅ mobile-menu.js loaded');
