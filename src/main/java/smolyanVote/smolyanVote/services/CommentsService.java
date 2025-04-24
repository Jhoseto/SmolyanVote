package smolyanVote.smolyanVote.services;

import smolyanVote.smolyanVote.models.CommentsEntity;

import java.util.List;

public interface CommentsService {

    List<CommentsEntity> getCommentsForEvent(Long eventId);

    CommentsEntity addComment(Long eventId, String author, String text, Long parentId);

    void deleteAllComments();
}
