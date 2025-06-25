package smolyanVote.smolyanVote.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import smolyanVote.smolyanVote.models.enums.CategoryEnum;
import smolyanVote.smolyanVote.models.enums.PublicationStatus;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "publications")
public class PublicationEntity extends BaseEntity {

    @NotBlank(message = "Заглавието не може да бъде празно")
    @Size(min = 5, max = 200, message = "Заглавието трябва да бъде между 5 и 200 символа")
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @NotBlank(message = "Съдържанието не може да бъде празно")
    @Size(min = 10, max = 10000, message = "Съдържанието трябва да бъде между 10 и 10000 символа")
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Size(max = 500, message = "Кратката версия не може да бъде повече от 500 символа")
    @Column(name = "excerpt", length = 500)
    private String excerpt;

    @NotNull(message = "Категорията е задължителна")
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private CategoryEnum category;

    @NotNull(message = "Статусът е задължителен")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PublicationStatus status;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "views_count", nullable = false, columnDefinition = "int default 0")
    private Integer viewsCount = 0;

    @Column(name = "likes_count", nullable = false, columnDefinition = "int default 0")
    private Integer likesCount = 0;

    @Column(name = "dislikes_count", nullable = false, columnDefinition = "int default 0")
    private Integer dislikesCount = 0;

    @Column(name = "comments_count", nullable = false, columnDefinition = "int default 0")
    private Integer commentsCount = 0;

    @Column(name = "shares_count", nullable = false, columnDefinition = "int default 0")
    private Integer sharesCount = 0;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "reading_time")
    private Integer readingTime; // In minutes

    // Emotion fields
    @Column(name = "emotion", length = 10)
    private String emotion;

    @Column(name = "emotion_text", length = 100)
    private String emotionText;

    // ====== SIMPLIFIED RELATIONSHIPS ======

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    @JsonManagedReference
    private UserEntity author;

    @OneToMany(mappedBy = "publication", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<CommentsEntity> comments = new HashSet<>();

    // JSON колони за взаимодействия
    @Column(name = "liked_by_users", columnDefinition = "TEXT")
    private String likedByUsers; // JSON array of usernames

    @Column(name = "disliked_by_users", columnDefinition = "TEXT")
    private String dislikedByUsers; // JSON array of usernames

    @Column(name = "bookmarked_by_users", columnDefinition = "TEXT")
    private String bookmarkedByUsers; // JSON array of usernames

    @Column(name = "reported_by_users", columnDefinition = "TEXT")
    private String reportedByUsers; // JSON array of report objects

    // ====== CONSTRUCTORS ======

    public PublicationEntity() {
        super();
        // Задаваме created дата директно в конструктора
        this.setCreated(java.time.Instant.now());
        this.setModified(java.time.Instant.now());
    }

    public PublicationEntity(String title, String content, CategoryEnum category, UserEntity author) {
        this();
        this.title = title;
        this.content = content;
        this.category = category;
        this.author = author;
        this.status = PublicationStatus.PENDING;
        this.generateExcerpt();
        this.calculateReadingTime();
    }

    // ====== BUSINESS METHODS ======

    public void generateExcerpt() {
        if (content != null && !content.trim().isEmpty()) {
            String plainText = content.replaceAll("<[^>]*>", ""); // Remove HTML tags
            if (plainText.length() > 200) {
                this.excerpt = plainText.substring(0, 200) + "...";
            } else {
                this.excerpt = plainText;
            }
        }
    }

    public void calculateReadingTime() {
        if (content != null && !content.trim().isEmpty()) {
            String plainText = content.replaceAll("<[^>]*>", ""); // Remove HTML tags
            int wordCount = plainText.split("\\s+").length;
            this.readingTime = Math.max(1, wordCount / 200); // Average 200 words per minute
        }
    }

    public void publish() {
        this.status = PublicationStatus.PUBLISHED;
        this.publishedAt = LocalDateTime.now();
    }

    public void unpublish() {
        this.status = PublicationStatus.PENDING;
        this.publishedAt = null;
    }

    public void incrementViews() {
        this.viewsCount++;
    }

    public void incrementLikes() {
        this.likesCount++;
    }

    public void decrementLikes() {
        if (this.likesCount > 0) {
            this.likesCount--;
        }
    }

    public void incrementDislikes() {
        this.dislikesCount++;
    }

    public void decrementDislikes() {
        if (this.dislikesCount > 0) {
            this.dislikesCount--;
        }
    }

    public void incrementComments() {
        this.commentsCount++;
    }

    public void decrementComments() {
        if (this.commentsCount > 0) {
            this.commentsCount--;
        }
    }

    public void incrementShares() {
        this.sharesCount++;
    }

    public boolean canBeEditedBy(UserEntity user) {
        if (user == null) return false;
        return author.getId().equals(user.getId());
    }

    public boolean canBeViewedBy(UserEntity user) {
        if (status == PublicationStatus.PUBLISHED) return true;
        if (user == null) return false;
        return author.getId().equals(user.getId());
    }

    public boolean isPublished() {
        return status == PublicationStatus.PUBLISHED;
    }

    public boolean isDraft() {
        return status == PublicationStatus.PENDING;
    }

    // ====== LIKES MANAGEMENT (САМО USERNAME) ======

    /**
     * Проверка дали публикацията е харесана от потребител
     */
    public boolean isLikedBy(String userName) {
        if (likedByUsers == null || userName == null) return false;
        return likedByUsers.contains("\"" + userName + "\"");
    }

    /**
     * Добавяне на харесване
     */
    public void addLike(String userName) {
        if (userName == null) return;

        if (likedByUsers == null || likedByUsers.isEmpty()) {
            likedByUsers = "[\"" + userName + "\"]";
        } else if (!isLikedBy(userName)) {
            likedByUsers = likedByUsers.substring(0, likedByUsers.length() - 1) + ",\"" + userName + "\"]";
        }
        incrementLikes();
    }

    /**
     * Премахване на харесване
     */
    public void removeLike(String userName) {
        if (likedByUsers == null || userName == null || !isLikedBy(userName)) return;

        String userStr = "\"" + userName + "\"";

        if (likedByUsers.equals("[" + userStr + "]")) {
            likedByUsers = null;
        } else if (likedByUsers.startsWith("[" + userStr + ",")) {
            likedByUsers = likedByUsers.replace("[" + userStr + ",", "[");
        } else if (likedByUsers.endsWith("," + userStr + "]")) {
            likedByUsers = likedByUsers.replace("," + userStr + "]", "]");
        } else {
            likedByUsers = likedByUsers.replace("," + userStr + ",", ",");
        }

        decrementLikes();
    }

    // ====== DISLIKES MANAGEMENT ======

    /**
     * Проверка дали публикацията е дислайкана от потребител
     */
    public boolean isDislikedBy(String userName) {
        if (dislikedByUsers == null || userName == null) return false;
        return dislikedByUsers.contains("\"" + userName + "\"");
    }

    /**
     * Добавяне на дислайк
     */
    public void addDislike(String userName) {
        if (userName == null) return;

        if (dislikedByUsers == null || dislikedByUsers.isEmpty()) {
            dislikedByUsers = "[\"" + userName + "\"]";
        } else if (!isDislikedBy(userName)) {
            dislikedByUsers = dislikedByUsers.substring(0, dislikedByUsers.length() - 1) + ",\"" + userName + "\"]";
        }
        incrementDislikes();
    }

    /**
     * Премахване на дислайк
     */
    public void removeDislike(String userName) {
        if (dislikedByUsers == null || userName == null || !isDislikedBy(userName)) return;

        String userStr = "\"" + userName + "\"";

        if (dislikedByUsers.equals("[" + userStr + "]")) {
            dislikedByUsers = null;
        } else if (dislikedByUsers.startsWith("[" + userStr + ",")) {
            dislikedByUsers = dislikedByUsers.replace("[" + userStr + ",", "[");
        } else if (dislikedByUsers.endsWith("," + userStr + "]")) {
            dislikedByUsers = dislikedByUsers.replace("," + userStr + "]", "]");
        } else {
            dislikedByUsers = dislikedByUsers.replace("," + userStr + ",", ",");
        }

        decrementDislikes();
    }

    // ====== BOOKMARKS MANAGEMENT ======

    public boolean isBookmarkedBy(String userName) {
        if (bookmarkedByUsers == null || userName == null) return false;
        return bookmarkedByUsers.contains("\"" + userName + "\"");
    }

    public void addBookmark(String userName) {
        if (userName == null) return;

        if (bookmarkedByUsers == null || bookmarkedByUsers.isEmpty()) {
            bookmarkedByUsers = "[\"" + userName + "\"]";
        } else if (!isBookmarkedBy(userName)) {
            bookmarkedByUsers = bookmarkedByUsers.substring(0, bookmarkedByUsers.length() - 1) + ",\"" + userName + "\"]";
        }
    }

    public void removeBookmark(String userName) {
        if (bookmarkedByUsers == null || userName == null || !isBookmarkedBy(userName)) return;

        String userStr = "\"" + userName + "\"";

        if (bookmarkedByUsers.equals("[" + userStr + "]")) {
            bookmarkedByUsers = null;
        } else if (bookmarkedByUsers.startsWith("[" + userStr + ",")) {
            bookmarkedByUsers = bookmarkedByUsers.replace("[" + userStr + ",", "[");
        } else if (bookmarkedByUsers.endsWith("," + userStr + "]")) {
            bookmarkedByUsers = bookmarkedByUsers.replace("," + userStr + "]", "]");
        } else {
            bookmarkedByUsers = bookmarkedByUsers.replace("," + userStr + ",", ",");
        }
    }

    // ====== GETTERS AND SETTERS ======

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

    public UserEntity getAuthor() { return author; }
    public void setAuthor(UserEntity author) { this.author = author; }

    public String getLikedByUsers() { return likedByUsers; }
    public void setLikedByUsers(String likedByUsers) { this.likedByUsers = likedByUsers; }

    public String getDislikedByUsers() { return dislikedByUsers; }
    public void setDislikedByUsers(String dislikedByUsers) { this.dislikedByUsers = dislikedByUsers; }

    public String getReportedByUsers() { return reportedByUsers; }
    public void setReportedByUsers(String reportedByUsers) { this.reportedByUsers = reportedByUsers; }

    public Integer getReadingTime() { return readingTime; }
    public void setReadingTime(Integer readingTime) { this.readingTime = readingTime; }

    public String getEmotion() { return emotion; }
    public void setEmotion(String emotion) { this.emotion = emotion; }

    public String getEmotionText() { return emotionText; }
    public void setEmotionText(String emotionText) { this.emotionText = emotionText; }

    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }

    public String getBookmarkedByUsers() { return bookmarkedByUsers; }
    public void setBookmarkedByUsers(String bookmarkedByUsers) { this.bookmarkedByUsers = bookmarkedByUsers; }
}