package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.enums.ReportReasonEnum;
import smolyanVote.smolyanVote.models.enums.ReportableEntityType;

import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
public class ReportsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ===== LEGACY PUBLICATION SUPPORT =====
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "publication_id", nullable = true) // Nullable за обратна съвместимост
    private PublicationEntity publication;

    // ===== NEW POLYMORPHIC SUPPORT =====
    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = true) // Nullable за съществуващи записи
    private ReportableEntityType entityType;

    @Column(name = "entity_id", nullable = true) // Nullable за съществуващи записи
    private Long entityId;

    // ===== COMMON FIELDS =====
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private UserEntity reporter;

    @Enumerated(EnumType.STRING)
    @Column(name = "reason", nullable = false)
    private ReportReasonEnum reason;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "status", nullable = false)
    private String status = "PENDING"; // PENDING, REVIEWED, DISMISSED, RESOLVED

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private UserEntity reviewedBy;

    @Column(name = "admin_notes", length = 1000)
    private String adminNotes;

    // ===== CONSTRUCTORS =====
    public ReportsEntity() {
        this.createdAt = LocalDateTime.now();
    }

    // Legacy constructor for publications (обратна съвместимост)
    public ReportsEntity(PublicationEntity publication, UserEntity reporter, ReportReasonEnum reason) {
        this();
        this.publication = publication;
        this.reporter = reporter;
        this.reason = reason;
        // За legacy, също попълваме новите полета
        this.entityType = ReportableEntityType.PUBLICATION;
        this.entityId = publication.getId();
    }

    // New generic constructor
    public ReportsEntity(ReportableEntityType entityType, Long entityId, UserEntity reporter, ReportReasonEnum reason) {
        this();
        this.entityType = entityType;
        this.entityId = entityId;
        this.reporter = reporter;
        this.reason = reason;

        // За публикации, също попълваме legacy полето ако е възможно
        if (entityType == ReportableEntityType.PUBLICATION) {
            // publication полето ще се попълни от service-а ако е нужно
        }
    }

    // ===== UTILITY METHODS =====

    /**
     * Проверява дали докладът е за публикация
     */
    public boolean isPublicationReport() {
        return entityType == ReportableEntityType.PUBLICATION || publication != null;
    }

    /**
     * Проверява дали докладът е за събитие
     */
    public boolean isEventReport() {
        return entityType == ReportableEntityType.SIMPLE_EVENT ||
                entityType == ReportableEntityType.REFERENDUM ||
                entityType == ReportableEntityType.MULTI_POLL;
    }

    /**
     * Връща ID на докладваният обект (универсално)
     */
    public Long getReportedEntityId() {
        if (entityId != null) {
            return entityId;
        }
        // Fallback за legacy записи
        return publication != null ? publication.getId() : null;
    }

    /**
     * Връща типа на докладваният обект (универсално)
     */
    public ReportableEntityType getReportedEntityType() {
        if (entityType != null) {
            return entityType;
        }
        // Fallback за legacy записи
        return publication != null ? ReportableEntityType.PUBLICATION : null;
    }

    // ===== GETTERS AND SETTERS =====

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public PublicationEntity getPublication() {
        return publication;
    }

    public void setPublication(PublicationEntity publication) {
        this.publication = publication;
        // Автоматично попълване на новите полета при set на publication
        if (publication != null) {
            this.entityType = ReportableEntityType.PUBLICATION;
            this.entityId = publication.getId();
        }
    }

    public ReportableEntityType getEntityType() {
        return entityType;
    }

    public void setEntityType(ReportableEntityType entityType) {
        this.entityType = entityType;
    }

    public Long getEntityId() {
        return entityId;
    }

    public void setEntityId(Long entityId) {
        this.entityId = entityId;
    }

    public UserEntity getReporter() {
        return reporter;
    }

    public void setReporter(UserEntity reporter) {
        this.reporter = reporter;
    }

    public ReportReasonEnum getReason() {
        return reason;
    }

    public void setReason(ReportReasonEnum reason) {
        this.reason = reason;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public UserEntity getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(UserEntity reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public String getAdminNotes() {
        return adminNotes;
    }

    public void setAdminNotes(String adminNotes) {
        this.adminNotes = adminNotes;
    }
}