package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.ReferendumEntity;
import smolyanVote.smolyanVote.models.SimpleEventEntity;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.repositories.CommentsRepository;
import smolyanVote.smolyanVote.repositories.ReferendumRepository;
import smolyanVote.smolyanVote.repositories.SimpleEventRepository;
import smolyanVote.smolyanVote.services.interfaces.CommentsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CommentsServiceImpl implements CommentsService {

    private final CommentsRepository commentsRepository;
    private final SimpleEventRepository simpleEventRepository;
    private final ReferendumRepository referendumRepository;
    private final UserService userService;

    private final Map<String, Map<Long, String>> voteCache = new HashMap<>();

    @Autowired
    public CommentsServiceImpl(CommentsRepository commentsRepository,
                               SimpleEventRepository simpleEventRepository,
                               ReferendumRepository referendumRepository,
                               UserService userService) {
        this.commentsRepository = commentsRepository;
        this.simpleEventRepository = simpleEventRepository;
        this.referendumRepository = referendumRepository;
        this.userService = userService;
    }


    @Override
    public CommentsEntity addComment(Long targetId, String author, String text, Long parentId, EventType targetType) {
        CommentsEntity comment = new CommentsEntity();
        comment.setAuthor(userService.getCurrentUser().getUsername());
        comment.setAuthorImage(userService.getCurrentUser().getImageUrl());
        comment.setCreatedAt(Instant.now());
        comment.setText(text);

        if (targetType.equals(EventType.REFERENDUM)) {
            ReferendumEntity referendum = referendumRepository.findById(targetId).orElseThrow();
            comment.setReferendum(referendum);

        } else if (targetType.equals(EventType.SIMPLEEVENT)) {
            SimpleEventEntity event = simpleEventRepository.findById(targetId).orElseThrow();
            comment.setEvent(event);
        }

        if (parentId != null) {
            CommentsEntity parent = commentsRepository.findById(parentId).orElseThrow();
            comment.setParent(parent);
        }

        return commentsRepository.save(comment);
    }


    @Override
    public CommentsEntity commentReaction(Long commentId, String type, String username) {
        CommentsEntity comment = commentsRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Коментарът не е намерен"));

        Map<Long, String> userVotes = voteCache.computeIfAbsent(username, k -> new HashMap<>());
        String currentVote = userVotes.get(commentId);

        if ("like".equals(type)) {
            if ("like".equals(currentVote)) return comment;
            if ("dislikes".equals(currentVote)) {
                comment.setUnlikeCount(comment.getUnlikeCount() - 1);
            }
            comment.setLikeCount(comment.getLikeCount() + 1);
            userVotes.put(commentId, "like");
        } else if ("dislikes".equals(type)) {
            if ("dislikes".equals(currentVote)) return comment;
            if ("like".equals(currentVote)) {
                comment.setLikeCount(comment.getLikeCount() - 1);
            }
            comment.setUnlikeCount(comment.getUnlikeCount() + 1);
            userVotes.put(commentId, "dislikes");
        }

        return commentsRepository.save(comment);
    }


    @Override
    public List<CommentsEntity> getCommentsForTarget(Long targetId, EventType targetType) {
        return switch (targetType) {
            case REFERENDUM -> commentsRepository.findRootCommentsWithRepliesByReferendumId(targetId);
            case SIMPLEEVENT -> commentsRepository.findRootCommentsWithRepliesByEventId(targetId);
            default -> throw new UnsupportedOperationException("Неподдържан тип за коментари: " + targetType);
        };
    }




    public EventType getTargetType(Long targetId) {
        boolean isReferendum = referendumRepository.existsById(targetId);
        boolean isEvent = simpleEventRepository.existsById(targetId);
        System.out.println("getTargetType: targetId=" + targetId + ", isReferendum=" + isReferendum + ", isEvent=" + isEvent);
        if (isReferendum && isEvent) {
            throw new IllegalStateException("Conflict: targetId exists in both event and referendum");
        } else if (isReferendum) {
            return EventType.REFERENDUM;
        } else if (isEvent) {
            return EventType.SIMPLEEVENT;
        } else {
            throw new IllegalArgumentException("Target ID not found");
        }
    }




    @Override
    public void deleteAllComments() {
        commentsRepository.deleteAll();
    }

}
