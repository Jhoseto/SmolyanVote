import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import SVChatHeader from './SVChatHeader';
import SVMessageThread from './SVMessageThread';
import SVMessageInput from './SVMessageInput';

/**
 * Chat Window компонент
 * Показва отворен разговор с header, messages и input
 * Поддържа drag & drop и resize функционалност
 */
const SVChatWindow = ({ conversation, index = 0 }) => {
  const { closeChat, minimizeChat } = useSVMessenger();
  const chatWindowRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 400, height: 600 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Initialize position on mount
  useEffect(() => {
    const initializePosition = () => {
      // Position chat windows side by side, starting from right
      const chatWidth = 400;
      const chatSpacing = 20;
      const newX = Math.max(0, window.innerWidth - chatWidth - (index * (chatWidth + chatSpacing)));
      const newY = Math.max(0, window.innerHeight - 680);
      
      console.log('Initializing chat position:', { index, newX, newY, windowWidth: window.innerWidth });
      setPosition({ x: newX, y: newY });
    };

    // Initialize immediately if window is available
    if (typeof window !== 'undefined') {
      initializePosition();
    }

    // Also initialize on window resize
    window.addEventListener('resize', initializePosition);
    
    return () => {
      window.removeEventListener('resize', initializePosition);
    };
  }, [index]);

  // Auto-focus on mount
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.focus();
    }
  }, []);

  // Drag handlers
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.svmessenger-resize-handle')) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [position]);

  const handleResizeMouseDown = useCallback((e) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  }, [size]);

  // Global mouse move handler
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // Keep within viewport bounds
        const maxX = window.innerWidth - size.width;
        const maxY = window.innerHeight - size.height;
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
      
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        const newWidth = Math.max(300, Math.min(800, resizeStart.width + deltaX));
        const newHeight = Math.max(400, Math.min(window.innerHeight - 100, resizeStart.height + deltaY));
        
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, size]);

  const handleClose = () => {
    closeChat(conversation.id);
  };

  const handleMinimize = () => {
    minimizeChat(conversation.id);
  };

  return (
    <div 
      ref={chatWindowRef}
      className={`svmessenger-chat-window ${conversation.isMinimized ? 'minimized' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height
      }}
      onMouseDown={handleMouseDown}
      tabIndex={0}
    >
      {/* Header */}
      <SVChatHeader
        conversation={conversation}
        onClose={handleClose}
        onMinimize={handleMinimize}
      />

      {/* Messages Thread */}
      {!conversation.isMinimized && (
        <SVMessageThread conversationId={conversation.id} />
      )}

      {/* Message Input */}
      {!conversation.isMinimized && (
        <SVMessageInput conversationId={conversation.id} />
      )}

      {/* Resize Handle */}
      {!conversation.isMinimized && (
        <div 
          className="svmessenger-resize-handle"
          onMouseDown={handleResizeMouseDown}
        />
      )}
    </div>
  );
};

export default SVChatWindow;
