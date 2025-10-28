import React, { useState, useRef, useEffect } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import { useSVTypingStatus } from '../hooks/useSVTypingStatus';
import SVEmojiPicker from './SVEmojiPicker';

/**
 * Message Input компонент
 * Input field за въвеждане и изпращане на съобщения
 */
const SVMessageInput = ({ conversationId }) => {
  const { sendMessage } = useSVMessenger();
  const [messageText, setMessageText] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);
  const emojiButtonRef = useRef(null);

  // Typing status hook
  const { handleTyping, stopTyping } = useSVTypingStatus(
    conversationId,
    (conversationId, isTyping) => {
      // This will be handled by the context
    }
  );

  // Auto-focus on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [conversationId]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const lineHeight = 20;
      const minHeight = 40;
      const maxHeight = 120;
      
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [messageText]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (messageText.trim()) {
      sendMessage(conversationId, messageText.trim());
      setMessageText('');
      stopTyping();
      if (textareaRef.current) {
        textareaRef.current.style.height = '40px';
      }
    }
  };

  const handleKeyDown = (e) => {
    // Enter без Shift = изпраща, Shift+Enter = нов ред
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    // Shift+Enter позволява нов ред - default behavior
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessageText(value);

    // Handle typing status
    if (value.trim()) {
      handleTyping();
    } else {
      stopTyping();
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  const handleAttachClick = (e) => {
    e.preventDefault();
    // TODO: File attachment
    console.log('Attach file');
  };

  const handleEmojiClick = (e) => {
    e.preventDefault();
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleEmojiSelect = (emoji) => {
    setMessageText(prev => prev + emoji.native);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleCloseEmojiPicker = () => {
    setShowEmojiPicker(false);
  };

  return (
    <div className="svmessenger-message-input">
      <form onSubmit={handleSubmit} className="svmessenger-input-form">
        <div className="svmessenger-input-container">
          {/* Attach Button */}
          <button 
            type="button"
            className="svmessenger-attach-btn"
            onClick={handleAttachClick}
            title="Прикачи файл"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
            </svg>
          </button>

          {/* Text Input */}
          <div className="svmessenger-input-wrapper">
            <textarea
              ref={textareaRef}
              className="svmessenger-text-input"
              placeholder="Aa"
              value={messageText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              rows={1}
              maxLength={2000}
            />
          </div>

          {/* Emoji Button - always visible like Facebook */}
          <button 
            ref={emojiButtonRef}
            type="button"
            className={`svmessenger-emoji-btn ${showEmojiPicker ? 'active' : ''}`}
            onClick={handleEmojiClick}
            title="Емотикони"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-3.5-9c.83 0 1.5-.67 1.5-1.5S9.33 8.5 8.5 8.5 7 9.17 7 10s.67 1.5 1.5 1.5zm7 0c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
            </svg>
          </button>

          {/* Send/Mic Button */}
          {messageText.trim() ? (
            <button
              type="submit"
              className="svmessenger-send-btn"
              title="Изпрати съобщение"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          ) : (
            <button
              type="button"
              className="svmessenger-mic-btn"
              title="Гласова поръка (по-късно)"
              disabled
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
              </svg>
            </button>
          )}
        </div>

          {/* Helper text */}
        <div className="svmessenger-input-helper">
          Натисни Enter за изпращане • Shift+Enter за нов ред
        </div>
      </form>

      {/* Emoji Picker */}
      <SVEmojiPicker
        show={showEmojiPicker}
        onEmojiSelect={handleEmojiSelect}
        onClose={handleCloseEmojiPicker}
      />
    </div>
  );
};

export default SVMessageInput;
