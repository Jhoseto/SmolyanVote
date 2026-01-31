package smolyanVote.smolyanVote.controllers.svmessenger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.services.svmessenger.GeminiTranslationService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/messenger")
public class TranslationController {

    private final GeminiTranslationService geminiTranslationService;

    @Autowired
    public TranslationController(GeminiTranslationService geminiTranslationService) {
        this.geminiTranslationService = geminiTranslationService;
    }

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
            return ResponseEntity.internalServerError().build();
        }
    }
}
