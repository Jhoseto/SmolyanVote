package smolyanVote.smolyanVote.repositories;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.ReferendumImageEntity;

@Repository
public interface ReferendumImageRepository extends JpaRepository<ReferendumImageEntity, Long> {


}
