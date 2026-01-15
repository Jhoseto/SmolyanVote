package smolyanVote.smolyanVote.services.serviceImpl;

import io.livekit.server.RoomName;
import lombok.extern.slf4j.Slf4j;
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
import smolyanVote.smolyanVote.models.svmessenger.CallHistoryEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.repositories.svmessenger.SVConversationRepository;
import smolyanVote.smolyanVote.repositories.svmessenger.SVMessageRepository;
import smolyanVote.smolyanVote.repositories.svmessenger.CallHistoryRepository;
import smolyanVote.smolyanVote.services.interfaces.FollowService;
import smolyanVote.smolyanVote.services.interfaces.SVMessengerService;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVConversationDTO;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVMessageDTO;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVUserMinimalDTO;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVCallTokenResponse;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.CallHistoryDTO;
import smolyanVote.smolyanVote.websocket.svmessenger.SVMessengerWebSocketHandler;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

// LiveKit imports
import org.springframework.beans.factory.annotation.Value;
import io.livekit.server.AccessToken;
import io.livekit.server.RoomJoin;

@Service
@Slf4j
public class SVMessengerServiceImpl implements SVMessengerService {

    private final SVConversationRepository conversationRepo;
    private final SVMessageRepository messageRepo;
    private final CallHistoryRepository callHistoryRepo;
    private final UserRepository userRepo;
    private final SVMessengerWebSocketHandler webSocketHandler;
    private final FollowService followService;
    private final smolyanVote.smolyanVote.services.interfaces.MobilePushNotificationService pushNotificationService;

    private final Map<Long, Map<Long, LocalDateTime>> typingStatuses = new ConcurrentHashMap<>();

    // LiveKit configuration
    @Value("${livekit.api-key}")
    private String liveKitApiKey;

    @Value("${livekit.api-secret}")
    private String liveKitApiSecret;

    @Value("${livekit.websocket-url}")
    private String liveKitWebSocketUrl;

    public SVMessengerServiceImpl(
            SVConversationRepository conversationRepo,
            SVMessageRepository messageRepo,
            CallHistoryRepository callHistoryRepo,
            UserRepository userRepo,
            SVMessengerWebSocketHandler webSocketHandler,
            FollowService followService,
            smolyanVote.smolyanVote.services.interfaces.MobilePushNotificationService pushNotificationService) {
        this.conversationRepo = conversationRepo;
        this.messageRepo = messageRepo;
        this.callHistoryRepo = callHistoryRepo;
        this.userRepo = userRepo;
        this.webSocketHandler = webSocketHandler;
        this.followService = followService;
        this.pushNotificationService = pushNotificationService;
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
            // Try to find existing conversation (including hidden ones)
            List<SVConversationEntity> existingConvs = conversationRepo.findByTwoUsersIncludingHidden(
                    currentUser.getId(),
                    otherUserId,
                    PageRequest.of(0, 1));

            if (!existingConvs.isEmpty()) {
                SVConversationEntity conv = existingConvs.get(0);
                // If conversation was hidden, un-hide it for current user
                if (conv.isHiddenForUser(currentUser)) {
                    conv.unhideForUser(currentUser);
                    conv = conversationRepo.save(conv);
                }
                return SVConversationDTO.Mapper.toDTO(conv, currentUser);
            } else {
                UserEntity otherUser = userRepo.findById(otherUserId)
                        .orElseThrow(() -> new IllegalArgumentException("User not found"));

                SVConversationEntity newConv = new SVConversationEntity(currentUser, otherUser);
                newConv = conversationRepo.save(newConv);

                return SVConversationDTO.Mapper.toDTO(newConv, currentUser);
            }
        } catch (Exception e) {
            log.error("Error starting conversation: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to start conversation", e);
        }
    }

    // ✅ FIX: Proper transaction management
    @Override
    @Transactional
    public SVMessageDTO sendMessage(Long conversationId, String text, UserEntity sender) {
        return sendMessage(conversationId, text, sender, null);
    }

    /**
     * Send message with optional parent message (for replies)
     */
    @Transactional
    public SVMessageDTO sendMessage(Long conversationId, String text, UserEntity sender, Long parentMessageId) {
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

            // Set parent message if this is a reply
            if (parentMessageId != null) {
                SVMessageEntity parentMessage = messageRepo.findById(parentMessageId)
                        .orElseThrow(() -> new IllegalArgumentException("Parent message not found"));

                // Validate parent message is in the same conversation
                if (!parentMessage.getConversation().getId().equals(conversationId)) {
                    throw new IllegalArgumentException("Parent message must be in the same conversation");
                }

                message.setParentMessage(parentMessage);
            }

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

            // ✅ FACEBOOK MESSENGER STYLE: Изпращане на съобщението до И двамата (sender и
            // recipient)
            // Това гарантира реално време синхронизация на всички устройства (web и mobile)
            String recipientPrincipal = otherUser.getEmail() != null && !otherUser.getEmail().isBlank()
                    ? otherUser.getEmail().toLowerCase()
                    : otherUser.getUsername().toLowerCase();
            String senderPrincipal = sender.getEmail() != null && !sender.getEmail().isBlank()
                    ? sender.getEmail().toLowerCase()
                    : sender.getUsername().toLowerCase();

            // 1. Изпращане до получателя (за реално време получаване)
            boolean recipientReceived = false;
            try {
                webSocketHandler.sendPrivateMessageToUsername(recipientPrincipal, messageDTO);
                recipientReceived = true;
            } catch (Exception e) {
                log.warn("WebSocket message failed for recipient {}: {}", recipientPrincipal, e.getMessage());
            }

            // 2. Изпращане до изпращача (за реално време синхронизация на всички негови
            // устройства)
            try {
                webSocketHandler.sendPrivateMessageToUsername(senderPrincipal, messageDTO);
            } catch (Exception e) {
                log.error("WebSocket message failed for sender {}", senderPrincipal, e);
            }

            // 3. Маркиране като delivered ако recipient е получил съобщението
            if (recipientReceived) {
                message.markAsDelivered();
                messageRepo.save(message);
                messageDTO.setIsDelivered(true);
                messageDTO
                        .setDeliveredAt(message.getDeliveredAt().atZone(java.time.ZoneId.systemDefault()).toInstant());

                // Изпращане на delivery receipt до изпращача
                try {
                    webSocketHandler.sendDeliveryReceipt(senderPrincipal, message.getId(),
                            message.getConversation().getId());
                } catch (Exception e) {
                    log.error("Failed to send delivery receipt for message {}: {}", message.getId(), e.getMessage());
                }
            } else {
                messageDTO.setIsDelivered(false);
            }

            // 4. ✅ ВИНАГИ изпращане на push notification (независимо дали WebSocket работи
            // или не)
            // Това гарантира че потребителят получава нотификация дори ако е offline или в
            // background
            try {
                String senderName = sender.getRealName() != null && !sender.getRealName().isBlank()
                        ? sender.getRealName()
                        : sender.getUsername();
                String messagePreview = text.length() > 100 ? text.substring(0, 100) + "..." : text;
                pushNotificationService.sendNewMessageNotification(
                        otherUser.getId(),
                        senderName,
                        messagePreview,
                        conversationId);
            } catch (Exception pushError) {
                log.error("❌ Failed to send push notification: {}", pushError.getMessage());
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
    @org.springframework.retry.annotation.Retryable(retryFor = {
            org.springframework.dao.CannotAcquireLockException.class,
            org.hibernate.exception.LockAcquisitionException.class }, maxAttempts = 3, backoff = @org.springframework.retry.annotation.Backoff(delay = 100, multiplier = 2, maxDelay = 1000))
    public void markAllAsRead(Long conversationId, UserEntity reader) {
        try {
            SVConversationEntity conversation = conversationRepo.findById(conversationId)
                    .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

            if (!conversation.isParticipant(reader)) {
                throw new IllegalArgumentException("Access denied");
            }

            messageRepo.markAllAsRead(conversationId, reader.getId(), LocalDateTime.now());
            conversationRepo.resetUnreadCount(conversationId, reader.getId());

            // Send bulk read receipt (по principal name - нормализирано на lowercase)
            UserEntity otherUser = conversation.getOtherUser(reader);
            if (otherUser != null) {
                try {
                    String otherPrincipal = otherUser.getEmail() != null && !otherUser.getEmail().isBlank()
                            ? otherUser.getEmail().toLowerCase()
                            : otherUser.getUsername().toLowerCase();
                    if (otherPrincipal != null && !otherPrincipal.isBlank()) {
                        webSocketHandler.sendBulkReadReceipt(otherPrincipal, conversationId);
                    } else {
                        // Skip - other user has no valid principal name
                    }
                } catch (Exception e) {
                    log.error("Failed to send read receipt", e);
                }
            } else {
                // Skip - other user is null
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
            List<Long> affectedConversations = messageRepo
                    .findConversationsWithUndeliveredMessagesForUser(user.getId());

            // Маркирай всички не-delivered съобщения като delivered
            messageRepo.markAllUndeliveredAsDeliveredForUser(user.getId(), LocalDateTime.now());

            // Изпрати bulk delivery receipt ако има засегнати conversations (по principal
            // name - нормализирано на lowercase)
            if (!affectedConversations.isEmpty()) {
                String userPrincipal = user.getEmail() != null && !user.getEmail().isBlank()
                        ? user.getEmail().toLowerCase()
                        : user.getUsername().toLowerCase();
                webSocketHandler.sendBulkDeliveryReceipt(userPrincipal, affectedConversations);
            }
        } catch (Exception e) {
            log.error("Error marking undelivered messages as delivered for user {}: {}", user.getId(), e.getMessage(),
                    e);
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
            log.error("Failed to broadcast typing status", e);
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
            String searchQuery = (query == null) ? "" : query.trim();

            if (searchQuery.isEmpty() || searchQuery.length() < 2) {
                // За празен или много кратък query, връщаме първите 20 активни потребители
                // Използваме Pageable за по-добра производителност
                org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0,
                        20,
                        org.springframework.data.domain.Sort.by("username").ascending());

                org.springframework.data.domain.Page<UserEntity> userPage = userRepo.findAll(pageable);

                return userPage.getContent().stream()
                        .filter(user -> !user.getId().equals(currentUser.getId()))
                        .map(SVUserMinimalDTO.Mapper::toDTO)
                        .collect(Collectors.toList());
            }

            // Search by username and real name for longer queries (2+ characters)
            List<UserEntity> users = userRepo
                    .findByUsernameContainingIgnoreCaseOrRealNameContainingIgnoreCase(searchQuery);

            return users.stream()
                    .filter(user -> !user.getId().equals(currentUser.getId()))
                    .limit(50) // Увеличаваме лимита за търсене, за да покажем повече резултати
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
        if (text == null)
            return "";
        if (text.length() <= maxLength)
            return text;
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
                    conversationId);

        } catch (Exception e) {
            log.error("Error generating LiveKit call token for conversation {}: {}", conversationId, e.getMessage(), e);
            throw new RuntimeException("Failed to generate call token", e);
        }
    }

    // ========== CALL HISTORY ==========

    @Override
    @Transactional
    public void saveCallHistory(Long conversationId, Long callerId, Long receiverId,
            java.time.Instant startTime, java.time.Instant endTime,
            String status, Boolean isVideoCall) {
        try {
            // CRITICAL FIX: Check for duplicate call history entries
            // Prevent saving duplicate entries for the same call (same conversation,
            // caller, receiver, startTime within 5 seconds)
            // This prevents issues when both CALL_REJECT and CALL_END signals are sent
            java.time.Instant fiveSecondsAgo = startTime.minusSeconds(5);
            java.time.Instant fiveSecondsLater = startTime.plusSeconds(5);

            List<CallHistoryEntity> existingEntries = callHistoryRepo
                    .findByConversationIdOrderByStartTimeDesc(conversationId);
            // CRITICAL FIX: Check for duplicate entries with the same status
            // This prevents duplicate ACCEPTED entries when both participants send CALL_END
            // Also check reverse caller/receiver (in case participants are swapped)
            boolean duplicateExists = existingEntries.stream()
                    .anyMatch(existing ->
                    // Check same caller/receiver
                    ((existing.getCallerId().equals(callerId) &&
                            existing.getReceiverId().equals(receiverId)) ||
                    // OR check reverse caller/receiver (in case participants are swapped)
                            (existing.getCallerId().equals(receiverId) &&
                                    existing.getReceiverId().equals(callerId)))
                            &&
                            existing.getStartTime().isAfter(fiveSecondsAgo) &&
                            existing.getStartTime().isBefore(fiveSecondsLater) &&
                            existing.getStatus() != null &&
                            existing.getStatus().toString().equals(status));

            if (duplicateExists) {
                return; // Skip saving duplicate entry
            }

            CallHistoryEntity callHistory = new CallHistoryEntity();
            callHistory.setConversationId(conversationId);
            callHistory.setCallerId(callerId);
            callHistory.setReceiverId(receiverId);
            callHistory.setStartTime(startTime);
            callHistory.setEndTime(endTime);
            callHistory.setIsVideoCall(isVideoCall != null ? isVideoCall : false);

            // Parse status
            CallHistoryEntity.CallStatus callStatus;
            try {
                callStatus = CallHistoryEntity.CallStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.error("Invalid call status: {}, defaulting to MISSED", status, e);
                callStatus = CallHistoryEntity.CallStatus.MISSED;
            }
            callHistory.setStatus(callStatus);

            // CRITICAL FIX: Calculate duration if call has both start and end time
            // Calculate for all calls (not just ACCEPTED) to have complete information
            if (endTime != null && startTime != null) {
                try {
                    // CRITICAL: Use ChronoUnit.SECONDS.between() for more reliable calculation
                    long durationSeconds = java.time.temporal.ChronoUnit.SECONDS.between(startTime, endTime);

                    // CRITICAL: Only set duration if it's non-negative (endTime >= startTime)
                    // Negative duration would indicate data corruption or incorrect timestamps
                    if (durationSeconds >= 0) {
                        callHistory.setDurationSeconds(durationSeconds);
                    } else {
                        log.error(
                                "Negative duration calculated for call history: startTime={}, endTime={}, duration={}s",
                                startTime, endTime, durationSeconds);
                        callHistory.setDurationSeconds(0L);
                    }
                } catch (Exception e) {
                    log.error("Error calculating duration: startTime={}, endTime={}", startTime, endTime, e);
                    callHistory.setDurationSeconds(null);
                }
            } else {
                callHistory.setDurationSeconds(null);
            }

            // CRITICAL: Save the call history to database
            try {
                callHistoryRepo.save(callHistory);
            } catch (Exception e) {
                log.error("Failed to save call history", e);
                return; // Don't send notifications if save failed
            }

            // CRITICAL: Notify participants about call history update via WebSocket
            try {
                SVConversationEntity conversation = conversationRepo.findById(conversationId).orElse(null);
                if (conversation != null) {
                    // Get both participants and send WebSocket notification
                    UserEntity caller = userRepo.findById(callerId).orElse(null);
                    UserEntity receiver = userRepo.findById(receiverId).orElse(null);

                    // Send notification to caller
                    if (caller != null) {
                        String callerPrincipal = caller.getEmail() != null && !caller.getEmail().isBlank()
                                ? caller.getEmail().toLowerCase()
                                : caller.getUsername().toLowerCase();
                        webSocketHandler.sendCallHistoryUpdate(callerPrincipal, conversationId);
                    }

                    // Send notification to receiver
                    if (receiver != null) {
                        String receiverPrincipal = receiver.getEmail() != null && !receiver.getEmail().isBlank()
                                ? receiver.getEmail().toLowerCase()
                                : receiver.getUsername().toLowerCase();
                        webSocketHandler.sendCallHistoryUpdate(receiverPrincipal, conversationId);
                    }
                }
            } catch (Exception e) {
                log.error("Failed to send call history update notification", e);
                // Don't throw - this is a non-critical operation
            }
        } catch (Exception e) {
            log.error("Error saving call history: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save call history", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<CallHistoryDTO> getCallHistory(Long conversationId, UserEntity currentUser) {
        try {
            // Validate user is participant
            SVConversationEntity conversation = conversationRepo.findById(conversationId)
                    .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

            if (!conversation.isParticipant(currentUser)) {
                throw new IllegalArgumentException("User is not a participant in this conversation");
            }

            // Get call history
            List<CallHistoryEntity> callHistoryList = callHistoryRepo
                    .findByConversationIdOrderByStartTimeDesc(conversationId);

            // Get other user for participant info
            UserEntity otherUser = conversation.getOtherUser(currentUser);

            // Map to DTOs
            return callHistoryList.stream()
                    .map(callHistory -> {
                        // Determine caller and receiver names/images
                        UserEntity caller = userRepo.findById(callHistory.getCallerId()).orElse(null);
                        UserEntity receiver = userRepo.findById(callHistory.getReceiverId()).orElse(null);

                        String callerName = caller != null
                                ? (caller.getRealName() != null && !caller.getRealName().isBlank()
                                        ? caller.getRealName()
                                        : caller.getUsername())
                                : "Unknown";
                        String callerImageUrl = caller != null ? caller.getImageUrl() : null;

                        String receiverName = receiver != null
                                ? (receiver.getRealName() != null && !receiver.getRealName().isBlank()
                                        ? receiver.getRealName()
                                        : receiver.getUsername())
                                : "Unknown";
                        String receiverImageUrl = receiver != null ? receiver.getImageUrl() : null;

                        return CallHistoryDTO.Mapper.toDTO(callHistory, callerName, callerImageUrl, receiverName,
                                receiverImageUrl);
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting call history for conversation {}: {}", conversationId, e.getMessage(), e);
            throw new RuntimeException("Failed to get call history", e);
        }
    }

    @Override
    @Transactional
    public void handleCallSignalForHistory(smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVCallSignalDTO signal) {
        try {
            // Only handle signals that require call history to be saved
            if (signal.getEventType() == null) {
                return;
            }

            smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVCallEventType eventType = signal.getEventType();

            // Determine if this event requires call history to be saved
            // Handle both web (CALL_END/CALL_REJECT) and mobile
            // (CALL_ENDED/CALL_REJECTED/CALL_CANCEL)
            // signals
            if (eventType != smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVCallEventType.CALL_END &&
                    eventType != smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVCallEventType.CALL_REJECT &&
                    eventType != smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVCallEventType.CALL_ENDED &&
                    eventType != smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVCallEventType.CALL_REJECTED &&
                    eventType != smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVCallEventType.CALL_CANCEL) {
                return;
            }

            // Parse timestamps
            java.time.Instant startTime;
            java.time.Instant endTime;

            try {
                if (signal.getStartTime() != null && !signal.getStartTime().isBlank()) {
                    startTime = java.time.Instant.parse(signal.getStartTime());
                } else {
                    startTime = signal.getTimestamp() != null ? signal.getTimestamp() : java.time.Instant.now();
                }

                if (signal.getEndTime() != null && !signal.getEndTime().isBlank()) {
                    endTime = java.time.Instant.parse(signal.getEndTime());
                } else {
                    endTime = java.time.Instant.now();
                }
            } catch (Exception e) {
                log.error("Error parsing timestamps for call history", e);
                startTime = java.time.Instant.now();
                endTime = java.time.Instant.now();
            }

            // Calculate duration in seconds
            long durationSeconds = 0;
            if (startTime != null && endTime != null) {
                durationSeconds = java.time.temporal.ChronoUnit.SECONDS.between(startTime, endTime);
                if (durationSeconds < 0)
                    durationSeconds = 0;
            }

            // CRITICAL: Log call history data for debugging
            log.debug(
                    "📞 [handleCallSignalForHistory] Processing call history: conversationId={}, callerId={}, receiverId={}, "
                            +
                            "startTime={}, endTime={}, durationSeconds={}, wasConnected={}, eventType={}",
                    signal.getConversationId(), signal.getCallerId(), signal.getReceiverId(),
                    startTime, endTime, durationSeconds, signal.getWasConnected(), eventType);

            // CRITICAL FIX: Determine correct status based on Event Type AND Duration
            String callStatus;

            if (eventType == smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVCallEventType.CALL_REJECT ||
                    eventType == smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVCallEventType.CALL_REJECTED) {
                // If explicitly rejected, it's REJECTED
                callStatus = "REJECTED";
                durationSeconds = 0; // Rejected calls have 0 duration
            } else if (eventType == smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVCallEventType.CALL_CANCEL) {
                // Caller cancelled before answer -> MISSED for receiver
                callStatus = "MISSED";
                durationSeconds = 0;
            } else {
                // It's CALL_END / CALL_ENDED
                Boolean wasConnected = signal.getWasConnected();

                // CRITICAL FIX: Improved logic to determine if call was successful
                // A call is ACCEPTED if:
                // 1. wasConnected flag is explicitly true, OR
                // 2. duration is > 1 second (indicating actual conversation happened)
                // This prevents false MISSED/CANCELLED status when wasConnected flag is missing
                // but call was successful
                boolean isAccepted = Boolean.TRUE.equals(wasConnected) || durationSeconds > 1;

                if (isAccepted) {
                    // Call was connected -> ACCEPTED
                    callStatus = "ACCEPTED";
                    // Ensure duration is at least 1s if it was connected but duration calc is 0 or
                    // negative
                    if (durationSeconds <= 0)
                        durationSeconds = 1;
                    log.debug(
                            "📞 [handleCallSignalForHistory] Call marked as ACCEPTED: conversationId={}, duration={}s, wasConnected={}",
                            signal.getConversationId(), durationSeconds, wasConnected);
                } else {
                    log.debug(
                            "📞 [handleCallSignalForHistory] Call marked as {}: conversationId={}, duration={}s, wasConnected={}",
                            (signal.getCallerId().equals(signal.getReceiverId()) ? "MISSED" : "CANCELLED"),
                            signal.getConversationId(), durationSeconds, wasConnected);
                    // Duration is <= 1 second and not connected
                    // This means call was never actually connected (rejected before accept or
                    // cancelled immediately)
                    // If Caller ended it -> CANCELLED
                    // If Receiver ended it -> MISSED

                    if (signal.getCallerId().equals(signal.getReceiverId())) {
                        callStatus = "MISSED";
                    } else {
                        // Assumption: CALL_END with 0 duration and not connected = Cancelled by Caller
                        callStatus = "CANCELLED";
                    }
                }
            }

            // CRITICAL FIX: Check for duplicate entries
            // 1. If we are about to save CANCELLED/MISSED, check if there is already a
            // REJECTED/ACCEPTED entry for this call
            // 2. If we are about to save ACCEPTED, check if there is already an entry

            // INCREASED WINDOW to 10 seconds to catch slower race conditions
            java.time.Instant fiveSecondsAgo = startTime.minusSeconds(10);
            java.time.Instant fiveSecondsLater = startTime.plusSeconds(10);

            List<CallHistoryEntity> existingEntries = callHistoryRepo
                    .findByConversationIdOrderByStartTimeDesc(signal.getConversationId());
            boolean entryExists = existingEntries.stream()
                    .anyMatch(existing ->
                    // Check same conversation and participants
                    ((existing.getCallerId().equals(signal.getCallerId()) &&
                            existing.getReceiverId().equals(signal.getReceiverId())) ||
                            (existing.getCallerId().equals(signal.getReceiverId()) &&
                                    existing.getReceiverId().equals(signal.getCallerId())))
                            &&
                            // Check time window
                            existing.getStartTime().isAfter(fiveSecondsAgo) &&
                            existing.getStartTime().isBefore(fiveSecondsLater)
                    // REMOVED STATUS LOGIC: If ANY entry exists in this small window, assume it's
                    // the same call termination.
                    // This is safer to avoid duplicates.
                    );

            if (entryExists) {
                // CRITICAL FIX: Prioritize ACCEPTED status
                // If the NEW signal is ACCEPTED (wasConnected=true or duration > 0),
                // but the EXISTING entry is MISSED/CANCELLED, we should UPDATE the existing
                // entry
                // instead of ignoring the new one.

                boolean newIsAccepted = "ACCEPTED".equals(callStatus);

                if (newIsAccepted) {
                    // Find the existing entry that we might want to upgrade
                    CallHistoryEntity existingMisrepresented = existingEntries.stream()
                            .filter(existing -> ((existing.getCallerId().equals(signal.getCallerId())
                                    && existing.getReceiverId().equals(signal.getReceiverId())) ||
                                    (existing.getCallerId().equals(signal.getReceiverId())
                                            && existing.getReceiverId().equals(signal.getCallerId())))
                                    &&
                                    existing.getStartTime().isAfter(fiveSecondsAgo) &&
                                    existing.getStartTime().isBefore(fiveSecondsLater) &&
                                    ("MISSED".equals(existing.getStatus()) || "CANCELLED".equals(existing.getStatus())))
                            .findFirst()
                            .orElse(null);

                    if (existingMisrepresented != null) {
                        // Upgrade the existing entry to ACCEPTED and update duration
                        existingMisrepresented.setStatus(CallHistoryEntity.CallStatus.ACCEPTED);
                        existingMisrepresented.setEndTime(endTime);
                        // Recalculate duration for the upgraded entry
                        long fixedDuration = durationSeconds > 0 ? durationSeconds : 1;
                        // Note: Entity doesn't store duration directly usually, but calculated from
                        // start/end
                        // Ensure endTime provided gives > 0 duration relative to existing start time
                        if (existingMisrepresented.getStartTime().equals(existingMisrepresented.getEndTime()) ||
                                existingMisrepresented.getEndTime().isBefore(existingMisrepresented.getStartTime())) {
                            existingMisrepresented
                                    .setEndTime(existingMisrepresented.getStartTime().plusSeconds(fixedDuration));
                        }

                        callHistoryRepo.save(existingMisrepresented);
                        log.info(
                                "Refined Call History: Upgraded MISSED/CANCELLED entry to ACCEPTED for conversation {}",
                                signal.getConversationId());
                        return;
                    }
                }

                return; // Duplicate avoided (and no upgrade needed)
            }

            // CRITICAL FIX: Use isVideoCall from signal if provided, otherwise default to
            // false
            Boolean isVideoCall = signal.getIsVideoCall() != null ? signal.getIsVideoCall() : false;

            // Save call history
            saveCallHistory(
                    signal.getConversationId(),
                    signal.getCallerId(),
                    signal.getReceiverId(),
                    startTime,
                    endTime,
                    callStatus,
                    isVideoCall);
        } catch (Exception e) {
            log.error("Failed to handle call signal for history", e);
        }
    }

}