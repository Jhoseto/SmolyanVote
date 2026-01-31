package smolyanVote.smolyanVote.controllers.svmessenger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.svmessenger.MessageTranslationEntity;
import smolyanVote.smolyanVote.models.svmessenger.SVMessageEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.repositories.svmessenger.MessageTranslationRepository;
import smolyanVote.smolyanVote.repositories.svmessenger.SVMessageRepository;
import smolyanVote.smolyanVote.services.svmessenger.GeminiTranslationService;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/svmessenger")
@CrossOrigin(origins = "*")
public class TranslationController {

    private final GeminiTranslationService geminiTranslationService;
    private final MessageTranslationRepository messageTranslationRepository;
    private final SVMessageRepository svMessageRepository;
    private final UserRepository userRepository;

    @Autowired
    public TranslationController(
            GeminiTranslationService geminiTranslationService,
            MessageTranslationRepository messageTranslationRepository,
            SVMessageRepository svMessageRepository,
            UserRepository userRepository) {
        this.geminiTranslationService = geminiTranslationService;
        this.messageTranslationRepository = messageTranslationRepository;
        this.svMessageRepository = svMessageRepository;
        this.userRepository = userRepository;
    }

    /**
     * Legacy endpoint - kept for backward compatibility but not actively used
     */
    @PostMapping("/translate")
    public ResponseEntity<Map<String, String>> translateMessage(@RequestBody Map<String, String> payload) {
        String text = payload.get("text");
        String targetLanguage = payload.get("targetLanguage");

        if (text == null || targetLanguage == null) {
            return ResponseEntity.badRequest().build();
        }

        try {
            String translatedText = geminiTranslationService.translateText(text, targetLanguage);

            Map<String, String> response = new HashMap<>();
            response.put("original", text);
            response.put("translated", translatedText);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * New endpoint: Translate and save to DB with per-user isolation
     * Checks cache first, only calls Gemini if translation doesn't exist
     */
    @PostMapping("/translate-and-save")
    public ResponseEntity<Map<String, Object>> translateAndSave(@RequestBody Map<String, Object> payload) {
        try {
            // Extract payload
            Long messageId = Long.valueOf(payload.get("messageId").toString());
            String targetLanguage = (String) payload.get("targetLanguage");

            if (messageId == null || targetLanguage == null) {
                return ResponseEntity.badRequest().build();
            }

            // Get current user from security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            // Check if Principal is already UserEntity (from JWT filter)
            UserEntity currentUser;
            if (authentication.getPrincipal() instanceof UserEntity) {
                currentUser = (UserEntity) authentication.getPrincipal();
            } else {
                // Get identifier (email for most cases)
                String identifier = authentication.getName();
                if (identifier == null || identifier.isEmpty()) {
                    throw new IllegalStateException("User identifier not found");
                }

                // Normalize email to lowercase
                String normalizedIdentifier = identifier.toLowerCase().trim();

                // Load user from database - first by email, then by username
                currentUser = userRepository.findByEmail(normalizedIdentifier)
                        .or(() -> userRepository.findByUsername(normalizedIdentifier))
                        .orElseThrow(() -> new RuntimeException("User not found: " + normalizedIdentifier));
            }

            // Check if translation already exists
            Optional<MessageTranslationEntity> existingTranslation = messageTranslationRepository
                    .findByMessageIdAndUserIdAndTargetLanguage(
                            messageId,
                            currentUser.getId(),
                            targetLanguage);

            if (existingTranslation.isPresent()) {
                // Return cached translation
                Map<String, Object> response = new HashMap<>();
                response.put("messageId", messageId);
                response.put("translatedText", existingTranslation.get().getTranslatedText());
                response.put("targetLanguage", targetLanguage);
                response.put("cached", true);
                return ResponseEntity.ok(response);
            }

            // Get the message
            Optional<SVMessageEntity> messageOpt = svMessageRepository.findById(messageId);
            if (!messageOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            SVMessageEntity message = messageOpt.get();

            // VALIDATION: Users can only translate received messages, not their own
            if (message.getSender().getId().equals(currentUser.getId())) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Cannot translate your own messages");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // Call Gemini API to translate
            String translatedText = geminiTranslationService.translateText(
                    message.getMessageText(),
                    targetLanguage);

            // Save to database
            MessageTranslationEntity newTranslation = new MessageTranslationEntity(
                    message,
                    currentUser,
                    targetLanguage,
                    translatedText);
            messageTranslationRepository.save(newTranslation);

            // Return response
            Map<String, Object> response = new HashMap<>();
            response.put("messageId", messageId);
            response.put("translatedText", translatedText);
            response.put("targetLanguage", targetLanguage);
            response.put("cached", false);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
