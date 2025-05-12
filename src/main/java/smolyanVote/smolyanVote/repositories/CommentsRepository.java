package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.CommentsEntity;
import java.util.List;

@Repository
public interface CommentsRepository extends JpaRepository<CommentsEntity, Long> {

    @Query("SELECT c FROM CommentsEntity c LEFT JOIN FETCH c.replies WHERE c.event.id = :eventId AND c.parent IS NULL ORDER BY c.createdAt DESC")
    List<CommentsEntity> findRootCommentsWithRepliesByEventId(Long eventId);

}

