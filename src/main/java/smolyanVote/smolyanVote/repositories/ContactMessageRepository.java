package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import smolyanVote.smolyanVote.models.ContactMessageEntity;

public interface ContactMessageRepository extends JpaRepository<ContactMessageEntity, Long> {

}
