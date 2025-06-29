package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.viewsAndDTO.commentsDTO.ReactionCountDto;

import java.util.List;
import java.util.Map;

public interface CommentsService {


    CommentsEntity addComment(Long targetId, String author, String text, Long parentId, EventType targetType);

    CommentsEntity commentReaction(Long commentId, String type, String username);

    @Transactional
    String getUserReaction(Long commentId, String username);

    @Transactional
    Map<Long, ReactionCountDto> getReactionsForAllCommentsWithReplies(List<CommentsEntity> comments, String username);

    List<CommentsEntity> getCommentsForTarget(Long targetId, EventType targetType);

    EventType getTargetType(Long id);

    CommentsEntity editComment(Long commentId, String newText, UserEntity user);

    void deleteComment(Long commentId, UserEntity user);

    void deleteAllComments();

    @Transactional
    Page<CommentsEntity> getCommentsForPublication(Long publicationId, int page, int size, String sort);

    @Transactional
    Page<CommentsEntity> getRepliesForComment(Long commentId, int page, int size);

    @Transactional
    long countReplies(Long commentId);

    @Transactional
    Page<CommentsEntity> getCommentsForTargetPaginated(Long targetId, EventType targetType, Pageable pageable);

    @Transactional(readOnly = true)
    boolean hasRecentComment(UserEntity user, int minutesLimit);
}
