package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.retry.annotation.Retryable;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.CommentReactionType;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.viewsAndDTO.commentsDTO.ReactionCountDto;

import java.util.List;
import java.util.Map;

public interface CommentsService {


    Page<CommentsEntity> getCommentsForEntity(String entityType, Long entityId, int page, int size, String sort);

    CommentsEntity addCommentToEntity(String entityType, Long entityId, String text, UserEntity author);

    @Transactional
    Page<CommentsEntity> getCommentsForSimpleEvent(Long simpleEventId, int page, int size, String sort);

    @Transactional
    Page<CommentsEntity> getCommentsForReferendum(Long referendumId, int page, int size, String sort);

    @Transactional
    Page<CommentsEntity> getCommentsForMultiPoll(Long multiPollId, int page, int size, String sort);

    @Transactional
    CommentsEntity addCommentToSimpleEvent(Long simpleEventId, String text, UserEntity author);

    @Transactional
    CommentsEntity addCommentToReferendum(Long referendumId, String text, UserEntity author);

    @Transactional
    CommentsEntity addCommentToMultiPoll(Long multiPollId, String text, UserEntity author);

    @Transactional
    CommentsEntity addCommentToPublication(Long publicationId, String text, UserEntity author);

    long countCommentsForSimpleEvent(Long simpleEventId);

    long countCommentsForReferendum(Long referendumId);

    long countCommentsForMultiPoll(Long multiPollId);

    @Transactional
    CommentsEntity addComment(Long targetId, String author, String text, Long parentId, EventType targetType);

    @Retryable(interceptor = "commentRetryInterceptor")
    @Transactional
    CommentsEntity commentReaction(Long commentId, String type, String username);

    @Transactional
    String getUserReaction(Long commentId, String username);

    @Transactional
    Map<Long, ReactionCountDto> getReactionsForAllCommentsWithReplies(List<CommentsEntity> comments, String username);

    List<CommentsEntity> getCommentsForTarget(Long targetId, EventType targetType);

    EventType getTargetType(Long id);

    @Transactional
    CommentsEntity updateComment(Long commentId, String newText, UserEntity user);

    @Transactional
    void deleteComment(Long commentId, UserEntity user);

    @Transactional
    Page<CommentsEntity> getCommentsForPublication(Long publicationId, int page, int size, String sort);

    @Transactional
    Page<CommentsEntity> getRepliesForComment(Long commentId, int page, int size);

    CommentsEntity addReplyToComment(Long parentCommentId, String text, UserEntity author);

    Map<String, Object> toggleCommentVote(Long commentId, UserEntity user, CommentReactionType reactionType);

    boolean commentExists(Long commentId);

    CommentsEntity getCommentById(Long commentId);

    boolean canUserEditComment(Long commentId, UserEntity user);

    boolean canUserDeleteComment(Long commentId, UserEntity user);

    long countCommentsForPublication(Long publicationId);
}