package smolyanVote.smolyanVote.services.serviceImpl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.*;
import smolyanVote.smolyanVote.models.enums.CommentReactionType;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.repositories.CommentVoteRepository;
import smolyanVote.smolyanVote.repositories.CommentsRepository;
import smolyanVote.smolyanVote.repositories.ReferendumRepository;
import smolyanVote.smolyanVote.repositories.SimpleEventRepository;
import smolyanVote.smolyanVote.services.interfaces.CommentsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;

import java.time.Instant;
import java.util.*;

@Service
public class CommentsServiceImpl implements CommentsService {

    private static final Logger logger = LoggerFactory.getLogger(CommentsServiceImpl.class);

    private final CommentsRepository commentsRepository;
    private final SimpleEventRepository simpleEventRepository;
    private final ReferendumRepository referendumRepository;
    private final UserService userService;
    private final CommentVoteRepository commentVoteRepository;
    ;



    @Autowired
    public CommentsServiceImpl(CommentsRepository commentsRepository,
                               SimpleEventRepository simpleEventRepository,
                               ReferendumRepository referendumRepository,
                               UserService userService,
                               CommentVoteRepository commentVoteRepository) {
        this.commentsRepository = commentsRepository;
        this.simpleEventRepository = simpleEventRepository;
        this.referendumRepository = referendumRepository;
        this.userService = userService;
        this.commentVoteRepository = commentVoteRepository;
    }



    @Transactional
    @Override
    public CommentsEntity addComment(Long targetId, String author, String text, Long parentId, EventType targetType) {
        UserEntity user = userService.getCurrentUser();

        CommentsEntity comment = new CommentsEntity();
        comment.setAuthor(user.getUsername());
        comment.setAuthorImage(user.getImageUrl());
        comment.setText(text);
        comment.setCreatedAt(Instant.now());

        switch (targetType) {
            case REFERENDUM -> {
                ReferendumEntity referendum = referendumRepository.findById(targetId)
                        .orElseThrow(() -> new IllegalArgumentException("Referendum not found with ID: " + targetId));
                comment.setReferendum(referendum);
            }
            case SIMPLEEVENT -> {
                SimpleEventEntity event = simpleEventRepository.findById(targetId)
                        .orElseThrow(() -> new IllegalArgumentException("SimpleEvent not found with ID: " + targetId));
                comment.setEvent(event);
            }
            default -> throw new UnsupportedOperationException("Unsupported target type: " + targetType);
        }

        if (parentId != null) {
            CommentsEntity parent = commentsRepository.findById(parentId)
                    .orElseThrow(() -> new IllegalArgumentException("Parent comment not found"));
            comment.setParent(parent);
        }

        return commentsRepository.save(comment);
    }


    @Transactional
    @Override
    public CommentsEntity commentReaction(Long commentId, String type, String username) {
        CommentsEntity comment = commentsRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Коментарът не е намерен"));

        CommentReactionType newReaction = "like".equalsIgnoreCase(type)
                ? CommentReactionType.LIKE
                : CommentReactionType.DISLIKE;

        commentVoteRepository.findByCommentIdAndUsername(commentId, username).ifPresentOrElse(existingVote -> {
            if (existingVote.getReaction() == newReaction) {
                // Няма промяна
                return;
            }

            // Отмени предишния вот
            if (existingVote.getReaction() == CommentReactionType.LIKE) {
                if (comment.getLikeCount() > 0) {
                    comment.setLikeCount(comment.getLikeCount() - 1);
                }
            } else {
                if (comment.getUnlikeCount() > 0) {
                    comment.setUnlikeCount(comment.getUnlikeCount() - 1);
                }
            }

            // Приложи новия вот
            if (newReaction == CommentReactionType.LIKE) {
                comment.setLikeCount(comment.getLikeCount() + 1);
            } else {
                comment.setUnlikeCount(comment.getUnlikeCount() + 1);
            }

            existingVote.setReaction(newReaction);
            commentVoteRepository.save(existingVote);

        }, () -> {
            // Първи вот от този потребител
            if (newReaction == CommentReactionType.LIKE) {
                comment.setLikeCount(comment.getLikeCount() + 1);
            } else {
                comment.setUnlikeCount(comment.getUnlikeCount() + 1);
            }

            CommentVoteEntity vote = new CommentVoteEntity();
            vote.setComment(comment);
            vote.setUsername(username);
            vote.setReaction(newReaction);
            commentVoteRepository.save(vote);
        });

        return commentsRepository.save(comment);
    }


    @Transactional
    @Override
    public List<CommentsEntity> getCommentsForTarget(Long targetId, EventType targetType) {
        return switch (targetType) {
            case REFERENDUM -> commentsRepository.findRootCommentsWithRepliesByReferendumId(targetId);
            case SIMPLEEVENT -> commentsRepository.findRootCommentsWithRepliesByEventId(targetId);
            case SIMPLEPOLL -> null;
            case POLL -> null;
        };
    }

    @Transactional
    @Override
    public EventType getTargetType(Long targetId) {
        boolean isReferendum = referendumRepository.existsById(targetId);
        boolean isEvent = simpleEventRepository.existsById(targetId);

        logger.debug("Checking target type for ID {}: referendum={}, event={}", targetId, isReferendum, isEvent);

        if (isReferendum && isEvent) {
            throw new IllegalStateException("Conflict: ID съществува и като събитие, и като референдум");
        } else if (isReferendum) {
            return EventType.REFERENDUM;
        } else if (isEvent) {
            return EventType.SIMPLEEVENT;
        } else {
            throw new IllegalArgumentException("Target ID not found: " + targetId);
        }
    }

    @Transactional
    @Override
    public void deleteAllComments() {
        commentsRepository.deleteAll();
    }



    @Transactional
    @Override
    public CommentsEntity editComment(Long commentId, String newText, UserEntity user) {
        CommentsEntity comment = commentsRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Коментарът не е намерен."));

        if (!cannotModifyComment(comment, user)) {
            throw new SecurityException("Нямате права за редактиране.");
        }

        comment.setText(newText);
        comment.setEdited(true);
        return commentsRepository.save(comment);
    }

    @Transactional
    @Override
    public void deleteComment(Long commentId, UserEntity user) {
        CommentsEntity comment = commentsRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Коментарът не е намерен."));

        if (cannotModifyComment(comment, user)) {
            throw new SecurityException("Нямате права.");
        }

        commentsRepository.delete(comment);
    }

    private boolean cannotModifyComment(CommentsEntity comment, UserEntity user) {
        return !comment.getAuthor().equals(user.getUsername()) &&
                !user.getRole().equals(UserRole.ADMIN);
    }


}
