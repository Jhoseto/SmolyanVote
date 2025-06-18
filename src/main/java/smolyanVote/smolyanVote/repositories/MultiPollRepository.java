package smolyanVote.smolyanVote.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import smolyanVote.smolyanVote.models.MultiPollEntity;

import java.util.List;
import java.util.Optional;

public interface MultiPollRepository extends JpaRepository<MultiPollEntity, Long> {

    Optional<MultiPollEntity> findMultiPollEntitiesById(Long id);

    List<MultiPollEntity> findAllByCreatorName(String creatorName);

    <T> Page<MultiPollEntity> findAll(Specification<T> tSpecification, Pageable pageable);

    List<MultiPollEntity> findAllByCreatorNameIgnoreCase(String usernameLower);
}
