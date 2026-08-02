package smolyanVote.smolyanVote.repositories.monitor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.enums.MonitorIngestionStatus;
import smolyanVote.smolyanVote.models.enums.MonitorIngestionType;
import smolyanVote.smolyanVote.models.monitor.MonitorIngestionRunEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface MonitorIngestionRunRepository extends JpaRepository<MonitorIngestionRunEntity, Long> {

    Optional<MonitorIngestionRunEntity> findFirstByIngestionTypeOrderByStartedAtDesc(MonitorIngestionType type);

    List<MonitorIngestionRunEntity> findTop20ByOrderByStartedAtDesc();

    List<MonitorIngestionRunEntity> findByStatus(MonitorIngestionStatus status);
}
