package smolyanVote.smolyanVote.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.CommentReactionType;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.services.interfaces.CommentsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.CommentResponseDto;

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

    @PostMapping
    public ResponseEntity<?> postMainComment(@RequestParam Long targetId,
                                             @RequestParam String text) {
        return handleCommentSubmission(targetId, text, null);
    }

    @PostMapping("/reply")
    public ResponseEntity<?> postReply(@RequestParam Long targetId,
                                       @RequestParam String text,
                                       @RequestParam Long parentId) {
        return handleCommentSubmission(targetId, text, parentId);
    }

    @PostMapping("/{id}/reaction/{type}")
    public ResponseEntity<?> reactToComment(@PathVariable Long id,
                                            @PathVariable CommentReactionType type) {
        try {
            UserEntity currentUser = userService.getCurrentUser();
            CommentsEntity updated = commentsService.commentReaction(id, type.name(), currentUser.getUsername());

            return ResponseEntity.ok(new ReactionCountDto(updated.getLikeCount(), updated.getUnlikeCount()));
        } catch (Exception e) {
            logger.error("Error reacting to comment {} with type {}: {}", id, type, e.getMessage());
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
                    targetId, currentUser.getUsername(), text, parentId, targetType
            );

            CommentResponseDto responseDto = new CommentResponseDto(
                    comment.getId(),
                    comment.getAuthor(),
                    comment.getAuthorImage(),
                    text
            );

            return ResponseEntity.ok(responseDto);

        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(new ErrorDto(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(new ErrorDto(e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error while submitting comment: {}", e.getMessage());
            return ResponseEntity.status(500).body(new ErrorDto("Unexpected server error: " + e.getMessage()));
        }
    }

    // TODO DTO класове (може да се премести в отделен пакет, напр. `web.dto`)
    public static class ReactionCountDto {
        public int likes;
        public int dislikes;

        public ReactionCountDto(int likes, int dislikes) {
            this.likes = likes;
            this.dislikes = dislikes;
        }
    }

    public static class ErrorDto {
        public String error;

        public ErrorDto(String error) {
            this.error = error;
        }
    }
}
