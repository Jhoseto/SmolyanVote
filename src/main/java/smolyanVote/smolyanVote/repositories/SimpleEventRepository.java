package smolyanVote.smolyanVote.repositories;

import org.jetbrains.annotations.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.SimpleEventEntity;

import java.util.List;

@Repository
public interface SimpleEventRepository extends JpaRepository<SimpleEventEntity, Long> {

    @EntityGraph(attributePaths = "images")
    List<SimpleEventEntity> findByTitleContaining(String title);

    Page<SimpleEventEntity> findAll(Pageable pageable);

    List<SimpleEventEntity> findAllByCreatorName(String creatorName);

    <T> Page<SimpleEventEntity> findAll(Specification<T> tSpecification, Pageable pageable);

    List<SimpleEventEntity> findAllByCreatorNameIgnoreCase(String usernameLower);
}
