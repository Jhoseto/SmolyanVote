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

    // ====== СУПЕР БЪРЗИ NATIVE ЗАЯВКИ ЗА PUBLICATIONS ======

    /**
     * 🚀 СУПЕР БЪРЗА заявка за publication коментари с всички данни наведнъж
     * Включва: comment data + replies count + user reaction
     */
    @Query(value = """
        SELECT 
            c.id,
            c.text,
            c.created,
            c.modified,
            c.author,
            COALESCE(u.image_url, '/default-avatar.jpg') as author_image,
            c.like_count,
            c.unlike_count,
            c.is_edited,
            c.parent_id,
            COALESCE(reply_counts.reply_count, 0) as replies_count,
            COALESCE(user_votes.reaction, 'NONE') as user_reaction,
            'publication' as entity_type,
            :publicationId as entity_id
        FROM comments_entity c
        LEFT JOIN users u ON c.author = u.username
        LEFT JOIN (
            SELECT parent_id, COUNT(*) as reply_count 
            FROM comments_entity 
            WHERE parent_id IS NOT NULL 
            GROUP BY parent_id
        ) reply_counts ON c.id = reply_counts.parent_id
        LEFT JOIN comment_votes user_votes ON c.id = user_votes.comment_id 
            AND user_votes.username = COALESCE(:currentUsername, '__guest__')
        WHERE c.publication_id = :publicationId 
        AND c.parent_id IS NULL
        ORDER BY 
            CASE WHEN :sort = 'newest' THEN c.created END DESC,
            CASE WHEN :sort = 'oldest' THEN c.created END ASC,
            CASE WHEN :sort = 'likes' THEN LENGTH(c.text) END DESC,
            CASE WHEN :sort = 'popular' THEN (c.like_count - c.unlike_count) END DESC
        """,
            countQuery = """
        SELECT COUNT(*) FROM comments_entity c 
        WHERE c.publication_id = :publicationId AND c.parent_id IS NULL
        """,
            nativeQuery = true)
    Page<Object[]> findOptimizedCommentsForPublication(
            @Param("publicationId") Long publicationId,
            @Param("currentUsername") String currentUsername,
            @Param("sort") String sort,
            Pageable pageable);

    /**
     * 🚀 СУПЕР БЪРЗА заявка за replies към коментар
     */
    @Query(value = """
        SELECT 
            c.id,
            c.text,
            c.created,
            c.modified,
            c.author,
            COALESCE(u.image_url, '/default-avatar.jpg') as author_image,
            c.like_count,
            c.unlike_count,
            c.is_edited,
            c.parent_id,
            0 as replies_count,
            COALESCE(user_votes.reaction, 'NONE') as user_reaction,
            parent_c.publication_id,
            parent_c.event_id,
            parent_c.referendum_id,
            parent_c.multi_poll_id
        FROM comments_entity c
        LEFT JOIN users u ON c.author = u.username
        LEFT JOIN comments_entity parent_c ON c.parent_id = parent_c.id
        LEFT JOIN comment_votes user_votes ON c.id = user_votes.comment_id 
            AND user_votes.username = COALESCE(:currentUsername, '__guest__')
        WHERE c.parent_id = :parentCommentId
        ORDER BY c.created ASC
        """,
            countQuery = """
        SELECT COUNT(*) FROM comments_entity c WHERE c.parent_id = :parentCommentId
        """,
            nativeQuery = true)
    Page<Object[]> findOptimizedRepliesForComment(
            @Param("parentCommentId") Long parentCommentId,
            @Param("currentUsername") String currentUsername,
            Pageable pageable);

    /**
     * 🚀 BATCH заявка за user reactions на множество коментари
     * Използва се за cache warming
     */
    @Query(value = """
        SELECT cv.comment_id, cv.reaction 
        FROM comment_votes cv 
        WHERE cv.comment_id IN :commentIds 
        AND cv.username = :username
        """, nativeQuery = true)
    List<Object[]> findUserReactionsForComments(
            @Param("commentIds") List<Long> commentIds,
            @Param("username") String username);

    /**
     * 🚀 BATCH заявка за replies counts на множество коментари
     */
    @Query(value = """
        SELECT parent_id, COUNT(*) as reply_count 
        FROM comments_entity 
        WHERE parent_id IN :commentIds 
        GROUP BY parent_id
        """, nativeQuery = true)
    List<Object[]> findRepliesCountsForComments(@Param("commentIds") List<Long> commentIds);

    // ====== ОПТИМИЗИРАНИ ЗАЯВКИ ЗА ОСТАНАЛИТЕ ENTITY ТИПОВЕ ======

    /**
     * 🚀 СУПЕР БЪРЗА заявка за simpleEvent коментари
     */
    @Query(value = """
        SELECT 
            c.id, c.text, c.created, c.modified, c.author, COALESCE(u.image_url, '/default-avatar.jpg') as author_image,
            c.like_count, c.unlike_count, c.is_edited, c.parent_id,
            COALESCE(reply_counts.reply_count, 0) as replies_count,
            COALESCE(user_votes.reaction, 'NONE') as user_reaction,
            'simpleEvent' as entity_type, :eventId as entity_id
        FROM comments_entity c
        LEFT JOIN users u ON c.author = u.username
        LEFT JOIN (
            SELECT parent_id, COUNT(*) as reply_count 
            FROM comments_entity WHERE parent_id IS NOT NULL GROUP BY parent_id
        ) reply_counts ON c.id = reply_counts.parent_id
        LEFT JOIN comment_votes user_votes ON c.id = user_votes.comment_id 
            AND user_votes.username = COALESCE(:currentUsername, '__guest__')
        WHERE c.event_id = :eventId AND c.parent_id IS NULL
        ORDER BY 
            CASE WHEN :sort = 'newest' THEN c.created END DESC,
            CASE WHEN :sort = 'oldest' THEN c.created END ASC,
            CASE WHEN :sort = 'likes' THEN LENGTH(c.text) END DESC,
            CASE WHEN :sort = 'popular' THEN (c.like_count - c.unlike_count) END DESC
        """,
            countQuery = "SELECT COUNT(*) FROM comments_entity c WHERE c.event_id = :eventId AND c.parent_id IS NULL",
            nativeQuery = true)
    Page<Object[]> findOptimizedCommentsForEvent(
            @Param("eventId") Long eventId,
            @Param("currentUsername") String currentUsername,
            @Param("sort") String sort,
            Pageable pageable);

    /**
     * 🚀 СУПЕР БЪРЗА заявка за referendum коментари
     */
    @Query(value = """
        SELECT 
            c.id, c.text, c.created, c.modified, c.author, COALESCE(u.image_url, '/default-avatar.jpg') as author_image,
            c.like_count, c.unlike_count, c.is_edited, c.parent_id,
            COALESCE(reply_counts.reply_count, 0) as replies_count,
            COALESCE(user_votes.reaction, 'NONE') as user_reaction,
            'referendum' as entity_type, :referendumId as entity_id
        FROM comments_entity c
        LEFT JOIN users u ON c.author = u.username
        LEFT JOIN (
            SELECT parent_id, COUNT(*) as reply_count 
            FROM comments_entity WHERE parent_id IS NOT NULL GROUP BY parent_id
        ) reply_counts ON c.id = reply_counts.parent_id
        LEFT JOIN comment_votes user_votes ON c.id = user_votes.comment_id 
            AND user_votes.username = COALESCE(:currentUsername, '__guest__')
        WHERE c.referendum_id = :referendumId AND c.parent_id IS NULL
        ORDER BY 
            CASE WHEN :sort = 'newest' THEN c.created END DESC,
            CASE WHEN :sort = 'oldest' THEN c.created END ASC,
            CASE WHEN :sort = 'likes' THEN LENGTH(c.text) END DESC,
            CASE WHEN :sort = 'popular' THEN (c.like_count - c.unlike_count) END DESC
        """,
            countQuery = "SELECT COUNT(*) FROM comments_entity c WHERE c.referendum_id = :referendumId AND c.parent_id IS NULL",
            nativeQuery = true)
    Page<Object[]> findOptimizedCommentsForReferendum(
            @Param("referendumId") Long referendumId,
            @Param("currentUsername") String currentUsername,
            @Param("sort") String sort,
            Pageable pageable);

    /**
     * 🚀 СУПЕР БЪРЗА заявка за multiPoll коментари
     */
    @Query(value = """
        SELECT 
            c.id, c.text, c.created, c.modified, c.author, COALESCE(u.image_url, '/default-avatar.jpg') as author_image,
            c.like_count, c.unlike_count, c.is_edited, c.parent_id,
            COALESCE(reply_counts.reply_count, 0) as replies_count,
            COALESCE(user_votes.reaction, 'NONE') as user_reaction,
            'multiPoll' as entity_type, :multiPollId as entity_id
        FROM comments_entity c
        LEFT JOIN users u ON c.author = u.username
        LEFT JOIN (
            SELECT parent_id, COUNT(*) as reply_count 
            FROM comments_entity WHERE parent_id IS NOT NULL GROUP BY parent_id
        ) reply_counts ON c.id = reply_counts.parent_id
        LEFT JOIN comment_votes user_votes ON c.id = user_votes.comment_id 
            AND user_votes.username = COALESCE(:currentUsername, '__guest__')
        WHERE c.multi_poll_id = :multiPollId AND c.parent_id IS NULL
        ORDER BY 
            CASE WHEN :sort = 'newest' THEN c.created END DESC,
            CASE WHEN :sort = 'oldest' THEN c.created END ASC,
            CASE WHEN :sort = 'likes' THEN LENGTH(c.text) END DESC,
            CASE WHEN :sort = 'popular' THEN (c.like_count - c.unlike_count) END DESC
        """,
            countQuery = "SELECT COUNT(*) FROM comments_entity c WHERE c.multi_poll_id = :multiPollId AND c.parent_id IS NULL",
            nativeQuery = true)
    Page<Object[]> findOptimizedCommentsForMultiPoll(
            @Param("multiPollId") Long multiPollId,
            @Param("currentUsername") String currentUsername,
            @Param("sort") String sort,
            Pageable pageable);


    /**
     * 🚀 СУПЕР БЪРЗА заявка за signal коментари
     */
    @Query(value = """
    SELECT 
        c.id, c.text, c.created, c.modified, c.author, COALESCE(u.image_url, '/default-avatar.jpg') as author_image,
        c.like_count, c.unlike_count, c.is_edited, c.parent_id,
        COALESCE(reply_counts.reply_count, 0) as replies_count,
        COALESCE(user_votes.reaction, 'NONE') as user_reaction,
        'signal' as entity_type, :signalId as entity_id
    FROM comments_entity c
    LEFT JOIN users u ON c.author = u.username
    LEFT JOIN (
        SELECT parent_id, COUNT(*) as reply_count 
        FROM comments_entity WHERE parent_id IS NOT NULL GROUP BY parent_id
    ) reply_counts ON c.id = reply_counts.parent_id
    LEFT JOIN comment_votes user_votes ON c.id = user_votes.comment_id 
        AND user_votes.username = COALESCE(:currentUsername, '__guest__')
    WHERE c.signal_id = :signalId AND c.parent_id IS NULL
    ORDER BY 
        CASE WHEN :sort = 'newest' THEN c.created END DESC,
        CASE WHEN :sort = 'oldest' THEN c.created END ASC,
        CASE WHEN :sort = 'likes' THEN LENGTH(c.text) END DESC,
        CASE WHEN :sort = 'popular' THEN (c.like_count - c.unlike_count) END DESC
    """,
            countQuery = "SELECT COUNT(*) FROM comments_entity c WHERE c.signal_id = :signalId AND c.parent_id IS NULL",
            nativeQuery = true)
    Page<Object[]> findOptimizedCommentsForSignal(
            @Param("signalId") Long signalId,
            @Param("currentUsername") String currentUsername,
            @Param("sort") String sort,
            Pageable pageable);



    // ====== LEGACY МЕТОДИ (запазени за compatibility) ======

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

    @Query("SELECT c FROM CommentsEntity c WHERE c.signal.id = :signalId AND c.parent IS NULL ORDER BY c.created DESC")
    Page<CommentsEntity> findRootCommentsDtoBySignalId(@Param("signalId") Long signalId, Pageable pageable);

    @Query("SELECT c FROM CommentsEntity c LEFT JOIN FETCH c.replies " +
            "WHERE c.signal.id = :signalId AND c.parent IS NULL ORDER BY c.created DESC")
    List<CommentsEntity> findRootCommentsWithRepliesBySignalId(Long signalId);



    // ====== БРОЕНЕ МЕТОДИ ======

    Page<CommentsEntity> findByEventIdOrderByCreatedDesc(Long simpleEventId, Pageable pageable);
    long countByEventId(Long simpleEventId);
    long countByPublicationId(Long publicationId);
    long countByReferendumId(@Param("referendumId") Long referendumId);
    long countByMultiPollId(@Param("multiPollId") Long multiPollId);
    long countBySignalId(Long signalId);

    // ====== CLEANUP МЕТОДИ ======

    @Transactional
    void deleteAllByEvent_Id(Long eventId);

    @Transactional
    void deleteAllByReferendum_Id(Long referendumId);

    @Transactional
    void deleteAllByMultiPoll_Id(Long multiPollId);

    @Transactional
    void deleteAllByPublicationId(Long publicationId);

    @Transactional
    void deleteAllBySignal_Id(Long signalId);


    @Query(value = """
    SELECT c.publication_id, COUNT(*) as comments_count 
    FROM comments_entity c 
    WHERE c.publication_id IN :publicationIds
    GROUP BY c.publication_id
    """, nativeQuery = true)
    List<Object[]> findCommentsCountsForPublications(@Param("publicationIds") List<Long> publicationIds);

    List<CommentsEntity> findByPublicationId(Long id);

    List<CommentsEntity> findBySignalId(Long id);
}