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
            {callState === 'incoming' && 'Incoming call'}
            {callState === 'outgoing' && 'Calling...'}
            {callState === 'connected' && 'Connected'}
          </div>

          <div className="svmessenger-call-subtitle">
            {callState === 'connected' ? formatDuration(callDuration) : (otherUser.realName || otherUser.username)}
          </div>

          {/* Pulse animation for incoming/outgoing */}
          {(callState === 'incoming' || callState === 'outgoing') && (
            <div className="svmessenger-call-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 5.5C3 14.06 9.94 21 18.5 21C19.38 21 20.23 20.9 21.05 20.72C21.44 20.63 21.78 20.39 21.95 20.02C22.12 19.65 22.1 19.24 21.9 18.9L20.5 16.5C20.34 16.22 20.07 16.05 19.77 16.03C19.47 16.01 19.18 16.14 18.98 16.36L16.62 18.72C16.24 19.1 15.62 19.05 15.29 18.62C13.57 16.5 11.5 14.43 9.38 12.71C8.95 12.38 8.9 11.76 9.28 11.38L11.64 9.02C11.86 8.82 11.99 8.53 11.97 8.23C11.95 7.93 11.78 7.66 11.5 7.5L9.1 6.1C8.76 5.9 8.35 5.88 7.98 6.05C7.61 6.22 7.37 6.56 7.28 6.95C7.1 7.77 7 8.62 7 9.5C7 9.78 6.78 10 6.5 10C6.22 10 6 9.78 6 9.5C6 8.57 6.1 7.67 6.28 6.8L3.9 3.9C3.62 3.62 3.5 3.22 3.62 2.85C3.74 2.48 4.07 2.23 4.45 2.27C6.06 2.43 7.58 2.84 9 3.56L3 5.5Z" fill="currentColor"/>
              </svg>
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
                title="Accept call"
              >
                Отговори
              </button>

              <button
                className="svmessenger-call-btn-reject"
                onClick={onReject}
                title="Reject call"
              >
                Откажи
              </button>
            </>
          )}

          {callState === 'outgoing' && (
            <button
              className="svmessenger-call-btn-end"
              onClick={onEnd}
              title="Cancel call"
            >
                Затвори
            </button>
          )}

          {callState === 'connected' && (
            <>
              <button
                className={`svmessenger-call-btn-mute ${isMuted ? 'muted' : ''}`}
                onClick={handleMuteToggle}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C13.1 2 14 2.9 14 4V12C14 13.1 13.1 14 12 14C10.9 14 10 13.1 10 12V4C10 2.9 10.9 2 12 2ZM16.5 12C16.5 10.23 15.48 8.71 14 7.97V10.18L16.45 12.63C16.48 12.43 16.5 12.22 16.5 12ZM19 12C19 12.94 18.83 13.84 18.53 14.71L20.12 16.29C20.95 15.23 21.5 13.65 21.5 12C21.5 7.72 18.28 4.15 14 3.23V5.29C16.89 6.15 19 8.83 19 12ZM12 16.5C12.71 16.5 13.36 16.29 13.92 15.94L12.65 14.67C12.28 14.78 11.89 14.85 11.5 14.85C10.12 14.85 9 13.73 9 12.35V11.71L7.11 9.82C7.04 10.33 7 10.85 7 11.36C7 14.01 9.01 16.26 11.5 16.5C11.69 16.5 11.88 16.48 12.07 16.45L12 16.5ZM4.27 3L3 4.27L9.01 10.28V12.35C9.01 13.73 10.13 14.85 11.5 14.85C11.62 14.85 11.74 14.83 11.85 14.81L14.73 17.69C14.19 17.89 13.62 18 13 18C10.79 18 9 16.21 9 14V13.27L15.73 20L17 18.73L4.27 3Z" fill="currentColor"/>
                  {isMuted && <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2"/>}
                </svg>
                {isMuted ? 'Unmute' : 'Mute'}
              </button>

              <button
                className="svmessenger-call-btn-end"
                onClick={onEnd}
                title="End call"
              >
                Затвори
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SVCallModal;
