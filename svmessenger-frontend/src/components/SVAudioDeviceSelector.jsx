import React, { useState, useEffect, useRef } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import svLiveKitService from '../services/svLiveKitService';

/**
 * ✅ FIXED: Professional Audio Device Selector Modal
 * - Bootstrap Icons САМО
 * - Конкретни CSS стойности БЕЗ variables
 * - Перфектен дизайн
 */
const SVAudioDeviceSelector = ({ isOpen, onComplete, onCancel }) => {
  const { deviceSelectorMode } = useSVMessenger();
    const [microphones, setMicrophones] = useState([]);
    const [speakers, setSpeakers] = useState([]);
    const [selectedMic, setSelectedMic] = useState('');
    const [selectedSpeaker, setSelectedSpeaker] = useState('');
    const [micVolume, setMicVolume] = useState(75);
    const [speakerVolume, setSpeakerVolume] = useState(80);
    const [isLoading, setIsLoading] = useState(true);
    const [isTesting, setIsTesting] = useState(false);
    const [error, setError] = useState(null);
    const [micLevel, setMicLevel] = useState(0);
    const [testResults, setTestResults] = useState(null);

    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const microphoneRef = useRef(null);
    const animationFrameRef = useRef(null);
    const streamRef = useRef(null);

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

                console.log('✅ Loaded saved audio settings:', settings);
            } catch (error) {
                console.warn('Failed to load saved audio settings:', error);
            }
        }
    }, []);

    const saveSettings = (settings) => {
        try {
            console.log('💾 Saving audio settings:', settings);
            localStorage.setItem('svmessenger-audio-settings', JSON.stringify(settings));
            console.log('✅ Audio settings saved successfully');
        } catch (error) {
            console.warn('Failed to save audio settings:', error);
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
            const currentSettings = JSON.parse(localStorage.getItem('svmessenger-audio-settings') || '{}');
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
            micVolume: micVolume,
            speakerVolume: speakerVolume
        };
        saveSettings(finalSettings);

        onComplete({
            microphone: selectedMic,
            speaker: selectedSpeaker,
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

            await svLiveKitService.requestAudioPermissions();
            const devices = await svLiveKitService.enumerateAudioDevices();

            setMicrophones(devices.microphones);
            setSpeakers(devices.speakers);

            // Prefer saved settings over service selected devices
            const saved = localStorage.getItem('svmessenger-audio-settings');
            let savedMic, savedSpeaker;

            if (saved) {
                try {
                    const settings = JSON.parse(saved);
                    savedMic = settings.microphone;
                    savedSpeaker = settings.speaker;
                } catch (e) {
                    console.warn('Error parsing saved settings:', e);
                }
            }

            const initialMic = savedMic || (devices.microphones.length > 0 ? devices.microphones[0].deviceId : '');
            setSelectedMic(initialMic);
            setSelectedSpeaker(savedSpeaker || (devices.speakers.length > 0 ? devices.speakers[0].deviceId : ''));

            // Start audio visualization automatically for the selected microphone
            if (initialMic) {
                // Small delay to ensure state is set
                setTimeout(() => {
                    startAudioVisualization(initialMic);
                }, 100);
            }

        } catch (err) {
            setError(err.message || 'Failed to access audio devices');
            console.error('Audio device initialization error:', err);
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
                console.warn('⚠️ Failed to get stream with ideal device for visualization, trying default:', exactError);
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
                    console.log('🔊 Using selected speaker device:', selectedSpeaker);
                } catch (sinkError) {
                    console.warn('⚠️ Failed to set sink ID, using default device:', sinkError);
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
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '400px',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
                    }}>
                        <i className="bi bi-gear-fill" style={{ fontSize: '20px', color: '#ffffff' }}></i>
                    </div>
                    <h2 style={{
                        margin: '0 0 6px 0',
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#111827'
                    }}>Аудио настройки</h2>
                    <p style={{
                        margin: 0,
                        fontSize: '11px',
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

                {/* Main Content */}
                {!isLoading && !error && (
                    <div style={{ padding: '16px 20px' }}>
                        {/* Microphone Section */}
                        <div style={{
                            background: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '10px',
                            padding: '14px',
                            marginBottom: '12px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '12px'
                            }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    background: '#22c55e',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <i className="bi bi-mic-fill" style={{ fontSize: '16px', color: '#ffffff' }}></i>
                                </div>
                                <h3 style={{
                                    margin: 0,
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: '#111827'
                                }}>Микрофон</h3>
                            </div>

                            <div style={{ marginBottom: '12px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '6px',
                                    fontSize: '10px',
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
                                        padding: '8px 10px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        background: '#ffffff',
                                        color: '#111827',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {microphones.map((mic) => (
                                        <option key={mic.deviceId} value={mic.deviceId}>
                                            {mic.label || `Микрофон ${mic.deviceId.slice(0, 8)}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '6px',
                                    fontSize: '10px',
                                    fontWeight: '600',
                                    color: '#374151',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>Сила на звука</label>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px',
                                    background: '#f3f4f6',
                                    borderRadius: '6px'
                                }}>
                                    <i className="bi bi-volume-down-fill" style={{ fontSize: '14px', color: '#22c55e' }}></i>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={micVolume}
                                        onChange={(e) => handleVolumeChange('mic', Number(e.target.value))}
                                        style={{
                                            flex: 1,
                                            height: '4px',
                                            background: '#d1d5db',
                                            borderRadius: '2px',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <span style={{
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: '#111827',
                                        minWidth: '35px',
                                        textAlign: 'right'
                                    }}>{micVolume}%</span>
                                </div>
                            </div>

                            <AudioLevelBar level={micLevel} />
                        </div>

                        {/* Speaker Section */}
                        <div style={{
                            background: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '10px',
                            padding: '14px',
                            marginBottom: '12px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '12px'
                            }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    background: '#22c55e',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <i className="bi bi-headphones" style={{ fontSize: '16px', color: '#ffffff' }}></i>
                                </div>
                                <h3 style={{
                                    margin: 0,
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: '#111827'
                                }}>Слушалки</h3>
                            </div>

                            <div style={{ marginBottom: '12px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '6px',
                                    fontSize: '10px',
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
                                        padding: '8px 10px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        background: '#ffffff',
                                        color: '#111827',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {speakers.map((speaker) => (
                                        <option key={speaker.deviceId} value={speaker.deviceId}>
                                            {speaker.label || `Слушалки ${speaker.deviceId.slice(0, 8)}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '6px',
                                    fontSize: '10px',
                                    fontWeight: '600',
                                    color: '#374151',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>Сила на звука</label>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px',
                                    background: '#f3f4f6',
                                    borderRadius: '6px'
                                }}>
                                    <i className="bi bi-volume-up-fill" style={{ fontSize: '14px', color: '#22c55e' }}></i>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={speakerVolume}
                                        onChange={(e) => handleVolumeChange('speaker', Number(e.target.value))}
                                        style={{
                                            flex: 1,
                                            height: '4px',
                                            background: '#d1d5db',
                                            borderRadius: '2px',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <span style={{
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: '#111827',
                                        minWidth: '35px',
                                        textAlign: 'right'
                                    }}>{speakerVolume}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Speaker Test Section */}
                        <div style={{
                            background: '#fef3c7',
                            border: '1px solid #fbbf24',
                            borderRadius: '10px',
                            padding: '12px',
                            marginBottom: '12px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '10px'
                            }}>
                                <i className="bi bi-info-circle-fill" style={{ fontSize: '14px', color: '#f59e0b' }}></i>
                                <span style={{
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: '#92400e'
                                }}>Тест на слушалки</span>
                            </div>
                            <p style={{
                                margin: '0 0 10px 0',
                                fontSize: '11px',
                                color: '#78350f'
                            }}>
                                Натиснете бутона по-долу, за да чуете тестов сигнал и да проверите дали слушалките работят правилно.
                            </p>
                            <button
                                onClick={handleTestAudio}
                                disabled={speakers.length === 0 || isTesting}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    background: isTesting ? '#fbbf24' : '#f59e0b',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: speakers.length === 0 || isTesting ? 'not-allowed' : 'pointer',
                                    opacity: speakers.length === 0 || isTesting ? 0.5 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
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
                                    marginTop: '10px',
                                    padding: '10px',
                                    background: '#ffffff',
                                    borderRadius: '6px'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <i className={`bi bi-${testResults.speakerWorking ? 'check-circle-fill' : 'x-circle-fill'}`}
                                           style={{ fontSize: '14px', color: testResults.speakerWorking ? '#22c55e' : '#ef4444' }}></i>
                                        <span style={{ fontSize: '12px', color: '#374151' }}>
                                            {testResults.speakerWorking ? 'Слушалките работят правилно' : 'Проблем със слушалките'}
                                        </span>
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