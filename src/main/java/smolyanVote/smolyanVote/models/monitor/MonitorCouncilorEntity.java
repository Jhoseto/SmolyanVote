package smolyanVote.smolyanVote.models.monitor;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.BaseEntity;

import java.time.Instant;

@Entity
@Table(name = "monitor_councilors", indexes = {
        @Index(name = "idx_monitor_councilors_name", columnList = "full_name"),
        @Index(name = "idx_monitor_councilors_authority", columnList = "authority_eik")
})
public class MonitorCouncilorEntity extends BaseEntity {

    @Column(name = "authority_eik", nullable = false, length = 16)
    private String authorityEik;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(name = "role_label", length = 120)
    private String roleLabel;

    @Column(name = "party", length = 120)
    private String party;

    @Column(name = "mandate_period", length = 64)
    private String mandatePeriod;

    @Column(name = "zpokonpi_checked", nullable = false)
    private boolean zpokonpiChecked;

    @Column(name = "zpokonpi_note", length = 500)
    private String zpokonpiNote;

    @Column(name = "zpokonpi_status", length = 32)
    private String zpokonpiStatus = "PENDING";

    @Column(name = "zpokonpi_register_url", length = 1000)
    private String zpokonpiRegisterUrl;

    @Column(name = "zpokonpi_verified_at")
    private Instant zpokonpiVerifiedAt;

    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    public String getAuthorityEik() {
        return authorityEik;
    }

    public void setAuthorityEik(String authorityEik) {
        this.authorityEik = authorityEik;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getRoleLabel() {
        return roleLabel;
    }

    public void setRoleLabel(String roleLabel) {
        this.roleLabel = roleLabel;
    }

    public String getParty() {
        return party;
    }

    public void setParty(String party) {
        this.party = party;
    }

    public String getMandatePeriod() {
        return mandatePeriod;
    }

    public void setMandatePeriod(String mandatePeriod) {
        this.mandatePeriod = mandatePeriod;
    }

    public boolean isZpokonpiChecked() {
        return zpokonpiChecked;
    }

    public void setZpokonpiChecked(boolean zpokonpiChecked) {
        this.zpokonpiChecked = zpokonpiChecked;
    }

    public String getZpokonpiNote() {
        return zpokonpiNote;
    }

    public void setZpokonpiNote(String zpokonpiNote) {
        this.zpokonpiNote = zpokonpiNote;
    }

    public String getZpokonpiStatus() {
        return zpokonpiStatus;
    }

    public void setZpokonpiStatus(String zpokonpiStatus) {
        this.zpokonpiStatus = zpokonpiStatus;
    }

    public String getZpokonpiRegisterUrl() {
        return zpokonpiRegisterUrl;
    }

    public void setZpokonpiRegisterUrl(String zpokonpiRegisterUrl) {
        this.zpokonpiRegisterUrl = zpokonpiRegisterUrl;
    }

    public Instant getZpokonpiVerifiedAt() {
        return zpokonpiVerifiedAt;
    }

    public void setZpokonpiVerifiedAt(Instant zpokonpiVerifiedAt) {
        this.zpokonpiVerifiedAt = zpokonpiVerifiedAt;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public void setSourceUrl(String sourceUrl) {
        this.sourceUrl = sourceUrl;
    }
}
