import React, { useState, useRef, useEffect } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import { useSVTypingStatus } from '../hooks/useSVTypingStatus';

/**
 * Message Input компонент
 * Input field за въвеждане и изпращане на съобщения
 */
const SVMessageInput = ({ conversationId }) => {
  const { sendMessage } = useSVMessenger();
  const [messageText, setMessageText] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  // Typing status hook
  const { handleTyping, stopTyping } = useSVTypingStatus(
    conversationId,
    (conversationId, isTyping) => {
      // This will be handled by the context
    }
  );

  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [conversationId]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [messageText]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (messageText.trim()) {
      sendMessage(conversationId, messageText.trim());
      setMessageText('');
      stopTyping();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
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

  return (
    <div className="svmessenger-message-input">
      <form onSubmit={handleSubmit} className="svmessenger-input-form">
        <div className="svmessenger-input-container">
          {/* Text Input */}
          <textarea
            ref={textareaRef}
            className="svmessenger-text-input"
            placeholder="Напишете съобщение..."
            value={messageText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            rows={1}
            maxLength={2000}
          />

          {/* Send Button */}
          <button
            type="submit"
            className={`svmessenger-send-btn ${messageText.trim() ? 'active' : ''}`}
            disabled={!messageText.trim()}
            title="Изпрати съобщение"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SVMessageInput;
