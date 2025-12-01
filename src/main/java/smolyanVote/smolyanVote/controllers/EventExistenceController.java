package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.repositories.MultiPollRepository;
import smolyanVote.smolyanVote.repositories.ReferendumRepository;
import smolyanVote.smolyanVote.repositories.SimpleEventRepository;

import java.util.HashMap;
import java.util.Map;

/**
 * REST Controller за проверка на съществуване на събития
 * Използва се от notification системата за да избегне Thymeleaf грешки
 */
@RestController
@RequestMapping("/api")
public class EventExistenceController {

    private final SimpleEventRepository simpleEventRepository;
    private final ReferendumRepository referendumRepository;
    private final MultiPollRepository multiPollRepository;

    @Autowired
    public EventExistenceController(SimpleEventRepository simpleEventRepository,
                                    ReferendumRepository referendumRepository,
                                    MultiPollRepository multiPollRepository) {
        this.simpleEventRepository = simpleEventRepository;
        this.referendumRepository = referendumRepository;
        this.multiPollRepository = multiPollRepository;
    }

    @GetMapping(value = "/event/{id}/exists", produces = "application/json")
    public ResponseEntity<Map<String, Object>> checkEventExists(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        boolean exists = simpleEventRepository.existsById(id);
        response.put("exists", exists);
        return exists ? ResponseEntity.ok(response) : ResponseEntity.notFound().build();
    }

    @GetMapping(value = "/referendum/{id}/exists", produces = "application/json")
    public ResponseEntity<Map<String, Object>> checkReferendumExists(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        boolean exists = referendumRepository.existsById(id);
        response.put("exists", exists);
        return exists ? ResponseEntity.ok(response) : ResponseEntity.notFound().build();
    }

    @GetMapping(value = "/multipoll/{id}/exists", produces = "application/json")
    public ResponseEntity<Map<String, Object>> checkMultiPollExists(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        boolean exists = multiPollRepository.existsById(id);
        response.put("exists", exists);
        return exists ? ResponseEntity.ok(response) : ResponseEntity.notFound().build();
    }
}

