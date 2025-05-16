package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.models.enums.UserRole;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "users")
public class UserEntity extends BaseEntity {

    private String username;
    private String realName;

    @Enumerated(EnumType.STRING)
    @Column(name = "location")
    private Locations location;

    private String password;

    @Column(unique = true, nullable = false)
    private String email;

    private boolean isActive;
    private String imageUrl;
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

    public boolean isActive() {
        return isActive;
    }

    public UserEntity setActive(boolean active) {
        isActive = active;
        return this;
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

    public UserEntity setUserEventsCount(int userOffersCount) {
        this.userEventsCount = userOffersCount;
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
}
