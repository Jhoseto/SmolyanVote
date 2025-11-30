/**
 * МОДЕРН PODCAST PLAYER WINDOW
 * Desktop версия - отделен frameless прозорец
 * Particles background с EQ визуализация която реагира на звука
 */

class PodcastWindowPlayer {
    constructor() {
        this.wavesurfer = null;
        this.currentEpisode = null;
        this.allEpisodes = [];
        this.currentEpisodeIndex = -1;
        this.isPlaying = false;
        this.isAudioReady = false;
        this.isLoading = false;
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
        this.carouselScrollPosition = 0;
        this.readyHandler = null;
        this.listenCountIncremented = false; // Флаг за проследяване дали listen count е инкрементиран
        this.currentLoadId = null; // Уникален ID за всяко зареждане
        
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

    async init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
            return;
        }

        this.createUI();
        this.initParticles();
        this.initWaveSurfer();
        this.bindEvents();
        await this.loadAllEpisodes();
        
        // Зареждане на епизод само ако има такъв
        if (this.currentEpisode && this.currentEpisode.audioUrl) {
            this.findCurrentEpisodeIndex();
            this.loadEpisode();
        }
        
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
                            <div class="podcast-loading-indicator" id="loadingIndicator" style="display: none;">
                                <div class="podcast-loading-spinner-small">
                                    <div class="spinner"></div>
                                </div>
                                <span>Зарежда се...</span>
                            </div>
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
                                <i class="bi bi-play-fill" id="playPauseIcon"></i>
                                <div class="podcast-loading-spinner" id="playLoadingSpinner" style="display: none;">
                                    <div class="spinner"></div>
                                </div>
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
                    
                    <!-- Search and Filter Section -->
                    <div class="podcast-search-filter-section">
                        <div class="podcast-search-box">
                            <i class="bi bi-search"></i>
                            <input type="text" id="episodeSearchInput" placeholder="Търси епизоди..." autocomplete="off">
                            <button class="podcast-clear-search" id="clearSearchBtn" style="display: none;">
                                <i class="bi bi-x"></i>
                            </button>
                        </div>
                        <div class="podcast-filter-controls">
                            <select id="episodeSortSelect" class="podcast-sort-select">
                                <option value="newest">Най-нови</option>
                                <option value="oldest">Най-стари</option>
                                <option value="duration-desc">Най-дълги</option>
                                <option value="duration-asc">Най-къси</option>
                                <option value="popular">Най-слушани</option>
                            </select>
                        </div>
                    </div>

                    <!-- Episodes Carousel -->
                    <div class="podcast-episodes-carousel-section">
                        <div class="podcast-episodes-header">
                            <h3 class="podcast-episodes-title">
                                <i class="bi bi-collection-play"></i>
                                <span id="episodesCount">Всички епизоди</span>
                            </h3>
                            <div class="podcast-carousel-nav">
                                <button class="podcast-carousel-nav-btn" id="carouselPrevBtn" disabled>
                                    <i class="bi bi-chevron-left"></i>
                                </button>
                                <button class="podcast-carousel-nav-btn" id="carouselNextBtn">
                                    <i class="bi bi-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                        <div class="podcast-episodes-carousel" id="episodesCarousel">
                            <div class="podcast-episodes-track" id="episodesTrack">
                                <div class="podcast-loading-episodes">
                                    <div class="podcast-loading-spinner-large">
                                        <div class="spinner"></div>
                                    </div>
                                    <p>Зареждане на епизоди...</p>
                                </div>
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
                if (window.pJSDom && window.pJSDom.length > 0) {
                    this.particlesInstance = window.pJSDom[window.pJSDom.length - 1].pJS;
                }
            }, 200);
        }
    }

    initWaveSurfer() {
        const waveformContainer = document.getElementById('podcast-waveform');
        if (!waveformContainer) return;

        // Ако вече има wavesurfer, не създаваме нов
        if (this.wavesurfer) {
            console.log('WaveSurfer already initialized');
            return;
        }

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

        // Event listeners - NE добавяме 'ready' тук, защото се управлява в loadEpisode()
        
        this.wavesurfer.on('play', () => {
            console.log('WaveSurfer play event fired');
            this.isPlaying = true;
            this.updatePlayButton();
            
            // Инициализация на audio analyser при първо възпроизвеждане (след user gesture)
            // Изчакваме по-дълго за да гарантираме че audio element е напълно готов
            if (!this.analyser || !this.dataArray) {
                // Опитваме се няколко пъти с увеличаващо се забавяне
                this.initAudioAnalyserWithRetry(0);
            }
            
            this.startEQVisualization();
            this.notifyParent('play');
            
            // Инкрементиране на listen count само веднъж за текущия епизод
            if (this.currentEpisode?.id && !this.listenCountIncremented) {
                this.listenCountIncremented = true;
                this.incrementListenCount(this.currentEpisode.id);
            }
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
            
            // Автоматично преминаване към следващия епизод
            if (this.allEpisodes.length > 1) {
                // Задаваме autoPlay за следващия епизод
                setTimeout(() => {
                    this.playNext();
                }, 500);
            }
        });

        this.wavesurfer.on('timeupdate', () => {
            this.updateProgress();
        });

        this.wavesurfer.on('error', (error) => {
            console.error('Audio error:', error);
            this.handleAudioError(error);
        });
    }

    initAudioAnalyserWithRetry(attempt = 0, maxAttempts = 5) {
        // Увеличаващи се забавяния - даваме повече време на audio element да се зареди
        const delays = [300, 500, 800, 1200, 2000];
        const delay = delays[Math.min(attempt, delays.length - 1)] || 2000;
        
        setTimeout(() => {
            // Проверка дали все още се възпроизвежда (ако не, не правим нищо)
            if (!this.isPlaying) {
                console.log('Not playing anymore, skipping analyser initialization');
                return;
            }
            
            const success = this.initAudioAnalyser();
            if (!success && attempt < maxAttempts - 1) {
                console.log(`Retrying audio analyser initialization (attempt ${attempt + 1}/${maxAttempts})...`);
                this.initAudioAnalyserWithRetry(attempt + 1, maxAttempts);
            } else if (!success) {
                console.warn('Failed to initialize audio analyser after all attempts - EQ visualization will not work');
            } else {
                console.log('✅ Audio analyser initialized successfully');
            }
        }, delay);
    }

    initAudioAnalyser() {
        try {
            // Почистване на стар analyser
            if (this.analyser) {
                try {
                    if (this.analyser.disconnect) {
                        this.analyser.disconnect();
                    }
                } catch (e) {
                    // Ignore
                }
                this.analyser = null;
            }

            // WaveSurfer 7 използва различен API - media е в backend
            let audioElement = null;
            
            // Опит 1: getMediaElement()
            if (this.wavesurfer.getMediaElement) {
                audioElement = this.wavesurfer.getMediaElement();
            }
            
            // Опит 2: backend.media
            if (!audioElement && this.wavesurfer.backend?.media) {
                audioElement = this.wavesurfer.backend.media;
            }
            
            // Опит 3: намиране на audio елемента в DOM
            if (!audioElement) {
                const container = document.getElementById('podcast-waveform');
                if (container) {
                    audioElement = container.querySelector('audio');
                }
            }
            
            // Опит 4: Проверка дали audio element е готов
            if (!audioElement || !(audioElement instanceof HTMLMediaElement)) {
                // Не показваме warning - това е нормално при първи опит, retry логиката ще се погрижи
                return false;
            }
            
            // Проверяваме дали audio element е напълно зареден
            // readyState: 0=HAVE_NOTHING, 1=HAVE_METADATA, 2=HAVE_CURRENT_DATA, 3=HAVE_FUTURE_DATA, 4=HAVE_ENOUGH_DATA
            // Искаме поне HAVE_CURRENT_DATA (2) за да работи analyser-ът
            if (audioElement.readyState < 2) {
                // Не показваме warning - това е нормално при първи опит
                return false;
            }
            
            // Допълнителна проверка - дали audio element има валиден src
            if (!audioElement.src || audioElement.src === '') {
                return false;
            }

            console.log('Found audio element, readyState:', audioElement.readyState, audioElement);

            // Използване на AudioContext от wavesurfer или създаване на нов
            if (this.wavesurfer.backend?.ac) {
                this.audioContext = this.wavesurfer.backend.ac;
            } else if (this.wavesurfer.backend?.audioContext) {
                this.audioContext = this.wavesurfer.backend.audioContext;
            } else {
                if (!this.audioContext || this.audioContext.state === 'closed') {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
            }

            // Проверка за състояние на AudioContext
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log('AudioContext resumed');
                }).catch(err => {
                    console.warn('Could not resume AudioContext:', err);
                });
            }

            // Създаване на analyser
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;
            
            // Свързване на source node
            let sourceNode = null;
            
            // Проверка дали вече има source node
            if (this.wavesurfer.backend?.source) {
                sourceNode = this.wavesurfer.backend.source;
            } else if (this.wavesurfer.backend?.sourceNode) {
                sourceNode = this.wavesurfer.backend.sourceNode;
            } else {
                // Създаване на нов source node
                try {
                    sourceNode = this.audioContext.createMediaElementSource(audioElement);
                    // Запазване на source node
                    if (this.wavesurfer.backend) {
                        this.wavesurfer.backend.source = sourceNode;
                    }
                } catch (err) {
                    // Възможно е вече да има source node, но не го намираме
                    console.warn('Could not create media source (may already exist):', err);
                    return false;
                }
            }
            
            // Свързване на analyser
            try {
                sourceNode.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
                
                const bufferLength = this.analyser.frequencyBinCount;
                this.dataArray = new Uint8Array(bufferLength);
                
                console.log('Audio analyser initialized successfully');
                return true;
            } catch (err) {
                console.warn('Could not connect analyser:', err);
                this.analyser = null;
                this.dataArray = null;
                return false;
            }
        } catch (error) {
            console.warn('Could not initialize audio analyser:', error);
            this.analyser = null;
            this.dataArray = null;
            return false;
        }
    }

    startEQVisualization() {
        if (!this.analyser || !this.dataArray) {
            // Опит за реинициализация с retry логика
            this.initAudioAnalyserWithRetry(0);
            return;
        }
        
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
        
        if (this.particlesInstance) {
            this.resetParticlesState();
        }
    }

    animateEQ() {
        if (!this.eqActive || !this.analyser || !this.dataArray) {
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }
            return;
        }
        
        try {
            this.analyser.getByteFrequencyData(this.dataArray);
            
            let sum = 0;
            let max = 0;
            for (let i = 0; i < this.dataArray.length; i++) {
                sum += this.dataArray[i];
                if (this.dataArray[i] > max) max = this.dataArray[i];
            }
            const average = sum / this.dataArray.length;
            const intensity = max / 255;
            
            if (this.particlesInstance) {
                this.updateParticlesForEQ(intensity, average);
            }
            
            const canvas = document.querySelector('#particlesContainer canvas');
            if (canvas) {
                const brightness = 1 + (intensity * 0.5);
                canvas.style.filter = `brightness(${brightness}) contrast(${1 + intensity * 0.3})`;
            }
        } catch (err) {
            console.warn('Error in EQ animation:', err);
            this.stopEQVisualization();
        }
        
        this.animationFrame = requestAnimationFrame(() => this.animateEQ());
    }

    updateParticlesForEQ(intensity, average) {
        if (!window.pJSDom || window.pJSDom.length === 0) return;
        
        const pJS = window.pJSDom[window.pJSDom.length - 1].pJS;
        if (!pJS || !pJS.particles || !pJS.particles.array) return;
        
        const particles = pJS.particles.array;
        const particleCount = particles.length;
        if (particleCount === 0) return;
        
        const bands = 8;
        const bandSize = Math.floor(this.dataArray.length / bands);
        
        particles.forEach((particle, index) => {
            const bandIndex = Math.floor((index / particleCount) * bands);
            const bandStart = bandIndex * bandSize;
            const bandEnd = Math.min(bandStart + bandSize, this.dataArray.length);
            
            let bandSum = 0;
            for (let i = bandStart; i < bandEnd; i++) {
                bandSum += this.dataArray[i];
            }
            const bandAverage = bandSum / (bandEnd - bandStart);
            const bandIntensity = bandAverage / 255;
            
            const baseSize = 3;
            const maxSize = 10;
            if (particle.size && particle.size.value !== undefined) {
                particle.size.value = baseSize + (bandIntensity * (maxSize - baseSize));
            }
            
            const baseSpeed = 2;
            const maxSpeed = 6;
            if (particle.vx !== undefined) {
                particle.vx = particle.vx * 0.8 + (baseSpeed + bandIntensity * (maxSpeed - baseSpeed)) * 0.2;
            }
            if (particle.vy !== undefined) {
                particle.vy = particle.vy * 0.8 + (baseSpeed + bandIntensity * (maxSpeed - baseSpeed)) * 0.2;
            }
            
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

        const favoriteBtn = document.getElementById('favoriteBtn');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => this.toggleFavorite());
        }

        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareEpisode());
        }

        const minimizeBtn = document.getElementById('minimizeBtn');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => this.minimize());
        }

        const carouselPrevBtn = document.getElementById('carouselPrevBtn');
        const carouselNextBtn = document.getElementById('carouselNextBtn');
        const episodesTrack = document.getElementById('episodesTrack');
        
        if (carouselPrevBtn) {
            carouselPrevBtn.addEventListener('click', () => this.scrollCarousel(-1));
        }
        if (carouselNextBtn) {
            carouselNextBtn.addEventListener('click', () => this.scrollCarousel(1));
        }
        if (episodesTrack) {
            episodesTrack.addEventListener('scroll', () => {
                this.carouselScrollPosition = episodesTrack.scrollLeft;
                this.updateCarouselNavigation();
            });
        }

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.podcast-speed-control') && speedMenu && !e.target.closest('.podcast-timer-control')) {
                if (speedMenu) speedMenu.classList.remove('show');
                if (timerMenu) timerMenu.classList.remove('show');
            }
        });

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

    async loadAllEpisodes() {
        const track = document.getElementById('episodesTrack');
        const loadingEl = track?.querySelector('.podcast-loading-episodes');
        
        try {
            const response = await fetch('/api/podcast/episodes', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                const text = await response.text();
                console.error('API Error Response:', text);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Expected JSON but got:', contentType, text.substring(0, 200));
                throw new Error('Response is not JSON');
            }
            
            const episodes = await response.json();
            
            if (!Array.isArray(episodes)) {
                throw new Error('Invalid response format');
            }
            
            this.allEpisodes = episodes;
            
            if (loadingEl) {
                loadingEl.style.display = 'none';
            }
            
            if (this.allEpisodes.length === 0) {
                this.showEmptyState();
                return;
            }
            
            this.renderEpisodesCarousel();
            this.findCurrentEpisodeIndex();
            this.setupSearchAndFilter();
            
        } catch (error) {
            console.error('Error loading episodes:', error);
            if (loadingEl) {
                loadingEl.innerHTML = `
                    <div class="podcast-error-state">
                        <i class="bi bi-exclamation-triangle"></i>
                        <p>Грешка при зареждане на епизодите</p>
                        <button class="podcast-retry-btn" onclick="window.podcastWindowPlayer.loadAllEpisodes()">
                            <i class="bi bi-arrow-clockwise"></i> Опитай отново
                        </button>
                    </div>
                `;
            }
        }
    }

    showEmptyState() {
        const track = document.getElementById('episodesTrack');
        if (track) {
            track.innerHTML = `
                <div class="podcast-empty-state">
                    <i class="bi bi-inbox"></i>
                    <p>Няма налични епизоди</p>
                </div>
            `;
        }
    }

    setupSearchAndFilter() {
        const searchInput = document.getElementById('episodeSearchInput');
        const clearBtn = document.getElementById('clearSearchBtn');
        const sortSelect = document.getElementById('episodeSortSelect');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterEpisodes(e.target.value);
                clearBtn.style.display = e.target.value ? 'flex' : 'none';
            });
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                this.filterEpisodes('');
                clearBtn.style.display = 'none';
            });
        }
        
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortEpisodes(e.target.value);
            });
        }
    }

    filterEpisodes(searchTerm) {
        const filtered = this.allEpisodes.filter(episode => {
            const term = searchTerm.toLowerCase();
            return episode.title?.toLowerCase().includes(term) ||
                   episode.description?.toLowerCase().includes(term) ||
                   episode.episodeNumber?.toString().includes(term);
        });
        
        this.renderFilteredEpisodes(filtered);
        this.updateEpisodesCount(filtered.length);
    }

    sortEpisodes(sortBy) {
        let sorted = [...this.allEpisodes];
        
        switch(sortBy) {
            case 'newest':
                sorted.sort((a, b) => {
                    const dateA = new Date(a.publishDate || 0);
                    const dateB = new Date(b.publishDate || 0);
                    return dateB - dateA;
                });
                break;
            case 'oldest':
                sorted.sort((a, b) => {
                    const dateA = new Date(a.publishDate || 0);
                    const dateB = new Date(b.publishDate || 0);
                    return dateA - dateB;
                });
                break;
            case 'duration-desc':
                sorted.sort((a, b) => (b.durationSeconds || 0) - (a.durationSeconds || 0));
                break;
            case 'duration-asc':
                sorted.sort((a, b) => (a.durationSeconds || 0) - (b.durationSeconds || 0));
                break;
            case 'popular':
                sorted.sort((a, b) => (b.listenCount || 0) - (a.listenCount || 0));
                break;
        }
        
        this.allEpisodes = sorted;
        this.renderEpisodesCarousel();
        this.updateEpisodesCount(this.allEpisodes.length);
    }

    renderFilteredEpisodes(episodes) {
        const track = document.getElementById('episodesTrack');
        if (!track) return;
        
        if (episodes.length === 0) {
            track.innerHTML = `
                <div class="podcast-empty-state">
                    <i class="bi bi-search"></i>
                    <p>Няма намерени епизоди</p>
                </div>
            `;
            return;
        }
        
        // ВАЖНО: Използваме правилния индекс от allEpisodes масива
        track.innerHTML = episodes.map((episode) => {
            // Намираме правилния индекс в allEpisodes масива
            const correctIndex = this.allEpisodes.findIndex(ep => 
                ep.id === episode.id || ep.audioUrl === episode.audioUrl
            );
            
            // Ако не намерим, използваме първия намерен или 0
            const actualIndex = correctIndex >= 0 ? correctIndex : 0;
            
            const isActive = this.currentEpisode && 
                (episode.id === this.currentEpisode.id || 
                 episode.audioUrl === this.currentEpisode.audioUrl ||
                 actualIndex === this.currentEpisodeIndex);
            
            return this.createEpisodeCard(episode, actualIndex, isActive);
        }).join('');
        
        this.bindEpisodeCards();
        this.updateCarouselNavigation();
    }

    createEpisodeCard(episode, index, isActive) {
        return `
            <div class="podcast-episode-card ${isActive ? 'active' : ''}" 
                 data-episode-index="${index}"
                 data-episode-id="${episode.id}">
                <div class="podcast-episode-card-image">
                    <img src="${episode.imageUrl || '/images/podcast-default.jpg'}" 
                         alt="${episode.title}"
                         loading="lazy"
                         onerror="this.src='/images/podcast-default.jpg'">
                    <div class="podcast-episode-card-overlay">
                        <button class="podcast-episode-card-play-btn" data-episode-index="${index}">
                            <i class="bi bi-play-fill"></i>
                        </button>
                    </div>
                    ${(episode.listenCount && episode.listenCount > 0) ? `
                        <div class="podcast-episode-card-badge">
                            <i class="bi bi-headphones"></i>
                            <span>${this.formatNumber(episode.listenCount)}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="podcast-episode-card-info">
                    <h4 class="podcast-episode-card-title">${this.escapeHtml(episode.title || 'Без заглавие')}</h4>
                    <div class="podcast-episode-card-meta">
                        <span><i class="bi bi-clock"></i> ${episode.formattedDuration || '0:00'}</span>
                        ${episode.episodeNumber ? `<span><i class="bi bi-hash"></i> ${episode.episodeNumber}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    formatNumber(num) {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async incrementListenCount(episodeId) {
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
                if (this.currentEpisode) {
                    this.currentEpisode.listenCount = updatedEpisode.listenCount;
                }
                this.updateListenCountInCarousel(episodeId, updatedEpisode.listenCount);
            }
        } catch (error) {
            console.warn('Failed to increment listen count:', error);
        }
    }

    updateListenCountInCarousel(episodeId, newCount) {
        const episodeCard = document.querySelector(`.podcast-episode-card[data-episode-id="${episodeId}"]`);
        if (episodeCard) {
            let badge = episodeCard.querySelector('.podcast-episode-card-badge');
            
            if (newCount > 0) {
                if (!badge) {
                    badge = document.createElement('div');
                    badge.className = 'podcast-episode-card-badge';
                    const imageContainer = episodeCard.querySelector('.podcast-episode-card-image');
                    if (imageContainer) {
                        imageContainer.appendChild(badge);
                    }
                }
                badge.innerHTML = `<i class="bi bi-headphones"></i><span>${this.formatNumber(newCount)}</span>`;
            } else if (badge) {
                badge.remove();
            }
        }
        
        const episodeIndex = this.allEpisodes.findIndex(ep => ep.id === episodeId);
        if (episodeIndex >= 0) {
            this.allEpisodes[episodeIndex].listenCount = newCount;
        }
    }

    updateEpisodesCount(count) {
        const countEl = document.getElementById('episodesCount');
        if (countEl) {
            countEl.textContent = count === this.allEpisodes.length 
                ? `Всички епизоди (${count})`
                : `Намерени епизоди (${count})`;
        }
    }

    bindEpisodeCards() {
        const track = document.getElementById('episodesTrack');
        if (!track) return;
        
        // Премахване на всички стари event listeners
        const cards = track.querySelectorAll('.podcast-episode-card');
        
        // Премахване на старите listeners чрез клониране
        cards.forEach(card => {
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
        });
        
        // Добавяне на нови event listeners
        setTimeout(() => {
            const newCards = track.querySelectorAll('.podcast-episode-card');
            
            newCards.forEach(card => {
                // Използваме episode ID за по-надеждна идентификация
                const episodeId = card.dataset.episodeId;
                const indexAttr = card.dataset.episodeIndex;
                
                card.addEventListener('click', (e) => {
                    if (e.target.closest('.podcast-episode-card-play-btn')) {
                        return;
                    }
                    
                    e.stopPropagation();
                    
                    // Намираме правилния индекс по ID или по атрибут
                    let correctIndex = -1;
                    
                    if (episodeId) {
                        correctIndex = this.allEpisodes.findIndex(ep => 
                            ep.id?.toString() === episodeId.toString()
                        );
                    }
                    
                    // Fallback към индекс атрибута
                    if (correctIndex < 0 && indexAttr) {
                        const parsedIndex = parseInt(indexAttr);
                        if (!isNaN(parsedIndex) && parsedIndex >= 0 && parsedIndex < this.allEpisodes.length) {
                            correctIndex = parsedIndex;
                        }
                    }
                    
                    if (correctIndex >= 0 && correctIndex < this.allEpisodes.length) {
                        console.log('Card clicked, loading episode by ID:', episodeId, 'index:', correctIndex);
                        this.selectEpisode(correctIndex);
                    } else {
                        console.warn('Could not find correct episode index for card:', card);
                    }
                });
            });
            
            const newPlayButtons = track.querySelectorAll('.podcast-episode-card-play-btn');
            newPlayButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const episodeCard = btn.closest('.podcast-episode-card');
                    if (episodeCard) {
                        const episodeId = episodeCard.dataset.episodeId;
                        const indexAttr = episodeCard.dataset.episodeIndex;
                        
                        // Намираме правилния индекс по ID или по атрибут
                        let correctIndex = -1;
                        
                        if (episodeId) {
                            correctIndex = this.allEpisodes.findIndex(ep => 
                                ep.id?.toString() === episodeId.toString()
                            );
                        }
                        
                        // Fallback към индекс атрибута
                        if (correctIndex < 0 && indexAttr) {
                            const parsedIndex = parseInt(indexAttr);
                            if (!isNaN(parsedIndex) && parsedIndex >= 0 && parsedIndex < this.allEpisodes.length) {
                                correctIndex = parsedIndex;
                            }
                        }
                        
                        if (correctIndex >= 0 && correctIndex < this.allEpisodes.length) {
                            console.log('Play button clicked, loading episode by ID:', episodeId, 'index:', correctIndex);
                            this.selectEpisode(correctIndex);
                        } else {
                            console.warn('Could not find correct episode index for play button:', episodeCard);
                        }
                    }
                });
            });
        }, 50);
    }

    findCurrentEpisodeIndex() {
        if (!this.currentEpisode) return;
        this.currentEpisodeIndex = this.allEpisodes.findIndex(
            ep => ep.id === this.currentEpisode.id || 
                  ep.audioUrl === this.currentEpisode.audioUrl
        );
    }

    renderEpisodesCarousel() {
        const track = document.getElementById('episodesTrack');
        const carouselSection = document.querySelector('.podcast-episodes-carousel-section');
        
        if (!track) {
            console.error('Episodes track not found!');
            return;
        }
        
        if (this.allEpisodes.length === 0) {
            this.showEmptyState();
            return;
        }
        
        if (carouselSection) {
            carouselSection.style.display = 'block';
            carouselSection.style.visibility = 'visible';
            carouselSection.style.opacity = '1';
        }

        track.innerHTML = this.allEpisodes.map((episode, index) => {
            const isActive = this.currentEpisode && 
                (episode.id === this.currentEpisode.id || episode.audioUrl === this.currentEpisode.audioUrl);
            
            return this.createEpisodeCard(episode, index, isActive);
        }).join('');

        this.bindEpisodeCards();
        this.updateCarouselNavigation();
        this.updateEpisodesCount(this.allEpisodes.length);
        
        if (track) {
            track.style.display = 'flex';
            track.style.visibility = 'visible';
            track.style.opacity = '1';
        }
        
        const carousel = document.getElementById('episodesCarousel');
        if (carousel) {
            carousel.style.display = 'block';
            carousel.style.visibility = 'visible';
            carousel.style.opacity = '1';
        }
    }

    async selectEpisode(index) {
        console.log('=== SELECT EPISODE ===', index, 'of', this.allEpisodes.length);
        
        // ВАЖНО: Валидация на индекса ПРЕДИ всичко
        if (index < 0 || index >= this.allEpisodes.length) {
            console.error('❌ Invalid episode index:', index, 'max:', this.allEpisodes.length - 1);
            return;
        }
        
        // ВАЖНО: Вземаме епизода директно от allEpisodes масива
        const episode = this.allEpisodes[index];
        if (!episode) {
            console.error('❌ Episode not found at index:', index);
            console.error('Available episodes:', this.allEpisodes.map((e, i) => ({ index: i, id: e.id, title: e.title })));
            return;
        }
        
        if (!episode.audioUrl) {
            console.error('❌ Episode missing audioUrl:', episode);
            return;
        }
        
        // ВАЖНО: Проверка дали е същия епизод по ID или audioUrl
        const isSameEpisode = this.currentEpisode && (
            (this.currentEpisode.id && episode.id && this.currentEpisode.id === episode.id) ||
            this.currentEpisode.audioUrl === episode.audioUrl
        );
        
        // Ако избираме същия епизод и вече е зареден, просто го рестартираме
        if (isSameEpisode && this.isAudioReady && !this.isLoading) {
            console.log('Same episode selected, restarting from beginning');
            if (this.wavesurfer) {
                try {
                    this.wavesurfer.seekTo(0);
                    if (!this.isPlaying) {
                        this.wavesurfer.play();
                    }
                } catch (e) {
                    console.warn('Error restarting episode:', e);
                }
            }
            return;
        }
        
        // Ако вече се зарежда СЪЩИЯ епизод, не правим нищо
        if (this.isLoading && isSameEpisode) {
            console.log('Same episode already loading, ignoring click');
            return;
        }
        
        // Ако вече се зарежда РАЗЛИЧЕН епизод, принудително спираме и зареждаме новия
        if (this.isLoading && !isSameEpisode) {
            console.log('Different episode loading, forcing stop and loading new one');
            // Принудително спираме текущото зареждане
            this.setLoadingState(false);
            this.isAudioReady = false;
            // Премахваме всички ready listeners за да избегнем конфликти
            if (this.wavesurfer) {
                this.wavesurfer.un('ready');
            }
        }
        
        console.log('Loading NEW episode:', episode.title);
        console.log('Episode ID:', episode.id);
        console.log('Audio URL:', episode.audioUrl);
        console.log('Current index:', index);
        
        // ВИНАГИ стартираме автоматично при кликване на епизод от прозореца
        const shouldAutoPlay = true;
        
        // Пълно спиране и почистване на текущото възпроизвеждане
        this.stopCurrentEpisode();
        
        // ВАЖНО: Премахваме ВСИЧКИ стари ready listeners ПРЕДИ да актуализираме currentEpisode
        if (this.wavesurfer) {
            this.wavesurfer.un('ready');
        }
        
        // ВАЖНО: Създаваме нов обект с всички данни от епизода
        // Това трябва да се случи ПРЕДИ loadEpisode() за да работи правилно
        this.currentEpisode = {
            id: episode.id,
            title: episode.title,
            description: episode.description,
            audioUrl: episode.audioUrl,
            imageUrl: episode.imageUrl,
            publishDate: episode.publishDate,
            durationSeconds: episode.durationSeconds,
            formattedDuration: episode.formattedDuration,
            episodeNumber: episode.episodeNumber,
            listenCount: episode.listenCount,
            autoPlay: shouldAutoPlay
        };
        this.currentEpisodeIndex = index;
        
        // Запазване в localStorage
        localStorage.setItem('podcast-current-episode', JSON.stringify(this.currentEpisode));
        
        // Актуализиране на UI ВЕДНАГА (преди зареждане)
        this.updateUI();
        this.updateEpisodesCarousel();
        
        // Показване на loading индикатор
        this.showLoadingIndicator();
        
        // Малко изчакване за да се успокоят всички операции
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Зареждане на новия епизод (ще стартира автоматично)
        this.loadEpisode();
    }

    stopCurrentEpisode() {
        console.log('=== STOPPING CURRENT EPISODE ===');
        
        // Спиране на текущото възпроизвеждане
        if (this.wavesurfer) {
            try {
                // ВАЖНО: Спираме възпроизвеждането
                if (this.isPlaying) {
                    this.wavesurfer.pause();
                }
                
                // ВАЖНО: Премахваме текущото зареждане ако има такова
                // Това гарантира че новото зареждане ще работи правилно
                try {
                    // Опитваме се да "unload" текущото аудио
                    // WaveSurfer няма директна unload функция, но можем да заредим празен URL или да изчакаме
                    // Вместо това, просто ще изчакаме да завърши текущото зареждане ако има такова
                } catch (e) {
                    console.warn('Error in stopCurrentEpisode wavesurfer:', e);
                }
            } catch (e) {
                console.warn('Error stopping wavesurfer:', e);
            }
        }
        
        this.isPlaying = false;
        this.isAudioReady = false;
        this.listenCountIncremented = false; // Нулиране на флага за нов епизод
        this.updatePlayButton();
        
        // Почистване на EQ визуализацията
        this.stopEQVisualization();
        
        // Почистване на audio analyser
        if (this.analyser) {
            try {
                if (this.analyser.disconnect) {
                    this.analyser.disconnect();
                }
            } catch (e) {
                console.warn('Error disconnecting analyser:', e);
            }
            this.analyser = null;
            this.dataArray = null;
        }
        
        console.log('Current episode stopped');
    }

    updateEpisodesCarousel() {
        const cards = document.querySelectorAll('.podcast-episode-card');
        cards.forEach((card) => {
            const cardIndex = parseInt(card.dataset.episodeIndex);
            const isActive = cardIndex === this.currentEpisodeIndex || 
                           (this.currentEpisode && 
                            (card.dataset.episodeId === this.currentEpisode.id?.toString() ||
                             card.querySelector('img')?.src === this.currentEpisode.imageUrl));
            card.classList.toggle('active', isActive);
        });
        
        if (this.currentEpisodeIndex >= 0) {
            const activeCard = Array.from(cards).find(card => 
                parseInt(card.dataset.episodeIndex) === this.currentEpisodeIndex
            );
            if (activeCard) {
                activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }

    updateCarouselNavigation() {
        const track = document.getElementById('episodesTrack');
        const prevBtn = document.getElementById('carouselPrevBtn');
        const nextBtn = document.getElementById('carouselNextBtn');
        
        if (!track || !prevBtn || !nextBtn) return;

        const maxScroll = track.scrollWidth - track.clientWidth;
        prevBtn.disabled = this.carouselScrollPosition <= 0;
        nextBtn.disabled = this.carouselScrollPosition >= maxScroll - 10;
    }

    async loadEpisode() {
        // ВАЖНО: Валидация преди всичко
        if (!this.currentEpisode) {
            console.error('❌ Cannot load: currentEpisode is null');
            this.setLoadingState(false);
            return;
        }

        if (!this.currentEpisode.audioUrl) {
            console.error('❌ Cannot load: missing audioUrl', this.currentEpisode);
            this.setLoadingState(false);
            return;
        }

        if (!this.wavesurfer) {
            console.error('❌ WaveSurfer not initialized');
            this.setLoadingState(false);
            return;
        }

        // ВАЖНО: Проверка дали вече се зарежда
        if (this.isLoading) {
            console.warn('⚠️ Already loading, waiting for current load to complete...');
            // Изчакваме малко и пробваме отново
            await new Promise(resolve => setTimeout(resolve, 300));
            // Проверяваме отново
            if (this.isLoading) {
                console.warn('⚠️ Still loading, aborting this load attempt');
                return;
            }
        }

        // ВАЖНО: Запазваме референциите ПРЕДИ async операции
        const episodeId = this.currentEpisode.id;
        const episodeTitle = this.currentEpisode.title;
        const audioUrl = this.currentEpisode.audioUrl;
        const shouldAutoPlay = this.currentEpisode.autoPlay === true;
        
        // ВАЖНО: Генерираме уникален ID за това зареждане
        const loadId = Date.now() + Math.random();
        this.currentLoadId = loadId;
        
        console.log('=== LOADING EPISODE ===');
        console.log('Load ID:', loadId);
        console.log('Episode ID:', episodeId);
        console.log('Title:', episodeTitle);
        console.log('Audio URL:', audioUrl);
        console.log('AutoPlay:', shouldAutoPlay);

        // Почистване на старото състояние
        this.isAudioReady = false;
        this.setLoadingState(true);

        try {
            // ВАЖНО: Спираме всичко преди да заредим ново
            if (this.wavesurfer) {
                try {
                    // Спираме възпроизвеждането ако е активно
                    if (this.isPlaying) {
                        this.wavesurfer.pause();
                    }
                    // Спираме всички активни зареждания
                    // WaveSurfer няма директна функция за това, но можем да изчакаме малко
                } catch (e) {
                    console.warn('Error preparing wavesurfer for new load:', e);
                }
            }
            
            // Малко изчакване за да се успокоят всички операции
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // ВАЖНО: Премахване на всички стари 'ready' listeners (допълнителна защита)
            // Вече са премахнати в selectEpisode, но това е допълнителна защита
            this.wavesurfer.un('ready');
            
            // Добавяне на нов 'ready' listener за този конкретен load
            const readyPromise = new Promise((resolve, reject) => {
                let timeoutId;
                let resolved = false;
                let handlerAttached = false;
                
                const readyHandler = () => {
                    // ВАЖНО: Проверка дали това зареждане все още е валидно
                    if (this.currentLoadId !== loadId) {
                        console.warn('⚠️ Ready handler for old load, ignoring (loadId mismatch)', {
                            expected: loadId,
                            current: this.currentLoadId
                        });
                        return;
                    }
                    
                    // ВАЖНО: Проверка дали вече е resolved
                    if (resolved) {
                        console.warn('⚠️ Ready handler already resolved, ignoring duplicate event');
                        return;
                    }
                    
                    // ВАЖНО: Проверка дали все още е правилния епизод ПРЕДИ да маркираме като resolved
                    if (!this.currentEpisode) {
                        console.warn('❌ Episode changed: currentEpisode is null');
                        if (!resolved) {
                            resolved = true;
                            clearTimeout(timeoutId);
                            this.wavesurfer.un('ready', readyHandler);
                            this.setLoadingState(false);
                            reject(new Error('Episode changed during load'));
                        }
                        return;
                    }
                    
                    // Проверка по ID и audioUrl
                    const isCorrectEpisode = (
                        (episodeId && this.currentEpisode.id === episodeId) ||
                        this.currentEpisode.audioUrl === audioUrl
                    );
                    
                    if (!isCorrectEpisode) {
                        console.warn('❌ Episode changed during load:', {
                            expected: { id: episodeId, url: audioUrl },
                            current: { id: this.currentEpisode.id, url: this.currentEpisode.audioUrl }
                        });
                        if (!resolved) {
                            resolved = true;
                            clearTimeout(timeoutId);
                            this.wavesurfer.un('ready', readyHandler);
                            this.setLoadingState(false);
                            reject(new Error('Episode changed during load'));
                        }
                        return;
                    }
                    
                    // Всичко е наред, маркираме като resolved ВЕДНАГА
                    resolved = true;
                    console.log('=== EPISODE READY ===');
                    clearTimeout(timeoutId);
                    
                    // ВАЖНО: Премахваме handler ПРЕДИ да правим нещо друго
                    this.wavesurfer.un('ready', readyHandler);
                    
                    // Всичко е наред, продължаваме
                    this.isAudioReady = true;
                    this.setLoadingState(false);
                    
                    // ВИНАГИ seek на 0 при зареждане на нов епизод
                    if (this.wavesurfer) {
                        try {
                            this.wavesurfer.seekTo(0);
                        } catch (e) {
                            console.warn('Could not seek to 0:', e);
                        }
                    }
                    
                    this.updateDuration();
                    this.updatePlayButton();
                    
                    // Автоматично възпроизвеждане ако е необходимо
                    if (shouldAutoPlay) {
                        console.log('Starting auto-play...');
                        // Запазваме референциите в closure
                        const wavesurferRef = this.wavesurfer;
                        const episodeIdRef = episodeId;
                        const audioUrlRef = audioUrl;
                        
                        setTimeout(() => {
                            // Финален проверка за правилния епизод
                            if (!wavesurferRef) {
                                console.warn('Cannot auto-play: wavesurfer is null');
                                return;
                            }
                            
                            if (!this.isAudioReady) {
                                console.warn('Cannot auto-play: audio not ready');
                                return;
                            }
                            
                            if (!this.currentEpisode) {
                                console.warn('Cannot auto-play: currentEpisode is null');
                                return;
                            }
                            
                            // Проверка дали все още е правилния епизод
                            const stillCorrect = (
                                (episodeIdRef && this.currentEpisode.id === episodeIdRef) ||
                                this.currentEpisode.audioUrl === audioUrlRef
                            );
                            
                            if (!stillCorrect) {
                                console.warn('Episode changed before auto-play', {
                                    expected: { id: episodeIdRef, url: audioUrlRef },
                                    current: { id: this.currentEpisode.id, url: this.currentEpisode.audioUrl }
                                });
                                return;
                            }
                            
                            // Всички проверки минаха, стартираме auto-play
                            wavesurferRef.play().then(() => {
                                console.log('✅ Auto-play started successfully');
                            }).catch(err => {
                                console.warn('Auto-play failed:', err);
                                this.showNotification('Кликнете Play за стартиране');
                            });
                            
                            // Изчистваме autoPlay флага
                            if (this.currentEpisode) {
                                this.currentEpisode.autoPlay = false;
                            }
                        }, 200);
                    }
                    
                    resolve();
                };
                
                // ВАЖНО: Използваме once() за да гарантираме че се изпълнява само веднъж
                this.wavesurfer.once('ready', readyHandler);
                handlerAttached = true;
                
                // Timeout за сигурност
                timeoutId = setTimeout(() => {
                    if (!resolved) {
                        console.error('❌ Timeout waiting for ready event');
                        resolved = true;
                        this.wavesurfer.un('ready', readyHandler);
                        this.setLoadingState(false);
                        this.isAudioReady = false;
                        reject(new Error('Timeout loading audio'));
                    }
                }, 30000);
            });
            
            // ВАЖНО: Зареждане на аудиото - това ТРЯБВА да работи винаги
            console.log('Calling wavesurfer.load() with URL:', audioUrl);
            
            // Зареждане на новия URL - винаги зареждаме, дори ако е същия
            // Това гарантира че винаги работи правилно
            try {
                await this.wavesurfer.load(audioUrl);
            } catch (loadError) {
                console.warn('First load attempt failed, retrying...', loadError);
                // Малко изчакване и повторен опит
                await new Promise(resolve => setTimeout(resolve, 200));
                try {
                    await this.wavesurfer.load(audioUrl);
                } catch (secondError) {
                    console.error('Second load attempt also failed:', secondError);
                    throw secondError;
                }
            }
            
            // Изчакване за ready event
            await readyPromise;
            
            console.log('✅ Episode fully loaded');
            
        } catch (error) {
            console.error('❌ Error loading episode:', error);
            this.setLoadingState(false);
            this.isAudioReady = false;
            this.handleAudioError(error);
        }
    }

    setLoadingState(loading) {
        this.isLoading = loading;
        const playBtn = document.getElementById('playPauseBtn');
        const icon = document.getElementById('playPauseIcon');
        const spinner = document.getElementById('playLoadingSpinner');
        
        if (playBtn) {
            playBtn.disabled = loading;
            playBtn.classList.toggle('loading', loading);
        }
        
        if (icon) {
            icon.style.display = loading ? 'none' : 'block';
        }
        
        if (spinner) {
            spinner.style.display = loading ? 'block' : 'none';
        }
        
        // Показване/скриване на loading индикатор
        if (loading) {
            this.showLoadingIndicator();
        } else {
            this.hideLoadingIndicator();
        }
    }
    
    showLoadingIndicator() {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.style.display = 'flex';
        }
    }
    
    hideLoadingIndicator() {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.style.display = 'none';
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
        if (dateEl && this.currentEpisode.publishDate) {
            dateEl.textContent = new Date(this.currentEpisode.publishDate).toLocaleDateString('bg-BG');
        }
    }

    togglePlayPause() {
        if (!this.wavesurfer || this.isLoading) return;
        
        if (!this.isAudioReady) {
            if (this.currentEpisode) {
                this.loadEpisode();
            }
            return;
        }

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
        if (this.allEpisodes.length === 0) {
            this.notifyParent('next');
            return;
        }
        
        let nextIndex = this.currentEpisodeIndex + 1;
        if (nextIndex >= this.allEpisodes.length) {
            nextIndex = 0;
        }
        
        // selectEpisode() вече задава autoPlay = true, така че просто го извикваме
        this.selectEpisode(nextIndex);
    }

    playPrevious() {
        if (this.allEpisodes.length === 0) {
            this.notifyParent('previous');
            return;
        }
        
        let prevIndex = this.currentEpisodeIndex - 1;
        if (prevIndex < 0) {
            prevIndex = this.allEpisodes.length - 1;
        }
        
        // selectEpisode() вече задава autoPlay = true, така че просто го извикваме
        this.selectEpisode(prevIndex);
    }

    scrollCarousel(direction) {
        const track = document.getElementById('episodesTrack');
        if (!track) return;

        const cardWidth = track.querySelector('.podcast-episode-card')?.offsetWidth || 200;
        const scrollAmount = cardWidth * 2;
        
        this.carouselScrollPosition += direction * scrollAmount;
        this.carouselScrollPosition = Math.max(0, Math.min(this.carouselScrollPosition, track.scrollWidth - track.clientWidth));
        
        track.scrollTo({
            left: this.carouselScrollPosition,
            behavior: 'smooth'
        });
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
        if (this.windowRef) {
            this.windowRef.minimize();
        } else {
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
        // Премахване на стари listeners преди добавяне на нови
        window.removeEventListener('message', this.messageHandler);
        
        // Запазване на reference към handler за cleanup
        this.messageHandler = (event) => {
            if (event.data.type === 'podcast-control') {
                this.handleParentCommand(event.data);
            }
        };
        
        window.addEventListener('message', this.messageHandler);
    }

    handleParentCommand(data) {
        switch (data.action) {
            case 'load':
                if (data.episode && data.episode.audioUrl) {
                    const episodeIndex = this.allEpisodes.findIndex(
                        ep => ep.id === data.episode.id || ep.audioUrl === data.episode.audioUrl
                    );
                    if (episodeIndex >= 0) {
                        this.selectEpisode(episodeIndex);
                    } else {
                        // Епизодът не е в списъка, зареждаме го директно
                        this.currentEpisode = data.episode;
                        this.loadEpisode();
                    }
                }
                break;
            case 'play':
                if (this.wavesurfer && this.isAudioReady && !this.isPlaying) {
                    this.wavesurfer.play();
                }
                break;
            case 'pause':
                if (this.wavesurfer && this.isPlaying) {
                    this.wavesurfer.pause();
                }
                break;
            case 'toggle':
                this.togglePlayPause();
                break;
        }
    }

    notifyParent(action, data = {}) {
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
                type: 'podcast-window-action',
                action,
                data
            }, '*');
        }
    }
    
    cleanup() {
        console.log('Cleaning up podcast window player');
        
        // Спиране на всички активни процеси
        this.stopEQVisualization();
        
        // Почистване на sleep timer
        if (this.sleepTimer) {
            clearTimeout(this.sleepTimer);
            this.sleepTimer = null;
        }
        
        // Почистване на analyser
        if (this.analyser) {
            try {
                if (this.analyser.disconnect) {
                    this.analyser.disconnect();
                }
            } catch (e) {
                console.warn('Error disconnecting analyser:', e);
            }
            this.analyser = null;
            this.dataArray = null;
        }
        
        // Унищожаване на wavesurfer
        if (this.wavesurfer) {
            try {
                this.wavesurfer.destroy();
            } catch (e) {
                console.warn('Error destroying wavesurfer:', e);
            }
            this.wavesurfer = null;
        }
        
        // Затваряне на audio context
        if (this.audioContext && this.audioContext.state !== 'closed') {
            try {
                this.audioContext.close();
            } catch (e) {
                console.warn('Error closing audio context:', e);
            }
            this.audioContext = null;
        }
        
        // Премахване на message handler
        if (this.messageHandler) {
            window.removeEventListener('message', this.messageHandler);
            this.messageHandler = null;
        }
        
        // Почистване на particles
        if (window.pJSDom && window.pJSDom.length > 0) {
            try {
                window.pJSDom.forEach(p => {
                    if (p.pJS && p.pJS.fn && p.pJS.fn.vendors && p.pJS.fn.vendors.destroypJS) {
                        p.pJS.fn.vendors.destroypJS();
                    }
                });
            } catch (e) {
                console.warn('Error destroying particles:', e);
            }
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
        window.podcastWindowPlayer.cleanup();
    }
});
