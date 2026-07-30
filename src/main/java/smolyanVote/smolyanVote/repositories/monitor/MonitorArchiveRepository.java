package smolyanVote.smolyanVote.repositories.monitor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.monitor.MonitorArchiveEntity;

import java.util.List;

@Repository
public interface MonitorArchiveRepository extends JpaRepository<MonitorArchiveEntity, Long> {

    List<MonitorArchiveEntity> findByDocumentIdOrderByFetchedAtDesc(Long documentId);
}
