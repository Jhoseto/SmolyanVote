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
import smolyanVote.smolyanVote.models.svmessenger.MessageType;
import smolyanVote.smolyanVote.models.svmessenger.SVMessageFlagEntity;
import smolyanVote.smolyanVote.models.svmessenger.SVMessagePollOptionEntity;
import smolyanVote.smolyanVote.models.svmessenger.SVMessagePollVoteEntity;
import smolyanVote.smolyanVote.models.svmessenger.SVMessageReactionEntity;
import smolyanVote.smolyanVote.models.svmessenger.SVMessengerE2EKeyEntity;
import smolyanVote.smolyanVote.models.svmessenger.ConversationType;
import smolyanVote.smolyanVote.models.svmessenger.ParticipantRole;
import smolyanVote.smolyanVote.models.svmessenger.SVConversationParticipantEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.repositories.svmessenger.SVConversationParticipantRepository;
import smolyanVote.smolyanVote.repositories.svmessenger.SVConversationRepository;
import smolyanVote.smolyanVote.repositories.svmessenger.SVMessageFlagRepository;
import smolyanVote.smolyanVote.repositories.svmessenger.SVMessagePollRepository;
import smolyanVote.smolyanVote.repositories.svmessenger.SVMessagePollVoteRepository;
import smolyanVote.smolyanVote.repositories.svmessenger.SVMessengerE2EKeyRepository;
import smolyanVote.smolyanVote.repositories.svmessenger.SVMessageReactionRepository;
import smolyanVote.smolyanVote.repositories.svmessenger.SVMessageRepository;
import smolyanVote.smolyanVote.repositories.svmessenger.CallHistoryRepository;
import smolyanVote.smolyanVote.services.interfaces.FollowService;
import smolyanVote.smolyanVote.services.interfaces.SVMessengerService;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVAttachmentDTO;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVConversationDTO;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVMessageDTO;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVParticipantDTO;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVE2EPublicKeyDTO;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVPollDTO;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVReactionSummaryDTO;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVUserMinimalDTO;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVCallTokenResponse;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.CallHistoryDTO;
import smolyanVote.smolyanVote.websocket.svmessenger.SVMessengerWebSocketHandler;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    private final SVConversationParticipantRepository participantRepo;
    private final SVMessageRepository messageRepo;
    private final CallHistoryRepository callHistoryRepo;
    private final SVMessageReactionRepository reactionRepo;
    private final SVMessageFlagRepository flagRepo;
    private final SVMessagePollRepository pollRepo;
    private final SVMessagePollVoteRepository pollVoteRepo;
    private final SVMessengerE2EKeyRepository e2eKeyRepo;
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
            SVConversationParticipantRepository participantRepo,
            SVMessageRepository messageRepo,
            CallHistoryRepository callHistoryRepo,
            SVMessageReactionRepository reactionRepo,
            SVMessageFlagRepository flagRepo,
            SVMessagePollRepository pollRepo,
            SVMessagePollVoteRepository pollVoteRepo,
            SVMessengerE2EKeyRepository e2eKeyRepo,
            UserRepository userRepo,
            SVMessengerWebSocketHandler webSocketHandler,
            FollowService followService,
            smolyanVote.smolyanVote.services.interfaces.MobilePushNotificationService pushNotificationService) {
        this.conversationRepo = conversationRepo;
        this.participantRepo = participantRepo;
        this.messageRepo = messageRepo;
        this.callHistoryRepo = callHistoryRepo;
        this.reactionRepo = reactionRepo;
        this.flagRepo = flagRepo;
        this.pollRepo = pollRepo;
        this.pollVoteRepo = pollVoteRepo;
        this.e2eKeyRepo = e2eKeyRepo;
        this.userRepo = userRepo;
        this.webSocketHandler = webSocketHandler;
        this.followService = followService;
        this.pushNotificationService = pushNotificationService;
    }

    // ✅ FIX: readOnly=true за read operations
    @Override
    @Transactional(readOnly = true)
    public List<SVConversationDTO> getAllConversations(UserEntity currentUser) {
        return getAllConversations(currentUser, false);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SVConversationDTO> getAllConversations(UserEntity currentUser, boolean includeGroups) {
        try {

            List<SVConversationEntity> conversations = conversationRepo.findAllActiveByUser(currentUser.getId());

            // ✅ Mapping вътре в transaction scope
            List<SVConversationDTO> result = conversations.stream()
                    .map(conv -> {
                        UserEntity otherUser = conv.getOtherUser(currentUser);
                        boolean isTyping = isUserTyping(conv.getId(), otherUser.getId());
                        return SVConversationDTO.Mapper.toDTO(conv, currentUser, isTyping);
                    })
                    .collect(Collectors.toCollection(ArrayList::new));

            if (includeGroups) {
                result.addAll(loadGroupConversations(currentUser));
                result.sort((a, b) -> {
                    Instant left = a.getLastMessageTime();
                    Instant right = b.getLastMessageTime();
                    if (left == null && right == null) return 0;
                    if (left == null) return 1;
                    if (right == null) return -1;
                    return right.compareTo(left);
                });
            }

            return result;
        } catch (Exception e) {
            log.error("Error getting conversations for user {}: {}", currentUser.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to load conversations", e);
        }
    }

    private List<SVConversationDTO> loadGroupConversations(UserEntity currentUser) {
        List<SVConversationEntity> groups = conversationRepo.findActiveGroupsByUser(currentUser.getId());
        if (groups.isEmpty()) {
            return List.of();
        }

        List<Long> ids = groups.stream().map(SVConversationEntity::getId).toList();
        Map<Long, List<SVConversationParticipantEntity>> rosterByConversation =
                participantRepo.findActiveByConversations(ids).stream()
                        .collect(Collectors.groupingBy(p -> p.getConversation().getId()));

        return groups.stream()
                .map(group -> SVConversationDTO.Mapper.toGroupDTO(
                        group,
                        currentUser,
                        rosterByConversation.getOrDefault(group.getId(), List.of()),
                        isAnyoneTyping(group.getId(), currentUser.getId())))
                .filter(java.util.Objects::nonNull)
                .toList();
    }

    // ✅ FIX: readOnly=true
    @Override
    @Transactional(readOnly = true)
    public SVConversationDTO getConversation(Long conversationId, UserEntity currentUser) {
        try {
            SVConversationEntity conversation = conversationRepo.findById(conversationId)
                    .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

            if (!hasAccess(conversation, currentUser)) {
                throw new IllegalArgumentException("Access denied to this conversation");
            }

            if (conversation.isGroup()) {
                return SVConversationDTO.Mapper.toGroupDTO(
                        conversation,
                        currentUser,
                        participantRepo.findActiveByConversation(conversationId),
                        isAnyoneTyping(conversationId, currentUser.getId()));
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
        return sendMessage(conversationId, text, sender, parentMessageId, null, null);
    }

    /**
     * Send message with an optional attachment (image, file or voice note).
     * Text may be blank when an attachment is present.
     */
    @Transactional
    public SVMessageDTO sendMessage(Long conversationId, String text, UserEntity sender, Long parentMessageId,
            String messageType, SVAttachmentDTO attachment) {
        try {
            boolean hasAttachment = attachment != null && attachment.getUrl() != null
                    && !attachment.getUrl().isBlank();
            String body = text == null ? "" : text.trim();

            // Validation
            if (body.isEmpty() && !hasAttachment) {
                throw new IllegalArgumentException("Message cannot be empty");
            }

            if (body.length() > 3000) {
                throw new IllegalArgumentException("Съобщението е твърде дълго (максимум 3000 символа)");
            }

            // Get conversation
            SVConversationEntity conversation = conversationRepo.findById(conversationId)
                    .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

            if (!hasAccess(conversation, sender)) {
                throw new IllegalArgumentException("Access denied");
            }

            // Create message
            SVMessageEntity message = new SVMessageEntity(conversation, sender, body);
            message.setMessageType(resolveMessageType(messageType, attachment));

            if (hasAttachment) {
                message.setAttachmentUrl(attachment.getUrl());
                message.setAttachmentName(attachment.getName());
                message.setAttachmentSize(attachment.getSize());
                message.setAttachmentMime(attachment.getMime());
            }

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

            String preview = body.isEmpty()
                    ? attachmentPreview(message.getMessageType())
                    : (body.startsWith("§E2E1§") ? "🔒 Криптирано съобщение" : body);

            // Update conversation
            conversation.setLastMessagePreview(truncateText(preview, 2900));
            conversation.setUpdatedAt(LocalDateTime.now());

            List<UserEntity> recipients = recipientsOf(conversation, sender);

            if (conversation.isGroup()) {
                // Групите държат unread и hidden в participants таблицата.
                participantRepo.incrementUnreadForOthers(conversationId, sender.getId());
                participantRepo.unhideForAll(conversationId);
            } else {
                for (UserEntity recipient : recipients) {
                    // ✅ Ако разговорът е бил hidden за получателя, го un-hide-ваме автоматично
                    // Защото когато някой ти пише, разговорът трябва да се покаже в твоя списък
                    if (conversation.isHiddenForUser(recipient)) {
                        conversation.unhideForUser(recipient);
                    }
                    conversation.incrementUnreadFor(recipient);
                }
            }

            conversationRepo.save(conversation);

            // Convert to DTO
            SVMessageDTO messageDTO = SVMessageDTO.Mapper.toDTO(message);

            // ✅ FACEBOOK MESSENGER STYLE: Изпращане на съобщението до всички участници
            // (включително изпращача) за реално време синхронизация на всички устройства
            String senderPrincipal = principalOf(sender);

            // 1. Изпращане до получателите (за реално време получаване)
            boolean anyRecipientReceived = false;
            for (UserEntity recipient : recipients) {
                String recipientPrincipal = principalOf(recipient);
                try {
                    webSocketHandler.sendPrivateMessageToUsername(recipientPrincipal, messageDTO);
                    anyRecipientReceived = true;
                } catch (Exception e) {
                    log.warn("WebSocket message failed for recipient {}: {}", recipientPrincipal, e.getMessage());
                }
            }

            // 2. Изпращане до изпращача (за реално време синхронизация на всички негови
            // устройства)
            try {
                webSocketHandler.sendPrivateMessageToUsername(senderPrincipal, messageDTO);
            } catch (Exception e) {
                log.error("WebSocket message failed for sender {}", senderPrincipal, e);
            }

            // 3. Маркиране като delivered ако поне един получател е взел съобщението
            if (anyRecipientReceived) {
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
            String senderName = sender.getRealName() != null && !sender.getRealName().isBlank()
                    ? sender.getRealName()
                    : sender.getUsername();
            String pushTitle = conversation.isGroup()
                    ? senderName + " · " + conversation.getTitle()
                    : senderName;
            String messagePreview = preview.length() > 100 ? preview.substring(0, 100) + "..." : preview;

            for (UserEntity recipient : recipients) {
                if (isMutedFor(conversation, recipient)) {
                    continue;
                }
                try {
                    pushNotificationService.sendNewMessageNotification(
                            recipient.getId(),
                            pushTitle,
                            messagePreview,
                            conversationId);
                } catch (Exception pushError) {
                    log.error("❌ Failed to send push notification: {}", pushError.getMessage());
                }
            }

            return messageDTO;

        } catch (Exception e) {
            log.error("Error sending message: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to send message", e);
        }
    }

    /** Falls back to the mime type when the client doesn't say what it sent. */
    private MessageType resolveMessageType(String requested, SVAttachmentDTO attachment) {
        if (requested != null && !requested.isBlank()) {
            try {
                return MessageType.valueOf(requested.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                // fall through to mime sniffing
            }
        }
        if (attachment == null || attachment.getUrl() == null || attachment.getUrl().isBlank()) {
            return MessageType.TEXT;
        }
        String mime = attachment.getMime() == null ? "" : attachment.getMime();
        if (mime.startsWith("image/")) return MessageType.IMAGE;
        if (mime.startsWith("audio/")) return MessageType.AUDIO;
        return MessageType.FILE;
    }

    // ========== REACTIONS / PIN / STAR / FORWARD ==========

    /** Batch-loads reactions and pin/star flags so a page costs three queries, not N. */
    private void enrichWithReactionsAndFlags(List<SVMessageDTO> messages, UserEntity currentUser) {
        if (messages.isEmpty()) return;

        List<Long> ids = messages.stream().map(SVMessageDTO::getId).collect(Collectors.toList());
        Map<Long, List<SVReactionSummaryDTO>> byMessage = summariseReactions(ids, currentUser);
        Set<Long> pinned = new HashSet<>(flagRepo.findFlaggedMessageIds(
                currentUser.getId(), SVMessageFlagEntity.Kind.PINNED, ids));
        Set<Long> starred = new HashSet<>(flagRepo.findFlaggedMessageIds(
                currentUser.getId(), SVMessageFlagEntity.Kind.STARRED, ids));

        List<Long> pollMessageIds = messages.stream()
                .filter(dto -> MessageType.POLL.name().equals(dto.getMessageType()))
                .map(SVMessageDTO::getId)
                .collect(Collectors.toList());
        Map<Long, SVPollDTO> polls = pollMessageIds.isEmpty()
                ? Map.of()
                : summarisePolls(pollMessageIds, currentUser);

        for (SVMessageDTO dto : messages) {
            dto.setReactions(byMessage.getOrDefault(dto.getId(), List.of()));
            dto.setIsPinned(pinned.contains(dto.getId()));
            dto.setIsStarred(starred.contains(dto.getId()));
            dto.setPoll(polls.get(dto.getId()));
        }
    }

    private Map<Long, SVPollDTO> summarisePolls(List<Long> messageIds, UserEntity currentUser) {
        Map<Long, Integer> votesByOption = new HashMap<>();
        Map<Long, Long> myOptionByMessage = new HashMap<>();

        for (SVMessagePollVoteEntity vote : pollVoteRepo.findByMessageIds(messageIds)) {
            votesByOption.merge(vote.getOption().getId(), 1, Integer::sum);
            if (vote.getUser().getId().equals(currentUser.getId())) {
                myOptionByMessage.put(vote.getMessageId(), vote.getOption().getId());
            }
        }

        Map<Long, List<SVPollDTO.Option>> optionsByMessage = new LinkedHashMap<>();
        Map<Long, String> questionByMessage = new HashMap<>();
        for (SVMessagePollOptionEntity option : pollRepo.findByMessageIds(messageIds)) {
            Long messageId = option.getMessage().getId();
            questionByMessage.putIfAbsent(messageId, option.getMessage().getMessageText());
            optionsByMessage.computeIfAbsent(messageId, k -> new ArrayList<>())
                    .add(new SVPollDTO.Option(option.getId(), option.getOptionText(),
                            votesByOption.getOrDefault(option.getId(), 0)));
        }

        Map<Long, SVPollDTO> result = new HashMap<>();
        optionsByMessage.forEach((messageId, options) -> {
            int total = options.stream().mapToInt(SVPollDTO.Option::getVotes).sum();
            result.put(messageId, new SVPollDTO(
                    questionByMessage.get(messageId), options, total, myOptionByMessage.get(messageId)));
        });
        return result;
    }

    @Override
    @Transactional
    public SVMessageDTO createPoll(Long conversationId, String question, List<String> options,
                                   UserEntity sender) {
        SVConversationEntity conversation = conversationRepo.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Разговорът не е намерен"));
        if (!hasAccess(conversation, sender)) {
            throw new IllegalArgumentException("Access denied");
        }
        if (!conversation.isGroup()) {
            throw new IllegalArgumentException("Анкетите са достъпни само в групови чатове");
        }

        List<String> cleaned = options == null ? List.of()
                : options.stream()
                        .filter(option -> option != null && !option.isBlank())
                        .map(option -> option.trim().length() > 120 ? option.trim().substring(0, 120) : option.trim())
                        .distinct()
                        .collect(Collectors.toList());
        if (cleaned.size() < 2 || cleaned.size() > 4) {
            throw new IllegalArgumentException("Анкетата трябва да има между 2 и 4 различни опции");
        }

        SVMessageDTO created = sendMessage(conversationId, question, sender, null,
                MessageType.POLL.name(), null);

        SVMessageEntity message = messageRepo.findById(created.getId())
                .orElseThrow(() -> new IllegalStateException("Poll message vanished"));
        for (int i = 0; i < cleaned.size(); i++) {
            pollRepo.save(new SVMessagePollOptionEntity(message, cleaned.get(i), i));
        }
        pollRepo.flush();

        created.setPoll(summarisePolls(List.of(created.getId()), sender).get(created.getId()));
        return created;
    }

    @Override
    @Transactional
    public SVPollDTO votePoll(Long optionId, UserEntity currentUser) {
        SVMessagePollOptionEntity option = pollRepo.findById(optionId)
                .orElseThrow(() -> new IllegalArgumentException("Опцията не съществува"));
        SVMessageEntity message = option.getMessage();
        SVConversationEntity conversation = message.getConversation();
        if (!hasAccess(conversation, currentUser)) {
            throw new IllegalArgumentException("Access denied");
        }

        pollVoteRepo.findByMessageIdAndUserId(message.getId(), currentUser.getId())
                .ifPresentOrElse(existing -> {
                    if (existing.getOption().getId().equals(optionId)) {
                        pollVoteRepo.delete(existing);
                    } else {
                        existing.setOption(option);
                        pollVoteRepo.save(existing);
                    }
                }, () -> pollVoteRepo.save(new SVMessagePollVoteEntity(option, currentUser)));
        pollVoteRepo.flush();

        SVPollDTO forCaller = summarisePolls(List.of(message.getId()), currentUser).get(message.getId());

        UserEntity otherUser = conversation.getOtherUser(currentUser);
        if (otherUser != null) {
            SVPollDTO forPeer = summarisePolls(List.of(message.getId()), otherUser).get(message.getId());
            try {
                webSocketHandler.sendPollUpdate(principalOf(otherUser), conversation.getId(),
                        message.getId(), forPeer);
            } catch (Exception e) {
                log.warn("Failed to broadcast poll update for message {}: {}", message.getId(), e.getMessage());
            }
        }

        return forCaller;
    }

    private Map<Long, List<SVReactionSummaryDTO>> summariseReactions(List<Long> messageIds, UserEntity currentUser) {
        if (messageIds.isEmpty()) return Map.of();

        Map<Long, Map<String, List<String>>> grouped = new LinkedHashMap<>();
        Map<Long, Set<String>> mine = new HashMap<>();

        for (SVMessageReactionEntity reaction : reactionRepo.findByMessageIds(messageIds)) {
            Long messageId = reaction.getMessage().getId();
            grouped.computeIfAbsent(messageId, k -> new LinkedHashMap<>())
                    .computeIfAbsent(reaction.getEmoji(), k -> new ArrayList<>())
                    .add(reaction.getUser().getUsername());
            if (reaction.getUser().getId().equals(currentUser.getId())) {
                mine.computeIfAbsent(messageId, k -> new HashSet<>()).add(reaction.getEmoji());
            }
        }

        Map<Long, List<SVReactionSummaryDTO>> result = new HashMap<>();
        grouped.forEach((messageId, emojis) -> {
            Set<String> own = mine.getOrDefault(messageId, Set.of());
            List<SVReactionSummaryDTO> summaries = emojis.entrySet().stream()
                    .map(entry -> new SVReactionSummaryDTO(
                            entry.getKey(),
                            entry.getValue().size(),
                            entry.getValue(),
                            own.contains(entry.getKey())))
                    .collect(Collectors.toList());
            result.put(messageId, summaries);
        });
        return result;
    }

    @Override
    @Transactional
    public List<SVReactionSummaryDTO> toggleReaction(Long messageId, String emoji, UserEntity currentUser) {
        String normalized = emoji == null ? "" : emoji.trim();
        if (normalized.isEmpty() || normalized.length() > 16) {
            throw new IllegalArgumentException("Невалидна реакция");
        }

        SVMessageEntity message = messageRepo.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        SVConversationEntity conversation = message.getConversation();
        if (!hasAccess(conversation, currentUser)) {
            throw new IllegalArgumentException("Access denied");
        }

        reactionRepo.findByMessageIdAndUserIdAndEmoji(messageId, currentUser.getId(), normalized)
                .ifPresentOrElse(
                        reactionRepo::delete,
                        () -> reactionRepo.save(new SVMessageReactionEntity(message, currentUser, normalized)));
        reactionRepo.flush();

        List<SVReactionSummaryDTO> forCaller =
                summariseReactions(List.of(messageId), currentUser).getOrDefault(messageId, List.of());

        broadcastReactions(currentUser, conversation.getId(), messageId, forCaller);
        // "reactedByMe" е различно за всеки, затова обобщаваме поотделно за всеки получател.
        for (UserEntity peer : recipientsOf(conversation, currentUser)) {
            List<SVReactionSummaryDTO> forPeer =
                    summariseReactions(List.of(messageId), peer).getOrDefault(messageId, List.of());
            broadcastReactions(peer, conversation.getId(), messageId, forPeer);
        }

        return forCaller;
    }

    private void broadcastReactions(UserEntity recipient, Long conversationId, Long messageId,
                                    List<SVReactionSummaryDTO> reactions) {
        try {
            webSocketHandler.sendReactionUpdate(principalOf(recipient), conversationId, messageId, reactions);
        } catch (Exception e) {
            log.warn("Failed to broadcast reaction for message {}: {}", messageId, e.getMessage());
        }
    }

    private String principalOf(UserEntity user) {
        return user.getEmail() != null && !user.getEmail().isBlank()
                ? user.getEmail().toLowerCase()
                : user.getUsername().toLowerCase();
    }

    @Override
    @Transactional
    public boolean toggleFlag(Long messageId, UserEntity currentUser, SVMessageFlagEntity.Kind kind) {
        SVMessageEntity message = messageRepo.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        if (!hasAccess(message.getConversation(), currentUser)) {
            throw new IllegalArgumentException("Access denied");
        }

        var existing = flagRepo.findByMessageIdAndUserIdAndKind(messageId, currentUser.getId(), kind);
        if (existing.isPresent()) {
            flagRepo.delete(existing.get());
            return false;
        }
        flagRepo.save(new SVMessageFlagEntity(message, currentUser, kind));
        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SVMessageDTO> getFlaggedMessages(Long conversationId, UserEntity currentUser,
                                                 SVMessageFlagEntity.Kind kind) {
        List<SVMessageFlagEntity> flags = conversationId == null
                ? flagRepo.findAllForUser(currentUser.getId(), kind)
                : flagRepo.findByConversation(conversationId, currentUser.getId(), kind);

        List<SVMessageDTO> dtos = flags.stream()
                .map(flag -> SVMessageDTO.Mapper.toDTO(flag.getMessage()))
                .collect(Collectors.toList());
        enrichWithReactionsAndFlags(dtos, currentUser);
        return dtos;
    }

    @Override
    @Transactional
    public SVMessageDTO forwardMessage(Long messageId, Long targetConversationId, UserEntity currentUser) {
        SVMessageEntity source = messageRepo.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        if (!hasAccess(source.getConversation(), currentUser)) {
            throw new IllegalArgumentException("Access denied to the source conversation");
        }

        SVAttachmentDTO attachment = source.getAttachmentUrl() == null ? null
                : new SVAttachmentDTO(source.getAttachmentUrl(), source.getAttachmentName(),
                        source.getAttachmentSize(), source.getAttachmentMime());

        SVMessageDTO forwarded = sendMessage(targetConversationId, source.getMessageText(), currentUser, null,
                source.getMessageType() == null ? null : source.getMessageType().name(), attachment);

        messageRepo.findById(forwarded.getId()).ifPresent(entity -> {
            entity.setIsForwarded(true);
            messageRepo.save(entity);
        });
        forwarded.setIsForwarded(true);
        return forwarded;
    }

    // ========== GLOBAL SEARCH / MUTE ==========

    @Override
    @Transactional(readOnly = true)
    public Page<SVMessageDTO> searchMessages(String query, int page, int size, UserEntity currentUser) {
        String needle = query == null ? "" : query.trim();
        if (needle.length() < 2) {
            return Page.empty();
        }

        Pageable pageable = PageRequest.of(page, Math.min(size, 50));
        Page<SVMessageDTO> results = messageRepo
                .searchAcrossConversations(currentUser.getId(), needle, pageable)
                .map(SVMessageDTO.Mapper::toDTO);
        enrichWithReactionsAndFlags(results.getContent(), currentUser);
        return results;
    }

    @Override
    @Transactional
    public boolean toggleMute(Long conversationId, UserEntity currentUser) {
        SVConversationEntity conversation = conversationRepo.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        if (!hasAccess(conversation, currentUser)) {
            throw new IllegalArgumentException("Access denied");
        }
        if (conversation.isGroup()) {
            SVConversationParticipantEntity me = participantRepo
                    .findByConversationAndUser(conversationId, currentUser.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Access denied"));
            me.setMuted(!Boolean.TRUE.equals(me.getMuted()));
            participantRepo.save(me);
            return me.getMuted();
        }
        boolean muted = conversation.toggleMuteForUser(currentUser);
        conversationRepo.save(conversation);
        return muted;
    }

    @Override
    @Transactional
    public SVE2EPublicKeyDTO upsertE2EPublicKey(UserEntity user, String publicJwk) {
        if (publicJwk == null || publicJwk.isBlank() || publicJwk.length() > 4000) {
            throw new IllegalArgumentException("Невалиден публичен ключ");
        }
        SVMessengerE2EKeyEntity entity = e2eKeyRepo.findByUserId(user.getId())
                .orElseGet(() -> new SVMessengerE2EKeyEntity(user, publicJwk));
        entity.setPublicJwk(publicJwk.trim());
        e2eKeyRepo.save(entity);
        return new SVE2EPublicKeyDTO(user.getId(), entity.getPublicJwk());
    }

    @Override
    @Transactional(readOnly = true)
    public SVE2EPublicKeyDTO getE2EPublicKey(Long userId) {
        return e2eKeyRepo.findByUserId(userId)
                .map(key -> new SVE2EPublicKeyDTO(userId, key.getPublicJwk()))
                .orElse(null);
    }

    private String attachmentPreview(MessageType type) {
        return switch (type) {
            case IMAGE -> "📷 Снимка";
            case AUDIO -> "🎤 Гласово съобщение";
            case FILE -> "📎 Файл";
            default -> "";
        };
    }

    // ✅ FIX: readOnly + proper pagination
    @Override
    @Transactional(readOnly = true)
    public Page<SVMessageDTO> getMessages(Long conversationId, int page, int size, UserEntity currentUser) {
        try {
            SVConversationEntity conversation = conversationRepo.findById(conversationId)
                    .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

            if (!hasAccess(conversation, currentUser)) {
                throw new IllegalArgumentException("Access denied");
            }

            // ✅ Proper pagination with size limits
            if (size > 100) {
                size = 100; // Max 100 messages per page
            }

            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "sentAt"));

            Page<SVMessageEntity> messagesPage = messageRepo.findByConversationId(conversationId, pageable);

            // Map inside transaction
            Page<SVMessageDTO> dtoPage = messagesPage.map(SVMessageDTO.Mapper::toDTO);
            enrichWithReactionsAndFlags(dtoPage.getContent(), currentUser);
            return dtoPage;

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

            if (!hasAccess(conversation, reader)) {
                throw new IllegalArgumentException("Access denied");
            }

            messageRepo.markAllAsRead(conversationId, reader.getId(), LocalDateTime.now());
            if (conversation.isGroup()) {
                participantRepo.resetUnread(conversationId, reader.getId());
            } else {
                conversationRepo.resetUnreadCount(conversationId, reader.getId());
            }

            // Send bulk read receipt (по principal name - нормализирано на lowercase)
            for (UserEntity recipient : recipientsOf(conversation, reader)) {
                try {
                    webSocketHandler.sendBulkReadReceipt(principalOf(recipient), conversationId);
                } catch (Exception e) {
                    log.error("Failed to send read receipt", e);
                }
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
        SVMessageEntity message = messageRepo.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        SVConversationEntity conversation = message.getConversation();

        if (!hasAccess(conversation, reader)) {
            throw new IllegalArgumentException("Access denied");
        }
        if (message.getSender().getId().equals(reader.getId()) || Boolean.TRUE.equals(message.getIsRead())) {
            return;
        }

        LocalDateTime readAt = LocalDateTime.now();
        messageRepo.markAsRead(messageId, readAt);

        try {
            webSocketHandler.sendReadReceipt(principalOf(message.getSender()), messageId, conversation.getId());
        } catch (Exception e) {
            log.warn("Failed to send read receipt for message {}: {}", messageId, e.getMessage());
        }
    }

    /**
     * Изтриването е строго едностранно: разговорът изчезва само от списъка на
     * текущия потребител. Нищо не се маха от базата — насрещната страна вижда
     * цялата кореспонденция, а историята остава непокътната за одит.
     */
    @Override
    @Transactional
    public void deleteConversation(Long conversationId, UserEntity currentUser) {
        SVConversationEntity conversation = conversationRepo.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        if (!hasAccess(conversation, currentUser)) {
            throw new IllegalArgumentException("Access denied");
        }

        if (conversation.isGroup()) {
            leaveGroup(conversationId, currentUser);
            return;
        }

        conversation.hideForUser(currentUser);
        conversation.resetUnreadFor(currentUser);
        conversationRepo.save(conversation);
    }

    @Override
    @Transactional
    public void hideConversation(Long conversationId, UserEntity currentUser) {
        // Find conversation and validate user is participant
        SVConversationEntity conversation = conversationRepo.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        if (!hasAccess(conversation, currentUser)) {
            throw new IllegalArgumentException("User is not participant in this conversation");
        }

        if (conversation.isGroup()) {
            participantRepo.findByConversationAndUser(conversationId, currentUser.getId())
                    .ifPresent(participant -> {
                        participant.setHidden(true);
                        participantRepo.save(participant);
                    });
            return;
        }

        // ✅ FIX: Едностранно hiding - само за текущия потребител
        conversation.hideForUser(currentUser);
        conversationRepo.save(conversation);

    }

    @Override
    @Transactional
    public void deleteMessage(Long messageId, UserEntity currentUser) {
        SVMessageEntity message = messageRepo.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));

        if (!message.getSender().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Може да триете само своите съобщения");
        }

        messageRepo.softDelete(messageId);
        reactionRepo.deleteByMessageId(messageId);

        broadcastMessageMutation(message.getConversation(), currentUser, Map.of(
                "type", "MESSAGE_DELETED",
                "conversationId", message.getConversation().getId(),
                "messageId", messageId));
    }

    @Override
    @Transactional
    public SVMessageDTO editMessage(Long messageId, String newText, UserEntity currentUser) {
        String body = newText == null ? "" : newText.trim();
        if (body.isEmpty()) {
            throw new IllegalArgumentException("Съобщението не може да е празно");
        }
        if (body.length() > 3000) {
            throw new IllegalArgumentException("Съобщението е твърде дълго (максимум 3000 символа)");
        }

        SVMessageEntity message = messageRepo.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));

        if (!message.getSender().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Може да редактирате само своите съобщения");
        }
        if (Boolean.TRUE.equals(message.getIsDeleted())) {
            throw new IllegalArgumentException("Изтрито съобщение не може да се редактира");
        }

        LocalDateTime editedAt = LocalDateTime.now();
        messageRepo.editMessage(messageId, body, editedAt);

        message.setMessageText(body);
        message.setIsEdited(true);
        message.setEditedAt(editedAt);

        SVConversationEntity conversation = message.getConversation();
        // Ако това е последното съобщение, обновяваме и preview-то на разговора.
        List<SVMessageEntity> last = messageRepo.findLastMessage(conversation.getId(), PageRequest.of(0, 1));
        if (!last.isEmpty() && last.get(0).getId().equals(messageId)) {
            conversation.setLastMessagePreview(truncateText(body, 2900));
            conversationRepo.save(conversation);
        }

        SVMessageDTO dto = SVMessageDTO.Mapper.toDTO(message);
        broadcastMessageMutation(conversation, currentUser, Map.of(
                "type", "MESSAGE_EDITED",
                "conversationId", conversation.getId(),
                "message", dto));
        return dto;
    }

    /** Pushes an edit/delete event to every participant, including other devices of the actor. */
    private void broadcastMessageMutation(SVConversationEntity conversation, UserEntity actor, Map<String, Object> payload) {
        List<UserEntity> audience = new ArrayList<>(recipientsOf(conversation, actor));
        audience.add(actor);
        for (UserEntity user : audience) {
            try {
                webSocketHandler.sendMessageMutation(principalOf(user), payload);
            } catch (Exception e) {
                log.warn("Failed to broadcast message mutation: {}", e.getMessage());
            }
        }
    }

    // ========== ГРУПОВИ РАЗГОВОРИ ==========

    @Override
    @Transactional
    public SVConversationDTO createGroup(UserEntity creator, String title, List<Long> memberIds, String imageUrl) {
        String name = title == null ? "" : title.trim();
        if (name.isEmpty()) {
            throw new IllegalArgumentException("Заглавието е задължително");
        }

        Set<Long> uniqueMembers = new java.util.LinkedHashSet<>(memberIds == null ? List.of() : memberIds);
        uniqueMembers.remove(creator.getId());
        if (uniqueMembers.isEmpty()) {
            throw new IllegalArgumentException("Изберете поне един участник");
        }
        if (uniqueMembers.size() > 99) {
            throw new IllegalArgumentException("Групата може да има най-много 100 участници");
        }

        List<UserEntity> members = userRepo.findAllById(uniqueMembers);
        if (members.size() != uniqueMembers.size()) {
            throw new IllegalArgumentException("Част от избраните потребители не съществуват");
        }

        SVConversationEntity group = SVConversationEntity.newGroup(creator, name);
        group.setImageUrl(imageUrl);
        group = conversationRepo.save(group);

        List<SVConversationParticipantEntity> roster = new ArrayList<>();
        roster.add(new SVConversationParticipantEntity(group, creator, ParticipantRole.OWNER));
        for (UserEntity member : members) {
            roster.add(new SVConversationParticipantEntity(group, member, ParticipantRole.MEMBER));
        }
        participantRepo.saveAll(roster);

        notifyGroupChanged(group, roster);
        return SVConversationDTO.Mapper.toGroupDTO(group, creator, roster, false);
    }

    @Override
    @Transactional
    public SVConversationDTO updateGroup(Long conversationId, UserEntity currentUser, String title, String imageUrl) {
        SVConversationEntity group = requireGroup(conversationId);
        requireManager(conversationId, currentUser);

        if (title != null && !title.isBlank()) {
            group.setTitle(title.trim());
        }
        if (imageUrl != null) {
            group.setImageUrl(imageUrl.isBlank() ? null : imageUrl);
        }
        conversationRepo.save(group);

        List<SVConversationParticipantEntity> roster = participantRepo.findActiveByConversation(conversationId);
        notifyGroupChanged(group, roster);
        return SVConversationDTO.Mapper.toGroupDTO(group, currentUser, roster, false);
    }

    @Override
    @Transactional
    public SVConversationDTO addGroupMembers(Long conversationId, UserEntity currentUser, List<Long> memberIds) {
        SVConversationEntity group = requireGroup(conversationId);
        requireManager(conversationId, currentUser);

        List<SVConversationParticipantEntity> roster = participantRepo.findActiveByConversation(conversationId);
        Set<Long> present = roster.stream().map(p -> p.getUser().getId()).collect(Collectors.toSet());

        for (Long memberId : new java.util.LinkedHashSet<>(memberIds == null ? List.<Long>of() : memberIds)) {
            if (present.contains(memberId)) {
                continue;
            }
            UserEntity user = userRepo.findById(memberId)
                    .orElseThrow(() -> new IllegalArgumentException("Потребителят не съществува"));

            // Ако е бил в групата и я е напуснал, просто го активираме отново.
            SVConversationParticipantEntity participant = participantRepo
                    .findByConversationAndUser(conversationId, memberId)
                    .orElseGet(() -> new SVConversationParticipantEntity(group, user, ParticipantRole.MEMBER));
            participant.setLeftAt(null);
            participant.setHidden(false);
            participant.setUnreadCount(0);
            participantRepo.save(participant);
        }

        List<SVConversationParticipantEntity> updated = participantRepo.findActiveByConversation(conversationId);
        if (updated.size() > 100) {
            throw new IllegalArgumentException("Групата може да има най-много 100 участници");
        }

        notifyGroupChanged(group, updated);
        return SVConversationDTO.Mapper.toGroupDTO(group, currentUser, updated, false);
    }

    @Override
    @Transactional
    public SVConversationDTO removeGroupMember(Long conversationId, UserEntity currentUser, Long memberId) {
        SVConversationEntity group = requireGroup(conversationId);
        requireManager(conversationId, currentUser);

        SVConversationParticipantEntity target = participantRepo
                .findByConversationAndUser(conversationId, memberId)
                .orElseThrow(() -> new IllegalArgumentException("Участникът не е в групата"));

        if (target.getRole() == ParticipantRole.OWNER) {
            throw new IllegalArgumentException("Собственикът на групата не може да бъде премахнат");
        }

        target.setLeftAt(LocalDateTime.now());
        participantRepo.save(target);

        List<SVConversationParticipantEntity> roster = participantRepo.findActiveByConversation(conversationId);
        notifyGroupChanged(group, roster);
        notifyGroupChanged(group, List.of(target));
        return SVConversationDTO.Mapper.toGroupDTO(group, currentUser, roster, false);
    }

    @Override
    @Transactional
    public void leaveGroup(Long conversationId, UserEntity currentUser) {
        SVConversationEntity group = requireGroup(conversationId);

        SVConversationParticipantEntity me = participantRepo
                .findByConversationAndUser(conversationId, currentUser.getId())
                .filter(SVConversationParticipantEntity::isActive)
                .orElseThrow(() -> new IllegalArgumentException("Не сте участник в тази група"));

        me.setLeftAt(LocalDateTime.now());
        participantRepo.save(me);

        List<SVConversationParticipantEntity> roster = participantRepo.findActiveByConversation(conversationId);

        // Собственикът предава правата на най-стария администратор или член.
        if (me.getRole() == ParticipantRole.OWNER && !roster.isEmpty()) {
            SVConversationParticipantEntity heir = roster.stream()
                    .min(java.util.Comparator.comparing(SVConversationParticipantEntity::getJoinedAt))
                    .orElseThrow();
            heir.setRole(ParticipantRole.OWNER);
            participantRepo.save(heir);
        }

        notifyGroupChanged(group, roster);
        notifyGroupChanged(group, List.of(me));
    }

    @Override
    @Transactional
    public SVConversationDTO setGroupRole(Long conversationId, UserEntity currentUser, Long memberId, String role) {
        SVConversationEntity group = requireGroup(conversationId);

        SVConversationParticipantEntity me = participantRepo
                .findByConversationAndUser(conversationId, currentUser.getId())
                .filter(SVConversationParticipantEntity::isActive)
                .orElseThrow(() -> new IllegalArgumentException("Access denied"));
        if (me.getRole() != ParticipantRole.OWNER) {
            throw new IllegalArgumentException("Само собственикът може да променя роли");
        }

        ParticipantRole target;
        try {
            target = ParticipantRole.valueOf(role == null ? "" : role.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Невалидна роля");
        }
        if (target == ParticipantRole.OWNER) {
            throw new IllegalArgumentException("Групата може да има само един собственик");
        }

        SVConversationParticipantEntity participant = participantRepo
                .findByConversationAndUser(conversationId, memberId)
                .filter(SVConversationParticipantEntity::isActive)
                .orElseThrow(() -> new IllegalArgumentException("Участникът не е в групата"));
        if (participant.getRole() == ParticipantRole.OWNER) {
            throw new IllegalArgumentException("Ролята на собственика не може да се променя");
        }

        participant.setRole(target);
        participantRepo.save(participant);

        List<SVConversationParticipantEntity> roster = participantRepo.findActiveByConversation(conversationId);
        notifyGroupChanged(group, roster);
        return SVConversationDTO.Mapper.toGroupDTO(group, currentUser, roster, false);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SVParticipantDTO> getGroupParticipants(Long conversationId, UserEntity currentUser) {
        requireGroup(conversationId);
        if (!isParticipant(conversationId, currentUser)) {
            throw new IllegalArgumentException("Access denied");
        }
        return participantRepo.findActiveByConversation(conversationId).stream()
                .map(SVParticipantDTO::from)
                .toList();
    }

    private SVConversationEntity requireGroup(Long conversationId) {
        SVConversationEntity conversation = conversationRepo.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        if (!conversation.isGroup()) {
            throw new IllegalArgumentException("Разговорът не е група");
        }
        return conversation;
    }

    private void requireManager(Long conversationId, UserEntity user) {
        boolean allowed = participantRepo.findByConversationAndUser(conversationId, user.getId())
                .filter(SVConversationParticipantEntity::isActive)
                .map(SVConversationParticipantEntity::canManage)
                .orElse(false);
        if (!allowed) {
            throw new IllegalArgumentException("Нямате права да управлявате тази група");
        }
    }

    /** Tells every listed member to refetch their conversation list. */
    private void notifyGroupChanged(SVConversationEntity group, List<SVConversationParticipantEntity> audience) {
        Map<String, Object> payload = Map.of(
                "type", "GROUP_UPDATED",
                "conversationId", group.getId());
        for (SVConversationParticipantEntity participant : audience) {
            try {
                webSocketHandler.sendMessageMutation(principalOf(participant.getUser()), payload);
            } catch (Exception e) {
                log.warn("Failed to notify group member: {}", e.getMessage());
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Long getTotalUnreadCount(UserEntity user) {
        try {
            Long direct = conversationRepo.getTotalUnreadCount(user.getId());
            Long groups = participantRepo.getTotalGroupUnread(user.getId());
            return (direct != null ? direct : 0L) + (groups != null ? groups : 0L);
        } catch (Exception e) {
            log.error("Error getting unread count: {}", e.getMessage());
            return 0L;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isParticipant(Long conversationId, UserEntity user) {
        return conversationRepo.findById(conversationId)
                .map(conversation -> hasAccess(conversation, user))
                .orElse(false);
    }

    /**
     * Membership check that understands both shapes: DIRECT chats use the legacy
     * user1/user2 columns, groups use the participants table.
     */
    private boolean hasAccess(SVConversationEntity conversation, UserEntity user) {
        if (conversation.isGroup()) {
            return participantRepo.findByConversationAndUser(conversation.getId(), user.getId())
                    .filter(SVConversationParticipantEntity::isActive)
                    .isPresent();
        }
        return conversation.isParticipant(user);
    }

    /** Everyone who should receive a new message in this conversation, minus the sender. */
    private List<UserEntity> recipientsOf(SVConversationEntity conversation, UserEntity sender) {
        if (conversation.isGroup()) {
            return participantRepo.findActiveByConversation(conversation.getId()).stream()
                    .map(SVConversationParticipantEntity::getUser)
                    .filter(u -> !u.getId().equals(sender.getId()))
                    .toList();
        }
        return List.of(conversation.getOtherUser(sender));
    }

    private boolean isMutedFor(SVConversationEntity conversation, UserEntity user) {
        if (conversation.isGroup()) {
            return participantRepo.findByConversationAndUser(conversation.getId(), user.getId())
                    .map(p -> Boolean.TRUE.equals(p.getMuted()))
                    .orElse(false);
        }
        return conversation.isMutedForUser(user);
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

    /** True when anyone other than {@code exceptUserId} is currently typing in the conversation. */
    private boolean isAnyoneTyping(Long conversationId, Long exceptUserId) {
        Map<Long, LocalDateTime> conversationTyping = typingStatuses.get(conversationId);
        if (conversationTyping == null) {
            return false;
        }
        return conversationTyping.keySet().stream()
                .filter(id -> !id.equals(exceptUserId))
                .anyMatch(id -> isUserTyping(conversationId, id));
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

    // ========== VOICE CALLS ==========

    @Override
    public SVCallTokenResponse generateCallToken(Long conversationId, UserEntity currentUser) {
        try {
            // Валидирай че conversation съществува и user е participant
            SVConversationEntity conversation = conversationRepo.findById(conversationId)
                    .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

            if (conversation.isGroup()) {
                throw new IllegalArgumentException("Обажданията в групови чатове още не се поддържат");
            }

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

            if (conversation.isGroup()) {
                return List.of();
            }

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