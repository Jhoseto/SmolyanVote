package smolyanVote.smolyanVote.services.serviceImpl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.svmessenger.SVConversationEntity;
import smolyanVote.smolyanVote.models.svmessenger.SVMessageEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.repositories.svmessenger.SVConversationRepository;
import smolyanVote.smolyanVote.repositories.svmessenger.SVMessageRepository;
import smolyanVote.smolyanVote.services.interfaces.SVMessengerService;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVConversationDTO;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVMessageDTO;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVUserMinimalDTO;
import smolyanVote.smolyanVote.websocket.svmessenger.SVMessengerWebSocketHandler;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Service implementation за SVMessenger
 * Съдържа цялата бизнес логика
 */
@Service
@Transactional
@Slf4j
public class SVMessengerServiceImpl implements SVMessengerService {
    
    private final SVConversationRepository conversationRepo;
    private final SVMessageRepository messageRepo;
    private final UserRepository userRepo;
    private final SVMessengerWebSocketHandler webSocketHandler;
    
    // In-memory storage за typing statuses
    // Key: conversationId, Value: Map<userId, lastTypingTime>
    private final Map<Long, Map<Long, Instant>> typingStatuses = new ConcurrentHashMap<>();
    
    public SVMessengerServiceImpl(
            SVConversationRepository conversationRepo,
            SVMessageRepository messageRepo,
            UserRepository userRepo,
            SVMessengerWebSocketHandler webSocketHandler) {
        this.conversationRepo = conversationRepo;
        this.messageRepo = messageRepo;
        this.userRepo = userRepo;
        this.webSocketHandler = webSocketHandler;
    }
    
    // ========== CONVERSATION MANAGEMENT ==========
    
    @Override
    @Transactional(readOnly = true)
    public List<SVConversationDTO> getAllConversations(UserEntity currentUser) {
        log.debug("Getting all conversations for user: {}", currentUser.getId());
        
        List<SVConversationEntity> conversations = conversationRepo.findAllActiveByUser(currentUser.getId());
        
        // Convert to DTOs with typing status
        return conversations.stream()
                .map(conv -> {
                    UserEntity otherUser = conv.getOtherUser(currentUser);
                    boolean isTyping = isUserTyping(conv.getId(), otherUser.getId());
                    return SVConversationDTO.Mapper.toDTO(conv, currentUser, isTyping);
                })
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public SVConversationDTO getConversation(Long conversationId, UserEntity currentUser) {
        log.debug("Getting conversation {} for user {}", conversationId, currentUser.getId());
        
        SVConversationEntity conversation = conversationRepo.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Разговорът не съществува"));
        
        // Validate user is participant
        if (!conversation.isParticipant(currentUser)) {
            throw new IllegalArgumentException("Нямате достъп до този разговор");
        }
        
        UserEntity otherUser = conversation.getOtherUser(currentUser);
        boolean isTyping = isUserTyping(conversationId, otherUser.getId());
        
        return SVConversationDTO.Mapper.toDTO(conversation, currentUser, isTyping);
    }
    
    @Override
    public SVConversationDTO startOrGetConversation(UserEntity currentUser, Long otherUserId) {
        log.debug("Starting/getting conversation between {} and {}", currentUser.getId(), otherUserId);
        
        // Validation
        if (currentUser.getId().equals(otherUserId)) {
            throw new IllegalArgumentException("Не можете да си говорите със себе си");
        }
        
        // Check if conversation exists
        return conversationRepo.findByTwoUsers(currentUser.getId(), otherUserId)
                .map(conv -> SVConversationDTO.Mapper.toDTO(conv, currentUser))
                .orElseGet(() -> {
                    // Create new conversation
                    UserEntity otherUser = userRepo.findById(otherUserId)
                            .orElseThrow(() -> new IllegalArgumentException("Потребителят не съществува"));
                    
                    SVConversationEntity newConv = new SVConversationEntity(currentUser, otherUser);
                    newConv = conversationRepo.save(newConv);
                    
                    log.info("Created new conversation: {}", newConv.getId());
                    return SVConversationDTO.Mapper.toDTO(newConv, currentUser);
                });
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean conversationExists(Long userId1, Long userId2) {
        return conversationRepo.existsBetweenUsers(userId1, userId2);
    }
    
    @Override
    public void deleteConversation(Long conversationId, UserEntity currentUser) {
        log.debug("Deleting conversation {} for user {}", conversationId, currentUser.getId());
        
        SVConversationEntity conversation = conversationRepo.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Разговорът не съществува"));
        
        if (!conversation.isParticipant(currentUser)) {
            throw new IllegalArgumentException("Нямате достъп до този разговор");
        }
        
        conversationRepo.softDelete(conversationId);
        log.info("Conversation {} soft deleted", conversationId);
    }
    
    // ========== MESSAGE MANAGEMENT ==========
    
    @Override
    public SVMessageDTO sendMessage(Long conversationId, String text, UserEntity sender) {
        log.debug("Sending message in conversation {} from user {}", conversationId, sender.getId());
        
        // Validation
        if (text == null || text.trim().isEmpty()) {
            throw new IllegalArgumentException("Съобщението не може да е празно");
        }
        
        if (text.length() > 5000) {
            throw new IllegalArgumentException("Съобщението е твърде дълго (макс 5000 символа)");
        }
        
        // Get conversation
        SVConversationEntity conversation = conversationRepo.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Разговорът не съществува"));
        
        // Validate sender is participant
        if (!conversation.isParticipant(sender)) {
            throw new IllegalArgumentException("Нямате достъп до този разговор");
        }
        
        // Create message
        SVMessageEntity message = new SVMessageEntity(conversation, sender, text.trim());
        message = messageRepo.save(message);
        
        // Update conversation
        conversation.setLastMessagePreview(truncateText(text, 100));
        conversation.setUpdatedAt(Instant.now());
        
        // Increment unread count за другия user
        UserEntity otherUser = conversation.getOtherUser(sender);
        conversation.incrementUnreadFor(otherUser);
        
        conversationRepo.save(conversation);
        
        // Convert to DTO
        SVMessageDTO messageDTO = SVMessageDTO.Mapper.toDTO(message);
        
        // Send via WebSocket to recipient
        webSocketHandler.sendPrivateMessage(otherUser.getId(), messageDTO);
        
        log.info("Message {} sent successfully", message.getId());
        return messageDTO;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<SVMessageDTO> getMessages(Long conversationId, int page, int size, UserEntity currentUser) {
        log.debug("Getting messages for conversation {} (page: {}, size: {})", conversationId, page, size);
        
        // Validate conversation exists and user is participant
        SVConversationEntity conversation = conversationRepo.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Разговорът не съществува"));
        
        if (!conversation.isParticipant(currentUser)) {
            throw new IllegalArgumentException("Нямате достъп до този разговор");
        }
        
        // Create pageable (sorted by sentAt DESC for infinite scroll)
        Pageable pageable = PageRequest.of(page, size);
        
        // Query messages
        Page<SVMessageEntity> messagesPage = messageRepo.findByConversationId(conversationId, pageable);
        
        // Map to DTOs
        return messagesPage.map(SVMessageDTO.Mapper::toDTO);
    }
    
    @Override
    public void markMessageAsRead(Long messageId, UserEntity reader) {
        log.debug("Marking message {} as read by user {}", messageId, reader.getId());
        
        SVMessageEntity message = messageRepo.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Съобщението не съществува"));
        
        // Only recipient can mark as read
        if (!message.isReceivedBy(reader)) {
            throw new IllegalArgumentException("Не можете да маркирате това съобщение");
        }
        
        if (!message.getIsRead()) {
            message.markAsRead();
            messageRepo.save(message);
            
            // Send read receipt via WebSocket to sender
            webSocketHandler.sendReadReceipt(
                    message.getSender().getId(),
                    messageId,
                    message.getConversation().getId()
            );
        }
    }
    
    @Override
    public void markAllAsRead(Long conversationId, UserEntity reader) {
        log.debug("Marking all messages as read in conversation {} by user {}", conversationId, reader.getId());
        
        // Validate
        SVConversationEntity conversation = conversationRepo.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Разговорът не съществува"));
        
        if (!conversation.isParticipant(reader)) {
            throw new IllegalArgumentException("Нямате достъп до този разговор");
        }
        
        // Mark all as read
        int updatedCount = messageRepo.markAllAsRead(conversationId, reader.getId(), Instant.now());
        
        // Reset unread count в conversation
        conversationRepo.resetUnreadCount(conversationId, reader.getId());
        
        // Send read receipts за всички съобщения
        UserEntity otherUser = conversation.getOtherUser(reader);
        webSocketHandler.sendBulkReadReceipt(otherUser.getId(), conversationId);
        
        log.info("Marked {} messages as read in conversation {}", updatedCount, conversationId);
    }
    
    @Override
    public void deleteMessage(Long messageId, UserEntity currentUser) {
        log.debug("Deleting message {} by user {}", messageId, currentUser.getId());
        
        SVMessageEntity message = messageRepo.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Съобщението не съществува"));
        
        // Only sender can delete
        if (!message.isSentBy(currentUser)) {
            throw new IllegalArgumentException("Можете да изтривате само свои съобщения");
        }
        
        messageRepo.softDelete(messageId);
        log.info("Message {} soft deleted", messageId);
    }
    
    @Override
    public SVMessageDTO editMessage(Long messageId, String newText, UserEntity currentUser) {
        log.debug("Editing message {} by user {}", messageId, currentUser.getId());
        
        // Validation
        if (newText == null || newText.trim().isEmpty()) {
            throw new IllegalArgumentException("Съобщението не може да е празно");
        }
        
        SVMessageEntity message = messageRepo.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Съобщението не съществува"));
        
        // Only sender can edit
        if (!message.isSentBy(currentUser)) {
            throw new IllegalArgumentException("Можете да редактирате само свои съобщения");
        }
        
        // Update message
        messageRepo.editMessage(messageId, newText.trim(), Instant.now());
        
        // Reload and return
        message = messageRepo.findById(messageId).get();
        return SVMessageDTO.Mapper.toDTO(message);
    }
    
    // ========== STATISTICS ==========
    
    @Override
    @Transactional(readOnly = true)
    public Long getTotalUnreadCount(UserEntity user) {
        Long count = conversationRepo.getTotalUnreadCount(user.getId());
        return count != null ? count : 0L;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Integer getUnreadCount(Long conversationId, UserEntity user) {
        SVConversationEntity conversation = conversationRepo.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Разговорът не съществува"));
        
        return conversation.getUnreadCountFor(user);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Long getMessageCount(Long conversationId) {
        return messageRepo.countByConversation(conversationId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Long getConversationCount(UserEntity user) {
        return conversationRepo.countActiveByUser(user.getId());
    }
    
    // ========== TYPING STATUS ==========
    
    @Override
    public void updateTypingStatus(Long conversationId, UserEntity user, boolean isTyping) {
        log.debug("Updating typing status: conv={}, user={}, typing={}", conversationId, user.getId(), isTyping);
        
        Map<Long, Instant> conversationTyping = typingStatuses.computeIfAbsent(
                conversationId, 
                k -> new ConcurrentHashMap<>()
        );
        
        if (isTyping) {
            conversationTyping.put(user.getId(), Instant.now());
        } else {
            conversationTyping.remove(user.getId());
        }
        
        // Broadcast via WebSocket
        webSocketHandler.broadcastTypingStatus(conversationId, user.getId(), user.getUsername(), isTyping);
        
        // Schedule auto-cleanup след 3 секунди
        if (isTyping) {
            scheduleTypingCleanup(conversationId, user.getId());
        }
    }
    
    @Override
    public boolean isUserTyping(Long conversationId, Long userId) {
        Map<Long, Instant> conversationTyping = typingStatuses.get(conversationId);
        if (conversationTyping == null) {
            return false;
        }
        
        Instant lastTyping = conversationTyping.get(userId);
        if (lastTyping == null) {
            return false;
        }
        
        // Cleanup ако е по-старо от 3 секунди
        if (lastTyping.plusSeconds(3).isBefore(Instant.now())) {
            conversationTyping.remove(userId);
            return false;
        }
        
        return true;
    }
    
    private void scheduleTypingCleanup(Long conversationId, Long userId) {
        // Schedule cleanup след 3 секунди
        new Thread(() -> {
            try {
                Thread.sleep(3000);
                Map<Long, Instant> conversationTyping = typingStatuses.get(conversationId);
                if (conversationTyping != null) {
                    conversationTyping.remove(userId);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();
    }
    
    // ========== USER SEARCH ==========
    
    @Override
    @Transactional(readOnly = true)
    public List<SVUserMinimalDTO> searchUsers(String query, UserEntity currentUser) {
        log.debug("Searching users with query: {}", query);
        
        if (query == null || query.trim().length() < 2) {
            throw new IllegalArgumentException("Търсенето трябва да е поне 2 символа");
        }
        
        // Search in UserRepository
        List<UserEntity> users = userRepo.findByUsernameContainingIgnoreCaseOrRealNameContainingIgnoreCase(
                query.trim()
        );
        
        // Exclude current user and convert to DTO
        return users.stream()
                .filter(user -> !user.getId().equals(currentUser.getId()))
                .limit(20) // Max 20 results
                .map(SVUserMinimalDTO.Mapper::toDTO)
                .collect(Collectors.toList());
    }
    
    // ========== HELPER METHODS ==========
    
    private String truncateText(String text, int maxLength) {
        if (text == null) {
            return "";
        }
        if (text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + "...";
    }
}
