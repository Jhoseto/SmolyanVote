package smolyanVote.smolyanVote.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import smolyanVote.smolyanVote.models.enums.CategoryEnum;
import smolyanVote.smolyanVote.models.enums.EventStatus;

import java.time.Instant;
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
    private EventStatus status;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "views_count", nullable = false, columnDefinition = "int default 0")
    private Integer viewsCount = 0;

    @Column(name = "likes_count", nullable = false, columnDefinition = "int default 0")
    private Integer likesCount = 0;

    @Column(name = "comments_count", nullable = false, columnDefinition = "int default 0")
    private Integer commentsCount = 0;

    @Column(name = "shares_count", nullable = false, columnDefinition = "int default 0")
    private Integer sharesCount = 0;

    @Column(name = "is_featured", nullable = false, columnDefinition = "boolean default false")
    private Boolean isFeatured = false;

    @Column(name = "is_pinned", nullable = false, columnDefinition = "boolean default false")
    private Boolean isPinned = false;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "tags", length = 500)
    private String tags; // Comma-separated tags

    @Column(name = "reading_time")
    private Integer readingTime; // In minutes

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes; // Internal notes for admins

    // ====== SIMPLIFIED RELATIONSHIPS ======

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    @JsonManagedReference
    private UserEntity author;

    // САМО за коментари - използваме съществуващата Comment entity от събития
    @OneToMany(mappedBy = "publication", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<CommentsEntity> comments = new HashSet<>();

    // Останалите взаимодействия ги пазим в отделни таблици ако е необходимо
    // ИЛИ използваме JSON колони за по-прости случаи

    @Column(name = "liked_by_users", columnDefinition = "TEXT")
    private String likedByUsers; // JSON array of user IDs

    @Column(name = "bookmarked_by_users", columnDefinition = "TEXT")
    private String bookmarkedByUsers; // JSON array of user IDs

    @Column(name = "reported_by_users", columnDefinition = "TEXT")
    private String reportedByUsers; // JSON array of report objects

    // ====== CONSTRUCTORS ======

    public PublicationEntity() {
        super();
    }

    public PublicationEntity(String title, String content, CategoryEnum category, UserEntity author) {
        this();
        this.title = title;
        this.content = content;
        this.category = category;
        this.author = author;
        this.status = EventStatus.DRAFT;
        this.generateExcerpt();
        this.calculateReadingTime();
    }

    // ====== LIFECYCLE CALLBACKS ======

    @PrePersist
    public void prePersist() {

    }

    @PreUpdate
    public void preUpdate() {

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
        this.status = EventStatus.ACTIVE;
        this.publishedAt = LocalDateTime.now();
    }

    public void unpublish() {
        this.status = EventStatus.DRAFT;
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
        if (status == EventStatus.ACTIVE) return true;
        if (user == null) return false;
        return author.getId().equals(user.getId());
    }

    public boolean isPublished() {
        return status == EventStatus.ACTIVE;
    }

    public boolean isDraft() {
        return status == EventStatus.DRAFT;
    }

    // ====== JSON HELPER METHODS ======

    // За likes - използваме JSON за простота
    public boolean isLikedBy(String userName) {
        if (likedByUsers == null) return false;
        return likedByUsers.contains("\"" + userName + "\"");
    }

    public void addLike(String userName) {
        if (likedByUsers == null) {
            likedByUsers = "[" + userName + "]";
        } else if (!isLikedBy(userName)) {
            // Simple JSON manipulation - в production би било добре да се използва Jackson
            likedByUsers = likedByUsers.substring(0, likedByUsers.length() - 1) + "," + userName + "]";
        }
        incrementLikes();
    }

    public void removeLike(String userName) {
        if (likedByUsers != null && isLikedBy(userName)) {
            // Simple JSON manipulation
            likedByUsers = likedByUsers.replace("," + userName, "").replace(userName + ",", "").replace("[" + userName + "]", "[]");
            if (likedByUsers.equals("[]")) {
                likedByUsers = null;
            }
            decrementLikes();
        }
    }

    // Подобни методи за bookmarks и reports...
    public boolean isBookmarkedBy(Long userId) {
        if (bookmarkedByUsers == null) return false;
        return bookmarkedByUsers.contains("\"" + userId + "\"");
    }

    public void addBookmark(Long userId) {
        if (bookmarkedByUsers == null) {
            bookmarkedByUsers = "[" + userId + "]";
        } else if (!isBookmarkedBy(userId)) {
            bookmarkedByUsers = bookmarkedByUsers.substring(0, bookmarkedByUsers.length() - 1) + "," + userId + "]";
        }
    }

    public void removeBookmark(Long userId) {
        if (bookmarkedByUsers != null && isBookmarkedBy(userId)) {
            bookmarkedByUsers = bookmarkedByUsers.replace("," + userId, "").replace(userId + ",", "").replace("[" + userId + "]", "[]");
            if (bookmarkedByUsers.equals("[]")) {
                bookmarkedByUsers = null;
            }
        }
    }

    // ====== GETTERS AND SETTERS ======

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getExcerpt() {
        return excerpt;
    }

    public void setExcerpt(String excerpt) {
        this.excerpt = excerpt;
    }

    public CategoryEnum getCategory() {
        return category;
    }

    public void setCategory(CategoryEnum category) {
        this.category = category;
    }

    public EventStatus getStatus() {
        return status;
    }

    public void setStatus(EventStatus status) {
        this.status = status;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Integer getViewsCount() {
        return viewsCount;
    }

    public void setViewsCount(Integer viewsCount) {
        this.viewsCount = viewsCount;
    }

    public Integer getLikesCount() {
        return likesCount;
    }

    public void setLikesCount(Integer likesCount) {
        this.likesCount = likesCount;
    }

    public Integer getCommentsCount() {
        return commentsCount;
    }

    public void setCommentsCount(Integer commentsCount) {
        this.commentsCount = commentsCount;
    }

    public Integer getSharesCount() {
        return sharesCount;
    }

    public void setSharesCount(Integer sharesCount) {
        this.sharesCount = sharesCount;
    }

    public UserEntity getAuthor() {
        return author;
    }

    public void setAuthor(UserEntity author) {
        this.author = author;
    }

    public String getLikedByUsers() {
        return likedByUsers;
    }

    public void setLikedByUsers(String likedByUsers) {
        this.likedByUsers = likedByUsers;
    }

    public String getReportedByUsers() {
        return reportedByUsers;
    }

    public void setReportedByUsers(String reportedByUsers) {
        this.reportedByUsers = reportedByUsers;
    }

    public Integer getReadingTime() {
        return readingTime;
    }

    public void setReadingTime(Integer readingTime) {
        this.readingTime = readingTime;
    }

// ====== САМО НУЖНИТЕ BUSINESS МЕТОДИ ======

    /**
     * Проверка дали публикацията е харесана от потребител
     */
    public boolean isLikedBy(Long userId) {
        if (likedByUsers == null || userId == null) return false;
        return likedByUsers.contains(userId.toString());
    }

    /**
     * Добавяне на харесване
     */
    public void addLike(Long userId) {
        if (userId == null) return;

        if (likedByUsers == null || likedByUsers.isEmpty()) {
            likedByUsers = "[" + userId + "]";
        } else if (!isLikedBy(userId)) {
            likedByUsers = likedByUsers.substring(0, likedByUsers.length() - 1) + "," + userId + "]";
        }
        incrementLikes();
    }

    /**
     * Премахване на харесване
     */
    public void removeLike(Long userId) {
        if (likedByUsers == null || userId == null || !isLikedBy(userId)) return;

        String userIdStr = userId.toString();

        if (likedByUsers.equals("[" + userIdStr + "]")) {
            likedByUsers = null;
        } else if (likedByUsers.startsWith("[" + userIdStr + ",")) {
            likedByUsers = likedByUsers.replace("[" + userIdStr + ",", "[");
        } else if (likedByUsers.endsWith("," + userIdStr + "]")) {
            likedByUsers = likedByUsers.replace("," + userIdStr + "]", "]");
        } else {
            likedByUsers = likedByUsers.replace("," + userIdStr + ",", ",");
        }

        decrementLikes();
    }
}