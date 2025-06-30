package smolyanVote.smolyanVote.viewsAndDTO;

public class CommentDto {
    private Long id;
    private String text;
    private Long createdAt;
    private Long updatedAt;
    private String authorUsername;
    private String authorImageUrl;
    private boolean isOnline;
    private int likeCount;
    private int dislikeCount;
    private int repliesCount;
    private Long parentId;
    private String entityType;
    private Long entityId;
    private boolean edited;

    // Празен конструктор за JSON десериализация
    public CommentDto() {
    }

    // Конструктор за ръчно създаване (например при добавяне/редактиране)
    public CommentDto(Long id, String text, Long createdAt, Long updatedAt, String authorUsername,
                      String authorImageUrl, boolean isOnline, int likeCount, int dislikeCount,
                      int repliesCount, Long parentId, String entityType, Long entityId, boolean edited) {
        this.id = id;
        this.text = text;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.authorUsername = authorUsername;
        this.authorImageUrl = authorImageUrl;
        this.isOnline = isOnline;
        this.likeCount = likeCount;
        this.dislikeCount = dislikeCount;
        this.repliesCount = repliesCount;
        this.parentId = parentId;
        this.entityType = entityType;
        this.entityId = entityId;
        this.edited = edited;
    }

    // Гетъри и сетъри
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public Long getCreatedAt() { return createdAt; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }
    public Long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Long updatedAt) { this.updatedAt = updatedAt; }
    public String getAuthorUsername() { return authorUsername; }
    public void setAuthorUsername(String authorUsername) { this.authorUsername = authorUsername; }
    public String getAuthorImageUrl() { return authorImageUrl; }
    public void setAuthorImageUrl(String authorImageUrl) { this.authorImageUrl = authorImageUrl; }
    public boolean isOnline() { return isOnline; }
    public void setOnline(boolean online) { this.isOnline = isOnline; }
    public int getLikeCount() { return likeCount; }
    public void setLikeCount(int likeCount) { this.likeCount = likeCount; }
    public int getDislikeCount() { return dislikeCount; }
    public void setDislikeCount(int dislikeCount) { this.dislikeCount = dislikeCount; }
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
}