package smolyanVote.smolyanVote.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "users")
public class UserEntity extends BaseEntity {

    private String username;
    private String realName;

    @Enumerated(EnumType.STRING)
    @Column(name = "location")
    private Locations location;

    @JsonIgnore
    private String password;
    @JsonIgnore
    @Column(unique = true, nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private UserStatusEnum status = UserStatusEnum.PENDING_ACTIVATION;

    @Column(name = "ban_end_date")
    private Instant banEndDate;

    @Column(name = "ban_reason", length = 500)
    private String banReason;

    @Column(name = "banned_by_username", length = 50)
    private String bannedByUsername;

    @Column(name = "ban_date")
    private Instant banDate;

    @Column(length = 1000)
    private String imageUrl;

    @JsonIgnore
    private String userConfirmationCode;
    private String bio;
    private int userEventsCount;

    @Enumerated(EnumType.STRING)
    private UserRole role;

    @Column(columnDefinition = "TIMESTAMP")
    protected Instant lastOnline;

    private int onlineStatus;

    @ElementCollection(fetch = FetchType.EAGER)
    @Column
    private List<Long> notification;
    private int totalVotes;

    private int publicationsCount;
    private int signalsCount;

    // ===== GETTERS AND SETTERS =====

    public String getUsername() {
        return username;
    }

    public UserEntity setUsername(String username) {
        this.username = username;
        return this;
    }

    public String getRealName() {
        return realName;
    }

    public UserEntity setRealName(String realName) {
        this.realName = realName;
        return this;
    }

    public Locations getLocation() {
        return location;
    }

    public void setLocation(Locations location) {
        this.location = location;
    }

    public String getPassword() {
        return password;
    }

    public UserEntity setPassword(String password) {
        this.password = password;
        return this;
    }

    public String getEmail() {
        return email;
    }

    public UserEntity setEmail(String email) {
        this.email = email;
        return this;
    }

    public UserStatusEnum getStatus() {
        return status;
    }

    public UserEntity setStatus(UserStatusEnum status) {
        this.status = status;
        return this;
    }

    public Instant getBanEndDate() {
        return banEndDate;
    }

    public void setBanEndDate(Instant banEndDate) {
        this.banEndDate = banEndDate;
    }

    public String getBanReason() {
        return banReason;
    }

    public void setBanReason(String banReason) {
        this.banReason = banReason;
    }

    public String getBannedByUsername() {
        return bannedByUsername;
    }

    public void setBannedByUsername(String bannedByUsername) {
        this.bannedByUsername = bannedByUsername;
    }

    public Instant getBanDate() {
        return banDate;
    }

    public void setBanDate(Instant banDate) {
        this.banDate = banDate;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public UserEntity setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
        return this;
    }

    public String getUserConfirmationCode() {
        return userConfirmationCode;
    }

    public UserEntity setUserConfirmationCode(String userConfirmationCode) {
        this.userConfirmationCode = userConfirmationCode;
        return this;
    }

    public int getUserEventsCount() {
        return userEventsCount;
    }

    public UserEntity setUserEventsCount(int userEventsCount) {
        this.userEventsCount = userEventsCount;
        return this;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public UserRole getRole() {
        return role;
    }

    public UserEntity setRole(UserRole role) {
        this.role = role;
        return this;
    }

    public Instant getLastOnline() {
        return lastOnline;
    }

    public UserEntity setLastOnline(Instant lastOnline) {
        this.lastOnline = lastOnline;
        return this;
    }

    public int getOnlineStatus() {
        return onlineStatus;
    }

    public UserEntity setOnlineStatus(int onlineStatus) {
        this.onlineStatus = onlineStatus;
        return this;
    }

    public List<Long> getNotification() {
        return notification;
    }

    public UserEntity setNotification(List<Long> notification) {
        this.notification = notification;
        return this;
    }

    public int getTotalVotes() {
        return totalVotes;
    }

    public void setTotalVotes(int totalVotes) {
        this.totalVotes = totalVotes;
    }

    public int getPublicationsCount() {
        return publicationsCount;
    }

    public void setPublicationsCount(int publicationsCount) {
        this.publicationsCount = publicationsCount;
    }

    public int getSignalsCount() {
        return signalsCount;
    }

    public void setSignalsCount(int signalsCount) {
        this.signalsCount = signalsCount;
    }
}