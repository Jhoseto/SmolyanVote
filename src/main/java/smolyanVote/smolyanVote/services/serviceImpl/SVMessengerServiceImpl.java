package smolyanVote.smolyanVote.services.serviceImpl;

import io.livekit.server.RoomName;
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
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVCallTokenResponse;
import smolyanVote.smolyanVote.websocket.svmessenger.SVMessengerWebSocketHandler;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

// LiveKit imports
import org.springframework.beans.factory.annotation.Value;
import io.livekit.server.AccessToken;
import io.livekit.server.RoomJoin;
import io.livekit.server.VideoGrant;

@Service
@Slf4j
public class SVMessengerServiceImpl implements SVMessengerService {

    private final SVConversationRepository conversationRepo;
    private final SVMessageRepository messageRepo;
    private final UserRepository userRepo;
    private final SVMessengerWebSocketHandler webSocketHandler;
    private final FollowService followService;

    private final Map<Long, Map<Long, LocalDateTime>> typingStatuses = new ConcurrentHashMap<>();

    // LiveKit configuration
    @Value("${livekit.api-key}")
    private String liveKitApiKey;

    @Value("${livekit.api-secret}")
    private String liveKitApiSecret;

    @Value("${livekit.websocket-url}")
    private String liveKitWebSocketUrl;

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

            // Try to find existing conversation (including hidden ones)
            return conversationRepo.findByTwoUsersIncludingHidden(currentUser.getId(), otherUserId)
                    .map(conv -> {
                        // If conversation was hidden, un-hide it for current user
                        if (conv.isHiddenForUser(currentUser)) {
                            conv.unhideForUser(currentUser);
                            conv = conversationRepo.save(conv);
                        }
                        return SVConversationDTO.Mapper.toDTO(conv, currentUser);
                    })
                    .orElseGet(() -> {
                        UserEntity otherUser = userRepo.findById(otherUserId)
                                .orElseThrow(() -> new IllegalArgumentException("User not found"));

                        SVConversationEntity newConv = new SVConversationEntity(currentUser, otherUser);
                        newConv = conversationRepo.save(newConv);

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

            // Get conversation
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

            // ✅ Ако разговорът е бил hidden за получателя, го un-hide-ваме автоматично
            // Защото когато някой ти пише, разговорът трябва да се покаже в твоя списък
            if (conversation.isHiddenForUser(otherUser)) {
                conversation.unhideForUser(otherUser);
            }

            conversation.incrementUnreadFor(otherUser);

            conversationRepo.save(conversation);

            // Convert to DTO
            SVMessageDTO messageDTO = SVMessageDTO.Mapper.toDTO(message);

            // Send via WebSocket (route by principal name: email -> username fallback)
            try {
                String recipientPrincipal = otherUser.getEmail() != null && !otherUser.getEmail().isBlank()
                        ? otherUser.getEmail()
                        : otherUser.getUsername();
                webSocketHandler.sendPrivateMessageToUsername(recipientPrincipal, messageDTO);

                // ✅ SUCCESS: WebSocket message sent successfully (recipient is online)
                // Mark as delivered and send delivery receipt to sender
                message.markAsDelivered();
                messageRepo.save(message);
                messageDTO.setIsDelivered(true);
                messageDTO.setDeliveredAt(message.getDeliveredAt().atZone(java.time.ZoneId.systemDefault()).toInstant());

                // Send delivery receipt to sender (only if message was successfully delivered)
                try {
                    String senderPrincipal = sender.getEmail() != null && !sender.getEmail().isBlank()
                            ? sender.getEmail()
                            : sender.getUsername();
                    webSocketHandler.sendDeliveryReceipt(senderPrincipal, message.getId(), message.getConversation().getId());
                } catch (Exception e) {
                    log.error("Failed to send delivery receipt for message {}: {}", message.getId(), e.getMessage());
                }

            } catch (Exception e) {
                // ❌ FAILED: WebSocket message failed (recipient is offline)
                // Keep message as "sent" only (1 gray checkmark) - no delivery receipt
                log.warn("WebSocket message failed for message {}: {}", message.getId(), e.getMessage());
                messageDTO.setIsDelivered(false);
            }

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


            // Send bulk read receipt (по principal name)
            UserEntity otherUser = conversation.getOtherUser(reader);
            if (otherUser != null) {
                try {
                    String otherPrincipal = otherUser.getEmail() != null && !otherUser.getEmail().isBlank()
                            ? otherUser.getEmail()
                            : otherUser.getUsername();
                    if (otherPrincipal != null && !otherPrincipal.isBlank()) {
                        webSocketHandler.sendBulkReadReceipt(otherPrincipal, conversationId);
                    } else {
                        log.warn("Cannot send read receipt: other user has no valid principal name");
                    }
                } catch (Exception e) {
                    log.warn("Failed to send read receipt: {}", e.getMessage());
                }
            } else {
                log.warn("Cannot send read receipt: other user is null");
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
    public void markAllUndeliveredAsDeliveredForUser(UserEntity user) {
        try {
            // Намери всички conversations които имат не-delivered съобщения за този user
            List<Long> affectedConversations = messageRepo.findConversationsWithUndeliveredMessagesForUser(user.getId());

            // Маркирай всички не-delivered съобщения като delivered
            int updated = messageRepo.markAllUndeliveredAsDeliveredForUser(user.getId(), LocalDateTime.now());

            // Изпрати bulk delivery receipt ако има засегнати conversations (по principal name)
            if (!affectedConversations.isEmpty()) {
                String userPrincipal = user.getEmail() != null && !user.getEmail().isBlank()
                        ? user.getEmail()
                        : user.getUsername();
                webSocketHandler.sendBulkDeliveryReceipt(userPrincipal, affectedConversations);
            }
        } catch (Exception e) {
            log.error("Error marking undelivered messages as delivered for user {}: {}", user.getId(), e.getMessage(), e);
        }
    }

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
    public void hideConversation(Long conversationId, UserEntity currentUser) {
        // Find conversation and validate user is participant
        SVConversationEntity conversation = conversationRepo.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        if (!conversation.isParticipant(currentUser)) {
            throw new IllegalArgumentException("User is not participant in this conversation");
        }

        // ✅ FIX: Едностранно hiding - само за текущия потребител
        conversation.hideForUser(currentUser);
        conversationRepo.save(conversation);

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
            
            // Get following users using existing follow service
            List<Object[]> followingData;
            
            if (query == null || query.trim().isEmpty()) {
                // Get all following users
                followingData = followService.getFollowing(currentUser.getId(), 0, 50);
            } else {
                // Search in following users
                followingData = followService.searchFollowing(currentUser.getId(), query.trim(), 0, 50);
            }
            
            // Convert to UserEntity and then to DTO
            List<Long> userIds = followingData.stream()
                    .map(row -> (Long) row[0])
                    .collect(Collectors.toList());
            
            
            if (userIds.isEmpty()) {
                return List.of();
            }
            
            List<UserEntity> users = userRepo.findAllById(userIds);
            
            List<SVUserMinimalDTO> result = users.stream()
                    .map(SVUserMinimalDTO.Mapper::toDTO)
                    .collect(Collectors.toList());
            
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

    /**
     * Маркирай съобщение като доставено
     * Извиква се автоматично когато WebSocket успешно достави съобщението
     */
    @Transactional
    @Override
    public void markMessageAsDelivered(Long messageId) {
        try {
            SVMessageEntity message = messageRepo.findById(messageId)
                    .orElseThrow(() -> new IllegalArgumentException("Message not found"));

            message.markAsDelivered();
            messageRepo.save(message);


        } catch (Exception e) {
            log.error("Error marking message as delivered: {}", e.getMessage(), e);
        }
    }

    // ========== VOICE CALLS ==========

    @Override
    public SVCallTokenResponse generateCallToken(Long conversationId, UserEntity currentUser) {
        try {
            // Валидирай че conversation съществува и user е participant
            SVConversationEntity conversation = conversationRepo.findById(conversationId)
                    .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

            if (!conversation.isParticipant(currentUser)) {
                throw new IllegalArgumentException("User is not a participant in this conversation");
            }

            // Създай уникално room name базирано на conversation ID
            String roomName = "svm-conversation-" + conversationId;

            // ✅ ПРАВИЛЕН КОД - С GRANTS!
            AccessToken token = new AccessToken(liveKitApiKey, liveKitApiSecret);
            token.setIdentity(String.valueOf(currentUser.getId()));
            token.setName(currentUser.getUsername());

            // ⭐ ТОВА Е КЛЮЧОВОТО - ДОБАВИ GRANTS!
            token.addGrants(new RoomJoin(true), new RoomName(roomName));

            String jwtToken = token.toJwt();

            // Върни response
            return new SVCallTokenResponse(
                    jwtToken,
                    roomName,
                    liveKitWebSocketUrl,
                    conversationId
            );

        } catch (Exception e) {
            log.error("Error generating LiveKit call token for conversation {}: {}", conversationId, e.getMessage(), e);
            throw new RuntimeException("Failed to generate call token", e);
        }
    }

}