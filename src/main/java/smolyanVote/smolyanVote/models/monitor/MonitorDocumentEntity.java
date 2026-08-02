package smolyanVote.smolyanVote.models.monitor;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.BaseEntity;
import smolyanVote.smolyanVote.models.enums.MonitorDocumentType;
import smolyanVote.smolyanVote.models.enums.MonitorSource;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "monitor_documents", indexes = {
        @Index(name = "idx_monitor_documents_source", columnList = "source, source_id", unique = true),
        @Index(name = "idx_monitor_documents_type", columnList = "document_type"),
        @Index(name = "idx_monitor_documents_published", columnList = "published_at")
})
public class MonitorDocumentEntity extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 32)
    private MonitorSource source;

    @Column(name = "source_id", nullable = false, length = 128)
    private String sourceId;

    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 32)
    private MonitorDocumentType documentType;

    @Column(name = "title", nullable = false, columnDefinition = "TEXT")
    private String title;

    @Column(name = "raw_content", columnDefinition = "LONGTEXT")
    private String rawContent;

    @Column(name = "short_summary", length = 280)
    private String shortSummary;

    @Column(name = "ai_category", length = 64)
    private String aiCategory;

    @Column(name = "impact_score")
    private Integer impactScore;

    @Column(name = "amount", precision = 18, scale = 2)
    private BigDecimal amount;

    /** Original currency from smolyan.bg text — BGN or EUR; null when unknown. */
    @Column(name = "amount_currency", length = 8)
    private String amountCurrency;

    @Column(name = "company_name", length = 500)
    private String companyName;

    @Column(name = "company_eik", length = 20)
    private String companyEik;

    @Column(name = "deadline_date")
    private LocalDate deadlineDate;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "fetched_at")
    private Instant fetchedAt;

    @Column(name = "content_hash", length = 64)
    private String contentHash;

    @Column(name = "ai_analysis", columnDefinition = "TEXT")
    private String aiAnalysis;

    @Column(name = "insight_why", length = 500)
    private String insightWhy;

    @Column(name = "pdf_urls", columnDefinition = "TEXT")
    private String pdfUrlsJson;

    public MonitorSource getSource() {
        return source;
    }

    public void setSource(MonitorSource source) {
        this.source = source;
    }

    public String getSourceId() {
        return sourceId;
    }

    public void setSourceId(String sourceId) {
        this.sourceId = sourceId;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public void setSourceUrl(String sourceUrl) {
        this.sourceUrl = sourceUrl;
    }

    public MonitorDocumentType getDocumentType() {
        return documentType;
    }

    public void setDocumentType(MonitorDocumentType documentType) {
        this.documentType = documentType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getRawContent() {
        return rawContent;
    }

    public void setRawContent(String rawContent) {
        this.rawContent = rawContent;
    }

    public String getShortSummary() {
        return shortSummary;
    }

    public void setShortSummary(String shortSummary) {
        this.shortSummary = shortSummary;
    }

    public String getAiCategory() {
        return aiCategory;
    }

    public void setAiCategory(String aiCategory) {
        this.aiCategory = aiCategory;
    }

    public Integer getImpactScore() {
        return impactScore;
    }

    public void setImpactScore(Integer impactScore) {
        this.impactScore = impactScore;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getAmountCurrency() {
        return amountCurrency;
    }

    public void setAmountCurrency(String amountCurrency) {
        this.amountCurrency = amountCurrency;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getCompanyEik() {
        return companyEik;
    }

    public void setCompanyEik(String companyEik) {
        this.companyEik = companyEik;
    }

    public LocalDate getDeadlineDate() {
        return deadlineDate;
    }

    public void setDeadlineDate(LocalDate deadlineDate) {
        this.deadlineDate = deadlineDate;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(Instant publishedAt) {
        this.publishedAt = publishedAt;
    }

    public Instant getFetchedAt() {
        return fetchedAt;
    }

    public void setFetchedAt(Instant fetchedAt) {
        this.fetchedAt = fetchedAt;
    }

    public String getContentHash() {
        return contentHash;
    }

    public void setContentHash(String contentHash) {
        this.contentHash = contentHash;
    }

    public String getAiAnalysis() {
        return aiAnalysis;
    }

    public void setAiAnalysis(String aiAnalysis) {
        this.aiAnalysis = aiAnalysis;
    }

    public String getInsightWhy() {
        return insightWhy;
    }

    public void setInsightWhy(String insightWhy) {
        this.insightWhy = insightWhy;
    }

    public String getPdfUrlsJson() {
        return pdfUrlsJson;
    }

    public void setPdfUrlsJson(String pdfUrlsJson) {
        this.pdfUrlsJson = pdfUrlsJson;
    }
}
