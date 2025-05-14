package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.SimpleEventImageEntity;

import java.util.List;

@Repository
public interface EventImageRepository extends JpaRepository<SimpleEventImageEntity, Long> {

    List<SimpleEventImageEntity> findByEventId(Long eventId);
}
