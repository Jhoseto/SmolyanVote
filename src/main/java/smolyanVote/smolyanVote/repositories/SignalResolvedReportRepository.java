package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.SignalResolvedReportEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface SignalResolvedReportRepository extends JpaRepository<SignalResolvedReportEntity, Long> {

    long countBySignalId(Long signalId);

    boolean existsByUserIdAndSignalId(Long userId, Long signalId);

    Optional<SignalResolvedReportEntity> findByUserIdAndSignalId(Long userId, Long signalId);

    List<SignalResolvedReportEntity> findByUserId(Long userId);
}
