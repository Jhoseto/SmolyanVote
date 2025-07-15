/**
 * Footer Newsletter Functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeNewsletterForm();
});

function initializeNewsletterForm() {
    const newsletterForm = document.getElementById('newsletterForm');
    const emailInput = document.getElementById('newsletterEmail');
    const submitButton = newsletterForm.querySelector('.newsletter-btn');
    const statusDiv = document.getElementById('newsletterStatus');

    if (!newsletterForm) {
        return;
    }

    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleNewsletterSubmit();
    });

    function handleNewsletterSubmit() {
        const email = emailInput.value.trim();

        // Validation
        if (!email) {
            showStatus('error', 'Моля, въведете вашия имейл адрес');
            return;
        }

        if (!isValidEmail(email)) {
            showStatus('error', 'Моля, въведете валиден имейл адрес');
            return;
        }

        // Проверяваме дали потребителят е logged in
        checkAuthenticationAndSubscribe(email);
    }

    function checkAuthenticationAndSubscribe(email) {
        // Проверяваме дали има CSRF token (индикация за logged user)
        const csrfToken = document.querySelector('meta[name="_csrf"]');
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]');

        if (!csrfToken || !csrfHeader) {
            // Няма CSRF token - потребителят не е logged in
            showLoginRequired();
            return;
        }

        // Потребителят е logged in - правим subscription
        subscribeToAllNotifications(csrfToken.content, csrfHeader.content);
    }

    function subscribeToAllNotifications(csrfToken, csrfHeader) {
        setLoadingState(true);

        // Създаваме форма за submission
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/subscription/update';
        form.style.display = 'none';

        // CSRF token
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = csrfHeader.replace('X-', '').toLowerCase();
        csrfInput.value = csrfToken;
        form.appendChild(csrfInput);

        // Subscription type
        const subscriptionInput = document.createElement('input');
        subscriptionInput.type = 'hidden';
        subscriptionInput.name = 'subscriptions';
        subscriptionInput.value = 'ALL_NOTIFICATIONS';
        form.appendChild(subscriptionInput);

        // Redirect URL
        const redirectInput = document.createElement('input');
        redirectInput.type = 'hidden';
        redirectInput.name = 'redirectUrl';
        redirectInput.value = window.location.pathname;
        form.appendChild(redirectInput);

        // Append и submit
        document.body.appendChild(form);
        form.submit();
    }

    function showLoginRequired() {
        showStatus('error', 'Трябва да влезете в профила си за да се абонирате');

        // Показваме login бутон
        setTimeout(() => {
            const loginButton = document.createElement('button');
            loginButton.className = 'newsletter-btn';
            loginButton.innerHTML = '<i class="bi bi-person-plus"></i> Влез в профила';
            loginButton.onclick = function() {
                // Проверяваме дали има login modal
                const loginModal = document.getElementById('loginModal');
                if (loginModal) {
                    // Използваме Bootstrap modal
                    const modal = new bootstrap.Modal(loginModal);
                    modal.show();
                } else {
                    // Redirect към login страница
                    window.location.href = '/viewLogin';
                }
            };

            // Заменяме submit бутона
            submitButton.parentNode.replaceChild(loginButton, submitButton);
        }, 2000);
    }

    function setLoadingState(loading) {
        if (loading) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="bi bi-hourglass-split"></i> Абониране...';
            showStatus('loading', 'Обработваме вашата заявка...');
        } else {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="bi bi-envelope-plus"></i> Абонирай се';
        }
    }

    function showStatus(type, message) {
        statusDiv.className = `newsletter-status ${type}`;
        statusDiv.textContent = message;
        statusDiv.style.display = 'block';

        // Auto-hide след 5 секунди
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                if (statusDiv.classList.contains(type)) {
                    clearStatus();
                }
            }, 5000);
        }
    }

    function clearStatus() {
        statusDiv.style.display = 'none';
        statusDiv.className = 'newsletter-status';
        statusDiv.textContent = '';
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Real-time validation
    emailInput.addEventListener('input', function() {
        clearStatus();
        const email = this.value.trim();

        if (email && !isValidEmail(email)) {
            this.style.borderColor = '#dc3545';
        } else {
            this.style.borderColor = '#4a5568';
        }
    });
}