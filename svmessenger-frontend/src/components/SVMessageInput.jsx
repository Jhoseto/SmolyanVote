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

  // Auto-resize textarea with proper line counting
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const lineHeight = 20; // Same as CSS line-height
      const minHeight = 40; // 2 lines * 20px
      const maxHeight = 120; // 6 lines * 20px
      
      // Reset height to calculate scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate number of lines
      const lines = Math.ceil(textarea.scrollHeight / lineHeight);
      
      if (lines <= 2) {
        // 1-2 lines: fixed height, no scroll
        textarea.style.height = `${minHeight}px`;
        textarea.classList.remove('multi-line');
      } else {
        // 3+ lines: dynamic height with scroll
        const newHeight = Math.min(lines * lineHeight, maxHeight);
        textarea.style.height = `${newHeight}px`;
        textarea.classList.add('multi-line');
      }
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
    // Enter = нов ред, Shift+Enter = изпращане (засега изключено)
    // Само бутонът изпраща съобщения
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    // Обикновен Enter не прави нищо - позволява нов ред
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
            placeholder="Aa"
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
