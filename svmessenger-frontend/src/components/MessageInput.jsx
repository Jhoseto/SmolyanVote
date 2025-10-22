import React, { useState, useRef, useEffect } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import EmojiPicker from 'emoji-picker-react';
import './MessageInput.css';

/**
 * Input за изпращане на съобщения
 */
function MessageInput({ conversationId, onMessageSent }) {
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const { sendMessage, startTyping, stopTyping } = useSVMessenger();
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [messageText]);
  
  // Handle typing status
  useEffect(() => {
    if (messageText.trim() && !isTyping) {
      setIsTyping(true);
      startTyping(conversationId);
    } else if (!messageText.trim() && isTyping) {
      setIsTyping(false);
      stopTyping(conversationId);
    }
    
    // Clear typing status after 3 seconds of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        stopTyping(conversationId);
      }
    }, 3000);
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messageText, isTyping, conversationId, startTyping, stopTyping]);
  
  // Cleanup typing status on unmount
  useEffect(() => {
    return () => {
      if (isTyping) {
        stopTyping(conversationId);
      }
    };
  }, [isTyping, conversationId, stopTyping]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedText = messageText.trim();
    if (!trimmedText) return;
    
    try {
      await sendMessage(conversationId, trimmedText);
      setMessageText('');
      setShowEmojiPicker(false);
      onMessageSent?.();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };
  
  const toggleEmojiPicker = () => {
    setShowEmojiPicker(prev => !prev);
  };
  
  return (
    <div className="message-input">
      <form onSubmit={handleSubmit} className="message-form">
        <div className="input-container">
          <textarea
            ref={textareaRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Напишете съобщение..."
            className="message-textarea"
            rows={1}
            maxLength={2000}
          />
          
          <div className="input-actions">
            <button
              type="button"
              onClick={toggleEmojiPicker}
              className="emoji-btn"
              title="Emoji"
            >
              😊
            </button>
            
            <button
              type="submit"
              disabled={!messageText.trim()}
              className="send-btn"
              title="Изпрати"
            >
              ➤
            </button>
          </div>
        </div>
      </form>
      
      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="emoji-picker-container">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width={300}
            height={300}
            searchDisabled={false}
            skinTonesDisabled={false}
            previewConfig={{
              showPreview: true
            }}
          />
        </div>
      )}
    </div>
  );
}

export default MessageInput;
