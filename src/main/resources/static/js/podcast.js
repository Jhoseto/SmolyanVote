class PodcastPlayer {
    constructor() {
        this.wavesurfer = null;
        this.currentEpisode = null;
        this.isPlaying = false;
        this.isAudioReady = false;
        this.favorites = JSON.parse(localStorage.getItem('podcast-favorites')) || [];
        this.currentSlide = 0;
        this.cardsPerView = 4;
        this.previousVolume = 1;
        this.shouldAutoPlay = false;
        this.originalOrder = [];
        this.podcastWindow = null; // Reference към отделния прозорец за desktop

        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
            return;
        }

        this.saveOriginalOrder();
        this.initWaveSurfer();
        this.bindEvents();
        this.initCarousel();
        this.loadFavorites();
        this.addNotificationStyles();
        
        // Проверка за автоматично отваряне на епизод от URL параметър
        this.checkAutoPlayFromUrl();
    }
    
    checkAutoPlayFromUrl() {
        // Проверяваме веднага за episode ID в URL-а
        const urlParams = new URLSearchParams(window.location.search);
        const episodeId = urlParams.get('episode');
        
        if (episodeId) {
            // Изчакваме само да се заредят DOM елементите
            const checkCard = () => {
                const episodeCard = document.querySelector(`.episode-card[data-episode-id="${episodeId}"]`);
                if (episodeCard) {
                    // Отваряме playera и започваме възпроизвеждане автоматично
                    this.loadEpisode(episodeCard, true);
                } else {
                    // Ако картата още не е заредена, пробваме отново след кратко време
                    setTimeout(checkCard, 100);
                }
            };
            
            // Първа проверка веднага
            checkCard();
        }
    }

    saveOriginalOrder() {
        const episodes = this.getEpisodes();
        this.originalOrder = episodes.map(ep => ep.cloneNode(true));
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
            hideScrollbar: true,
            backend: 'MediaElement', // STREAMING: Използва HTML5 audio за streaming вместо да зарежда целия файл
            mediaType: 'audio',
            autoplay: false,
            interact: true
        });

        this.wavesurfer.on('ready', () => {
            this.isAudioReady = true;
            this.updateDuration();
            this.showPlayer();

            if (this.currentEpisode?.element) {
                this.hideLoadingState(this.currentEpisode.element);
            }

            if (this.shouldAutoPlay) {
                this.shouldAutoPlay = false;
                setTimeout(() => this.startPlayback(), 300);
            }
        });

        this.wavesurfer.on('play', () => {
            this.isPlaying = true;
            this.updatePlayButton();
            
            // Инкрементиране на listen count при стартиране на възпроизвеждане (mobile) - асинхронно
            if (this.currentEpisode?.id && this.currentEpisode?.element) {
                this.incrementListenCount(this.currentEpisode.id, this.currentEpisode.element).catch(() => {
                    // Ignore errors - не критично
                });
            }
        });

        this.wavesurfer.on('pause', () => {
            this.isPlaying = false;
            this.updatePlayButton();
        });

        this.wavesurfer.on('finish', () => {
            this.isPlaying = false;
            this.updatePlayButton();
            this.playNext();
        });

        this.wavesurfer.on('audioprocess', () => this.updateProgress());
        this.wavesurfer.on('timeupdate', () => this.updateProgress());
        this.wavesurfer.on('error', (error) => this.handleAudioError(error));
    }

    startPlayback() {
        if (!this.wavesurfer || !this.isAudioReady) return;
        try {
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

        this.showNotification('Грешка при зареждане на аудиото', 'error');
    }

    bindEvents() {
        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');
        const sortSelect = document.getElementById('sortSelect');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchEpisodes(e.target.value));
        }

        if (clearSearch) {
            clearSearch.addEventListener('click', () => this.clearSearch());
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => this.sortEpisodes(e.target.value));
        }

        document.addEventListener('click', (e) => {
            if (e.target.closest('.play-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const episodeCard = e.target.closest('.episode-card');
                if (episodeCard) {
                    if (this.currentEpisode?.element === episodeCard) {
                        this.togglePlayPause();
                    } else {
                        this.loadEpisode(episodeCard, true);
                    }
                }
                return;
            }

            if (e.target.closest('.favorite-btn')) {
                e.preventDefault();
                e.stopPropagation();
                this.toggleFavorite(e.target.closest('.favorite-btn'));
                return;
            }

            if (e.target.closest('.share-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const shareBtn = e.target.closest('.share-btn');
                const episodeCard = shareBtn.closest('.episode-card');
                // Извличаме episodeId от бутона или от картата
                const episodeId = shareBtn?.dataset?.episodeId || episodeCard?.dataset?.episodeId;
                this.shareEpisode(episodeCard, episodeId);
                return;
            }

            if (e.target.closest('.episode-card')) {
                e.preventDefault();
                e.stopPropagation();
                const episodeCard = e.target.closest('.episode-card');
                if (episodeCard) this.toggleCardExpansion(episodeCard);
                return;
            }

            this.collapseAllCards();
        });

        this.bindPlayerControls();
        this.bindCarouselControls();
        this.bindKeyboardShortcuts();

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.updateCardsPerView();
                this.updateCarousel();
            }, 250);
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
        const volumeToggle = document.getElementById('volumeToggle');
        const volumeControls = document.getElementById('volumeControls');
        const playerExpandBtn = document.getElementById('playerExpandBtn');
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        }
        if (volumeBtn) {
            volumeBtn.addEventListener('click', () => this.toggleMute());
        }
        if (volumeToggle) {
            volumeToggle.addEventListener('click', () => this.toggleVolumeControls());
        }
        if (playerExpandBtn) {
            playerExpandBtn.addEventListener('click', () => this.togglePlayerExpansion());
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
                case 'Escape':
                    e.preventDefault();
                    this.collapseAllCards();
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
        const visibleEpisodes = this.getVisibleEpisodes();
        const totalVisible = visibleEpisodes.length;

        const prevBtn = document.getElementById('prevCarousel');
        const nextBtn = document.getElementById('nextCarousel');
        const container = document.getElementById('episodesContainer');

        if (!container) return;

        if (totalVisible <= this.cardsPerView) {
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
        } else {
            if (prevBtn) prevBtn.style.display = 'flex';
            if (nextBtn) nextBtn.style.display = 'flex';

            const scrollLeft = container.scrollLeft;
            const maxScroll = container.scrollWidth - container.clientWidth;

            if (prevBtn) prevBtn.disabled = scrollLeft <= 5;
            if (nextBtn) nextBtn.disabled = scrollLeft >= maxScroll - 5;
        }
    }

    nextSlide() {
        const container = document.getElementById('episodesContainer');
        if (container) {
            const scrollAmount = 250 * 2;
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            setTimeout(() => this.updateCarousel(), 300);
        }
    }

    previousSlide() {
        const container = document.getElementById('episodesContainer');
        if (container) {
            const scrollAmount = 250 * 2;
            container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            setTimeout(() => this.updateCarousel(), 300);
        }
    }

    resetCarousel() {
        const container = document.getElementById('episodesContainer');
        if (container) {
            container.scrollTo({ left: 0, behavior: 'smooth' });
            setTimeout(() => this.updateCarousel(), 300);
        }
    }

    initCarousel() {
        this.updateCardsPerView();
        this.updateCarousel();

        const container = document.getElementById('episodesContainer');
        if (container) {
            let scrollTimeout;
            container.addEventListener('scroll', () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => this.updateCarousel(), 150);
            });
        }
    }

    async loadEpisode(episodeCard, autoPlay = false) {
        const playBtn = episodeCard.querySelector('.play-btn');
        const audioUrl = playBtn?.dataset.audio;
        const episodeId = episodeCard?.dataset?.episodeId;

        if (!audioUrl) {
            this.showNotification('Няма наличен аудио файл', 'error');
            return;
        }

        const title = episodeCard.querySelector('.episode-title')?.textContent || 'Неизвестен епизод';
        const description = episodeCard.querySelector('.episode-description')?.textContent || '';
        const episodeNumber = episodeCard.querySelector('.episode-titleNumber, .episode-number')?.textContent || '';
        const imageElement = episodeCard.querySelector('.episode-image img');
        let imageUrl = imageElement?.src || '/images/web/podcast1.png';

        this.currentEpisode = {
            element: episodeCard,
            audioUrl,
            title,
            description,
            imageUrl,
            episodeNumber,
            id: episodeId
        };

        // Инкрементиране на listen count при стартиране на епизод (асинхронно, не блокира)
        if (episodeId) {
            // Не изчакваме - зареждаме аудиото веднага
            this.incrementListenCount(episodeId, episodeCard).catch(() => {
                // Ignore errors - не критично
            });
        }

        // Проверка дали сме на desktop - отваряне на отделен прозорец
        if (window.innerWidth > 768) {
            this.openPodcastWindow({
                audioUrl,
                title,
                description,
                imageUrl,
                episodeNumber,
                id: episodeId,
                autoPlay
            });
            return;
        }

        // Mobile версия - продължава с нормалния player
        this.isAudioReady = false;
        this.shouldAutoPlay = autoPlay;

        this.updateNowPlaying(title, description, imageUrl, episodeNumber);
        this.showLoadingState(episodeCard);

        try {
            await this.loadAudioWithTimeout(audioUrl);
        } catch (error) {
            this.handleAudioError(error);
            this.hideLoadingState(episodeCard);
        }

        this.updateActiveEpisode(episodeCard);
    }

    async incrementListenCount(episodeId, episodeCard) {
        if (!episodeId) return;
        
        try {
            const response = await fetch(`/api/podcast/episodes/${episodeId}/increment-listen`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'same-origin'
            });

            if (response.ok) {
                const updatedEpisode = await response.json();
                // Актуализиране на визуалното показване
                this.updateListenCountDisplay(episodeCard, updatedEpisode.listenCount);
            }
        } catch (error) {
            console.warn('Failed to increment listen count:', error);
        }
    }

    updateListenCountDisplay(episodeCard, newCount) {
        if (!episodeCard || !newCount) return;
        
        let listensElement = episodeCard.querySelector('.episode-listens');
        
        if (!listensElement) {
            // Създаване на нов елемент ако не съществува
            const metaElement = episodeCard.querySelector('.episode-meta');
            if (metaElement) {
                listensElement = document.createElement('span');
                listensElement.className = 'episode-listens';
                listensElement.innerHTML = `<i class="fas fa-headphones"></i><span>${this.formatNumber(newCount)}</span>`;
                metaElement.appendChild(listensElement);
            }
        } else {
            // Актуализиране на съществуващия елемент
            const countSpan = listensElement.querySelector('span:last-child');
            if (countSpan) {
                countSpan.textContent = this.formatNumber(newCount);
            }
        }
    }

    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    openPodcastWindow(episodeData) {
        // Проверка дали прозорецът вече е отворен
        if (this.podcastWindow && !this.podcastWindow.closed) {
            // Прозорецът вече съществува - изпращаме команда за зареждане на нов епизод
            this.podcastWindow.postMessage({
                type: 'podcast-control',
                action: 'load',
                episode: episodeData
            }, '*');
            this.podcastWindow.focus();
            return;
        }

        // Създаване на нов прозорец
        const episodeParam = encodeURIComponent(JSON.stringify(episodeData));
        const windowFeatures = 'width=900,height=750,resizable=yes,scrollbars=no,menubar=no,toolbar=no,location=no,status=no';
        
        this.podcastWindow = window.open(
            `/podcast/podcast-window.html?episode=${episodeParam}`,
            'PodcastPlayer',
            windowFeatures
        );

        if (!this.podcastWindow) {
            this.showNotification('Моля разрешете popup прозорците за да отворите player-а', 'error');
            return;
        }

        // Запазване на reference
        this.podcastWindowRef = this.podcastWindow;

        // Слушане за съобщения от прозореца
        window.addEventListener('message', (event) => {
            if (event.data.type === 'podcast-window-action') {
                this.handlePodcastWindowAction(event.data);
            }
        });

        // Проверка дали прозорецът е затворен
        const checkClosed = setInterval(() => {
            if (this.podcastWindow.closed) {
                clearInterval(checkClosed);
                this.podcastWindow = null;
            }
        }, 1000);
    }

    handlePodcastWindowAction(data) {
        switch (data.action) {
            case 'next':
                this.playNext();
                break;
            case 'previous':
                this.playPrevious();
                break;
            case 'favorite':
                // Синхронизация на favorite статус
                break;
        }
    }

    loadAudioWithTimeout(audioUrl, timeout = 10000) {
        return new Promise((resolve, reject) => {
            let resolved = false;
            
            const finish = () => {
                if (resolved) return;
                resolved = true;
                resolve();
            };

            const onError = (error) => {
                if (resolved) return;
                resolved = true;
                reject(error);
            };

            const timeoutId = setTimeout(() => {
                if (resolved) return;
                resolved = true;
                reject(new Error('Audio load timeout'));
            }, timeout);

            // Зареждаме аудиото
            this.wavesurfer.load(audioUrl).catch(onError);
            
            // Слушаме за canplay вместо ready за по-бързо стартиране
            setTimeout(() => {
                const mediaElement = this.wavesurfer.getMediaElement?.();
                if (mediaElement) {
                    if (mediaElement.readyState >= 2) {
                        clearTimeout(timeoutId);
                        finish();
                    } else {
                        mediaElement.addEventListener('canplay', () => {
                            clearTimeout(timeoutId);
                            finish();
                        }, { once: true });
                        
                        mediaElement.addEventListener('loadedmetadata', () => {
                            if (!resolved && mediaElement.readyState >= 1) {
                                clearTimeout(timeoutId);
                                finish();
                            }
                        }, { once: true });
                        
                        mediaElement.addEventListener('error', onError, { once: true });
                    }
                } else {
                    // Fallback към ready event
                    this.wavesurfer.on('ready', () => {
                        clearTimeout(timeoutId);
                        this.isAudioReady = true;
                        this.hideLoadingState(this.currentEpisode.element);

                        // Seek към началото
                        try {
                            this.wavesurfer.seekTo(0);
                        } catch (e) {
                            // Ignore
                        }

                        if (this.shouldAutoPlay) {
                            this.wavesurfer.play();
                            this.shouldAutoPlay = false;
                        }

                        finish();
                    });
                    
                    this.wavesurfer.on('error', onError);
                }
            }, 100);
        });
    }

    showLoadingState(episodeCard) {
        const playBtn = episodeCard.querySelector('.play-btn');
        if (playBtn) {
            const icon = playBtn.querySelector('i');
            if (icon) icon.className = 'fas fa-spinner fa-spin';
            playBtn.disabled = true;
        }
    }

    hideLoadingState(episodeCard) {
        const playBtn = episodeCard.querySelector('.play-btn');
        if (playBtn) {
            const icon = playBtn.querySelector('i');
            if (icon) icon.className = 'fas fa-play';
            playBtn.disabled = false;
        }
    }

    updateNowPlaying(title, description, imageUrl, episodeNumber = '') {
        const titleElement = document.getElementById('currentTrackTitle');
        const descriptionElement = document.getElementById('currentTrackDescription');
        const imageElement = document.getElementById('currentTrackImage');

        const displayTitle = episodeNumber ? `${episodeNumber}: ${title}` : title;

        if (titleElement) titleElement.textContent = displayTitle;
        if (descriptionElement) descriptionElement.textContent = description;
        if (imageElement) imageElement.src = imageUrl || '/images/web/podcast1.png';
    }

    updateActiveEpisode(activeCard) {
        this.getEpisodes().forEach(card => card.classList.remove('playing'));
        activeCard.classList.add('playing');
    }

    showPlayer() {
        const player = document.getElementById('audioPlayer');
        if (player) player.classList.add('visible');
    }

    togglePlayPause() {
        if (!this.wavesurfer || !this.isAudioReady) return;

        try {
            if (this.isPlaying) {
                this.wavesurfer.pause();
            } else {
                this.wavesurfer.play();
            }
        } catch (error) {
            console.error('🎵 Error in togglePlayPause:', error);
        }
    }

    updatePlayButton() {
        const playBtn = document.getElementById('playPauseBtn');
        const icon = playBtn?.querySelector('i');

        if (icon) {
            icon.className = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';
        }

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

    toggleVolumeControls() {
        const volumeControls = document.getElementById('volumeControls');
        const volumeToggle = document.getElementById('volumeToggle');
        
        if (volumeControls && volumeToggle) {
            const isVisible = volumeControls.classList.contains('show');
            
            if (isVisible) {
                volumeControls.classList.remove('show');
                volumeToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
            } else {
                volumeControls.classList.add('show');
                volumeToggle.innerHTML = '<i class="fas fa-volume-down"></i>';
            }
        }
    }

    togglePlayerExpansion() {
        const playerContainer = document.querySelector('.player-container');
        const playerExpandBtn = document.getElementById('playerExpandBtn');
        
        if (playerContainer && playerExpandBtn) {
            const isExpanded = playerContainer.classList.contains('expanded');
            
            if (isExpanded) {
                playerContainer.classList.remove('expanded');
                playerExpandBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
            } else {
                playerContainer.classList.add('expanded');
                playerExpandBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
            }
        }
    }

    seekTo(event) {
        if (!this.wavesurfer || !this.isAudioReady) return;

        try {
            const progressBar = event.currentTarget;
            const rect = progressBar.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
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

    // SEARCH FUNCTIONALITY - РАБОТИ ПРАВИЛНО
    searchEpisodes(query) {
        const clearBtn = document.getElementById('clearSearch');
        if (clearBtn) {
            clearBtn.classList.toggle('visible', query.length > 0);
        }

        const episodes = this.getEpisodes();

        if (!query.trim()) {
            episodes.forEach(episode => {
                episode.classList.remove('hidden');
                episode.style.display = '';
            });
            this.updateEpisodeCount();
            this.resetCarousel();
            return;
        }

        const searchTerm = query.toLowerCase();
        let visibleCount = 0;

        episodes.forEach(episode => {
            const title = episode.querySelector('.episode-title')?.textContent?.toLowerCase() || '';
            const description = episode.querySelector('.episode-description')?.textContent?.toLowerCase() || '';
            const episodeNumber = episode.querySelector('.episode-titleNumber, .episode-number')?.textContent?.toLowerCase() || '';

            const matches = title.includes(searchTerm) ||
                description.includes(searchTerm) ||
                episodeNumber.includes(searchTerm);

            if (matches) {
                episode.classList.remove('hidden');
                episode.style.display = '';
                visibleCount++;
            } else {
                episode.classList.add('hidden');
                episode.style.display = 'none';
            }
        });

        this.updateEpisodeCount(visibleCount);
        this.resetCarousel();

        if (visibleCount === 0) {
            this.showNotification('Няма намерени епизоди', 'info');
        }
    }

    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        const clearBtn = document.getElementById('clearSearch');

        if (searchInput) searchInput.value = '';
        if (clearBtn) clearBtn.classList.remove('visible');

        this.getEpisodes().forEach(episode => {
            episode.classList.remove('hidden');
            episode.style.display = '';
        });

        this.updateEpisodeCount();
        this.resetCarousel();
    }

    // SORT FUNCTIONALITY - ФИКСИРАНО
    sortEpisodes(sortBy) {
        const container = document.getElementById('episodesContainer');
        if (!container) return;

        const episodes = this.getEpisodes();
        if (!episodes.length) return;

        // Клониране на елементите за сортиране
        const episodeData = episodes.map(episode => ({
            element: episode,
            date: new Date(episode.dataset.date || '1970-01-01T00:00:00Z'),
            duration: parseInt(episode.dataset.duration || '0'),
            title: episode.querySelector('.episode-title')?.textContent || ''
        }));

        // Сортиране на данните
        episodeData.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return b.date - a.date;
                case 'oldest':
                    return a.date - b.date;
                case 'duration':
                    return b.duration - a.duration;
                default:
                    return 0;
            }
        });

        // Пренареждане на DOM елементите
        const fragment = document.createDocumentFragment();
        episodeData.forEach(item => {
            fragment.appendChild(item.element);
        });

        container.innerHTML = '';
        container.appendChild(fragment);

        this.resetCarousel();
        this.showNotification(`Сортирано по ${this.getSortLabel(sortBy)}`, 'success');

    }

    getSortLabel(sortBy) {
        const labels = {
            newest: 'най-нови',
            oldest: 'най-стари',
            duration: 'продължителност'
        };
        return labels[sortBy] || sortBy;
    }

    updateEpisodeCount(count = null) {
        const episodeCountElement = document.getElementById('episodeCount');
        if (!episodeCountElement) return;

        const visibleEpisodes = this.getVisibleEpisodes();
        const displayCount = count !== null ? count : visibleEpisodes.length;
        episodeCountElement.textContent = `(${displayCount})`;
    }

    toggleCardExpansion(episodeCard) {
        const isExpanded = episodeCard.classList.contains('expanded');

        if (isExpanded) {
            this.collapseCard(episodeCard);
        } else {
            this.collapseAllCards();
            this.expandCard(episodeCard);
        }
    }

    expandCard(episodeCard) {
        episodeCard.classList.add('expanded');

        setTimeout(() => {
            const rect = episodeCard.getBoundingClientRect();
            const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

            if (!isVisible) {
                episodeCard.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }, 300);
    }

    collapseCard(episodeCard) {
        episodeCard.classList.remove('expanded');
    }

    collapseAllCards() {
        const expandedCards = document.querySelectorAll('.episode-card.expanded');
        expandedCards.forEach(card => this.collapseCard(card));
    }

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

    shareEpisode(episodeCard, episodeIdFromBtn = null) {
        // Приоритет: 1) episodeId от бутона, 2) от картата, 3) от currentEpisode, 4) fallback
        let episodeId, title, description;
        
        // Първо опитваме се да използваме episodeId от бутона (ако е подаден)
        if (episodeIdFromBtn) {
            episodeId = episodeIdFromBtn;
        } else if (episodeCard) {
            // Данни от картата
            episodeId = episodeCard?.dataset?.episodeId;
        } else if (this.currentEpisode?.id) {
            // Данни от текущия епизод
            episodeId = this.currentEpisode.id;
        }
        
        // Извличаме заглавие и описание
        if (episodeCard) {
            title = episodeCard.querySelector('.episode-title')?.textContent || 'Епизод';
            description = episodeCard.querySelector('.episode-description')?.textContent || '';
        } else if (this.currentEpisode) {
            title = this.currentEpisode.title || 'Епизод';
            description = this.currentEpisode.description || '';
        } else {
            // Fallback - няма данни
            title = 'SmolyanVote Подкаст';
            description = 'Слушайте подкаста на SmolyanVote';
        }
        
        // Използваме специален URL за споделяне на епизод
        const shareUrl = episodeId ? `https://smolyanvote.com/podcast/episode/${episodeId}` : 'https://smolyanvote.com/podcast';

        if (navigator.share) {
            navigator.share({
                title: title,
                text: description,
                url: shareUrl
            }).catch(() => {
                this.copyToClipboard(title, description, shareUrl);
            });
        } else {
            this.copyToClipboard(title, description, shareUrl);
        }
    }

    copyToClipboard(title, description, url) {
        const shareUrl = url || window.location.href;
        const shareText = `${title} - ${description}\n${shareUrl}`;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => {
                this.showNotification('Копирано в клипборда!', 'success');
            }).catch(() => {
                this.showNotification('Не може да се копира', 'error');
            });
        } else {
            this.showNotification('Копиране не се поддържа', 'error');
        }
    }

    showNotification(text, type = 'info') {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${text}</span>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('visible'), 100);

        setTimeout(() => {
            notification.classList.remove('visible');
            setTimeout(() => notification.remove(), 300);
        }, type === 'error' ? 5000 : 3000);

        notification.addEventListener('click', () => {
            notification.classList.remove('visible');
            setTimeout(() => notification.remove(), 300);
        });
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            info: 'info-circle',
            warning: 'exclamation-triangle'
        };
        return icons[type] || 'info-circle';
    }

    addNotificationStyles() {
        if (document.getElementById('notification-styles')) return;

        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 2rem;
                right: 2rem;
                z-index: 10000;
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.3s ease;
                min-width: 280px;
                max-width: 400px;
            }
            
            .notification.visible {
                transform: translateX(0);
                opacity: 1;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                font-size: 0.875rem;
                font-weight: 500;
                cursor: pointer;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                backdrop-filter: blur(10px);
            }
            
            .notification-success .notification-content {
                background: #10b981;
                color: white;
            }
            
            .notification-error .notification-content {
                background: #ef4444;
                color: white;
            }
            
            .notification-info .notification-content {
                background: #3b82f6;
                color: white;
            }
            
            .notification-warning .notification-content {
                background: #f59e0b;
                color: white;
            }
            
            .notification i {
                font-size: 1rem;
                flex-shrink: 0;
            }
            
            @media (max-width: 768px) {
                .notification {
                    top: 1rem;
                    right: 1rem;
                    left: 1rem;
                    min-width: auto;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.podcastPlayer = new PodcastPlayer();
});

window.addEventListener('beforeunload', () => {
    if (window.podcastPlayer && window.podcastPlayer.wavesurfer) {
        window.podcastPlayer.wavesurfer.destroy();
    }
});