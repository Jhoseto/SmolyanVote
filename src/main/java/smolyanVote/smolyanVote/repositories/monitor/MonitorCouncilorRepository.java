package smolyanVote.smolyanVote.repositories.monitor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.monitor.MonitorCouncilorEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface MonitorCouncilorRepository extends JpaRepository<MonitorCouncilorEntity, Long> {

    List<MonitorCouncilorEntity> findAllByOrderByFullNameAsc();

    List<MonitorCouncilorEntity> findByAuthorityEikOrderByFullNameAsc(String authorityEik);

    Optional<MonitorCouncilorEntity> findByAuthorityEikAndFullName(String authorityEik, String fullName);

    void deleteByAuthorityEik(String authorityEik);
}
