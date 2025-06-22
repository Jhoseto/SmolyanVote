// SmolyanVote Podcast Player - Final Fix
class PodcastPlayer {
    constructor() {
        this.wavesurfer = null;
        this.currentEpisode = null;
        this.isPlaying = false;
        this.isAudioReady = false; // Our own ready flag
        this.favorites = JSON.parse(localStorage.getItem('podcast-favorites')) || [];
        this.currentSlide = 0;
        this.cardsPerView = 4;
        this.previousVolume = 1;
        this.shouldAutoPlay = false;

        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
            return;
        }

        console.log('🎵 Initializing PodcastPlayer...');

        this.initWaveSurfer();
        this.bindEvents();
        this.initCarousel();
        this.loadFavorites();

        console.log('🎵 PodcastPlayer initialized successfully');
    }

    initWaveSurfer() {
        const waveformContainer = document.getElementById('waveform');
        if (!waveformContainer) return;

        this.wavesurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: '#81C784',
            progressColor: '#19861c',
            barWidth: 2,
            height: 40,
            responsive: true,
            cursorColor: '#fff',
            cursorWidth: 1,
            hideScrollbar: true
        });

        this.wavesurfer.on('ready', () => {
            console.log('🎵 WaveSurfer ready event fired');
            this.isAudioReady = true; // Set our flag
            this.updateDuration();
            this.showPlayer();

            if (this.currentEpisode?.element) {
                this.hideLoadingState(this.currentEpisode.element);
            }

            console.log('🎵 Audio is ready, shouldAutoPlay:', this.shouldAutoPlay);

            // Auto-play if requested
            if (this.shouldAutoPlay) {
                console.log('🎵 Starting auto-play');
                this.shouldAutoPlay = false;
                setTimeout(() => {
                    this.startPlayback();
                }, 300);
            }
        });

        this.wavesurfer.on('play', () => {
            console.log('🎵 WaveSurfer play event - audio started');
            this.isPlaying = true;
            this.updatePlayButton();
        });

        this.wavesurfer.on('pause', () => {
            console.log('🎵 WaveSurfer pause event - audio paused');
            this.isPlaying = false;
            this.updatePlayButton();
        });

        this.wavesurfer.on('finish', () => {
            console.log('🎵 Audio finished');
            this.isPlaying = false;
            this.updatePlayButton();
            this.playNext();
        });

        this.wavesurfer.on('audioprocess', () => {
            this.updateProgress();
        });

        this.wavesurfer.on('timeupdate', () => {
            this.updateProgress();
        });

        this.wavesurfer.on('error', (error) => {
            console.error('WaveSurfer error:', error);
            this.handleAudioError(error);
        });

        this.wavesurfer.on('load', (url) => {
            console.log('Loading audio:', url);
        });
    }

    startPlayback() {
        if (!this.wavesurfer || !this.isAudioReady) {
            console.warn('🎵 Cannot start playback - not ready');
            return;
        }

        try {
            console.log('🎵 Attempting to start playback');
            this.wavesurfer.play();
        } catch (error) {
            console.error('🎵 Error starting playback:', error);
        }
    }

    handleAudioError(error) {
        console.error('🎵 Audio error:', error);
        this.isPlaying = false;
        this.isAudioReady = false;
        this.shouldAutoPlay = false;
        this.updatePlayButton();

        if (this.currentEpisode?.element) {
            this.hideLoadingState(this.currentEpisode.element);
        }

        this.showNotification('Грешка при зареждане на аудиото: ' + (error.message || 'Неизвестна грешка'));
    }

    bindEvents() {
        // Search
        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchEpisodes(e.target.value));
        }

        if (clearSearch) {
            clearSearch.addEventListener('click', () => this.clearSearch());
        }

        // Sort
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => this.sortEpisodes(e.target.value));
        }

        // Episode interactions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.play-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const episodeCard = e.target.closest('.episode-card');
                if (episodeCard) {
                    console.log('🎵 Play button clicked');

                    if (this.currentEpisode?.element === episodeCard) {
                        console.log('🎵 Same episode - toggling play/pause');
                        this.togglePlayPause();
                    } else {
                        console.log('🎵 Different episode - loading new');
                        this.loadEpisode(episodeCard, true);
                    }
                }
            }

            if (e.target.closest('.favorite-btn')) {
                e.preventDefault();
                e.stopPropagation();
                this.toggleFavorite(e.target.closest('.favorite-btn'));
            }

            if (e.target.closest('.share-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const episodeCard = e.target.closest('.episode-card');
                if (episodeCard) {
                    this.shareEpisode(episodeCard);
                }
            }
        });

        this.bindPlayerControls();
        this.bindCarouselControls();
        this.bindSubscribeForm();
        this.bindKeyboardShortcuts();

        window.addEventListener('resize', () => {
            this.updateCardsPerView();
            this.updateCarousel();
        });
    }

    bindPlayerControls() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        }

        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        if (prevBtn) prevBtn.addEventListener('click', () => this.playPrevious());
        if (nextBtn) nextBtn.addEventListener('click', () => this.playNext());

        const volumeSlider = document.getElementById('volumeSlider');
        const volumeBtn = document.getElementById('volumeBtn');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        }
        if (volumeBtn) {
            volumeBtn.addEventListener('click', () => this.toggleMute());
        }

        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => this.seekTo(e));
        }
    }

    bindCarouselControls() {
        const prevCarousel = document.getElementById('prevCarousel');
        const nextCarousel = document.getElementById('nextCarousel');

        if (prevCarousel) {
            prevCarousel.addEventListener('click', () => this.previousSlide());
        }
        if (nextCarousel) {
            nextCarousel.addEventListener('click', () => this.nextSlide());
        }

        // Touch support
        const carousel = document.getElementById('episodesCarousel');
        if (carousel) {
            let startX = 0;
            let currentX = 0;

            carousel.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
            });

            carousel.addEventListener('touchmove', (e) => {
                currentX = e.touches[0].clientX;
            });

            carousel.addEventListener('touchend', () => {
                const diffX = startX - currentX;
                if (Math.abs(diffX) > 50) {
                    if (diffX > 0) {
                        this.nextSlide();
                    } else {
                        this.previousSlide();
                    }
                }
            });
        }
    }

    bindSubscribeForm() {
        const subscribeBtn = document.getElementById('subscribeBtn');
        const subscribeEmail = document.getElementById('subscribeEmail');

        if (subscribeBtn) {
            subscribeBtn.addEventListener('click', () => this.handleSubscribe());
        }

        if (subscribeEmail) {
            subscribeEmail.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSubscribe();
                }
            });
        }
    }

    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (e.ctrlKey || e.metaKey) {
                        this.previousSlide();
                    } else {
                        this.playPrevious();
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (e.ctrlKey || e.metaKey) {
                        this.nextSlide();
                    } else {
                        this.playNext();
                    }
                    break;
            }
        });
    }

    getEpisodes() {
        return Array.from(document.querySelectorAll('.episode-card'));
    }

    getVisibleEpisodes() {
        return this.getEpisodes().filter(ep => !ep.classList.contains('hidden'));
    }

    // Carousel functionality
    updateCardsPerView() {
        const width = window.innerWidth;
        if (width <= 480) {
            this.cardsPerView = 1;
        } else if (width <= 768) {
            this.cardsPerView = 2;
        } else if (width <= 1024) {
            this.cardsPerView = 3;
        } else {
            this.cardsPerView = 4;
        }
    }

    updateCarousel() {
        const container = document.getElementById('episodesContainer');
        if (!container) return;

        const cardWidth = 100 / this.cardsPerView;
        const translateX = -(this.currentSlide * cardWidth);
        container.style.transform = `translateX(${translateX}%)`;

        const prevBtn = document.getElementById('prevCarousel');
        const nextBtn = document.getElementById('nextCarousel');

        if (prevBtn) prevBtn.disabled = this.currentSlide === 0;

        const visibleEpisodes = this.getVisibleEpisodes();
        const maxSlides = Math.max(0, visibleEpisodes.length - this.cardsPerView);
        if (nextBtn) nextBtn.disabled = this.currentSlide >= maxSlides;
    }

    nextSlide() {
        const visibleEpisodes = this.getVisibleEpisodes();
        const maxSlides = Math.max(0, visibleEpisodes.length - this.cardsPerView);

        if (this.currentSlide < maxSlides) {
            this.currentSlide++;
            this.updateCarousel();
        }
    }

    previousSlide() {
        if (this.currentSlide > 0) {
            this.currentSlide--;
            this.updateCarousel();
        }
    }

    resetCarousel() {
        this.currentSlide = 0;
        this.updateCarousel();
    }

    initCarousel() {
        this.updateCardsPerView();
        this.updateCarousel();
    }

    // Load episode
    async loadEpisode(episodeCard, autoPlay = false) {
        const playBtn = episodeCard.querySelector('.play-btn');
        const audioUrl = playBtn?.dataset.audio;

        if (!audioUrl) {
            this.showNotification('Няма наличен аудио файл');
            return;
        }

        if (!this.isValidAudioUrl(audioUrl)) {
            this.showNotification('Невалиден аудио файл');
            return;
        }

        const title = episodeCard.querySelector('.episode-title')?.textContent || 'Неизвестен епизод';
        const description = episodeCard.querySelector('.episode-description')?.textContent || '';
        const episodeNumber = episodeCard.querySelector('.episode-titleNumber')?.textContent || '';
        const imageElement = episodeCard.querySelector('.episode-image img');
        let imageUrl = imageElement?.src || '';

        // Fix placeholder image URL
        if (!imageUrl || imageUrl.includes('ffffff:') || imageUrl.startsWith('ffffff') || !imageUrl.trim()) {
            imageUrl = "https://via.placeholder.com/60x60/19861c/ffffff?text=♪";
        }

        this.currentEpisode = {
            element: episodeCard,
            audioUrl,
            title,
            description,
            imageUrl,
            episodeNumber
        };

        // Reset flags
        this.isAudioReady = false;
        this.shouldAutoPlay = autoPlay;

        this.updateNowPlaying(title, description, imageUrl, episodeNumber);
        this.showLoadingState(episodeCard);

        try {
            console.log('🎵 Loading episode:', title);
            console.log('🎵 Audio URL:', audioUrl);
            console.log('🎵 Auto play requested:', autoPlay);

            await this.loadAudioWithTimeout(audioUrl);
            console.log('🎵 Audio loaded successfully');

        } catch (error) {
            console.error('🎵 Load episode error:', error);
            this.handleAudioError(error);
            this.hideLoadingState(episodeCard);
        }

        this.updateActiveEpisode(episodeCard);
    }

    isValidAudioUrl(url) {
        if (!url || typeof url !== 'string') return false;

        try {
            new URL(url);
        } catch {
            return false;
        }

        const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
        const hasValidExtension = audioExtensions.some(ext =>
            url.toLowerCase().includes(ext)
        );

        const isArchiveUrl = url.includes('archive.org');
        return hasValidExtension || isArchiveUrl;
    }

    loadAudioWithTimeout(audioUrl, timeout = 15000) {
        return new Promise((resolve, reject) => {
            const onReady = () => {
                this.wavesurfer.un('ready', onReady);
                this.wavesurfer.un('error', onError);
                resolve();
            };

            const onError = (error) => {
                this.wavesurfer.un('ready', onReady);
                this.wavesurfer.un('error', onError);
                reject(error);
            };

            const timeoutId = setTimeout(() => {
                this.wavesurfer.un('ready', onReady);
                this.wavesurfer.un('error', onError);
                reject(new Error('Audio load timeout'));
            }, timeout);

            this.wavesurfer.on('ready', () => {
                clearTimeout(timeoutId);
                onReady();
            });
            this.wavesurfer.on('error', (error) => {
                clearTimeout(timeoutId);
                onError(error);
            });

            this.wavesurfer.load(audioUrl);
        });
    }

    showLoadingState(episodeCard) {
        const playBtn = episodeCard.querySelector('.play-btn');
        if (playBtn) {
            const icon = playBtn.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-spinner fa-spin';
            }
            playBtn.disabled = true;
        }
    }

    hideLoadingState(episodeCard) {
        const playBtn = episodeCard.querySelector('.play-btn');
        if (playBtn) {
            const icon = playBtn.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-play';
            }
            playBtn.disabled = false;
        }
    }

    updateNowPlaying(title, description, imageUrl, episodeNumber = '') {
        const titleElement = document.getElementById('currentTrackTitle');
        const descriptionElement = document.getElementById('currentTrackDescription');
        const imageElement = document.getElementById('currentTrackImage');

        // Add episode number to title if available
        const displayTitle = episodeNumber ? `Епизод ${episodeNumber}: ${title}` : title;

        if (titleElement) titleElement.textContent = displayTitle;
        if (descriptionElement) descriptionElement.textContent = description;
        if (imageElement) imageElement.src = imageUrl;
    }

    updateActiveEpisode(activeCard) {
        this.getEpisodes().forEach(card => {
            card.classList.remove('playing');
        });
        activeCard.classList.add('playing');
    }

    showPlayer() {
        const player = document.getElementById('audioPlayer');
        if (player) {
            player.classList.add('visible');
        }
    }

    // Player controls
    togglePlayPause() {
        if (!this.wavesurfer) {
            console.warn('🎵 WaveSurfer not initialized');
            return;
        }

        if (!this.isAudioReady) {
            console.warn('🎵 Audio not ready yet');
            return;
        }

        try {
            if (this.isPlaying) {
                console.log('🎵 Pausing audio');
                this.wavesurfer.pause();
            } else {
                console.log('🎵 Starting audio');
                this.wavesurfer.play();
            }
        } catch (error) {
            console.error('🎵 Error in togglePlayPause:', error);
        }
    }

    updatePlayButton() {
        // Update main player button
        const playBtn = document.getElementById('playPauseBtn');
        const icon = playBtn?.querySelector('i');

        if (icon) {
            icon.className = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';
        }

        // Update episode play buttons
        this.getEpisodes().forEach(card => {
            const playIcon = card.querySelector('.play-btn i');
            if (playIcon && !playIcon.classList.contains('fa-spinner')) {
                if (card === this.currentEpisode?.element && this.isPlaying) {
                    playIcon.className = 'fas fa-pause';
                } else {
                    playIcon.className = 'fas fa-play';
                }
            }
        });
    }

    async playNext() {
        if (!this.currentEpisode) return;

        const visibleEpisodes = this.getVisibleEpisodes();
        const currentIndex = visibleEpisodes.indexOf(this.currentEpisode.element);

        if (currentIndex < visibleEpisodes.length - 1) {
            const wasPlaying = this.isPlaying;
            await this.loadEpisode(visibleEpisodes[currentIndex + 1], wasPlaying);
        }
    }

    async playPrevious() {
        if (!this.currentEpisode) return;

        const visibleEpisodes = this.getVisibleEpisodes();
        const currentIndex = visibleEpisodes.indexOf(this.currentEpisode.element);

        if (currentIndex > 0) {
            const wasPlaying = this.isPlaying;
            await this.loadEpisode(visibleEpisodes[currentIndex - 1], wasPlaying);
        }
    }

    // Volume controls
    setVolume(volume) {
        if (this.wavesurfer) {
            this.wavesurfer.setVolume(volume);
            this.updateVolumeIcon(volume);
        }
    }

    updateVolumeIcon(volume) {
        const icon = document.querySelector('#volumeBtn i');
        if (!icon) return;

        if (volume == 0) {
            icon.className = 'fas fa-volume-mute';
        } else if (volume < 0.5) {
            icon.className = 'fas fa-volume-down';
        } else {
            icon.className = 'fas fa-volume-up';
        }
    }

    toggleMute() {
        if (!this.wavesurfer) return;

        const currentVolume = this.wavesurfer.getVolume();
        const volumeSlider = document.getElementById('volumeSlider');

        if (currentVolume > 0) {
            this.previousVolume = currentVolume;
            this.setVolume(0);
            if (volumeSlider) volumeSlider.value = 0;
        } else {
            const restoreVolume = this.previousVolume || 1;
            this.setVolume(restoreVolume);
            if (volumeSlider) volumeSlider.value = restoreVolume;
        }
    }

    // Progress controls
    seekTo(event) {
        if (!this.wavesurfer || !this.isAudioReady) {
            console.warn('🎵 Cannot seek - audio not ready');
            return;
        }

        try {
            const progressBar = event.currentTarget;
            const rect = progressBar.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));

            console.log('🎵 Seeking to:', percent * 100 + '%');
            this.wavesurfer.seekTo(percent);
        } catch (error) {
            console.error('🎵 Error seeking:', error);
        }
    }

    updateProgress() {
        if (!this.wavesurfer || !this.isAudioReady) return;

        try {
            const currentTime = this.wavesurfer.getCurrentTime();
            const duration = this.wavesurfer.getDuration();

            if (!duration || duration === 0) return;

            const progress = currentTime / duration;
            const progressFill = document.getElementById('progressFill');

            if (progressFill) {
                progressFill.style.width = `${Math.max(0, Math.min(100, progress * 100))}%`;
            }

            const timeElement = document.getElementById('currentTime');
            if (timeElement) {
                timeElement.textContent = this.formatTime(currentTime);
            }
        } catch (error) {
            console.error('🎵 Error updating progress:', error);
        }
    }

    updateDuration() {
        if (!this.wavesurfer || !this.isAudioReady) return;

        const duration = this.wavesurfer.getDuration();
        const durationElement = document.getElementById('duration');
        if (durationElement) {
            durationElement.textContent = this.formatTime(duration);
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Search functionality
    searchEpisodes(query) {
        const clearBtn = document.getElementById('clearSearch');
        if (clearBtn) {
            clearBtn.classList.toggle('visible', query.length > 0);
        }

        const episodes = this.getEpisodes();

        if (!query.trim()) {
            episodes.forEach(episode => episode.classList.remove('hidden'));
            this.updateEpisodeCount();
            this.resetCarousel();
            return;
        }

        const searchTerm = query.toLowerCase();
        let visibleCount = 0;

        episodes.forEach(episode => {
            const title = episode.querySelector('.episode-title')?.textContent?.toLowerCase() || '';
            const description = episode.querySelector('.episode-description')?.textContent?.toLowerCase() || '';

            const matches = title.includes(searchTerm) || description.includes(searchTerm);
            episode.classList.toggle('hidden', !matches);

            if (matches) visibleCount++;
        });

        this.updateEpisodeCount(visibleCount);
        this.resetCarousel();
    }

    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        const clearBtn = document.getElementById('clearSearch');

        if (searchInput) searchInput.value = '';
        if (clearBtn) clearBtn.classList.remove('visible');

        this.getEpisodes().forEach(episode => episode.classList.remove('hidden'));
        this.updateEpisodeCount();
        this.resetCarousel();
    }

    // Sort episodes
    sortEpisodes(sortBy) {
        const container = document.getElementById('episodesContainer');
        if (!container) return;

        const episodes = this.getEpisodes();

        episodes.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.dataset.date || 0) - new Date(a.dataset.date || 0);
                case 'oldest':
                    return new Date(a.dataset.date || 0) - new Date(b.dataset.date || 0);
                case 'duration':
                    return parseInt(b.dataset.duration || 0) - parseInt(a.dataset.duration || 0);
                default:
                    return 0;
            }
        });

        container.innerHTML = '';
        episodes.forEach(episode => container.appendChild(episode));
        this.resetCarousel();
    }

    updateEpisodeCount(count = null) {
        const episodeCountElement = document.getElementById('episodeCount');
        if (!episodeCountElement) return;

        const visibleEpisodes = this.getVisibleEpisodes();
        const displayCount = count !== null ? count : visibleEpisodes.length;
        episodeCountElement.textContent = `(${displayCount})`;
    }

    // Favorites functionality
    toggleFavorite(button) {
        const episodeCard = button.closest('.episode-card');
        const episodeTitle = episodeCard?.querySelector('.episode-title')?.textContent;

        if (!episodeTitle) return;

        const isFavorited = this.favorites.includes(episodeTitle);

        if (isFavorited) {
            this.favorites = this.favorites.filter(title => title !== episodeTitle);
            button.innerHTML = '<i class="far fa-heart"></i>';
            button.classList.remove('favorited');
        } else {
            this.favorites.push(episodeTitle);
            button.innerHTML = '<i class="fas fa-heart"></i>';
            button.classList.add('favorited');
        }

        localStorage.setItem('podcast-favorites', JSON.stringify(this.favorites));
    }

    loadFavorites() {
        this.getEpisodes().forEach(card => {
            const title = card.querySelector('.episode-title')?.textContent;
            const button = card.querySelector('.favorite-btn');

            if (title && button && this.favorites.includes(title)) {
                button.innerHTML = '<i class="fas fa-heart"></i>';
                button.classList.add('favorited');
            }
        });
    }

    // Share episode
    shareEpisode(episodeCard) {
        const title = episodeCard.querySelector('.episode-title')?.textContent || 'Епизод';
        const description = episodeCard.querySelector('.episode-description')?.textContent || '';

        if (navigator.share) {
            navigator.share({
                title: title,
                text: description,
                url: window.location.href
            }).catch(() => {
                this.copyToClipboard(title, description);
            });
        } else {
            this.copyToClipboard(title, description);
        }
    }

    copyToClipboard(title, description) {
        const shareText = `${title} - ${description}\n${window.location.href}`;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => {
                this.showNotification('Копирано в клипборда!');
            }).catch(() => {
                this.showNotification('Не може да се копира');
            });
        } else {
            this.showNotification('Копиране не се поддържа');
        }
    }

    // Subscribe functionality
    handleSubscribe() {
        const emailInput = document.getElementById('subscribeEmail');
        const email = emailInput?.value?.trim();

        if (!email) {
            this.showSubscribeMessage('Моля, въведете имейл адрес.', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showSubscribeMessage('Моля, въведете валиден имейл адрес.', 'error');
            return;
        }

        this.showSubscribeMessage('Успешно се абонирахте! Ще получавате известия за нови епизоди.', 'success');
        if (emailInput) emailInput.value = '';

        const subscriptions = JSON.parse(localStorage.getItem('podcast-subscriptions')) || [];
        if (!subscriptions.includes(email)) {
            subscriptions.push(email);
            localStorage.setItem('podcast-subscriptions', JSON.stringify(subscriptions));
        }
    }

    showSubscribeMessage(text, type) {
        const message = document.getElementById('subscribeMessage');
        if (!message) return;

        message.textContent = text;
        message.className = `subscribe-message ${type}`;
        message.classList.remove('hidden');

        setTimeout(() => {
            message.classList.add('hidden');
        }, 5000);
    }

    // Notification system
    showNotification(text) {
        console.log('Notification:', text);

        const notification = document.createElement('div');
        notification.textContent = text;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #0F7B59 0%, #4CAF50 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 0.9rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.podcastPlayer = new PodcastPlayer();
});

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .episode-card.playing {
        border-color: #19861c;
        box-shadow: 0 0 0 2px rgba(25, 134, 28, 0.2);
    }

    .episodes-carousel {
        scroll-behavior: smooth;
    }

    .episodes-grid {
        scroll-snap-type: x mandatory;
    }

    .episode-card {
        scroll-snap-align: start;
    }
    
    .play-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .fa-spinner {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);