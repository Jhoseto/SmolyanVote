/**
 * Call History Item Component for Web
 * Показва история на обаждане в чата с красива визуализация
 */

import React from 'react';

/**
 * Format duration in seconds to human-readable format (e.g., "5:23" or "1:05:30")
 */
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format date to relative time (e.g., "Today", "Yesterday", "Jan 15")
 */
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const callDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffTime = today.getTime() - callDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Днес';
  } else if (diffDays === 1) {
    return 'Вчера';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('bg-BG', { weekday: 'long' });
  } else {
    return date.toLocaleDateString('bg-BG', { day: 'numeric', month: 'short' });
  }
};

const SVCallHistoryItem = ({ callHistory, currentUserId }) => {
  const isOwnCall = callHistory.callerId === currentUserId;
  const isIncomingCall = callHistory.receiverId === currentUserId;

  // Determine call status text and icon color
  let statusText;
  let statusColor;
  let iconColor;
  let durationText = '';

  switch (callHistory.status) {
    case 'ACCEPTED':
      // Show duration if call was answered and completed
      if (callHistory.durationSeconds && callHistory.durationSeconds > 0) {
        durationText = formatDuration(callHistory.durationSeconds);
        statusText = `Разговор: ${durationText}`;
      } else {
        statusText = 'Прието';
      }
      statusColor = '#16a34a'; // green-600
      iconColor = '#16a34a';
      break;
    case 'REJECTED':
      statusText = isIncomingCall ? 'Отказано от теб' : 'Отказано';
      statusColor = '#dc2626'; // red-600
      iconColor = '#dc2626';
      break;
    case 'MISSED':
      statusText = isIncomingCall ? 'Пропуснато от теб' : 'Неотговорено';
      statusColor = '#dc2626'; // red-600
      iconColor = '#dc2626';
      break;
    case 'CANCELLED':
      statusText = isOwnCall ? 'Отменено от теб' : 'Отменено';
      statusColor = '#6b7280'; // gray-600
      iconColor = '#6b7280';
      break;
    default:
      statusText = 'Неизвестно';
      statusColor = '#6b7280';
      iconColor = '#6b7280';
  }

  // Show clear call direction - who called whom
  // Format: "Ти звънна на [Name]" or "[Name] звънна на теб"
  const callDirectionText = isOwnCall 
    ? `Ти звънна на ${callHistory.receiverName}`
    : `${callHistory.callerName} звънна на теб`;

  // Format time
  const callTime = new Date(callHistory.startTime).toLocaleTimeString('bg-BG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Format date
  const callDate = formatDate(callHistory.startTime);

  // Determine arrow icon and direction based on call type
  // Outgoing call (isOwnCall) → ArrowRightIcon (→)
  // Incoming call (!isOwnCall) → ArrowLeftIcon (←)
  const ArrowIcon = isOwnCall 
    ? () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      )
    : () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      );

  // Determine arrow color based on status
  // Green for accepted calls, red for missed/rejected, gray for cancelled
  const arrowColor = callHistory.status === 'ACCEPTED' 
    ? '#16a34a' 
    : callHistory.status === 'MISSED' || callHistory.status === 'REJECTED'
    ? '#dc2626'
    : '#6b7280';

  return (
    <div className="svmessenger-call-history-item">
      <div className="svmessenger-call-history-bubble" style={{ borderColor: statusColor + '66' }}>
        {/* Main icon (phone/video) with arrow indicator */}
        <div className="svmessenger-call-history-icon-container">
          <div className="svmessenger-call-history-icon-wrapper" style={{ backgroundColor: iconColor + '26' }}>
            {callHistory.isVideoCall ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 10l2-2v8l-2-2M14 6H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.33L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.33-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            )}
          </div>
          {/* Arrow indicator showing call direction */}
          <div className="svmessenger-call-history-arrow-container" style={{ backgroundColor: arrowColor + '33' }}>
            <ArrowIcon />
          </div>
        </div>
        <div className="svmessenger-call-history-content">
          <div className="svmessenger-call-history-direction-text">{callDirectionText}</div>
          <div className="svmessenger-call-history-status-row">
            <div className="svmessenger-call-history-status-badge" style={{ backgroundColor: statusColor + '26' }}>
              <span className="svmessenger-call-history-status-text" style={{ color: statusColor }}>
                {statusText}
              </span>
            </div>
            <span className="svmessenger-call-history-time-text"> • {callTime}</span>
          </div>
          <div className="svmessenger-call-history-date-text">{callDate}</div>
        </div>
      </div>
    </div>
  );
};

export default SVCallHistoryItem;
