import React from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import { formatMessageTimeOnly } from '../utils/svDateFormatter';
import { linkifyText, isOnlyEmoji } from '../utils/svHelpers';

/**
 * Single Message Item компонент
 * Показва едно съобщение в thread-а
 */
const SVMessageItem = ({ message, searchQuery = '' }) => {
    const { currentUser } = useSVMessenger();

    // Защита срещу невалидни съобщения
    if (!message || !message.id || !message.text) {
        console.warn('SVMessageItem: Invalid message received', message);
        return null;
    }

    // Защита срещу липсващ currentUser
    if (!currentUser || !currentUser.id) {
        return null; // Не показвай съобщението докато currentUser не е зареден
    }

    const isOwnMessage = message.senderId === currentUser.id;
    const isEmojiOnly = isOnlyEmoji(message.text);

    // Highlight search query in message text
    const highlightSearchText = (text, query) => {
        if (!query.trim()) return linkifyText(text);

        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const highlightedText = text.replace(regex, '<mark class="search-highlight">$1</mark>');
        return linkifyText(highlightedText);
    };

    // Функция за рендериране на правилните лястовици
    const renderCheckmarks = () => {
        if (!isOwnMessage) return null;

        // 1 сива лястовица: SENT (не е delivered)
        if (!message.isDelivered) {
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="single-check">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
            );
        }

        // 2 сиви лястовици: DELIVERED (delivered, но не е read)
        if (message.isDelivered && !message.isRead) {
            return (
                <svg width="18" height="14" viewBox="0 0 32 24" fill="currentColor" className="double-check-gray">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    <path d="M17 16.17L12.83 12l-1.42 1.41L17 19 29 7l-1.41-1.41z"/>
                </svg>
            );
        }

        // 2 зелени лястовици: READ (delivered и read)
        if (message.isDelivered && message.isRead) {
            return (
                <svg width="18" height="14" viewBox="0 0 32 24" fill="currentColor" className="double-check-green">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    <path d="M17 16.17L12.83 12l-1.42 1.41L17 19 29 7l-1.41-1.41z"/>
                </svg>
            );
        }

        return null;
    };

    return (
        <div className={`svmessenger-message-item ${isOwnMessage ? 'own' : 'other'}`}>
            {/* Avatar (only for other messages) */}
            {!isOwnMessage && (
                <div className="svmessenger-message-avatar">
                    <img
                        src={message.senderImageUrl || '/images/default-avatar.png'}
                        alt={message.senderUsername}
                        onError={(e) => {
                            e.target.src = '/images/default-avatar.png';
                        }}
                    />
                </div>
            )}

            {/* Message Content */}
            <div className="svmessenger-message-content">
                {/* Message Bubble */}
                <div className={`svmessenger-message-bubble ${isEmojiOnly ? 'emoji-only' : ''}`}>
                    <div
                        className="svmessenger-message-text"
                        dangerouslySetInnerHTML={{
                            __html: highlightSearchText(message.text, searchQuery)
                        }}
                    />
                </div>

                {/* Message Time and Status */}
                <div className="svmessenger-message-meta">
          <span className="svmessenger-message-time-only">
            {formatMessageTimeOnly(message.sentAt)}
          </span>

                    {/* Checkmarks за own messages */}
                    {isOwnMessage && (
                        <div className="svmessenger-message-read-status">
                            {renderCheckmarks()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SVMessageItem;