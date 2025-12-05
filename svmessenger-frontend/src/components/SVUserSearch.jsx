import React, { useState, useEffect, useCallback } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import { svMessengerAPI } from '../services/svMessengerAPI';
import { debounce } from '../utils/svHelpers';

/**
 * User Search компонент
 * Показва търсене на потребители за нови разговори
 * 
 * СТРУКТУРА:
 * - Search bar (горе)
 * - Search results panel (под search bar-а, само при търсене)
 * - Following users panel (долу, винаги видим)
 */
const SVUserSearch = ({ onClose }) => {
  const { startConversation, openChat } = useSVMessenger();
  const [searchQuery, setSearchQuery] = useState('');
  const [followingUsers, setFollowingUsers] = useState([]); // Следвани потребители (винаги видими)
  const [searchResults, setSearchResults] = useState([]); // Резултати от търсене (в отделен панел)
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(true); // Зареждане на следваните
  const [isSearching, setIsSearching] = useState(false); // Търсене в базата
  const [hasActiveSearch, setHasActiveSearch] = useState(false); // Дали има активно търсене

  // Зареждане на следваните потребители при първоначално отваряне
  useEffect(() => {
    const loadFollowingUsers = async () => {
      setIsLoadingFollowing(true);
      try {
        const results = await svMessengerAPI.searchFollowingUsers('');
        setFollowingUsers(results);
      } catch (error) {
        console.error('Error loading following users:', error);
        setFollowingUsers([]);
      } finally {
        setIsLoadingFollowing(false);
      }
    };

    loadFollowingUsers();
  }, []);

  // Търсене в цялата база данни в реално време
  const performDatabaseSearch = useCallback(async (query) => {
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery || trimmedQuery.length === 0) {
      // Ако query-то е празно, скриваме search results панела
      setHasActiveSearch(false);
      setSearchResults([]);
      return;
    }

    // Ако query-то е по-малко от 2 символа, не търсим
    if (trimmedQuery.length < 2) {
      setHasActiveSearch(false);
      setSearchResults([]);
      return;
    }

    setHasActiveSearch(true);
    setIsSearching(true);

    try {
      // Търси в цялата база данни
      const results = await svMessengerAPI.searchUsers(trimmedQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced търсене в базата данни
  const debouncedDatabaseSearch = useCallback(
    debounce((query) => {
      performDatabaseSearch(query);
    }, 300),
    [performDatabaseSearch]
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Ако има текст (2+ символа), търси в базата данни
    if (query.trim().length >= 2) {
      debouncedDatabaseSearch(query);
    } else {
      // Ако няма достатъчно текст, скриваме search results панела
      setHasActiveSearch(false);
      setSearchResults([]);
    }
  };

  // Handle user selection
  const handleUserSelect = useCallback(async (user) => {
    try {
      // Създаваме разговора
      const conversation = await startConversation(user.id);

      if (conversation && conversation.id) {
        // Отваряме чата с conversation обекта за да избегнем race condition
        openChat(conversation.id, conversation);

        // ✅ ВАЖНО: Затваряме панела след кратко забавяне
        // Това дава време на openChat да създаде прозореца преди панелът да изчезне
        setTimeout(() => {
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
          placeholder="Търси всички потребители..."
          value={searchQuery}
          onChange={handleSearchChange}
          autoFocus
        />
        {isSearching && (
          <div className="svmessenger-search-loading-indicator">
            <div className="svmessenger-spinner-small"></div>
          </div>
        )}
      </div>

      {/* Search Results Panel - ПОД search bar-а, само при активно търсене */}
      {hasActiveSearch && (
        <div className="svmessenger-search-results-panel">
          <div className="svmessenger-search-section-header">
            <span>Резултати от търсенето</span>
            {isSearching && <span className="svmessenger-search-count">Търсене...</span>}
            {!isSearching && searchResults.length > 0 && (
              <span className="svmessenger-search-count">{searchResults.length} резултата</span>
            )}
          </div>
          
          {isSearching ? (
            <div className="svmessenger-search-loading">
              <div className="svmessenger-spinner"></div>
              <span>Търсене...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="svmessenger-search-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <p>Няма намерени потребители</p>
            </div>
          ) : (
            <div className="svmessenger-search-list">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="svmessenger-search-user-item"
                  onClick={() => handleUserSelect(user)}
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
      )}

      {/* Following Users Panel - ДОЛУ, винаги видим */}
      <div className="svmessenger-following-users-panel">
        <div className="svmessenger-search-section-header">
          <span>Следвани потребители</span>
          {!isLoadingFollowing && followingUsers.length > 0 && (
            <span className="svmessenger-search-count">{followingUsers.length}</span>
          )}
        </div>

        {isLoadingFollowing ? (
          <div className="svmessenger-search-loading">
            <div className="svmessenger-spinner"></div>
            <span>Зареждане на следвани потребители...</span>
          </div>
        ) : followingUsers.length === 0 ? (
          <div className="svmessenger-search-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <p>Няма следвани потребители</p>
          </div>
        ) : (
          <div className="svmessenger-search-list">
            {followingUsers.map((user) => (
              <div
                key={user.id}
                className="svmessenger-search-user-item"
                onClick={() => handleUserSelect(user)}
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
