package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.PublicationEntity;
import smolyanVote.smolyanVote.services.interfaces.PublicationService;
import smolyanVote.smolyanVote.services.interfaces.UserService;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/publications/detail")
public class PublicationsDetailController {

    private final PublicationService publicationService;
    private final UserService userService;

    @Autowired
    public PublicationsDetailController(PublicationService publicationService,
                                        UserService userService) {
        this.publicationService = publicationService;
        this.userService = userService;
    }

    // ====== PUBLICATION DETAIL API ======

    @GetMapping(value = "/api/{id}", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getPublicationDetail(
            @PathVariable Long id,
            Authentication auth) {

        try {
            PublicationEntity publication = publicationService.findById(id);
            if (publication == null) {
                return ResponseEntity.notFound().build();
            }

            if (!publicationService.canViewPublication(publication, auth)) {
                return ResponseEntity.status(403).body(createErrorResponse("Нямате права за гледане на тази публикация"));
            }

            // Increment view count
            publicationService.incrementViewCount(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("publication", publication);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при зареждането на публикацията"));
        }
    }

    // ====== HELPER METHODS ======

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", message);
        return response;
    }
}