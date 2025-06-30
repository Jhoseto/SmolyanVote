package smolyanVote.smolyanVote.controllers;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.CommentReactionType;
import smolyanVote.smolyanVote.repositories.CommentsRepository;
import smolyanVote.smolyanVote.services.interfaces.CommentsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.CommentDto;
import smolyanVote.smolyanVote.viewsAndDTO.CommentRequestDto;

import java.util.Map;

@RestController
@RequestMapping("/api/comments")
public class CommentsController {

    private final CommentsService commentsService;
    private final UserService userService;
    private final CommentsRepository commentsRepository;

    @Autowired
    public CommentsController(CommentsService commentsService, UserService userService, CommentsRepository commentsRepository) {
        this.commentsService = commentsService;
        this.userService = userService;
        this.commentsRepository = commentsRepository;
    }

    // Извличане на коментари за даден обект (publication, simpleEvent, referendum, multiPoll)
    @GetMapping("/{entityType}/{entityId}")
    public ResponseEntity<Page<CommentDto>> getCommentsForEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "newest") String sort) {
        Page<CommentDto> comments = commentsService.getCommentsForEntity(entityType, entityId, page, size, sort);
        return ResponseEntity.ok(comments);
    }

    // Извличане на отговори за коментар
    @GetMapping("/{commentId}/replies")
    public ResponseEntity<Page<CommentDto>> getRepliesForComment(
            @PathVariable Long commentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<CommentDto> replies = commentsService.getRepliesForComment(commentId, page, size);
        return ResponseEntity.ok(replies);
    }

    // Добавяне на коментар към обект
    @PostMapping("/{entityType}/{entityId}")
    public ResponseEntity<CommentDto> addCommentToEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @Valid @RequestBody CommentRequestDto request) {

        UserEntity user = userService.getCurrentUser();
        CommentsEntity comment = commentsService.addCommentToEntity(entityType, entityId, request.getText(), user);
        CommentDto commentDto = convertToCommentDto(comment);
        return ResponseEntity.status(201).body(commentDto);
    }

    // Добавяне на отговор към коментар
    @PostMapping("/{parentCommentId}/reply")
    public ResponseEntity<CommentDto> addReplyToComment(
            @PathVariable Long parentCommentId,
            @Valid @RequestBody CommentRequestDto request) {

        UserEntity user = userService.getCurrentUser();
        CommentsEntity reply = commentsService.addReplyToComment(parentCommentId, request.getText(), user);
        CommentDto commentDto = convertToCommentDto(reply);
        return ResponseEntity.status(201).body(commentDto);
    }

    // Редактиране на коментар
    @PutMapping("/{commentId}")
    public ResponseEntity<CommentDto> updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequestDto request) {

        UserEntity user = userService.getCurrentUser();
        CommentsEntity updatedComment = commentsService.updateComment(commentId, request.getText(), user);
        CommentDto commentDto = convertToCommentDto(updatedComment);
        return ResponseEntity.ok(commentDto);
    }

    // Изтриване на коментар
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long commentId) {

        UserEntity user = userService.getCurrentUser();
        commentsService.deleteComment(commentId, user);
        return ResponseEntity.noContent().build();
    }

    // Гласуване (лайк/дизлайк) за коментар
    @PostMapping("/{commentId}/vote/{reactionType}")
    public ResponseEntity<Map<String, Object>> toggleCommentVote(
            @PathVariable Long commentId,
            @PathVariable String reactionType) {

        UserEntity user = userService.getCurrentUser();
        CommentReactionType reaction = CommentReactionType.valueOf(reactionType.toUpperCase());
        Map<String, Object> result = commentsService.toggleCommentVote(commentId, user, reaction);
        return ResponseEntity.ok(result);
    }

    // Извличане на реакцията на потребителя за коментар
    @GetMapping("/{commentId}/reaction")
    public ResponseEntity<Map<String, String>> getUserReaction(
            @PathVariable Long commentId) {

        UserEntity user = userService.getCurrentUser();
        String reaction = commentsService.getUserReaction(commentId, user.getUsername());
        return ResponseEntity.ok(Map.of("userReaction", reaction != null ? reaction : "NONE"));
    }

    // Помощен метод за конвертиране на CommentsEntity в CommentDto
    private CommentDto convertToCommentDto(CommentsEntity comment) {
        Long parentId = comment.getParent() != null ? comment.getParent().getId() : null;
        String entityType = null;
        Long entityId = null;

        if (comment.getPublication() != null) {
            entityType = "publication";
            entityId = comment.getPublication().getId();
        } else if (comment.getEvent() != null) {
            entityType = "simpleEvent";
            entityId = comment.getEvent().getId();
        } else if (comment.getReferendum() != null) {
            entityType = "referendum";
            entityId = comment.getReferendum().getId();
        } else if (comment.getMultiPoll() != null) {
            entityType = "multiPoll";
            entityId = comment.getMultiPoll().getId();
        }

        long repliesCount = commentsRepository.countRepliesByParentId(comment.getId());

        return new CommentDto(
                comment.getId(),
                comment.getText(),
                comment.getCreated() != null ? comment.getCreated().toEpochMilli() : null,
                comment.getModified() != null ? comment.getModified().toEpochMilli() : null,
                comment.getAuthor(),
                comment.getAuthorImage(),
                false, // isOnline временно е false
                comment.getLikeCount(),
                comment.getUnlikeCount(),
                (int) repliesCount,
                parentId,
                entityType,
                entityId,
                comment.isEdited()
        );
    }
}