/**
 * SVMessenger Context - Composed context that combines Messages, Call, and UI contexts
 * This is the main provider that should be used at the app root
 */

import React, { createContext, useContext } from 'react';
import { MessagesProvider, useMessages } from './MessagesContext';
import { CallProvider, useCall } from './CallContext';
import { UIProvider, useUI } from './UIContext';
import { WebSocketManager } from './WebSocketManager';

const SVMessengerContext = createContext(null);

/**
 * Main hook to access all SVMessenger functionality
 * Combines Messages, Call, and UI contexts
 */
export const useSVMessenger = () => {
    const messages = useMessages();
    const call = useCall();
    const ui = useUI();

    return {
        // Messages Context
        currentUser: messages.currentUser,
        conversations: messages.conversations,
        messagesByConversation: messages.messagesByConversation,
        callHistoryByConversation: messages.callHistoryByConversation,
        isLoadingConversations: messages.isLoadingConversations,
        loadingMessages: messages.loadingMessages,
        loadingCallHistory: messages.loadingCallHistory,
        typingUsers: messages.typingUsers,
        totalUnreadCount: messages.totalUnreadCount,
        isWebSocketConnected: messages.isWebSocketConnected,
        loadConversations: messages.loadConversations,
        loadMessages: messages.loadMessages,
        loadCallHistory: messages.loadCallHistory,
        sendMessage: messages.sendMessage,
        startConversation: messages.startConversation,
        markAsRead: messages.markAsRead,
        sendTypingStatus: messages.sendTypingStatus,
        removeFromConversationList: messages.removeFromConversationList,

        // Call Context
        currentCall: call.currentCall,
        callState: call.callState,
        showDeviceSelector: call.showDeviceSelector,
        deviceSelectorMode: call.deviceSelectorMode,
        callWindowRef: call.callWindowRef,
        liveKitToken: call.liveKitToken,
        liveKitRoom: call.liveKitRoom,
        startCall: call.startCall,
        acceptCall: call.acceptCall,
        rejectCall: call.rejectCall,
        endCall: call.endCall,
        connectToLiveKit: call.connectToLiveKit,
        openAudioSettings: call.openAudioSettings,
        handleDeviceSelectorComplete: call.handleDeviceSelectorComplete,
        handleDeviceSelectorCancel: call.handleDeviceSelectorCancel,

        // UI Context
        activeChats: ui.activeChats,
        isChatListOpen: ui.isChatListOpen,
        isSearchOpen: ui.isSearchOpen,
        openChatList: ui.openChatList,
        closeChatList: ui.closeChatList,
        openSearch: ui.openSearch,
        closeSearch: ui.closeSearch,
        openChat: ui.openChat,
        closeChat: ui.closeChat,
        minimizeChat: ui.minimizeChat,
        restoreChat: ui.restoreChat,
        bringToFront: ui.bringToFront,
        updateChatPosition: ui.updateChatPosition
    };
};

/**
 * Main provider that composes all SVMessenger contexts
 * Usage: <SVMessengerProvider userData={currentUser}>...</SVMessengerProvider>
 */
export const SVMessengerProvider = ({ children, userData }) => {
    return (
        <MessagesProvider currentUser={userData}>
            <CallProvider currentUser={userData}>
                <UIProvider currentUser={userData}>
                    <WebSocketManager />
                    {children}
                </UIProvider>
            </CallProvider>
        </MessagesProvider>
    );
};
