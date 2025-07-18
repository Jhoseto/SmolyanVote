// ===== SIGNAL TOOLTIP =====
// Hover tooltip функционалност за картата

class SignalTooltip {
    constructor() {
        this.tooltip = null;
        this.isVisible = false;
        this.hideTimeout = null;
        this.currentSignal = null;

        this.createTooltipElement();
    }

    createTooltipElement() {
        // Създаване на tooltip елемента
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'signal-tooltip';
        this.tooltip.style.cssText = `
            position: fixed;
            z-index: 10000;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
            padding: 0;
            max-width: 280px;
            min-width: 240px;
            pointer-events: none;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: inherit;
            display: none;
        `;

        document.body.appendChild(this.tooltip);
    }

    show(signal, mouseEvent) {
        // Защита от показване на същия tooltip
        if (this.isVisible && this.currentSignal && this.currentSignal.id === signal.id) {
            return;
        }

        // Отказване на pending hide timeout
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        this.currentSignal = signal;
        this.updateContent(signal);
        this.updatePosition(mouseEvent);

        // Показване на tooltip-а
        this.tooltip.style.display = 'block';

        // Използваме requestAnimationFrame за smooth анимация
        requestAnimationFrame(() => {
            this.tooltip.style.opacity = '1';
            this.tooltip.style.transform = 'translateY(0)';
        });

        this.isVisible = true;
    }

    hide(delay = 200) {
        if (!this.isVisible) return;

        // Забавяне преди скриване за по-добра UX
        this.hideTimeout = setTimeout(() => {
            this.tooltip.style.opacity = '0';
            this.tooltip.style.transform = 'translateY(10px)';

            setTimeout(() => {
                this.tooltip.style.display = 'none';
                this.isVisible = false;
                this.currentSignal = null;
            }, 300);
        }, delay);
    }

    updateContent(signal) {
        const category = SIGNAL_CATEGORIES[signal.category];
        const urgency = URGENCY_LEVELS[signal.urgency];

        // Създаване на avatar за автора
        const authorAvatarHTML = window.avatarUtils ?
            window.avatarUtils.createAvatar(signal.author.imageUrl, signal.author.username, 28, 'tooltip-author-avatar') :
            `<img class="tooltip-author-avatar" src="${signal.author.imageUrl || '/images/default-avatar.png'}" alt="${signal.author.username}" style="width:28px;height:28px;border-radius:50%;">`;

        // Форматиране на датата
        const date = new Date(signal.createdAt);
        const timeAgo = this.formatTimeAgo(date);

        // Опционална снимка
        const imageSection = signal.imageUrl ? `
            <div class="tooltip-image">
                <img src="${signal.imageUrl}" alt="Снимка на сигнала" style="
                    width: 100%;
                    height: 80px;
                    object-fit: cover;
                    border-radius: 8px;
                    margin-bottom: 12px;
                ">
            </div>
        ` : '';

        this.tooltip.innerHTML = `
            <div style="padding: 16px;">
                ${imageSection}
                
                <!-- Header с category и urgency -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        background: ${category.color}15;
                        color: ${category.color};
                        padding: 4px 8px;
                        border-radius: 6px;
                        font-size: 11px;
                        font-weight: 600;
                    ">
                        <i class="${category.icon}"></i>
                        <span>${category.name}</span>
                    </div>
                    
                    <div style="
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        background: ${urgency.color}15;
                        color: ${urgency.color};
                        padding: 3px 6px;
                        border-radius: 4px;
                        font-size: 10px;
                        font-weight: 600;
                    ">
                        <i class="${urgency.icon}"></i>
                        <span>${urgency.name}</span>
                    </div>
                </div>
                
                <!-- Заглавие -->
                <h4 style="
                    margin: 0 0 8px 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: #1f2937;
                    line-height: 1.3;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                ">${signal.title}</h4>
                
                <!-- Описание -->
                <p style="
                    margin: 0 0 12px 0;
                    font-size: 12px;
                    color: #6b7280;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                ">${signal.description}</p>
                
                <!-- Footer с автор и дата -->
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 8px;
                    border-top: 1px solid #f3f4f6;
                ">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${authorAvatarHTML}
                        <span style="
                            font-size: 11px;
                            font-weight: 500;
                            color: #374151;
                        ">${signal.author.username}</span>
                    </div>
                    
                    <span style="
                        font-size: 10px;
                        color: #9ca3af;
                        font-weight: 500;
                    ">${timeAgo}</span>
                </div>
            </div>
        `;
    }

    updatePosition(mouseEvent) {
        if (!mouseEvent || !this.tooltip) return;

        const tooltip = this.tooltip;
        const margin = 15;

        // Получаване на размерите на tooltip-а
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let x = mouseEvent.clientX + margin;
        let y = mouseEvent.clientY - tooltipRect.height - margin;

        // Проверка дали tooltip-ът излиза извън viewport-а хоризонтално
        if (x + tooltipRect.width > viewportWidth - margin) {
            x = mouseEvent.clientX - tooltipRect.width - margin;
        }

        // Проверка дали tooltip-ът излиза извън viewport-а вертикално
        if (y < margin) {
            y = mouseEvent.clientY + margin;
        }

        // Допълнителна проверка за долния край
        if (y + tooltipRect.height > viewportHeight - margin) {
            y = viewportHeight - tooltipRect.height - margin;
        }

        // Ограничаване в границите на viewport-а
        x = Math.max(margin, Math.min(x, viewportWidth - tooltipRect.width - margin));
        y = Math.max(margin, Math.min(y, viewportHeight - tooltipRect.height - margin));

        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
    }

    formatTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'преди момент';
        }

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return `преди ${diffInMinutes} мин`;
        }

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return `преди ${diffInHours} ч`;
        }

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) {
            return `преди ${diffInDays} дни`;
        }

        const diffInWeeks = Math.floor(diffInDays / 7);
        if (diffInWeeks < 4) {
            return `преди ${diffInWeeks} седм`;
        }

        // За по-стари дати показваме датата
        return date.toLocaleDateString('bg-BG', {
            day: 'numeric',
            month: 'short'
        });
    }

    // Метод за почистване при унищожаване
    destroy() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }

        if (this.tooltip && this.tooltip.parentNode) {
            this.tooltip.parentNode.removeChild(this.tooltip);
        }

        this.tooltip = null;
        this.isVisible = false;
        this.currentSignal = null;
    }
}

// ===== GLOBAL TOOLTIP MANAGEMENT =====
let tooltipInstance = null;

function initializeTooltip() {
    // Създаване на tooltip instance само ако не е mobile
    if (!window.mapCore || !window.mapCore.isMobile()) {
        if (tooltipInstance) {
            tooltipInstance.destroy();
        }
        tooltipInstance = new SignalTooltip();
        console.log('Signal tooltip initialized');
    }
}

function destroyTooltip() {
    if (tooltipInstance) {
        tooltipInstance.destroy();
        tooltipInstance = null;
    }
}

// ===== RESIZE HANDLER =====
function handleTooltipResize() {
    const isMobile = window.mapCore && window.mapCore.isMobile();

    if (isMobile && tooltipInstance) {
        // На mobile устройства унищожаваме tooltip-а
        destroyTooltip();
    } else if (!isMobile && !tooltipInstance) {
        // На desktop създаваме tooltip-а ако го няма
        initializeTooltip();
    }
}

// ===== EVENT LISTENERS =====
window.addEventListener('resize', handleTooltipResize);

// Скриване на tooltip при scroll
window.addEventListener('scroll', () => {
    if (tooltipInstance && tooltipInstance.isVisible) {
        tooltipInstance.hide(0);
    }
});

// Скриване на tooltip при ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tooltipInstance && tooltipInstance.isVisible) {
        tooltipInstance.hide(0);
    }
});

// ===== PUBLIC API =====
window.signalTooltip = {
    show: (signal, mouseEvent) => {
        if (tooltipInstance) {
            tooltipInstance.show(signal, mouseEvent);
        }
    },
    hide: (delay) => {
        if (tooltipInstance) {
            tooltipInstance.hide(delay);
        }
    },
    initialize: initializeTooltip,
    destroy: destroyTooltip
};

// ===== AUTO INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Малко забавяне за да се заредят другите компоненти
    setTimeout(() => {
        initializeTooltip();
    }, 500);
});

// Export за modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SignalTooltip, initializeTooltip, destroyTooltip };
}