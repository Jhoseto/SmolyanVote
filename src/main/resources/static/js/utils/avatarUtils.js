// ====== AVATAR UTILITIES ======
// Файл: src/main/resources/static/js/utils/avatarUtils.js
// Универсални функции за работа с user avatars и инициали

class AvatarUtils {
    constructor() {
        this.colors = [
            '#4cb15c', '#2e8b57', '#228b22', '#32cd32', '#6b8e23',
            '#20b2aa', '#4682b4', '#9370db', '#ff6b6b', '#4ecdc4',
            '#45b7d1', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c',
            '#34495e', '#16a085', '#27ae60', '#2980b9', '#8e44ad'
        ];
    }

    // Генерира инициали от username
    getInitials(username) {
        if (!username || username.trim() === '') {
            return 'U'; // Default за User
        }

        const cleanUsername = username.trim();
        const words = cleanUsername.split(' ').filter(word => word.length > 0);

        if (words.length >= 2) {
            // Ако има повече от една дума, вземи първата буква от първите 2 думи
            return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
        } else {
            // Ако има само една дума, вземи първите 2 букви
            const singleWord = words[0] || cleanUsername;
            if (singleWord.length >= 2) {
                return singleWord.substring(0, 2).toUpperCase();
            } else {
                return singleWord.charAt(0).toUpperCase();
            }
        }
    }

    // Генерира уникален цвят за всеки потребител
    getAvatarColor(username) {
        if (!username || username.trim() === '') {
            return this.colors[0]; // Default зелен
        }

        // Генерираме hash от username-а
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }

        return this.colors[Math.abs(hash) % this.colors.length];
    }

    // Проверява дали е валидна снимка
    isValidImageUrl(imageUrl) {
        // Ако няма URL, не е валидна
        if (!imageUrl || typeof imageUrl !== 'string') {
            return false;
        }

        const trimmedUrl = imageUrl.trim();

        // Ако е празен стринг, не е валидна
        if (trimmedUrl === '') {
            return false;
        }

        // Проверява дали не е default avatar (различни варианти)
        const defaultAvatars = [
            '/default-avatar.jpg',
            '/default-avatar.png',
            '/images/default-avatar.png',
            '/images/default-avatar.jpg',
            'default-avatar'
        ];

        // Ако съдържа някой от default стринговете, не е валидна
        for (const defaultAvatar of defaultAvatars) {
            if (trimmedUrl.includes(defaultAvatar)) {
                return false;
            }
        }

        // Ако минава всички проверки, е валидна
        return true;
    }

    // Създава avatar HTML - снимка или инициали
    // Размерът се определя от CSS класовете, не от inline стилове
    createAvatar(imageUrl, username, size = 40, className = 'user-avatar') {
        const hasValidImage = this.isValidImageUrl(imageUrl);
        const initials = this.getInitials(username);
        const color = this.getAvatarColor(username);

        if (hasValidImage) {
            // Връщаме IMG елемент - НЕ използваме avatar-placeholder клас за снимки!
            return `<img class="${className}" 
                        src="${imageUrl}" 
                        alt="${this.escapeHtml(username)}"
                        data-username="${this.escapeHtml(username)}"
                        onerror="window.avatarUtils.handleImageError(this, '${this.escapeHtml(username)}')">`;
        } else {
            // Връщаме DIV с инициали - размерът се контролира от CSS
            // Само color е inline (защото е динамичен), всичко останало е CSS
            return `<div class="${className} avatar-placeholder" 
                        data-username="${this.escapeHtml(username)}"
                        style="background-color: ${color};">
                        ${initials}
                    </div>`;
        }
    }

    // Обработва грешка при зареждане на снимка
    handleImageError(imgElement, username) {
        const className = imgElement.className;
        const initials = this.getInitials(username);
        const color = this.getAvatarColor(username);

        // Заменяме IMG с DIV - размерът се контролира от CSS класовете
        // Само color е inline (защото е динамичен), всичко останало е CSS
        const newDiv = `<div class="${className}" 
                           data-username="${this.escapeHtml(username)}"
                           style="background-color: ${color};">
                           ${initials}
                       </div>`;

        imgElement.outerHTML = newDiv;
    }

    // Escape HTML за безопасност
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Инициализира всички avatars на страницата
    initializeAllAvatars() {
        // Намери всички IMG avatars и добави error handler
        document.querySelectorAll('img.user-avatar, img.author-avatar, img.creator-avatar, img[class*="avatar"]').forEach(img => {
            if (!img.dataset.avatarInitialized) {
                img.dataset.avatarInitialized = 'true';
                const username = img.alt || img.dataset.username || 'User';

                // Добави error handler ако няма
                if (!img.onerror) {
                    img.onerror = () => this.handleImageError(img, username);
                }

                // Провери дали снимката вече е невалидна
                if (!this.isValidImageUrl(img.src)) {
                    this.handleImageError(img, username);
                }
            }
        });

        // Обработи placeholder DIV елементи (за случаите когато няма снимка)
        document.querySelectorAll('.avatar-placeholder').forEach(placeholder => {
            if (!placeholder.dataset.avatarInitialized) {
                placeholder.dataset.avatarInitialized = 'true';
                const username = placeholder.dataset.username || placeholder.getAttribute('data-username') || placeholder.textContent?.trim() || 'User';
                const imageUrl = placeholder.dataset.userImage || placeholder.getAttribute('data-user-image') || null;

                // Ако има data-user-image атрибут, използваме createAvatar() за да създадем правилния avatar (IMG или DIV)
                if (imageUrl !== null) {
                    const size = placeholder.offsetWidth || 40;
                    const className = Array.from(placeholder.classList).filter(c => c !== 'avatar-placeholder').join(' ') || 'user-avatar';
                    const avatarHtml = this.createAvatar(imageUrl, username, size, className);
                    placeholder.outerHTML = avatarHtml;
                    return; // Не продължаваме, защото елементът е заменен
                }

                // Ако няма снимка, попълваме с инициали
                if (!placeholder.textContent || placeholder.textContent.trim() === '') {
                    const initials = this.getInitials(username);
                    const color = this.getAvatarColor(username);
                    placeholder.textContent = initials;
                    placeholder.style.backgroundColor = color;
                    placeholder.style.color = '#ffffff';
                    placeholder.style.fontWeight = '700';
                    placeholder.style.display = 'flex';
                    placeholder.style.alignItems = 'center';
                    placeholder.style.justifyContent = 'center';
                }
            }
        });

        // Обработи avatars които са с inline style background-image
        document.querySelectorAll('[style*="background-image"]').forEach(el => {
            if (el.classList.contains('user-avatar') || el.classList.contains('author-avatar') || el.classList.contains('creator-avatar')) {
                const backgroundImage = el.style.backgroundImage;
                if (backgroundImage && backgroundImage.includes('default-avatar')) {
                    const username = el.dataset.username || el.textContent || 'User';
                    const size = el.offsetWidth || 40;
                    el.outerHTML = this.createAvatar(null, username, size, el.className);
                }
            }
        });
    }

    // Заменя конкретен avatar
    replaceAvatar(selector, imageUrl, username, size = 40) {
        const element = document.querySelector(selector);
        if (element) {
            const className = element.className;
            element.outerHTML = this.createAvatar(imageUrl, username, size, className);
        }
    }

    // Заменя всички avatars за конкретен потребител
    updateUserAvatars(userId, newImageUrl, username) {
        // Намери всички avatars за този потребител
        document.querySelectorAll(`[data-user-id="${userId}"], [data-author-id="${userId}"]`).forEach(container => {
            const avatar = container.querySelector('.user-avatar, .author-avatar');
            if (avatar) {
                const size = avatar.offsetWidth || 40;
                const className = avatar.className;
                avatar.outerHTML = this.createAvatar(newImageUrl, username, size, className);
            }
        });
    }

    // Обновява avatar в create post формата
    updateCreatePostAvatar() {
        const createAvatar = document.querySelector('.create-post-header .user-avatar, .create-post .user-avatar');
        if (createAvatar && window.currentUsername) {
            const size = createAvatar.offsetWidth || 40;
            createAvatar.outerHTML = this.createAvatar(window.currentUserImage, window.currentUsername, size, 'user-avatar');
        }
    }

    // Глобална функция за обновяване на всички avatars
    updateAll() {
        this.initializeAllAvatars();
        this.updateCreatePostAvatar();

        // Обнови всички с error handler
        setTimeout(() => {
            this.initializeAllAvatars();
        }, 100);
    }

    // Следи за нови avatars в DOM-а
    observeNewAvatars() {
        const observer = new MutationObserver((mutations) => {
            let hasNewAvatars = false;

            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        if (node.classList?.contains('user-avatar') ||
                            node.classList?.contains('author-avatar') ||
                            node.querySelector?.('.user-avatar') ||
                            node.querySelector?.('.author-avatar') ||
                            node.querySelector?.('[class*="avatar"]')) {
                            hasNewAvatars = true;
                        }
                    }
                });
            });

            if (hasNewAvatars) {
                setTimeout(() => {
                    this.initializeAllAvatars();
                }, 50);
            }
        });

        // Започни наблюдението
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return observer;
    }
}

// Създай глобален instance
window.avatarUtils = new AvatarUtils();

// Глобални функции за лесно използване
window.getInitials = function (username) {
    return window.avatarUtils.getInitials(username);
};

window.getAvatarColor = function (username) {
    return window.avatarUtils.getAvatarColor(username);
};

window.createAvatar = function (imageUrl, username, size = 40, className = 'user-avatar') {
    return window.avatarUtils.createAvatar(imageUrl, username, size, className);
};

window.handleAvatarError = function (img, username) {
    return window.avatarUtils.handleImageError(img, username);
};

window.updateAllAvatars = function () {
    return window.avatarUtils.updateAll();
};

// Автоматична инициализация при зареждане
document.addEventListener('DOMContentLoaded', () => {
    // Изчакай малко за да се заредят всички елементи
    setTimeout(() => {
        window.avatarUtils.updateAll();
        window.avatarUtils.observeNewAvatars();
    }, 200);
});

// Периодично обновяване за сигурност
setInterval(() => {
    window.avatarUtils.initializeAllAvatars();
}, 3000);

// Export за modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AvatarUtils;
}