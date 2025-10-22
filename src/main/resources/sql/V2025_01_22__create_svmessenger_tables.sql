-- ============================================
-- SVMESSENGER DATABASE TABLES
-- Version: 2025-01-22
-- Description: Creates tables for SVMessenger chat system
-- ============================================

-- Таблица за разговори между потребители
CREATE TABLE IF NOT EXISTS sv_conversations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user1_id BIGINT NOT NULL,
    user2_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_message_preview VARCHAR(100),
    user1_unread_count INT DEFAULT 0 NOT NULL,
    user2_unread_count INT DEFAULT 0 NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    
    -- Foreign keys към users таблицата
    CONSTRAINT fk_sv_conv_user1 FOREIGN KEY (user1_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_sv_conv_user2 FOREIGN KEY (user2_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes за performance
    INDEX idx_sv_conv_users (user1_id, user2_id),
    INDEX idx_sv_conv_updated (updated_at DESC),
    INDEX idx_sv_conv_user1 (user1_id),
    INDEX idx_sv_conv_user2 (user2_id),
    
    -- Constraints
    CONSTRAINT chk_sv_conv_user_order CHECK (user1_id < user2_id),
    CONSTRAINT unique_sv_conversation UNIQUE (user1_id, user2_id)
);

-- Таблица за съобщения
CREATE TABLE IF NOT EXISTS sv_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    message_text TEXT NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    read_at TIMESTAMP NULL,
    message_type VARCHAR(20) DEFAULT 'TEXT' NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE NOT NULL,
    edited_at TIMESTAMP NULL,
    
    -- Foreign keys
    CONSTRAINT fk_sv_msg_conversation FOREIGN KEY (conversation_id) 
        REFERENCES sv_conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_sv_msg_sender FOREIGN KEY (sender_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes за бързи queries
    INDEX idx_sv_msg_conversation_sent (conversation_id, sent_at DESC),
    INDEX idx_sv_msg_sender (sender_id),
    INDEX idx_sv_msg_unread (conversation_id, is_read),
    INDEX idx_sv_msg_deleted (is_deleted),
    
    -- Check constraints
    CONSTRAINT chk_sv_msg_type CHECK (message_type IN ('TEXT', 'IMAGE', 'FILE', 'EMOJI'))
);

-- Таблица за typing status (optional - може и in-memory)
CREATE TABLE IF NOT EXISTS sv_typing_status (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    is_typing BOOLEAN DEFAULT FALSE NOT NULL,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_sv_typing_conversation FOREIGN KEY (conversation_id) 
        REFERENCES sv_conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_sv_typing_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_sv_typing_conv (conversation_id),
    UNIQUE KEY unique_sv_typing (conversation_id, user_id)
);

-- ============================================
-- COMMENTS
-- ============================================

-- 1. sv_conversations:
--    - user1_id винаги е по-малко от user2_id (за уникалност)
--    - Всеки user има си unread count
--    - updated_at се update-ва при всяко ново съобщение
--    - Soft delete (is_deleted)

-- 2. sv_messages:
--    - Съобщенията се четат само от recipient
--    - Sender не може да промени is_read
--    - Soft delete (is_deleted)
--    - Максимална дължина на текст: 5000 chars (TEXT column)

-- 3. sv_typing_status:
--    - Optional таблица за typing status
--    - Може да се използва in-memory storage вместо това
--    - Auto-cleanup след 3 секунди

-- ============================================
-- PERFORMANCE NOTES
-- ============================================

-- Indexes са оптимизирани за:
-- 1. Намиране на разговори по user (idx_sv_conv_users)
-- 2. Сортиране по последно съобщение (idx_sv_conv_updated)
-- 3. Pagination на съобщения (idx_sv_msg_conversation_sent)
-- 4. Unread count queries (idx_sv_msg_unread)
-- 5. Typing status queries (idx_sv_typing_conv)
