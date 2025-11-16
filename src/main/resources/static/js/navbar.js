/* ===== NAVBAR INTERACTIONS ===== */

// Global state variables
let voteMenuOpen = false;
let mobileMenuOpen = false;
let profileDropdownOpen = false;

// ===== VOTE MENU FUNCTIONS =====

function toggleVoteMenu(event) {
    event.preventDefault();
    const container = document.getElementById('voteMenuContainer');
    const arrow = document.querySelector('.vote-arrow-glass');
    const overlay = document.getElementById('voteOverlay');

    // Добавяме вибрация за мобилни устройства
    if (window.innerWidth <= 768) {
        vibrateMobile();
    }

    if (voteMenuOpen) {
        closeVoteMenu();
    } else {
        openVoteMenu();
    }
}

function openVoteMenu() {
    const container = document.getElementById('voteMenuContainer');
    const arrow = document.querySelector('.vote-arrow-glass');
    const overlay = document.getElementById('voteOverlay');

    container.classList.add('show');
    arrow.classList.add('rotated');
    overlay.classList.add('show');
    voteMenuOpen = true;
}

function closeVoteMenu() {
    const container = document.getElementById('voteMenuContainer');
    const arrow = document.querySelector('.vote-arrow-glass');
    const overlay = document.getElementById('voteOverlay');

    container.classList.remove('show');
    arrow.classList.remove('rotated');
    overlay.classList.remove('show');
    voteMenuOpen = false;
}

// ===== MOBILE MENU FUNCTIONS =====

// Функция за вибрация на мобилно устройство
function vibrateMobile() {
    // Проверяваме дали браузърът поддържа вибрация
    if ('vibrate' in navigator) {
        // Кратка вибрация (50ms) за тактилен feedback
        navigator.vibrate(50);
    }
}

function toggleMobileMenu() {
    const navSection = document.getElementById('navbarNavSection');

    // Добавяме вибрация при отваряне/затваряне на менюто
    vibrateMobile();

    if (mobileMenuOpen) {
        navSection.classList.remove('show');
        mobileMenuOpen = false;
    } else {
        navSection.classList.add('show');
        mobileMenuOpen = true;
    }
}

// ===== PROFILE DROPDOWN FUNCTIONS =====

function toggleProfileDropdown() {
    const mobileDropdownMenu = document.getElementById('mobileProfileToggle')?.nextElementSibling;
    const desktopDropdownMenu = document.getElementById('desktopProfileToggle')?.nextElementSibling;

    if (profileDropdownOpen) {
        // Затваряме всички менюта
        if (mobileDropdownMenu) {
            mobileDropdownMenu.classList.remove('show');
            const mobileProfileDropdown = mobileDropdownMenu.closest('.profile-dropdown-glass');
            if (mobileProfileDropdown) {
                mobileProfileDropdown.classList.remove('expanded');
            }
        }
        if (desktopDropdownMenu) {
            desktopDropdownMenu.classList.remove('show');
            const desktopProfileDropdown = desktopDropdownMenu.closest('.profile-dropdown-glass');
            if (desktopProfileDropdown) {
                desktopProfileDropdown.classList.remove('expanded');
            }
        }
        profileDropdownOpen = false;
    } else {
        // Отваряме само видимото меню (desktop или mobile)
        const visibleMenu = window.innerWidth >= 769 ? desktopDropdownMenu : mobileDropdownMenu;
        if (visibleMenu) {
            visibleMenu.classList.add('show');
            profileDropdownOpen = true;
            
            // Добавяме expanded класа
            const profileDropdown = visibleMenu.closest('.profile-dropdown-glass');
            if (profileDropdown) {
                profileDropdown.classList.add('expanded');
            }
        }
    }
}

// ===== EVENT LISTENERS =====

// Escape key handler
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (voteMenuOpen) closeVoteMenu();
        if (mobileMenuOpen) toggleMobileMenu();
        if (profileDropdownOpen) {
            const mobileDropdownMenu = document.getElementById('mobileProfileToggle')?.nextElementSibling;
            const desktopDropdownMenu = document.getElementById('desktopProfileToggle')?.nextElementSibling;
            if (mobileDropdownMenu) mobileDropdownMenu.classList.remove('show');
            if (desktopDropdownMenu) desktopDropdownMenu.classList.remove('show');
            profileDropdownOpen = false;
        }
    }
});

// Close mobile menu when clicking outside
document.addEventListener('click', function(e) {
    const navSection = document.getElementById('navbarNavSection');
    const toggler = document.querySelector('.mobile-toggler-glass');

    if (mobileMenuOpen && !navSection.contains(e.target) && !toggler.contains(e.target)) {
        toggleMobileMenu();
    }
});

// Profile Dropdown Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    const mobileProfileToggle = document.getElementById('mobileProfileToggle');
    const desktopProfileToggle = document.getElementById('desktopProfileToggle');
    const mobileDropdownMenu = mobileProfileToggle ? mobileProfileToggle.nextElementSibling : null;
    const desktopDropdownMenu = desktopProfileToggle ? desktopProfileToggle.nextElementSibling : null;

    // Функция за затваряне на всички dropdown менюта
    function closeAllDropdowns() {
        if (mobileDropdownMenu) {
            mobileDropdownMenu.classList.remove('show');
            const mobileProfileDropdown = mobileDropdownMenu.closest('.profile-dropdown-glass');
            if (mobileProfileDropdown) {
                mobileProfileDropdown.classList.remove('expanded');
            }
        }
        if (desktopDropdownMenu) {
            desktopDropdownMenu.classList.remove('show');
            const desktopProfileDropdown = desktopDropdownMenu.closest('.profile-dropdown-glass');
            if (desktopProfileDropdown) {
                desktopProfileDropdown.classList.remove('expanded');
            }
        }
        profileDropdownOpen = false;
    }

    // Функция за отваряне на dropdown меню
    function openDropdown(dropdownMenu) {
        closeAllDropdowns();
        if (dropdownMenu) {
            dropdownMenu.classList.add('show');
            profileDropdownOpen = true;
            
            // Добавяме класа за expanded state
            const profileDropdown = dropdownMenu.closest('.profile-dropdown-glass');
            if (profileDropdown) {
                profileDropdown.classList.add('expanded');
            }
        }
    }

    // Mobile profile toggle
    if (mobileProfileToggle && mobileDropdownMenu) {
        mobileProfileToggle.addEventListener('click', function(e) {
            e.preventDefault();
            // Добавяме вибрация за мобилни устройства
            if (window.innerWidth <= 768) {
                vibrateMobile();
            }
            openDropdown(mobileDropdownMenu);
        });
    }

    // Desktop profile toggle
    if (desktopProfileToggle && desktopDropdownMenu) {
        desktopProfileToggle.addEventListener('click', function(e) {
            e.preventDefault();
            openDropdown(desktopDropdownMenu);
        });
    }

    // Затваряне при клик извън менюто
    document.addEventListener('click', function(e) {
        if (profileDropdownOpen &&
            !mobileProfileToggle?.contains(e.target) &&
            !desktopProfileToggle?.contains(e.target) &&
            !mobileDropdownMenu?.contains(e.target) &&
            !desktopDropdownMenu?.contains(e.target)) {
            closeAllDropdowns();
        }
    });
});

// ===== HEARTBEAT FUNCTIONALITY =====

// Heartbeat скрипт за автентикирани потребители
document.addEventListener('DOMContentLoaded', function() {
    const csrfToken = document.querySelector('meta[name="_csrf"]');
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]');

    function sendHeartbeat() {
        const headers = { 'Content-Type': 'application/json' };
        if (csrfToken && csrfHeader) {
            headers[csrfHeader.content] = csrfToken.content;
        }

        fetch('/heartbeat', {
            method: 'POST',
            headers: headers
        }).catch(error => console.warn('Heartbeat error:', error));
    }

    // Изпращаме heartbeat само ако потребителят е логнат
    if (document.getElementById('auth-marker')) {
        sendHeartbeat();
        setInterval(sendHeartbeat, 60000);
    }
});

// ===== MODAL ANIMATIONS =====

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.addEventListener('hide.bs.modal', () => {
            modal.classList.add('modal-closing');
            setTimeout(() => modal.classList.remove('modal-closing'), 300);
        });
    }
});


// ========================================
// GOOGLE TRANSLATE LANGUAGE SWITCHER
// ========================================

function googleTranslateElementInit() {
    new google.translate.TranslateElement({pageLanguage: 'bg'}, 'google_translate_element');
}

function toggleLanguageMenu(event) {
    event.preventDefault();
    document.getElementById('languageDropdown').classList.toggle('show');
}

/**
 * Превключване на език с пълно изчистване на стари cookies
 * @param {string} lang - Код на езика (bg, en, el, tr, ru, de, fr, es, iw, zh-CN)
 */
function translateTo(lang) {
    // СТЪПКА 1: Изчистване на ВСИЧКИ Google Translate cookies
    const cookiesToDelete = [
        'googtrans',
        'googtrans=/bg/',
        'googtrans=/auto/bg',
        'googtrans=/bg/bg'
    ];
    
    // Изтриваме за текущия домейн и с префикс
    cookiesToDelete.forEach(cookieName => {
        // Стандартно изтриване
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        // Изтриване с домейн
        document.cookie = `${cookieName}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        // Изтриване с точка преди домейна
        document.cookie = `${cookieName}=; path=/; domain=.${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });
    
    // СТЪПКА 2: Задаване на новото cookie
    const newCookie = `googtrans=/bg/${lang}`;
    document.cookie = `${newCookie}; path=/; max-age=31536000`;
    
    // СТЪПКА 3: SessionStorage за допълнителен контрол
    try {
        sessionStorage.setItem('selectedLanguage', lang);
    } catch (e) {
        console.warn('SessionStorage not available:', e);
    }
    
    // СТЪПКА 4: Reload на страницата
    location.reload();
}

/**
 * Проверка и прилагане на запазен език при зареждане
 */
function applyStoredLanguage() {
    try {
        const savedLang = sessionStorage.getItem('selectedLanguage');
        if (savedLang && savedLang !== 'bg') {
            // Форсиране на запазения език
            document.cookie = `googtrans=/bg/${savedLang}; path=/; max-age=31536000`;
        }
    } catch (e) {
        console.warn('Could not apply stored language:', e);
    }
}

// Затваряне на dropdown при клик извън него
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('languageDropdown');
    if (dropdown && !e.target.closest('.language-switcher-item')) {
        dropdown.classList.remove('show');
    }
});

// Прилагане на запазен език при зареждане на страницата
document.addEventListener('DOMContentLoaded', applyStoredLanguage);

// Зареждане на Google Translate script
(function() {
    const s = document.createElement('script');
    s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.head.appendChild(s);
})();


// ===== EXPORT FUNCTIONS FOR GLOBAL ACCESS =====

// Изнасяме функциите глобално за достъп от HTML
window.toggleVoteMenu = toggleVoteMenu;
window.closeVoteMenu = closeVoteMenu;
window.toggleMobileMenu = toggleMobileMenu;
window.toggleProfileDropdown = toggleProfileDropdown;
window.toggleLanguageMenu = toggleLanguageMenu;
window.translateTo = translateTo;
window.googleTranslateElementInit = googleTranslateElementInit;
