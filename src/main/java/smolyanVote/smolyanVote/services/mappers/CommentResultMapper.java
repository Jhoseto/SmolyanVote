package smolyanVote.smolyanVote.services.mappers;

import org.springframework.stereotype.Component;
import smolyanVote.smolyanVote.viewsAndDTO.CommentOutputDto;

import java.math.BigInteger;
import java.sql.Timestamp;
import java.time.LocalDateTime;

/**
 * Utility клас за mapping на резултати от native SQL заявки към CommentOutputDto
 */
@Component
public class CommentResultMapper {

    /**
     * Мапва Object[] от optimized query към CommentOutputDto
     *
     * Expected Object[] structure от native query:
     * [0] id (BigInteger)
     * [1] text (String)
     * [2] created (Timestamp)
     * [3] modified (Timestamp)
     * [4] author (String)
     * [5] author_image (String)
     * [6] like_count (Integer)
     * [7] unlike_count (Integer)
     * [8] is_edited (Boolean)
     * [9] parent_id (BigInteger or null)
     * [10] replies_count (BigInteger or Integer)
     * [11] user_reaction (String)
     * [12] entity_type (String)
     * [13] entity_id (BigInteger)
     */
    public CommentOutputDto mapOptimizedQueryResult(Object[] row, String currentUsername) {
        if (row == null || row.length < 14) {
            throw new IllegalArgumentException("Invalid query result row");
        }

        try {
            Long id = convertToLong(row[0]);
            String text = (String) row[1];
            LocalDateTime createdAt = convertTimestampToLocalDateTime((Timestamp) row[2]);
            LocalDateTime updatedAt = convertTimestampToLocalDateTime((Timestamp) row[3]);
            String author = (String) row[4];
            String authorImage = row[5] != null ? (String) row[5] : "/default-avatar.jpg";
            int likesCount = convertToInt(row[6]);
            int dislikesCount = convertToInt(row[7]);
            boolean edited = convertToBoolean(row[8]);
            Long parentId = convertToLong(row[9]);
            int repliesCount = convertToInt(row[10]);
            String userReaction = normalizeUserReaction((String) row[11]);
            String entityType = (String) row[12];
            Long entityId = convertToLong(row[13]);
            boolean canEdit = currentUsername != null && currentUsername.equals(author);

            return new CommentOutputDto(
                    id, text, createdAt, updatedAt, author, authorImage,
                    false, // isOnline - винаги false за сега
                    likesCount, dislikesCount, repliesCount, parentId,
                    entityType, entityId, edited, canEdit, userReaction
            );

        } catch (Exception e) {
            throw new RuntimeException("Error mapping query result to CommentOutputDto: " + e.getMessage(), e);
        }
    }

    /**
     * Мапва Object[] от replies query към CommentOutputDto
     *
     * Expected Object[] structure за replies:
     * [0] id, [1] text, [2] created, [3] modified, [4] author, [5] author_image,
     * [6] like_count, [7] unlike_count, [8] is_edited, [9] parent_id,
     * [10] replies_count (винаги 0), [11] user_reaction,
     * [12] parent_publication_id, [13] parent_event_id, [14] parent_referendum_id, [15] parent_multi_poll_id
     */
    public CommentOutputDto mapRepliesQueryResult(Object[] row, String currentUsername) {
        if (row == null || row.length < 16) {
            throw new IllegalArgumentException("Invalid replies query result row");
        }

        try {
            Long id = convertToLong(row[0]);
            String text = (String) row[1];
            LocalDateTime createdAt = convertTimestampToLocalDateTime((Timestamp) row[2]);
            LocalDateTime updatedAt = convertTimestampToLocalDateTime((Timestamp) row[3]);
            String author = (String) row[4];
            String authorImage = row[5] != null ? (String) row[5] : "/default-avatar.jpg";
            int likesCount = convertToInt(row[6]);
            int dislikesCount = convertToInt(row[7]);
            boolean edited = convertToBoolean(row[8]);
            Long parentId = convertToLong(row[9]);
            int repliesCount = 0; // Replies don't have replies
            String userReaction = normalizeUserReaction((String) row[11]);
            boolean canEdit = currentUsername != null && currentUsername.equals(author);

            // Determine entity type and ID from parent comment
            String entityType = null;
            Long entityId = null;

            if (row[12] != null) { // publication_id
                entityType = "publication";
                entityId = convertToLong(row[12]);
            } else if (row[13] != null) { // event_id
                entityType = "simpleEvent";
                entityId = convertToLong(row[13]);
            } else if (row[14] != null) { // referendum_id
                entityType = "referendum";
                entityId = convertToLong(row[14]);
            } else if (row[15] != null) { // multi_poll_id
                entityType = "multiPoll";
                entityId = convertToLong(row[15]);
            }

            return new CommentOutputDto(
                    id, text, createdAt, updatedAt, author, authorImage,
                    false, // isOnline
                    likesCount, dislikesCount, repliesCount, parentId,
                    entityType, entityId, edited, canEdit, userReaction
            );

        } catch (Exception e) {
            throw new RuntimeException("Error mapping replies result to CommentOutputDto: " + e.getMessage(), e);
        }
    }

    // ====== HELPER МЕТОДИ ЗА TYPE CONVERSION ======

    private Long convertToLong(Object value) {
        if (value == null) return null;
        if (value instanceof BigInteger) return ((BigInteger) value).longValue();
        if (value instanceof Long) return (Long) value;
        if (value instanceof Integer) return ((Integer) value).longValue();
        if (value instanceof String) return Long.parseLong((String) value);
        throw new IllegalArgumentException("Cannot convert " + value.getClass() + " to Long");
    }

    private Integer convertToInt(Object value) {
        if (value == null) return 0;
        if (value instanceof BigInteger) return ((BigInteger) value).intValue();
        if (value instanceof Integer) return (Integer) value;
        if (value instanceof Long) return ((Long) value).intValue();
        if (value instanceof String) return Integer.parseInt((String) value);
        throw new IllegalArgumentException("Cannot convert " + value.getClass() + " to Integer");
    }

    private Boolean convertToBoolean(Object value) {
        if (value == null) return false;
        if (value instanceof Boolean) return (Boolean) value;
        if (value instanceof Integer) return ((Integer) value) != 0;
        if (value instanceof String) return Boolean.parseBoolean((String) value);
        throw new IllegalArgumentException("Cannot convert " + value.getClass() + " to Boolean");
    }

    private LocalDateTime convertTimestampToLocalDateTime(Timestamp timestamp) {
        return timestamp != null ? timestamp.toLocalDateTime() : null;
    }

    private String normalizeUserReaction(String userReaction) {
        if (userReaction == null || userReaction.trim().isEmpty()) {
            return "NONE";
        }
        return switch (userReaction.toUpperCase()) {
            case "LIKE", "DISLIKE", "NONE" -> userReaction.toUpperCase();
            default -> "NONE";
        };
    }
}