package smolyanVote.smolyanVote.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.CommentReactionType;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.services.interfaces.CommentsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.commentsDTO.CommentResponseDto;
import smolyanVote.smolyanVote.viewsAndDTO.commentsDTO.ErrorDto;
import smolyanVote.smolyanVote.viewsAndDTO.commentsDTO.ReactionCountDto;

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

    // Добавяне на главен коментар
    @PostMapping
    public ResponseEntity<?> postMainComment(@RequestParam Long targetId,
                                             @RequestParam String text) {
        return handleCommentSubmission(targetId, text, null);
    }

    // Добавяне на отговор (reply)
    @PostMapping("/reply")
    public ResponseEntity<?> postReply(@RequestParam Long targetId,
                                       @RequestParam String text,
                                       @RequestParam Long parentId) {
        return handleCommentSubmission(targetId, text, parentId);
    }



    // Гласуване (like / dislike) върху коментар
    @PostMapping("/{id}/reaction/{type}")
    public ResponseEntity<?> reactToComment(@PathVariable Long id,
                                            @PathVariable String type) {
        CommentReactionType reactionType;
        try {
            reactionType = CommentReactionType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid reaction type '{}' for comment {}", type, id);
            return ResponseEntity.badRequest().body(new ErrorDto("Invalid reaction type: " + type));
        }

        try {
            UserEntity currentUser = userService.getCurrentUser();
            CommentsEntity updated = commentsService.commentReaction(id, reactionType.name(), currentUser.getUsername());
            String userVote = commentsService.getUserReaction(id, currentUser.getUsername());

            return ResponseEntity.ok(new ReactionCountDto(updated.getLikeCount(), updated.getUnlikeCount(), userVote));
        } catch (Exception e) {
            logger.error("Error reacting to comment {} with type {}: {}", id, type, e.getMessage(), e);
            return ResponseEntity.status(500).body(new ErrorDto("Unexpected server error: " + e.getMessage()));
        }
    }

    private ResponseEntity<?> handleCommentSubmission(Long targetId, String text, Long parentId) {
        try {
            UserEntity currentUser = userService.getCurrentUser();
            EventType targetType = commentsService.getTargetType(targetId);

            logger.info("Submitting comment for targetId={}, type={}, parentId={}, user={}",
                    targetId, targetType, parentId, currentUser.getUsername());

            CommentsEntity comment = commentsService.addComment(
                    targetId, currentUser.getUsername(), text, parentId, targetType);

            CommentResponseDto responseDto = new CommentResponseDto(
                    comment.getId(),
                    comment.getAuthor(),
                    comment.getAuthorImage(),
                    comment.getText(),
                    comment.getParent() != null ? comment.getParent().getId() : null

            );

            return ResponseEntity.ok(responseDto);

        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(new ErrorDto(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(new ErrorDto(e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error while submitting comment: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(new ErrorDto("Unexpected server error: " + e.getMessage()));
        }
    }



    @PutMapping("/{id}")
    public ResponseEntity<?> editComment(@PathVariable Long id,
                                         @RequestParam String text) {
        try {
            UserEntity currentUser = userService.getCurrentUser();
            CommentsEntity updatedComment = commentsService.editComment(id, text, currentUser);

            return ResponseEntity.ok(new CommentResponseDto(
                    updatedComment.getId(),
                    updatedComment.getAuthor(),
                    updatedComment.getAuthorImage(),
                    updatedComment.getText(),
                    updatedComment.getParent() != null ? updatedComment.getParent().getId() : null

            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(new ErrorDto("Нямате права за редактиране."));
        } catch (Exception e) {
            logger.error("Грешка при редактиране: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(new ErrorDto("Сървърна грешка."));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteComment(@PathVariable Long id) {
        try {
            UserEntity currentUser = userService.getCurrentUser();
            commentsService.deleteComment(id, currentUser);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(new ErrorDto("Нямате права за изтриване."));
        } catch (Exception e) {
            logger.error("Грешка при изтриване: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(new ErrorDto("Сървърна грешка."));
        }
    }

}

