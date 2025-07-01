package smolyanVote.smolyanVote.controllers;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.CommentReactionType;
import smolyanVote.smolyanVote.services.interfaces.CommentsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.CommentInputDto;
import smolyanVote.smolyanVote.viewsAndDTO.CommentOutputDto;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
public class CommentsController {

    private static final Logger logger = LoggerFactory.getLogger(CommentsController.class);

    private final CommentsService commentsService;
    private final UserService userService;

    @Autowired
    public CommentsController(CommentsService commentsService, UserService userService) {
        this.commentsService = commentsService;
        this.userService = userService;
        logger.info("CommentsController initialized");
    }

    // ====== ИЗВЛИЧАНЕ НА КОМЕНТАРИ ======

    /**
     * Извличане на коментари за даден обект (publication, simpleEvent, referendum, multiPoll)
     * Връща JSON във формат, очакван от фронтенда: {success, comments, totalElements, hasNext}
     */
    @GetMapping("/{entityType}/{entityId}")
    public ResponseEntity<Map<String, Object>> getCommentsForEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "newest") String sort) {
        logger.info("Received request to get comments for entityType: {}, entityId: {}, page: {}, size: {}, sort: {}",
                entityType, entityId, page, size, sort);
        try {
            Page<CommentOutputDto> comments = commentsService.getCommentsForEntity(entityType, entityId, page, size, sort);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("comments", comments.getContent());
            response.put("totalElements", comments.getTotalElements());
            response.put("hasNext", comments.hasNext());
            logger.info("Successfully retrieved {} comments for entityType: {}, entityId: {}",
                    comments.getTotalElements(), entityType, entityId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error retrieving comments for entityType: {}, entityId: {}. Error: {}",
                    entityType, entityId, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Грешка при извличането на коментари: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Извличане на отговори за коментар
     * Връща JSON във формат, очакван от фронтенда: {success, comments, totalElements, hasNext}
     */
    @GetMapping("/{commentId}/replies")
    public ResponseEntity<Map<String, Object>> getRepliesForComment(
            @PathVariable Long commentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        logger.info("Received request to get replies for commentId: {}, page: {}, size: {}",
                commentId, page, size);
        try {
            Page<CommentOutputDto> replies = commentsService.getRepliesForComment(commentId, page, size);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("comments", replies.getContent());
            response.put("totalElements", replies.getTotalElements());
            response.put("hasNext", replies.hasNext());
            logger.info("Successfully retrieved {} replies for commentId: {}",
                    replies.getTotalElements(), commentId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error retrieving replies for commentId: {}. Error: {}",
                    commentId, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Грешка при извличането на отговори: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // ====== ДОБАВЯНЕ НА КОМЕНТАРИ ======

    /**
     * Добавяне на коментар към обект
     * Връща JSON във формат, очакван от фронтенда: {success, comment, message}
     */
    @PostMapping("/{entityType}/{entityId}")
    public ResponseEntity<Map<String, Object>> addCommentToEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @Valid @RequestBody CommentInputDto request) {
        logger.info("Received request to add comment for entityType: {}, entityId: {}, text: {}",
                entityType, entityId, request.getText());
        try {
            UserEntity user = userService.getCurrentUser();
            logger.info("Authenticated user: {}", user.getUsername());
            CommentsEntity comment = commentsService.addCommentToEntity(entityType, entityId, request.getText(), user);
            CommentOutputDto commentDto = commentsService.convertEntityToDto(comment);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("comment", commentDto);
            response.put("message", "Коментарът е добавен успешно");
            logger.info("Successfully added comment with id: {} for entityType: {}, entityId: {}",
                    comment.getId(), entityType, entityId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error adding comment for entityType: {}, entityId: {}. Error: {}",
                    entityType, entityId, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Грешка при добавянето на коментар: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Добавяне на отговор към коментар
     * Връща JSON във формат, очакван от фронтенда: {success, comment, message}
     */
    @PostMapping("/{parentCommentId}/reply")
    public ResponseEntity<Map<String, Object>> addReplyToComment(
            @PathVariable Long parentCommentId,
            @Valid @RequestBody CommentInputDto request) {
        logger.info("Received request to add reply for parentCommentId: {}, text: {}",
                parentCommentId, request.getText());
        try {
            UserEntity user = userService.getCurrentUser();
            logger.info("Authenticated user: {}", user.getUsername());
            CommentsEntity reply = commentsService.addReplyToComment(parentCommentId, request.getText(), user);
            CommentOutputDto commentDto = commentsService.convertEntityToDto(reply);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("comment", commentDto);
            response.put("message", "Отговорът е добавен успешно");
            logger.info("Successfully added reply with id: {} for parentCommentId: {}",
                    reply.getId(), parentCommentId);
            return ResponseEntity.status(201).body(response);
        } catch (Exception e) {
            logger.error("Error adding reply for parentCommentId: {}. Error: {}",
                    parentCommentId, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Грешка при добавянето на отговор: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // ====== РЕДАКТИРАНЕ И ИЗТРИВАНЕ ======

    /**
     * Редактиране на коментар
     * Връща JSON във формат, очакван от фронтенда: {success, comment, message}
     */
    @PutMapping("/{commentId}")
    public ResponseEntity<Map<String, Object>> updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentInputDto request) {
        logger.info("Received request to update commentId: {}, text: {}",
                commentId, request.getText());
        try {
            UserEntity user = userService.getCurrentUser();
            logger.info("Authenticated user: {}", user.getUsername());
            CommentsEntity updatedComment = commentsService.updateComment(commentId, request.getText(), user);
            CommentOutputDto commentDto = commentsService.convertEntityToDto(updatedComment);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("comment", commentDto);
            response.put("message", "Коментарът е обновен успешно");
            logger.info("Successfully updated comment with id: {}", commentId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error updating commentId: {}. Error: {}",
                    commentId, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Грешка при обновяването на коментар: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Изтриване на коментар
     * Връща JSON във формат, очакван от фронтенда: {success, message}
     */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Map<String, Object>> deleteComment(@PathVariable Long commentId) {
        logger.info("Received request to delete commentId: {}", commentId);
        try {
            UserEntity user = userService.getCurrentUser();
            logger.info("Authenticated user: {}", user.getUsername());
            commentsService.deleteComment(commentId, user);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Коментарът е изтрит успешно");
            logger.info("Successfully deleted comment with id: {}", commentId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error deleting commentId: {}. Error: {}",
                    commentId, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Грешка при изтриването на коментар: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // ====== ГЛАСУВАНЕ/РЕАКЦИИ ======

    /**
     * Toggle гласуване (лайк/дизлайк) за коментар
     * Връща JSON във формат, очакван от фронтенда
     */
    @PostMapping("/{commentId}/vote/{reactionType}")
    public ResponseEntity<Map<String, Object>> toggleCommentVote(
            @PathVariable Long commentId,
            @PathVariable String reactionType) {
        logger.info("Received request to toggle vote for commentId: {}, reactionType: {}",
                commentId, reactionType);
        try {
            UserEntity user = userService.getCurrentUser();
            logger.info("Authenticated user: {}", user.getUsername());
            CommentReactionType reaction = CommentReactionType.valueOf(reactionType.toUpperCase());
            Map<String, Object> result = commentsService.toggleCommentVote(commentId, user, reaction);
            result.put("success", true);
            logger.info("Successfully toggled vote for commentId: {}, reaction: {}",
                    commentId, reaction);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid reaction type or comment does not exist for commentId: {}, reactionType: {}. Error: {}",
                    commentId, reactionType, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Невалиден тип реакция или коментар не съществува");
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            logger.error("Error toggling vote for commentId: {}. Error: {}",
                    commentId, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Възникна грешка при гласуването: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Извличане на реакцията на потребителя за коментар
     */
    @GetMapping("/{commentId}/reaction")
    public ResponseEntity<Map<String, String>> getUserReaction(@PathVariable Long commentId) {
        logger.info("Received request to get user reaction for commentId: {}", commentId);
        try {
            UserEntity user = userService.getCurrentUser();
            logger.info("Authenticated user: {}", user.getUsername());
            String reaction = commentsService.getUserReaction(commentId, user.getUsername());
            Map<String, String> response = new HashMap<>();
            response.put("userReaction", reaction != null ? reaction : "NONE");
            logger.info("Successfully retrieved user reaction for commentId: {}, reaction: {}",
                    commentId, reaction != null ? reaction : "NONE");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error retrieving user reaction for commentId: {}. Error: {}",
                    commentId, e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("userReaction", "NONE");
            errorResponse.put("error", "Грешка при извличането на реакцията: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}