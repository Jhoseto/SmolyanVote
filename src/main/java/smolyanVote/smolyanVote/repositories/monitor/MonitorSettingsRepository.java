package smolyanVote.smolyanVote.repositories.monitor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.monitor.MonitorSettingsEntity;

import java.util.Optional;

@Repository
public interface MonitorSettingsRepository extends JpaRepository<MonitorSettingsEntity, Long> {

    Optional<MonitorSettingsEntity> findTopByOrderByIdAsc();
}
