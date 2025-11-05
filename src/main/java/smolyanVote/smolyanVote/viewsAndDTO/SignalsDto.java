package smolyanVote.smolyanVote.viewsAndDTO;

import smolyanVote.smolyanVote.models.enums.SignalsCategory;

import java.math.BigDecimal;
import java.time.Instant;

public class SignalsDto {
    private Long id;
    private String title;
    private String description;
    private SignalsCategory category;
    private Integer expirationDays;
    private Instant activeUntil;

    // НОВИ ПОЛЕТА ЗА БЪЛГАРСКИ ИМЕНА
    private String categoryBG;
    
    // Helper поле за показване на активност
    private Boolean isActive;

    private BigDecimal latitude;
    private BigDecimal longitude;
    private String imageUrl;

    // Автор (малък под DTO вътре)
    private Long authorId;
    private String authorUsername;
    private String authorImageUrl;

    private Integer viewsCount;
    private Integer likesCount;
    private Integer reportsCount;
    private Integer commentsCount;

    private Instant created;
    private Instant modified;

    // Getters и Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public SignalsCategory getCategory() { return category; }
    public void setCategory(SignalsCategory category) { this.category = category; }

    public Integer getExpirationDays() { return expirationDays; }
    public void setExpirationDays(Integer expirationDays) { this.expirationDays = expirationDays; }

    public Instant getActiveUntil() { return activeUntil; }
    public void setActiveUntil(Instant activeUntil) { this.activeUntil = activeUntil; }

    // НОВИ GETTERS/SETTERS
    public String getCategoryBG() { return categoryBG; }
    public void setCategoryBG(String categoryBG) { this.categoryBG = categoryBG; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }

    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Long getAuthorId() { return authorId; }
    public void setAuthorId(Long authorId) { this.authorId = authorId; }

    public String getAuthorUsername() { return authorUsername; }
    public void setAuthorUsername(String authorUsername) { this.authorUsername = authorUsername; }

    public String getAuthorImageUrl() { return authorImageUrl; }
    public void setAuthorImageUrl(String authorImageUrl) { this.authorImageUrl = authorImageUrl; }

    public Integer getViewsCount() { return viewsCount; }
    public void setViewsCount(Integer viewsCount) { this.viewsCount = viewsCount; }

    public Integer getLikesCount() { return likesCount; }
    public void setLikesCount(Integer likesCount) { this.likesCount = likesCount; }

    public Integer getReportsCount() { return reportsCount; }
    public void setReportsCount(Integer reportsCount) { this.reportsCount = reportsCount; }

    public Integer getCommentsCount() { return commentsCount; }
    public void setCommentsCount(Integer commentsCount) { this.commentsCount = commentsCount; }

    public Instant getCreated() { return created; }
    public void setCreated(Instant created) { this.created = created; }

    public Instant getModified() { return modified; }
    public void setModified(Instant modified) { this.modified = modified; }
}