import React, { useState, useEffect } from 'react';

/**
 * Call Modal компонент за SVMessenger
 * Показва различни състояния на voice call: incoming, outgoing, connected
 */
const SVCallModal = ({ callState, conversation, onAccept, onReject, onEnd }) => {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Timer за connected calls
  useEffect(() => {
    let interval;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState]);

  // Format duration as MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    // Here you would call the actual mute/unmute function
  };

  if (!conversation || callState === 'idle') {
    return null;
  }

  const { otherUser } = conversation;
  const modalClass = `svmessenger-call-modal svmessenger-call-${callState}`;

  return (
    <div className="svmessenger-call-modal-overlay">
      <div className={modalClass}>
        {/* Avatar */}
        <div className="svmessenger-call-avatar">
          {otherUser.imageUrl ? (
            <img src={otherUser.imageUrl} alt={otherUser.realName || otherUser.username} />
          ) : (
            <div className="svmessenger-call-avatar-placeholder">
              {(otherUser.realName || otherUser.username || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="svmessenger-call-status">
          <div className="svmessenger-call-title">
            {callState === 'incoming' && 'Входящо обаждане'}
            {callState === 'outgoing' && 'Обаждане...'}
            {callState === 'connected' && 'В разговор'}
          </div>

          <div className="svmessenger-call-subtitle">
            {callState === 'connected' ? formatDuration(callDuration) : (otherUser.realName || otherUser.username)}
          </div>

          {/* Pulse animation for incoming/outgoing */}
          {(callState === 'incoming' || callState === 'outgoing') && (
            <div className="svmessenger-call-icon">
              <i className="bi bi-telephone-fill" style={{ fontSize: '24px' }}></i>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="svmessenger-call-actions">
          {callState === 'incoming' && (
            <>
              <button
                className="svmessenger-call-btn-accept"
                onClick={onAccept}
                title="Приеми обаждането"
              >
                <i className="bi bi-headphones" style={{ fontSize: '24px' }}></i>
              </button>

              <button
                className="svmessenger-call-btn-reject"
                onClick={onReject}
                title="Откажи обаждането"
              >
                <i className="bi bi-headphones" style={{ fontSize: '24px' }}></i>
              </button>
            </>
          )}

          {callState === 'outgoing' && (
            <button
              className="svmessenger-call-btn-end"
              onClick={onEnd}
              title="Отмени обаждането"
            >
              <i className="bi bi-telephone-x-fill" style={{ fontSize: '24px' }}></i>
            </button>
          )}

          {callState === 'connected' && (
            <>
              <button
                className={`svmessenger-call-btn-mute ${isMuted ? 'muted' : ''}`}
                onClick={handleMuteToggle}
                title={isMuted ? 'Включи микрофона' : 'Изключи микрофона'}
              >
                {isMuted ? (
                  <i className="bi bi-mic-mute-fill" style={{ fontSize: '20px' }}></i>
                ) : (
                  <i className="bi bi-mic-fill" style={{ fontSize: '20px' }}></i>
                )}
              </button>

              <button
                className="svmessenger-call-btn-end"
                onClick={onEnd}
                title="Затвори обаждането"
              >
                <i className="bi bi-telephone-x-fill" style={{ fontSize: '24px' }}></i>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SVCallModal;
