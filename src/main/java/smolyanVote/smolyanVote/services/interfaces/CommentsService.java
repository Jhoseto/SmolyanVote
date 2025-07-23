package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.PublicationEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.CommentReactionType;
import smolyanVote.smolyanVote.viewsAndDTO.CommentOutputDto;

import java.util.List;
import java.util.Map;

public interface CommentsService {

    // ====== ОСНОВНИ МЕТОДИ ======

    /**
     * Извлича коментари за даден обект (publication, simpleEvent, referendum, multiPoll)
     */
    Page<CommentOutputDto> getCommentsForEntity(String entityType, Long entityId, int page, int size, String sort);

    /**
     * Извлича отговори за даден коментар
     */
    Page<CommentOutputDto> getRepliesForComment(Long commentId, int page, int size);

    // ====== СЪЗДАВАНЕ НА КОМЕНТАРИ ======

    /**
     * Добавя коментар към обект (универсален метод)
     */
    CommentsEntity addCommentToEntity(String entityType, Long entityId, String text, UserEntity author);

    /**
     * Добавя коментар към publication
     */
    CommentsEntity addCommentToPublication(Long publicationId, String text, UserEntity author);

    /**
     * Добавя коментар към simpleEvent
     */
    CommentsEntity addCommentToSimpleEvent(Long simpleEventId, String text, UserEntity author);

    /**
     * Добавя коментар към referendum
     */
    CommentsEntity addCommentToReferendum(Long referendumId, String text, UserEntity author);

    /**
     * Добавя коментар към multiPoll
     */
    CommentsEntity addCommentToMultiPoll(Long multiPollId, String text, UserEntity author);

    CommentsEntity addCommentToSignal(Long signalId, String text, UserEntity author);


    /**
     * Добавя отговор към коментар
     */
    CommentsEntity addReplyToComment(Long parentCommentId, String text, UserEntity author);

    // ====== РЕДАКТИРАНЕ И ИЗТРИВАНЕ ======

    /**
     * Редактира коментар
     */
    CommentsEntity updateComment(Long commentId, String newText, UserEntity user);

    /**
     * Изтрива коментар
     */
    void deleteComment(Long commentId, UserEntity user);

    // ====== РЕАКЦИИ ======

    /**
     * Toggle реакция (лайк/дизлайк) за коментар
     */
    Map<String, Object> toggleCommentVote(Long commentId, UserEntity user, CommentReactionType reactionType);

    /**
     * Извлича реакцията на потребител за коментар
     */
    String getUserReaction(Long commentId, String username);

    // ====== БРОЕНЕ ======

    /**
     * Брои коментарите за publication
     */
    long countCommentsForPublication(Long publicationId);

    /**
     * Брои коментарите за simpleEvent
     */
    long countCommentsForSimpleEvent(Long simpleEventId);

    /**
     * Брои коментарите за referendum
     */
    long countCommentsForReferendum(Long referendumId);

    /**
     * Брои коментарите за multiPoll
     */
    long countCommentsForMultiPoll(Long multiPollId);

    // ====== CONVERSION МЕТОДИ ======

    @Transactional(readOnly = true)
    long countCommentsForSignal(Long signalId);

    /**
     * Конвертира CommentsEntity към CommentOutputDto
     */
    CommentOutputDto convertEntityToDto(CommentsEntity comment);

    // ====== UTILITY МЕТОДИ ======


    boolean commentExists(Long commentId);

    /**
     * Извлича коментар по ID
     */
    CommentsEntity getCommentById(Long commentId);

    /**
     * Проверява дали потребител може да редактира коментар
     */
    boolean canUserEditComment(Long commentId, UserEntity user);


    boolean canUserDeleteComment(Long commentId, UserEntity user);

    @Transactional
    void fillCommentsCountsForAllPublications(List<PublicationEntity> publications);
}