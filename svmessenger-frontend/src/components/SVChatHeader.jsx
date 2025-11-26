import React, { useState, useRef, useEffect } from 'react';

/**
 * ✅ FIXED: Chat Header Component with Bootstrap Icons
 * - Bootstrap phone icon (би-telephone)
 * - Без SVG
 */
const SVChatHeader = ({ conversation, onClose, onMinimize, onOpenSearch, onCall, onOpenAudioSettings }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    const { otherUser } = conversation;

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    const handleProfileView = () => {
        setShowMenu(false);
        window.location.href = `/user/${otherUser.username}`;
    };

    const handleSearchInChat = () => {
        setShowMenu(false);
        onOpenSearch();
    };

    const handleAudioSettings = () => {
        setShowMenu(false);
        if (onOpenAudioSettings) {
            onOpenAudioSettings();
        }
    };

    const handleDeleteChat = () => {
        setShowMenu(false);
        if (window.confirm('Сигурни ли сте, че искате да изтриете този разговор?')) {
            // Handle delete logic
        }
    };

    return (
        <div className="svmessenger-chat-header">
            {/* User Info */}
            <div className="svmessenger-chat-user-info">
                <div className="svmessenger-chat-avatar">
                    {otherUser.imageUrl ? (
                        <img src={otherUser.imageUrl} alt={otherUser.realName || otherUser.username} />
                    ) : (
                        <div className="svmessenger-chat-avatar-placeholder">
                            {(otherUser.realName || otherUser.username || 'U').charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="svmessenger-chat-user-details">
                    <div className="svmessenger-chat-username">
                        {otherUser.realName || otherUser.username}
                    </div>
                    <span className={`svmessenger-chat-status ${otherUser.isOnline ? 'online' : 'offline'}`}>
                        {otherUser.isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="svmessenger-chat-controls">
                {/* ✅ FIXED: Bootstrap Phone Icon */}
                <button
                    className="svmessenger-call-btn"
                    onClick={onCall}
                    title="Звънни"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        border: 'none',
                        background: 'none',
                        color: '#9ca3af',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        marginLeft: '8px'
                    }}
                >
                    <i className="bi bi-telephone" style={{
                        fontSize: '18px',
                        color: '#ffffff'
                    }}></i>
                </button>

                {/* Three-dot menu */}
                <div className="svmessenger-chat-menu-container" ref={menuRef}>
                    <button
                        className="svmessenger-chat-menu-btn"
                        onClick={() => setShowMenu(!showMenu)}
                        title="Повече опции"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showMenu && (
                        <div className="svmessenger-chat-menu-dropdown">
                            <button onClick={handleProfileView} className="svmessenger-menu-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                                Преглед на профила
                            </button>
                            <button onClick={handleSearchInChat} className="svmessenger-menu-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                                </svg>
                                Търси в разговора...
                            </button>
                            <button onClick={handleAudioSettings} className="svmessenger-menu-item">
                                <i className="bi bi-gear-fill" style={{ fontSize: '16px' }}></i>
                                Настройки
                            </button>
                            <button onClick={handleDeleteChat} className="svmessenger-menu-item svmessenger-menu-item-danger">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                </svg>
                                Изтрий разговора
                            </button>
                        </div>
                    )}
                </div>

                <button
                    className="svmessenger-chat-close"
                    onClick={onClose}
                    title="Затвори"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default SVChatHeader;