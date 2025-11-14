import React, { useState, useEffect, useRef } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import svLiveKitService from '../services/svLiveKitService';

/**
 * ✅ FIXED: Professional Audio/Video Device Selector Modal
 * - Bootstrap Icons САМО
 * - Конкретни CSS стойности БЕЗ variables
 * - Перфектен дизайн
 * - Drag and Drop функционалност
 * - Фиксиран хедър
 * - Camera selection
 */
const SVAudioDeviceSelector = ({ isOpen, onComplete, onCancel }) => {
  const { deviceSelectorMode } = useSVMessenger();
    const [microphones, setMicrophones] = useState([]);
    const [speakers, setSpeakers] = useState([]);
    const [cameras, setCameras] = useState([]);
    const [selectedMic, setSelectedMic] = useState('');
    const [selectedSpeaker, setSelectedSpeaker] = useState('');
    const [selectedCamera, setSelectedCamera] = useState('');
    const [micVolume, setMicVolume] = useState(75);
    const [speakerVolume, setSpeakerVolume] = useState(80);
    const [isLoading, setIsLoading] = useState(true);
    const [isTesting, setIsTesting] = useState(false);
    const [showCameraPreview, setShowCameraPreview] = useState(false);
    const [error, setError] = useState(null);
    const [micLevel, setMicLevel] = useState(0);
    const [testResults, setTestResults] = useState(null);
    const [activeTab, setActiveTab] = useState('microphone'); // 'microphone', 'speaker', 'camera'

    // Drag and drop state
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const modalRef = useRef(null);

    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const microphoneRef = useRef(null);
    const animationFrameRef = useRef(null);
    const streamRef = useRef(null);
    const cameraPreviewRef = useRef(null);
    const cameraStreamRef = useRef(null);

    // Initialize position to center on mount
    useEffect(() => {
        if (isOpen) {
            // Use setTimeout to ensure modal is rendered
            setTimeout(() => {
                if (modalRef.current) {
                    const modal = modalRef.current;
                    const x = (window.innerWidth - 400) / 2;
                    const y = (window.innerHeight - 500) / 2;
                    setPosition({ x: Math.max(0, x), y: Math.max(0, y) });
                }
            }, 0);
        }
    }, [isOpen]);

    // Drag handlers
    const handleMouseDown = (e) => {
        // Only allow dragging from header, but not from close button
        const header = e.target.closest('.audio-device-header');
        const closeBtn = e.target.closest('.audio-device-close');
        
        if (!header || closeBtn) return;
        
        setIsDragging(true);
        if (modalRef.current) {
            const rect = modalRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e) => {
            if (!modalRef.current) return;
            
            const modalWidth = modalRef.current.offsetWidth;
            const modalHeight = modalRef.current.offsetHeight;
            
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;

            const maxX = window.innerWidth - modalWidth;
            const maxY = window.innerHeight - modalHeight;

            const boundedX = Math.max(0, Math.min(newX, maxX));
            const boundedY = Math.max(0, Math.min(newY, maxY));

            setPosition({ x: boundedX, y: boundedY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    // Load saved settings
    useEffect(() => {
        const savedSettings = localStorage.getItem('svmessenger-audio-settings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                setMicVolume(settings.micVolume || 75);
                setSpeakerVolume(settings.speakerVolume || 80);

                // Load saved device IDs if available
                if (settings.microphone) {
                    setSelectedMic(settings.microphone);
                    svLiveKitService.selectedMicrophone = settings.microphone;
                }
                if (settings.speaker) {
                    setSelectedSpeaker(settings.speaker);
                    svLiveKitService.selectedSpeaker = settings.speaker;
                }

            } catch (error) {
                console.warn('Failed to load saved audio settings:', error);
            }
        }
    }, []);

    const saveSettings = (settings) => {
        try {

            // Try to save to localStorage
            try {
                localStorage.setItem('svmessenger-audio-video-settings', JSON.stringify(settings));

                // Verify it was saved
                const verify = localStorage.getItem('svmessenger-audio-video-settings');
                if (verify) {
                }
            } catch (storageError) {
                // In incognito, localStorage might fail - we'll still use the settings in memory
            }

            // Also save to service immediately so they're available even if localStorage fails
            if (settings.microphone) {
                svLiveKitService.selectedMicrophone = settings.microphone;
            }
            if (settings.speaker) {
                svLiveKitService.selectedSpeaker = settings.speaker;
            }
            if (settings.camera) {
                svLiveKitService.selectedCamera = settings.camera;
            }
        } catch (error) {
            console.warn('Failed to save audio/video settings:', error);
        }
    };

    const handleVolumeChange = (type, value) => {
        if (type === 'mic') {
            setMicVolume(value);
            saveSettings({ micVolume: value, speakerVolume });
        } else if (type === 'speaker') {
            setSpeakerVolume(value);
            saveSettings({ micVolume, speakerVolume: value });
        }
    };

    const handleMicChange = async (deviceId) => {
        try {
            await svLiveKitService.setMicrophone(deviceId);
            setSelectedMic(deviceId);
            
            // Stop old visualization and start new one with selected device
            stopAudioVisualization();
            await startAudioVisualization(deviceId);

            // Save device selection to localStorage
            const currentSettings = JSON.parse(localStorage.getItem('svmessenger-audio-settings') || '{}');
            const newSettings = {
                ...currentSettings,
                microphone: deviceId,
                micVolume: micVolume
            };
            saveSettings(newSettings);
        } catch (err) {
            console.error('Error changing microphone:', err);
        }
    };

    const handleSpeakerChange = async (deviceId) => {
        try {
            await svLiveKitService.setSpeaker(deviceId);
            setSelectedSpeaker(deviceId);

            // Save device selection to localStorage
            const currentSettings = JSON.parse(localStorage.getItem('svmessenger-audio-video-settings') || localStorage.getItem('svmessenger-audio-settings') || '{}');
            const newSettings = {
                ...currentSettings,
                speaker: deviceId,
                speakerVolume: speakerVolume
            };
            saveSettings(newSettings);
        } catch (err) {
            console.error('Error changing speaker:', err);
        }
    };

    const handleCameraChange = async (deviceId) => {
        try {
            await svLiveKitService.setCamera(deviceId);
            setSelectedCamera(deviceId);

            // Save device selection to localStorage
            const currentSettings = JSON.parse(localStorage.getItem('svmessenger-audio-video-settings') || localStorage.getItem('svmessenger-audio-settings') || '{}');
            const newSettings = {
                ...currentSettings,
                camera: deviceId
            };
            saveSettings(newSettings);
        } catch (err) {
            console.error('Error changing camera:', err);
        }
    };

    const handleTestAudio = () => {
        if (isTesting) {
            cleanupAudioTest();
        } else {
            startAudioTest();
        }
    };

    const handleContinue = () => {
        stopAudioVisualization();
        cleanupAudioTest();

        // Save final settings
        const finalSettings = {
            microphone: selectedMic,
            speaker: selectedSpeaker,
            camera: selectedCamera,
            micVolume: micVolume,
            speakerVolume: speakerVolume
        };
        saveSettings(finalSettings);

        onComplete({
            microphone: selectedMic,
            speaker: selectedSpeaker,
            camera: selectedCamera,
            micVolume: micVolume / 100, // Convert to 0-1 range
            speakerVolume: speakerVolume / 100
        });
    };

    useEffect(() => {
        if (isOpen) {
            initializeDevices();
        } else {
            stopAudioVisualization();
            cleanupAudioTest();
        }

        return () => {
            stopAudioVisualization();
            cleanupAudioTest();
        };
    }, [isOpen]);

    const initializeDevices = async () => {
        try {
            setIsLoading(true);
            setError(null);
            setMicLevel(0);

            // Request both audio and camera permissions
            await svLiveKitService.requestAudioPermissions();
            
            // Request camera permissions to enumerate cameras
            try {
                await svLiveKitService.requestCameraPermissions();
            } catch (cameraError) {
                console.warn('Camera permissions not granted, cameras may not be available:', cameraError);
            }
            
            const devices = await svLiveKitService.enumerateAudioDevices();

            // Load cameras (after requesting permissions)
            const cameraDevices = await svLiveKitService.getCameras();

            setMicrophones(devices.microphones);
            setSpeakers(devices.speakers);
            setCameras(cameraDevices);

            // Prefer saved settings over service selected devices
            const saved = localStorage.getItem('svmessenger-audio-video-settings');
            let savedMic, savedSpeaker, savedCamera;

            if (saved) {
                try {
                    const settings = JSON.parse(saved);
                    savedMic = settings.microphone;
                    savedSpeaker = settings.speaker;
                    savedCamera = settings.camera;
                } catch (e) {
                    console.warn('Error parsing saved settings:', e);
                }
            }

            const initialMic = savedMic || (devices.microphones.length > 0 ? devices.microphones[0].deviceId : '');
            setSelectedMic(initialMic);
            setSelectedSpeaker(savedSpeaker || (devices.speakers.length > 0 ? devices.speakers[0].deviceId : ''));
            setSelectedCamera(savedCamera || (cameraDevices.length > 0 ? cameraDevices[0].deviceId : ''));

            // Start audio visualization automatically for the selected microphone
            if (initialMic) {
                // Small delay to ensure state is set
                setTimeout(() => {
                    startAudioVisualization(initialMic);
                }, 100);
            }

        } catch (err) {
            setError(err.message || 'Failed to access audio/video devices');
            console.error('Audio/Video device initialization error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const startAudioVisualization = async (deviceId) => {
        try {
            // Clean up existing visualization
            stopAudioVisualization();

            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            
            // Use higher fftSize for better accuracy
            analyserRef.current.fftSize = 2048;
            analyserRef.current.smoothingTimeConstant = 0.8;

            // Use 'ideal' instead of 'exact' to allow fallback if device is not available
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: { 
                        deviceId: deviceId ? { ideal: deviceId } : true,
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
            } catch (exactError) {
                // Fallback to default device if ideal fails
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
            }

            // Store stream reference for cleanup
            streamRef.current = stream;
            
            microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
            microphoneRef.current.connect(analyserRef.current);

            // Use Float32Array for better precision
            const dataArray = new Float32Array(analyserRef.current.fftSize);

            const updateLevel = () => {
                if (!analyserRef.current) return;

                // Get time domain data (actual audio waveform)
                analyserRef.current.getFloatTimeDomainData(dataArray);

                // Calculate RMS (Root Mean Square) for accurate level measurement
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i] * dataArray[i];
                }
                const rms = Math.sqrt(sum / dataArray.length);
                
                // Convert RMS to percentage (0-100)
                // RMS values are typically between 0 and 1
                // Use a more accurate conversion that matches Windows sound levels
                // Normal RMS for speech is around 0.1-0.3, so we scale appropriately
                let level = 0;
                if (rms > 0) {
                    // Use a logarithmic-like scale for better visualization
                    // Map RMS (0-1) to percentage (0-100) with better sensitivity
                    level = Math.min(100, Math.max(0, (rms * 300)));
                    
                    // Apply additional amplification for quiet microphones
                    // This helps show activity even when input is low
                    if (level < 50) {
                        level = level * 1.5; // Amplify lower levels more
                    }
                }

                setMicLevel(Math.min(100, level));
                animationFrameRef.current = requestAnimationFrame(updateLevel);
            };

            updateLevel();
        } catch (error) {
            console.error('Error starting audio visualization:', error);
            setMicLevel(0);
        }
    };

    const stopAudioVisualization = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (microphoneRef.current) {
            microphoneRef.current.disconnect();
            microphoneRef.current = null;
        }

        // Stop all tracks from the stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        analyserRef.current = null;
        setMicLevel(0);
    };

    const startAudioTest = async () => {
        try {
            setIsTesting(true);
            setTestResults(null);

            // Create audio context and elements for speaker test
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            // Create an HTMLAudioElement to use setSinkId for device selection
            const audioElement = document.createElement('audio');
            
            // Set the sink (output device) if supported and device is selected
            if (selectedSpeaker && 'setSinkId' in HTMLAudioElement.prototype) {
                try {
                    await audioElement.setSinkId(selectedSpeaker);
                } catch (sinkError) {
                }
            }

            // Create a MediaStreamDestination to connect to the audio element
            const destination = audioContext.createMediaStreamDestination();
            oscillator.connect(gainNode);
            gainNode.connect(destination);

            // Connect the MediaStream to the audio element
            audioElement.srcObject = destination.stream;
            audioElement.volume = speakerVolume / 100;

            // Play a pleasant test tone (440Hz = A note)
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            gainNode.gain.setValueAtTime(1.0, audioContext.currentTime);

            // Start playback
            oscillator.start();
            await audioElement.play();

            // Fade out over 1 second
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
            oscillator.stop(audioContext.currentTime + 1);

            // Wait for the tone to finish
            setTimeout(() => {
                audioElement.pause();
                audioElement.srcObject = null;
                audioContext.close();
                setTestResults({
                    speakerWorking: true
                });
                setIsTesting(false);
            }, 1200);

        } catch (error) {
            console.error('Speaker test failed:', error);
            setTestResults({
                speakerWorking: false,
                error: error.message
            });
            setIsTesting(false);
        }
    };

    const cleanupAudioTest = () => {
        setIsTesting(false);
        setTestResults(null);
        // Don't stop visualization on test cleanup - keep it running for microphone
    };

    // Audio Level Bar Component
    const AudioLevelBar = ({ level, label }) => (
        <div style={{
            padding: '8px',
            background: '#f3f4f6',
            borderRadius: '6px',
            marginTop: '6px'
        }}>
            {label && <div style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '10px',
                fontWeight: '600',
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
            }}>{label}</div>}
            <div style={{
                position: 'relative',
                height: '5px',
                background: '#d1d5db',
                borderRadius: '3px',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${level}%`,
                    background: level > 70 ? '#22c55e' : level > 30 ? '#eab308' : '#ef4444',
                    transition: 'width 0.1s ease',
                    borderRadius: '3px'
                }} />
            </div>
            <div style={{
                marginTop: '3px',
                fontSize: '10px',
                fontWeight: '600',
                color: '#6b7280',
                textAlign: 'right'
            }}>{Math.round(level)}%</div>
        </div>
    );

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
            pointerEvents: 'none'
        }}>
            <div 
                ref={modalRef}
                style={{
                    position: 'absolute',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    background: '#ffffff',
                    borderRadius: '12px',
                    width: '400px',
                    maxHeight: '500px',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    pointerEvents: 'auto'
                }}
            >
                {/* Header - Fixed */}
                <div 
                    className="audio-device-header"
                    style={{
                        padding: '14px 20px',
                        borderBottom: '1px solid #e5e7eb',
                        textAlign: 'center',
                        position: 'sticky',
                        top: 0,
                        background: '#ffffff',
                        zIndex: 10,
                        borderRadius: '12px 12px 0 0',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        userSelect: 'none'
                    }}
                    onMouseDown={handleMouseDown}
                >
                    <button
                        className="audio-device-close"
                        onClick={onCancel}
                        style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#6b7280',
                            fontSize: '18px',
                            lineHeight: '1',
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f3f4f6';
                            e.currentTarget.style.color = '#111827';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'none';
                            e.currentTarget.style.color = '#6b7280';
                        }}
                        title="Затвори"
                    >
                        <i className="bi bi-x" style={{ fontSize: '20px', fontWeight: '300' }}></i>
                    </button>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 10px',
                        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
                    }}>
                        <i className="bi bi-gear-fill" style={{ fontSize: '18px', color: '#ffffff' }}></i>
                    </div>
                    <h2 style={{
                        margin: '0 0 4px 0',
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#111827'
                    }}>Настройки на аудио/видео</h2>
                    <p style={{
                        margin: 0,
                        fontSize: '10px',
                        color: '#6b7280'
                    }}>Конфигурирайте устройствата си за качествен разговор</p>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div style={{
                        padding: '32px 20px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            border: '3px solid #e5e7eb',
                            borderTop: '3px solid #22c55e',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 12px'
                        }} />
                        <h4 style={{
                            margin: '0 0 6px 0',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#111827'
                        }}>Искане на достъп до микрофон</h4>
                        <p style={{
                            margin: 0,
                            fontSize: '11px',
                            color: '#6b7280'
                        }}>Моля, позволете достъпа в browser прозореца</p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={{
                        padding: '24px 20px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            background: '#fee2e2',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px'
                        }}>
                            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '20px', color: '#ef4444' }}></i>
                        </div>
                        <h4 style={{
                            margin: '0 0 6px 0',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#ef4444'
                        }}>Грешка при достъп до устройства</h4>
                        <p style={{
                            margin: '0 0 12px 0',
                            fontSize: '11px',
                            color: '#6b7280'
                        }}>{error}</p>
                        <button
                            onClick={initializeDevices}
                            style={{
                                background: '#ef4444',
                                color: '#ffffff',
                                border: 'none',
                                padding: '8px 18px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)'
                            }}
                        >
                            Опитай отново
                        </button>
                    </div>
                )}

                {/* Main Content - Tabs */}
                {!isLoading && !error && (
                    <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        overflow: 'hidden'
                    }}>
                        {/* Tabs Navigation */}
                        <div style={{
                            display: 'flex',
                            borderBottom: '1px solid #e5e7eb',
                            background: '#ffffff',
                            padding: '0 20px'
                        }}>
                            <button
                                onClick={() => setActiveTab('microphone')}
                                style={{
                                    flex: 1,
                                    padding: '12px 8px',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: activeTab === 'microphone' ? '2px solid #22c55e' : '2px solid transparent',
                                    color: activeTab === 'microphone' ? '#22c55e' : '#6b7280',
                                    fontSize: '12px',
                                    fontWeight: activeTab === 'microphone' ? '600' : '500',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <i className="bi bi-mic-fill" style={{ fontSize: '14px' }}></i>
                                Микрофон
                            </button>
                            <button
                                onClick={() => setActiveTab('speaker')}
                                style={{
                                    flex: 1,
                                    padding: '12px 8px',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: activeTab === 'speaker' ? '2px solid #22c55e' : '2px solid transparent',
                                    color: activeTab === 'speaker' ? '#22c55e' : '#6b7280',
                                    fontSize: '12px',
                                    fontWeight: activeTab === 'speaker' ? '600' : '500',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <i className="bi bi-headphones" style={{ fontSize: '14px' }}></i>
                                Слушалки
                            </button>
                            <button
                                onClick={() => setActiveTab('camera')}
                                style={{
                                    flex: 1,
                                    padding: '12px 8px',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: activeTab === 'camera' ? '2px solid #22c55e' : '2px solid transparent',
                                    color: activeTab === 'camera' ? '#22c55e' : '#6b7280',
                                    fontSize: '12px',
                                    fontWeight: activeTab === 'camera' ? '600' : '500',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <i className="bi bi-camera-video-fill" style={{ fontSize: '14px' }}></i>
                                Камера
                            </button>
                        </div>

                        {/* Tab Content - Scrollable */}
                        <div style={{ 
                            padding: '20px',
                            overflowY: 'auto',
                            flex: 1,
                            maxHeight: 'calc(500px - 200px)'
                        }}>
                            {/* Microphone Tab */}
                            {activeTab === 'microphone' && (
                                <div>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            color: '#374151',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>Устройство</label>
                                        <select
                                            value={selectedMic}
                                            onChange={(e) => handleMicChange(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '8px',
                                                background: '#ffffff',
                                                color: '#111827',
                                                fontSize: '13px',
                                                cursor: 'pointer',
                                                transition: 'border-color 0.2s ease'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#22c55e'}
                                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                        >
                                            {microphones.map((mic) => (
                                                <option key={mic.deviceId} value={mic.deviceId}>
                                                    {mic.label || `Микрофон ${mic.deviceId.slice(0, 8)}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            color: '#374151',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>Сила на звука</label>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px',
                                            background: '#f9fafb',
                                            borderRadius: '8px',
                                            border: '1px solid #e5e7eb'
                                        }}>
                                            <i className="bi bi-volume-down-fill" style={{ fontSize: '16px', color: '#22c55e' }}></i>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={micVolume}
                                                onChange={(e) => handleVolumeChange('mic', Number(e.target.value))}
                                                style={{
                                                    flex: 1,
                                                    height: '6px',
                                                    background: '#d1d5db',
                                                    borderRadius: '3px',
                                                    outline: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                            <span style={{
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: '#111827',
                                                minWidth: '40px',
                                                textAlign: 'right'
                                            }}>{micVolume}%</span>
                                        </div>
                                    </div>

                                    <AudioLevelBar level={micLevel} />
                                </div>
                            )}

                            {/* Speaker Tab */}
                            {activeTab === 'speaker' && (
                                <div>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            color: '#374151',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>Устройство</label>
                                        <select
                                            value={selectedSpeaker}
                                            onChange={(e) => handleSpeakerChange(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '8px',
                                                background: '#ffffff',
                                                color: '#111827',
                                                fontSize: '13px',
                                                cursor: 'pointer',
                                                transition: 'border-color 0.2s ease'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#22c55e'}
                                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                        >
                                            {speakers.map((speaker) => (
                                                <option key={speaker.deviceId} value={speaker.deviceId}>
                                                    {speaker.label || `Слушалки ${speaker.deviceId.slice(0, 8)}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            color: '#374151',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>Сила на звука</label>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px',
                                            background: '#f9fafb',
                                            borderRadius: '8px',
                                            border: '1px solid #e5e7eb'
                                        }}>
                                            <i className="bi bi-volume-up-fill" style={{ fontSize: '16px', color: '#22c55e' }}></i>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={speakerVolume}
                                                onChange={(e) => handleVolumeChange('speaker', Number(e.target.value))}
                                                style={{
                                                    flex: 1,
                                                    height: '6px',
                                                    background: '#d1d5db',
                                                    borderRadius: '3px',
                                                    outline: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                            <span style={{
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: '#111827',
                                                minWidth: '40px',
                                                textAlign: 'right'
                                            }}>{speakerVolume}%</span>
                                        </div>
                                    </div>

                                    {/* Speaker Test Section */}
                                    <div style={{
                                        background: '#eaffe9',
                                        border: '1px solid #bbf7d0',
                                        borderRadius: '10px',
                                        padding: '14px',
                                        marginTop: '8px'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '10px'
                                        }}>
                                            <i className="bi bi-info-circle-fill" style={{ fontSize: '14px', color: '#22c55e' }}></i>
                                            <span style={{
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                color: '#166534'
                                            }}>Тест на слушалки</span>
                                        </div>
                                        <p style={{
                                            margin: '0 0 12px 0',
                                            fontSize: '11px',
                                            color: '#166534',
                                            lineHeight: '1.5'
                                        }}>
                                            Натиснете бутона по-долу, за да чуете тестов сигнал и да проверите дали слушалките работят правилно.
                                        </p>
                                        <button
                                            onClick={handleTestAudio}
                                            disabled={speakers.length === 0 || isTesting}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                background: isTesting ? '#6bb75f' : '#22c55e',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                cursor: speakers.length === 0 || isTesting ? 'not-allowed' : 'pointer',
                                                opacity: speakers.length === 0 || isTesting ? 0.6 : 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                transition: 'all 0.2s ease',
                                                boxShadow: speakers.length === 0 || isTesting ? 'none' : '0 2px 6px rgba(34, 197, 94, 0.3)'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (speakers.length > 0 && !isTesting) {
                                                    e.currentTarget.style.background = '#16a34a';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (speakers.length > 0 && !isTesting) {
                                                    e.currentTarget.style.background = '#22c55e';
                                                }
                                            }}
                                        >
                                            {isTesting ? (
                                                <>
                                                    <div style={{
                                                        width: '14px',
                                                        height: '14px',
                                                        border: '2px solid #ffffff',
                                                        borderTop: '2px solid transparent',
                                                        borderRadius: '50%',
                                                        animation: 'spin 0.8s linear infinite'
                                                    }} />
                                                    Тестване...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-play-circle-fill" style={{ fontSize: '14px' }}></i>
                                                    Тествай слушалки
                                                </>
                                            )}
                                        </button>

                                        {testResults && (
                                            <div style={{
                                                marginTop: '12px',
                                                padding: '10px',
                                                background: '#ffffff',
                                                borderRadius: '6px',
                                                border: '1px solid #bbf7d0'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    <i className={`bi bi-${testResults.speakerWorking ? 'check-circle-fill' : 'x-circle-fill'}`}
                                                       style={{ fontSize: '16px', color: testResults.speakerWorking ? '#22c55e' : '#ef4444' }}></i>
                                                    <span style={{ fontSize: '12px', color: '#166534', fontWeight: '500' }}>
                                                        {testResults.speakerWorking ? 'Слушалките работят правилно' : 'Проблем със слушалките'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Camera Tab */}
                            {activeTab === 'camera' && (
                                <div>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            color: '#374151',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>Устройство</label>
                                        <select
                                            value={selectedCamera}
                                            onChange={(e) => handleCameraChange(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '8px',
                                                background: '#ffffff',
                                                color: '#111827',
                                                fontSize: '13px',
                                                cursor: cameras.length === 0 ? 'not-allowed' : 'pointer',
                                                opacity: cameras.length === 0 ? 0.6 : 1,
                                                transition: 'border-color 0.2s ease'
                                            }}
                                            disabled={cameras.length === 0}
                                            onFocus={(e) => {
                                                if (cameras.length > 0) e.target.style.borderColor = '#3b82f6';
                                            }}
                                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                        >
                                            {cameras.length === 0 ? (
                                                <option>Няма налични камери</option>
                                            ) : (
                                                cameras.map((cam) => (
                                                    <option key={cam.deviceId} value={cam.deviceId}>
                                                        {cam.label || `Камера ${cam.deviceId.slice(0, 8)}`}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>

                                    <div style={{
                                        background: '#eff6ff',
                                        border: '1px solid #bfdbfe',
                                        borderRadius: '10px',
                                        padding: '14px',
                                        fontSize: '12px',
                                        color: '#1e40af',
                                        lineHeight: '1.5'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '8px'
                                        }}>
                                            <i className="bi bi-info-circle-fill" style={{ fontSize: '14px', marginTop: '2px', flexShrink: 0 }}></i>
                                            <span>Камерата ще се използва автоматично при включване на видео по време на разговор.</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div style={{
                    padding: '14px 20px',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        style={{
                            padding: '8px 18px',
                            background: '#ffffff',
                            color: '#6b7280',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.5 : 1
                        }}
                    >
                        Отказ
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={isLoading || error || microphones.length === 0}
                        style={{
                            padding: '8px 18px',
                            background: (isLoading || error || microphones.length === 0) ? '#d1d5db' : '#22c55e',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: (isLoading || error || microphones.length === 0) ? 'not-allowed' : 'pointer',
                            boxShadow: (isLoading || error || microphones.length === 0) ? 'none' : '0 2px 6px rgba(34, 197, 94, 0.3)'
                        }}
                    >
                        {deviceSelectorMode === 'settings' ? 'Запази настройки' : 'Започни разговор'}
                    </button>
                </div>
            </div>

            {/* CSS Animation */}
            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default SVAudioDeviceSelector;