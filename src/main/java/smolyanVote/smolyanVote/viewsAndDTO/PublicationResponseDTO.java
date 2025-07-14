package smolyanVote.smolyanVote.viewsAndDTO;

import smolyanVote.smolyanVote.models.PublicationEntity;
import smolyanVote.smolyanVote.models.enums.CategoryEnum;
import smolyanVote.smolyanVote.models.enums.PublicationStatus;

import java.time.Instant;
import java.time.LocalDateTime;

public class PublicationResponseDTO {

    private Long id;
    private String title;
    private String content;
    private String excerpt;
    private CategoryEnum category;
    private PublicationStatus status;
    private String imageUrl;
    private String emotion;
    private String emotionText;
    private Integer readingTime;

    // Timestamps
    private Instant createdAt;
    private Instant updatedAt;
    private LocalDateTime publishedAt;

    // Statistics
    private Integer viewsCount;
    private Integer likesCount;
    private Integer dislikesCount;
    private Integer commentsCount;
    private Integer sharesCount;

    // Author information (simplified)
    private Long authorId;
    private String authorUsername;
    private String authorImageUrl;
    private Integer authorOnlineStatus; // 0=offline, 1=online, 2=away
    private Instant authorLastOnline;

    // User interaction flags (only for authenticated users)
    private Boolean isLiked;
    private Boolean isDisliked;
    private Boolean isBookmarked;
    private Boolean isOwner;
    private String linkUrl;
    private String linkMetadata;

    // ====== CONSTRUCTORS ======

    public PublicationResponseDTO() {
    }

    public PublicationResponseDTO(PublicationEntity publication) {
        this.id = publication.getId();
        this.title = publication.getTitle();
        this.content = publication.getContent();
        this.excerpt = publication.getExcerpt();
        this.category = publication.getCategory();
        this.status = publication.getStatus();
        this.imageUrl = publication.getImageUrl();
        this.emotion = publication.getEmotion();
        this.emotionText = publication.getEmotionText();
        this.readingTime = publication.getReadingTime();

        this.createdAt = publication.getCreated();
        this.updatedAt = publication.getModified();
        this.publishedAt = publication.getPublishedAt();

        this.viewsCount = publication.getViewsCount();
        this.likesCount = publication.getLikesCount();
        this.dislikesCount = publication.getDislikesCount();
        this.commentsCount = publication.getCommentsCount();
        this.sharesCount = publication.getSharesCount();


        // Author data (if available)
        if (publication.getAuthor() != null) {
            this.authorId = publication.getAuthor().getId();
            this.authorUsername = publication.getAuthor().getUsername();
            this.authorImageUrl = publication.getAuthor().getImageUrl();
            this.authorLastOnline = publication.getAuthor().getLastOnline();
        }

        // Default interaction values (will be set by service if user is authenticated)
        this.isLiked = false;
        this.isDisliked = false;
        this.isBookmarked = false;
        this.isOwner = false;
        this.linkUrl = publication.getLinkUrl();
        this.linkMetadata = publication.getLinkMetadata();
    }

    // ====== UTILITY METHODS ======

    public boolean hasImage() {
        return imageUrl != null && !imageUrl.trim().isEmpty();
    }

    public boolean hasEmotion() {
        return emotion != null && !emotion.trim().isEmpty();
    }

    public boolean isPublished() {
        return PublicationStatus.PUBLISHED.equals(status);
    }

    public boolean isDraft() {
        return PublicationStatus.PENDING.equals(status);
    }

    public boolean hasAuthor() {
        return authorId != null && authorUsername != null;
    }

    public boolean isAuthorOnline() {
        return authorOnlineStatus != null && authorOnlineStatus == 1;
    }

    public boolean isAuthorAway() {
        return authorOnlineStatus != null && authorOnlineStatus == 2;
    }

    // ====== GETTERS AND SETTERS ======

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getExcerpt() { return excerpt; }
    public void setExcerpt(String excerpt) { this.excerpt = excerpt; }

    public CategoryEnum getCategory() { return category; }
    public void setCategory(CategoryEnum category) { this.category = category; }

    public PublicationStatus getStatus() { return status; }
    public void setStatus(PublicationStatus status) { this.status = status; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getEmotion() { return emotion; }
    public void setEmotion(String emotion) { this.emotion = emotion; }

    public String getEmotionText() { return emotionText; }
    public void setEmotionText(String emotionText) { this.emotionText = emotionText; }

    public Integer getReadingTime() { return readingTime; }
    public void setReadingTime(Integer readingTime) { this.readingTime = readingTime; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }

    public Integer getViewsCount() { return viewsCount; }
    public void setViewsCount(Integer viewsCount) { this.viewsCount = viewsCount; }

    public Integer getLikesCount() { return likesCount; }
    public void setLikesCount(Integer likesCount) { this.likesCount = likesCount; }

    public Integer getDislikesCount() { return dislikesCount; }
    public void setDislikesCount(Integer dislikesCount) { this.dislikesCount = dislikesCount; }

    public Integer getCommentsCount() { return commentsCount; }
    public void setCommentsCount(Integer commentsCount) { this.commentsCount = commentsCount; }

    public Integer getSharesCount() { return sharesCount; }
    public void setSharesCount(Integer sharesCount) { this.sharesCount = sharesCount; }

    public Long getAuthorId() { return authorId; }
    public void setAuthorId(Long authorId) { this.authorId = authorId; }

    public String getAuthorUsername() { return authorUsername; }
    public void setAuthorUsername(String authorUsername) { this.authorUsername = authorUsername; }

    public String getAuthorImageUrl() { return authorImageUrl; }
    public void setAuthorImageUrl(String authorImageUrl) { this.authorImageUrl = authorImageUrl; }

    public Integer getAuthorOnlineStatus() { return authorOnlineStatus; }
    public void setAuthorOnlineStatus(Integer authorOnlineStatus) { this.authorOnlineStatus = authorOnlineStatus; }

    public Instant getAuthorLastOnline() { return authorLastOnline; }
    public void setAuthorLastOnline(Instant authorLastOnline) { this.authorLastOnline = authorLastOnline; }

    public Boolean getIsLiked() { return isLiked; }
    public void setIsLiked(Boolean isLiked) { this.isLiked = isLiked; }

    public Boolean getIsDisliked() { return isDisliked; }
    public void setIsDisliked(Boolean isDisliked) { this.isDisliked = isDisliked; }

    public Boolean getIsBookmarked() { return isBookmarked; }
    public void setIsBookmarked(Boolean isBookmarked) { this.isBookmarked = isBookmarked; }

    public Boolean getIsOwner() { return isOwner; }
    public void setIsOwner(Boolean isOwner) { this.isOwner = isOwner; }

    public String getLinkUrl() {return linkUrl;}

    public void setLinkUrl(String linkUrl) {this.linkUrl = linkUrl;}

    public String getLinkMetadata() {return linkMetadata;}

    public void setLinkMetadata(String linkMetadata) {this.linkMetadata = linkMetadata;}

    @Override
    public String toString() {
        return "PublicationResponseDTO{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", category=" + category +
                ", status=" + status +
                ", authorUsername='" + authorUsername + '\'' +
                ", likesCount=" + likesCount +
                ", commentsCount=" + commentsCount +
                '}';
    }
}