package smolyanVote.smolyanVote.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.EventImageEntity;

import java.util.List;

@Repository
public interface EventImageRepository extends JpaRepository<EventImageEntity, Long> {

    List<EventImageEntity> findByEventId(Long eventId);
}
