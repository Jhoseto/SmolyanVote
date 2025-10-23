import React from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';

/**
 * Taskbar компонент (Windows-style)
 * Показва минимизирани чатове като бутони
 */
const SVTaskbar = () => {
    const { activeChats, restoreChat } = useSVMessenger();

    // Get only minimized chats
    const minimizedChats = activeChats.filter(chat => chat.isMinimized);

    // Don't render if no minimized chats
    if (minimizedChats.length === 0) {
        return null;
    }

    return (
        <div className="svmessenger-taskbar">
            {minimizedChats.map(chat => (
                <button
                    key={chat.conversation.id}
                    className="svmessenger-taskbar-button"
                    onClick={() => restoreChat(chat.conversation.id)}
                    title={`Възстанови разговор с ${chat.conversation.otherUser.realName || chat.conversation.otherUser.username}`}
                >
                    {/* Avatar */}
                    <div className="svmessenger-taskbar-avatar">
                        <img
                            src={chat.conversation.otherUser.imageUrl || '/images/default-avatar.png'}
                            alt={chat.conversation.otherUser.username}
                            onError={(e) => {
                                e.target.src = '/images/default-avatar.png';
                            }}
                        />
                        {chat.conversation.otherUser.isOnline && (
                            <div className="svmessenger-online-indicator"></div>
                        )}
                    </div>

                    {/* Name */}
                    <span className="svmessenger-taskbar-name">
            {chat.conversation.otherUser.realName || chat.conversation.otherUser.username}
          </span>

                    {/* Unread badge (if any) */}
                    {chat.conversation.unreadCount > 0 && (
                        <span className="svmessenger-taskbar-badge">
              {chat.conversation.unreadCount > 99 ? '99+' : chat.conversation.unreadCount}
            </span>
                    )}
                </button>
            ))}
        </div>
    );
};

export default SVTaskbar;