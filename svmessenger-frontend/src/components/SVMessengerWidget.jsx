import React from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import SVConversationList from './SVConversationList';
import SVChatWindow from './SVChatWindow';
import SVUserSearch from './SVUserSearch';
import SVTaskbar from './SVTaskbar';
import SVCallModal from './SVCallModal';
import SVAudioDeviceSelector from './SVAudioDeviceSelector';
import '../styles/svMessengerCalls.css';

/**
 * Главен SVMessenger Widget компонент
 * Floating button + chat windows + conversation list + taskbar
 */
const SVMessengerWidget = () => {
    console.log('🎯 SVMessengerWidget rendering');

    const {
        isChatListOpen,
        isSearchOpen,
        activeChats,
        totalUnreadCount,
        openChatList,
        closeChatList,
        openSearch,
        closeSearch,
        currentCall,
        callState,
        acceptCall,
        rejectCall,
        endCall,
        showDeviceSelector,
        handleDeviceSelectorComplete,
        handleDeviceSelectorCancel
    } = useSVMessenger();

    console.log('🎯 useSVMessenger returned:', { isChatListOpen, totalUnreadCount, openChatList: !!openChatList });

    return (
        <div className="svmessenger-widget">
            {/* Floating Action Button - ВИНАГИ видима */}
            <div className="svmessenger-fab" onClick={(e) => {
                console.log('🎯 FAB clicked, event:', e);
                console.log('🎯 Calling openChatList, isChatListOpen:', isChatListOpen);
                openChatList();
                console.log('🎯 openChatList called');
            }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>

                {/* Unread count badge */}
                {totalUnreadCount > 0 && (
                    <span className="svmessenger-badge">
                        {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                    </span>
                )}
            </div>

            {/* Conversation List Popup */}
            {isChatListOpen && (
                <SVConversationList
                    onClose={closeChatList}
                    onSearchClick={() => {
                        closeChatList();
                        openSearch();
                    }}
                />
            )}

            {/* User Search Popup */}
            {isSearchOpen && (
                <SVUserSearch onClose={closeSearch} />
            )}

            {/* FIX 5: БЕЗ AnimatePresence за chats - те не трябва да unmount */}
            {activeChats.map(chat => (
                <SVChatWindow
                    key={chat.conversation.id}
                    chat={chat}
                />
            ))}

            {/* Audio Device Selector */}
            <SVAudioDeviceSelector
                isOpen={showDeviceSelector}
                onComplete={handleDeviceSelectorComplete}
                onCancel={handleDeviceSelectorCancel}
            />

            {/* Call Modal */}
            {callState !== 'idle' && currentCall && currentCall.conversation && (
                <SVCallModal
                    callState={callState}
                    conversation={currentCall.conversation}
                    onAccept={acceptCall}
                    onReject={rejectCall}
                    onEnd={endCall}
                />
            )}

            {/* Taskbar (minimized chats) */}
            <SVTaskbar />
        </div>
    );
};

export default SVMessengerWidget;