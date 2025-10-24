class PublicationsAPI {
    constructor() {
        this.baseUrl = '/publications';
        this.apiUrl = '/publications/api';
        this.csrfToken = document.querySelector('meta[name="_csrf"]')?.getAttribute('content');
        this.csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.getAttribute('content');
    }

    async request(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(this.csrfToken && { [this.csrfHeader]: this.csrfToken })
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, mergedOptions);

            if (!response.ok) {
                const errorText = await response.text();
                throw new APIError(`HTTP ${response.status}: ${response.statusText}`, response.status, errorText);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }

            return await response.text();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    async getPublications(filters = {}, page = 0, size = 10) {
        const params = new URLSearchParams();
        
        Object.keys(filters).forEach(key => {
            const value = filters[key];
            
            if (value !== null && value !== undefined && value !== '') {
                // ✅ КРИТИЧНО: Специална обработка за userIds масив
                if (key === 'userIds' && Array.isArray(value)) {
                    if (value.length > 0) {
                        params.append(key, value.join(','));
                        console.log('🔵 API: Adding userIds to request:', value.join(','));
                    }
                } else if (!Array.isArray(value)) {
                    params.append(key, value);
                }
            }
        });
        
        params.append('page', page);
        params.append('size', size);
        
        const url = `${this.apiUrl}?${params.toString()}`;
        console.log('🌐 API Request URL:', url);
        
        return await this.request(url, {
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    async getPublication(id) {
        const url = `${this.apiUrl}/${id}`;
        return await this.request(url);
    }

    async createPublication(publicationData) {
        return await this.request(this.apiUrl, {
            method: 'POST',
            body: JSON.stringify(publicationData)
        });
    }

    async updatePublication(id, publicationData) {
        const url = `${this.apiUrl}/${id}`;
        return await this.request(url, {
            method: 'PUT',
            body: JSON.stringify(publicationData)
        });
    }

    async deletePublication(id) {
        const url = `${this.apiUrl}/${id}`;
        return await this.request(url, {
            method: 'DELETE'
        });
    }

    // ====== LIKES/DISLIKES ======

    async toggleLike(publicationId) {
        const url = `${this.apiUrl}/${publicationId}/like`;
        return await this.request(url, {
            method: 'POST'
        });
    }

    async toggleDislike(publicationId) {
        const url = `${this.apiUrl}/${publicationId}/dislike`;
        return await this.request(url, {
            method: 'POST'
        });
    }

    // ====== OTHER INTERACTIONS ======

    async toggleBookmark(publicationId) {
        const url = `${this.apiUrl}/${publicationId}/bookmark`;
        return await this.request(url, {
            method: 'POST'
        });
    }

    async sharePublication(publicationId) {
        const url = `${this.apiUrl}/${publicationId}/share`;
        return await this.request(url, {
            method: 'POST'
        });
    }

    async reportPublication(publicationId, reason) {
        const url = `${this.apiUrl}/${publicationId}/report`;
        return await this.request(url, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
    }

    async getStatistics() {
        const url = `${this.apiUrl}/statistics`;
        return await this.request(url);
    }

    async getTrendingTopics() {
        const url = `${this.apiUrl}/trending`;
        return await this.request(url);
    }

    async getActiveAuthors() {
        const url = `${this.apiUrl}/authors/active`;
        return await this.request(url);
    }

    async uploadImage(file, onProgress = null) {
        const formData = new FormData();
        formData.append('image', file);

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        onProgress(percentComplete);
                    }
                });
            }

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (error) {
                        resolve(xhr.responseText);
                    }
                } else {
                    reject(new APIError(`Upload failed: ${xhr.statusText}`, xhr.status, xhr.responseText));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new APIError('Upload failed: Network error', 0, 'Network error'));
            });

            xhr.open('POST', `${this.apiUrl}/upload/image`);
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            if (this.csrfToken) {
                xhr.setRequestHeader(this.csrfHeader, this.csrfToken);
            }

            xhr.send(formData);
        });
    }

    async getUserPreferences() {
        const url = `${this.apiUrl}/user/preferences`;
        return await this.request(url);
    }

    async getUserDrafts(page = 0, size = 10) {
        const url = `${this.apiUrl}/drafts?page=${page}&size=${size}`;
        return await this.request(url);
    }

    async saveDraft(publicationData) {
        const url = `${this.apiUrl}/drafts`;
        return await this.request(url, {
            method: 'POST',
            body: JSON.stringify(publicationData)
        });
    }

    async publishDraft(draftId) {
        const url = `${this.apiUrl}/drafts/${draftId}/publish`;
        return await this.request(url, {
            method: 'POST'
        });
    }

    async getMultiplePublications(ids) {
        const promises = ids.map(id => this.getPublication(id));
        return await Promise.allSettled(promises);
    }

    async preloadNextPage(filters, currentPage, size = 10) {
        try {
            return await this.getPublications(filters, currentPage + 1, size);
        } catch (error) {
            console.warn('Failed to preload next page:', error);
            return null;
        }
    }

    async searchPublications(query, filters = {}, page = 0, size = 10) {
        const allFilters = { ...filters, search: query };
        return await this.getPublications(allFilters, page, size);
    }

    async getSearchSuggestions(query) {
        if (!query || query.length < 2) return [];

        const url = `${this.apiUrl}/search/suggestions?q=${encodeURIComponent(query)}`;
        try {
            return await this.request(url);
        } catch (error) {
            console.warn('Failed to get search suggestions:', error);
            return [];
        }
    }

    async healthCheck() {
        try {
            const response = await fetch(`${this.apiUrl}/health`, {
                method: 'HEAD',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

class APIError extends Error {
    constructor(message, status, response) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.response = response;
    }

    isNetworkError() {
        return this.status === 0 || this.status >= 500;
    }

    isClientError() {
        return this.status >= 400 && this.status < 500;
    }

    isAuthError() {
        return this.status === 401 || this.status === 403;
    }
}

class RetryableAPI extends PublicationsAPI {
    constructor(maxRetries = 3, baseDelay = 1000, maxDelay = 10000) {
        super();
        this.maxRetries = maxRetries;
        this.baseDelay = baseDelay;
        this.maxDelay = maxDelay;
    }

    async request(url, options = {}, retryCount = 0) {
        try {
            return await super.request(url, options);
        } catch (error) {
            if (retryCount < this.maxRetries && this.shouldRetry(error)) {
                const delay = Math.min(
                    this.baseDelay * Math.pow(2, retryCount),
                    this.maxDelay
                );
                await this.delay(delay);
                return this.request(url, options, retryCount + 1);
            }
            throw error;
        }
    }

    shouldRetry(error) {
        return error.isNetworkError() || (error.status >= 500 && error.status < 600);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

class CachedAPI extends PublicationsAPI {
    constructor(cacheSize = 100, cacheTTL = 5 * 60 * 1000) {
        super();
        this.cache = new Map();
        this.cacheSize = cacheSize;
        this.cacheTTL = cacheTTL;
    }

    async request(url, options = {}) {
        if (options.method && options.method !== 'GET') {
            return super.request(url, options);
        }

        const cacheKey = this.getCacheKey(url, options);
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.data;
        }

        const response = await super.request(url, options);
        this.setCache(cacheKey, response);
        return response;
    }

    getCacheKey(url, options) {
        return `${url}_${JSON.stringify(options.headers || {})}`;
    }

    setCache(key, data) {
        if (this.cache.size >= this.cacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }

    invalidateCache(pattern) {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }
}

function createPublicationsAPI(features = {}) {
    let api = PublicationsAPI;

    if (features.retry) {
        api = RetryableAPI;
    } else if (features.cache) {
        api = CachedAPI;
    }

    return new api();
}

document.addEventListener('DOMContentLoaded', () => {
    window.publicationsAPI = createPublicationsAPI({
        retry: true,
        cache: true
    });
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PublicationsAPI, APIError, RetryableAPI, CachedAPI, createPublicationsAPI };
}