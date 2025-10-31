import React, { useMemo } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';

/**
 * Taskbar компонент (Windows-style)
 * Показва минимизирани чатове като бутони
 * + data-chat-id за Genie Effect targeting
 */
const SVTaskbar = () => {
    const { activeChats, conversations, restoreChat, closeChat } = useSVMessenger();

    // Get only minimized chats with live conversation data
    const minimizedChats = useMemo(() => {
        const result = activeChats
            .filter(chat => chat.isMinimized)
            .map(chat => ({
                ...chat,
                conversation: conversations.find(c => c.id === chat.conversation.id) || chat.conversation
            }));
        return result;
    }, [conversations]);

    // Don't render if no minimized chats
    if (minimizedChats.length === 0) {
        return null;
    }

    // Reverse to show first minimized on the right (next to the floating icon)
    const reversedMinimizedChats = [...minimizedChats].reverse();

    return (
        <div className="svmessenger-taskbar">
            {reversedMinimizedChats.map(chat => (
                <button
                    key={chat.conversation.id}
                    className="svmessenger-taskbar-button"
                    data-chat-id={chat.conversation.id}
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

                    {/* Close button */}
                    <button
                        className="svmessenger-taskbar-close"
                        onClick={(e) => {
                            e.stopPropagation();
                            closeChat(chat.conversation.id);
                        }}
                        title="Затвори чат"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </button>
            ))}
        </div>
    );
};

export default SVTaskbar;
