import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import SVChatHeader from './SVChatHeader';
import SVMessageThread from './SVMessageThread';
import SVMessageInput from './SVMessageInput';
import { svMessengerAPI } from '../services/svMessengerAPI';

// Search component that appears below header
const SVChatSearch = ({ searchQuery, onSearchChange, onClose }) => {
    return (
        <div className="svmessenger-chat-search">
            <input
                type="text"
                className="svmessenger-chat-search-input"
                placeholder="Търси в разговора..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                autoFocus
            />
            <button
                className="svmessenger-chat-search-close"
                onClick={onClose}
                title="Затвори търсенето"
            >
                ✕
            </button>
        </div>
    );
};

const SVChatWindow = ({ chat }) => {
    const { closeChat, minimizeChat, bringToFront, updateChatPosition, markAsRead, messagesByConversation, currentUser, startCall, openAudioSettings } = useSVMessenger();
    const chatWindowRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Search state
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Translation State
    const [isTranslationEnabled, setIsTranslationEnabled] = useState(false);
    const [targetLanguage, setTargetLanguage] = useState('bg');
    const [showTranslationSettings, setShowTranslationSettings] = useState(false);
    const [translatedMessages, setTranslatedMessages] = useState({});

    const LANGUAGES = [
        { code: 'bg', name: 'Български' },
        { code: 'en', name: 'English' },
        { code: 'de', name: 'Deutsch' },
        { code: 'el', name: 'Ελληνικά' },
        { code: 'tr', name: 'Türkçe' },
    ];

    // Load Translation Settings
    useEffect(() => {
        const loadSettings = () => {
            try {
                const saved = localStorage.getItem(`translation_settings_${chat.conversation.id}`);
                if (saved) {
                    const { enabled, language } = JSON.parse(saved);
                    setIsTranslationEnabled(enabled);
                    if (language) setTargetLanguage(language);
                }
            } catch (error) {
                console.error("Failed to load translation settings", error);
            }
        };
        loadSettings();
    }, [chat.conversation.id]);

    // Save Settings Helper
    const saveSettings = (enabled, language) => {
        try {
            localStorage.setItem(`translation_settings_${chat.conversation.id}`, JSON.stringify({
                enabled,
                language
            }));
        } catch (error) {
            console.error("Failed to save settings", error);
        }
    };

    // Translation Logic
    useEffect(() => {
        const performTranslation = async () => {
            if (!isTranslationEnabled) return;

            const messages = messagesByConversation[chat.conversation.id] || [];
            // Filter messages: from other user, has text, not translated yet
            const toTranslate = messages.filter(m =>
                m.senderId !== currentUser.id &&
                m.text &&
                !translatedMessages[`${m.id}_${targetLanguage}`]
            );

            for (const msg of toTranslate) {
                try {
                    const cacheKey = `${msg.id}_${targetLanguage}`;
                    // Double check
                    if (translatedMessages[cacheKey]) continue;

                    const response = await svMessengerAPI.translateMessage(msg.text, targetLanguage);
                    if (response && response.translated) {
                        const translated = response.translated;
                        setTranslatedMessages(prev => ({
                            ...prev,
                            [cacheKey]: translated,
                            [msg.id]: translated // Simplify access
                        }));
                    }
                } catch (e) {
                    console.error("Translation failed for msg", msg.id, e);
                }
            }
        };

        // Simple debounce/delay
        const timeout = setTimeout(performTranslation, 500);
        return () => clearTimeout(timeout);
    }, [messagesByConversation, chat.conversation.id, isTranslationEnabled, targetLanguage, translatedMessages]);

    const handleOpenTranslationSettings = () => {
        setShowTranslationSettings(true);
    };

    const toggleTranslation = (e) => {
        const newValue = e.target.checked;
        setIsTranslationEnabled(newValue);
        saveSettings(newValue, targetLanguage);
    };

    const changeLanguage = (code) => {
        setTargetLanguage(code);
        saveSettings(isTranslationEnabled, code);
    };

    useEffect(() => {
        if (!chat.isMinimized) {
            bringToFront(chat.conversation.id);
        }
    }, []);

    // При click в chat window - маркирай като прочетено ако има непрочетени съобщения
    const handleWindowClick = useCallback(() => {
        if (!chat.isMinimized) {
            bringToFront(chat.conversation.id);

            // Провери дали има непрочетени съобщения и ги маркирай като прочетено
            const messages = messagesByConversation[chat.conversation.id] || [];
            const hasUnreadMessages = messages.some(m => m.senderId !== currentUser.id && !m.isRead);

            if (hasUnreadMessages) {
                markAsRead(chat.conversation.id);
            }
        }
    }, [chat.conversation.id, chat.isMinimized, bringToFront, markAsRead, messagesByConversation, currentUser]);

    const handleCall = () => {
        startCall(chat.conversation.id, chat.conversation.otherUser.id, chat.conversation);
    };

    const handleOpenAudioSettings = () => {
        // Open device selector for audio settings configuration
        console.log('🎵 Opening audio settings from chat menu');
        openAudioSettings();
    };

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

    const handleOpenSearch = () => {
        setIsSearchOpen(true);
    };

    const handleCloseSearch = () => {
        setIsSearchOpen(false);
        setSearchQuery('');
    };

    const handleSearchChange = (query) => {
        setSearchQuery(query);
    };

    // FIX 2: Style с display control вместо return null
    const windowStyle = {
        left: `${chat.position.x}px`,
        top: `${chat.position.y}px`,
        zIndex: chat.zIndex,
        display: chat.isMinimized ? 'none' : 'flex'
    };

    // FIX 1 & 2: Винаги render, само скрий с CSS
    return (
        <div
            ref={chatWindowRef}
            className={`svmessenger-chat-window ${isDragging ? 'dragging' : ''}`}
            style={windowStyle}
            onMouseDown={handleMouseDown}
            onClick={handleWindowClick}
        >
            <SVChatHeader
                conversation={chat.conversation}
                onClose={handleClose}
                onMinimize={handleMinimize}
                onOpenSearch={handleOpenSearch}
                onCall={handleCall}
                onOpenAudioSettings={handleOpenAudioSettings}
                onOpenTranslationSettings={handleOpenTranslationSettings}
            />

            {/* Search field appears below header */}
            {isSearchOpen && (
                <SVChatSearch
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    onClose={handleCloseSearch}
                />
            )}

            {/* Translation Settings Modal */}
            {showTranslationSettings && (
                <div className="svmessenger-modal-overlay">
                    <div className="svmessenger-modal-content" style={{ maxWidth: '300px' }}>
                        <div className="svmessenger-modal-header">
                            <h3>Настройки за превод</h3>
                            <button onClick={() => setShowTranslationSettings(false)}>✕</button>
                        </div>
                        <div className="svmessenger-modal-body">
                            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ fontWeight: '500' }}>Автоматичен превод</label>
                                <label className="svmessenger-switch">
                                    <input
                                        type="checkbox"
                                        checked={isTranslationEnabled}
                                        onChange={toggleTranslation}
                                    />
                                    <span className="svmessenger-slider round"></span>
                                </label>
                            </div>

                            {isTranslationEnabled && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: '#666' }}>Език на превода:</label>
                                    <select
                                        value={targetLanguage}
                                        onChange={(e) => changeLanguage(e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                    >
                                        {LANGUAGES.map(lang => (
                                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <SVMessageThread
                conversationId={chat.conversation.id}
                searchQuery={searchQuery}
                translatedMessages={isTranslationEnabled ? translatedMessages : {}}
            />

            <SVMessageInput conversationId={chat.conversation.id} />
        </div>
    );
};

export default SVChatWindow;
