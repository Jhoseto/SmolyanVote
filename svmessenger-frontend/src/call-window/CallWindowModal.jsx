/**
 * UI компонент за call-window popup прозорец
 * Показва състоянието на разговора и контролите
 */

import React from 'react';

const CallWindowModal = ({
    callState,
    callDuration,
    formatDuration,
    isMuted,
    isConnected,
    otherUserName,
    otherUserAvatar,
    onMuteToggle,
    onEndCall
}) => {
    const getInitials = (name) => {
        if (!name) return 'U';
        return name.charAt(0).toUpperCase();
    };

    return (
        <div className="call-window-container">
            <div className="call-window-modal">
                {/* Avatar */}
                <div className="call-window-avatar">
                    {otherUserAvatar ? (
                        <img src={otherUserAvatar} alt={otherUserName || 'User'} />
                    ) : (
                        <div className="call-window-avatar-placeholder">
                            {getInitials(otherUserName)}
                        </div>
                    )}
                </div>

                {/* Status */}
                <div className="call-window-status">
                    <div className="call-window-title">
                        {callState === 'outgoing' && 'Обаждане...'}
                        {callState === 'incoming' && 'Входящо обаждане'}
                        {callState === 'connected' && 'В разговор'}
                    </div>

                    <div className="call-window-subtitle">
                        {callState === 'connected' && isConnected
                            ? formatDuration(callDuration)
                            : (otherUserName || 'Потребител')}
                    </div>

                    {/* Pulse animation for outgoing/incoming */}
                    {(callState === 'incoming' || callState === 'outgoing') && (
                        <div className="call-window-icon">
                            <i className="bi bi-telephone-fill"></i>
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
                                    <i className="bi bi-mic-mute-fill"></i>
                                ) : (
                                    <i className="bi bi-mic-fill"></i>
                                )}
                            </button>

                            <button
                                className="call-window-btn-end"
                                onClick={onEndCall}
                                title="Затвори обаждането"
                            >
                                <i className="bi bi-telephone-x-fill"></i>
                            </button>
                        </>
                    )}

                    {(callState === 'outgoing' || callState === 'incoming') && (
                        <button
                            className="call-window-btn-end"
                            onClick={onEndCall}
                            title={callState === 'outgoing' ? 'Отмени обаждането' : 'Откажи обаждането'}
                        >
                            <i className="bi bi-telephone-x-fill"></i>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallWindowModal;

