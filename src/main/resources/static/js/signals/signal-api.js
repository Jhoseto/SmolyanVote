// ===== SIGNAL API CLIENT =====
// HTTP клиент за комуникация със сървъра за сигналите

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

        // Задаваме Content-Type само ако не е FormData
        if (!(options.body instanceof FormData)) {
            defaultOptions.headers['Content-Type'] = 'application/json';
        }

        // Добавяне на CSRF token ако съществува
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

                // Не правим retry при клиентски грешки (4xx)
                if (error instanceof APIError && error.status >= 400 && error.status < 500) {
                    throw error;
                }

                // Последен опит - хвърляме грешката
                if (attempt === maxRetries) {
                    throw error;
                }

                // Изчакваме преди следващия опит
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

    // ===== GET ALL SIGNALS =====
    static async getAllSignals(filters = {}) {
        try {
            console.log('🔄 Loading signals with filters:', filters);

            // Изграждане на query string
            const queryParams = new URLSearchParams();

            if (filters.category && filters.category !== 'all') {
                queryParams.append('category', filters.category);
            }

            if (filters.urgency && filters.urgency !== 'all') {
                queryParams.append('urgency', filters.urgency);
            }

            if (filters.search && filters.search.trim()) {
                queryParams.append('search', filters.search.trim());
            }

            if (filters.sort) {
                queryParams.append('sort', filters.sort);
            }

            // Пагинация (ако се добави в бъдеще)
            if (filters.page !== undefined) {
                queryParams.append('page', filters.page);
            }

            if (filters.size !== undefined) {
                queryParams.append('size', filters.size);
            }

            const url = `${API_CONFIG.baseURL}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await HTTPClient.retryRequest(url);

            console.log('✅ Signals loaded successfully:', response.length || 0);
            return response;

        } catch (error) {
            console.error('❌ Error loading signals:', error);
            throw new APIError(
                `Грешка при зареждане на сигналите: ${error.message}`,
                error.status || 500
            );
        }
    }

    // ===== GET SIGNAL BY ID =====
    static async getSignalById(id) {
        try {
            console.log('🔄 Loading signal details for ID:', id);

            const url = `${API_CONFIG.baseURL}/${id}`;
            const response = await HTTPClient.retryRequest(url);

            console.log('✅ Signal details loaded successfully');
            return response;

        } catch (error) {
            console.error('❌ Error loading signal details:', error);
            throw new APIError(
                `Грешка при зареждане на детайлите: ${error.message}`,
                error.status || 500
            );
        }
    }

    // ===== CREATE NEW SIGNAL =====
    static async createSignal(signalData) {
        try {
            console.log('🔄 Creating new signal:', signalData);

            // Валидация на данните
            this.validateSignalData(signalData);

            // Подготовка на данните за изпращане
            const payload = this.prepareSignalPayload(signalData);

            // Debug информация за FormData
            console.log('📦 FormData contents:');
            for (let [key, value] of payload.entries()) {
                if (value instanceof File) {
                    console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
                } else {
                    console.log(`  ${key}: ${value}`);
                }
            }

            console.log('🌐 Sending request to:', API_CONFIG.baseURL);
            const startTime = Date.now();

            // Специални опции за FormData
            const response = await HTTPClient.retryRequest(API_CONFIG.baseURL, {
                method: 'POST',
                body: payload,
                headers: {
                    // НЕ задаваме Content-Type за FormData - браузърът автоматично ще го зададе
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const endTime = Date.now();
            console.log(`✅ Signal created successfully in ${endTime - startTime}ms:`, response);
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
            console.log('🔄 Updating signal:', id, signalData);

            this.validateSignalData(signalData);
            const payload = this.prepareSignalPayload(signalData);

            const url = `${API_CONFIG.baseURL}/${id}`;
            const response = await HTTPClient.retryRequest(url, {
                method: 'PUT',
                body: payload
            });

            console.log('✅ Signal updated successfully');
            return response;

        } catch (error) {
            console.error('❌ Error updating signal:', error);
            throw new APIError(
                `Грешка при обновяване на сигнала: ${error.message}`,
                error.status || 500
            );
        }
    }

    // ===== DELETE SIGNAL =====
    static async deleteSignal(id) {
        try {
            console.log('🔄 Deleting signal:', id);

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

        // Добави снимка ако има
        if (data.image && data.image instanceof File) {
            formData.append('image', data.image);
        }

        return formData;
    }

    // ===== INCREMENT VIEWS =====
    static async incrementViews(signalId) {
        try {
            console.log('🔄 Incrementing views for signal:', signalId);

            // Правим GET заявка към сигнала - това автоматично увеличава views в backend-а
            const url = `${API_CONFIG.baseURL}/${signalId}`;
            const response = await HTTPClient.retryRequest(url);

            console.log('✅ Views incremented, updated signal data:', response);
            return response; // Връщаме обновените данни

        } catch (error) {
            console.error('❌ Error incrementing views:', error);
            // Не хвърляме грешка - views increment-ът не трябва да блокира UI-то
            return null;
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

    // Показване на грешката чрез notification system
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

        // Показване на loading индикатор
        if (window.mapCore && window.mapCore.showLoading) {
            window.mapCore.showLoading(loading, message);
        }

        // Деактивиране на формите по време на зареждане
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

console.log('🌐 Signal API Client loaded successfully');