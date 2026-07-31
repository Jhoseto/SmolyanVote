package smolyanVote.smolyanVote.repositories.monitor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.monitor.MonitorRegionalReportEntity;

import java.util.Optional;

@Repository
public interface MonitorRegionalReportRepository extends JpaRepository<MonitorRegionalReportEntity, Long> {

    Optional<MonitorRegionalReportEntity> findFirstByAuthorityEikIsNullOrderByGeneratedAtDesc();

    Optional<MonitorRegionalReportEntity> findFirstByAuthorityEikOrderByGeneratedAtDesc(String authorityEik);
}
