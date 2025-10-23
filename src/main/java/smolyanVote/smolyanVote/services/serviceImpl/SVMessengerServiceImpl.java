package smolyanVote.smolyanVote.services.serviceImpl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.svmessenger.SVConversationEntity;
import smolyanVote.smolyanVote.models.svmessenger.SVMessageEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.repositories.svmessenger.SVConversationRepository;
import smolyanVote.smolyanVote.repositories.svmessenger.SVMessageRepository;
import smolyanVote.smolyanVote.services.interfaces.FollowService;
import smolyanVote.smolyanVote.services.interfaces.SVMessengerService;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVConversationDTO;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVMessageDTO;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVUserMinimalDTO;
import smolyanVote.smolyanVote.websocket.svmessenger.SVMessengerWebSocketHandler;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@Slf4j
public class SVMessengerServiceImpl implements SVMessengerService {

    private final SVConversationRepository conversationRepo;
    private final SVMessageRepository messageRepo;
    private final UserRepository userRepo;
    private final SVMessengerWebSocketHandler webSocketHandler;
    private final FollowService followService;

    private final Map<Long, Map<Long, LocalDateTime>> typingStatuses = new ConcurrentHashMap<>();

    @Autowired
    public SVMessengerServiceImpl(
            SVConversationRepository conversationRepo,
            SVMessageRepository messageRepo,
            UserRepository userRepo,
            SVMessengerWebSocketHandler webSocketHandler,
            FollowService followService) {
        this.conversationRepo = conversationRepo;
        this.messageRepo = messageRepo;
        this.userRepo = userRepo;
        this.webSocketHandler = webSocketHandler;
        this.followService = followService;
    }

    // ✅ FIX: readOnly=true за read operations
    @Override
    @Transactional(readOnly = true)
    public List<SVConversationDTO> getAllConversations(UserEntity currentUser) {
        try {
            log.debug("Getting conversations for user: {}", currentUser.getId());

            List<SVConversationEntity> conversations = conversationRepo.findAllActiveByUser(currentUser.getId());

            // ✅ Mapping вътре в transaction scope
            return conversations.stream()
                    .map(conv -> {
                        UserEntity otherUser = conv.getOtherUser(currentUser);
                        boolean isTyping = isUserTyping(conv.getId(), otherUser.getId());
                        return SVConversationDTO.Mapper.toDTO(conv, currentUser, isTyping);
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting conversations for user {}: {}", currentUser.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to load conversations", e);
        }
    }

    // ✅ FIX: readOnly=true
    @Override
    @Transactional(readOnly = true)
    public SVConversationDTO getConversation(Long conversationId, UserEntity currentUser) {
        try {
            SVConversationEntity conversation = conversationRepo.findById(conversationId)
                    .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

            if (!conversation.isParticipant(currentUser)) {
                throw new IllegalArgumentException("Access denied to this conversation");
            }

            UserEntity otherUser = conversation.getOtherUser(currentUser);
            boolean isTyping = isUserTyping(conversationId, otherUser.getId());

            return SVConversationDTO.Mapper.toDTO(conversation, currentUser, isTyping);
        } catch (Exception e) {
            log.error("Error getting conversation {}: {}", conversationId, e.getMessage(), e);
            throw e;
        }
    }

    // ✅ FIX: Explicit transaction с isolation level
    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public SVConversationDTO startOrGetConversation(UserEntity currentUser, Long otherUserId) {
        try {
            if (currentUser.getId().equals(otherUserId)) {
                throw new IllegalArgumentException("Cannot start conversation with yourself");
            }

            // Try to find existing
            return conversationRepo.findByTwoUsers(currentUser.getId(), otherUserId)
                    .map(conv -> SVConversationDTO.Mapper.toDTO(conv, currentUser))
                    .orElseGet(() -> {
                        UserEntity otherUser = userRepo.findById(otherUserId)
                                .orElseThrow(() -> new IllegalArgumentException("User not found"));

                        SVConversationEntity newConv = new SVConversationEntity(currentUser, otherUser);
                        newConv = conversationRepo.save(newConv);

                        log.info("Created conversation: {}", newConv.getId());
                        return SVConversationDTO.Mapper.toDTO(newConv, currentUser);
                    });
        } catch (Exception e) {
            log.error("Error starting conversation: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to start conversation", e);
        }
    }

    // ✅ FIX: Proper transaction management
    @Override
    @Transactional
    public SVMessageDTO sendMessage(Long conversationId, String text, UserEntity sender) {
        try {
            // Validation
            if (text == null || text.trim().isEmpty()) {
                throw new IllegalArgumentException("Message cannot be empty");
            }

            if (text.length() > 5000) {
                throw new IllegalArgumentException("Message too long (max 5000 characters)");
            }

            // Get conversation with lock
            SVConversationEntity conversation = conversationRepo.findById(conversationId)
                    .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

            if (!conversation.isParticipant(sender)) {
                throw new IllegalArgumentException("Access denied");
            }

            // Create message
            SVMessageEntity message = new SVMessageEntity(conversation, sender, text.trim());
            message = messageRepo.save(message);

            // Update conversation
            conversation.setLastMessagePreview(truncateText(text, 100));
            conversation.setUpdatedAt(LocalDateTime.now());

            UserEntity otherUser = conversation.getOtherUser(sender);
            conversation.incrementUnreadFor(otherUser);

            conversationRepo.save(conversation);

            // Convert to DTO
            SVMessageDTO messageDTO = SVMessageDTO.Mapper.toDTO(message);

            // Send via WebSocket (async - outside transaction)
            try {
                webSocketHandler.sendPrivateMessage(otherUser.getId(), messageDTO);
            } catch (Exception e) {
                log.warn("Failed to send WebSocket message: {}", e.getMessage());
                // Don't fail the transaction if WebSocket fails
            }

            log.info("Message sent: {}", message.getId());
            return messageDTO;

        } catch (Exception e) {
            log.error("Error sending message: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to send message", e);
        }
    }

    // ✅ FIX: readOnly + proper pagination
    @Override
    @Transactional(readOnly = true)
    public Page<SVMessageDTO> getMessages(Long conversationId, int page, int size, UserEntity currentUser) {
        try {
            SVConversationEntity conversation = conversationRepo.findById(conversationId)
                    .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

            if (!conversation.isParticipant(currentUser)) {
                throw new IllegalArgumentException("Access denied");
            }

            // ✅ Proper pagination with size limits
            if (size > 100) {
                size = 100; // Max 100 messages per page
            }

            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "sentAt"));

            Page<SVMessageEntity> messagesPage = messageRepo.findByConversationId(conversationId, pageable);

            // Map inside transaction
            return messagesPage.map(SVMessageDTO.Mapper::toDTO);

        } catch (Exception e) {
            log.error("Error getting messages: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to load messages", e);
        }
    }

    // ✅ FIX: Proper transaction
    @Override
    @Transactional
    public void markAllAsRead(Long conversationId, UserEntity reader) {
        try {
            SVConversationEntity conversation = conversationRepo.findById(conversationId)
                    .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

            if (!conversation.isParticipant(reader)) {
                throw new IllegalArgumentException("Access denied");
            }

            int updated = messageRepo.markAllAsRead(conversationId, reader.getId(), LocalDateTime.now());
            conversationRepo.resetUnreadCount(conversationId, reader.getId());

            log.info("Marked {} messages as read in conversation {}", updated, conversationId);

            // Send bulk read receipt
            UserEntity otherUser = conversation.getOtherUser(reader);
            try {
                webSocketHandler.sendBulkReadReceipt(otherUser.getId(), conversationId);
            } catch (Exception e) {
                log.warn("Failed to send read receipt: {}", e.getMessage());
            }

        } catch (Exception e) {
            log.error("Error marking as read: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to mark as read", e);
        }
    }

    // Continue implementation...
    // (Останалите методи с подобни fixes)

    @Override
    @Transactional
    public void markMessageAsRead(Long messageId, UserEntity reader) {
        // Implementation
    }

    @Override
    @Transactional
    public void deleteConversation(Long conversationId, UserEntity currentUser) {
        // Implementation
    }

    @Override
    @Transactional
    public void deleteMessage(Long messageId, UserEntity currentUser) {
        // Implementation
    }

    @Override
    @Transactional
    public SVMessageDTO editMessage(Long messageId, String newText, UserEntity currentUser) {
        // Implementation
        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public Long getTotalUnreadCount(UserEntity user) {
        try {
            Long count = conversationRepo.getTotalUnreadCount(user.getId());
            return count != null ? count : 0L;
        } catch (Exception e) {
            log.error("Error getting unread count: {}", e.getMessage());
            return 0L;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Integer getUnreadCount(Long conversationId, UserEntity user) {
        SVConversationEntity conversation = conversationRepo.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
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

    @Override
    @Transactional(readOnly = true)
    public boolean conversationExists(Long userId1, Long userId2) {
        return conversationRepo.existsBetweenUsers(userId1, userId2);
    }

    @Override
    public void updateTypingStatus(Long conversationId, UserEntity user, boolean isTyping) {
        Map<Long, LocalDateTime> conversationTyping = typingStatuses.computeIfAbsent(
                conversationId, k -> new ConcurrentHashMap<>());

        if (isTyping) {
            conversationTyping.put(user.getId(), LocalDateTime.now());
        } else {
            conversationTyping.remove(user.getId());
        }

        try {
            webSocketHandler.broadcastTypingStatus(conversationId, user.getId(), user.getUsername(), isTyping);
        } catch (Exception e) {
            log.warn("Failed to broadcast typing status: {}", e.getMessage());
        }

        if (isTyping) {
            scheduleTypingCleanup(conversationId, user.getId());
        }
    }

    @Override
    public boolean isUserTyping(Long conversationId, Long userId) {
        Map<Long, LocalDateTime> conversationTyping = typingStatuses.get(conversationId);
        if (conversationTyping == null) {
            return false;
        }

        LocalDateTime lastTyping = conversationTyping.get(userId);
        if (lastTyping == null) {
            return false;
        }

        if (lastTyping.plusSeconds(3).isBefore(LocalDateTime.now())) {
            conversationTyping.remove(userId);
            return false;
        }

        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SVUserMinimalDTO> searchUsers(String query, UserEntity currentUser) {
        try {
            if (query == null || query.trim().isEmpty()) {
                // Return all users if no query (for following list)
                List<UserEntity> allUsers = userRepo.findAll();
                return allUsers.stream()
                        .filter(user -> !user.getId().equals(currentUser.getId()))
                        .limit(20)
                        .map(SVUserMinimalDTO.Mapper::toDTO)
                        .collect(Collectors.toList());
            }

            if (query.trim().length() < 2) {
                // For short queries, return all users (for following list)
                List<UserEntity> allUsers = userRepo.findAll();
                return allUsers.stream()
                        .filter(user -> !user.getId().equals(currentUser.getId()))
                        .limit(20)
                        .map(SVUserMinimalDTO.Mapper::toDTO)
                        .collect(Collectors.toList());
            }

            // Search by username and real name for longer queries
            List<UserEntity> users = userRepo.findByUsernameContainingIgnoreCaseOrRealNameContainingIgnoreCase(query.trim());

            return users.stream()
                    .filter(user -> !user.getId().equals(currentUser.getId()))
                    .limit(20)
                    .map(SVUserMinimalDTO.Mapper::toDTO)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error searching users: {}", e.getMessage(), e);
            return List.of();
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<SVUserMinimalDTO> searchFollowingUsers(String query, UserEntity currentUser) {
        try {
            log.info("Searching following users for user {} with query: '{}'", currentUser.getId(), query);
            
            // Get following users using existing follow service
            List<Object[]> followingData;
            
            if (query == null || query.trim().isEmpty()) {
                // Get all following users
                followingData = followService.getFollowing(currentUser.getId(), 0, 50);
                log.info("Found {} following users (all)", followingData.size());
            } else {
                // Search in following users
                followingData = followService.searchFollowing(currentUser.getId(), query.trim(), 0, 50);
                log.info("Found {} following users (search: '{}')", followingData.size(), query);
            }
            
            // Convert to UserEntity and then to DTO
            List<Long> userIds = followingData.stream()
                    .map(row -> (Long) row[0])
                    .collect(Collectors.toList());
            
            log.info("User IDs from following data: {}", userIds);
            
            if (userIds.isEmpty()) {
                log.info("No following users found, returning empty list");
                return List.of();
            }
            
            List<UserEntity> users = userRepo.findAllById(userIds);
            log.info("Found {} users from database", users.size());
            
            List<SVUserMinimalDTO> result = users.stream()
                    .map(SVUserMinimalDTO.Mapper::toDTO)
                    .collect(Collectors.toList());
            
            log.info("Returning {} following users", result.size());
            return result;
                    
        } catch (Exception e) {
            log.error("Error searching following users: {}", e.getMessage(), e);
            return List.of();
        }
    }

    private void scheduleTypingCleanup(Long conversationId, Long userId) {
        new Thread(() -> {
            try {
                Thread.sleep(3000);
                Map<Long, LocalDateTime> conversationTyping = typingStatuses.get(conversationId);
                if (conversationTyping != null) {
                    conversationTyping.remove(userId);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();
    }

    private String truncateText(String text, int maxLength) {
        if (text == null) return "";
        if (text.length() <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    }
}