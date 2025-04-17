package smolyanVote.smolyanVote.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import smolyanVote.smolyanVote.models.EventEntity;

import java.util.List;

public interface EventRepository extends JpaRepository<EventEntity, Long> {

    @EntityGraph(attributePaths = "images")
    List<EventEntity> findByTitleContaining(String title);
}
