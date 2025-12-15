/**
 * Google Consent Mode v2 Integration
 * Интеграция с Google Consent Mode за GDPR съответствие
 * 
 * @version 2.0
 * @author SmolyanVote
 */

(function(window, document) {
    'use strict';

    /**
     * Google Consent Mode Manager
     */
    class GoogleConsentMode {
        constructor(options = {}) {
            this.config = {
                gtagId: options.gtagId || 'G-9G3Y2XM1JE',
                debug: options.debug || false,
                loadAnalyticsOnConsent: options.loadAnalyticsOnConsent !== false // default true
            };

            this.analyticsLoaded = false;
            this.consentCore = null;
            this.init();
        }

        /**
         * Инициализация
         */
        init() {
            // Инициализация на dataLayer и gtag функция
            window.dataLayer = window.dataLayer || [];
            window.gtag = window.gtag || function() {
                window.dataLayer.push(arguments);
            };

            // Първоначално всичко е DENIED (GDPR compliant)
            this.setDefaultConsent();

            // Чакаме CookieConsentCore да се зареди
            this.waitForConsentCore();
        }

        /**
         * Задаване на първоначално състояние - всичко DENIED
         */
        setDefaultConsent() {
            // Използваме window.gtag за да сме сигурни че е дефиниран
            if (typeof window.gtag === 'function') {
                window.gtag('consent', 'default', {
                    'analytics_storage': 'denied',
                    'ad_storage': 'denied',
                    'ad_user_data': 'denied',
                    'ad_personalization': 'denied',
                    'functionality_storage': 'denied',
                    'personalization_storage': 'denied',
                    'security_storage': 'granted', // Винаги granted за необходимите бисквитки
                    'wait_for_update': 500
                });

                this.log('Default consent set to DENIED');
            } else {
                this.log('gtag not available yet, will be set in topHtmlStyles', 'info');
            }
        }

        /**
         * Чакане CookieConsentCore да се зареди
         */
        waitForConsentCore() {
            const maxAttempts = 50;
            let attempts = 0;

            const checkInterval = setInterval(() => {
                attempts++;

                if (window.cookieConsent) {
                    this.consentCore = window.cookieConsent;
                    this.setupConsentListeners();
                    clearInterval(checkInterval);
                    this.log('CookieConsentCore connected');
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    this.log('CookieConsentCore not found after max attempts', 'error');
                }
            }, 100);
        }

        /**
         * Настройка на слушатели за промени в съгласието
         */
        setupConsentListeners() {
            if (!this.consentCore) {
                return;
            }

            // Проверка на текущото съгласие
            this.updateConsentFromCore();

            // Слушане за промени
            this.consentCore.on('accepted', () => {
                this.handleConsentAccepted();
            });

            this.consentCore.on('rejected', () => {
                this.handleConsentRejected();
            });

            this.consentCore.on('changed', (data) => {
                if (data.newConsent === 'accepted') {
                    this.handleConsentAccepted();
                } else if (data.newConsent === 'rejected') {
                    this.handleConsentRejected();
                }
            });
        }

        /**
         * Актуализация на съгласието от CookieConsentCore
         */
        updateConsentFromCore() {
            if (!this.consentCore) {
                return;
            }

            if (this.consentCore.isAccepted()) {
                this.handleConsentAccepted();
            } else if (this.consentCore.isRejected()) {
                this.handleConsentRejected();
            }
        }

        /**
         * Обработка на прието съгласие
         */
        handleConsentAccepted() {
            this.log('Consent accepted - updating Google Consent Mode');

            // Актуализация на съгласието
            if (typeof window.gtag === 'function') {
                window.gtag('consent', 'update', {
                    'analytics_storage': 'granted',
                    'ad_storage': 'denied', // Не използваме реклами
                    'ad_user_data': 'denied',
                    'ad_personalization': 'denied',
                    'functionality_storage': 'granted',
                    'personalization_storage': 'granted'
                });
            }

            // Зареждане на Google Analytics ако не е зареден
            if (this.config.loadAnalyticsOnConsent && !this.analyticsLoaded) {
                this.loadGoogleAnalytics();
            }
        }

        /**
         * Обработка на отказано съгласие
         */
        handleConsentRejected() {
            this.log('Consent rejected - keeping Google Consent Mode DENIED');

            // Подсигуряваме се че всичко е DENIED
            if (typeof window.gtag === 'function') {
                window.gtag('consent', 'update', {
                    'analytics_storage': 'denied',
                    'ad_storage': 'denied',
                    'ad_user_data': 'denied',
                    'ad_personalization': 'denied',
                    'functionality_storage': 'denied',
                    'personalization_storage': 'denied'
                });
            }
        }

        /**
         * Динамично зареждане на Google Analytics
         */
        loadGoogleAnalytics() {
            if (this.analyticsLoaded) {
                this.log('Google Analytics already loaded');
                return;
            }

            this.log('Loading Google Analytics dynamically');

            // Зареждане на gtag.js скрипт
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.gtagId}`;
            
            script.onload = () => {
                this.log('Google Analytics script loaded');
                
                // Инициализация на Google Analytics
                if (typeof window.gtag === 'function') {
                    window.gtag('js', new Date());
                    window.gtag('config', this.config.gtagId, {
                        'anonymize_ip': true, // GDPR - анонимизиране на IP
                        'allow_google_signals': false, // Не използваме Google Signals
                        'allow_ad_personalization_signals': false
                    });

                    this.analyticsLoaded = true;
                    this.log('Google Analytics initialized');
                } else {
                    this.log('gtag function not available after script load', 'error');
                }
            };

            script.onerror = () => {
                this.log('Error loading Google Analytics script', 'error');
            };

            document.head.appendChild(script);
        }

        /**
         * Логиране
         */
        log(message, level = 'info') {
            if (this.config.debug || level === 'error') {
                const prefix = level === 'error' ? '[GoogleConsentMode ERROR]' : '[GoogleConsentMode]';
                console[level === 'error' ? 'error' : 'log'](prefix, message);
            }
        }
    }

    // Експорт
    window.GoogleConsentMode = GoogleConsentMode;

    // Автоматична инициализация
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.googleConsentConfig) {
                window.googleConsentMode = new GoogleConsentMode(window.googleConsentConfig);
            }
        });
    } else {
        // DOM вече е готов
        if (window.googleConsentConfig) {
            window.googleConsentMode = new GoogleConsentMode(window.googleConsentConfig);
        }
    }

})(window, document);

