/**
 * Call History Item Component for Web
 * Показва история на обаждане в чата с красива визуализация
 */

import React from 'react';

/**
 * Format duration in seconds to human-readable format (e.g., "5:23" or "1:05:30")
 */
const formatDuration = (seconds) => {
  // CRITICAL: Safety check for invalid duration
  if (!seconds || seconds < 0 || isNaN(seconds)) {
    return '0:00';
  }
  
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

  // Determine call type text and premium graphics
  let callTypeText;
  let callTypeColor;
  let durationText = '';
  let showArrow = false;
  let arrowDirection = null;

  if (callHistory.status === 'ACCEPTED') {
    // For accepted calls, show "Разговор" with duration
    // CRITICAL: Only show duration if it's greater than 0 (avoid showing "Разговор 0:00")
    if (callHistory.durationSeconds && callHistory.durationSeconds > 0) {
      durationText = formatDuration(callHistory.durationSeconds);
      callTypeText = `Разговор ${durationText}`;
    } else {
      // If duration is 0 or null, just show "Разговор" without duration
      // This prevents showing "Разговор 0:00" for calls that were rejected but somehow marked as ACCEPTED
      callTypeText = 'Разговор';
    }
    callTypeColor = '#16a34a'; // green-600
    // No arrow for accepted calls (both parties connected)
  } else if (callHistory.status === 'REJECTED') {
    // For rejected calls, show "Отказано"
    callTypeText = 'Отказано';
    callTypeColor = '#dc2626'; // red-500
    showArrow = true;
    arrowDirection = isOwnCall ? 'right' : 'left'; // Outgoing rejected → right, Incoming rejected → left
  } else {
    // For missed/cancelled calls, show direction (Входящо/Изходящо)
    if (isOwnCall) {
      callTypeText = 'Изходящо';
      showArrow = true;
      arrowDirection = 'right'; // Outgoing → right arrow
    } else {
      callTypeText = 'Входящо';
      showArrow = true;
      arrowDirection = 'left'; // Incoming → left arrow
    }
    // Gray for missed/cancelled calls
    callTypeColor = '#6b7280'; // gray-500
  }

  // Format start time as HH:mm (e.g., "22:30" or "15:36")
  const callTime = new Date(callHistory.startTime).toLocaleTimeString('bg-BG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // 24-hour format
  });

  // Format start date
  const callDate = formatDate(callHistory.startTime);
  
  // Format end time for accepted calls
  // CRITICAL: Add safety checks for invalid dates (same as mobile version)
  let endTime = '';
  let endDate = '';
  if (callHistory.status === 'ACCEPTED' && callHistory.endTime) {
    try {
      const date = new Date(callHistory.endTime);
      if (!isNaN(date.getTime())) {
        const timeString = date.toLocaleTimeString('bg-BG', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false, // 24-hour format
        });
        const dateString = formatDate(callHistory.endTime);
        
        // CRITICAL: Check if strings are valid and not "Invalid Date"
        if (timeString && 
            timeString !== 'Invalid Date' && 
            !timeString.includes('Invalid') &&
            dateString && 
            dateString !== 'Invalid Date' &&
            !dateString.includes('Invalid')) {
          endTime = timeString;
          endDate = dateString;
        }
      }
    } catch (e) {
      // Invalid date - use fallback
      endTime = '';
      endDate = '';
    }
  }

  // Premium arrow icons
  const ArrowRightIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={callTypeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );

  const ArrowLeftIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={callTypeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  );

  return (
    <div className="svmessenger-call-history-item">
      <div className="svmessenger-call-history-content">
        {/* Premium minimal design with icons and arrows */}
        <div className="svmessenger-call-history-row">
          {/* Premium icon (phone/video) */}
          <div className="svmessenger-call-history-icon-container">
            {callHistory.isVideoCall ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={callTypeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 10l2-2v8l-2-2M14 6H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={callTypeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.33L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.33-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            )}
          </div>
          
          {/* Arrow indicator for direction (premium graphics) */}
          {showArrow && arrowDirection && (
            <div className="svmessenger-call-history-arrow-container">
              {arrowDirection === 'right' ? <ArrowRightIcon /> : <ArrowLeftIcon />}
            </div>
          )}
          
          {/* Call type text (Входящо, Изходящо, Отказано, Разговор) */}
          <span className="svmessenger-call-history-type-text" style={{ color: callTypeColor }}>
            {callTypeText}
          </span>
          
          {/* Date and time together */}
          <span className="svmessenger-call-history-time-text"> • {callDate} {callTime}</span>
        </div>
        
        {/* For accepted calls - show end time and duration */}
        {callHistory.status === 'ACCEPTED' && (
          <div className="svmessenger-call-history-accepted-details">
            {/* End time */}
            {endTime && endDate && (
              <div className="svmessenger-call-history-detail-text">
                Приключи: {endDate} {endTime}
              </div>
            )}
            {/* Duration */}
            {callHistory.durationSeconds && callHistory.durationSeconds > 0 && (
              <div className="svmessenger-call-history-duration-text">
                Продължителност: {formatDuration(callHistory.durationSeconds)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SVCallHistoryItem;
