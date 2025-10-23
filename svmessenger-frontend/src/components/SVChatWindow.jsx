import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';
import SVChatHeader from './SVChatHeader';
import SVMessageThread from './SVMessageThread';
import SVMessageInput from './SVMessageInput';

/**
 * Chat Window компонент - НОВА ВЕРСИЯ
 * Прост и надежден chat прозорец с drag & drop
 */
const SVChatWindow = ({ conversation, index = 0 }) => {
  const { closeChat, minimizeChat } = useSVMessenger();
  const chatWindowRef = useRef(null);
  
  // Позиция на прозореца
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Drag & Drop state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Инициализиране на позицията при mount
  useEffect(() => {
    const initPosition = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Размери на прозореца
      const windowWidth = 400;
      const windowHeight = 600;
      
      // Начална позиция - долу вдясно близо до FAB
      const startX = viewportWidth - windowWidth - 30; // 30px от десния край
      const startY = viewportHeight - windowHeight - 100; // 100px от долния край (над FAB)
      
      // Офсет за multiple windows
      const offsetX = index * 20; // 20px между прозорците
      const offsetY = index * 20;
      
      // Финаленна позиция
      const finalX = Math.max(20, startX - offsetX);
      const finalY = Math.max(20, startY - offsetY);
      
      setPosition({ x: finalX, y: finalY });
    };

    initPosition();
  }, [index]);

  // Auto-focus при отваряне
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.focus();
    }
  }, [conversation.id]);

  // Drag handlers
  const handleMouseDown = useCallback((e) => {
    // Само от header-а може да се влачи
    if (!e.target.closest('.svmessenger-chat-header')) return;
    
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [position]);

  // Global mouse move handler
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Ограничи в границите на viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const windowWidth = 400;
      const windowHeight = 600;
      
      const clampedX = Math.max(0, Math.min(newX, viewportWidth - windowWidth));
      const clampedY = Math.max(0, Math.min(newY, viewportHeight - windowHeight));
      
      setPosition({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const windowWidth = 400;
      const windowHeight = 600;
      
      setPosition(prev => ({
        x: Math.min(prev.x, viewportWidth - windowWidth),
        y: Math.min(prev.y, viewportHeight - windowHeight)
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleClose = () => {
    closeChat(conversation.id);
  };

  const handleMinimize = () => {
    minimizeChat(conversation.id);
  };

  return (
    <div 
      ref={chatWindowRef}
      className={`svmessenger-chat-window ${conversation.isMinimized ? 'minimized' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
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
    </div>
  );
};

export default SVChatWindow;