import React from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import SVConversationList from './SVConversationList';
import SVChatWindow from './SVChatWindow';
import SVUserSearch from './SVUserSearch';
import SVTaskbar from './SVTaskbar';
import SVCallModal from './SVCallModal';
import SVAudioDeviceSelector from './SVAudioDeviceSelector';
import SVDownloadModal from './SVDownloadModal';
import '../styles/svMessengerCalls.css';

/**
 * Главен SVMessenger Widget компонент
 * Floating button + chat windows + conversation list + taskbar
 */
const SVMessengerWidget = () => {
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
        handleDeviceSelectorCancel,
        callWindowRef,
        isDownloadModalOpen,
        openDownloadModal
    } = useSVMessenger();

    const isMobile = window.innerWidth <= 768;

    const handleFABClick = () => {
        if (isMobile) {
            openDownloadModal();
        } else {
            openChatList();
        }
    };


    return (
        <div className="svmessenger-widget">
            {/* Show only download modal for guests */}
            {!window.SVMESSENGER_USER_DATA?.isAuthenticated ? (
                <SVDownloadModal />
            ) : (
                <>
                    {/* Floating Action Button - ВИНАГИ видима за логнати потребители */}
                    <div className="svmessenger-fab" onClick={handleFABClick}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
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

                    {/* Call Modal - показва се само ако няма popup прозорец */}
                    {callState !== 'idle' && currentCall && currentCall.conversation && !callWindowRef && (
                        <SVCallModal
                            callState={callState}
                            conversation={currentCall.conversation}
                            onAccept={acceptCall}
                            onReject={rejectCall}
                            onEnd={endCall}
                        />
                    )}

                    {/* Call Indicator - показва се когато има активен popup прозорец */}
                    {callState !== 'idle' && currentCall && callWindowRef && (
                        <div className="svmessenger-call-indicator">
                            <div className="svmessenger-call-indicator-content">
                                <div className="svmessenger-call-indicator-icon">
                                    <i className="bi bi-headphones"></i>
                                </div>
                                <div className="svmessenger-call-indicator-text">
                                    <div className="svmessenger-call-indicator-title">
                                        {callState === 'outgoing' && 'Обаждане...'}
                                        {callState === 'incoming' && 'Входящо обаждане'}
                                        {callState === 'connected' && 'В разговор'}
                                    </div>
                                    <div className="svmessenger-call-indicator-subtitle">
                                        {currentCall.conversation?.otherUser?.realName || currentCall.conversation?.otherUser?.username || 'Потребител'}
                                    </div>
                                </div>
                                <button
                                    className="svmessenger-call-indicator-close"
                                    onClick={endCall}
                                    title="Затвори обаждането"
                                >
                                    <i className="bi bi-x"></i>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Taskbar (minimized chats) */}
                    <SVTaskbar />

                    {/* Download Modal for Mobile App */}
                    <SVDownloadModal />
                </>
            )}
        </div>
    );
};

export default SVMessengerWidget;