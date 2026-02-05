package smolyanVote.virtualMajor.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.virtualMajor.models.GameResourceSnapshotEntity;

import java.util.List;

@Repository
public interface GameResourceSnapshotRepository extends JpaRepository<GameResourceSnapshotEntity, Long> {
    List<GameResourceSnapshotEntity> findBySessionIdOrderByMonthAscYearAsc(Long sessionId);

    void deleteBySessionId(Long sessionId);
}
