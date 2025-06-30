package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.data.domain.Page;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.CommentReactionType;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.viewsAndDTO.CommentDto;

import java.util.List;
import java.util.Map;

public interface CommentsService {
    Page<CommentDto> getCommentsForEntity(String entityType, Long entityId, int page, int size, String sort);
    Page<CommentDto> getRepliesForComment(Long commentId, int page, int size);
    Page<CommentDto> getCommentsForPublication(Long publicationId, int page, int size, String sort);
    Page<CommentDto> getCommentsForSimpleEvent(Long simpleEventId, int page, int size, String sort);
    Page<CommentDto> getCommentsForReferendum(Long referendumId, int page, int size, String sort);
    Page<CommentDto> getCommentsForMultiPoll(Long multiPollId, int page, int size, String sort);
    CommentsEntity addCommentToEntity(String entityType, Long entityId, String text, UserEntity author);
    CommentsEntity addCommentToSimpleEvent(Long simpleEventId, String text, UserEntity author);
    CommentsEntity addCommentToReferendum(Long referendumId, String text, UserEntity author);
    CommentsEntity addCommentToMultiPoll(Long multiPollId, String text, UserEntity author);
    CommentsEntity addCommentToPublication(Long publicationId, String text, UserEntity author);
    long countCommentsForSimpleEvent(Long simpleEventId);
    long countCommentsForReferendum(Long referendumId);
    long countCommentsForMultiPoll(Long multiPollId);
    long countCommentsForPublication(Long publicationId);
    CommentsEntity addComment(Long targetId, String author, String text, Long parentId, EventType targetType);
    CommentsEntity commentReaction(Long commentId, String type, String username);
    String getUserReaction(Long commentId, String username);
    List<CommentsEntity> getCommentsForTarget(Long targetId, EventType targetType);
    EventType getTargetType(Long id);
    CommentsEntity updateComment(Long commentId, String newText, UserEntity user);
    void deleteComment(Long commentId, UserEntity user);
    boolean commentExists(Long commentId);
    CommentsEntity getCommentById(Long commentId);
    boolean canUserEditComment(Long commentId, UserEntity user);
    boolean canUserDeleteComment(Long commentId, UserEntity user);
    CommentsEntity addReplyToComment(Long parentCommentId, String text, UserEntity author);
    Map<String, Object> toggleCommentVote(Long commentId, UserEntity user, CommentReactionType reactionType);
}