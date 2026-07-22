package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.SignalSubscriptionEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface SignalSubscriptionRepository extends JpaRepository<SignalSubscriptionEntity, Long> {

    Optional<SignalSubscriptionEntity> findByUserIdAndSignalId(Long userId, Long signalId);

    boolean existsByUserIdAndSignalId(Long userId, Long signalId);

    List<SignalSubscriptionEntity> findByUserId(Long userId);

    List<SignalSubscriptionEntity> findBySignalId(Long signalId);

    void deleteByUserIdAndSignalId(Long userId, Long signalId);
}
