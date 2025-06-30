package smolyanVote.smolyanVote.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.CommentReactionType;
import smolyanVote.smolyanVote.services.interfaces.CommentsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/comments")
public class CommentRestController {

    private static final Logger logger = LoggerFactory.getLogger(CommentRestController.class);

    private final CommentsService commentsService;
    private final UserService userService;

    @Autowired
    public CommentRestController(CommentsService commentsService, UserService userService) {
        this.commentsService = commentsService;
        this.userService = userService;
    }

    // ====== GET ENDPOINTS ======

    /**
     * НОВИЯ GENERIC ENDPOINT за всички типове entities
     */
    @GetMapping("/{entityType}/{entityId}")
    public ResponseEntity<?> getCommentsForEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "newest") String sort) {

        // Валидация на entityType
        if (!isValidEntityType(entityType)) {
            return ResponseEntity.badRequest().body(createErrorResponse("Invalid entity type: " + entityType));
        }

        try {
            Page<CommentsEntity> commentsPage = commentsService.getCommentsForEntity(
                    entityType, entityId, page, size, sort);

            List<Map<String, Object>> commentsList = commentsPage.getContent().stream()
                    .map(this::convertCommentToDto)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("comments", commentsList);
            response.put("totalElements", commentsPage.getTotalElements());
            response.put("totalPages", commentsPage.getTotalPages());
            response.put("currentPage", page);
            response.put("hasNext", commentsPage.hasNext());
            response.put("hasPrevious", commentsPage.hasPrevious());
            response.put("success", true);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error loading comments for {} {}: {}", entityType, entityId, e.getMessage(), e);
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при зареждане на коментарите"));
        }
    }

    /**
     * Зареждане на коментари за публикация - запазваме за backward compatibility
     */
    @GetMapping("/publication/{publicationId}")
    public ResponseEntity<?> getCommentsForPublication(
            @PathVariable Long publicationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "newest") String sort) {

        return getCommentsForEntity("publication", publicationId, page, size, sort);
    }

    /**
     * Зареждане на отговори за коментар
     */
    @GetMapping("/{commentId}/replies")
    public ResponseEntity<?> getRepliesForComment(
            @PathVariable Long commentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        try {
            Page<CommentsEntity> repliesPage = commentsService.getRepliesForComment(
                    commentId, page, size);

            List<Map<String, Object>> repliesList = repliesPage.getContent().stream()
                    .map(this::convertCommentToDto)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("comments", repliesList);
            response.put("totalElements", repliesPage.getTotalElements());
            response.put("totalPages", repliesPage.getTotalPages());
            response.put("currentPage", page);
            response.put("hasNext", repliesPage.hasNext());
            response.put("hasPrevious", repliesPage.hasPrevious());
            response.put("success", true);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error loading replies for comment {}: {}", commentId, e.getMessage(), e);
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при зареждане на отговорите"));
        }
    }

    // ====== POST ENDPOINTS ======

    /**
     * Добавяне на главен коментар
     */
    @PostMapping
    public ResponseEntity<?> postMainComment(
            @RequestParam Long targetId,
            @RequestParam String targetType,
            @RequestParam String text,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        // Валидация на targetType
        if (!isValidEntityType(targetType)) {
            return ResponseEntity.badRequest().body(createErrorResponse("Invalid target type: " + targetType));
        }

        try {
            UserEntity currentUser = userService.getCurrentUser();

            // Използваме новия generic метод
            CommentsEntity comment = commentsService.addCommentToEntity(
                    targetType, targetId, text, currentUser);

            Map<String, Object> response = new HashMap<>();
            response.put("comment", convertCommentToDto(comment));
            response.put("success", true);
            response.put("message", "Коментарът беше добавен успешно");

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error posting comment to {} {}: {}", targetType, targetId, e.getMessage(), e);
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при добавяне на коментара"));
        }
    }

    /**
     * Добавяне на отговор към коментар
     */
    @PostMapping("/reply")
    public ResponseEntity<?> postReplyComment(
            @RequestParam Long parentId,
            @RequestParam String text,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            UserEntity currentUser = userService.getCurrentUser();
            CommentsEntity reply = commentsService.addReplyToComment(parentId, text, currentUser);

            Map<String, Object> response = new HashMap<>();
            response.put("comment", convertCommentToDto(reply));
            response.put("success", true);
            response.put("message", "Отговорът беше добавен успешно");

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error posting reply to comment {}: {}", parentId, e.getMessage(), e);
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при добавяне на отговора"));
        }
    }

    // ====== PUT/PATCH ENDPOINTS ======

    /**
     * Редактиране на коментар
     */
    @PutMapping("/{commentId}")
    public ResponseEntity<?> updateComment(
            @PathVariable Long commentId,
            @RequestBody Map<String, String> request,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        String newText = request.get("text");
        if (newText == null || newText.trim().isEmpty()) {
            return ResponseEntity.status(400).body(createErrorResponse("Текстът на коментара не може да бъде празен"));
        }

        try {
            UserEntity currentUser = userService.getCurrentUser();
            CommentsEntity updatedComment = commentsService.updateComment(commentId, newText, currentUser);

            Map<String, Object> response = new HashMap<>();
            response.put("comment", convertCommentToDto(updatedComment));
            response.put("success", true);
            response.put("message", "Коментарът беше актуализиран успешно");

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating comment {}: {}", commentId, e.getMessage(), e);
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при актуализиране на коментара"));
        }
    }

    /**
     * Гласуване за коментар
     */
    @PostMapping("/{commentId}/vote")
    public ResponseEntity<?> voteComment(
            @PathVariable Long commentId,
            @RequestParam String voteType,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            CommentReactionType reactionType = CommentReactionType.valueOf(voteType.toUpperCase());
            UserEntity currentUser = userService.getCurrentUser();

            Map<String, Object> voteResult = commentsService.toggleCommentVote(commentId, currentUser, reactionType);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("likeCount", voteResult.get("likeCount"));
            response.put("dislikeCount", voteResult.get("dislikeCount"));
            response.put("userReaction", voteResult.get("userReaction"));
            response.put("message", (String) voteResult.get("message"));

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(createErrorResponse("Невалиден тип гласуване"));
        } catch (Exception e) {
            logger.error("Error voting for comment {}: {}", commentId, e.getMessage(), e);
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при гласуването"));
        }
    }

    // ====== DELETE ENDPOINTS ======

    /**
     * Изтриване на коментар
     */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable Long commentId,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            UserEntity currentUser = userService.getCurrentUser();
            commentsService.deleteComment(commentId, currentUser);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Коментарът беше изтрит успешно");

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error deleting comment {}: {}", commentId, e.getMessage(), e);
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при изтриване на коментара"));
        }
    }

    // ====== UTILITY METHODS ======

    /**
     * Валидира дали entity type е валиден
     */
    private boolean isValidEntityType(String entityType) {
        return List.of("publication", "simpleEvent", "referendum", "multiPoll")
                .contains(entityType);
    }

    /**
     * Конвертира CommentsEntity към DTO за API response
     */
    private Map<String, Object> convertCommentToDto(CommentsEntity comment) {
        Map<String, Object> dto = new HashMap<>();

        dto.put("id", comment.getId());
        dto.put("text", comment.getText());

        // createdAt - използвай правилния тип (Instant, не LocalDateTime)
        if (comment.getCreatedAt() != null) {
            dto.put("createdAt", comment.getCreatedAt().toEpochMilli()); // Instant.toEpochMilli() директно
        } else {
            dto.put("createdAt", null);
        }

        // updatedAt - може да не съществува в твоята CommentsEntity
        try {
            if (comment.getModified() != null) {
                dto.put("updatedAt", comment.getModified().toEpochMilli());
            } else {
                dto.put("updatedAt", null);
            }
        } catch (Exception e) {
            dto.put("updatedAt", null); // Ако методът не съществува
        }

        // Author information
        dto.put("authorId", null); // Няма direct връзка към UserEntity
        dto.put("authorUsername", comment.getAuthor()); // String username
        dto.put("authorImageUrl", comment.getAuthorImage()); // String image URL

        // isOnline - поправи метода
        dto.put("isOnline", false); // Просто върни false за сега, за да не се счупи

        // Vote counts
        dto.put("likeCount", comment.getLikeCount());
        dto.put("dislikeCount", comment.getUnlikeCount());

        // Replies count
        dto.put("repliesCount", comment.getReplies() != null ? comment.getReplies().size() : 0);

        // Parent comment ID if it's a reply
        if (comment.getParent() != null) {
            dto.put("parentId", comment.getParent().getId());
        }

        // Entity associations
        if (comment.getPublication() != null) {
            dto.put("entityType", "publication");
            dto.put("entityId", comment.getPublication().getId());
        } else if (comment.getEvent() != null) {
            dto.put("entityType", "simpleEvent");
            dto.put("entityId", comment.getEvent().getId());
        } else if (comment.getReferendum() != null) {
            dto.put("entityType", "referendum");
            dto.put("entityId", comment.getReferendum().getId());
        } else if (comment.getMultiPoll() != null) {
            dto.put("entityType", "multiPoll");
            dto.put("entityId", comment.getMultiPoll().getId());
        }

        // Edited flag
        try {
            dto.put("edited", comment.isEdited());
        } catch (Exception e) {
            dto.put("edited", false);
        }

        return dto;
    }

    /**
     * Създава стандартен error response
     */
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", message);
        return response;
    }
}