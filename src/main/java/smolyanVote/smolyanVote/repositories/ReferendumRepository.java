package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.ReferendumEntity;

import java.util.Optional;

@Repository
public interface ReferendumRepository extends JpaRepository<ReferendumEntity, Long> {

    Optional<ReferendumEntity> findReferendumById(Long id);
}
