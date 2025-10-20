package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.PasswordResetTokenEntity;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetTokenEntity, Long> {

    @Query("SELECT t FROM PasswordResetTokenEntity t WHERE t.token = :token AND t.used = false AND t.expiresAt > :now")
    Optional<PasswordResetTokenEntity> findByTokenAndNotUsedAndNotExpired(@Param("token") String token, @Param("now") Instant now);

    @Query("SELECT t FROM PasswordResetTokenEntity t WHERE t.user.id = :userId AND t.used = false AND t.expiresAt > :now")
    Optional<PasswordResetTokenEntity> findByUserIdAndNotUsedAndNotExpired(@Param("userId") Long userId, @Param("now") Instant now);

    @Query("DELETE FROM PasswordResetTokenEntity t WHERE t.expiresAt < :now")
    void deleteExpiredTokens(@Param("now") Instant now);
}
