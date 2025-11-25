/**
 * Particles Background - Прост модул като на страницата за грешки
 * Просто добави клас .particles-background на контейнера
 * 
 * Опции:
 * - data-particles-theme="green|orange|cyan" - цветова тема (по подразбиране green)
 * - data-particles-count="80" - брой частици (по подразбиране 80)
 */

(function() {
    'use strict';

    // Проверяваме дали particles.js е зареден
    if (typeof particlesJS === 'undefined') {
        console.warn('ParticlesBackground: particles.js не е зареден!');
        return;
    }

    // Цветови теми
    const themes = {
        green: {
            particleColor: '#28a545',
            lineColor: '#57ec78'
        },
        orange: {
            particleColor: '#FB7E14',
            lineColor: '#E86A11'
        },
        cyan: {
            particleColor: '#17CBEA',
            lineColor: '#0EA5E9'
        }
    };

    function initParticles(container) {
        const themeName = container.dataset.particlesTheme || 'green';
        const theme = themes[themeName] || themes.green;
        const particleCount = parseInt(container.dataset.particlesCount) || 80;
        
        // Генерираме уникален ID
        const id = container.id || `particles-${Math.random().toString(36).substr(2, 9)}`;
        container.id = id;

        // Конфигурация точно като на страницата за грешки
        particlesJS(id, {
            "particles": {
                "number": { "value": particleCount },
                "color": { "value": theme.particleColor },
                "shape": { "type": "circle" },
                "opacity": { "value": 0.5 },
                "size": { "value": 3 },
                "line_linked": {
                    "enable": true,
                    "distance": 150,
                    "color": theme.lineColor,
                    "opacity": 0.4,
                    "width": 1
                },
                "move": { "enable": true, "speed": 3 }
            },
            "interactivity": {
                "events": {
                    "onhover": { "enable": true, "mode": "repulse" },
                    "onclick": { "enable": true, "mode": "push" }
                }
            },
            "retina_detect": true
        });
    }

    // Инициализация при зареждане
    document.addEventListener('DOMContentLoaded', function() {
        const containers = document.querySelectorAll('.particles-background');
        containers.forEach(container => {
            initParticles(container);
        });
    });

    // Публичен метод за ръчна инициализация
    window.initParticlesBackground = function(selector) {
        const containers = document.querySelectorAll(selector || '.particles-background');
        containers.forEach(container => {
            if (!container.id || !container.querySelector('canvas')) {
                initParticles(container);
            }
        });
    };
})();
