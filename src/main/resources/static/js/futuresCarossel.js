document.addEventListener("DOMContentLoaded", () => {
    const carousel = document.getElementById("featureCarousel");
    const items = Array.from(carousel.querySelectorAll(".carousel-item"));
    const total = items.length;

    // Задаваме draggable="false" на всички изображения
    items.forEach(item => {
        const images = item.querySelectorAll("img");
        images.forEach(img => img.setAttribute("draggable", "false"));
    });

    let radiusX = 480;
    let radiusZ = 300;
    const centerY = 0;

    if (window.innerWidth <= 768) {
        radiusX = 220;
        radiusZ = 140;
    }

    let rotation = 0;
    const rotationStep = (2 * Math.PI) / total;
    let velocity = 0;
    const friction = 0.95; // Намалена фрикция за по-динамична инерция
    let lastVelocity = 0; // Запазваме последната скорост за инерция

    function updatePositions() {
        let maxZ = -Infinity;
        let maxIndex = 0;

        for (let i = 0; i < total; i++) {
            const angle = rotation + i * rotationStep;
            const x = Math.cos(angle) * radiusX;
            const z = Math.sin(angle) * radiusZ;

            const scale = 0.7 + ((z + radiusZ) / (2 * radiusZ)) * 0.3;
            const opacity = 0.4 + ((z + radiusZ) / (2 * radiusZ)) * 0.6;
            const zIndex = Math.round(z * 100);

            items[i].style.transform = `translate3d(${x}px, ${centerY}px, ${z}px) scale(${scale})`;
            items[i].style.opacity = opacity;
            items[i].style.zIndex = zIndex;

            if (z > maxZ) {
                maxZ = z;
                maxIndex = i;
            }
        }

        items.forEach((item, idx) => {
            item.classList.toggle("active", idx === maxIndex);
        });
        items[maxIndex].style.zIndex = 10;
    }

    let animationFrameId;
    let isInteracting = false;

    function animate() {
        if (isInteracting) {
            // Не прилагаме инерция или автоматично въртене по време на влачене
            animationFrameId = requestAnimationFrame(animate);
            return;
        }

        if (velocity !== 0) {
            rotation += velocity;
            velocity *= friction;
            if (Math.abs(velocity) < 0.0001) {
                velocity = 0; // Спираме, когато скоростта е твърде малка
            }
            velocity = Math.max(Math.min(velocity, 0.1), -0.1); // Ограничаваме скоростта
        } else {
            rotation += 0.0015; // Автоматично въртене, когато няма инерция
        }

        updatePositions();
        animationFrameId = requestAnimationFrame(animate);
    }

    function startAnimation() {
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(animate);
        }
    }

    function stopAnimation() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    let restartTimeoutId;

    function resetRestartTimer() {
        if (restartTimeoutId) clearTimeout(restartTimeoutId);
        restartTimeoutId = setTimeout(() => {
            isInteracting = false;
            startAnimation();
        }, 1000);
    }

    function userInteracted() {
        isInteracting = true;
        stopAnimation();
        resetRestartTimer();
    }

    carousel.addEventListener("wheel", (e) => {
        e.preventDefault();
        userInteracted();
        const sensitivity = 0.3;
        rotation += (e.deltaY > 0 ? -rotationStep * sensitivity : rotationStep * sensitivity);
        velocity = 0; // Без инерция при скрол
        updatePositions();
    }, { passive: false });

    let isTouching = false;
    let touchStartX = 0;
    let lastTouchX = 0;
    let rotationStart = 0;
    let lastTouchTime = 0;

    carousel.addEventListener("touchstart", (e) => {
        userInteracted();
        isTouching = true;
        touchStartX = e.touches[0].clientX;
        lastTouchX = touchStartX;
        rotationStart = rotation;
        velocity = 0;
        lastTouchTime = performance.now();
    });

    carousel.addEventListener("touchmove", (e) => {
        if (!isTouching) return;
        const currentX = e.touches[0].clientX;
        const deltaX = currentX - lastTouchX;
        const currentTime = performance.now();
        const deltaTime = (currentTime - lastTouchTime) / 1000;
        const swipeSensitivity = 0.005; // Намалена чувствителност (от 0.01 на 0.005)

        if (deltaTime > 0 && deltaTime < 0.1) {
            lastVelocity = -deltaX * swipeSensitivity * 15; // Намален множител (от 30 на 15)
        }

        rotation = rotationStart - (currentX - touchStartX) * swipeSensitivity;
        velocity = 0; // Нулираме velocity по време на влачене
        updatePositions();
        lastTouchX = currentX;
        lastTouchTime = currentTime;
    });

    carousel.addEventListener("touchend", () => {
        isTouching = false;
        velocity = Math.abs(lastVelocity) > 0.02 ? lastVelocity * 0.3 : 0; // Намалена инерция (от 0.5 на 0.3)
        isInteracting = false;
        startAnimation();
    });

    carousel.addEventListener("touchcancel", () => {
        isTouching = false;
        velocity = 0;
        resetRestartTimer();
    });

    let isDragging = false;
    let dragStartX = 0;
    let dragRotationStart = 0;
    let lastDragX = 0;
    let lastDragTime = 0;

    carousel.addEventListener("mousedown", (e) => {
        e.preventDefault();
        userInteracted();
        isDragging = true;
        dragStartX = e.clientX;
        lastDragX = dragStartX;
        dragRotationStart = rotation;
        velocity = 0; // Нулираме velocity при старт на влачене
        lastDragTime = performance.now();
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const currentX = e.clientX;
        const deltaX = currentX - lastDragX;
        const currentTime = performance.now();
        const deltaTime = (currentTime - lastDragTime) / 1000;
        const dragSensitivity = 0.002;

        if (deltaTime > 0 && deltaTime < 0.1) {
            lastVelocity = -deltaX * dragSensitivity * 30; // Запазваме скоростта
        }

        rotation = dragRotationStart - (currentX - dragStartX) * dragSensitivity;
        velocity = 0; // Нулираме velocity по време на влачене за плавност
        updatePositions();
        lastDragX = currentX;
        lastDragTime = currentTime;
    });

    document.addEventListener("mouseup", () => {
        if (isDragging) {
            isDragging = false;
            velocity = Math.abs(lastVelocity) > 0.02 ? lastVelocity * 0.5 : 0; // Инерция само при бързо движение
            isInteracting = false;
            startAnimation(); // Рестартираме анимацията веднага
        }
    });


    window.addEventListener("resize", () => {
        radiusX = window.innerWidth <= 768 ? 220 : 480;
        radiusZ = window.innerWidth <= 768 ? 140 : 300;
        updatePositions();
    });

    updatePositions();
    startAnimation();
});