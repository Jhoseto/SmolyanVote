import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { svMessengerService } from '../services/svMessengerService';
import { useWebSocket } from '../hooks/useWebSocket';

// Initial state
const initialState = {
  // UI State
  isOpen: false,
  activeConversationId: null,
  isTyping: false,
  isLoading: false,
  
  // Data
  conversations: [],
  messages: {},
  users: {},
  typingStatus: {},
  
  // User info
  currentUser: null,
  
  // Error handling
  error: null
};

// Action types
const ActionTypes = {
  // UI Actions
  TOGGLE_WIDGET: 'TOGGLE_WIDGET',
  OPEN_CONVERSATION: 'OPEN_CONVERSATION',
  CLOSE_CONVERSATION: 'CLOSE_CONVERSATION',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Data Actions
  SET_CONVERSATIONS: 'SET_CONVERSATIONS',
  ADD_CONVERSATION: 'ADD_CONVERSATION',
  UPDATE_CONVERSATION: 'UPDATE_CONVERSATION',
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
  SET_USERS: 'SET_USERS',
  ADD_USER: 'ADD_USER',
  
  // Typing Actions
  SET_TYPING: 'SET_TYPING',
  CLEAR_TYPING: 'CLEAR_TYPING',
  
  // User Actions
  SET_CURRENT_USER: 'SET_CURRENT_USER'
};

// Reducer
function svMessengerReducer(state, action) {
  switch (action.type) {
    case ActionTypes.TOGGLE_WIDGET:
      return {
        ...state,
        isOpen: !state.isOpen,
        error: null
      };
      
    case ActionTypes.OPEN_CONVERSATION:
      return {
        ...state,
        activeConversationId: action.payload.conversationId,
        error: null
      };
      
    case ActionTypes.CLOSE_CONVERSATION:
      return {
        ...state,
        activeConversationId: null
      };
      
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
      
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
      
    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
      
    case ActionTypes.SET_CONVERSATIONS:
      return {
        ...state,
        conversations: action.payload,
        isLoading: false
      };
      
    case ActionTypes.ADD_CONVERSATION:
      return {
        ...state,
        conversations: [action.payload, ...state.conversations]
      };
      
    case ActionTypes.UPDATE_CONVERSATION:
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.id ? { ...conv, ...action.payload } : conv
        )
      };
      
    case ActionTypes.SET_MESSAGES:
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: action.payload.messages
        }
      };
      
    case ActionTypes.ADD_MESSAGE:
      const { conversationId, message } = action.payload;
      return {
        ...state,
        messages: {
          ...state.messages,
          [conversationId]: [
            ...(state.messages[conversationId] || []),
            message
          ]
        }
      };
      
    case ActionTypes.UPDATE_MESSAGE:
      const { conversationId: convId, messageId, updates } = action.payload;
      return {
        ...state,
        messages: {
          ...state.messages,
          [convId]: state.messages[convId]?.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ) || []
        }
      };
      
    case ActionTypes.SET_USERS:
      return {
        ...state,
        users: action.payload
      };
      
    case ActionTypes.ADD_USER:
      return {
        ...state,
        users: {
          ...state.users,
          [action.payload.id]: action.payload
        }
      };
      
    case ActionTypes.SET_TYPING:
      return {
        ...state,
        typingStatus: {
          ...state.typingStatus,
          [action.payload.conversationId]: {
            ...state.typingStatus[action.payload.conversationId],
            [action.payload.userId]: action.payload.isTyping
          }
        }
      };
      
    case ActionTypes.CLEAR_TYPING:
      const { conversationId: clearConvId, userId: clearUserId } = action.payload;
      const newTypingStatus = { ...state.typingStatus };
      if (newTypingStatus[clearConvId]) {
        delete newTypingStatus[clearConvId][clearUserId];
      }
      return {
        ...state,
        typingStatus: newTypingStatus
      };
      
    case ActionTypes.SET_CURRENT_USER:
      return {
        ...state,
        currentUser: action.payload
      };
      
    default:
      return state;
  }
}

// Context
const SVMessengerContext = createContext();

// Provider component
export function SVMessengerProvider({ children, userData }) {
  const [state, dispatch] = useReducer(svMessengerReducer, initialState);
  
  // Initialize current user
  useEffect(() => {
    if (userData && userData.isAuthenticated) {
      dispatch({
        type: ActionTypes.SET_CURRENT_USER,
        payload: userData
      });
    }
  }, [userData]);
  
  // WebSocket connection
  const { sendMessage, isConnected } = useWebSocket({
    onMessage: handleWebSocketMessage,
    onError: handleWebSocketError
  });
  
  // WebSocket message handlers
  function handleWebSocketMessage(message) {
    switch (message.type) {
      case 'NEW_MESSAGE':
        dispatch({
          type: ActionTypes.ADD_MESSAGE,
          payload: {
            conversationId: message.data.conversationId,
            message: message.data.message
          }
        });
        break;
        
      case 'MESSAGE_READ':
        dispatch({
          type: ActionTypes.UPDATE_MESSAGE,
          payload: {
            conversationId: message.data.conversationId,
            messageId: message.data.messageId,
            updates: { isRead: true, readAt: message.data.readAt }
          }
        });
        break;
        
      case 'TYPING_STATUS':
        dispatch({
          type: ActionTypes.SET_TYPING,
          payload: {
            conversationId: message.data.conversationId,
            userId: message.data.userId,
            isTyping: message.data.isTyping
          }
        });
        break;
        
      case 'USER_ONLINE':
        dispatch({
          type: ActionTypes.ADD_USER,
          payload: message.data.user
        });
        break;
    }
  }
  
  function handleWebSocketError(error) {
    dispatch({
      type: ActionTypes.SET_ERROR,
      payload: 'Връзката с сървъра е прекъсната'
    });
  }
  
  // Action creators
  const actions = {
    // UI Actions
    toggleWidget: () => dispatch({ type: ActionTypes.TOGGLE_WIDGET }),
    openConversation: (conversationId) => dispatch({
      type: ActionTypes.OPEN_CONVERSATION,
      payload: { conversationId }
    }),
    closeConversation: () => dispatch({ type: ActionTypes.CLOSE_CONVERSATION }),
    setLoading: (loading) => dispatch({
      type: ActionTypes.SET_LOADING,
      payload: loading
    }),
    setError: (error) => dispatch({
      type: ActionTypes.SET_ERROR,
      payload: error
    }),
    clearError: () => dispatch({ type: ActionTypes.CLEAR_ERROR }),
    
    // Data Actions
    loadConversations: async () => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const conversations = await svMessengerService.getConversations();
        dispatch({ type: ActionTypes.SET_CONVERSATIONS, payload: conversations });
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      }
    },
    
    loadMessages: async (conversationId, page = 0) => {
      try {
        const messages = await svMessengerService.getMessages(conversationId, page);
        dispatch({
          type: ActionTypes.SET_MESSAGES,
          payload: { conversationId, messages }
        });
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      }
    },
    
    sendMessage: async (conversationId, messageText) => {
      try {
        const message = await svMessengerService.sendMessage(conversationId, messageText);
        dispatch({
          type: ActionTypes.ADD_MESSAGE,
          payload: { conversationId, message }
        });
        
        // Send via WebSocket for real-time delivery
        sendMessage({
          type: 'SEND_MESSAGE',
          data: { conversationId, message }
        });
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      }
    },
    
    startConversation: async (recipientId) => {
      try {
        const conversation = await svMessengerService.startConversation(recipientId);
        dispatch({ type: ActionTypes.ADD_CONVERSATION, payload: conversation });
        return conversation;
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    },
    
    searchUsers: async (query) => {
      try {
        return await svMessengerService.searchUsers(query);
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        return [];
      }
    },
    
    // Typing actions
    startTyping: (conversationId) => {
      sendMessage({
        type: 'TYPING_START',
        data: { conversationId, userId: state.currentUser.id }
      });
    },
    
    stopTyping: (conversationId) => {
      sendMessage({
        type: 'TYPING_STOP',
        data: { conversationId, userId: state.currentUser.id }
      });
    }
  };
  
  const value = {
    ...state,
    ...actions,
    isConnected
  };
  
  return (
    <SVMessengerContext.Provider value={value}>
      {children}
    </SVMessengerContext.Provider>
  );
}

// Hook to use context
export function useSVMessenger() {
  const context = useContext(SVMessengerContext);
  if (!context) {
    throw new Error('useSVMessenger must be used within SVMessengerProvider');
  }
  return context;
}
