// ===== SIGNAL API CLIENT =====

// ===== API CONFIGURATION =====
const API_CONFIG = {
    baseURL: '/signals',
    timeout: 60000, // 60 секунди
    retryAttempts: 3,
    retryDelay: 1000 // 1 секунда
};

// ===== HTTP CLIENT UTILITIES =====
class HTTPClient {
    static async request(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin',
            ...options
        };

        if (!(options.body instanceof FormData)) {
            defaultOptions.headers['Content-Type'] = 'application/json';
        }

        const csrfToken = document.querySelector('meta[name="_csrf"]')?.getAttribute('content');
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.getAttribute('content');

        if (csrfToken && csrfHeader) {
            defaultOptions.headers[csrfHeader] = csrfToken;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

            const response = await fetch(url, {
                ...defaultOptions,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new APIError(
                    `HTTP ${response.status}: ${response.statusText}`,
                    response.status,
                    await response.text()
                );
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            return await response.text();

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new APIError('Заявката беше прекъсната поради timeout', 408);
            }
            throw error;
        }
    }

    static async retryRequest(url, options, maxRetries = API_CONFIG.retryAttempts) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.request(url, options);
            } catch (error) {
                lastError = error;

                if (error instanceof APIError && error.status >= 400 && error.status < 500) {
                    throw error;
                }

                if (attempt === maxRetries) {
                    throw error;
                }

                await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * attempt));
                console.warn(`API retry ${attempt}/${maxRetries} за ${url}:`, error.message);
            }
        }

        throw lastError;
    }
}

// ===== CUSTOM ERROR CLASS =====
class APIError extends Error {
    constructor(message, status = 500, details = null) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.details = details;
    }

    getUserFriendlyMessage() {
        switch (this.status) {
            case 400:
                return 'Невалидни данни. Моля проверете въведената информация.';
            case 401:
                return 'Моля влезте в профила си за да продължите.';
            case 403:
                return 'Нямате права за тази операция.';
            case 404:
                return 'Търсеният ресурс не е намерен.';
            case 408:
                return 'Заявката отне твърде много време. Опитайте отново.';
            case 409:
                return 'Възникна конфликт. Възможно е данните да са променени от друг потребител.';
            case 429:
                return 'Твърде много заявки. Моля изчакайте малко.';
            case 500:
                return 'Възникна грешка в сървъра. Опитайте отново по-късно.';
            case 503:
                return 'Услугата временно не е достъпна. Опитайте отново.';
            default:
                return 'Възникна неочаквана грешка. Моля опитайте отново.';
        }
    }
}

// ===== MAIN SIGNAL API CLASS =====
class SignalAPI {

    // ===== GET LIKED SIGNALS =====
    static async getLikedSignals() {
        try {
            const url = `${API_CONFIG.baseURL}/liked`;
            const response = await HTTPClient.retryRequest(url);
            console.log('✅ Liked signals loaded:', response);
            return response;
        } catch (error) {
            console.warn('Could not load liked signals:', error);
            return [];
        }
    }

    // ===== CREATE NEW SIGNAL =====
    static async createSignal(signalData) {
        try {
            this.validateSignalData(signalData);
            const payload = this.prepareSignalPayload(signalData);

            for (let [key, value] of payload.entries()) {
                if (value instanceof File) {
                    console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
                } else {
                    console.log(`  ${key}: ${value}`);
                }
            }

            const startTime = Date.now();
            const response = await HTTPClient.retryRequest(API_CONFIG.baseURL, {
                method: 'POST',
                body: payload,
                headers: {
                    // НЕ задаваме Content-Type за FormData - браузърът автоматично ще го зададе
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const endTime = Date.now();
            return response;

        } catch (error) {
            console.error('❌ Error creating signal:', error);
            throw new APIError(
                `Грешка при създаване на сигнала: ${error.message}`,
                error.status || 500
            );
        }
    }

    // ===== UPDATE SIGNAL =====
    static async updateSignal(id, signalData) {
        try {
            this.validateSignalData(signalData);
            const payload = this.prepareSignalPayload(signalData);

            const url = `${API_CONFIG.baseURL}/${id}`;
            const response = await HTTPClient.retryRequest(url, {
                method: 'PUT',
                body: payload
            });
            return response;

        } catch (error) {
            throw new APIError(
                `Грешка при обновяване на сигнала: ${error.message}`,
                error.status || 500
            );
        }
    }

    // ===== DELETE SIGNAL =====
    static async deleteSignal(id) {
        try {
            const url = `${API_CONFIG.baseURL}/${id}`;
            const response = await HTTPClient.retryRequest(url, {
                method: 'DELETE'
            });

            console.log('✅ Signal deleted successfully');
            return response;

        } catch (error) {
            console.error('❌ Error deleting signal:', error);
            throw new APIError(
                `Грешка при изтриване на сигнала: ${error.message}`,
                error.status || 500
            );
        }
    }

    // ===== VALIDATION HELPERS =====
    static validateSignalData(data) {
        const errors = [];

        if (!data.title || data.title.trim().length < 5) {
            errors.push('Заглавието трябва да е поне 5 символа');
        }
        if (!data.description || data.description.trim().length < 10) {
            errors.push('Описанието трябва да е поне 10 символа');
        }
        if (!data.category) {
            errors.push('Категорията е задължителна');
        }
        if (!data.urgency) {
            errors.push('Спешността е задължителна');
        }
        if (!data.latitude || !data.longitude) {
            errors.push('Местоположението е задължително');
        }
        if (errors.length > 0) {
            throw new APIError('Валидационни грешки: ' + errors.join(', '), 400);
        }
    }

    static prepareSignalPayload(data) {
        const formData = new FormData();

        formData.append('title', data.title.trim());
        formData.append('description', data.description.trim());
        formData.append('category', data.category);
        formData.append('urgency', data.urgency);
        formData.append('latitude', data.latitude.toString());
        formData.append('longitude', data.longitude.toString());

        if (data.image && data.image instanceof File) {
            formData.append('image', data.image);
        }
        return formData;
    }

    // ===== INCREMENT VIEWS =====
    static async incrementViews(signalId) {
        try {
            const url = `${API_CONFIG.baseURL}/${signalId}`;
            const response = await HTTPClient.retryRequest(url);

            return response;

        } catch (error) {
            console.error('❌ Error incrementing views:', error);
            throw new APIError(
                `Грешка при увеличаване на прегледите: ${error.message}`,
                error.status || 500
            );
        }
    }

    // ===== TOGGLE LIKE =====
    static async toggleLike(signalId) {
        try {
            const url = `${API_CONFIG.baseURL}/${signalId}/like`;
            const response = await HTTPClient.retryRequest(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response;

        } catch (error) {
            console.error('❌ Error toggling like:', error);
            throw new APIError(
                `Грешка при харесване: ${error.message}`,
                error.status || 500
            );
        }
    }
}

// ===== GLOBAL API UTILITIES =====
window.SignalAPI = SignalAPI;
window.APIError = APIError;

// ===== ERROR HANDLER HELPER =====
window.handleAPIError = function(error, context = 'Operation') {
    console.error(`API Error in ${context}:`, error);

    let message = 'Възникна неочаквана грешка';

    if (error instanceof APIError) {
        message = error.getUserFriendlyMessage();
    } else if (error.message) {
        message = error.message;
    }

    if (window.mapCore && window.mapCore.showNotification) {
        window.mapCore.showNotification(message, 'error');
    } else {
        alert(message);
    }
    return message;
};

// ===== LOADING STATE HELPERS =====
window.APILoadingState = {
    isLoading: false,

    setLoading(loading, message = 'Зареждане...') {
        this.isLoading = loading;

        if (window.mapCore && window.mapCore.showLoading) {
            window.mapCore.showLoading(loading, message);
        }

        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, select, textarea, button');
            inputs.forEach(input => {
                input.disabled = loading;
            });
        });
    }
};

// Export за modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SignalAPI, APIError, HTTPClient };
}
