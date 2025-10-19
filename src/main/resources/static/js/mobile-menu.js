// Mobile Menu Toggle Function
function toggleMobileMenu() {
    console.log('🍔 Mobile menu toggle clicked');
    
    const menu = document.getElementById('navbarNavSection');
    const overlay = document.querySelector('.mobile-menu-overlay');
    const body = document.body;
    
    if (!menu) {
        console.error('❌ Mobile menu element not found!');
        return;
    }
    
    // Toggle menu visibility
    if (menu.classList.contains('active')) {
        // Close menu
        menu.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        body.classList.remove('mobile-menu-open');
        console.log('📱 Mobile menu closed');
    } else {
        // Open menu
        menu.classList.add('active');
        if (overlay) overlay.classList.add('active');
        body.classList.add('mobile-menu-open');
        console.log('📱 Mobile menu opened');
    }
}

// Close menu when clicking outside
document.addEventListener('click', function(event) {
    const menu = document.getElementById('navbarNavSection');
    const toggler = document.querySelector('.mobile-toggler-glass');
    
    if (menu && menu.classList.contains('active')) {
        if (!menu.contains(event.target) && !toggler.contains(event.target)) {
            menu.classList.remove('active');
            const overlay = document.querySelector('.mobile-menu-overlay');
            if (overlay) overlay.classList.remove('active');
            document.body.classList.remove('mobile-menu-open');
            console.log('📱 Mobile menu closed by outside click');
        }
    }
});

// Close menu on escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const menu = document.getElementById('navbarNavSection');
        if (menu && menu.classList.contains('active')) {
            menu.classList.remove('active');
            const overlay = document.querySelector('.mobile-menu-overlay');
            if (overlay) overlay.classList.remove('active');
            document.body.classList.remove('mobile-menu-open');
            console.log('📱 Mobile menu closed by Escape key');
        }
    }
});

// Vote Menu Toggle Function
function toggleVoteMenu(event) {
    event.preventDefault();
    console.log('🗳️ Vote menu toggle clicked');
    
    const voteItem = event.target.closest('.nav-item-glass');
    if (!voteItem) return;
    
    const voteMenu = voteItem.querySelector('.vote-menu-glass');
    const arrow = voteItem.querySelector('.vote-arrow-glass');
    
    if (!voteMenu || !arrow) return;
    
    // Toggle vote menu
    if (voteItem.classList.contains('vote-menu-open')) {
        // Close vote menu
        voteItem.classList.remove('vote-menu-open');
        voteMenu.style.display = 'none';
        console.log('🗳️ Vote menu closed');
    } else {
        // Close other vote menus first
        document.querySelectorAll('.nav-item-glass.vote-menu-open').forEach(item => {
            item.classList.remove('vote-menu-open');
            const menu = item.querySelector('.vote-menu-glass');
            if (menu) menu.style.display = 'none';
        });
        
        // Open this vote menu
        voteItem.classList.add('vote-menu-open');
        voteMenu.style.display = 'flex';
        console.log('🗳️ Vote menu opened');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 Mobile menu script loaded');
    
    // Add overlay if it doesn't exist
    if (!document.querySelector('.mobile-menu-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'mobile-menu-overlay';
        document.body.appendChild(overlay);
        console.log('📱 Mobile menu overlay created');
    }
    
    // Add vote menu event listeners
    document.querySelectorAll('.vote-toggle-glass').forEach(toggle => {
        toggle.addEventListener('click', toggleVoteMenu);
    });
    
    console.log('🗳️ Vote menu listeners added');
});
