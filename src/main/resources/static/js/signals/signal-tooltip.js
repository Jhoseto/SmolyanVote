// ===== SIGNAL TOOLTIP =====
// Прост hover tooltip за desktop

let tooltip = null;
let tooltipTimeout = null;

// ===== СЪЗДАВАНЕ НА TOOLTIP =====
function createTooltip() {
    if (tooltip) return;

    tooltip = document.createElement('div');
    tooltip.className = 'signal-tooltip';
    tooltip.style.cssText = `
        position: fixed;
        z-index: 10000;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 12px;
        max-width: 250px;
        font-size: 14px;
        pointer-events: none;
        opacity: 0;
        transform: translateY(5px);
        transition: all 0.2s ease;
        display: none;
    `;
    document.body.appendChild(tooltip);
}

// ===== ПОКАЗВАНЕ НА TOOLTIP =====
// ===== ПОКАЗВАНЕ НА TOOLTIP =====
function showTooltip(signal, mouseEvent) {
    // Само на desktop
    if (window.innerWidth <= 768) return;

    createTooltip();
    if (!tooltip || !signal) return;

    const category = SIGNAL_CATEGORIES[signal.category] || { name: signal.category, icon: 'bi-circle' };
    const urgency = URGENCY_LEVELS[signal.urgency] || { name: signal.urgency };

    tooltip.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <i class="${category.icon}" style="color: ${category.color || '#666'};"></i>
            <strong>${category.name}</strong>
            <span class="urgency-${signal.urgency}" style="
                background: ${urgency.color || '#666'};
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 12px;
            ">${urgency.name}</span>
        </div>
        <div style="font-weight: bold; margin-bottom: 4px;">${signal.title}</div>
        <div style="color: #666; font-size: 12px; display: flex; align-items: center; gap: 6px;">
            ${window.avatarUtils ? window.avatarUtils.createAvatar(signal.author?.imageUrl, signal.author?.username, 20, 'user-avatar') : ''}
           <span>${signal.author?.username || 'Анонимен'} • ${formatDate(signal.createdAt)}</span>
        </div>
    `;

    // Показване първо за да можем да измерим размера
    tooltip.style.display = 'block';
    tooltip.style.opacity = '0';

    // Позициониране след като tooltip-ът е показан
    const tooltipRect = tooltip.getBoundingClientRect();
    const x = mouseEvent.clientX + 10;
    const y = mouseEvent.clientY - tooltipRect.height - 10;

    tooltip.style.left = Math.min(x, window.innerWidth - tooltipRect.width - 20) + 'px';
    tooltip.style.top = Math.max(y, 10) + 'px';

    // Плавно показване
    setTimeout(() => {
        if (tooltip) {
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateY(0)';
        }
    }, 10);

    // Автоматично скриване
    clearTimeout(tooltipTimeout);
    tooltipTimeout = setTimeout(hideTooltip, 3000);
}

// ===== СКРИВАНЕ НА TOOLTIP =====
function hideTooltip() {
    if (!tooltip) return;

    tooltip.style.opacity = '0';
    tooltip.style.transform = 'translateY(5px)';

    setTimeout(() => {
        if (tooltip) tooltip.style.display = 'none';
    }, 200);

    clearTimeout(tooltipTimeout);
}

// ===== HELPER =====
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG');
}

// ===== EVENT LISTENERS =====
function initializeTooltip() {
    // Скриване при scroll или resize
    window.addEventListener('scroll', hideTooltip);
    window.addEventListener('resize', hideTooltip);

    // Скриване при ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hideTooltip();
    });
}

// ===== PUBLIC API =====
window.signalTooltip = {
    show: showTooltip,
    hide: hideTooltip,
    initialize: initializeTooltip
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', initializeTooltip);