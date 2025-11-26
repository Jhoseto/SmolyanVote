/**
 * МОДЕРЕН PODCAST PLAYER WINDOW
 * Desktop версия - отделен frameless прозорец
 * Particles background с EQ визуализация която реагира на звука
 */

class PodcastWindowPlayer {
    constructor() {
        this.wavesurfer = null;
        this.currentEpisode = null;
        this.isPlaying = false;
        this.isAudioReady = false;
        this.volume = 1;
        this.playbackRate = 1;
        this.sleepTimer = null;
        this.windowRef = null;
        this.isMinimized = false;
        this.particlesInstance = null;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.animationFrame = null;
        this.eqActive = false;
        
        // Получаване на данни от родителския прозорец
        this.initFromParent();
        this.init();
    }

    initFromParent() {
        // Получаване на данни от URL параметри или localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const episodeData = urlParams.get('episode');
        
        if (episodeData) {
            try {
                this.currentEpisode = JSON.parse(decodeURIComponent(episodeData));
            } catch (e) {
                console.error('Error parsing episode data:', e);
            }
        }
        
        // Или от localStorage
        const savedEpisode = localStorage.getItem('podcast-current-episode');
        if (savedEpisode && !this.currentEpisode) {
            try {
                this.currentEpisode = JSON.parse(savedEpisode);
            } catch (e) {
                console.error('Error parsing saved episode:', e);
            }
        }
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
            return;
        }

        this.createUI();
        this.initParticles();
        this.initWaveSurfer();
        this.bindEvents();
        this.loadEpisode();
        
        // Синхронизация с родителския прозорец
        this.setupParentSync();
    }

    createUI() {
        const root = document.getElementById('podcast-window-root');
        if (!root) return;

        root.innerHTML = `
            <div class="podcast-window-container">
                <div class="podcast-particles-wrapper particles-background-wrapper" id="particlesWrapper">
                    <div class="particles-background" data-particles-theme="green" data-particles-count="100" id="particlesContainer"></div>
                </div>
                
                <div class="podcast-window-modal">
                    <button class="podcast-minimize-btn" id="minimizeBtn" title="Минимизирай">
                        <i class="bi bi-dash"></i>
                    </button>
                    
                    <div class="podcast-episode-info">
                        <img class="podcast-episode-image" id="episodeImage" src="/images/podcast-default.jpg" alt="Episode">
                        <div class="podcast-episode-details">
                            <h1 class="podcast-episode-title" id="episodeTitle">Изберете епизод</h1>
                            <p class="podcast-episode-description" id="episodeDescription">Кликнете върху епизод за възпроизвеждане</p>
                            <div class="podcast-episode-meta">
                                <span><i class="bi bi-clock"></i> <span id="episodeDuration">0:00</span></span>
                                <span><i class="bi bi-calendar"></i> <span id="episodeDate">-</span></span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="podcast-waveform-container">
                        <div id="podcast-waveform"></div>
                    </div>
                    
                    <div class="podcast-controls">
                        <div class="podcast-progress-section">
                            <span class="podcast-time-display" id="currentTime">0:00</span>
                            <div class="podcast-progress-bar-container" id="progressBar">
                                <div class="podcast-progress-bar-fill" id="progressFill"></div>
                            </div>
                            <span class="podcast-time-display" id="totalTime">0:00</span>
                        </div>
                        
                        <div class="podcast-main-controls">
                            <button class="podcast-control-btn" id="prevBtn" title="Предишен">
                                <i class="bi bi-skip-backward-fill"></i>
                            </button>
                            <button class="podcast-control-btn podcast-play-btn" id="playPauseBtn" title="Play/Pause">
                                <i class="bi bi-play-fill"></i>
                            </button>
                            <button class="podcast-control-btn" id="nextBtn" title="Следващ">
                                <i class="bi bi-skip-forward-fill"></i>
                            </button>
                        </div>
                        
                        <div class="podcast-secondary-controls">
                            <div class="podcast-control-group">
                                <button class="podcast-control-btn" id="volumeBtn" title="Volume">
                                    <i class="bi bi-volume-up-fill"></i>
                                </button>
                                <div class="podcast-volume-control">
                                    <input type="range" class="podcast-volume-slider" id="volumeSlider" min="0" max="1" step="0.01" value="1">
                                </div>
                            </div>
                            
                            <div class="podcast-control-group">
                                <div class="podcast-speed-control">
                                    <button class="podcast-dropdown-btn" id="speedBtn">
                                        <i class="bi bi-speedometer2"></i>
                                        <span id="speedText">1x</span>
                                        <i class="bi bi-chevron-up"></i>
                                    </button>
                                    <div class="podcast-dropdown-menu" id="speedMenu">
                                        <div class="podcast-dropdown-item" data-speed="0.5">0.5x</div>
                                        <div class="podcast-dropdown-item" data-speed="0.75">0.75x</div>
                                        <div class="podcast-dropdown-item active" data-speed="1">1x</div>
                                        <div class="podcast-dropdown-item" data-speed="1.25">1.25x</div>
                                        <div class="podcast-dropdown-item" data-speed="1.5">1.5x</div>
                                        <div class="podcast-dropdown-item" data-speed="2">2x</div>
                                    </div>
                                </div>
                                
                                <div class="podcast-timer-control">
                                    <button class="podcast-dropdown-btn" id="timerBtn">
                                        <i class="bi bi-alarm"></i>
                                        <span id="timerText">Sleep Timer</span>
                                        <i class="bi bi-chevron-up"></i>
                                    </button>
                                    <div class="podcast-dropdown-menu" id="timerMenu">
                                        <div class="podcast-dropdown-item" data-minutes="5">5 минути</div>
                                        <div class="podcast-dropdown-item" data-minutes="10">10 минути</div>
                                        <div class="podcast-dropdown-item" data-minutes="15">15 минути</div>
                                        <div class="podcast-dropdown-item" data-minutes="30">30 минути</div>
                                        <div class="podcast-dropdown-item" data-minutes="60">1 час</div>
                                        <div class="podcast-dropdown-item" data-minutes="0">Изключи</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="podcast-action-buttons">
                                <button class="podcast-action-btn" id="favoriteBtn" title="Добави в любими">
                                    <i class="bi bi-heart"></i>
                                </button>
                                <button class="podcast-action-btn" id="shareBtn" title="Сподели">
                                    <i class="bi bi-share"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    initParticles() {
        // Инициализиране на particles background
        const particlesContainer = document.getElementById('particlesContainer');
        if (particlesContainer && typeof initParticlesBackground !== 'undefined') {
            setTimeout(() => {
                initParticlesBackground('#particlesContainer');
                // Запазване на reference към particles instance
                // particles.js създава глобален масив pJSDom
                if (window.pJSDom && window.pJSDom.length > 0) {
                    this.particlesInstance = window.pJSDom[window.pJSDom.length - 1].pJS;
                }
            }, 200);
        }
    }

    initWaveSurfer() {
        const waveformContainer = document.getElementById('podcast-waveform');
        if (!waveformContainer) return;

        this.wavesurfer = WaveSurfer.create({
            container: '#podcast-waveform',
            waveColor: 'rgba(255, 255, 255, 0.3)',
            progressColor: '#4cb15c',
            cursorColor: '#ffffff',
            barWidth: 2,
            barRadius: 2,
            height: 50,
            responsive: true,
            normalize: true,
            backend: 'WebAudio',
            mediaControls: false
        });

        this.wavesurfer.on('ready', () => {
            this.isAudioReady = true;
            this.updateDuration();
            this.updatePlayButton();
            this.initAudioAnalyser();
        });

        this.wavesurfer.on('play', () => {
            this.isPlaying = true;
            this.updatePlayButton();
            this.startEQVisualization();
            this.notifyParent('play');
        });

        this.wavesurfer.on('pause', () => {
            this.isPlaying = false;
            this.updatePlayButton();
            this.stopEQVisualization();
            this.notifyParent('pause');
        });

        this.wavesurfer.on('finish', () => {
            this.isPlaying = false;
            this.updatePlayButton();
            this.stopEQVisualization();
            this.playNext();
        });

        this.wavesurfer.on('timeupdate', () => {
            this.updateProgress();
        });

        this.wavesurfer.on('error', (error) => {
            console.error('Audio error:', error);
            this.handleAudioError(error);
        });
    }

    initAudioAnalyser() {
        try {
            // Създаване на AudioContext от wavesurfer
            const audioElement = this.wavesurfer.getMediaElement();
            if (!audioElement) return;

            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;
            
            const source = this.audioContext.createMediaElementSource(audioElement);
            source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
        } catch (error) {
            console.warn('Could not initialize audio analyser:', error);
        }
    }

    startEQVisualization() {
        if (!this.analyser || !this.dataArray) return;
        
        this.eqActive = true;
        const particlesWrapper = document.getElementById('particlesWrapper');
        if (particlesWrapper) {
            particlesWrapper.classList.add('eq-active');
        }
        
        this.animateEQ();
    }

    stopEQVisualization() {
        this.eqActive = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        const particlesWrapper = document.getElementById('particlesWrapper');
        if (particlesWrapper) {
            particlesWrapper.classList.remove('eq-active');
        }
        
        // Връщане на particles към нормално състояние
        if (this.particlesInstance) {
            this.resetParticlesState();
        }
    }

    animateEQ() {
        if (!this.eqActive || !this.analyser || !this.dataArray) return;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Изчисляване на средна честота и амплитуда
        let sum = 0;
        let max = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
            if (this.dataArray[i] > max) max = this.dataArray[i];
        }
        const average = sum / this.dataArray.length;
        const intensity = max / 255; // Нормализиране между 0 и 1
        
        // Реакция на particles според звука
        if (this.particlesInstance) {
            this.updateParticlesForEQ(intensity, average);
        }
        
        // Обновяване на canvas brightness според звука
        const canvas = document.querySelector('#particlesContainer canvas');
        if (canvas) {
            const brightness = 1 + (intensity * 0.5); // От 1 до 1.5
            canvas.style.filter = `brightness(${brightness}) contrast(${1 + intensity * 0.3})`;
        }
        
        this.animationFrame = requestAnimationFrame(() => this.animateEQ());
    }

    updateParticlesForEQ(intensity, average) {
        // Получаване на particles instance от pJSDom
        if (!window.pJSDom || window.pJSDom.length === 0) return;
        
        const pJS = window.pJSDom[window.pJSDom.length - 1].pJS;
        if (!pJS || !pJS.particles || !pJS.particles.array) return;
        
        const particles = pJS.particles.array;
        const particleCount = particles.length;
        
        if (particleCount === 0) return;
        
        // Разделяне на честотни ленти
        const bands = 8;
        const bandSize = Math.floor(this.dataArray.length / bands);
        
        particles.forEach((particle, index) => {
            // Определяне на честотна лента за тази частица
            const bandIndex = Math.floor((index / particleCount) * bands);
            const bandStart = bandIndex * bandSize;
            const bandEnd = Math.min(bandStart + bandSize, this.dataArray.length);
            
            // Изчисляване на средна стойност за лентата
            let bandSum = 0;
            for (let i = bandStart; i < bandEnd; i++) {
                bandSum += this.dataArray[i];
            }
            const bandAverage = bandSum / (bandEnd - bandStart);
            const bandIntensity = bandAverage / 255;
            
            // Обновяване на размера на частицата според звука
            const baseSize = 3;
            const maxSize = 10;
            if (particle.size && particle.size.value !== undefined) {
                particle.size.value = baseSize + (bandIntensity * (maxSize - baseSize));
            }
            
            // Обновяване на скоростта според звука
            const baseSpeed = 2;
            const maxSpeed = 6;
            if (particle.vx !== undefined) {
                particle.vx = particle.vx * 0.8 + (baseSpeed + bandIntensity * (maxSpeed - baseSpeed)) * 0.2;
            }
            if (particle.vy !== undefined) {
                particle.vy = particle.vy * 0.8 + (baseSpeed + bandIntensity * (maxSpeed - baseSpeed)) * 0.2;
            }
            
            // Обновяване на opacity според звука
            const baseOpacity = 0.5;
            const maxOpacity = 1.0;
            if (particle.opacity && particle.opacity.value !== undefined) {
                particle.opacity.value = baseOpacity + (bandIntensity * (maxOpacity - baseOpacity));
            }
        });
    }

    resetParticlesState() {
        if (!window.pJSDom || window.pJSDom.length === 0) return;
        
        const pJS = window.pJSDom[window.pJSDom.length - 1].pJS;
        if (!pJS || !pJS.particles || !pJS.particles.array) return;
        
        const particles = pJS.particles.array;
        particles.forEach(particle => {
            if (particle.size && particle.size.value !== undefined) {
                particle.size.value = 3;
            }
            if (particle.opacity && particle.opacity.value !== undefined) {
                particle.opacity.value = 0.5;
            }
        });
    }

    bindEvents() {
        // Play/Pause
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        }

        // Previous/Next
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        if (prevBtn) prevBtn.addEventListener('click', () => this.playPrevious());
        if (nextBtn) nextBtn.addEventListener('click', () => this.playNext());

        // Volume
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeBtn = document.getElementById('volumeBtn');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        }
        if (volumeBtn) {
            volumeBtn.addEventListener('click', () => this.toggleMute());
        }

        // Progress bar
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => this.seekTo(e));
        }

        // Speed control
        const speedBtn = document.getElementById('speedBtn');
        const speedMenu = document.getElementById('speedMenu');
        if (speedBtn && speedMenu) {
            speedBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                speedMenu.classList.toggle('show');
            });
            
            speedMenu.querySelectorAll('.podcast-dropdown-item').forEach(item => {
                item.addEventListener('click', () => {
                    const speed = parseFloat(item.dataset.speed);
                    this.setPlaybackRate(speed);
                    speedMenu.querySelectorAll('.podcast-dropdown-item').forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                    speedMenu.classList.remove('show');
                });
            });
        }

        // Timer control
        const timerBtn = document.getElementById('timerBtn');
        const timerMenu = document.getElementById('timerMenu');
        if (timerBtn && timerMenu) {
            timerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                timerMenu.classList.toggle('show');
            });
            
            timerMenu.querySelectorAll('.podcast-dropdown-item').forEach(item => {
                item.addEventListener('click', () => {
                    const minutes = parseInt(item.dataset.minutes);
                    this.setSleepTimer(minutes);
                    timerMenu.classList.remove('show');
                });
            });
        }

        // Favorite
        const favoriteBtn = document.getElementById('favoriteBtn');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => this.toggleFavorite());
        }

        // Share
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareEpisode());
        }

        // Minimize
        const minimizeBtn = document.getElementById('minimizeBtn');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => this.minimize());
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.podcast-speed-control') && speedMenu && !e.target.closest('.podcast-timer-control')) {
                if (speedMenu) speedMenu.classList.remove('show');
                if (timerMenu) timerMenu.classList.remove('show');
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            
            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.seek(-10);
                    } else {
                        this.playPrevious();
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.seek(10);
                    } else {
                        this.playNext();
                    }
                    break;
                case 'KeyM':
                    e.preventDefault();
                    this.toggleMute();
                    break;
                case 'KeyF':
                    e.preventDefault();
                    this.toggleFavorite();
                    break;
                case 'KeyS':
                    e.preventDefault();
                    this.shareEpisode();
                    break;
            }
        });
    }

    async loadEpisode() {
        if (!this.currentEpisode || !this.currentEpisode.audioUrl) {
            return;
        }

        this.updateUI();
        this.isAudioReady = false;

        try {
            await this.wavesurfer.load(this.currentEpisode.audioUrl);
            if (this.currentEpisode.autoPlay) {
                setTimeout(() => this.wavesurfer.play(), 300);
            }
        } catch (error) {
            console.error('Error loading episode:', error);
            this.handleAudioError(error);
        }
    }

    updateUI() {
        if (!this.currentEpisode) return;

        const titleEl = document.getElementById('episodeTitle');
        const descEl = document.getElementById('episodeDescription');
        const imageEl = document.getElementById('episodeImage');
        const dateEl = document.getElementById('episodeDate');

        if (titleEl) titleEl.textContent = this.currentEpisode.title || 'Неизвестен епизод';
        if (descEl) descEl.textContent = this.currentEpisode.description || '';
        if (imageEl) imageEl.src = this.currentEpisode.imageUrl || '/images/podcast-default.jpg';
        if (dateEl && this.currentEpisode.date) {
            dateEl.textContent = new Date(this.currentEpisode.date).toLocaleDateString('bg-BG');
        }
    }

    togglePlayPause() {
        if (!this.wavesurfer || !this.isAudioReady) return;

        if (this.isPlaying) {
            this.wavesurfer.pause();
        } else {
            this.wavesurfer.play();
        }
    }

    updatePlayButton() {
        const btn = document.getElementById('playPauseBtn');
        const icon = btn?.querySelector('i');
        
        if (icon) {
            icon.className = this.isPlaying ? 'bi bi-pause-fill' : 'bi bi-play-fill';
        }
        
        if (btn) {
            btn.classList.toggle('playing', this.isPlaying);
        }
    }

    setVolume(volume) {
        this.volume = parseFloat(volume);
        if (this.wavesurfer) {
            this.wavesurfer.setVolume(this.volume);
        }
        this.updateVolumeIcon();
    }

    updateVolumeIcon() {
        const btn = document.getElementById('volumeBtn');
        const icon = btn?.querySelector('i');
        
        if (!icon) return;
        
        if (this.volume === 0) {
            icon.className = 'bi bi-volume-mute-fill';
        } else if (this.volume < 0.5) {
            icon.className = 'bi bi-volume-down-fill';
        } else {
            icon.className = 'bi bi-volume-up-fill';
        }
    }

    toggleMute() {
        if (this.volume > 0) {
            this.previousVolume = this.volume;
            this.setVolume(0);
        } else {
            this.setVolume(this.previousVolume || 1);
        }
        const slider = document.getElementById('volumeSlider');
        if (slider) slider.value = this.volume;
    }

    setPlaybackRate(rate) {
        this.playbackRate = rate;
        if (this.wavesurfer) {
            this.wavesurfer.setPlaybackRate(rate);
        }
        const speedText = document.getElementById('speedText');
        if (speedText) speedText.textContent = `${rate}x`;
    }

    setSleepTimer(minutes) {
        if (this.sleepTimer) {
            clearTimeout(this.sleepTimer);
            this.sleepTimer = null;
        }

        if (minutes === 0) {
            const timerText = document.getElementById('timerText');
            if (timerText) timerText.textContent = 'Sleep Timer';
            return;
        }

        this.sleepTimer = setTimeout(() => {
            if (this.wavesurfer && this.isPlaying) {
                this.wavesurfer.pause();
            }
            this.sleepTimer = null;
            const timerText = document.getElementById('timerText');
            if (timerText) timerText.textContent = 'Sleep Timer';
        }, minutes * 60 * 1000);

        const timerText = document.getElementById('timerText');
        if (timerText) timerText.textContent = `${minutes} мин`;
    }

    seekTo(event) {
        if (!this.wavesurfer || !this.isAudioReady) return;

        const rect = event.currentTarget.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        this.wavesurfer.seekTo(percent);
    }

    seek(seconds) {
        if (!this.wavesurfer || !this.isAudioReady) return;
        
        const currentTime = this.wavesurfer.getCurrentTime();
        const duration = this.wavesurfer.getDuration();
        const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
        this.wavesurfer.seekTo(newTime / duration);
    }

    updateProgress() {
        if (!this.wavesurfer || !this.isAudioReady) return;

        const currentTime = this.wavesurfer.getCurrentTime();
        const duration = this.wavesurfer.getDuration();

        if (!duration || duration === 0) return;

        const progress = (currentTime / duration) * 100;
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }

        const currentTimeEl = document.getElementById('currentTime');
        const totalTimeEl = document.getElementById('totalTime');
        
        if (currentTimeEl) currentTimeEl.textContent = this.formatTime(currentTime);
        if (totalTimeEl) totalTimeEl.textContent = this.formatTime(duration);
    }

    updateDuration() {
        if (!this.wavesurfer || !this.isAudioReady) return;

        const duration = this.wavesurfer.getDuration();
        const durationEl = document.getElementById('episodeDuration');
        if (durationEl) {
            durationEl.textContent = this.formatTime(duration);
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    playNext() {
        this.notifyParent('next');
    }

    playPrevious() {
        this.notifyParent('previous');
    }

    toggleFavorite() {
        const btn = document.getElementById('favoriteBtn');
        const isFavorited = btn?.classList.contains('favorited');
        
        if (btn) {
            btn.classList.toggle('favorited');
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = isFavorited ? 'bi bi-heart' : 'bi bi-heart-fill';
            }
        }
        
        this.notifyParent('favorite', { favorited: !isFavorited });
    }

    shareEpisode() {
        if (navigator.share && this.currentEpisode) {
            navigator.share({
                title: this.currentEpisode.title,
                text: this.currentEpisode.description,
                url: window.location.href
            }).catch(() => {
                this.copyToClipboard();
            });
        } else {
            this.copyToClipboard();
        }
    }

    copyToClipboard() {
        if (navigator.clipboard && this.currentEpisode) {
            navigator.clipboard.writeText(`${this.currentEpisode.title} - ${window.location.href}`)
                .then(() => {
                    this.showNotification('Копирано в клипборда!');
                });
        }
    }

    minimize() {
        // Минимизиране на прозореца
        if (this.windowRef) {
            this.windowRef.minimize();
        } else {
            // Fallback - скриване на прозореца
            window.close();
        }
    }

    handleAudioError(error) {
        console.error('Audio error:', error);
        this.isAudioReady = false;
        this.isPlaying = false;
        this.updatePlayButton();
        this.stopEQVisualization();
        this.showNotification('Грешка при зареждане на аудиото', 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${type === 'error' ? '#ef4444' : '#4cb15c'};
            color: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            backdrop-filter: blur(10px);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    setupParentSync() {
        // Слушане за съобщения от родителския прозорец
        window.addEventListener('message', (event) => {
            if (event.data.type === 'podcast-control') {
                this.handleParentCommand(event.data);
            }
        });
    }

    handleParentCommand(data) {
        switch (data.action) {
            case 'load':
                this.currentEpisode = data.episode;
                this.loadEpisode();
                break;
            case 'play':
                if (this.wavesurfer && this.isAudioReady) {
                    this.wavesurfer.play();
                }
                break;
            case 'pause':
                if (this.wavesurfer) {
                    this.wavesurfer.pause();
                }
                break;
            case 'toggle':
                this.togglePlayPause();
                break;
        }
    }

    notifyParent(action, data = {}) {
        // Изпращане на съобщение към родителския прозорец
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
                type: 'podcast-window-action',
                action,
                data
            }, '*');
        }
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.podcastWindowPlayer = new PodcastWindowPlayer();
});

// Cleanup при затваряне
window.addEventListener('beforeunload', () => {
    if (window.podcastWindowPlayer) {
        if (window.podcastWindowPlayer.wavesurfer) {
            window.podcastWindowPlayer.wavesurfer.destroy();
        }
        if (window.podcastWindowPlayer.animationFrame) {
            cancelAnimationFrame(window.podcastWindowPlayer.animationFrame);
        }
        if (window.podcastWindowPlayer.audioContext) {
            window.podcastWindowPlayer.audioContext.close();
        }
    }
});
