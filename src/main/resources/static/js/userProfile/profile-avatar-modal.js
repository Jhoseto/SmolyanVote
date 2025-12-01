(() => {
    class ProfileAvatarModal {
        constructor() {
            this.modal = document.getElementById('profileAvatarModal');
            if (!this.modal) return;

            this.imageWrapper = document.getElementById('profileAvatarModalImageWrapper');
            this.viewport = document.getElementById('profileAvatarViewport');
            this.zoomValueEl = document.getElementById('profileAvatarZoomValue');
            this.loadingTemplate = this.viewport?.querySelector('.profile-avatar-modal__loading');

            this.zoomInBtn = document.getElementById('profileAvatarZoomIn');
            this.zoomOutBtn = document.getElementById('profileAvatarZoomOut');
            this.zoomResetBtn = document.getElementById('profileAvatarZoomReset');

            this.activeTrigger = null;
            this.zoomLayer = null;
            this.controlsEnabled = false;

            this.zoom = 1;
            this.translateX = 0;
            this.translateY = 0;
            this.zoomMin = 1;
            this.zoomMax = 4;
            this.zoomStep = 0.25;

            this.isDragging = false;
            this.activePointerId = null;
            this.startPointer = { x: 0, y: 0 };
            this.startTranslate = { x: 0, y: 0 };

            this.handlePointerDown = this.handlePointerDown.bind(this);
            this.handlePointerMove = this.handlePointerMove.bind(this);
            this.handlePointerUp = this.handlePointerUp.bind(this);

            this.bindTriggers();
            this.bindEvents();
            this.bindZoomControls();
        }

        bindTriggers() {
            const avatarContainers = document.querySelectorAll('.profile-header-card .avatar-container, .profile-header-card .profile-avatar');

            avatarContainers.forEach(container => {
                container.addEventListener('click', (event) => {
                    event.preventDefault();
                    const data = this.extractAvatarData(event.currentTarget);
                    this.open(data);
                });
            });
        }

        bindEvents() {
            this.modal.querySelectorAll('[data-avatar-modal-close]').forEach(btn => {
                btn.addEventListener('click', () => this.close());
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.modal.classList.contains('is-open')) {
                    this.close();
                }
            });

            if (this.viewport) {
                this.viewport.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
                this.viewport.addEventListener('dblclick', () => this.toggleZoom());
            }
        }

        bindZoomControls() {
            this.setZoomControlsEnabled(false);
            this.updateZoomValue();

            this.zoomInBtn?.addEventListener('click', () => this.adjustZoom(this.zoomStep));
            this.zoomOutBtn?.addEventListener('click', () => this.adjustZoom(-this.zoomStep));
            this.zoomResetBtn?.addEventListener('click', () => this.resetTransform());
        }

        extractAvatarData(target) {
            const container = target.closest('.avatar-container') || target;

            const imageUrl = container?.dataset.userImage?.trim() ||
                container?.querySelector('[data-user-image]')?.dataset.userImage?.trim() ||
                container?.querySelector('img')?.getAttribute('src') ||
                '';

            const username = container?.dataset.username?.trim() ||
                container?.querySelector('[data-username]')?.dataset.username?.trim() ||
                document.querySelector('.username')?.textContent?.trim() ||
                'Потребител';

            return { imageUrl, username };
        }

        open({ imageUrl, username }) {
            if (!this.modal) return;

            this.activeTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;

            this.modal.classList.add('is-open');
            document.body.classList.add('profile-avatar-modal-open');

            this.resetTransform();
            this.renderImage(imageUrl, username);

            this.modal.querySelector('.profile-avatar-modal__close')?.focus();
        }

        close() {
            this.modal.classList.remove('is-open');
            document.body.classList.remove('profile-avatar-modal-open');

            this.zoomLayer = null;
            this.setZoomControlsEnabled(false);
            this.isDragging = false;
            this.activePointerId = null;

            if (this.activeTrigger && typeof this.activeTrigger.focus === 'function') {
                this.activeTrigger.focus();
            }
            this.activeTrigger = null;
        }

        renderImage(imageUrl, username) {
            if (!this.viewport) return;

            this.showLoading();
            this.resetTransform();
            this.setZoomControlsEnabled(false);

            if (this.hasValidImage(imageUrl)) {
                const resolvedUrl = this.resolveUrl(imageUrl);
                const img = new Image();
                img.alt = username ? `Профилна снимка на ${username}` : 'Профилна снимка';
                img.className = 'profile-avatar-modal__image';
                img.draggable = false;

                img.onload = () => {
                    this.injectZoomLayer(img, true);
                };

                img.onerror = () => {
                    this.renderPlaceholder(username);
                };

                img.src = resolvedUrl;
            } else {
                this.renderPlaceholder(username);
            }
        }

        renderPlaceholder(username) {
            if (!this.viewport) return;

            let placeholderElement;

            if (window.avatarUtils) {
                const html = window.avatarUtils.createAvatar(
                    null,
                    username,
                    200,
                    'profile-avatar-modal__placeholder'
                );
                const template = document.createElement('template');
                template.innerHTML = html.trim();
                placeholderElement = template.content.firstElementChild;
            } else {
                const placeholder = document.createElement('div');
                placeholder.className = 'profile-avatar-modal__placeholder';
                placeholder.textContent = (username || 'Потребител').substring(0, 2).toUpperCase();
                placeholderElement = placeholder;
            }

            this.injectZoomLayer(placeholderElement, false);
        }

        injectZoomLayer(contentNode, enableControls) {
            if (!this.viewport) return;

            this.viewport.innerHTML = '';

            const layer = document.createElement('div');
            layer.className = 'profile-avatar-modal__zoom-layer';
            layer.appendChild(contentNode);

            this.viewport.appendChild(layer);
            this.zoomLayer = layer;

            this.resetTransform();
            this.setZoomControlsEnabled(enableControls);

            this.zoomLayer.addEventListener('pointerdown', this.handlePointerDown);
            this.zoomLayer.addEventListener('pointermove', this.handlePointerMove);
            this.zoomLayer.addEventListener('pointerup', this.handlePointerUp);
            this.zoomLayer.addEventListener('pointercancel', this.handlePointerUp);
        }

        adjustZoom(delta) {
            if (!this.controlsEnabled) return;
            this.setZoom(this.zoom + delta);
        }

        toggleZoom() {
            if (!this.controlsEnabled) return;
            const target = this.zoom > this.zoomMin ? this.zoomMin : Math.min(2, this.zoomMax);
            this.setZoom(target);
        }

        setZoom(value) {
            if (!this.zoomLayer) return;

            const nextZoom = Math.min(this.zoomMax, Math.max(this.zoomMin, Number(value)));
            if (Number.isNaN(nextZoom) || nextZoom === this.zoom) return;

            if (nextZoom === this.zoomMin) {
                this.translateX = 0;
                this.translateY = 0;
            } else {
                const ratio = nextZoom / this.zoom;
                this.translateX *= ratio;
                this.translateY *= ratio;
            }

            this.zoom = Number(nextZoom.toFixed(2));
            this.applyTransform();
        }

        resetTransform() {
            this.zoom = 1;
            this.translateX = 0;
            this.translateY = 0;
            this.applyTransform(true);
        }

        applyTransform(skipClamp = false) {
            if (!this.zoomLayer) {
                this.updateZoomValue();
                return;
            }

            if (!skipClamp) {
                this.clampTranslation();
            }

            this.zoomLayer.style.transform = `translate3d(${this.translateX}px, ${this.translateY}px, 0) scale(${this.zoom})`;
            this.updateZoomValue();
        }

        clampTranslation() {
            if (!this.zoomLayer || !this.viewport) return;

            const content = this.zoomLayer.firstElementChild;
            if (!content) return;

            const baseWidth = content.naturalWidth || content.videoWidth || content.offsetWidth || this.viewport.offsetWidth;
            const baseHeight = content.naturalHeight || content.videoHeight || content.offsetHeight || this.viewport.offsetHeight;
            const wrapperWidth = this.viewport.clientWidth;
            const wrapperHeight = this.viewport.clientHeight;

            const scaledWidth = baseWidth * this.zoom;
            const scaledHeight = baseHeight * this.zoom;

            const maxX = Math.max(0, (scaledWidth - wrapperWidth) / 2);
            const maxY = Math.max(0, (scaledHeight - wrapperHeight) / 2);

            this.translateX = Math.min(maxX, Math.max(-maxX, this.translateX));
            this.translateY = Math.min(maxY, Math.max(-maxY, this.translateY));
        }

        handlePointerDown(event) {
            if (!this.controlsEnabled || this.zoom <= 1 || !this.zoomLayer) return;

            this.isDragging = true;
            this.activePointerId = event.pointerId;
            this.startPointer = { x: event.clientX, y: event.clientY };
            this.startTranslate = { x: this.translateX, y: this.translateY };

            this.zoomLayer.classList.add('is-dragging');
            this.zoomLayer.setPointerCapture(event.pointerId);
        }

        handlePointerMove(event) {
            if (!this.isDragging || event.pointerId !== this.activePointerId || !this.zoomLayer) return;

            const deltaX = event.clientX - this.startPointer.x;
            const deltaY = event.clientY - this.startPointer.y;

            this.translateX = this.startTranslate.x + deltaX;
            this.translateY = this.startTranslate.y + deltaY;

            this.applyTransform();
        }

        handlePointerUp(event) {
            if (event.pointerId !== this.activePointerId || !this.zoomLayer) return;

            this.zoomLayer.releasePointerCapture(event.pointerId);
            this.zoomLayer.classList.remove('is-dragging');
            this.isDragging = false;
            this.activePointerId = null;
        }

        handleWheel(event) {
            if (!this.controlsEnabled) return;

            event.preventDefault();
            const delta = event.deltaY < 0 ? this.zoomStep : -this.zoomStep;
            this.adjustZoom(delta);
        }

        setZoomControlsEnabled(enabled) {
            this.controlsEnabled = Boolean(enabled);

            const controls = [this.zoomInBtn, this.zoomOutBtn, this.zoomResetBtn];
            controls.forEach(btn => {
                if (!btn) return;
                if (enabled) {
                    btn.removeAttribute('disabled');
                    btn.removeAttribute('aria-disabled');
                    btn.classList.remove('is-disabled');
                } else {
                    btn.setAttribute('disabled', 'disabled');
                    btn.setAttribute('aria-disabled', 'true');
                    btn.classList.add('is-disabled');
                }
            });

            this.updateZoomValue();
        }

        updateZoomValue() {
            if (!this.zoomValueEl) return;

            if (this.controlsEnabled) {
                this.zoomValueEl.textContent = `${Math.round(this.zoom * 100)}%`;
            } else {
                this.zoomValueEl.textContent = '--';
            }
        }

        showLoading() {
            if (!this.viewport) return;

            this.zoomLayer = null;
            this.isDragging = false;
            this.activePointerId = null;

            this.viewport.innerHTML = '';
            if (this.loadingTemplate) {
                this.viewport.appendChild(this.loadingTemplate.cloneNode(true));
            } else {
                const spinner = document.createElement('div');
                spinner.className = 'profile-avatar-modal__loading';
                spinner.innerHTML = `<div class="profile-avatar-modal__spinner"></div>`;
                this.viewport.appendChild(spinner);
            }
        }

        hasValidImage(imageUrl) {
            if (!imageUrl) return false;
            if (window.avatarUtils && typeof window.avatarUtils.isValidImageUrl === 'function') {
                return window.avatarUtils.isValidImageUrl(imageUrl);
            }
            return imageUrl.trim() !== '';
        }

        resolveUrl(imageUrl) {
            try {
                return new URL(imageUrl, window.location.origin).href;
            } catch (e) {
                return imageUrl;
            }
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        new ProfileAvatarModal();
    });
})();

