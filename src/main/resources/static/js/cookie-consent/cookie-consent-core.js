/**
 * Cookie Consent Core Module
 * Управление на съгласието за бисквитки - основна логика
 * GDPR compliant
 * 
 * @version 2.0
 * @author SmolyanVote
 */

(function(window, document) {
    'use strict';

    /**
     * Cookie Consent Core Class
     */
    class CookieConsentCore {
        constructor(options = {}) {
            // Конфигурация
            this.config = {
                cookieName: options.cookieName || 'smolyanvote_cookie_consent',
                cookieExpiry: options.cookieExpiry || 397, // 13 месеца в дни
                cookiePath: options.cookiePath || '/',
                cookieSameSite: options.cookieSameSite || 'Lax',
                cookieSecure: options.cookieSecure !== undefined ? options.cookieSecure : this.isSecureContext(),
                version: '2.0',
                debug: options.debug || false
            };

            // Състояние
            this.consent = null;
            this.listeners = {
                shown: [],
                accepted: [],
                rejected: [],
                changed: []
            };

            // Инициализация
            this.init();
        }

        /**
         * Проверка дали сме в secure context (HTTPS)
         */
        isSecureContext() {
            return window.location.protocol === 'https:' || 
                   window.location.hostname === 'localhost' ||
                   window.location.hostname === '127.0.0.1';
        }

        /**
         * Инициализация на модула
         */
        init() {
            this.loadConsent();
            this.log('Cookie Consent Core initialized', this.consent);
        }

        /**
         * Зареждане на съществуващо съгласие
         */
        loadConsent() {
            try {
                // Първо проверяваме cookie
                const cookieValue = this.getCookie(this.config.cookieName);
                
                if (cookieValue) {
                    try {
                        const parsed = JSON.parse(decodeURIComponent(cookieValue));
                        
                        // Проверка за валидност и версия
                        if (this.isValidConsent(parsed)) {
                            this.consent = parsed;
                            this.log('Consent loaded from cookie', this.consent);
                            return;
                        } else {
                            this.log('Invalid consent found, clearing', parsed);
                            this.clearConsent();
                        }
                    } catch (e) {
                        this.log('Error parsing consent cookie', e);
                        this.clearConsent();
                    }
                }

                // Ако няма cookie, проверяваме localStorage (fallback)
                const storageValue = localStorage.getItem(this.config.cookieName);
                if (storageValue) {
                    try {
                        const parsed = JSON.parse(storageValue);
                        if (this.isValidConsent(parsed)) {
                            this.consent = parsed;
                            // Възстановяваме в cookie
                            this.saveConsent(this.consent.consent, this.consent.preferences);
                            this.log('Consent loaded from localStorage', this.consent);
                            return;
                        }
                    } catch (e) {
                        this.log('Error parsing localStorage consent', e);
                    }
                }

                // Няма валидно съгласие
                this.consent = null;
            } catch (e) {
                this.log('Error loading consent', e);
                this.consent = null;
            }
        }

        /**
         * Проверка дали съгласието е валидно
         */
        isValidConsent(consentData) {
            if (!consentData || typeof consentData !== 'object') {
                return false;
            }

            // Проверка за основно поле
            if (consentData.consent !== 'accepted' && consentData.consent !== 'rejected') {
                return false;
            }

            // Проверка за timestamp
            if (!consentData.timestamp || typeof consentData.timestamp !== 'number') {
                return false;
            }

            // Проверка за изтичане (13 месеца = 397 дни)
            const expiryTime = consentData.timestamp + (this.config.cookieExpiry * 24 * 60 * 60 * 1000);
            if (Date.now() > expiryTime) {
                this.log('Consent expired', {
                    timestamp: consentData.timestamp,
                    expiryTime: expiryTime,
                    now: Date.now()
                });
                return false;
            }

            return true;
        }

        /**
         * Запазване на съгласие
         */
        saveConsent(consent, preferences = {}) {
            try {
                const consentData = {
                    consent: consent, // 'accepted' или 'rejected'
                    timestamp: Date.now(),
                    version: this.config.version,
                    preferences: preferences
                };

                // Запазване в cookie
                const cookieValue = encodeURIComponent(JSON.stringify(consentData));
                const expires = new Date();
                expires.setTime(expires.getTime() + (this.config.cookieExpiry * 24 * 60 * 60 * 1000));
                
                let cookieString = `${this.config.cookieName}=${cookieValue}; expires=${expires.toUTCString()}; path=${this.config.cookiePath}`;
                
                if (this.config.cookieSameSite) {
                    cookieString += `; SameSite=${this.config.cookieSameSite}`;
                }
                
                if (this.config.cookieSecure) {
                    cookieString += `; Secure`;
                }

                document.cookie = cookieString;

                // Запазване в localStorage (fallback)
                try {
                    localStorage.setItem(this.config.cookieName, JSON.stringify(consentData));
                } catch (e) {
                    this.log('localStorage not available', e);
                }

                // Актуализация на състоянието
                const oldConsent = this.consent ? this.consent.consent : null;
                this.consent = consentData;

                // Излъчване на събития
                if (oldConsent !== consent) {
                    this.emit('changed', {
                        oldConsent: oldConsent,
                        newConsent: consent,
                        preferences: preferences
                    });
                }

                if (consent === 'accepted') {
                    this.emit('accepted', { preferences: preferences });
                } else if (consent === 'rejected') {
                    this.emit('rejected', {});
                }

                this.log('Consent saved', consentData);
                return true;
            } catch (e) {
                this.log('Error saving consent', e);
                return false;
            }
        }

        /**
         * Изчистване на съгласие
         */
        clearConsent() {
            try {
                // Изчистване на cookie
                const expires = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
                document.cookie = `${this.config.cookieName}=; ${expires}; path=${this.config.cookiePath}`;
                
                // Изчистване на localStorage
                try {
                    localStorage.removeItem(this.config.cookieName);
                } catch (e) {
                    this.log('Error clearing localStorage', e);
                }

                this.consent = null;
                this.log('Consent cleared');
            } catch (e) {
                this.log('Error clearing consent', e);
            }
        }

        /**
         * Проверка дали има съгласие
         */
        hasConsent() {
            return this.consent !== null && this.isValidConsent(this.consent);
        }

        /**
         * Проверка дали съгласието е прието
         */
        isAccepted() {
            return this.hasConsent() && this.consent.consent === 'accepted';
        }

        /**
         * Проверка дали съгласието е отказано
         */
        isRejected() {
            return this.hasConsent() && this.consent.consent === 'rejected';
        }

        /**
         * Вземане на текущото съгласие
         */
        getConsent() {
            return this.consent ? { ...this.consent } : null;
        }

        /**
         * Вземане на cookie стойност
         */
        getCookie(name) {
            const nameEQ = name + '=';
            const cookies = document.cookie.split(';');
            
            for (let i = 0; i < cookies.length; i++) {
                let cookie = cookies[i];
                while (cookie.charAt(0) === ' ') {
                    cookie = cookie.substring(1, cookie.length);
                }
                if (cookie.indexOf(nameEQ) === 0) {
                    return cookie.substring(nameEQ.length, cookie.length);
                }
            }
            
            return null;
        }

        /**
         * Регистриране на слушател за събития
         */
        on(event, callback) {
            if (this.listeners[event] && typeof callback === 'function') {
                this.listeners[event].push(callback);
            }
        }

        /**
         * Премахване на слушател
         */
        off(event, callback) {
            if (this.listeners[event]) {
                const index = this.listeners[event].indexOf(callback);
                if (index > -1) {
                    this.listeners[event].splice(index, 1);
                }
            }
        }

        /**
         * Излъчване на събитие
         */
        emit(event, data) {
            if (this.listeners[event]) {
                this.listeners[event].forEach(callback => {
                    try {
                        callback(data);
                    } catch (e) {
                        this.log(`Error in event listener for ${event}`, e);
                    }
                });
            }
        }

        /**
         * Логиране (само в debug режим)
         */
        log(message, data) {
            if (this.config.debug) {
                console.log('[CookieConsent]', message, data || '');
            }
        }
    }

    // Експорт на глобалния обект
    window.CookieConsentCore = CookieConsentCore;

    // Автоматична инициализация ако е конфигурирано
    if (window.cookieConsentConfig) {
        window.cookieConsent = new CookieConsentCore(window.cookieConsentConfig);
    }

})(window, document);

