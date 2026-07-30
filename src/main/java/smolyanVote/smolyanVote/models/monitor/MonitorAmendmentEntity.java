package smolyanVote.smolyanVote.models.monitor;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.BaseEntity;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "monitor_amendments", indexes = {
        @Index(name = "idx_monitor_amendments_contract", columnList = "contract_id"),
        @Index(name = "idx_monitor_amendments_unp", columnList = "unp")
})
public class MonitorAmendmentEntity extends BaseEntity {

    @Column(name = "contract_id")
    private Long contractId;

    @Column(name = "unp", length = 64)
    private String unp;

    @Column(name = "eop_notice_id", length = 64)
    private String eopNoticeId;

    @Column(name = "previous_amount_eur", precision = 18, scale = 2)
    private BigDecimal previousAmountEur;

    @Column(name = "new_amount_eur", precision = 18, scale = 2)
    private BigDecimal newAmountEur;

    @Column(name = "delta_eur", precision = 18, scale = 2)
    private BigDecimal deltaEur;

    @Column(name = "change_description", columnDefinition = "TEXT")
    private String changeDescription;

    @Column(name = "change_reason", length = 500)
    private String changeReason;

    @Column(name = "amended_at")
    private LocalDate amendedAt;

    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    @Column(name = "fetched_at")
    private Instant fetchedAt;

    public Long getContractId() {
        return contractId;
    }

    public void setContractId(Long contractId) {
        this.contractId = contractId;
    }

    public String getUnp() {
        return unp;
    }

    public void setUnp(String unp) {
        this.unp = unp;
    }

    public String getEopNoticeId() {
        return eopNoticeId;
    }

    public void setEopNoticeId(String eopNoticeId) {
        this.eopNoticeId = eopNoticeId;
    }

    public BigDecimal getPreviousAmountEur() {
        return previousAmountEur;
    }

    public void setPreviousAmountEur(BigDecimal previousAmountEur) {
        this.previousAmountEur = previousAmountEur;
    }

    public BigDecimal getNewAmountEur() {
        return newAmountEur;
    }

    public void setNewAmountEur(BigDecimal newAmountEur) {
        this.newAmountEur = newAmountEur;
    }

    public BigDecimal getDeltaEur() {
        return deltaEur;
    }

    public void setDeltaEur(BigDecimal deltaEur) {
        this.deltaEur = deltaEur;
    }

    public String getChangeDescription() {
        return changeDescription;
    }

    public void setChangeDescription(String changeDescription) {
        this.changeDescription = changeDescription;
    }

    public String getChangeReason() {
        return changeReason;
    }

    public void setChangeReason(String changeReason) {
        this.changeReason = changeReason;
    }

    public LocalDate getAmendedAt() {
        return amendedAt;
    }

    public void setAmendedAt(LocalDate amendedAt) {
        this.amendedAt = amendedAt;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public void setSourceUrl(String sourceUrl) {
        this.sourceUrl = sourceUrl;
    }

    public Instant getFetchedAt() {
        return fetchedAt;
    }

    public void setFetchedAt(Instant fetchedAt) {
        this.fetchedAt = fetchedAt;
    }
}
