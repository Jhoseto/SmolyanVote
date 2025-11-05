package smolyanVote.smolyanVote.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import smolyanVote.smolyanVote.models.enums.SignalsCategory;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Entity модел за сигналите от граждани
 */
@Entity
@Table(name = "signals", indexes = {
        @Index(name = "idx_signals_category", columnList = "category"),
        @Index(name = "idx_signals_author", columnList = "author_id"),
        @Index(name = "idx_signals_created", columnList = "created"),
        @Index(name = "idx_signals_coordinates", columnList = "latitude, longitude"),
        @Index(name = "idx_signals_active_until", columnList = "active_until")
})
public class SignalsEntity extends BaseEntity {

    @NotBlank(message = "Заглавието е задължително")
    @Size(min = 5, max = 200, message = "Заглавието трябва да е между 5 и 200 символа")
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @NotBlank(message = "Описанието е задължително")
    @Size(min = 10, max = 2000, message = "Описанието трябва да е между 10 и 2000 символа")
    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Категорията е задължителна")
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private SignalsCategory category;

    @Min(value = 1, message = "Периодът на активност трябва да е поне 1 ден")
    @Max(value = 7, message = "Периодът на активност не може да е повече от 7 дни")
    @Column(name = "expiration_days", nullable = true)
    private Integer expirationDays;

    @Column(name = "active_until", nullable = true)
    private Instant activeUntil;

    @NotNull(message = "Географската ширина е задължителна")
    @DecimalMin(value = "-90.0", message = "Географската ширина трябва да е между -90 и 90")
    @DecimalMax(value = "90.0", message = "Географската ширина трябва да е между -90 и 90")
    @Column(name = "latitude", nullable = false, precision = 10, scale = 8)
    private BigDecimal latitude;

    @NotNull(message = "Географската дължина е задължителна")
    @DecimalMin(value = "-180.0", message = "Географската дължина трябва да е между -180 и 180")
    @DecimalMax(value = "180.0", message = "Географската дължина трябва да е między -180 и 180")
    @Column(name = "longitude", nullable = false, precision = 11, scale = 8)
    private BigDecimal longitude;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @NotNull(message = "Авторът е задължителен")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    @JsonIgnore
    private UserEntity author;

    // Административни полета
    @Column(name = "views_count", nullable = false)
    private Integer viewsCount = 0;

    @Column(name = "likes_count", nullable = false)
    private Integer likesCount = 0;

    @Column(name = "reports_count", nullable = false)
    private Integer reportsCount = 0;

    // JSON полета за потребителски взаимодействия
    @Column(name = "liked_by_users", columnDefinition = "TEXT")
    private String likedByUsers;

    @Column(name = "reported_by_users", columnDefinition = "TEXT")
    private String reportedByUsers;

    // Администраивни бележки
    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private UserEntity resolvedBy;

    @Column(name = "comments_count", nullable = false, columnDefinition = "int default 0")
    private Integer commentsCount = 0;

    // ====== CONSTRUCTORS ======

    public SignalsEntity() {
        super();
        this.setCreated(java.time.Instant.now());
        this.setModified(java.time.Instant.now());
    }

    public SignalsEntity(String title, String description, SignalsCategory category,
                         Integer expirationDays, BigDecimal latitude, BigDecimal longitude,
                         UserEntity author) {
        this();
        this.title = title;
        this.description = description;
        this.category = category;
        this.expirationDays = expirationDays;
        this.latitude = latitude;
        this.longitude = longitude;
        this.author = author;
        // Изчисляване на activeUntil базирано на expirationDays
        if (expirationDays != null) {
            this.activeUntil = Instant.now().plus(expirationDays, java.time.temporal.ChronoUnit.DAYS);
        }
    }

    // ====== GETTERS AND SETTERS ======

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public SignalsCategory getCategory() { return category; }
    public void setCategory(SignalsCategory category) { this.category = category; }

    public Integer getExpirationDays() { return expirationDays; }
    public void setExpirationDays(Integer expirationDays) {
        this.expirationDays = expirationDays;
        // Автоматично изчисляване на activeUntil при промяна на expirationDays
        if (expirationDays != null && this.getCreated() != null) {
            this.activeUntil = this.getCreated().plus(expirationDays, java.time.temporal.ChronoUnit.DAYS);
        } else if (expirationDays != null) {
            this.activeUntil = Instant.now().plus(expirationDays, java.time.temporal.ChronoUnit.DAYS);
        }
    }

    public Instant getActiveUntil() { return activeUntil; }
    public void setActiveUntil(Instant activeUntil) { this.activeUntil = activeUntil; }

    // Helper метод за проверка дали сигналът е активен
    public boolean isActive() {
        if (activeUntil == null) {
            // Fallback: Ако activeUntil не е зададен, считаме сигнала за активен
            return true;
        }
        return activeUntil.isAfter(Instant.now());
    }

    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }

    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public UserEntity getAuthor() { return author; }
    public void setAuthor(UserEntity author) { this.author = author; }

    public Integer getViewsCount() { return viewsCount; }
    public void setViewsCount(Integer viewsCount) { this.viewsCount = viewsCount; }

    public Integer getLikesCount() { return likesCount; }
    public void setLikesCount(Integer likesCount) { this.likesCount = likesCount; }

    public Integer getReportsCount() { return reportsCount; }
    public void setReportsCount(Integer reportsCount) { this.reportsCount = reportsCount; }

    public String getLikedByUsers() { return likedByUsers; }
    public void setLikedByUsers(String likedByUsers) { this.likedByUsers = likedByUsers; }

    public String getReportedByUsers() { return reportedByUsers; }
    public void setReportedByUsers(String reportedByUsers) { this.reportedByUsers = reportedByUsers; }

    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }

    public UserEntity getResolvedBy() { return resolvedBy; }
    public void setResolvedBy(UserEntity resolvedBy) { this.resolvedBy = resolvedBy; }

    public Integer getCommentsCount() {
        return commentsCount;
    }

    public void setCommentsCount(Integer commentsCount) {
        this.commentsCount = commentsCount;
    }
}