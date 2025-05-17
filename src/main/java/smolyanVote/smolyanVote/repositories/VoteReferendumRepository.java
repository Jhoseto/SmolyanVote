package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.*;

import java.util.Optional;


@Repository
public interface VoteReferendumRepository extends JpaRepository<VoteReferendumEntity, Long> {
    boolean existsByUserAndReferendum(UserEntity user, ReferendumEntity event);

    Optional<VoteReferendumEntity> findByReferendum_Id(Long referendumId);

    Optional<VoteReferendumEntity> findByUserIdAndReferendum_Id(Long userId, Long referendumId);
}
