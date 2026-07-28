package smolyanVote.smolyanVote.repositories.svmessenger;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.svmessenger.SVMessengerE2EKeyEntity;

import java.util.Optional;

@Repository
public interface SVMessengerE2EKeyRepository extends JpaRepository<SVMessengerE2EKeyEntity, Long> {

    Optional<SVMessengerE2EKeyEntity> findByUserId(Long userId);
}
