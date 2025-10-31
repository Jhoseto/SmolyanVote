import React, { useState, useEffect, useCallback } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import { svMessengerAPI } from '../services/svMessengerAPI';
import { debounce } from '../utils/svHelpers';

/**
 * User Search компонент
 * Показва търсене на потребители за нови разговори
 */
const SVUserSearch = ({ onClose }) => {
  const { startConversation, openChat } = useSVMessenger();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search function
  const debouncedSearch = debounce(async (query) => {
    setIsSearching(true);
    setHasSearched(true);

    try {
      const results = await svMessengerAPI.searchFollowingUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 300);

  // Load all users when component mounts
  useEffect(() => {
    debouncedSearch('');
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Handle user selection - по същия начин като SVConversationItem
    const handleUserSelect = useCallback(async (user) => {
        try {
            console.log('SVUserSearch: Starting conversation with user', user.id);

            // Създаваме разговора
            const conversation = await startConversation(user.id);
            console.log('SVUserSearch: Got conversation', conversation);

            if (conversation && conversation.id) {
                console.log('SVUserSearch: Opening chat with conversation ID', conversation.id);

                // Отваряме чата с conversation обекта за да избегнем race condition
                openChat(conversation.id, conversation);

                // ✅ ВАЖНО: Затваряме панела след кратко забавяне
                // Това дава време на openChat да създаде прозореца преди панелът да изчезне
                setTimeout(() => {
                    console.log('SVUserSearch: Closing modal after chat opened');
                    onClose();
                }, 100);
            } else {
                console.error('SVUserSearch: No conversation returned from startConversation');
            }
        } catch (error) {
            console.error('SVUserSearch: Failed to start conversation:', error);
        }
    }, [startConversation, openChat, onClose]);

  return (
    <div className="svmessenger-user-search">
      {/* Header */}
      <div className="svmessenger-conversation-header">
        <h3>Нов разговор</h3>
        <button
          className="svmessenger-close-btn"
          onClick={onClose}
          title="Затвори"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      {/* Search Input */}
      <div className="svmessenger-search-input">
        <input
          type="text"
          placeholder="Търси потребители..."
          value={searchQuery}
          onChange={handleSearchChange}
          autoFocus
        />
      </div>

      {/* Search Results */}
      <div className="svmessenger-search-results">
        {!hasSearched ? (
          <div className="svmessenger-search-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <p>Зареждане на следвани потребители...</p>
          </div>
        ) : isSearching ? (
          <div className="svmessenger-search-loading">
            <div className="svmessenger-spinner"></div>
            <span>Търсене...</span>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="svmessenger-search-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <p>Няма намерени следвани потребители</p>
          </div>
        ) : (
          <div className="svmessenger-search-list">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="svmessenger-search-user-item"
                onClick={() => {
                  console.log('SVUserSearch: onClick fired for user', user.id);
                  handleUserSelect(user);
                }}
              >
                <div className="svmessenger-search-user-avatar">
                  <img 
                    src={user.imageUrl || '/images/default-avatar.png'} 
                    alt={user.username}
                    onError={(e) => {
                      e.target.src = '/images/default-avatar.png';
                    }}
                  />
                  {user.isOnline && (
                    <div className="svmessenger-online-indicator"></div>
                  )}
                </div>
                
                <div className="svmessenger-search-user-info">
                  <h4 className="svmessenger-search-user-name">
                    {user.realName || user.username}
                  </h4>
                  <p className="svmessenger-search-user-username">
                    @{user.username}
                  </p>
                </div>
                
                <div className="svmessenger-search-user-action">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SVUserSearch;
