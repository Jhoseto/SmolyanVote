import React, { useState, useEffect } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import { formatDisplayName, getInitials } from '../utils/stringUtils';
import './UserSearch.css';

/**
 * Търсене на потребители за нови разговори
 */
function UserSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const { searchUsers, startConversation, openConversation } = useSVMessenger();
  
  // Search users when query changes
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      performSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);
  
  const performSearch = async (query) => {
    setIsSearching(true);
    try {
      const results = await searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleUserSelect = async (user) => {
    try {
      const conversation = await startConversation(user.id);
      openConversation(conversation.id);
      setIsOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };
  
  const toggleSearch = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };
  
  return (
    <div className={`user-search ${isOpen ? 'open' : ''}`}>
      {/* Search button */}
      <button 
        className="search-toggle-btn"
        onClick={toggleSearch}
        title="Търси потребители"
      >
        🔍
      </button>
      
      {/* Search panel */}
      {isOpen && (
        <div className="search-panel">
          <div className="search-header">
            <h3>Търси потребители</h3>
            <button 
              className="close-search-btn"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>
          
          <div className="search-input-container">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Въведете име или потребителско име..."
              className="search-input"
              autoFocus
            />
            {isSearching && (
              <div className="search-loading">
                <div className="spinner"></div>
              </div>
            )}
          </div>
          
          {/* Search results */}
          <div className="search-results">
            {searchResults.length > 0 ? (
              searchResults.map(user => (
                <div
                  key={user.id}
                  className="search-result-item"
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="result-avatar">
                    {user.imageUrl ? (
                      <img 
                        src={user.imageUrl} 
                        alt={formatDisplayName(user)}
                        className="avatar-image"
                      />
                    ) : (
                      <div className="avatar-initials">
                        {getInitials(formatDisplayName(user))}
                      </div>
                    )}
                    
                    {user.isOnline && (
                      <div className="online-indicator"></div>
                    )}
                  </div>
                  
                  <div className="result-info">
                    <h4 className="result-name">{formatDisplayName(user)}</h4>
                    <p className="result-username">@{user.username}</p>
                  </div>
                </div>
              ))
            ) : searchQuery.trim().length >= 2 && !isSearching ? (
              <div className="search-no-results">
                <p>Няма намерени потребители</p>
              </div>
            ) : searchQuery.trim().length < 2 ? (
              <div className="search-hint">
                <p>Въведете поне 2 символа за търсене</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default UserSearch;
