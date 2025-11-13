/**
 * WebSocket Manager - Handles WebSocket initialization and event routing
 * This component must be rendered inside all context providers
 */

import { useEffect, useCallback, useRef } from 'react';
import { useMessages } from './MessagesContext';
import { useCall } from './CallContext';
import { useUI } from './UIContext';
import svWebSocketService from '../services/svWebSocketService';

export const WebSocketManager = () => {
    const messages = useMessages();
    const call = useCall();
    const ui = useUI();

    const activeChatsRef = useRef(ui.activeChats);

    // Keep activeChatsRef in sync
    useEffect(() => {
        activeChatsRef.current = ui.activeChats;
    }, [ui.activeChats]);

    // Initialize WebSocket connection
    useEffect(() => {
        // Create wrapped handleNewMessage that has access to current activeChats
        const handleNewMessageWithUI = (message) => {
            messages.handleNewMessage(message, activeChatsRef.current);
        };

        // Initialize WebSocket with all handlers
        svWebSocketService.connect({
            onConnect: () => messages.handleWebSocketConnect?.(),
            onDisconnect: () => messages.handleWebSocketDisconnect?.(),
            onError: (error) => messages.handleWebSocketError?.(error),
            onNewMessage: handleNewMessageWithUI,
            onTypingStatus: messages.handleTypingStatus,
            onReadReceipt: messages.handleReadReceipt,
            onDeliveryReceipt: messages.handleDeliveryReceipt,
            onOnlineStatus: messages.handleOnlineStatus,
            onCallSignal: call.handleCallSignal
        });

        // Cleanup on unmount
        return () => {
            svWebSocketService.disconnect();
        };
    }, []); // Empty deps - only initialize once

    // Subscribe to typing status for active chats
    useEffect(() => {
        ui.activeChats.forEach(chat => {
            svWebSocketService.subscribeToTyping(chat.conversation.id, messages.handleTypingStatus);
        });

        // Cleanup subscriptions when chats change
        return () => {
            ui.activeChats.forEach(chat => {
                svWebSocketService.unsubscribeFromTyping(chat.conversation.id);
            });
        };
    }, [ui.activeChats.map(c => c.id).join(',')]);

    return null; // This component doesn't render anything
};
