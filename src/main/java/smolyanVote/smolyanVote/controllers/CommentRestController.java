package smolyanVote.smolyanVote.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.services.CommentsService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
public class CommentRestController {

    private final CommentsService commentService;

    public CommentRestController(CommentsService commentService) {
        this.commentService = commentService;
    }

    // Метод за създаване на основен коментар
    @PostMapping
    public ResponseEntity<Map<String, String>> postMainComment(@RequestParam Long eventId,
                                                               @RequestParam String author,
                                                               @RequestParam String text) {
        // Добавяне на основен коментар в базата данни
        CommentsEntity comment = commentService.addComment(eventId, author, text, null);  // parentId е null за основен коментар

        // Връщане на отговор със съответните данни
        Map<String, String> response = new HashMap<>();
        response.put("id", String.valueOf(comment.getId()));  // Добавяне на ID на коментара
        response.put("author", author);
        response.put("text", text);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/reply")
    public ResponseEntity<Map<String, String>> postReply(@RequestParam Long eventId,
                                                         @RequestParam String author,
                                                         @RequestParam String text,
                                                         @RequestParam Long parentId) {

        // Добавяне на отговор в базата данни
        CommentsEntity reply = commentService.addComment(eventId, author, text, parentId);

        // Връщане на отговор със съответните данни
        Map<String, String> response = new HashMap<>();
        response.put("id", String.valueOf(reply.getId()));
        response.put("author", author);
        response.put("text", text);

        return ResponseEntity.ok(response);
    }

}
