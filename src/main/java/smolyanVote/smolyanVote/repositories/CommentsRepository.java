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
            "WHERE c.event.id = :eventId AND c.parent IS NULL ORDER BY c.created DESC")
    List<CommentsEntity> findRootCommentsWithRepliesByEventId(Long eventId);

    @Query("SELECT c FROM CommentsEntity c LEFT JOIN FETCH c.replies " +
            "WHERE c.referendum.id = :referendumId AND c.parent IS NULL ORDER BY c.created DESC")
    List<CommentsEntity> findRootCommentsWithRepliesByReferendumId(Long referendumId);

    @Query("SELECT c FROM CommentsEntity c LEFT JOIN FETCH c.replies " +
            "WHERE c.multiPoll.id = :multiPollId AND c.parent IS NULL ORDER BY c.created DESC")
    List<CommentsEntity> findRootCommentsWithRepliesByMultiPollId(Long multiPollId);

    @Query("SELECT c FROM CommentsEntity c LEFT JOIN FETCH c.replies " +
            "WHERE c.publication.id = :publicationId AND c.parent IS NULL ORDER BY c.created DESC")
    List<CommentsEntity> findRootCommentsWithRepliesByPublicationId(Long publicationId);

    @Query("SELECT c FROM CommentsEntity c WHERE c.publication.id = :publicationId AND c.parent IS NULL ORDER BY c.created DESC")
    Page<CommentsEntity> findRootCommentsByPublicationId(@Param("publicationId") Long publicationId, Pageable pageable);

    @Query("SELECT c FROM CommentsEntity c WHERE c.parent.id = :parentId ORDER BY c.created ASC")
    Page<CommentsEntity> findRepliesByParentId(@Param("parentId") Long parentId, Pageable pageable);

    @Transactional
    void deleteAllByEvent_Id(Long eventId);

    @Transactional
    void deleteAllByReferendum_Id(Long referendumId);

    @Transactional
    void deleteAllByMultiPoll_Id(Long multiPollId);

    @Query("SELECT c FROM CommentsEntity c WHERE c.referendum.id = :referendumId AND c.parent IS NULL ORDER BY c.created DESC")
    Page<CommentsEntity> findByReferendumIdOrderByCreatedDesc(@Param("referendumId") Long referendumId, Pageable pageable);

    @Query("SELECT COUNT(c) FROM CommentsEntity c WHERE c.referendum.id = :referendumId")
    long countByReferendumId(@Param("referendumId") Long referendumId);

    @Query("SELECT c FROM CommentsEntity c WHERE c.multiPoll.id = :multiPollId AND c.parent IS NULL ORDER BY c.created DESC")
    Page<CommentsEntity> findByMultiPollIdOrderByCreatedDesc(@Param("multiPollId") Long multiPollId, Pageable pageable);

    @Query("SELECT COUNT(c) FROM CommentsEntity c WHERE c.multiPoll.id = :multiPollId")
    long countByMultiPollId(@Param("multiPollId") Long multiPollId);

    Page<CommentsEntity> findByEventIdOrderByCreatedDesc(Long simpleEventId, Pageable pageable);

    long countByEventId(Long simpleEventId);

    long countByPublicationId(Long publicationId);

    @Query("SELECT c FROM CommentsEntity c WHERE c.publication.id = :publicationId AND c.parent IS NULL ORDER BY c.created DESC")
    Page<CommentsEntity> findRootCommentsDtoByPublicationId(@Param("publicationId") Long publicationId, Pageable pageable);

    @Query("SELECT c FROM CommentsEntity c WHERE c.event.id = :eventId AND c.parent IS NULL ORDER BY c.created DESC")
    Page<CommentsEntity> findRootCommentsDtoByEventId(@Param("eventId") Long eventId, Pageable pageable);

    @Query("SELECT c FROM CommentsEntity c WHERE c.referendum.id = :referendumId AND c.parent IS NULL ORDER BY c.created DESC")
    Page<CommentsEntity> findRootCommentsDtoByReferendumId(@Param("referendumId") Long referendumId, Pageable pageable);

    @Query("SELECT c FROM CommentsEntity c WHERE c.multiPoll.id = :multiPollId AND c.parent IS NULL ORDER BY c.created DESC")
    Page<CommentsEntity> findRootCommentsDtoByMultiPollId(@Param("multiPollId") Long multiPollId, Pageable pageable);

    @Query("SELECT c FROM CommentsEntity c WHERE c.parent.id = :parentId ORDER BY c.created ASC")
    Page<CommentsEntity> findRepliesDtoByParentId(@Param("parentId") Long parentId, Pageable pageable);

    @Query("SELECT COUNT(c) FROM CommentsEntity c WHERE c.parent.id = :parentId")
    long countRepliesByParentId(@Param("parentId") Long parentId);
}