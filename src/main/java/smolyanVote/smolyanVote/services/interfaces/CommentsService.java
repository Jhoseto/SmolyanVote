package smolyanVote.smolyanVote.services.interfaces;

import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.EventType;

import java.util.List;

public interface CommentsService {


    CommentsEntity addComment(Long targetId, String author, String text, Long parentId, EventType targetType);

    CommentsEntity commentReaction(Long commentId, String type, String username);

    List<CommentsEntity> getCommentsForTarget(Long targetId, EventType targetType);

    EventType getTargetType(Long id);

    CommentsEntity editComment(Long commentId, String newText, UserEntity user);

    void deleteComment(Long commentId, UserEntity user);

    void deleteAllComments();
}
