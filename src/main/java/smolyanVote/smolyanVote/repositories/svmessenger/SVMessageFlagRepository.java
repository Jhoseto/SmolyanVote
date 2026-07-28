package smolyanVote.smolyanVote.repositories.svmessenger;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.svmessenger.SVMessageFlagEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface SVMessageFlagRepository extends JpaRepository<SVMessageFlagEntity, Long> {

    Optional<SVMessageFlagEntity> findByMessageIdAndUserIdAndKind(
            Long messageId, Long userId, SVMessageFlagEntity.Kind kind);

    @Query("SELECT f.message.id FROM SVMessageFlagEntity f " +
            "WHERE f.user.id = :userId AND f.kind = :kind AND f.message.id IN :messageIds")
    List<Long> findFlaggedMessageIds(@Param("userId") Long userId,
                                     @Param("kind") SVMessageFlagEntity.Kind kind,
                                     @Param("messageIds") List<Long> messageIds);

    @Query("SELECT f FROM SVMessageFlagEntity f JOIN FETCH f.message m JOIN FETCH m.sender " +
            "WHERE f.conversationId = :conversationId AND f.user.id = :userId AND f.kind = :kind " +
            "AND m.isDeleted = false ORDER BY f.createdAt DESC")
    List<SVMessageFlagEntity> findByConversation(@Param("conversationId") Long conversationId,
                                                 @Param("userId") Long userId,
                                                 @Param("kind") SVMessageFlagEntity.Kind kind);

    @Query("SELECT f FROM SVMessageFlagEntity f JOIN FETCH f.message m JOIN FETCH m.sender " +
            "WHERE f.user.id = :userId AND f.kind = :kind AND m.isDeleted = false " +
            "ORDER BY f.createdAt DESC")
    List<SVMessageFlagEntity> findAllForUser(@Param("userId") Long userId,
                                             @Param("kind") SVMessageFlagEntity.Kind kind);
}
