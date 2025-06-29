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
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.services.interfaces.CommentsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.commentsDTO.ErrorDto;

import java.time.Instant;
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
     * Зареждане на коментари за публикация
     */
    @GetMapping("/publication/{publicationId}")
    public ResponseEntity<?> getCommentsForPublication(
            @PathVariable Long publicationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "newest") String sort) {

        try {
            Page<CommentsEntity> commentsPage = commentsService.getCommentsForPublication(
                    publicationId, page, size, sort);

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
            logger.error("Error loading comments for publication {}: {}", publicationId, e.getMessage(), e);
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при зареждане на коментарите"));
        }
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
            @RequestParam String text,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        return handleCommentSubmission(targetId, text, null);
    }

    /**
     * Добавяне на отговор (reply)
     */
    @PostMapping("/reply")
    public ResponseEntity<?> postReply(
            @RequestParam Long targetId,
            @RequestParam String text,
            @RequestParam Long parentId,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        return handleCommentSubmission(targetId, text, parentId);
    }

    /**
     * Гласуване (like / dislike) върху коментар
     */
    @PostMapping("/{id}/reaction/{type}")
    public ResponseEntity<?> reactToComment(
            @PathVariable Long id,
            @PathVariable String type,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        CommentReactionType reactionType;
        try {
            reactionType = CommentReactionType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid reaction type '{}' for comment {}", type, id);
            return ResponseEntity.badRequest().body(createErrorResponse("Invalid reaction type: " + type));
        }

        try {
            UserEntity currentUser = userService.getCurrentUser();
            CommentsEntity updated = commentsService.commentReaction(id, reactionType.name(), currentUser.getUsername());
            String userVote = commentsService.getUserReaction(id, currentUser.getUsername());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("likesCount", updated.getLikeCount());
            response.put("dislikesCount", updated.getUnlikeCount());
            response.put("userReaction", userVote);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error reacting to comment {} with type {}: {}", id, type, e.getMessage(), e);
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при реакцията"));
        }
    }

    // ====== PUT ENDPOINTS ======

    /**
     * Редактиране на коментар
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> editComment(
            @PathVariable Long id,
            @RequestBody EditCommentRequest request,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            if (request.getText() == null || request.getText().trim().length() < 3) {
                return ResponseEntity.status(400).body(createErrorResponse("Коментарът трябва да бъде поне 3 символа"));
            }

            if (request.getText().trim().length() > 2000) {
                return ResponseEntity.status(400).body(createErrorResponse("Коментарът не може да бъде повече от 2000 символа"));
            }

            UserEntity currentUser = userService.getCurrentUser();
            CommentsEntity updatedComment = commentsService.editComment(id, request.getText().trim(), currentUser);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("comment", convertCommentToDto(updatedComment));
            response.put("message", "Коментарът е обновен успешно");

            return ResponseEntity.ok(response);

        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(createErrorResponse("Нямате права за редактиране"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(createErrorResponse("Коментарът не е намерен"));
        } catch (Exception e) {
            logger.error("Error editing comment {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при редактирането"));
        }
    }

    // ====== DELETE ENDPOINTS ======

    /**
     * Изтриване на коментар
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteComment(
            @PathVariable Long id,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            UserEntity currentUser = userService.getCurrentUser();
            commentsService.deleteComment(id, currentUser);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Коментарът е изтрит успешно");

            return ResponseEntity.ok(response);

        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(createErrorResponse("Нямате права за изтриване"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(createErrorResponse("Коментарът не е намерен"));
        } catch (Exception e) {
            logger.error("Error deleting comment {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при изтриването"));
        }
    }

    // ====== HELPER METHODS ======

    /**
     * Обработва създаването на коментар или отговор
     */
    private ResponseEntity<?> handleCommentSubmission(Long targetId, String text, Long parentId) {
        try {
            if (text == null || text.trim().length() < 3) {
                return ResponseEntity.status(400).body(createErrorResponse("Коментарът трябва да бъде поне 3 символа"));
            }

            if (text.trim().length() > 2000) {
                return ResponseEntity.status(400).body(createErrorResponse("Коментарът не може да бъде повече от 2000 символа"));
            }

            UserEntity currentUser = userService.getCurrentUser();
            EventType targetType = commentsService.getTargetType(targetId);

            CommentsEntity comment = commentsService.addComment(
                    targetId, currentUser.getUsername(), text.trim(), parentId, targetType);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("comment", convertCommentToDto(comment));
            response.put("message", parentId != null ? "Отговорът е добавен успешно" : "Коментарът е добавен успешно");

            return ResponseEntity.ok(response);

        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(createErrorResponse(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error while submitting comment: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при добавянето на коментара"));
        }
    }

    /**
     * Конвертира CommentsEntity в DTO за JSON response
     */
    private Map<String, Object> convertCommentToDto(CommentsEntity comment) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", comment.getId());
        dto.put("text", comment.getText());
        dto.put("author", comment.getAuthor());
        dto.put("authorImage", comment.getAuthorImage());

        // Конвертираме Instant в LocalDateTime за JSON сериализация
        LocalDateTime createdAt = comment.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDateTime();
        dto.put("createdAt", createdAt);

        dto.put("likesCount", comment.getLikeCount());
        dto.put("dislikesCount", comment.getUnlikeCount());
        dto.put("repliesCount", commentsService.countReplies(comment.getId()));
        dto.put("parentId", comment.getParent() != null ? comment.getParent().getId() : null);
        dto.put("edited", comment.isEdited());

        // Проверяваме дали текущият потребител може да редактира
        try {
            UserEntity currentUser = userService.getCurrentUser();
            dto.put("canEdit", currentUser != null && comment.getAuthor().equals(currentUser.getUsername()));
            dto.put("userReaction", currentUser != null ?
                    commentsService.getUserReaction(comment.getId(), currentUser.getUsername()) : null);
        } catch (Exception e) {
            dto.put("canEdit", false);
            dto.put("userReaction", null);
        }

        return dto;
    }

    /**
     * Създава error response в стандартен формат
     */
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", message);
        return response;
    }

    // ====== REQUEST CLASSES ======

    public static class EditCommentRequest {
        private String text;

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }
    }
}