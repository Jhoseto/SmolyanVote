/**
 * Custom hook за управление на typing status
 */

import { useEffect, useRef } from 'react';

export const useSVTypingStatus = (conversationId, sendTypingStatus) => {
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  
  const handleTyping = () => {
    // Send typing=true ако не е изпратено вече
    if (!isTypingRef.current) {
      sendTypingStatus(conversationId, true);
      isTypingRef.current = true;
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout за auto-stop typing след 2 секунди
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(conversationId, false);
      isTypingRef.current = false;
    }, 2000);
  };
  
  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (isTypingRef.current) {
      sendTypingStatus(conversationId, false);
      isTypingRef.current = false;
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, []);
  
  return { handleTyping, stopTyping };
};
