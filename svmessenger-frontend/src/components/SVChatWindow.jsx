import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import SVChatHeader from './SVChatHeader';
import SVMessageThread from './SVMessageThread';
import SVMessageInput from './SVMessageInput';

const SVChatWindow = ({ chat }) => {
    const { closeChat, minimizeChat, bringToFront, updateChatPosition,markAsRead } = useSVMessenger();
    const chatWindowRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!chat.isMinimized) {
            bringToFront(chat.conversation.id);
            // Маркирай като прочетено при отваряне
            markAsRead(chat.conversation.id);
        }
    }, []);

    // При click в chat window - маркирай като прочетено
    const handleWindowClick = useCallback(() => {
        if (!chat.isMinimized) {
            bringToFront(chat.conversation.id);
            markAsRead(chat.conversation.id);
        }
    }, [chat.conversation.id, chat.isMinimized, bringToFront, markAsRead]);

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

    if (chat.isMinimized) {
        return null;
    }

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
            onClick={handleWindowClick}
        >
            <SVChatHeader
                conversation={chat.conversation}
                onClose={handleClose}
                onMinimize={handleMinimize}
            />

            <SVMessageThread conversationId={chat.conversation.id} />

            <SVMessageInput conversationId={chat.conversation.id} />
        </div>
    );
};

export default SVChatWindow;
