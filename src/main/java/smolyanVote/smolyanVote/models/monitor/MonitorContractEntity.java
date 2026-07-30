package smolyanVote.smolyanVote.models.monitor;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.BaseEntity;
import smolyanVote.smolyanVote.models.enums.MonitorRegionScope;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "monitor_contracts", indexes = {
        @Index(name = "idx_monitor_contracts_sigma_id", columnList = "sigma_id", unique = true),
        @Index(name = "idx_monitor_contracts_authority_eik", columnList = "authority_eik"),
        @Index(name = "idx_monitor_contracts_signed_at", columnList = "signed_at"),
        @Index(name = "idx_monitor_contracts_risk_score", columnList = "risk_score")
})
public class MonitorContractEntity extends BaseEntity {

    @Column(name = "sigma_id", nullable = false, length = 255, unique = true)
    private String sigmaId;

    @Column(name = "unp", length = 64)
    private String unp;

    @Column(name = "subject", nullable = false, columnDefinition = "TEXT")
    private String subject;

    @Column(name = "authority_name", length = 500)
    private String authorityName;

    @Column(name = "authority_eik", nullable = false, length = 20)
    private String authorityEik;

    @Column(name = "contractor_name", length = 500)
    private String contractorName;

    @Column(name = "contractor_eik", length = 20)
    private String contractorEik;

    @Column(name = "contractor_kind", length = 32)
    private String contractorKind;

    @Column(name = "sector_code", length = 8)
    private String sectorCode;

    @Column(name = "procedure_type", length = 128)
    private String procedureType;

    @Column(name = "signed_at")
    private LocalDate signedAt;

    @Column(name = "amount_eur", precision = 18, scale = 2)
    private BigDecimal amountEur;

    /** Value at first import (signing) — never overwritten by later re-imports/amendments. Used for growth-via-amendments risk check. */
    @Column(name = "original_amount_eur", precision = 18, scale = 2)
    private BigDecimal originalAmountEur;

    /** Estimated/prognosed value from the tender notice (EOP only — SIGMA export does not expose it). */
    @Column(name = "estimated_value_eur", precision = 18, scale = 2)
    private BigDecimal estimatedValueEur;

    /** Tender notice publication date (EOP only). Used to flag contracts signed before their own tender was published. */
    @Column(name = "publication_date")
    private LocalDate publicationDate;

    @Column(name = "eu_funded", nullable = false)
    private boolean euFunded;

    @Column(name = "bids_received")
    private Integer bidsReceived;

    @Column(name = "risk_score")
    private Integer riskScore;

    @Column(name = "risk_flags_json", columnDefinition = "TEXT")
    private String riskFlagsJson;

    @Column(name = "short_summary", length = 280)
    private String shortSummary;

    @Column(name = "ai_category", length = 64)
    private String aiCategory;

    @Column(name = "impact_score")
    private Integer impactScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "region_scope", nullable = false, length = 32)
    private MonitorRegionScope regionScope = MonitorRegionScope.SMOLYAN_CITY;

    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    @Column(name = "fetched_at")
    private java.time.Instant fetchedAt;

    public String getSigmaId() {
        return sigmaId;
    }

    public void setSigmaId(String sigmaId) {
        this.sigmaId = sigmaId;
    }

    public String getUnp() {
        return unp;
    }

    public void setUnp(String unp) {
        this.unp = unp;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getAuthorityName() {
        return authorityName;
    }

    public void setAuthorityName(String authorityName) {
        this.authorityName = authorityName;
    }

    public String getAuthorityEik() {
        return authorityEik;
    }

    public void setAuthorityEik(String authorityEik) {
        this.authorityEik = authorityEik;
    }

    public String getContractorName() {
        return contractorName;
    }

    public void setContractorName(String contractorName) {
        this.contractorName = contractorName;
    }

    public String getContractorEik() {
        return contractorEik;
    }

    public void setContractorEik(String contractorEik) {
        this.contractorEik = contractorEik;
    }

    public String getContractorKind() {
        return contractorKind;
    }

    public void setContractorKind(String contractorKind) {
        this.contractorKind = contractorKind;
    }

    public String getSectorCode() {
        return sectorCode;
    }

    public void setSectorCode(String sectorCode) {
        this.sectorCode = sectorCode;
    }

    public String getProcedureType() {
        return procedureType;
    }

    public void setProcedureType(String procedureType) {
        this.procedureType = procedureType;
    }

    public LocalDate getSignedAt() {
        return signedAt;
    }

    public void setSignedAt(LocalDate signedAt) {
        this.signedAt = signedAt;
    }

    public BigDecimal getAmountEur() {
        return amountEur;
    }

    public void setAmountEur(BigDecimal amountEur) {
        this.amountEur = amountEur;
    }

    public boolean isEuFunded() {
        return euFunded;
    }

    public void setEuFunded(boolean euFunded) {
        this.euFunded = euFunded;
    }

    public BigDecimal getOriginalAmountEur() {
        return originalAmountEur;
    }

    public void setOriginalAmountEur(BigDecimal originalAmountEur) {
        this.originalAmountEur = originalAmountEur;
    }

    public BigDecimal getEstimatedValueEur() {
        return estimatedValueEur;
    }

    public void setEstimatedValueEur(BigDecimal estimatedValueEur) {
        this.estimatedValueEur = estimatedValueEur;
    }

    public LocalDate getPublicationDate() {
        return publicationDate;
    }

    public void setPublicationDate(LocalDate publicationDate) {
        this.publicationDate = publicationDate;
    }

    public Integer getBidsReceived() {
        return bidsReceived;
    }

    public void setBidsReceived(Integer bidsReceived) {
        this.bidsReceived = bidsReceived;
    }

    public Integer getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Integer riskScore) {
        this.riskScore = riskScore;
    }

    public String getRiskFlagsJson() {
        return riskFlagsJson;
    }

    public void setRiskFlagsJson(String riskFlagsJson) {
        this.riskFlagsJson = riskFlagsJson;
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

    public MonitorRegionScope getRegionScope() {
        return regionScope;
    }

    public void setRegionScope(MonitorRegionScope regionScope) {
        this.regionScope = regionScope;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public void setSourceUrl(String sourceUrl) {
        this.sourceUrl = sourceUrl;
    }

    public java.time.Instant getFetchedAt() {
        return fetchedAt;
    }

    public void setFetchedAt(java.time.Instant fetchedAt) {
        this.fetchedAt = fetchedAt;
    }
}
