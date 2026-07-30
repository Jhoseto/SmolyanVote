package smolyanVote.smolyanVote.models.monitor;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.BaseEntity;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "monitor_companies", indexes = {
        @Index(name = "idx_monitor_companies_eik", columnList = "eik", unique = true)
})
public class MonitorCompanyEntity extends BaseEntity {

    @Column(name = "eik", nullable = false, length = 20, unique = true)
    private String eik;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "is_consortium", nullable = false)
    private boolean consortium;

    @Column(name = "total_won_eur", precision = 18, scale = 2)
    private BigDecimal totalWonEur;

    @Column(name = "contract_count")
    private Integer contractCount;

    @Column(name = "composite_risk_score")
    private Integer compositeRiskScore;

    @Column(name = "legal_form", length = 64)
    private String legalForm;

    @Column(name = "registered_address", length = 500)
    private String registeredAddress;

    @Column(name = "managers_summary", length = 500)
    private String managersSummary;

    @Column(name = "registry_status", length = 64)
    private String registryStatus;

    @Column(name = "registry_fetched_at")
    private java.time.Instant registryFetchedAt;

    /** Earliest registration deed date from Търговски регистър — used for "new company, large contract" risk check. */
    @Column(name = "founded_at")
    private LocalDate foundedAt;

    public String getEik() {
        return eik;
    }

    public void setEik(String eik) {
        this.eik = eik;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isConsortium() {
        return consortium;
    }

    public void setConsortium(boolean consortium) {
        this.consortium = consortium;
    }

    public BigDecimal getTotalWonEur() {
        return totalWonEur;
    }

    public void setTotalWonEur(BigDecimal totalWonEur) {
        this.totalWonEur = totalWonEur;
    }

    public Integer getContractCount() {
        return contractCount;
    }

    public void setContractCount(Integer contractCount) {
        this.contractCount = contractCount;
    }

    public Integer getCompositeRiskScore() {
        return compositeRiskScore;
    }

    public void setCompositeRiskScore(Integer compositeRiskScore) {
        this.compositeRiskScore = compositeRiskScore;
    }

    public String getLegalForm() {
        return legalForm;
    }

    public void setLegalForm(String legalForm) {
        this.legalForm = legalForm;
    }

    public String getRegisteredAddress() {
        return registeredAddress;
    }

    public void setRegisteredAddress(String registeredAddress) {
        this.registeredAddress = registeredAddress;
    }

    public String getManagersSummary() {
        return managersSummary;
    }

    public void setManagersSummary(String managersSummary) {
        this.managersSummary = managersSummary;
    }

    public String getRegistryStatus() {
        return registryStatus;
    }

    public void setRegistryStatus(String registryStatus) {
        this.registryStatus = registryStatus;
    }

    public java.time.Instant getRegistryFetchedAt() {
        return registryFetchedAt;
    }

    public void setRegistryFetchedAt(java.time.Instant registryFetchedAt) {
        this.registryFetchedAt = registryFetchedAt;
    }

    public LocalDate getFoundedAt() {
        return foundedAt;
    }

    public void setFoundedAt(LocalDate foundedAt) {
        this.foundedAt = foundedAt;
    }
}
