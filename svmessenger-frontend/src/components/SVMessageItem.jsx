import React from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import { formatMessageTimeOnly } from '../utils/svDateFormatter';
import { linkifyText, isOnlyEmoji } from '../utils/svHelpers';

/**
 * Single Message Item компонент
 * Показва едно съобщение в thread-а
 */
const SVMessageItem = ({ message }) => {
    const { currentUser } = useSVMessenger();

    const isOwnMessage = message.senderId === currentUser.id;
    const isEmojiOnly = isOnlyEmoji(message.text);

    // Функция за рендериране на правилните лястовици
    const renderCheckmarks = () => {
        if (!isOwnMessage) return null;

        // 1 сива лястовица: SENT (не е delivered, не е read)
        if (!message.isDelivered && !message.isRead) {
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
            );
        }

        // 2 сиви лястовици: DELIVERED (delivered, но не е read)
        if (message.isDelivered && !message.isRead) {
            return (
                <svg width="16" height="14" viewBox="0 0 28 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    <path d="M15 16.17L10.83 12l-1.42 1.41L15 19 27 7l-1.41-1.41z" opacity="0.6"/>
                </svg>
            );
        }

        // 2 зелени лястовици: READ (и delivered и read)
        if (message.isRead) {
            return (
                <svg width="16" height="14" viewBox="0 0 28 24" fill="currentColor" className="double-check">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    <path d="M15 16.17L10.83 12l-1.42 1.41L15 19 27 7l-1.41-1.41z" opacity="0.6"/>
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
                            __html: linkifyText(message.text)
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