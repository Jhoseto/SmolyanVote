import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import SVChatHeader from './SVChatHeader';
import SVMessageThread from './SVMessageThread';
import SVMessageInput from './SVMessageInput';

/**
 * Chat Window компонент
 * Показва отворен разговор с header, messages и input
 * Поддържа drag & drop функционалност (Windows-style)
 */
const SVChatWindow = ({ chat }) => {
    const { closeChat, minimizeChat, bringToFront, updateChatPosition } = useSVMessenger();
    const chatWindowRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Bring to front on mount
    useEffect(() => {
        bringToFront(chat.conversation.id);
    }, []);

    // Drag handlers
    const handleMouseDown = useCallback((e) => {
        // Only allow dragging from header
        if (!e.target.closest('.svmessenger-chat-header')) return;
        if (e.target.closest('.svmessenger-chat-controls')) return;

        setIsDragging(true);
        setDragOffset({
            x: e.clientX - chat.position.x,
            y: e.clientY - chat.position.y
        });

        // Bring to front when clicked
        bringToFront(chat.conversation.id);
    }, [chat.position, chat.conversation.id, bringToFront]);

    // Global mouse move and up handlers
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e) => {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;

            // Keep within viewport bounds
            const maxX = window.innerWidth - 400; // chat width
            const maxY = window.innerHeight - 600; // chat height

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

    return (
        <div
            ref={chatWindowRef}
            className={`svmessenger-chat-window ${isDragging ? 'dragging' : ''}`}
            style={{
                left: `${chat.position.x}px`,
                top: `${chat.position.y}px`,
                zIndex: chat.zIndex
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Header */}
            <SVChatHeader
                conversation={chat.conversation}
                onClose={handleClose}
                onMinimize={handleMinimize}
            />

            {/* Messages Thread */}
            <SVMessageThread conversationId={chat.conversation.id} />

            {/* Message Input */}
            <SVMessageInput conversationId={chat.conversation.id} />
        </div>
    );
};

export default SVChatWindow;