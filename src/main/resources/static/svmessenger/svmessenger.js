// ============================================
// SVMESSENGER - REACT APPLICATION
// ============================================

// Check if user is authenticated
if (!window.SVMESSENGER_USER_DATA || !window.SVMESSENGER_USER_DATA.isAuthenticated) {
    console.log('SVMessenger: User not authenticated, skipping initialization');
    // Exit early if user is not authenticated
} else {
    console.log('SVMessenger: Initializing for user:', window.SVMESSENGER_USER_DATA.username);
    
    // ============================================
    // REACT COMPONENTS (Simplified React-like implementation)
    // ============================================
    
    class SVMessengerApp {
        constructor() {
            this.state = {
                isOpen: false,
                conversations: [],
                currentConversation: null,
                messages: [],
                unreadCount: 0,
                isTyping: false,
                searchQuery: '',
                searchResults: [],
                showSearch: false,
                ws: null,
                isConnected: false
            };
            
            this.init();
        }
        
        init() {
            this.createWidget();
            this.setupWebSocket();
            this.loadConversations();
            this.setupEventListeners();
        }
        
        createWidget() {
            const root = document.getElementById('svmessenger-root');
            if (!root) return;
            
            root.innerHTML = `
                <div class="sv-messenger-widget">
                    <button class="sv-messenger-button" id="sv-messenger-toggle">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                        </svg>
                        <span class="sv-unread-badge" id="sv-unread-badge" style="display: none;">0</span>
                    </button>
                    
                    <div class="sv-messenger-window" id="sv-messenger-window">
                        <div class="sv-messenger-header">
                            <h3 class="sv-messenger-title" id="sv-messenger-title">SVMessenger</h3>
                            <div class="sv-messenger-actions">
                                <button class="sv-messenger-action-btn" id="sv-search-btn" title="Search">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                                    </svg>
                                </button>
                                <button class="sv-messenger-action-btn" id="sv-close-btn" title="Close">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <div class="sv-conversation-list" id="sv-conversation-list">
                            <div class="sv-conversation-item" id="sv-new-conversation">
                                <div class="sv-conversation-avatar">+</div>
                                <div class="sv-conversation-content">
                                    <div class="sv-conversation-name">Start New Conversation</div>
                                    <div class="sv-conversation-preview">Click to search for users</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="sv-chat-window" id="sv-chat-window" style="display: none;">
                            <div class="sv-chat-header">
                                <div class="sv-chat-avatar" id="sv-chat-avatar">U</div>
                                <div class="sv-chat-info">
                                    <h4 class="sv-chat-name" id="sv-chat-name">User</h4>
                                    <p class="sv-chat-status" id="sv-chat-status">Online</p>
                                </div>
                                <div class="sv-chat-actions">
                                    <button class="sv-chat-action-btn" id="sv-back-btn" title="Back">
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="sv-message-thread" id="sv-message-thread">
                                <div class="sv-message received">
                                    <div class="sv-message-avatar">U</div>
                                    <div class="sv-message-content">
                                        <p class="sv-message-text">Welcome to SVMessenger! Start a conversation.</p>
                                        <div class="sv-message-meta">
                                            <span class="sv-message-time">Just now</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="sv-message-input">
                                <div class="sv-input-container">
                                    <textarea 
                                        class="sv-message-textarea" 
                                        id="sv-message-textarea" 
                                        placeholder="Type a message..."
                                        rows="1"
                                    ></textarea>
                                    <div class="sv-input-actions">
                                        <button class="sv-input-action-btn" id="sv-emoji-btn" title="Emoji">
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                            </svg>
                                        </button>
                                        <button class="sv-send-btn" id="sv-send-btn" disabled>
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="sv-user-search" id="sv-user-search" style="display: none;">
                            <input 
                                type="text" 
                                class="sv-search-input" 
                                id="sv-search-input" 
                                placeholder="Search for users..."
                            >
                            <div class="sv-search-results" id="sv-search-results"></div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        setupEventListeners() {
            // Toggle messenger
            document.getElementById('sv-messenger-toggle').addEventListener('click', () => {
                this.toggleMessenger();
            });
            
            // Close messenger
            document.getElementById('sv-close-btn').addEventListener('click', () => {
                this.closeMessenger();
            });
            
            // Back to conversations
            document.getElementById('sv-back-btn').addEventListener('click', () => {
                this.showConversationList();
            });
            
            // New conversation
            document.getElementById('sv-new-conversation').addEventListener('click', () => {
                this.showUserSearch();
            });
            
            // Search toggle
            document.getElementById('sv-search-btn').addEventListener('click', () => {
                this.toggleSearch();
            });
            
            // Message input
            const textarea = document.getElementById('sv-message-textarea');
            const sendBtn = document.getElementById('sv-send-btn');
            
            textarea.addEventListener('input', (e) => {
                this.handleMessageInput(e);
            });
            
            textarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            sendBtn.addEventListener('click', () => {
                this.sendMessage();
            });
            
            // Search input
            document.getElementById('sv-search-input').addEventListener('input', (e) => {
                this.handleSearch(e);
            });
        }
        
        setupWebSocket() {
            try {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const host = window.location.host;
                const wsUrl = `${protocol}//${host}/ws-svmessenger`;
                
                console.log('SVMessenger: Connecting to WebSocket:', wsUrl);
                
                this.state.ws = new SockJS(wsUrl);
                
                this.state.ws.onopen = () => {
                    console.log('SVMessenger: WebSocket connected');
                    this.state.isConnected = true;
                };
                
                this.state.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleWebSocketMessage(data);
                    } catch (error) {
                        console.error('SVMessenger: Failed to parse WebSocket message:', error);
                    }
                };
                
                this.state.ws.onclose = () => {
                    console.log('SVMessenger: WebSocket disconnected, reconnecting in 5s...');
                    this.state.isConnected = false;
                    setTimeout(() => this.setupWebSocket(), 5000);
                };
                
                this.state.ws.onerror = (error) => {
                    console.error('SVMessenger: WebSocket error:', error);
                };
                
            } catch (error) {
                console.error('SVMessenger: Failed to setup WebSocket:', error);
            }
        }
        
        handleWebSocketMessage(data) {
            console.log('SVMessenger: Received WebSocket message:', data);
            
            switch (data.type) {
                case 'NEW_MESSAGE':
                    this.handleNewMessage(data.data);
                    break;
                case 'TYPING_STATUS':
                    this.handleTypingStatus(data.data);
                    break;
                case 'READ_RECEIPT':
                    this.handleReadReceipt(data.data);
                    break;
                case 'ONLINE_STATUS':
                    this.handleOnlineStatus(data.data);
                    break;
                default:
                    console.log('SVMessenger: Unknown message type:', data.type);
            }
        }
        
        handleNewMessage(message) {
            if (this.state.currentConversation && 
                message.conversationId === this.state.currentConversation.id) {
                this.addMessageToThread(message);
            }
            
            // Update conversation list
            this.loadConversations();
        }
        
        handleTypingStatus(data) {
            // Update typing indicator
            if (this.state.currentConversation && 
                data.conversationId === this.state.currentConversation.id) {
                this.updateTypingIndicator(data.isTyping);
            }
        }
        
        handleReadReceipt(data) {
            // Update message status
            console.log('SVMessenger: Read receipt received:', data);
        }
        
        handleOnlineStatus(data) {
            // Update online status
            console.log('SVMessenger: Online status update:', data);
        }
        
        toggleMessenger() {
            this.state.isOpen = !this.state.isOpen;
            const window = document.getElementById('sv-messenger-window');
            
            if (this.state.isOpen) {
                window.classList.add('open');
                this.loadConversations();
            } else {
                window.classList.remove('open');
            }
        }
        
        closeMessenger() {
            this.state.isOpen = false;
            document.getElementById('sv-messenger-window').classList.remove('open');
        }
        
        showConversationList() {
            document.getElementById('sv-conversation-list').style.display = 'block';
            document.getElementById('sv-chat-window').style.display = 'none';
            document.getElementById('sv-user-search').style.display = 'none';
            document.getElementById('sv-messenger-title').textContent = 'SVMessenger';
        }
        
        showUserSearch() {
            document.getElementById('sv-conversation-list').style.display = 'none';
            document.getElementById('sv-chat-window').style.display = 'none';
            document.getElementById('sv-user-search').style.display = 'block';
            document.getElementById('sv-messenger-title').textContent = 'Search Users';
        }
        
        toggleSearch() {
            // Toggle search functionality
            console.log('SVMessenger: Search toggled');
        }
        
        async loadConversations() {
            try {
                const response = await fetch('/api/svmessenger/conversations', {
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const conversations = await response.json();
                    this.state.conversations = conversations;
                    this.renderConversations();
                    this.updateUnreadCount();
                } else {
                    console.error('SVMessenger: Failed to load conversations');
                }
            } catch (error) {
                console.error('SVMessenger: Error loading conversations:', error);
            }
        }
        
        renderConversations() {
            const container = document.getElementById('sv-conversation-list');
            const newConvItem = document.getElementById('sv-new-conversation');
            
            // Clear existing conversations (except new conversation item)
            const existingConversations = container.querySelectorAll('.sv-conversation-item:not(#sv-new-conversation)');
            existingConversations.forEach(item => item.remove());
            
            // Add conversations
            this.state.conversations.forEach(conv => {
                const item = this.createConversationItem(conv);
                container.insertBefore(item, newConvItem);
            });
        }
        
        createConversationItem(conversation) {
            const item = document.createElement('div');
            item.className = 'sv-conversation-item';
            item.dataset.conversationId = conversation.id;
            
            const avatar = conversation.otherUser.imageUrl ? 
                `<img src="${conversation.otherUser.imageUrl}" alt="${conversation.otherUser.username}">` :
                conversation.otherUser.username.charAt(0).toUpperCase();
            
            const onlineIndicator = conversation.otherUser.isOnline ? 
                '<div class="sv-online-indicator"></div>' : '';
            
            item.innerHTML = `
                <div class="sv-conversation-avatar">
                    ${avatar}
                    ${onlineIndicator}
                </div>
                <div class="sv-conversation-content">
                    <div class="sv-conversation-name">${conversation.otherUser.username}</div>
                    <div class="sv-conversation-preview">${conversation.lastMessage || 'No messages yet'}</div>
                </div>
                <div class="sv-conversation-meta">
                    <div class="sv-conversation-time">${this.formatTime(conversation.lastMessageTime)}</div>
                    ${conversation.unreadCount > 0 ? 
                        `<div class="sv-conversation-unread">${conversation.unreadCount}</div>` : 
                        ''
                    }
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.openConversation(conversation);
            });
            
            return item;
        }
        
        async openConversation(conversation) {
            this.state.currentConversation = conversation;
            
            // Update UI
            document.getElementById('sv-conversation-list').style.display = 'none';
            document.getElementById('sv-chat-window').style.display = 'flex';
            document.getElementById('sv-user-search').style.display = 'none';
            
            // Update chat header
            document.getElementById('sv-chat-name').textContent = conversation.otherUser.username;
            document.getElementById('sv-chat-status').textContent = conversation.otherUser.isOnline ? 'Online' : 'Offline';
            
            const avatar = conversation.otherUser.imageUrl ? 
                `<img src="${conversation.otherUser.imageUrl}" alt="${conversation.otherUser.username}">` :
                conversation.otherUser.username.charAt(0).toUpperCase();
            document.getElementById('sv-chat-avatar').innerHTML = avatar;
            
            // Load messages
            await this.loadMessages(conversation.id);
            
            // Mark as read
            this.markConversationAsRead(conversation.id);
        }
        
        async loadMessages(conversationId) {
            try {
                const response = await fetch(`/api/svmessenger/messages/${conversationId}?page=0&size=50`, {
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.state.messages = data.content || [];
                    this.renderMessages();
                } else {
                    console.error('SVMessenger: Failed to load messages');
                }
            } catch (error) {
                console.error('SVMessenger: Error loading messages:', error);
            }
        }
        
        renderMessages() {
            const container = document.getElementById('sv-message-thread');
            container.innerHTML = '';
            
            this.state.messages.forEach(message => {
                const messageEl = this.createMessageElement(message);
                container.appendChild(messageEl);
            });
            
            // Scroll to bottom
            container.scrollTop = container.scrollHeight;
        }
        
        createMessageElement(message) {
            const isSent = message.senderId === window.SVMESSENGER_USER_DATA.id;
            const messageEl = document.createElement('div');
            messageEl.className = `sv-message ${isSent ? 'sent' : 'received'}`;
            
            const avatar = isSent ? 
                window.SVMESSENGER_USER_DATA.username.charAt(0).toUpperCase() :
                (this.state.currentConversation?.otherUser.username.charAt(0).toUpperCase() || 'U');
            
            messageEl.innerHTML = `
                <div class="sv-message-avatar">${avatar}</div>
                <div class="sv-message-content">
                    <p class="sv-message-text">${this.escapeHtml(message.text)}</p>
                    <div class="sv-message-meta">
                        <span class="sv-message-time">${this.formatTime(message.sentAt)}</span>
                        ${isSent ? `
                            <div class="sv-message-status ${message.isRead ? 'read' : 'delivered'}">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                </svg>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            return messageEl;
        }
        
        addMessageToThread(message) {
            const container = document.getElementById('sv-message-thread');
            const messageEl = this.createMessageElement(message);
            container.appendChild(messageEl);
            
            // Scroll to bottom
            container.scrollTop = container.scrollHeight;
        }
        
        handleMessageInput(e) {
            const textarea = e.target;
            const sendBtn = document.getElementById('sv-send-btn');
            
            // Auto-resize textarea
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
            
            // Enable/disable send button
            sendBtn.disabled = !textarea.value.trim();
            
            // Send typing status
            this.sendTypingStatus(true);
        }
        
        async sendMessage() {
            const textarea = document.getElementById('sv-message-textarea');
            const message = textarea.value.trim();
            
            if (!message || !this.state.currentConversation) return;
            
            try {
                const response = await fetch('/api/svmessenger/messages/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        conversationId: this.state.currentConversation.id,
                        text: message,
                        messageType: 'TEXT'
                    })
                });
                
                if (response.ok) {
                    const newMessage = await response.json();
                    this.addMessageToThread(newMessage);
                    textarea.value = '';
                    textarea.style.height = 'auto';
                    document.getElementById('sv-send-btn').disabled = true;
                    
                    // Send typing status
                    this.sendTypingStatus(false);
                } else {
                    console.error('SVMessenger: Failed to send message');
                }
            } catch (error) {
                console.error('SVMessenger: Error sending message:', error);
            }
        }
        
        sendTypingStatus(isTyping) {
            if (!this.state.ws || !this.state.isConnected || !this.state.currentConversation) return;
            
            try {
                this.state.ws.send(JSON.stringify({
                    type: 'TYPING_STATUS',
                    data: {
                        conversationId: this.state.currentConversation.id,
                        isTyping: isTyping
                    }
                }));
            } catch (error) {
                console.error('SVMessenger: Error sending typing status:', error);
            }
        }
        
        updateTypingIndicator(isTyping) {
            // Update typing indicator in UI
            console.log('SVMessenger: Typing indicator:', isTyping);
        }
        
        async markConversationAsRead(conversationId) {
            try {
                await fetch(`/api/svmessenger/conversations/${conversationId}/read`, {
                    method: 'PUT',
                    credentials: 'include'
                });
                
                // Update local state
                this.loadConversations();
            } catch (error) {
                console.error('SVMessenger: Error marking conversation as read:', error);
            }
        }
        
        async handleSearch(e) {
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                document.getElementById('sv-search-results').innerHTML = '';
                return;
            }
            
            try {
                const response = await fetch(`/api/svmessenger/users/search?query=${encodeURIComponent(query)}`, {
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const users = await response.json();
                    this.renderSearchResults(users);
                } else {
                    console.error('SVMessenger: Failed to search users');
                }
            } catch (error) {
                console.error('SVMessenger: Error searching users:', error);
            }
        }
        
        renderSearchResults(users) {
            const container = document.getElementById('sv-search-results');
            container.innerHTML = '';
            
            users.forEach(user => {
                const item = document.createElement('div');
                item.className = 'sv-search-result';
                item.innerHTML = `
                    <div class="sv-conversation-avatar">
                        ${user.imageUrl ? 
                            `<img src="${user.imageUrl}" alt="${user.username}">` :
                            user.username.charAt(0).toUpperCase()
                        }
                    </div>
                    <div class="sv-conversation-content">
                        <div class="sv-conversation-name">${user.username}</div>
                        <div class="sv-conversation-preview">${user.fullName || user.username}</div>
                    </div>
                `;
                
                item.addEventListener('click', () => {
                    this.startConversation(user);
                });
                
                container.appendChild(item);
            });
        }
        
        async startConversation(user) {
            try {
                const response = await fetch('/api/svmessenger/conversations/start', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        otherUserId: user.id
                    })
                });
                
                if (response.ok) {
                    const conversation = await response.json();
                    this.openConversation(conversation);
                    this.showConversationList();
                } else {
                    console.error('SVMessenger: Failed to start conversation');
                }
            } catch (error) {
                console.error('SVMessenger: Error starting conversation:', error);
            }
        }
        
        updateUnreadCount() {
            const totalUnread = this.state.conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
            this.state.unreadCount = totalUnread;
            
            const badge = document.getElementById('sv-unread-badge');
            if (totalUnread > 0) {
                badge.textContent = totalUnread > 99 ? '99+' : totalUnread;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
        
        formatTime(timestamp) {
            if (!timestamp) return '';
            
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now - date;
            
            if (diff < 60000) { // Less than 1 minute
                return 'Just now';
            } else if (diff < 3600000) { // Less than 1 hour
                return Math.floor(diff / 60000) + 'm ago';
            } else if (diff < 86400000) { // Less than 1 day
                return Math.floor(diff / 3600000) + 'h ago';
            } else {
                return date.toLocaleDateString();
            }
        }
        
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }
    
    // Initialize the app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new SVMessengerApp();
        });
    } else {
        new SVMessengerApp();
    }
}
