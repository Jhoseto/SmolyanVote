package smolyanVote.smolyanVote.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.EventEntity;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<EventEntity, Long> {

    @EntityGraph(attributePaths = "images")
    List<EventEntity> findByTitleContaining(String title);

    Page<EventEntity> findAll(Pageable pageable);

}
