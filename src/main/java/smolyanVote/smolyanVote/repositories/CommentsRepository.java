package smolyanVote.smolyanVote.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.CommentsEntity;

import java.util.List;

@Repository
public interface CommentsRepository extends JpaRepository<CommentsEntity, Long> {

    @Query("SELECT c FROM CommentsEntity c LEFT JOIN FETCH c.replies " +
            "WHERE c.event.id = :eventId AND c.parent IS NULL ORDER BY c.createdAt DESC")
    List<CommentsEntity> findRootCommentsWithRepliesByEventId(Long eventId);

    @Query("SELECT c FROM CommentsEntity c LEFT JOIN FETCH c.replies " +
            "WHERE c.referendum.id = :referendumId AND c.parent IS NULL ORDER BY c.createdAt DESC")
    List<CommentsEntity> findRootCommentsWithRepliesByReferendumId(Long referendumId);

    @Query("SELECT c FROM CommentsEntity c LEFT JOIN FETCH c.replies " +
            "WHERE c.multiPoll.id = :multiPollId AND c.parent IS NULL ORDER BY c.createdAt DESC")
    List<CommentsEntity> findRootCommentsWithRepliesByMultiPollId(Long multiPollId);

    @Query("SELECT c FROM CommentsEntity c LEFT JOIN FETCH c.replies " +
            "WHERE c.publication.id = :publicationId AND c.parent IS NULL ORDER BY c.createdAt DESC")
    List<CommentsEntity> findRootCommentsWithRepliesByPublicationId(Long publicationId);

    // За пагинация на коментари
    @Query("SELECT c FROM CommentsEntity c WHERE c.publication.id = :publicationId AND c.parent IS NULL")
    Page<CommentsEntity> findRootCommentsByPublicationId(@Param("publicationId") Long publicationId, Pageable pageable);

    @Query("SELECT c FROM CommentsEntity c WHERE c.parent.id = :parentId")
    Page<CommentsEntity> findRepliesByParentId(@Param("parentId") Long parentId, Pageable pageable);

    // За броене на replies
    @Query("SELECT COUNT(c) FROM CommentsEntity c WHERE c.parent.id = :commentId")
    long countRepliesByCommentId(@Param("commentId") Long commentId);

    @Transactional
    void deleteAllByEvent_Id(Long eventId);

    @Transactional
    void deleteAllByReferendum_Id(Long referendumId);

    @Transactional
    void deleteAllByMultiPoll_Id(Long multiPollId);

    @Transactional
    void deleteAllByPublication_Id(Long publicationId);
}