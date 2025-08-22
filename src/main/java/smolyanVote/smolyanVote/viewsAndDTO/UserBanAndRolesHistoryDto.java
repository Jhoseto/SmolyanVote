package smolyanVote.smolyanVote.viewsAndDTO;

import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;

import java.time.Instant;

/**
 * DTO за history на ban и role промени
 * Поддържа ROLE_CHANGE, BAN и UNBAN операции
 */
public class UserBanAndRolesHistoryDto {

    // Общи полета за всички операции
    private Long id;
    private String targetUsername;
    private String adminUsername;
    private String actionType; // ROLE_CHANGE, BAN, UNBAN
    private Instant actionTimestamp;
    private String reason;

    // Полета за ROLE_CHANGE операции (nullable за други операции)
    private UserRole oldRole;
    private UserRole newRole;

    // Полета за BAN/UNBAN операции (nullable за role операции)
    private String banType; // PERMANENT, TEMPORARY
    private Integer banDurationDays; // null за permanent ban
    private UserStatusEnum oldStatus;
    private UserStatusEnum newStatus;

    // Constructors
    public UserBanAndRolesHistoryDto() {}

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTargetUsername() {
        return targetUsername;
    }

    public void setTargetUsername(String targetUsername) {
        this.targetUsername = targetUsername;
    }

    public String getAdminUsername() {
        return adminUsername;
    }

    public void setAdminUsername(String adminUsername) {
        this.adminUsername = adminUsername;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public Instant getActionTimestamp() {
        return actionTimestamp;
    }

    public void setActionTimestamp(Instant actionTimestamp) {
        this.actionTimestamp = actionTimestamp;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    // Role change fields
    public UserRole getOldRole() {
        return oldRole;
    }

    public void setOldRole(UserRole oldRole) {
        this.oldRole = oldRole;
    }

    public UserRole getNewRole() {
        return newRole;
    }

    public void setNewRole(UserRole newRole) {
        this.newRole = newRole;
    }

    // Ban/Unban fields
    public String getBanType() {
        return banType;
    }

    public void setBanType(String banType) {
        this.banType = banType;
    }

    public Integer getBanDurationDays() {
        return banDurationDays;
    }

    public void setBanDurationDays(Integer banDurationDays) {
        this.banDurationDays = banDurationDays;
    }

    public UserStatusEnum getOldStatus() {
        return oldStatus;
    }

    public void setOldStatus(UserStatusEnum oldStatus) {
        this.oldStatus = oldStatus;
    }

    public UserStatusEnum getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(UserStatusEnum newStatus) {
        this.newStatus = newStatus;
    }

    // Utility methods for easier usage
    public boolean isRoleChange() {
        return "ROLE_CHANGE".equals(actionType);
    }

    public boolean isBanOperation() {
        return "BAN".equals(actionType);
    }

    public boolean isUnbanOperation() {
        return "UNBAN".equals(actionType);
    }

    @Override
    public String toString() {
        return "UserBanAndRolesHistoryDto{" +
                "id=" + id +
                ", targetUsername='" + targetUsername + '\'' +
                ", adminUsername='" + adminUsername + '\'' +
                ", actionType='" + actionType + '\'' +
                ", actionTimestamp=" + actionTimestamp +
                ", reason='" + reason + '\'' +
                (isRoleChange() ? ", oldRole=" + oldRole + ", newRole=" + newRole : "") +
                (isBanOperation() || isUnbanOperation() ? ", banType='" + banType + '\'' +
                        ", banDurationDays=" + banDurationDays + ", oldStatus=" + oldStatus +
                        ", newStatus=" + newStatus : "") +
                '}';
    }
}