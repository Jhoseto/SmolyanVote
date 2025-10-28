import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import SVChatHeader from './SVChatHeader';
import SVMessageThread from './SVMessageThread';
import SVMessageInput from './SVMessageInput';

/**
 * Chat Window компонент
 * Показва отворен разговор с header, messages и input
 * Поддържа drag & drop функционалност (Windows-style)
 * + MacOS Genie Effect animations
 */
const SVChatWindow = ({ chat }) => {
    const { closeChat, minimizeChat, bringToFront, updateChatPosition } = useSVMessenger();
    const chatWindowRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isAnimating, setIsAnimating] = useState(false);

    // Track if restoring
    const wasMinimizedRef = useRef(chat.isMinimized);

    // Bring to front on mount (only if not minimized)
    useEffect(() => {
        if (!chat.isMinimized) {
            bringToFront(chat.conversation.id);
        }
    }, []);

    // Detect restore and trigger genie effect
    useEffect(() => {
        const isCurrentlyMinimized = chat.isMinimized;
        
        // If chat was minimized and now it's not, it's being restored
        if (wasMinimizedRef.current && !isCurrentlyMinimized) {
            handleRestoreAnimation();
        }
        
        wasMinimizedRef.current = isCurrentlyMinimized;
    }, [chat.isMinimized]);

    // ========== GENIE EFFECT ANIMATIONS ==========

    /**
     * Minimize animation με genie effect
     */
    const handleMinimizeAnimation = useCallback(() => {
        if (!chatWindowRef.current) return;

        const chatWindow = chatWindowRef.current;
        const conversationId = chat.conversation.id;

        // Намери съответния taskbar бутон
        const taskbarButton = document.querySelector(
            `.svmessenger-taskbar-button[data-chat-id="${conversationId}"]`
        );

        if (taskbarButton) {
            // Изчисли transform-origin спрямо бутона
            const buttonRect = taskbarButton.getBoundingClientRect();
            const windowRect = chatWindow.getBoundingClientRect();

            const originX = buttonRect.left + buttonRect.width / 2 - windowRect.left;
            const originY = buttonRect.top + buttonRect.height / 2 - windowRect.top;

            // Задай transform origin
            chatWindow.style.transformOrigin = `${originX}px ${originY}px`;
        } else {
            // Fallback - използвай центъра долу
            chatWindow.style.transformOrigin = 'center bottom';
        }

        // Добави animation класове
        setIsAnimating(true);
        chatWindow.classList.add('genie-minimize');
        chatWindow.style.willChange = 'transform, opacity';

        // След 350ms (duration на анимацията)
        setTimeout(() => {
            // Извикай minimize от context
            minimizeChat(conversationId);
            
            // Cleanup
            chatWindow.classList.remove('genie-minimize');
            chatWindow.style.willChange = 'auto';
            chatWindow.style.transformOrigin = '';
            setIsAnimating(false);
        }, 350);
    }, [chat.conversation.id, minimizeChat]);

    /**
     * Restore animation με genie effect
     */
    const handleRestoreAnimation = useCallback(() => {
        if (!chatWindowRef.current) return;

        const chatWindow = chatWindowRef.current;
        const conversationId = chat.conversation.id;

        // Намери съответния taskbar бутон
        const taskbarButton = document.querySelector(
            `.svmessenger-taskbar-button[data-chat-id="${conversationId}"]`
        );

        if (taskbarButton) {
            // Изчисли transform-origin спрямо бутона
            const buttonRect = taskbarButton.getBoundingClientRect();
            const windowRect = chatWindow.getBoundingClientRect();

            const originX = buttonRect.left + buttonRect.width / 2 - windowRect.left;
            const originY = buttonRect.top + buttonRect.height / 2 - windowRect.top;

            // Задай transform origin
            chatWindow.style.transformOrigin = `${originX}px ${originY}px`;
        } else {
            // Fallback
            chatWindow.style.transformOrigin = 'center bottom';
        }

        // Добави animation класове
        setIsAnimating(true);
        chatWindow.classList.add('genie-restore');
        chatWindow.style.willChange = 'transform, opacity';

        // След 380ms (duration на анимацията)
        setTimeout(() => {
            chatWindow.classList.remove('genie-restore');
            chatWindow.style.willChange = 'auto';
            chatWindow.style.transformOrigin = '';
            setIsAnimating(false);
        }, 380);
    }, [chat.conversation.id]);

    // ========== DRAG & DROP HANDLERS ==========

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

    // ========== ACTION HANDLERS ==========

    const handleClose = () => {
        closeChat(chat.conversation.id);
    };

    const handleMinimize = () => {
        // Trigger genie effect animation
        handleMinimizeAnimation();
    };

    return (
        <div
            ref={chatWindowRef}
            className={`svmessenger-chat-window ${isDragging ? 'dragging' : ''} ${isAnimating ? 'animating' : ''}`}
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