/**
 * Social Share Module
 * Функционалност за споделяне в социални мрежи
 * В момента поддържа само Facebook
 */

window.SocialShare = {
    /**
     * Споделяне във Facebook
     * @param {string} url - URL за споделяне
     * @param {string} title - Заглавие (опционално)
     */
    shareFacebook(url, title) {
        if (!url) {
            console.error('URL е задължителен за споделяне');
            return;
        }

        // Убеди се че URL-ът е абсолютен
        const absoluteUrl = this.getAbsoluteUrl(url);
        
        console.log('Sharing URL:', absoluteUrl); // Debug
        
        // Encode URL
        const encodedUrl = encodeURIComponent(absoluteUrl);
        
        // Facebook Share Dialog URL
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        
        console.log('Facebook Share URL:', facebookUrl); // Debug
        
        // Отвори в нов прозорец
        const width = 600;
        const height = 600; // Увеличена височина за по-добър preview
        const left = (screen.width - width) / 2;
        const top = (screen.height - height) / 2;
        
        const popup = window.open(
            facebookUrl,
            'Facebook Share',
            `width=${width},height=${height},left=${left},top=${top},toolbar=0,menubar=0,scrollbars=1,resizable=1`
        );

        if (!popup) {
            // Ако popup блокер блокира прозореца, отвори в нов таб
            window.open(facebookUrl, '_blank');
        }

        // Track share event (опционално)
        this.trackShare('facebook', absoluteUrl);
    },

    /**
     * Track share event (може да се използва за аналитика)
     * @param {string} platform - Платформа (facebook, twitter, etc.)
     * @param {string} url - Споделеният URL
     */
    trackShare(platform, url) {
        // Може да се добави аналитика тук (Google Analytics, custom tracking, etc.)
        console.log(`Share tracked: ${platform} - ${url}`);
        
        // Опционално: изпрати AJAX заявка към backend за tracking
        // if (window.appData && window.appData.csrfToken) {
        //     fetch('/api/track-share', {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json',
        //             [window.appData.csrfHeader]: window.appData.csrfToken
        //         },
        //         body: JSON.stringify({ platform, url })
        //     }).catch(err => console.error('Error tracking share:', err));
        // }
    },

    /**
     * Генерира текущия URL на страницата
     */
    getCurrentUrl() {
        return window.location.href;
    },

    /**
     * Конвертира relative URL към absolute URL
     * Използва production domain за да Facebook може да достъпи страницата
     */
    getAbsoluteUrl(relativeUrl) {
        if (!relativeUrl) {
            return this.getCurrentUrl();
        }
        
        // Ако вече е absolute URL, върни го както е
        if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
            return relativeUrl;
        }
        
        // ВАЖНО: Използвай production domain за Facebook споделяне
        // Facebook не може да достъпи localhost или private IPs
        const productionDomain = 'https://smolyanvote.com';
        
        // Проверка дали сме на production или development
        const isProduction = window.location.hostname === 'smolyanvote.com' || 
                            window.location.hostname === 'www.smolyanvote.com';
        
        // Ако сме на production, използвай текущия origin, иначе production domain
        const baseUrl = isProduction ? window.location.origin : productionDomain;
        
        // Убеди се че relativeUrl започва с /
        const cleanUrl = relativeUrl.startsWith('/') ? relativeUrl : '/' + relativeUrl;
        
        return baseUrl + cleanUrl;
    },

    /**
     * Инициализира share бутоните на страницата
     */
    init() {
        // Намери всички Facebook share бутони
        const facebookButtons = document.querySelectorAll('.share-facebook-btn');
        
        facebookButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Вземи URL от data атрибут или използвай текущия URL
                const relativeUrl = btn.dataset.url || window.location.pathname;
                const url = relativeUrl; // Ще се конвертира в getAbsoluteUrl
                const title = btn.dataset.title || document.title;
                
                console.log('Share button clicked:', { relativeUrl, url, title }); // Debug
                
                this.shareFacebook(url, title);
            });
        });
    }
};

// Автоматична инициализация при зареждане на DOM
(function() {
    function initializeShare() {
        if (window.SocialShare) {
            window.SocialShare.init();
        } else {
            console.error('SocialShare module не е зареден');
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeShare);
    } else {
        // DOM вече е готов
        initializeShare();
    }
})();

