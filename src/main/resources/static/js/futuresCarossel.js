document.addEventListener("DOMContentLoaded", () => {
    const carousel = document.getElementById("featureCarousel");  // Основен елемент на карусела
    const items = Array.from(carousel.querySelectorAll(".carousel-item"));  // Всички feature-карти
    const total = items.length;

// Параметри на елипсата (за 3D подреждане), по подразбиране за desktop
    let radiusX = 480;  // радиус по хоризонтала
    let radiusZ = 300;  // радиус по дълбочина (перспектива)
    const centerY = 0;

// Ако е на мобилен (ширина <= 768px), намаляваме радиусите
    if (window.innerWidth <= 768) {
        radiusX = 220;
        radiusZ = 140;
    }

    let rotation = 0;  // Текуща ротация в радиани
    const rotationStep = (2 * Math.PI) / total;  // Разстояние между картите по елипсата

    /**
     * Обновява позицията, скейла, прозрачността и zIndex-а на всички карти
     */
    function updatePositions() {
        let maxZ = -Infinity;
        let maxIndex = 0;

        for (let i = 0; i < total; i++) {
            const angle = rotation + i * rotationStep;

            const x = Math.cos(angle) * radiusX;
            const z = Math.sin(angle) * radiusZ;

            const scale = 0.7 + ((z + radiusZ) / (2 * radiusZ)) * 0.3;
            const opacity = 0.4 + ((z + radiusZ) / (2 * radiusZ)) * 0.6;

            items[i].style.transform = `translate3d(${x}px, ${centerY}px, ${z}px) scale(${scale})`;
            items[i].style.opacity = opacity;
            items[i].style.zIndex = 1;

            // Откриваме най-отпред стоящата карта по z
            if (z > maxZ) {
                maxZ = z;
                maxIndex = i;
            }
        }

        // Подчертаваме най-близката карта
        items.forEach((item, idx) => {
            item.classList.toggle("active", idx === maxIndex);
        });
        items[maxIndex].style.zIndex = 10;
    }

    // requestAnimationFrame ID за спиране на анимацията
    let animationFrameId;

    /**
     * Плавна автоматична анимация (въртене)
     */
    function animate() {
        rotation += 0.0015;  // Можеш да коригираш скоростта
        updatePositions();
        animationFrameId = requestAnimationFrame(animate);
    }

    function startAnimation() {
        if (!animationFrameId) {
            animate();
        }
    }

    function stopAnimation() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    // Таймер за рестарт на анимацията след 2 секунди бездействие
    let restartTimeoutId;

    function resetRestartTimer() {
        if (restartTimeoutId) {
            clearTimeout(restartTimeoutId);
        }
        restartTimeoutId = setTimeout(() => {
            startAnimation();
        }, 2000);
    }

    // Слушаме за потребителско взаимодействие, за да спрем анимацията и рестартираме таймера
    function userInteracted() {
        stopAnimation();
        resetRestartTimer();
    }

    // Hover спира и стартира автоматичната анимация
    carousel.addEventListener("mouseenter", () => {
        userInteracted();
    });
    carousel.addEventListener("mouseleave", () => {
        resetRestartTimer();
    });

    // Scroll с мишката — въртене напред/назад
    carousel.addEventListener("wheel", (e) => {
        e.preventDefault();
        userInteracted();
        rotation += (e.deltaY > 0 ? -rotationStep : rotationStep);
        updatePositions();
    });

    // --- Swipe (плъзгане с пръст) support ---
    let isTouching = false;
    let touchStartX = 0;
    let lastTouchX = 0;
    let rotationStart = 0;  // въртенето при начало на swipe

    carousel.addEventListener("touchstart", (e) => {
        userInteracted();
        isTouching = true;
        touchStartX = e.touches[0].clientX;
        lastTouchX = touchStartX;
        rotationStart = rotation; // Запомняме текущото въртене
    });

    carousel.addEventListener("touchmove", (e) => {
        if (!isTouching) return;

        const currentX = e.touches[0].clientX;
        const deltaX = currentX - touchStartX;  // спрямо началото на swipe, не спрямо lastTouchX

        // Чувствителност за колко пиксела да прави пълен оборот
        const swipeSensitivity = 0.005; // може да коригираш

        rotation = rotationStart - deltaX * swipeSensitivity;
        updatePositions();

        lastTouchX = currentX;
    });

    carousel.addEventListener("touchend", (e) => {
        isTouching = false;
        updatePositions();
        resetRestartTimer();
    });

    carousel.addEventListener("touchcancel", () => {
        isTouching = false;
        resetRestartTimer();
    });

    // Също слушаме за mouse drag, за да спрем анимацията при плъзгане с мишка (по желание)
    let isDragging = false;
    let dragStartX = 0;
    let dragRotationStart = 0;

    carousel.addEventListener("mousedown", (e) => {
        userInteracted();
        isDragging = true;
        dragStartX = e.clientX;
        dragRotationStart = rotation;
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - dragStartX;
        const dragSensitivity = 0.001;
        rotation = dragRotationStart - deltaX * dragSensitivity;
        updatePositions();
    });

    document.addEventListener("mouseup", (e) => {
        if (isDragging) {
            isDragging = false;
            resetRestartTimer();
        }
    });

    // Инициализация
    updatePositions();
    startAnimation();
});
