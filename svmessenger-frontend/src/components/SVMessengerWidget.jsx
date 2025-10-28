import React, { useState } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import SVConversationList from './SVConversationList';
import SVFollowingList from './SVFollowingList';
import SVChatWindow from './SVChatWindow';
import SVUserSearch from './SVUserSearch';
import SVTaskbar from './SVTaskbar';

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
        closeSearch
    } = useSVMessenger();

    // State for showing following list vs conversation list
    const [showFollowingList, setShowFollowingList] = useState(false);

    return (
        <div className="svmessenger-widget">
            {/* Floating Action Button */}
            <div className="svmessenger-fab" onClick={openChatList}>
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

            {/* Following List or Conversation List Popup */}
            {isChatListOpen && (
                showFollowingList ? (
                    <SVFollowingList
                        onClose={() => {
                            setShowFollowingList(false);
                            closeChatList();
                        }}
                        onSearchClick={() => {
                            setShowFollowingList(false);
                            openSearch();
                        }}
                    />
                ) : (
                    <SVConversationList
                        onClose={closeChatList}
                        onSearchClick={() => setShowFollowingList(true)}
                    />
                )
            )}

            {/* User Search Popup */}
            {isSearchOpen && (
                <SVUserSearch onClose={closeSearch} />
            )}

            {/* Active Chat Windows */}
            {activeChats
                .filter(chat => !chat.isMinimized)
                .map(chat => (
                    <SVChatWindow
                        key={chat.conversation.id}
                        chat={chat}
                    />
                ))
            }

            {/* Taskbar (minimized chats) */}
            <SVTaskbar />
        </div>
    );
};

export default SVMessengerWidget;