package smolyanVote.smolyanVote.repositories;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.ReferendumImageEntity;

import java.util.List;

@Repository
public interface ReferendumImageRepository extends JpaRepository<ReferendumImageEntity, Long> {

    List<ReferendumImageEntity> findByReferendumId(Long referendumId);

    @Transactional
    void deleteAllByReferendumId(Long referendumId);

}
