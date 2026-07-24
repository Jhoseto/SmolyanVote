package smolyanVote.smolyanVote.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.ProfanityWordEntity;
import smolyanVote.smolyanVote.services.interfaces.ProfanityWordService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/moderation")
@PreAuthorize("hasRole('ADMIN')")
public class AdminModerationController {

    private final ProfanityWordService profanityWordService;

    public AdminModerationController(ProfanityWordService profanityWordService) {
        this.profanityWordService = profanityWordService;
    }

    @GetMapping("/words")
    public ResponseEntity<Map<String, Object>> listWords() {
        List<Map<String, Object>> words = profanityWordService.listAll().stream()
                .map(profanityWordService::toAdminMap)
                .toList();
        Map<String, Object> response = new HashMap<>();
        response.put("words", words);
        response.put("total", words.size());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/words")
    public ResponseEntity<Map<String, Object>> addWord(@RequestBody Map<String, String> body) {
        String word = body.get("word");
        ProfanityWordEntity created = profanityWordService.addWord(word);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("word", profanityWordService.toAdminMap(created));
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/words/{id}")
    public ResponseEntity<Map<String, Object>> setActive(@PathVariable Long id,
                                                         @RequestBody Map<String, Boolean> body) {
        boolean active = Boolean.TRUE.equals(body.get("active"));
        profanityWordService.setActive(id, active);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/words/{id}")
    public ResponseEntity<Map<String, Object>> deleteWord(@PathVariable Long id) {
        profanityWordService.deleteWord(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/words/test")
    public ResponseEntity<Map<String, Object>> testText(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(profanityWordService.testText(body.get("text")));
    }

    @PostMapping("/words/bulk-import")
    public ResponseEntity<Map<String, Object>> bulkImport(@RequestBody Map<String, List<String>> body) {
        List<String> words = body.get("words");
        return ResponseEntity.ok(profanityWordService.bulkImportWords(words));
    }
}
