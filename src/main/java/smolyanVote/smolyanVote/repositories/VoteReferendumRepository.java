package smolyanVote.smolyanVote.repositories;

import io.micrometer.observation.ObservationFilter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.*;

import java.util.Optional;


@Repository
public interface VoteReferendumRepository extends JpaRepository<VoteReferendumEntity, Long> {
    boolean existsByUserAndReferendum(UserEntity user, ReferendumEntity event);

    Optional<VoteReferendumEntity> findByReferendum_IdAndUser_Id(Long referendumId, Long userId);

    @Transactional
    void deleteAllByReferendumId(Long referendumId);

}
