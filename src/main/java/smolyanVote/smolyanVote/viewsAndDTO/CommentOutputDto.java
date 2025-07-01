package smolyanVote.smolyanVote.viewsAndDTO;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * DTO за изходящи данни на коментари
 */
public class CommentOutputDto {
    private Long id;
    private String text;
    private String createdAt; // Променено на String за ISO формат
    private String updatedAt; // Променено на String за ISO формат
    private String author; // Променено на author за съвместимост с фронтенда
    private String authorImage; // Променено на authorImage за съвместимост
    private boolean isOnline;
    private int likesCount; // Променено на likesCount
    private int dislikesCount; // Променено на dislikesCount
    private int repliesCount;
    private Long parentId;
    private String entityType;
    private Long entityId;
    private boolean edited;
    private boolean canEdit; // Добавено за съвместимост с фронтенда
    @JsonProperty("userReaction")
    private String userReaction; // "LIKE", "DISLIKE", "NONE"

    // Конструктори
    public CommentOutputDto() {
    }

    public CommentOutputDto(Long id, String text, LocalDateTime createdAt, LocalDateTime updatedAt,
                            String author, String authorImage, boolean isOnline, int likesCount,
                            int dislikesCount, int repliesCount, Long parentId, String entityType,
                            Long entityId, boolean edited, boolean canEdit, String userReaction) {
        this.id = id;
        this.text = text;
        this.createdAt = createdAt != null ? createdAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
        this.updatedAt = updatedAt != null ? updatedAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
        this.author = author;
        this.authorImage = authorImage;
        this.isOnline = isOnline;
        this.likesCount = likesCount;
        this.dislikesCount = dislikesCount;
        this.repliesCount = repliesCount;
        this.parentId = parentId;
        this.entityType = entityType;
        this.entityId = entityId;
        this.edited = edited;
        this.canEdit = canEdit;
        this.userReaction = userReaction != null ? userReaction : "NONE";
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt != null ? createdAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
    }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt != null ? updatedAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
    }

    @JsonProperty("author")
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    @JsonProperty("authorImage")
    public String getAuthorImage() { return authorImage; }
    public void setAuthorImage(String authorImage) { this.authorImage = authorImage; }

    public boolean isOnline() { return isOnline; }
    public void setOnline(boolean isOnline) { this.isOnline = isOnline; }

    @JsonProperty("likesCount")
    public int getLikesCount() { return likesCount; }
    public void setLikesCount(int likesCount) { this.likesCount = likesCount; }

    @JsonProperty("dislikesCount")
    public int getDislikesCount() { return dislikesCount; }
    public void setDislikesCount(int dislikesCount) { this.dislikesCount = dislikesCount; }

    public int getRepliesCount() { return repliesCount; }
    public void setRepliesCount(int repliesCount) { this.repliesCount = repliesCount; }

    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }

    public boolean isEdited() { return edited; }
    public void setEdited(boolean edited) { this.edited = edited; }

    public boolean isCanEdit() { return canEdit; }
    public void setCanEdit(boolean canEdit) { this.canEdit = canEdit; }

    public String getUserReaction() { return userReaction; }
    public void setUserReaction(String userReaction) {
        this.userReaction = userReaction != null ? userReaction : "NONE";
    }
}