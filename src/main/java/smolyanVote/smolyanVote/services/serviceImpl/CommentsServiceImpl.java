package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.EventEntity;
import smolyanVote.smolyanVote.repositories.CommentsRepository;
import smolyanVote.smolyanVote.repositories.EventRepository;
import smolyanVote.smolyanVote.services.CommentsService;
import smolyanVote.smolyanVote.services.UserService;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Service
public class CommentsServiceImpl implements CommentsService {
    private final CommentsRepository commentsRepository;
    private final EventRepository eventRepository;
    private final UserService userService;

    // 👇 Използва хеш за да ограничи един глас на потребител
    private final Map<String, Map<Long, String>> voteCache = new HashMap<>();



    @Autowired
    public CommentsServiceImpl(CommentsRepository commentRepository,
                               EventRepository eventRepository,
                               UserService userService) {
        this.commentsRepository = commentRepository;
        this.eventRepository = eventRepository;
        this.userService = userService;
    }


    @Override
    public List<CommentsEntity> getCommentsForEvent(Long eventId) {
        return commentsRepository.findRootCommentsWithRepliesByEventId((eventId));
    }


    @Override
    public CommentsEntity addComment(Long eventId, String author, String text, Long parentId) {
        EventEntity event = eventRepository.findById(eventId).orElseThrow();
        CommentsEntity comment = new CommentsEntity();
        comment.setAuthor(userService.getCurrentUser().getUsername());
        comment.setAuthorImage(userService.getCurrentUser().getImageUrl());
        comment.setCreatedAt(Instant.now());
        comment.setText(text);
        comment.setEvent(event);

        if (parentId != null) {
            CommentsEntity parent = commentsRepository.findById(parentId).orElseThrow();
            comment.setParent(parent);
        }

        commentsRepository.save(comment);
        return comment;
    }

    @Override
    public void deleteAllComments() {
        commentsRepository.deleteAll();
    }



    @Override
    public CommentsEntity commentReaction(Long commentId, String type, String username) {
        CommentsEntity comment = commentsRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Коментар не е намерен"));

        // Показваме кешираните гласове за потребителя
        Map<Long, String> userVotes = voteCache.computeIfAbsent(username, k -> new HashMap<>());
        String currentVote = userVotes.get(commentId); // текущия глас на потребителя за коментара

        // Ако гласуването е "like"
        if ("like".equals(type)) {
            if ("like".equals(currentVote)) {
                return comment; // Ако вече е даден like, не правим нищо
            }
            if ("unlike".equals(currentVote)) {
                // Намаляваме броя на dislike, ако потребителят е променил гласа си от "unlike" на "like"
                comment.setUnlikeCount(comment.getUnlikeCount() - 1);
            }
            comment.setLikeCount(comment.getLikeCount() + 1); // Увеличаваме like
            userVotes.put(commentId, "like"); // Записваме новия глас в кеша
        }

        // Ако гласуването е "unlike"
        else if ("unlike".equals(type)) {
            if ("unlike".equals(currentVote)) {
                return comment; // Ако вече е даден unlike, не правим нищо
            }
            if ("like".equals(currentVote)) {
                // Намаляваме броя на like, ако потребителят е променил гласа си от "like" на "unlike"
                comment.setLikeCount(comment.getLikeCount() - 1);
            }
            comment.setUnlikeCount(comment.getUnlikeCount() + 1); // Увеличаваме unlike
            userVotes.put(commentId, "unlike"); // Записваме новия глас в кеша
        }

        // Записваме актуализирания коментар в базата данни
        return commentsRepository.save(comment);
    }

}
