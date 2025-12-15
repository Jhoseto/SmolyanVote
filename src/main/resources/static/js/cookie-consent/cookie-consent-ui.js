/**
 * Cookie Consent UI Module
 * Управление на UI за банер и модал за съгласие
 * 
 * @version 2.0
 * @author SmolyanVote
 */

(function(window, document) {
    'use strict';

    /**
     * Cookie Consent UI Manager
     */
    class CookieConsentUI {
        constructor(options = {}) {
            this.config = {
                bannerId: options.bannerId || 'cookie-consent-banner',
                modalId: options.modalId || 'cookie-consent-modal',
                showBannerOnLoad: options.showBannerOnLoad !== false,
                debug: options.debug || false
            };

            this.consentCore = null;
            this.bannerElement = null;
            this.modalElement = null;
            this.isInitialized = false;

            this.init();
        }

        /**
         * Инициализация
         */
        init() {
            // Чакаме DOM да е готов
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initialize());
            } else {
                this.initialize();
            }
        }

        /**
         * Основна инициализация
         */
        initialize() {
            // Чакаме CookieConsentCore
            this.waitForConsentCore(() => {
                this.setupUI();
                this.checkAndShowBanner();
            });
        }

        /**
         * Чакане CookieConsentCore да се зареди
         */
        waitForConsentCore(callback) {
            const maxAttempts = 50;
            let attempts = 0;

            const checkInterval = setInterval(() => {
                attempts++;

                if (window.cookieConsent) {
                    this.consentCore = window.cookieConsent;
                    clearInterval(checkInterval);
                    this.log('CookieConsentCore connected');
                    if (callback) callback();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    this.log('CookieConsentCore not found', 'error');
                    if (callback) callback(); // Все пак продължаваме
                }
            }, 100);
        }

        /**
         * Настройка на UI елементи
         */
        setupUI() {
            // Проверка за съществуващи елементи
            this.bannerElement = document.getElementById(this.config.bannerId);
            this.modalElement = document.getElementById(this.config.modalId);

            // Ако няма HTML фрагмент, създаваме динамично
            if (!this.bannerElement) {
                this.createBanner();
            }

            // Настройка на event listeners
            this.setupEventListeners();

            this.isInitialized = true;
            this.log('UI initialized');
        }

        /**
         * Създаване на банер динамично (fallback)
         */
        createBanner() {
            const banner = document.createElement('div');
            banner.id = this.config.bannerId;
            banner.className = 'cookie-consent-banner';
            banner.setAttribute('role', 'dialog');
            banner.setAttribute('aria-label', 'Cookie съгласие');
            banner.setAttribute('aria-live', 'polite');

            banner.innerHTML = `
                <div class="cookie-consent-content">
                    <div class="cookie-consent-text">
                        <p>Използваме аналитични Cookies, за да подобрим изживяването ви при сърфиране на нашия уебсайт и да анализираме трафика. Прочетете повече в <a href="/terms-and-conditions#cookies" target="_blank">Условия за ползване</a>.</p>
                    </div>
                    <div class="cookie-consent-actions">
                        <button type="button" class="cookie-consent-btn cookie-consent-reject" aria-label="Откажи бисквитките">
                            Откажи
                        </button>
                        <button type="button" class="cookie-consent-btn cookie-consent-accept" aria-label="Приеми бисквитките">
                            Приеми всички
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(banner);
            this.bannerElement = banner;
        }

        /**
         * Настройка на event listeners
         */
        setupEventListeners() {
            if (!this.bannerElement) {
                return;
            }

            // Бутон за приемане
            const acceptBtn = this.bannerElement.querySelector('.cookie-consent-accept');
            if (acceptBtn) {
                acceptBtn.addEventListener('click', () => this.handleAccept());
            }

            // Бутон за отказ
            const rejectBtn = this.bannerElement.querySelector('.cookie-consent-reject');
            if (rejectBtn) {
                rejectBtn.addEventListener('click', () => this.handleReject());
            }

            // Бутон за управление (ако съществува)
            const manageBtn = this.bannerElement.querySelector('.cookie-consent-manage');
            if (manageBtn) {
                manageBtn.addEventListener('click', () => this.showManageModal());
            }
        }

        /**
         * Проверка и показване на банер
         */
        checkAndShowBanner() {
            if (!this.config.showBannerOnLoad) {
                return;
            }

            // Проверяваме дали има съгласие
            if (this.consentCore && this.consentCore.hasConsent()) {
                this.log('Consent exists, hiding banner');
                this.hideBanner();
                return;
            }

            // Показваме банер
            this.showBanner();
        }

        /**
         * Показване на банер
         */
        showBanner() {
            if (!this.bannerElement) {
                return;
            }

            this.bannerElement.classList.add('cookie-consent-visible');
            this.bannerElement.setAttribute('aria-hidden', 'false');

            // Излъчване на събитие
            if (this.consentCore) {
                this.consentCore.emit('shown', {});
            }

            this.log('Banner shown');
        }

        /**
         * Скриване на банер
         */
        hideBanner() {
            if (!this.bannerElement) {
                return;
            }

            this.bannerElement.classList.remove('cookie-consent-visible');
            this.bannerElement.setAttribute('aria-hidden', 'true');

            this.log('Banner hidden');
        }

        /**
         * Обработка на приемане
         */
        handleAccept() {
            this.log('Accept clicked');

            if (this.consentCore) {
                this.consentCore.saveConsent('accepted', {
                    analytics: true
                });
            }

            this.hideBanner();
        }

        /**
         * Обработка на отказ
         */
        handleReject() {
            this.log('Reject clicked');

            if (this.consentCore) {
                this.consentCore.saveConsent('rejected', {
                    analytics: false
                });
            }

            this.hideBanner();
        }

        /**
         * Показване на модал за управление
         */
        showManageModal() {
            this.log('Show manage modal');
            
            // Ако няма модал, създаваме го
            if (!this.modalElement) {
                this.createManageModal();
            }

            // Актуализираме checkbox стойността според текущото съгласие
            if (this.modalElement && this.consentCore) {
                const currentConsent = this.consentCore.getConsent();
                const analyticsCheckbox = this.modalElement.querySelector('#cookie-pref-analytics');
                if (analyticsCheckbox) {
                    analyticsCheckbox.checked = currentConsent && currentConsent.consent === 'accepted';
                }
            }

            if (this.modalElement) {
                this.modalElement.classList.add('cookie-consent-modal-visible');
                this.modalElement.setAttribute('aria-hidden', 'false');
            }
        }

        /**
         * Скриване на модал за управление
         */
        hideManageModal() {
            if (this.modalElement) {
                this.modalElement.classList.remove('cookie-consent-modal-visible');
                this.modalElement.setAttribute('aria-hidden', 'true');
            }
        }

        /**
         * Създаване на модал за управление
         */
        createManageModal() {
            const modal = document.createElement('div');
            modal.id = this.config.modalId;
            modal.className = 'cookie-consent-modal';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-label', 'Управление на бисквитките');
            modal.setAttribute('aria-hidden', 'true');

            const currentConsent = this.consentCore ? this.consentCore.getConsent() : null;
            const isAccepted = currentConsent && currentConsent.consent === 'accepted';

            modal.innerHTML = `
                <div class="cookie-consent-modal-overlay" aria-label="Затвори"></div>
                <div class="cookie-consent-modal-content">
                    <div class="cookie-consent-modal-header">
                        <h2>Управление на бисквитките</h2>
                        <button type="button" class="cookie-consent-modal-close" aria-label="Затвори">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="cookie-consent-modal-body">
                        <p>Можете да управлявате вашите предпочитания за бисквитките тук.</p>
                        
                        <div class="cookie-consent-preference">
                            <label class="cookie-consent-switch">
                                <input type="checkbox" ${isAccepted ? 'checked' : ''} id="cookie-pref-analytics">
                                <span class="cookie-consent-slider"></span>
                            </label>
                            <div class="cookie-consent-preference-info">
                                <strong>Аналитични бисквитки</strong>
                                <p>Помагат ни да разберем как посетителите използват сайта ни.</p>
                            </div>
                        </div>

                        <div class="cookie-consent-info">
                            <p>За повече информация вижте нашата <a href="/terms-and-conditions#cookies" target="_blank">Cookie политика</a>.</p>
                        </div>
                    </div>
                    <div class="cookie-consent-modal-footer">
                        <button type="button" class="cookie-consent-btn cookie-consent-reject">Откажи всички</button>
                        <button type="button" class="cookie-consent-btn cookie-consent-accept">Запази предпочитания</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            this.modalElement = modal;

            // Event listeners за модала
            const closeBtn = modal.querySelector('.cookie-consent-modal-close');
            const overlay = modal.querySelector('.cookie-consent-modal-overlay');
            const saveBtn = modal.querySelector('.cookie-consent-accept');
            const rejectBtn = modal.querySelector('.cookie-consent-reject');

            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hideManageModal());
            }

            if (overlay) {
                overlay.addEventListener('click', () => this.hideManageModal());
            }

            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    const analyticsCheckbox = modal.querySelector('#cookie-pref-analytics');
                    const analyticsChecked = analyticsCheckbox ? analyticsCheckbox.checked : false;
                    if (this.consentCore) {
                        this.consentCore.saveConsent(
                            analyticsChecked ? 'accepted' : 'rejected',
                            { analytics: analyticsChecked }
                        );
                    }
                    this.hideManageModal();
                });
            }

            if (rejectBtn) {
                rejectBtn.addEventListener('click', () => {
                    if (this.consentCore) {
                        this.consentCore.saveConsent('rejected', { analytics: false });
                    }
                    this.hideManageModal();
                });
            }

            // ESC key за затваряне
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('cookie-consent-modal-visible')) {
                    this.hideManageModal();
                }
            });
        }

        /**
         * Логиране
         */
        log(message, level = 'info') {
            if (this.config.debug || level === 'error') {
                const prefix = level === 'error' ? '[CookieConsentUI ERROR]' : '[CookieConsentUI]';
                console[level === 'error' ? 'error' : 'log'](prefix, message);
            }
        }
    }

    // Експорт
    window.CookieConsentUI = CookieConsentUI;

    // Автоматична инициализация
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.cookieConsentUIConfig) {
                window.cookieConsentUI = new CookieConsentUI(window.cookieConsentUIConfig);
            }
        });
    } else {
        if (window.cookieConsentUIConfig) {
            window.cookieConsentUI = new CookieConsentUI(window.cookieConsentUIConfig);
        }
    }

})(window, document);

