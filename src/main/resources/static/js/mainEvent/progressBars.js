// ====== PROGRESS BARS INITIALIZATION ======
// Файл: src/main/resources/static/js/mainEvent/progressBars.js

/**
 * Инициализира прогрес баровете за статистиките
 */
function initializeProgressBars() {
    const progressBars = document.querySelectorAll('.progress-bar-mini');
    
    progressBars.forEach(bar => {
        const value = parseInt(bar.getAttribute('data-value')) || 0;
        const max = parseInt(bar.getAttribute('data-max')) || 100;
        const percentage = Math.min((value / max) * 100, 100);
        
        const fill = bar.querySelector('.progress-fill');
        if (fill) {
            // Използваме requestAnimationFrame за плавна анимация
            requestAnimationFrame(() => {
                fill.style.width = percentage + '%';
            });
        }
    });
}

// Инициализация при зареждане
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProgressBars);
} else {
    initializeProgressBars();
}

// Инициализация след динамично зареждане на съдържание
if (window.MutationObserver) {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                initializeProgressBars();
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

