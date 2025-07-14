package smolyanVote.smolyanVote.controllers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.services.interfaces.PublicationLinkMetadataService;
import smolyanVote.smolyanVote.services.interfaces.PublicationLinkValidationService;
import smolyanVote.smolyanVote.services.serviceImpl.PublicationLinkValidationServiceImpl;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/links")
public class PublicationsLinkController {

    private final PublicationLinkValidationService validationService;
    private final PublicationLinkMetadataService metadataService;

    @Autowired
    public PublicationsLinkController(PublicationLinkValidationService validationService,
                          PublicationLinkMetadataService metadataService) {
        this.validationService = validationService;
        this.metadataService = metadataService;
    }

    /**
     * API endpoint за извличане на link metadata
     */
    @GetMapping("/preview")
    public ResponseEntity<Map<String, Object>> getLinkPreview(
            @RequestParam String url,
            Authentication auth) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Проверка за автентикация
            if (auth == null || !auth.isAuthenticated()) {
                response.put("success", false);
                response.put("error", "Необходима е автентикация");
                return ResponseEntity.status(401).body(response);
            }

            // Валидация на URL
            PublicationLinkValidationServiceImpl.ValidationResult validation = validationService.validateUrl(url);

            if (!validation.isValid()) {
                response.put("success", false);
                response.put("error", validation.getMessage());
                return ResponseEntity.badRequest().body(response);
            }

            // Извличане на metadata
            String metadata = metadataService.extractMetadata(url);

            response.put("success", true);
            response.put("url", url);
            response.put("metadata", metadata);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Възникна грешка при обработката на линка");
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * API endpoint само за валидация на URL (по-бърз)
     */
    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateUrl(
            @RequestParam String url,
            Authentication auth) {

        Map<String, Object> response = new HashMap<>();

        try {
            if (auth == null || !auth.isAuthenticated()) {
                response.put("success", false);
                response.put("error", "Необходима е автентикация");
                return ResponseEntity.status(401).body(response);
            }

            PublicationLinkValidationServiceImpl.ValidationResult validation = validationService.validateUrl(url);

            response.put("success", validation.isValid());
            response.put("message", validation.getMessage());
            response.put("url", url);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Възникна грешка при валидацията");
            return ResponseEntity.status(500).body(response);
        }
    }
}
