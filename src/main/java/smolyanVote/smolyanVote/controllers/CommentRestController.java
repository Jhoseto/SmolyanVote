package smolyanVote.smolyanVote.controllers;

import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.services.interfaces.CommentsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
public class CommentRestController {

    private final CommentsService commentsService;
    private final UserService userService;

    @Autowired
    public CommentRestController(CommentsService commentsService, UserService userService) {
        this.commentsService = commentsService;
        this.userService = userService;
    }




    @PostMapping
    public ResponseEntity<Map<String, String>> postMainComment(@RequestParam Long targetId,
                                                               @RequestParam String author,
                                                               @RequestParam String text) {
        System.out.println("postMainComment called with targetId=" + targetId + ", author=" + author + ", text=" + text);

        EventType targetType = commentsService.getTargetType(targetId);
        System.out.println("Determined targetType: " + targetType);

        try {
            CommentsEntity comment = commentsService.addComment(targetId, author, text, null, targetType);
            return buildCommentResponse(comment, text);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }


    @PostMapping("/reply")
    public ResponseEntity<?> postReply(@RequestParam Long targetId,
                                       @RequestParam String author,
                                       @RequestParam String text,
                                       @RequestParam Long parentId) {
        try {
            EventType targetType = commentsService.getTargetType(targetId);
            CommentsEntity reply = commentsService.addComment(targetId, author, text, parentId, targetType);
            return buildCommentResponse(reply, text);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Unexpected server error: " + e.getMessage()));
        }
    }


    @PostMapping("/{id}/reaction/{type}")
    public ResponseEntity<Map<String, Integer>> reactToComment(@PathVariable Long id,
                                                               @PathVariable String type) {

        UserEntity currentUser = userService.getCurrentUser();
        CommentsEntity updated = commentsService.commentReaction(id, type, currentUser.getUsername());

        Map<String, Integer> result = Map.of(
                "likes", updated.getLikeCount(),
                "dislikes", updated.getUnlikeCount()
        );

        return ResponseEntity.ok(result);
    }

    @NotNull
    private ResponseEntity<Map<String, String>> buildCommentResponse(CommentsEntity comment, String text) {
        Map<String, String> response = new HashMap<>();
        response.put("id", String.valueOf(comment.getId()));
        response.put("author", comment.getAuthor());
        response.put("authorImage", comment.getAuthorImage());
        response.put("text", text);
        return ResponseEntity.ok(response);
    }
}
