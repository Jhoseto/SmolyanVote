package smolyanVote.smolyanVote.controllers;

import jakarta.validation.Valid;
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

    private final CommentsService commentsService;
    private final UserService userService;

    @Autowired
    public CommentsController(CommentsService commentsService, UserService userService) {
        this.commentsService = commentsService;
        this.userService = userService;
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

        try {
            Page<CommentOutputDto> comments = commentsService.getCommentsForEntity(entityType, entityId, page, size, sort);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("comments", comments.getContent());
            response.put("totalElements", comments.getTotalElements());
            response.put("hasNext", comments.hasNext());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
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
        try {
            Page<CommentOutputDto> replies = commentsService.getRepliesForComment(commentId, page, size);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("comments", replies.getContent());
            response.put("totalElements", replies.getTotalElements());
            response.put("hasNext", replies.hasNext());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
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
        try {
            UserEntity user = userService.getCurrentUser();
            CommentsEntity comment = commentsService.addCommentToEntity(entityType, entityId, request.getText(), user);
            CommentOutputDto commentDto = commentsService.convertEntityToDto(comment);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("comment", commentDto);
            response.put("message", "Коментарът е добавен успешно");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
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
        try {
            UserEntity user = userService.getCurrentUser();
            CommentsEntity reply = commentsService.addReplyToComment(parentCommentId, request.getText(), user);
            CommentOutputDto commentDto = commentsService.convertEntityToDto(reply);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("comment", commentDto);
            response.put("message", "Отговорът е добавен успешно");
            return ResponseEntity.status(201).body(response);
        } catch (Exception e) {
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
        try {
            UserEntity user = userService.getCurrentUser();
            CommentsEntity updatedComment = commentsService.updateComment(commentId, request.getText(), user);
            CommentOutputDto commentDto = commentsService.convertEntityToDto(updatedComment);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("comment", commentDto);
            response.put("message", "Коментарът е обновен успешно");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
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
        try {
            UserEntity user = userService.getCurrentUser();
            commentsService.deleteComment(commentId, user);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Коментарът е изтрит успешно");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
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
        try {
            UserEntity user = userService.getCurrentUser();
            CommentReactionType reaction = CommentReactionType.valueOf(reactionType.toUpperCase());
            Map<String, Object> result = commentsService.toggleCommentVote(commentId, user, reaction);
            result.put("success", true);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Невалиден тип реакция или коментар не съществува");
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
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
        try {
            UserEntity user = userService.getCurrentUser();
            String reaction = commentsService.getUserReaction(commentId, user.getUsername());
            Map<String, String> response = new HashMap<>();
            response.put("userReaction", reaction != null ? reaction : "NONE");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("userReaction", "NONE");
            errorResponse.put("error", "Грешка при извличането на реакцията: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}