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
    console.log('toggleMobileMenu called, current state:', mobileMenuOpen);
    
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
        console.log('Mobile menu CLOSED');
    } else {
        // Open menu
        navSection.classList.add('show');
        body.classList.add('mobile-menu-open');
        mobileMenuOpen = true;
        console.log('Mobile menu OPENED');
    }
}

/**
 * Toggle Vote Menu (Accordion in mobile)
 */
function toggleVoteMenu(event) {
    event.preventDefault();
    console.log('toggleVoteMenu called');
    
    const container = document.getElementById('voteMenuContainer');
    const arrow = document.querySelector('.vote-arrow-glass');
    const voteToggle = document.querySelector('.vote-toggle-glass');
    
    if (!container) {
        console.error('voteMenuContainer not found!');
        return;
    }
    
    // Check if we're on mobile
    const isMobile = window.innerWidth <= 768;
    console.log('Is mobile:', isMobile, 'Window width:', window.innerWidth);
    
    if (isMobile) {
        // Mobile: Accordion behavior INSIDE the mobile menu
        if (voteMenuOpen) {
            container.classList.remove('show');
            if (arrow) arrow.classList.remove('rotated');
            if (voteToggle) voteToggle.classList.remove('active');
            voteMenuOpen = false;
            console.log('Vote menu CLOSED (mobile accordion)');
        } else {
            container.classList.add('show');
            if (arrow) arrow.classList.add('rotated');
            if (voteToggle) voteToggle.classList.add('active');
            voteMenuOpen = true;
            console.log('Vote menu OPENED (mobile accordion)');
        }
    } else {
        // Desktop: Original dropdown behavior
        const overlay = document.getElementById('voteOverlay');
        
        if (voteMenuOpen) {
            container.classList.remove('show');
            if (arrow) arrow.classList.remove('rotated');
            if (overlay) overlay.classList.remove('show');
            voteMenuOpen = false;
            console.log('Vote menu CLOSED (desktop)');
        } else {
            container.classList.add('show');
            if (arrow) arrow.classList.add('rotated');
            if (overlay) overlay.classList.add('show');
            voteMenuOpen = true;
            console.log('Vote menu OPENED (desktop)');
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
    console.log('Vote menu force CLOSED');
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
        console.log('Mobile menu force CLOSED');
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
    
    // Close vote menu if clicking outside of it (but inside mobile menu)
    if (voteMenuOpen && 
        voteContainer && 
        !voteContainer.contains(e.target) &&
        voteToggle &&
        !voteToggle.contains(e.target) &&
        navSection &&
        navSection.contains(e.target)) {
        closeVoteMenu();
        console.log('Vote menu closed - clicked outside vote area');
    }
    
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
        // Close vote menu first if open
        if (voteMenuOpen) {
            closeVoteMenu();
            console.log('Vote menu closed - Escape key');
        }
        // Then close mobile menu
        else if (mobileMenuOpen) {
            closeMobileMenu();
            console.log('Mobile menu closed - Escape key');
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
    console.log('✅ Mobile menu JavaScript initialized');
    
    // Check if mobile menu elements exist
    const toggler = document.querySelector('.mobile-toggler-glass');
    const navSection = document.getElementById('navbarNavSection');
    const voteContainer = document.getElementById('voteMenuContainer');
    
    if (toggler) {
        console.log('✅ Mobile toggler found');
    } else {
        console.warn('⚠️ Mobile toggler NOT found');
    }
    
    if (navSection) {
        console.log('✅ Nav section found');
    } else {
        console.warn('⚠️ Nav section NOT found');
    }
    
    if (voteContainer) {
        console.log('✅ Vote container found');
    } else {
        console.warn('⚠️ Vote container NOT found');
    }
    
    // Add click listener to all nav links to close menu on mobile
    const navLinks = document.querySelectorAll('.nav-link-glass:not(.vote-toggle-glass)');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                console.log('Nav link clicked, closing menu');
                setTimeout(() => closeMobileMenu(), 100);
            }
        });
    });
    
    // Add click listener to vote items
    const voteItems = document.querySelectorAll('.vote-item-glass');
    voteItems.forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                console.log('Vote item clicked, closing menu');
                setTimeout(() => {
                    closeVoteMenu();
                    closeMobileMenu();
                }, 100);
            }
        });
    });
    
    console.log('✅ Mobile menu event listeners attached');
});

console.log('✅ mobile-menu.js loaded successfully');
