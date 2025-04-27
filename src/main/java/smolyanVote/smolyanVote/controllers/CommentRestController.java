package smolyanVote.smolyanVote.controllers;

import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.services.CommentsService;
import smolyanVote.smolyanVote.services.UserService;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
public class CommentRestController {

    private final CommentsService commentService;
    private final UserService userService;

    @Autowired
    public CommentRestController(CommentsService commentService,
                                 UserService userService) {
        this.commentService = commentService;
        this.userService = userService;
    }



    // Метод за създаване на основен коментар
    @PostMapping
    public ResponseEntity<Map<String, String>> postMainComment(@RequestParam Long eventId,
                                                               @RequestParam String author,
                                                               @RequestParam String text) {
        // Добавяне на основен коментар в базата данни
        CommentsEntity comment = commentService.addComment(eventId, author, text, null);  // parentId е null за основен коментар
        // Връщане на отговор със съответните данни
        return getMapResponseEntity(text, comment);
    }



    @PostMapping("/reply")
    public ResponseEntity<Map<String, String>> postReply(@RequestParam Long eventId,
                                                         @RequestParam String author,
                                                         @RequestParam String text,
                                                         @RequestParam Long parentId) {
        // Добавяне на отговор в базата данни
        CommentsEntity reply = commentService.addComment(eventId, author, text, parentId);
        // Връщане на отговор със съответните данни
        return getMapResponseEntity(text, reply);
    }




    @NotNull
    private ResponseEntity<Map<String, String>> getMapResponseEntity(@RequestParam String text, CommentsEntity reply) {
        Map<String, String> response = new HashMap<>();
        response.put("id", String.valueOf(reply.getId()));
        response.put("author", reply.getAuthor());
        response.put("authorImage", reply.getAuthorImage());
        response.put("text", text);
        return ResponseEntity.ok(response);
    }



    @PostMapping("/{id}/reaction/{type}")
    public ResponseEntity<Map<String, Integer>> reactToComment(
            @PathVariable Long id,
            @PathVariable String type,
            Principal principal
    ) {
        String username = principal.getName();
        CommentsEntity updated = commentService.commentReaction(id, type, username);

        Map<String, Integer> result = Map.of(
                "likes", updated.getLikeCount(),
                "unlikes", updated.getUnlikeCount()
        );

        return ResponseEntity.ok(result);
    }


}
