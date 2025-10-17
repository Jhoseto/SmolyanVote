package smolyanVote.smolyanVote.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.ReferendumEntity;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReferendumRepository extends JpaRepository<ReferendumEntity, Long> {

    Optional<ReferendumEntity> findReferendumById(Long id);

    List<ReferendumEntity> findAllByCreatorName(String creatorName);

    <T> Page<ReferendumEntity> findAll(Specification<T> tSpecification, Pageable pageable);

    List<ReferendumEntity> findAllByCreatorNameIgnoreCase(String usernameLower);
}
