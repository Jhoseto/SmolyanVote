package smolyanVote.smolyanVote.repositories.svmessenger;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.svmessenger.MessageTranslationEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageTranslationRepository extends JpaRepository<MessageTranslationEntity, Long> {

    /**
     * Find a specific translation for a message by user and language
     */
    Optional<MessageTranslationEntity> findByMessageIdAndUserIdAndTargetLanguage(
            Long messageId,
            Long userId,
            String targetLanguage);

    /**
     * Bulk fetch translations for multiple messages for a specific user
     * Used when loading a conversation
     */
    @Query("SELECT mt FROM MessageTranslationEntity mt " +
            "WHERE mt.message.id IN :messageIds AND mt.user.id = :userId")
    List<MessageTranslationEntity> findByMessageIdInAndUserId(
            @Param("messageIds") List<Long> messageIds,
            @Param("userId") Long userId);
}
