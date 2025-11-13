/**
 * UI компонент за call-window popup прозорец
 * Показва състоянието на разговора и контролите
 */

import React from 'react';
import { getInitials, getAvatarColor } from '../utils/svHelpers';

const CallWindowModal = ({
    callState,
    callDuration,
    formatDuration,
    isMuted,
    isConnected,
    otherUserName,
    otherUserAvatar,
    onMuteToggle,
    onEndCall,
    // Video props
    isVideoEnabled,
    remoteVideoVisible,
    localVideoRef,
    remoteVideoRef,
    onCameraToggle,
    cameraPermissionDenied
}) => {
    // Правилно декодиране на името (за emoji и специални символи)
    const decodedName = React.useMemo(() => {
        if (!otherUserName) return 'Потребител';
        try {
            // Ако е вече декодирано, просто го върни
            return decodeURIComponent(otherUserName);
        } catch (e) {
            // Ако не е encode-нато, върни както е
            return otherUserName;
        }
    }, [otherUserName]);

    // Правилно декодиране на avatar URL
    const decodedAvatar = React.useMemo(() => {
        if (!otherUserAvatar) return null;
        try {
            return decodeURIComponent(otherUserAvatar);
        } catch (e) {
            return otherUserAvatar;
        }
    }, [otherUserAvatar]);

    // Проверка дали avatar URL е валиден
    const isValidAvatar = (url) => {
        if (!url || url.trim() === '') return false;
        const defaultAvatars = ['/default-avatar', 'default-avatar.png', 'default-avatar.jpg'];
        return !defaultAvatars.some(def => url.includes(def));
    };

    const avatarColor = React.useMemo(() => {
        return getAvatarColor(decodedName.charCodeAt(0) || 0);
    }, [decodedName]);

    const initials = React.useMemo(() => {
        return getInitials(decodedName);
    }, [decodedName]);

    return (
        <div className="call-window-container">
            {/* Animated Background (only when not connected or no video) */}
            {(callState !== 'connected' || !remoteVideoVisible) && (
                <div className="call-window-background">
                    <div className="call-window-bg-shape shape-1"></div>
                    <div className="call-window-bg-shape shape-2"></div>
                    <div className="call-window-bg-shape shape-3"></div>
                    <div className="call-window-bg-shape shape-4"></div>
                </div>
            )}

            {/* Video Layout (when connected) */}
            {callState === 'connected' ? (
                <div className="call-window-video-layout">
                    {/* Remote video OR avatar fallback */}
                    <div
                        ref={remoteVideoRef}
                        className={`call-window-remote-video ${remoteVideoVisible ? 'video-active' : ''}`}
                    >
                        {!remoteVideoVisible && (
                            // Fallback: Show avatar when no remote video
                            <div className="call-window-avatar-fallback">
                                {decodedAvatar && isValidAvatar(decodedAvatar) ? (
                                    <img
                                        src={decodedAvatar}
                                        alt={decodedName}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            const placeholder = e.target.nextElementSibling;
                                            if (placeholder) placeholder.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div
                                    className="call-window-avatar-placeholder"
                                    style={{
                                        display: (decodedAvatar && isValidAvatar(decodedAvatar)) ? 'none' : 'flex',
                                        backgroundColor: avatarColor,
                                        width: '120px',
                                        height: '120px',
                                        fontSize: '48px',
                                        borderRadius: '50%',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: '600'
                                    }}
                                >
                                    {initials}
                                </div>
                                <p className="call-window-name">{decodedName}</p>
                                <p className="call-window-status">
                                    {isConnected ? 'Свързан' : 'Свързване...'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Local video (Picture-in-Picture) - only when camera is ON */}
                    {isVideoEnabled && (
                        <div className="call-window-local-video-pip">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="local-video-element"
                            />
                            <div className="pip-label">Вие</div>
                        </div>
                    )}

                    {/* Call info bar */}
                    <div className="call-window-info">
                        <span className="call-duration">{formatDuration(callDuration)}</span>
                        {isVideoEnabled && <span className="video-indicator">Video</span>}
                    </div>

                    {/* Controls at bottom */}
                    <div className="call-window-controls">
                        {/* Mute button */}
                        <button
                            className={`call-control-btn ${isMuted ? 'active' : ''}`}
                            onClick={onMuteToggle}
                            title={isMuted ? 'Включи микрофон' : 'Изключи микрофон'}
                        >
                            <i className={`bi bi-mic${isMuted ? '-mute' : ''}-fill`}></i>
                        </button>

                        {/* Camera toggle button */}
                        <button
                            className={`call-control-btn ${!isVideoEnabled ? 'inactive' : ''}`}
                            onClick={onCameraToggle}
                            title={isVideoEnabled ? 'Изключи камера' : 'Включи камера'}
                            disabled={cameraPermissionDenied}
                        >
                            <i className={`bi bi-camera-video${!isVideoEnabled ? '-off' : ''}-fill`}></i>
                        </button>

                        {/* End call button */}
                        <button
                            className="call-control-btn call-end-btn"
                            onClick={onEndCall}
                            title="Прекрати"
                        >
                            <i className="bi bi-telephone-x-fill"></i>
                        </button>
                    </div>
                </div>
            ) : (
                // Original modal layout for non-connected states
                <div className="call-window-modal">
                {/* Avatar with animation */}
                <div className={`call-window-avatar ${callState === 'connected' ? 'connected' : ''} ${callState === 'outgoing' || callState === 'incoming' ? 'pulsing' : ''}`}>
                    {decodedAvatar && isValidAvatar(decodedAvatar) ? (
                        <img 
                            src={decodedAvatar} 
                            alt={decodedName} 
                            onError={(e) => {
                                // Fallback to placeholder on error
                                e.target.style.display = 'none';
                                const placeholder = e.target.nextElementSibling;
                                if (placeholder) placeholder.style.display = 'flex';
                            }}
                        />
                    ) : null}
                    <div 
                        className="call-window-avatar-placeholder"
                        style={{ 
                            display: (decodedAvatar && isValidAvatar(decodedAvatar)) ? 'none' : 'flex',
                            backgroundColor: avatarColor 
                        }}
                    >
                        {initials}
                    </div>
                    {/* Connection indicator ring */}
                    {callState === 'connected' && isConnected && (
                        <div className="call-window-avatar-ring"></div>
                    )}
                </div>

                {/* Status */}
                <div className="call-window-status">
                    <div className="call-window-title">
                        {callState === 'outgoing' && 'Обаждане...'}
                        {callState === 'incoming' && 'Входящо обаждане'}
                        {callState === 'connected' && (
                            <>
                                В разговор {decodedName && `с ${decodedName}`}
                            </>
                        )}
                        {callState === 'rejected' && 'Обаждането е отхвърлено'}
                    </div>

                    <div className="call-window-subtitle">
                        {callState === 'connected' && isConnected
                            ? formatDuration(callDuration)
                            : callState === 'rejected' ? 'Затваряне...' : decodedName}
                    </div>

                    {/* Modern animated effect for outgoing/incoming */}
                    {(callState === 'incoming' || callState === 'outgoing') && (
                        <div className="call-window-calling-animation">
                            <div className="call-window-ripple-container">
                                <div className="call-window-ripple ripple-1"></div>
                                <div className="call-window-ripple ripple-2"></div>
                                <div className="call-window-ripple ripple-3"></div>
                                <div className="call-window-ripple ripple-4"></div>
                            </div>
                            <div className="call-window-glow-core">
                                <div className="call-window-glow-inner"></div>
                            </div>
                            <div className="call-window-particles">
                                <div className="particle particle-1"></div>
                                <div className="particle particle-2"></div>
                                <div className="particle particle-3"></div>
                                <div className="particle particle-4"></div>
                                <div className="particle particle-5"></div>
                                <div className="particle particle-6"></div>
                            </div>
                        </div>
                    )}

                    {/* Rejection animation - red version */}
                    {callState === 'rejected' && (
                        <div className="call-window-calling-animation call-window-rejection-animation">
                            <div className="call-window-ripple-container">
                                <div className="call-window-ripple ripple-1 rejection-ripple"></div>
                                <div className="call-window-ripple ripple-2 rejection-ripple"></div>
                                <div className="call-window-ripple ripple-3 rejection-ripple"></div>
                                <div className="call-window-ripple ripple-4 rejection-ripple"></div>
                            </div>
                            <div className="call-window-glow-core rejection-glow">
                                <div className="call-window-glow-inner rejection-glow-inner"></div>
                            </div>
                            <div className="call-window-particles rejection-particles">
                                <div className="particle particle-1 rejection-particle"></div>
                                <div className="particle particle-2 rejection-particle"></div>
                                <div className="particle particle-3 rejection-particle"></div>
                                <div className="particle particle-4 rejection-particle"></div>
                                <div className="particle particle-5 rejection-particle"></div>
                                <div className="particle particle-6 rejection-particle"></div>
                            </div>
                        </div>
                    )}

                    {/* Connection status */}
                    {callState === 'connected' && !isConnected && (
                        <div className="call-window-connecting">Свързване...</div>
                    )}
                </div>

                {/* Actions */}
                <div className="call-window-actions">
                    {callState === 'connected' && (
                        <>
                            <button
                                className={`call-window-btn-mute ${isMuted ? 'muted' : ''}`}
                                onClick={onMuteToggle}
                                title={isMuted ? 'Включи микрофона' : 'Изключи микрофона'}
                            >
                                {isMuted ? (
                                    <i className="bi bi-mic-mute muted-icon"></i>
                                ) : (
                                    <i className="bi bi-mic active-icon"></i>
                                )}
                            </button>

                            <button
                                className="call-window-btn-end"
                                onClick={onEndCall}
                                title="Затвори обаждането"
                            >
                                <i className="bi bi-telephone end-icon"></i>
                            </button>
                        </>
                    )}

                    {(callState === 'outgoing' || callState === 'incoming') && (
                        <button
                            className="call-window-btn-end"
                            onClick={onEndCall}
                            title={callState === 'outgoing' ? 'Отмени обаждането' : 'Откажи обаждането'}
                        >
                            <i className="bi bi-telephone end-icon"></i>
                        </button>
                    )}

                    {/* No buttons for rejected state - will auto-close */}
                    {callState === 'rejected' && (
                        <div className="call-window-actions">
                            {/* Empty - just for spacing */}
                        </div>
                    )}
                </div>
            </div>
            )}
        </div>
    );
};

export default CallWindowModal;

