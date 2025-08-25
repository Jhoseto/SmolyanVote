package smolyanVote.smolyanVote.viewsAndDTO;

import smolyanVote.smolyanVote.models.enums.SignalsCategory;
import smolyanVote.smolyanVote.models.enums.SignalsUrgencyLevel;

import java.math.BigDecimal;
import java.time.Instant;

public class SignalsDto {
    private Long id;
    private String title;
    private String description;
    private SignalsCategory category;
    private SignalsUrgencyLevel urgency;

    // НОВИ ПОЛЕТА ЗА БЪЛГАРСКИ ИМЕНА
    private String categoryBG;
    private String urgencyBG;

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

    public SignalsUrgencyLevel getUrgency() { return urgency; }
    public void setUrgency(SignalsUrgencyLevel urgency) { this.urgency = urgency; }

    // НОВИ GETTERS/SETTERS
    public String getCategoryBG() { return categoryBG; }
    public void setCategoryBG(String categoryBG) { this.categoryBG = categoryBG; }

    public String getUrgencyBG() { return urgencyBG; }
    public void setUrgencyBG(String urgencyBG) { this.urgencyBG = urgencyBG; }

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