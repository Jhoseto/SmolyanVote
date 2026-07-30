package smolyanVote.smolyanVote.repositories.monitor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.monitor.MonitorCouncilorEntity;

import java.util.List;

@Repository
public interface MonitorCouncilorRepository extends JpaRepository<MonitorCouncilorEntity, Long> {

    List<MonitorCouncilorEntity> findAllByOrderByFullNameAsc();
}
