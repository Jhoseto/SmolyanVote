import React, { useState, useRef, useEffect } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import { formatMessageTimeOnly } from '../utils/svDateFormatter';
import { linkifyText, isOnlyEmoji } from '../utils/svHelpers';
import { svMessengerAPI } from '../services/svMessengerAPI';

/**
 * Single Message Item компонент
 * Показва едно съобщение в thread-а с click-to-translate функционалност
 */
const SVMessageItem = ({ message, searchQuery = '' }) => {
    const { currentUser } = useSVMessenger();
    const [showTranslateMenu, setShowTranslateMenu] = useState(false);
    const [translatedText, setTranslatedText] = useState(message.translatedText || null);
    const [translatingTo, setTranslatingTo] = useState(null);
    const menuRef = useRef(null);

    const LANGUAGES = [
        { code: 'bg', name: 'Български' },
        { code: 'en', name: 'English' },
        { code: 'de', name: 'Deutsch' },
        { code: 'el', name: 'Ελληνικά' },
        { code: 'tr', name: 'Türkçe' },
    ];

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowTranslateMenu(false);
            }
        };

        if (showTranslateMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showTranslateMenu]);

    // Защита срещу невалидни съобщения
    if (!message || !message.id || !message.text) {
        console.warn('SVMessageItem: Invalid message received', message);
        return null;
    }

    // Защита срещу липсващ currentUser
    if (!currentUser || !currentUser.id) {
        return null;
    }

    const isOwnMessage = message.senderId === currentUser.id;
    const isEmojiOnly = isOnlyEmoji(message.text);

    // Handle message click to show translate menu
    const handleMessageClick = (e) => {
        // Only show translate menu for received messages (not own messages)
        if (!isOwnMessage && message.text && message.text.length > 0) {
            setShowTranslateMenu(!showTranslateMenu);
            e.stopPropagation();
        }
    };

    // Handle translation
    const handleTranslate = async (languageCode) => {
        setShowTranslateMenu(false);
        setTranslatingTo(languageCode);

        try {
            const response = await svMessengerAPI.translateAndSaveMessage(message.id, languageCode);
            if (response && response.translatedText) {
                setTranslatedText(response.translatedText);
            }
        } catch (error) {
            console.error('Translation failed:', error);
        } finally {
            setTranslatingTo(null);
        }
    };

    // Highlight search query in message text
    const highlightSearchText = (text, query) => {
        if (!query.trim()) return linkifyText(text);

        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})`, 'gi');
        const highlightedText = text.replace(regex, '<mark class="search-highlight">$1</mark>');
        return linkifyText(highlightedText);
    };

    // Функция за рендериране на правилните лястовици
    const renderCheckmarks = () => {
        if (!isOwnMessage) return null;

        if (!message.isDelivered) {
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="single-check">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
            );
        }

        if (message.isDelivered && !message.isRead) {
            return (
                <svg width="18" height="14" viewBox="0 0 32 24" fill="currentColor" className="double-check-gray">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    <path d="M17 16.17L12.83 12l-1.42 1.41L17 19 29 7l-1.41-1.41z" />
                </svg>
            );
        }

        if (message.isDelivered && message.isRead) {
            return (
                <svg width="18" height="14" viewBox="0 0 32 24" fill="currentColor" className="double-check-green">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    <path d="M17 16.17L12.83 12l-1.42 1.41L17 19 29 7l-1.41-1.41z" />
                </svg>
            );
        }

        return null;
    };

    return (
        <div className={`svmessenger-message-item ${isOwnMessage ? 'own' : 'other'}`}>
            {/* Avatar (only for other messages) */}
            {!isOwnMessage && (
                <div className="svmessenger-message-avatar">
                    <img
                        src={message.senderImageUrl || '/images/default-avatar.png'}
                        alt={message.senderUsername}
                        onError={(e) => {
                            e.target.src = '/images/default-avatar.png';
                        }}
                    />
                </div>
            )}

            {/* Message Content */}
            <div className="svmessenger-message-content">
                {/* Message Bubble */}
                <div
                    className={`svmessenger-message-bubble ${isEmojiOnly ? 'emoji-only' : ''}`}
                    onClick={handleMessageClick}
                    style={{ cursor: 'pointer', position: 'relative' }}
                >
                    <div
                        className="svmessenger-message-text"
                        dangerouslySetInnerHTML={{
                            __html: translatedText
                                ? highlightSearchText(translatedText, searchQuery)
                                : highlightSearchText(message.text, searchQuery)
                        }}
                    />

                    {/* Translation loading indicator */}
                    {translatingTo && (
                        <div style={{
                            fontSize: '0.75em',
                            color: '#9ca3af',
                            marginTop: '4px',
                            fontStyle: 'italic'
                        }}>
                            Превежда се...
                        </div>
                    )}

                    {/* Translate Menu */}
                    {showTranslateMenu && (
                        <div
                            ref={menuRef}
                            className="svmessenger-translate-menu"
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: isOwnMessage ? 'auto' : '0',
                                right: isOwnMessage ? '0' : 'auto',
                                marginTop: '4px',
                                background: '#ffffff',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                zIndex: 1000,
                                minWidth: '150px',
                                overflow: 'hidden'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{
                                padding: '8px 12px',
                                fontSize: '0.75em',
                                color: '#6b7280',
                                borderBottom: '1px solid #e5e7eb',
                                fontWeight: '500'
                            }}>
                                🌐 Превод
                            </div>
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleTranslate(lang.code)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: 'none',
                                        background: 'transparent',
                                        textAlign: 'left',
                                        fontSize: '0.9em',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        color: '#374151'
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                >
                                    {lang.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Message Time and Status */}
                <div className="svmessenger-message-meta">
                    <span className="svmessenger-message-time-only">
                        {new Date(message.sentAt).toLocaleDateString('bg-BG', {
                            day: '2-digit',
                            month: '2-digit',
                        })}{' '}
                        {formatMessageTimeOnly(message.sentAt)}
                    </span>

                    {/* Checkmarks за own messages */}
                    {isOwnMessage && (
                        <div className="svmessenger-message-read-status">
                            {renderCheckmarks()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SVMessageItem;