package smolyanVote.smolyanVote.controllers.svmessenger;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;
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
    
    private final SVMessengerService messengerService;
    private final UserRepository userRepository;
    
    public SVMessengerController(SVMessengerService messengerService, 
                                  UserRepository userRepository) {
        this.messengerService = messengerService;
        this.userRepository = userRepository;
    }
    
    // ========== CONVERSATIONS ==========
    
    /**
     * GET /api/svmessenger/conversations
     * Вземи всички разговори на текущия user
     * 
     * Response: List<SVConversationDTO>
     */
    @GetMapping("/conversations")
    public ResponseEntity<List<SVConversationDTO>> getAllConversations(Authentication auth) {
        log.info("GET /api/svmessenger/conversations");
        
        try {
            UserEntity currentUser = getCurrentUser(auth);
            List<SVConversationDTO> conversations = messengerService.getAllConversations(currentUser);
            
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
        log.info("GET /api/svmessenger/conversations/{}", id);
        
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
        log.info("POST /api/svmessenger/conversations/start with user {}", request.getOtherUserId());
        
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
        log.info("PUT /api/svmessenger/conversations/{}/read", id);
        
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
     * Изтрий разговор (soft delete)
     * 
     * Response: { "success": true }
     */
    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<Map<String, Object>> deleteConversation(
            @PathVariable Long id,
            Authentication auth) {
        log.info("DELETE /api/svmessenger/conversations/{}", id);
        
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
    
    // ========== MESSAGES ==========
    
    /**
     * GET /api/svmessenger/messages/{conversationId}?page=0&size=50
     * Вземи история на съобщения с pagination
     * 
     * Response: Page<SVMessageDTO>
     */
    @GetMapping("/messages/{conversationId}")
    public ResponseEntity<Page<SVMessageDTO>> getMessages(
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication auth) {
        log.info("GET /api/svmessenger/messages/{}?page={}&size={}", conversationId, page, size);
        
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
        log.info("POST /api/svmessenger/messages/send");
        
        try {
            UserEntity currentUser = getCurrentUser(auth);
            SVMessageDTO message = messengerService.sendMessage(
                    request.getConversationId(),
                    request.getText(),
                    currentUser
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
     * PUT /api/svmessenger/messages/{id}/read
     * Маркирай съобщение като прочетено
     * 
     * Response: { "success": true, "readAt": "2025-10-22T10:30:00" }
     */
    @PutMapping("/messages/{id}/read")
    public ResponseEntity<Map<String, Object>> markMessageAsRead(
            @PathVariable Long id,
            Authentication auth) {
        log.info("PUT /api/svmessenger/messages/{}/read", id);
        
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
     * DELETE /api/svmessenger/messages/{id}
     * Изтрий съобщение (soft delete)
     * 
     * Response: { "success": true }
     */
    @DeleteMapping("/messages/{id}")
    public ResponseEntity<Map<String, Object>> deleteMessage(
            @PathVariable Long id,
            Authentication auth) {
        log.info("DELETE /api/svmessenger/messages/{}", id);
        
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
        log.info("PUT /api/svmessenger/messages/{}/edit", id);
        
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
        log.info("GET /api/svmessenger/users/search?query={}", query);
        
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
    
    // ========== STATISTICS ==========
    
    /**
     * GET /api/svmessenger/unread-count
     * Общ брой непрочетени съобщения
     * 
     * Response: { "count": 5 }
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
        log.info("GET /api/svmessenger/unread-count");
        
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
        log.info("POST /api/svmessenger/typing");
        
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
    
    // ========== HELPER METHODS ==========
    
    /**
     * Извлича current user от Authentication
     */
    private UserEntity getCurrentUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("User not authenticated");
        }
        
        // Вземи email/username от authentication
        String identifier = auth.getName();
        
        // Load user от database
        return userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByUsername(identifier))
                .orElseThrow(() -> new IllegalStateException("User not found"));
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
