package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.enums.EventType;

import java.util.List;

@Repository
public interface CommentsRepository extends JpaRepository<CommentsEntity, Long> {

    @Query("SELECT c FROM CommentsEntity c LEFT JOIN FETCH c.replies WHERE c.event.id = :eventId AND c.parent IS NULL ORDER BY c.createdAt DESC")
    List<CommentsEntity> findRootCommentsWithRepliesByEventId(Long eventId);

    @Query("SELECT c FROM CommentsEntity c LEFT JOIN FETCH c.replies WHERE c.referendum.id = :referendumId AND c.parent IS NULL ORDER BY c.createdAt DESC")
    List<CommentsEntity> findRootCommentsWithRepliesByReferendumId(Long referendumId);

    List<CommentsEntity> findRootCommentsWithRepliesByMultiPollId(Long multiPollId);
    @Transactional
    void deleteAllByEvent_Id(Long eventId);


    @Transactional
    void deleteAllByReferendum_Id(Long referendumId);

    void deleteAllByMultiPoll_Id(Long eventId);
}

