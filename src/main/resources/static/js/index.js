document.addEventListener('DOMContentLoaded', () => {
    // Анимация за динамичен текст
    const texts = document.querySelectorAll(".dynamic-text");
    const delays = [2000, 2000, 5000];
    let index = 0;

    function showText(i) {
        texts.forEach((text) => {
            text.classList.remove("active");
        });

        texts[i].classList.add("active");

        setTimeout(() => {
            index = (i + 1) % texts.length;
            showText(index);
        }, delays[i]);
    }

    showText(index);

    // Функция за скролиране до секцията с функции
    function scrollToFeatures() {
        const featuresSection = document.getElementById('platform-features-carousel');
        if (featuresSection) {
            featuresSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
    window.scrollToFeatures = scrollToFeatures; // Глобална достъпност

    // Анимация за статистиката
    const statsContainer = document.querySelector('.stats-container');
    const statItems = document.querySelectorAll('.stat-item');
    let statsAnimated = false;

    const animateNumber = (element, target) => {
        let start = 0;
        const duration = 2000; // 2 секунди
        const startTime = performance.now();

        const update = (currentTime) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const value = Math.floor(progress * target);
            element.textContent = value;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = target;
            }
        };
        requestAnimationFrame(update);
    };

    const animateTitle = (title) => {
        title.style.opacity = '0';
        title.style.transform = 'translateY(20px)';
        title.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        setTimeout(() => {
            title.style.opacity = '1';
            title.style.transform = 'translateY(0)';
        }, 100); // Леко забавяне за ефект
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !statsAnimated) {
                statItems.forEach(item => {
                    const title = item.querySelector('.stat-title');
                    const number = item.querySelector('.stat-number');
                    const target = parseInt(number.dataset.target);
                    animateTitle(title);
                    animateNumber(number, target);
                });
                statsAnimated = true;
                observer.disconnect();
            }
        });
    }, { threshold: 0.5 });

    if (statsContainer) {
        observer.observe(statsContainer);
    }

    // Конфигурация за бисквитките (от вградения HTML скрипт)
    window.acceptCookies = {
        content: 'Използваме аналитични и маркетингови Cookies, за да подобрим изживяването ви при сърфиране на нашия уебсайт и да анализираме трафика. Прочетете повече в <a href="https://www.bg.nationalsample.com/homepage/gdpr" target="_blank">Условия за членство</a>.',
        accept: "Приеми",
        reject: "Отхвърляне",
        manageCookies: "Управление на бисквитките",
        cookieName: "accept_cookies",
        showAnswered: function () {
            return true;
        },
        onAccept: function () {
            window.location.reload();
        },
        afterAction: function (value) {
            document.querySelector('input[name=cookieConsent]').value = value === 'accepted' ? '1' : '';
        }
    };

    // Smartsupp Live Chat скрипт
    var _smartsupp = _smartsupp || {};
    _smartsupp.key = 'f37049fb8ea2553a0a4798457f816636b426372c';
    window.smartsupp || (function(d) {
        var s, c, o = smartsupp = function() { o._.push(arguments); };
        o._ = [];
        s = d.getElementsByTagName('script')[0];
        c = d.createElement('script');
        c.type = 'text/javascript';
        c.charset = 'utf-8';
        c.async = true;
        c.src = 'https://www.smartsuppchat.com/loader.js?';
        s.parentNode.insertBefore(c, s);
    })(document);
});