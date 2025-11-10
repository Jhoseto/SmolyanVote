import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import SVChatHeader from './SVChatHeader';
import SVMessageThread from './SVMessageThread';
import SVMessageInput from './SVMessageInput';

// Search component that appears below header
const SVChatSearch = ({ searchQuery, onSearchChange, onClose }) => {
    return (
        <div className="svmessenger-chat-search">
            <input
                type="text"
                className="svmessenger-chat-search-input"
                placeholder="Търси в разговора..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                autoFocus
            />
            <button
                className="svmessenger-chat-search-close"
                onClick={onClose}
                title="Затвори търсенето"
            >
                ✕
            </button>
        </div>
    );
};

const SVChatWindow = ({ chat }) => {
    const { closeChat, minimizeChat, bringToFront, updateChatPosition, markAsRead, messagesByConversation, currentUser } = useSVMessenger();
    const chatWindowRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Search state
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!chat.isMinimized) {
            bringToFront(chat.conversation.id);
        }
    }, []);

    // При click в chat window - маркирай като прочетено ако има непрочетени съобщения
    const handleWindowClick = useCallback(() => {
        if (!chat.isMinimized) {
            bringToFront(chat.conversation.id);

            // Провери дали има непрочетени съобщения и ги маркирай като прочетено
            const messages = messagesByConversation[chat.conversation.id] || [];
            const hasUnreadMessages = messages.some(m => m.senderId !== currentUser.id && !m.isRead);

            if (hasUnreadMessages) {
                markAsRead(chat.conversation.id);
            }
        }
    }, [chat.conversation.id, chat.isMinimized, bringToFront, markAsRead, messagesByConversation, currentUser]);

    const handleMouseDown = useCallback((e) => {
        if (!e.target.closest('.svmessenger-chat-header')) return;
        if (e.target.closest('.svmessenger-chat-controls')) return;

        setIsDragging(true);
        setDragOffset({
            x: e.clientX - chat.position.x,
            y: e.clientY - chat.position.y
        });

        bringToFront(chat.conversation.id);
    }, [chat.position, chat.conversation.id, bringToFront]);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e) => {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;

            const maxX = window.innerWidth - 400;
            const maxY = window.innerHeight - 600;

            const boundedX = Math.max(0, Math.min(newX, maxX));
            const boundedY = Math.max(0, Math.min(newY, maxY));

            updateChatPosition(chat.conversation.id, { x: boundedX, y: boundedY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset, chat.conversation.id, updateChatPosition]);

    const handleClose = () => {
        closeChat(chat.conversation.id);
    };

    const handleMinimize = () => {
        minimizeChat(chat.conversation.id);
    };

    const handleOpenSearch = () => {
        setIsSearchOpen(true);
    };

    const handleCloseSearch = () => {
        setIsSearchOpen(false);
        setSearchQuery('');
    };

    const handleSearchChange = (query) => {
        setSearchQuery(query);
    };

    // FIX 2: Style с display control вместо return null
    const windowStyle = {
        left: `${chat.position.x}px`,
        top: `${chat.position.y}px`,
        zIndex: chat.zIndex,
        display: chat.isMinimized ? 'none' : 'flex'
    };

    // FIX 1 & 2: Винаги render, само скрий с CSS
    return (
        <div
            ref={chatWindowRef}
            className={`svmessenger-chat-window ${isDragging ? 'dragging' : ''}`}
            style={windowStyle}
            onMouseDown={handleMouseDown}
            onClick={handleWindowClick}
        >
            <SVChatHeader
                conversation={chat.conversation}
                onClose={handleClose}
                onMinimize={handleMinimize}
                onOpenSearch={handleOpenSearch}
            />

            {/* Search field appears below header */}
            {isSearchOpen && (
                <SVChatSearch
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    onClose={handleCloseSearch}
                />
            )}

            <SVMessageThread
                conversationId={chat.conversation.id}
                searchQuery={searchQuery}
            />

            <SVMessageInput conversationId={chat.conversation.id} />
        </div>
    );
};

export default SVChatWindow;
