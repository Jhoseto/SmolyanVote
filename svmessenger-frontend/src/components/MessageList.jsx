import React from 'react';
import MessageItem from './MessageItem';
import './MessageList.css';

/**
 * Списък със съобщения в чат
 */
function MessageList({ messages, currentUser }) {
  if (!messages || messages.length === 0) {
    return (
      <div className="message-list">
        <div className="message-list-empty">
          <p>Няма съобщения</p>
          <small>Изпратете първото съобщение</small>
        </div>
      </div>
    );
  }
  
  return (
    <div className="message-list">
      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
        
        return (
          <MessageItem
            key={message.id}
            message={message}
            currentUser={currentUser}
            showAvatar={shouldShowAvatar(message, prevMessage, nextMessage)}
            showTimestamp={shouldShowTimestamp(message, nextMessage)}
          />
        );
      })}
    </div>
  );
}

/**
 * Определи дали да се покаже аватар
 */
function shouldShowAvatar(message, prevMessage, nextMessage) {
  // Покажи аватар ако:
  // 1. Това е първото съобщение
  // 2. Предишното съобщение е от различен потребител
  // 3. Следващото съобщение е от различен потребител (последно съобщение от този потребител)
  if (!prevMessage) return true;
  if (prevMessage.sender.id !== message.sender.id) return true;
  if (!nextMessage || nextMessage.sender.id !== message.sender.id) return true;
  
  return false;
}

/**
 * Определи дали да се покаже timestamp
 */
function shouldShowTimestamp(message, nextMessage) {
  // Покажи timestamp ако:
  // 1. Това е последното съобщение
  // 2. Следващото съобщение е от различен потребител
  // 3. Разликата във времето е повече от 5 минути
  if (!nextMessage) return true;
  if (nextMessage.sender.id !== message.sender.id) return true;
  
  const messageTime = new Date(message.sentAt);
  const nextMessageTime = new Date(nextMessage.sentAt);
  const timeDiff = Math.abs(nextMessageTime - messageTime);
  const fiveMinutes = 5 * 60 * 1000; // 5 минути в милисекунди
  
  return timeDiff > fiveMinutes;
}

export default MessageList;
