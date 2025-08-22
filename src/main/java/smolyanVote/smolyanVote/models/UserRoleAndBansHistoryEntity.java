package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;

import java.time.Instant;

@Entity
@Table(name = "user_role_bans_history")
public class UserRoleAndBansHistoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "target_username", nullable = false)
    private String targetUsername;

    @Column(name = "admin_username", nullable = false)
    private String adminUsername;

    @Column(name = "action_type", nullable = false)
    private String actionType; // "ROLE_CHANGE", "BAN", "UNBAN"

    @Column(name = "action_timestamp", nullable = false)
    private Instant actionTimestamp;

    @Column(name = "reason", length = 500)
    private String reason;

    // Role change fields
    @Enumerated(EnumType.STRING)
    @Column(name = "old_role")
    private UserRole oldRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_role")
    private UserRole newRole;

    // Ban fields
    @Column(name = "ban_type") // "TEMPORARY", "PERMANENT"
    private String banType;

    @Column(name = "ban_duration_days")
    private Integer banDurationDays;

    @Enumerated(EnumType.STRING)
    @Column(name = "old_status")
    private UserStatusEnum oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status")
    private UserStatusEnum newStatus;

    // Constructors
    public UserRoleAndBansHistoryEntity() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTargetUsername() { return targetUsername; }
    public void setTargetUsername(String targetUsername) { this.targetUsername = targetUsername; }

    public String getAdminUsername() { return adminUsername; }
    public void setAdminUsername(String adminUsername) { this.adminUsername = adminUsername; }

    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }

    public Instant getActionTimestamp() { return actionTimestamp; }
    public void setActionTimestamp(Instant actionTimestamp) { this.actionTimestamp = actionTimestamp; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public UserRole getOldRole() { return oldRole; }
    public void setOldRole(UserRole oldRole) { this.oldRole = oldRole; }

    public UserRole getNewRole() { return newRole; }
    public void setNewRole(UserRole newRole) { this.newRole = newRole; }

    public String getBanType() { return banType; }
    public void setBanType(String banType) { this.banType = banType; }

    public Integer getBanDurationDays() { return banDurationDays; }
    public void setBanDurationDays(Integer banDurationDays) { this.banDurationDays = banDurationDays; }

    public UserStatusEnum getOldStatus() { return oldStatus; }
    public void setOldStatus(UserStatusEnum oldStatus) { this.oldStatus = oldStatus; }

    public UserStatusEnum getNewStatus() { return newStatus; }
    public void setNewStatus(UserStatusEnum newStatus) { this.newStatus = newStatus; }
}