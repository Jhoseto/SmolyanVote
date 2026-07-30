package smolyanVote.smolyanVote.repositories.monitor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.monitor.MonitorAmendmentEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface MonitorAmendmentRepository extends JpaRepository<MonitorAmendmentEntity, Long> {

    List<MonitorAmendmentEntity> findByContractIdOrderByAmendedAtDesc(Long contractId);

    Optional<MonitorAmendmentEntity> findByEopNoticeId(String eopNoticeId);
}
