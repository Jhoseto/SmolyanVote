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
     * Оптимизирано за супер бързо зареждане
     */
    @GetMapping("/{entityType}/{entityId}")
    public ResponseEntity<Page<CommentOutputDto>> getCommentsForEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "newest") String sort) {

        Page<CommentOutputDto> comments = commentsService.getCommentsForEntity(entityType, entityId, page, size, sort);
        return ResponseEntity.ok(comments);
    }

    /**
     * Извличане на отговори за коментар
     * Оптимизирано с user reactions в една заявка
     */
    @GetMapping("/{commentId}/replies")
    public ResponseEntity<Page<CommentOutputDto>> getRepliesForComment(
            @PathVariable Long commentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<CommentOutputDto> replies = commentsService.getRepliesForComment(commentId, page, size);
        return ResponseEntity.ok(replies);
    }

    // ====== ДОБАВЯНЕ НА КОМЕНТАРИ ======

    /**
     * Добавяне на коментар към обект
     */
    @PostMapping("/{entityType}/{entityId}")
    public ResponseEntity<CommentOutputDto> addCommentToEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @Valid @RequestBody CommentInputDto request) {

        UserEntity user = userService.getCurrentUser();
        CommentsEntity comment = commentsService.addCommentToEntity(entityType, entityId, request.getText(), user);

        // Конвертирането се прави в сервиса - няма дублиран код
        CommentOutputDto commentDto = commentsService.convertEntityToDto(comment);
        return ResponseEntity.status(201).body(commentDto);
    }

    /**
     * Добавяне на отговор към коментар
     */
    @PostMapping("/{parentCommentId}/reply")
    public ResponseEntity<CommentOutputDto> addReplyToComment(
            @PathVariable Long parentCommentId,
            @Valid @RequestBody CommentInputDto request) {

        UserEntity user = userService.getCurrentUser();
        CommentsEntity reply = commentsService.addReplyToComment(parentCommentId, request.getText(), user);

        CommentOutputDto commentDto = commentsService.convertEntityToDto(reply);
        return ResponseEntity.status(201).body(commentDto);
    }

    // ====== РЕДАКТИРАНЕ И ИЗТРИВАНЕ ======

    /**
     * Редактиране на коментар
     */
    @PutMapping("/{commentId}")
    public ResponseEntity<CommentOutputDto> updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentInputDto request) {

        UserEntity user = userService.getCurrentUser();
        CommentsEntity updatedComment = commentsService.updateComment(commentId, request.getText(), user);

        CommentOutputDto commentDto = commentsService.convertEntityToDto(updatedComment);
        return ResponseEntity.ok(commentDto);
    }

    /**
     * Изтриване на коментар
     */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId) {
        UserEntity user = userService.getCurrentUser();
        commentsService.deleteComment(commentId, user);
        return ResponseEntity.noContent().build();
    }

    // ====== ГЛАСУВАНЕ ======

    /**
     * Гласуване (лайк/дизлайк) за коментар
     * Върнатият response включва актуализираните counts + userReaction
     */
    @PostMapping("/{commentId}/vote/{reactionType}")
    public ResponseEntity<Map<String, Object>> toggleCommentVote(
            @PathVariable Long commentId,
            @PathVariable String reactionType) {

        UserEntity user = userService.getCurrentUser();
        CommentReactionType reaction = CommentReactionType.valueOf(reactionType.toUpperCase());

        Map<String, Object> result = commentsService.toggleCommentVote(commentId, user, reaction);
        return ResponseEntity.ok(result);
    }

    /**
     * Извличане на реакцията на потребителя за коментар
     * ВНИМАНИЕ: Този endpoint ще стане deprecated защото userReaction
     * ще идва директно в getCommentsForEntity response-а
     */
    @GetMapping("/{commentId}/reaction")
    public ResponseEntity<Map<String, String>> getUserReaction(@PathVariable Long commentId) {
        UserEntity user = userService.getCurrentUser();
        String reaction = commentsService.getUserReaction(commentId, user.getUsername());
        return ResponseEntity.ok(Map.of("userReaction", reaction != null ? reaction : "NONE"));
    }
}