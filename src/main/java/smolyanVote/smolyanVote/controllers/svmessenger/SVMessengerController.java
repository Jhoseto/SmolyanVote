package smolyanVote.smolyanVote.controllers.svmessenger;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.svmessenger.SVMessageFlagEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.ImageCloudinaryService;
import smolyanVote.smolyanVote.services.interfaces.SVMessengerService;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST API Controller за SVMessenger
 * Всички endpoints изискват authentication
 */
@RestController
@RequestMapping("/api/svmessenger")
@CrossOrigin(origins = "*")  // За development; production: конкретни домейни
@Slf4j
public class SVMessengerController {
    
    /** 20 MB — matches the Cloudinary free-tier per-file limit. */
    private static final long MAX_ATTACHMENT_BYTES = 20L * 1024 * 1024;

    private final SVMessengerService messengerService;
    private final UserRepository userRepository;
    private final ImageCloudinaryService imageCloudinaryService;
    
    public SVMessengerController(SVMessengerService messengerService, 
                                  UserRepository userRepository,
                                  ImageCloudinaryService imageCloudinaryService) {
        this.messengerService = messengerService;
        this.userRepository = userRepository;
        this.imageCloudinaryService = imageCloudinaryService;
    }
    
    // ========== CSRF TOKEN ==========
    
    /**
     * GET /api/svmessenger/csrf-token
     * Връща CSRF token за web клиенти (ако липсва)
     * Това endpoint генерира CSRF token ако не е наличен
     * 
     * Response: { "token": "...", "headerName": "X-XSRF-TOKEN" }
     */
    @GetMapping("/csrf-token")
    public ResponseEntity<Map<String, String>> getCsrfToken(HttpServletRequest request) {
        Map<String, String> response = new HashMap<>();
        
        // Spring Security автоматично генерира CSRF token при първия GET заявка
        // Това endpoint гарантира че token е наличен
        CsrfToken csrfToken = (CsrfToken) request.getAttribute("_csrf");
        if (csrfToken != null) {
            response.put("token", csrfToken.getToken());
            response.put("headerName", csrfToken.getHeaderName());
        } else {
            // Ако token не е наличен, връщаме празен response
            // Spring Security ще генерира token при следващата заявка
            response.put("token", "");
            response.put("headerName", "X-XSRF-TOKEN");
        }
        
        return ResponseEntity.ok(response);
    }
    
    // ========== CONVERSATIONS ==========
    
    /**
     * GET /api/svmessenger/conversations
     * Вземи всички разговори на текущия user
     * 
     * Response: List<SVConversationDTO>
     */
    @GetMapping("/conversations")
    public ResponseEntity<List<SVConversationDTO>> getAllConversations(
            @RequestParam(defaultValue = "false") boolean includeGroups,
            Authentication auth) {
        
        try {
            UserEntity currentUser = getCurrentUser(auth);
            List<SVConversationDTO> conversations =
                    messengerService.getAllConversations(currentUser, includeGroups);
            
            return ResponseEntity.ok(conversations);
        } catch (Exception e) {
            log.error("Error getting conversations", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * GET /api/svmessenger/conversations/{id}
     * Вземи конкретен разговор
     * 
     * Response: SVConversationDTO
     */
    @GetMapping("/conversations/{id}")
    public ResponseEntity<SVConversationDTO> getConversation(
            @PathVariable Long id,
            Authentication auth) {
        
        try {
            UserEntity currentUser = getCurrentUser(auth);
            SVConversationDTO conversation = messengerService.getConversation(id, currentUser);
            
            return ResponseEntity.ok(conversation);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error getting conversation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * POST /api/svmessenger/conversations/start
     * Старт на нов разговор или вземи съществуващ
     * 
     * Request body: { "otherUserId": 5, "initialMessage": "Hello!" }
     * Response: SVConversationDTO
     */
    @PostMapping("/conversations/start")
    public ResponseEntity<SVConversationDTO> startConversation(
            @RequestBody @Valid SVStartConversationRequest request,
            Authentication auth) {
        
        try {
            UserEntity currentUser = getCurrentUser(auth);
            SVConversationDTO conversation = messengerService.startOrGetConversation(
                    currentUser, 
                    request.getOtherUserId()
            );
            
            // Ако има initial message, изпрати го
            if (request.getInitialMessage() != null && !request.getInitialMessage().trim().isEmpty()) {
                messengerService.sendMessage(
                        conversation.getId(), 
                        request.getInitialMessage(), 
                        currentUser
                );
            }
            
            return ResponseEntity.ok(conversation);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error starting conversation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * PUT /api/svmessenger/conversations/{id}/read
     * Маркирай всички съобщения в разговор като прочетени
     * 
     * Response: { "success": true }
     */
    @PutMapping("/conversations/{id}/read")
    public ResponseEntity<Map<String, Object>> markConversationAsRead(
            @PathVariable Long id,
            Authentication auth) {
        
        try {
            UserEntity currentUser = getCurrentUser(auth);
            messengerService.markAllAsRead(id, currentUser);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error marking as read", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * DELETE /api/svmessenger/conversations/{id}
     * Скрий разговора само за текущия потребител. Нищо не се маха от базата.
     * 
     * Response: { "success": true }
     */
    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<Map<String, Object>> deleteConversation(
            @PathVariable Long id,
            Authentication auth) {
        
        try {
            UserEntity currentUser = getCurrentUser(auth);
            messengerService.deleteConversation(id, currentUser);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error deleting conversation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * PUT /api/svmessenger/conversations/{id}/hide
     * Скрий разговор от панела (не изтрива историята)
     * 
     * Response: { "success": true }
     */
    @PutMapping("/conversations/{id}/hide")
    public ResponseEntity<Map<String, Object>> hideConversation(
            @PathVariable Long id,
            Authentication auth) {
        
        try {
            UserEntity currentUser = getCurrentUser(auth);
            messengerService.hideConversation(id, currentUser);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error hiding conversation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // ========== MESSAGES ==========
    
    /**
     * GET /api/svmessenger/messages/conversation/{conversationId}?page=0&size=50
     * Вземи история на съобщения с pagination
     * 
     * Response: Page<SVMessageDTO>
     */
    @GetMapping("/messages/conversation/{conversationId}")
    public ResponseEntity<Page<SVMessageDTO>> getMessages(
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication auth) {
        
        try {
            UserEntity currentUser = getCurrentUser(auth);
            Page<SVMessageDTO> messages = messengerService.getMessages(
                    conversationId, 
                    page, 
                    size, 
                    currentUser
            );
            
            return ResponseEntity.ok(messages);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error getting messages", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * POST /api/svmessenger/messages/send
     * Изпрати ново съобщение (HTTP fallback за WebSocket)
     * 
     * Request body: { "conversationId": 1, "text": "Hello!" }
     * Response: SVMessageDTO
     */
    @PostMapping("/messages/send")
    public ResponseEntity<SVMessageDTO> sendMessage(
            @RequestBody @Valid SVSendMessageRequest request,
            Authentication auth) {
        
        try {
            UserEntity currentUser = getCurrentUser(auth);
            SVAttachmentDTO attachment = request.getAttachmentUrl() == null ? null
                    : new SVAttachmentDTO(
                            request.getAttachmentUrl(),
                            request.getAttachmentName(),
                            request.getAttachmentSize(),
                            request.getAttachmentMime());

            SVMessageDTO message = ((smolyanVote.smolyanVote.services.serviceImpl.SVMessengerServiceImpl) messengerService)
                    .sendMessage(
                            request.getConversationId(),
                            request.getText(),
                            currentUser,
                            request.getParentMessageId(),
                            request.getMessageType(),
                            attachment
                    );
            
            return ResponseEntity.ok(message);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error sending message", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * POST /api/svmessenger/messages/upload
     * Качва прикачен файл в Cloudinary и връща метаданните, с които клиентът
     * после извиква /messages/send.
     *
     * Response: { url, name, size, mime }
     */
    @PostMapping("/messages/upload")
    public ResponseEntity<?> uploadAttachment(
            @RequestParam("file") MultipartFile file,
            @RequestParam("conversationId") Long conversationId,
            Authentication auth) {

        try {
            UserEntity currentUser = getCurrentUser(auth);

            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Липсва файл"));
            }
            if (file.getSize() > MAX_ATTACHMENT_BYTES) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Файлът е твърде голям (максимум 20 MB)"));
            }
            if (!messengerService.isParticipant(conversationId, currentUser)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Няма достъп"));
            }

            String url = imageCloudinaryService.saveMessengerAttachment(file, conversationId);

            return ResponseEntity.ok(new SVAttachmentDTO(
                    url,
                    file.getOriginalFilename(),
                    file.getSize(),
                    file.getContentType()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error uploading messenger attachment", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Качването не успя"));
        }
    }

    /**
     * POST /api/svmessenger/messages/{id}/reactions
     * Слага или маха емоджи реакция.
     *
     * Body: { "emoji": "👍" }
     * Response: [{ emoji, count, usernames, reactedByMe }]
     */
    @PostMapping("/messages/{id}/reactions")
    public ResponseEntity<?> toggleReaction(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {

        try {
            UserEntity currentUser = getCurrentUser(auth);
            return ResponseEntity.ok(messengerService.toggleReaction(id, body.get("emoji"), currentUser));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error toggling reaction on message {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Реакцията не беше запазена"));
        }
    }

    /**
     * POST /api/svmessenger/messages/{id}/pin | /star
     * Response: { "active": true }
     */
    @PostMapping("/messages/{id}/pin")
    public ResponseEntity<?> togglePin(@PathVariable Long id, Authentication auth) {
        return toggleFlag(id, auth, SVMessageFlagEntity.Kind.PINNED);
    }

    @PostMapping("/messages/{id}/star")
    public ResponseEntity<?> toggleStar(@PathVariable Long id, Authentication auth) {
        return toggleFlag(id, auth, SVMessageFlagEntity.Kind.STARRED);
    }

    private ResponseEntity<?> toggleFlag(Long messageId, Authentication auth, SVMessageFlagEntity.Kind kind) {
        try {
            UserEntity currentUser = getCurrentUser(auth);
            boolean active = messengerService.toggleFlag(messageId, currentUser, kind);
            return ResponseEntity.ok(Map.of("active", active));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error toggling {} on message {}", kind, messageId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Действието не беше запазено"));
        }
    }

    /**
     * GET /api/svmessenger/messages/pinned?conversationId=1
     * GET /api/svmessenger/messages/starred
     */
    @GetMapping("/messages/pinned")
    public ResponseEntity<?> getPinned(@RequestParam(required = false) Long conversationId, Authentication auth) {
        return flagged(conversationId, auth, SVMessageFlagEntity.Kind.PINNED);
    }

    @GetMapping("/messages/starred")
    public ResponseEntity<?> getStarred(@RequestParam(required = false) Long conversationId, Authentication auth) {
        return flagged(conversationId, auth, SVMessageFlagEntity.Kind.STARRED);
    }

    private ResponseEntity<?> flagged(Long conversationId, Authentication auth, SVMessageFlagEntity.Kind kind) {
        try {
            UserEntity currentUser = getCurrentUser(auth);
            return ResponseEntity.ok(messengerService.getFlaggedMessages(conversationId, currentUser, kind));
        } catch (Exception e) {
            log.error("Error loading {} messages", kind, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Зареждането не успя"));
        }
    }

    /**
     * POST /api/svmessenger/messages/{id}/forward
     * Body: { "conversationId": 7 }
     */
    @PostMapping("/messages/{id}/forward")
    public ResponseEntity<?> forwardMessage(
            @PathVariable Long id,
            @RequestBody Map<String, Long> body,
            Authentication auth) {

        try {
            UserEntity currentUser = getCurrentUser(auth);
            Long target = body.get("conversationId");
            if (target == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Липсва разговор"));
            }
            return ResponseEntity.ok(messengerService.forwardMessage(id, target, currentUser));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error forwarding message {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Препращането не успя"));
        }
    }

    /**
     * GET /api/svmessenger/messages/search?q=…&page=0&size=20
     * Търси във всички разговори на потребителя.
     */
    @GetMapping("/messages/search")
    public ResponseEntity<?> searchMessages(
            @RequestParam("q") String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {

        try {
            UserEntity currentUser = getCurrentUser(auth);
            return ResponseEntity.ok(messengerService.searchMessages(query, page, size, currentUser));
        } catch (Exception e) {
            log.error("Error searching messages", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Търсенето не успя"));
        }
    }

    /**
     * PUT /api/svmessenger/conversations/{id}/mute
     * Response: { "muted": true }
     */
    @PutMapping("/conversations/{id}/mute")
    public ResponseEntity<?> toggleMute(@PathVariable Long id, Authentication auth) {
        try {
            UserEntity currentUser = getCurrentUser(auth);
            return ResponseEntity.ok(Map.of("muted", messengerService.toggleMute(id, currentUser)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error toggling mute for conversation {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Действието не успя"));
        }
    }

    // ========== ГРУПОВИ РАЗГОВОРИ ==========

    /**
     * POST /api/svmessenger/groups
     * Създава нова група с текущия потребител като собственик.
     */
    @PostMapping("/groups")
    public ResponseEntity<?> createGroup(@Valid @RequestBody SVCreateGroupRequest request, Authentication auth) {
        try {
            UserEntity currentUser = getCurrentUser(auth);
            return ResponseEntity.ok(messengerService.createGroup(
                    currentUser, request.getTitle(), request.getMemberIds(), request.getImageUrl()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating group", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Групата не беше създадена"));
        }
    }

    /** PUT /api/svmessenger/groups/{id} — преименуване и смяна на снимка. */
    @PutMapping("/groups/{id}")
    public ResponseEntity<?> updateGroup(@PathVariable Long id,
                                         @Valid @RequestBody SVUpdateGroupRequest request,
                                         Authentication auth) {
        try {
            UserEntity currentUser = getCurrentUser(auth);
            return ResponseEntity.ok(messengerService.updateGroup(
                    id, currentUser, request.getTitle(), request.getImageUrl()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating group {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Промяната не беше запазена"));
        }
    }

    /** GET /api/svmessenger/groups/{id}/participants */
    @GetMapping("/groups/{id}/participants")
    public ResponseEntity<?> getGroupParticipants(@PathVariable Long id, Authentication auth) {
        try {
            UserEntity currentUser = getCurrentUser(auth);
            return ResponseEntity.ok(messengerService.getGroupParticipants(id, currentUser));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error loading participants for group {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Участниците не бяха заредени"));
        }
    }

    /** POST /api/svmessenger/groups/{id}/participants — body: { "memberIds": [1,2] } */
    @PostMapping("/groups/{id}/participants")
    public ResponseEntity<?> addGroupMembers(@PathVariable Long id,
                                             @RequestBody Map<String, List<Long>> body,
                                             Authentication auth) {
        try {
            UserEntity currentUser = getCurrentUser(auth);
            return ResponseEntity.ok(messengerService.addGroupMembers(id, currentUser, body.get("memberIds")));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error adding members to group {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Участниците не бяха добавени"));
        }
    }

    /** DELETE /api/svmessenger/groups/{id}/participants/{userId} */
    @DeleteMapping("/groups/{id}/participants/{userId}")
    public ResponseEntity<?> removeGroupMember(@PathVariable Long id,
                                               @PathVariable Long userId,
                                               Authentication auth) {
        try {
            UserEntity currentUser = getCurrentUser(auth);
            return ResponseEntity.ok(messengerService.removeGroupMember(id, currentUser, userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error removing member {} from group {}", userId, id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Участникът не беше премахнат"));
        }
    }

    /** POST /api/svmessenger/groups/{id}/leave */
    @PostMapping("/groups/{id}/leave")
    public ResponseEntity<?> leaveGroup(@PathVariable Long id, Authentication auth) {
        try {
            UserEntity currentUser = getCurrentUser(auth);
            messengerService.leaveGroup(id, currentUser);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error leaving group {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Напускането не успя"));
        }
    }

    /** PUT /api/svmessenger/groups/{id}/participants/{userId}/role — body: { "role": "ADMIN" } */
    @PutMapping("/groups/{id}/participants/{userId}/role")
    public ResponseEntity<?> setGroupRole(@PathVariable Long id,
                                          @PathVariable Long userId,
                                          @RequestBody Map<String, String> body,
                                          Authentication auth) {
        try {
            UserEntity currentUser = getCurrentUser(auth);
            return ResponseEntity.ok(messengerService.setGroupRole(id, currentUser, userId, body.get("role")));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error changing role in group {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Ролята не беше променена"));
        }
    }

    /**
     * PUT /api/svmessenger/e2e/keys — публикува ECDH публичния ключ на устройството.
     * Body: { "publicJwk": "{...}" }
     */
    @PutMapping("/e2e/keys")
    public ResponseEntity<?> upsertE2EKey(@RequestBody Map<String, String> body, Authentication auth) {
        try {
            UserEntity currentUser = getCurrentUser(auth);
            return ResponseEntity.ok(messengerService.upsertE2EPublicKey(currentUser, body.get("publicJwk")));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error publishing E2E key", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Ключът не беше запазен"));
        }
    }

    /** GET /api/svmessenger/e2e/keys/{userId} */
    @GetMapping("/e2e/keys/{userId}")
    public ResponseEntity<?> getE2EKey(@PathVariable Long userId, Authentication auth) {
        try {
            getCurrentUser(auth);
            SVE2EPublicKeyDTO key = messengerService.getE2EPublicKey(userId);
            if (key == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(key);
        } catch (Exception e) {
            log.error("Error loading E2E key for user {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Ключът не беше зареден"));
        }
    }

    /**
     * POST /api/svmessenger/messages/poll
     * Създава бърза анкета в разговора.
     */
    @PostMapping("/messages/poll")
    public ResponseEntity<?> createPoll(@Valid @RequestBody SVCreatePollRequest request, Authentication auth) {
        try {
            UserEntity currentUser = getCurrentUser(auth);
            return ResponseEntity.ok(messengerService.createPoll(
                    request.getConversationId(), request.getQuestion(), request.getOptions(), currentUser));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating poll", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Анкетата не беше създадена"));
        }
    }

    /**
     * POST /api/svmessenger/messages/poll/{optionId}/vote
     */
    @PostMapping("/messages/poll/{optionId}/vote")
    public ResponseEntity<?> votePoll(@PathVariable Long optionId, Authentication auth) {
        try {
            UserEntity currentUser = getCurrentUser(auth);
            return ResponseEntity.ok(messengerService.votePoll(optionId, currentUser));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error voting in poll option {}", optionId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Гласуването не успя"));
        }
    }

    /**
     * PUT /api/svmessenger/messages/{id}/read
     * Маркирай съобщение като прочетено
     * 
     * Response: { "success": true, "readAt": "2025-10-22T10:30:00" }
     */
    @PutMapping("/messages/{id}/read")
    public ResponseEntity<Map<String, Object>> markMessageAsRead(
            @PathVariable Long id,
            Authentication auth) {
        
        try {
            UserEntity currentUser = getCurrentUser(auth);
            messengerService.markMessageAsRead(id, currentUser);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("readAt", java.time.Instant.now());
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error marking message as read", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * PUT /api/svmessenger/messages/delivered
     * Маркирай всички не-delivered съобщения като delivered за текущия user
     * (извиква се когато user дойде online)
     *
     * Response: { "success": true, "marked": 5 }
     */
    @PutMapping("/messages/delivered")
    public ResponseEntity<Map<String, Object>> markAllUndeliveredAsDelivered(Authentication auth) {

        try {
            UserEntity currentUser = getCurrentUser(auth);
            messengerService.markAllUndeliveredAsDeliveredForUser(currentUser);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Messages marked as delivered");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error marking messages as delivered", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * DELETE /api/svmessenger/messages/{id}
     * Изтрий съобщение (soft delete)
     *
     * Response: { "success": true }
     */
    @DeleteMapping("/messages/{id}")
    public ResponseEntity<Map<String, Object>> deleteMessage(
            @PathVariable Long id,
            Authentication auth) {
        
        try {
            UserEntity currentUser = getCurrentUser(auth);
            messengerService.deleteMessage(id, currentUser);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error deleting message", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * PUT /api/svmessenger/messages/{id}/edit
     * Редактирай съобщение
     * 
     * Request body: { "newText": "Updated message" }
     * Response: SVMessageDTO
     */
    @PutMapping("/messages/{id}/edit")
    public ResponseEntity<SVMessageDTO> editMessage(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Authentication auth) {
        
        try {
            UserEntity currentUser = getCurrentUser(auth);
            String newText = request.get("newText");
            
            if (newText == null || newText.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            
            SVMessageDTO message = messengerService.editMessage(id, newText, currentUser);
            
            return ResponseEntity.ok(message);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error editing message", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // ========== USERS & SEARCH ==========
    
    /**
     * GET /api/svmessenger/users/search?query=ivan
     * Търси потребители по username/име
     * 
     * Response: List<SVUserMinimalDTO>
     */
    @GetMapping("/users/search")
    public ResponseEntity<List<SVUserMinimalDTO>> searchUsers(
            @RequestParam String query,
            Authentication auth) {
        
        try {
            UserEntity currentUser = getCurrentUser(auth);
            List<SVUserMinimalDTO> users = messengerService.searchUsers(query, currentUser);
            
            return ResponseEntity.ok(users);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error searching users", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * GET /api/svmessenger/users/following?query=ivan
     * Търси в следвани потребители по username/име
     * 
     * Response: List<SVUserMinimalDTO>
     */
    @GetMapping("/users/following")
    public ResponseEntity<List<SVUserMinimalDTO>> searchFollowingUsers(
            @RequestParam(required = false) String query,
            Authentication auth) {
        
        try {
            UserEntity currentUser = getCurrentUser(auth);
            List<SVUserMinimalDTO> users = messengerService.searchFollowingUsers(query, currentUser);
            
            return ResponseEntity.ok(users);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error searching following users", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // ========== STATISTICS ==========
    
    /**
     * GET /api/svmessenger/unread-count
     * Общ брой непрочетени съобщения
     * 
     * Response: { "count": 5 }
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
        
        try {
            UserEntity currentUser = getCurrentUser(auth);
            Long count = messengerService.getTotalUnreadCount(currentUser);
            
            Map<String, Long> response = new HashMap<>();
            response.put("count", count);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting unread count", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // ========== TYPING STATUS ==========
    
    /**
     * POST /api/svmessenger/typing
     * Update typing status (HTTP fallback за WebSocket)
     * 
     * Request body: { "conversationId": 1, "isTyping": true }
     * Response: { "success": true }
     */
    @PostMapping("/typing")
    public ResponseEntity<Map<String, Object>> updateTypingStatus(
            @RequestBody SVTypingStatusDTO request,
            Authentication auth) {
        
        try {
            UserEntity currentUser = getCurrentUser(auth);
            messengerService.updateTypingStatus(
                    request.getConversationId(),
                    currentUser,
                    request.getIsTyping()
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating typing status", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ========== VOICE CALLS ==========

    /**
     * POST /api/svmessenger/call/token
     * Генерира LiveKit token за voice call
     *
     * Request body: { "conversationId": 1, "otherUserId": 5 }
     * Response: SVCallTokenResponse
     */
    @PostMapping("/call/token")
    public ResponseEntity<SVCallTokenResponse> generateCallToken(
            @RequestBody @Valid SVCallTokenRequest request,
            Authentication auth) {

        try {
            UserEntity currentUser = getCurrentUser(auth);
            SVCallTokenResponse response = messengerService.generateCallToken(
                    request.getConversationId(),
                    currentUser
            );

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid call token request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error generating call token", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/svmessenger/call/token
     * Temporary fallback for testing: allow GET request with query params to obtain token.
     * Query params: ?conversationId=1&otherUserId=5
     *
     * NOTE: This is a temporary convenience endpoint to avoid CORS/CSRF/preflight issues during testing.
     * It should be removed or secured properly before production.
     */
    @GetMapping("/call/token")
    public ResponseEntity<SVCallTokenResponse> generateCallTokenGet(
            @RequestParam Long conversationId,
            @RequestParam(required = false) Long otherUserId,
            Authentication auth) {
        try {
            UserEntity currentUser = getCurrentUser(auth);
            SVCallTokenResponse response = messengerService.generateCallToken(conversationId, currentUser);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid call token request (GET): {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error generating call token (GET)", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/svmessenger/conversations/{id}/call-history
     * Вземи call history за разговор
     * 
     * Response: List<CallHistoryDTO>
     */
    @GetMapping("/conversations/{id}/call-history")
    public ResponseEntity<List<CallHistoryDTO>> getCallHistory(
            @PathVariable Long id,
            Authentication auth) {
        try {
            UserEntity currentUser = getCurrentUser(auth);
            List<CallHistoryDTO> callHistory = messengerService.getCallHistory(id, currentUser);
            return ResponseEntity.ok(callHistory);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid call history request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error getting call history", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // ========== HELPER METHODS ==========
    
    /**
     * Извлича current user от Authentication
     * Works with both traditional authentication, OAuth2 authentication, and JWT authentication.
     */
    private UserEntity getCurrentUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("User not authenticated");
        }
        
        // Проверка дали Principal е вече UserEntity (от JWT filter)
        if (auth.getPrincipal() instanceof UserEntity) {
            return (UserEntity) auth.getPrincipal();
        }
        
        String identifier = null;
        
        // Проверка за OAuth2User (Google/Facebook login)
        if (auth.getPrincipal() instanceof org.springframework.security.oauth2.core.user.OAuth2User) {
            org.springframework.security.oauth2.core.user.OAuth2User oAuth2User = 
                (org.springframework.security.oauth2.core.user.OAuth2User) auth.getPrincipal();
            // За OAuth2, извличаме email от атрибутите
            identifier = oAuth2User.getAttribute("email");
        } else {
            // За традиционна автентикация, използваме getName() (което е email)
            identifier = auth.getName();
        }
        
        if (identifier == null || identifier.isEmpty()) {
            throw new IllegalStateException("User identifier not found");
        }
        
        // Нормализиране на email на малки букви
        String normalizedIdentifier = identifier.toLowerCase().trim();
        
        // Load user от database - първо по email, после по username
        return userRepository.findByEmail(normalizedIdentifier)
                .or(() -> userRepository.findByUsername(normalizedIdentifier))
                .orElseThrow(() -> new IllegalStateException("User not found: " + normalizedIdentifier));
    }
    
    // ========== EXCEPTION HANDLERS ==========
    
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException e) {
        Map<String, String> error = new HashMap<>();
        error.put("error", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
    
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleUnauthorized(IllegalStateException e) {
        Map<String, String> error = new HashMap<>();
        error.put("error", e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneralError(Exception e) {
        log.error("Unexpected error", e);
        Map<String, String> error = new HashMap<>();
        error.put("error", "Internal server error");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
