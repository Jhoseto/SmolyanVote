package smolyanVote.smolyanVote.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.PublicationEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.CommentReactionType;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.repositories.PublicationRepository;
import smolyanVote.smolyanVote.services.interfaces.CommentsService;
import smolyanVote.smolyanVote.services.interfaces.PublicationService;
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
    private final PublicationRepository publicationRepository;
    private final PublicationService publicationService;

    @Autowired
    public CommentRestController(CommentsService commentsService,
                                 UserService userService,
                                 PublicationRepository publicationRepository,
                                 PublicationService publicationService) {
        this.commentsService = commentsService;
        this.userService = userService;
        this.publicationRepository = publicationRepository;
        this.publicationService = publicationService;
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
            @RequestParam(required = false) Long parentId,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            UserEntity user = userService.getCurrentUser();
            if (user == null) {
                return ResponseEntity.status(401).body(createErrorResponse("Потребителят не е намерен"));
            }

            // Създаваме коментара
            CommentsEntity comment = commentsService.addComment(
                    targetId, user.getUsername(), text, parentId, EventType.PUBLICATION);

            // ✅ ПОПРАВКА: Вземаме актуализираната публикация и връщаме новия брой коментари
            PublicationEntity publication = publicationRepository.findById(targetId)
                    .orElse(null);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Коментарът е добавен успешно");
            response.put("comment", convertCommentToDto(comment));

            // ✅ ВАЖНО: Връщаме актуализирания брой коментари
            if (publication != null) {
                response.put("newCommentsCount", publication.getCommentsCount());
            }

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error creating comment: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при създаването на коментара"));
        }
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
    @PostMapping("/{commentId}/react")
    public ResponseEntity<?> reactToComment(
            @PathVariable Long commentId,
            @RequestParam String type,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            UserEntity user = userService.getCurrentUser();
            if (user == null) {
                return ResponseEntity.status(401).body(createErrorResponse("Потребителят не е намерен"));
            }

            // Използваме съществуващия метод commentReaction
            CommentsEntity updatedComment = commentsService.commentReaction(commentId, type, user.getUsername());

            // Получаваме user reaction
            String userReaction = commentsService.getUserReaction(commentId, user.getUsername());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("userReaction", userReaction);
            response.put("likesCount", updatedComment.getLikeCount());
            response.put("dislikesCount", updatedComment.getUnlikeCount());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error reacting to comment {}: {}", commentId, e.getMessage(), e);
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

// ====== STATS ENDPOINT (БЕЗ УВЕЛИЧАВАНЕ НА ПРЕГЛЕДИ) ======

    @GetMapping(value = "/api/{id}/stats", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getPublicationStats(
            @PathVariable Long id,
            Authentication auth) {

        try {
            PublicationEntity publication = publicationService.findById(id);
            if (publication == null) {
                return ResponseEntity.status(404).body(createErrorResponse("Публикацията не е намерена"));
            }

            // Check viewing permissions
            if (!publicationService.canViewPublication(publication, auth)) {
                return ResponseEntity.status(403).body(createErrorResponse("Нямате права за гледане на тази публикация"));
            }

            Map<String, Object> stats = new HashMap<>();
            stats.put("id", publication.getId());
            stats.put("viewsCount", publication.getViewsCount());
            stats.put("likesCount", publication.getLikesCount());
            stats.put("dislikesCount", publication.getDislikesCount());
            stats.put("commentsCount", publication.getCommentsCount());
            stats.put("sharesCount", publication.getSharesCount());

            // Add user interaction flags if authenticated
            if (auth != null && auth.isAuthenticated()) {
                try {
                    UserEntity currentUser = userService.getCurrentUser();
                    if (currentUser != null) {
                        String username = currentUser.getUsername();
                        stats.put("isLiked", publication.isLikedBy(username));
                        stats.put("isDisliked", publication.isDislikedBy(username));
                        stats.put("isBookmarked", publication.isBookmarkedBy(username));
                    }
                } catch (Exception e) {
                    // Ignore user interaction errors
                }
            }

            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при зареждането на статистиките"));
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