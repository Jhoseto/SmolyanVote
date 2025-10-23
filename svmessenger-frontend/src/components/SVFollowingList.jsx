import React, { useState, useEffect, useCallback } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import { svMessengerAPI } from '../services/svMessengerAPI';
import { debounce } from '../utils/svHelpers';

/**
 * Following List компонент
 * Показва хората които current user следва
 */
const SVFollowingList = ({ onClose, onSearchClick }) => {
  const { startConversation } = useSVMessenger();
  const [followingUsers, setFollowingUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Load following users on mount
  useEffect(() => {
    loadFollowingUsers();
  }, []);

  // Load following users
  const loadFollowingUsers = async () => {
    setIsLoading(true);
    try {
      // Get only following users
      const users = await svMessengerAPI.searchFollowingUsers(''); // Empty string to get all following users
      setFollowingUsers(users);
    } catch (error) {
      console.error('Failed to load following users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      setIsSearching(true);
      try {
        const users = await svMessengerAPI.searchFollowingUsers(query);
        setFollowingUsers(users);
      } catch (error) {
        console.error('Search error:', error);
        setFollowingUsers([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Use followingUsers directly since backend does the filtering
  const filteredUsers = followingUsers;

  // Handle user selection
  const handleUserSelect = async (user) => {
    try {
      await startConversation(user.id);
      // Don't close immediately - let the chat open first
      setTimeout(() => onClose(), 100);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      alert('Грешка при стартиране на разговор. Моля опитайте отново.');
    }
  };

  return (
    <div className="svmessenger-conversation-list">
      {/* Header */}
      <div className="svmessenger-conversation-header">
        <h3>Нов разговор</h3>
        <div className="svmessenger-conversation-actions">
          <button 
            className="svmessenger-search-btn"
            onClick={onSearchClick}
            title="Търси всички потребители"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </button>
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
      </div>

      {/* Search Input */}
      <div className="svmessenger-search-input">
        <input
          type="text"
          placeholder="Търси потребители..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* Following Users List */}
      <div className="svmessenger-conversations">
        {isLoading || isSearching ? (
          <div className="svmessenger-loading">
            <div className="svmessenger-spinner"></div>
            <span>{isSearching ? 'Търсене...' : 'Зареждане...'}</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="svmessenger-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <p>Няма намерени следвани потребители</p>
          </div>
        ) : (
          <div className="svmessenger-search-list">
            {filteredUsers.map((user) => (
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

export default SVFollowingList;
