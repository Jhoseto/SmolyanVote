package smolyanVote.smolyanVote.viewsAndDTO;

import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;

import java.time.Instant;
import java.util.List;

/**
 * DTO for displaying user data in admin panel
 * Based on actual UserEntity fields
 */
public class AdminUserViewDTO {

    // From BaseEntity
    private Long id;
    private Instant created;
    private Instant modified;

    // User identity
    private String username;
    private String realName;
    private String email;
    private String bio;
    private Locations location;

    // User image
    private String imageUrl;

    // System info
    private UserRole role;
    private UserStatusEnum status;
    private int onlineStatus;
    private Instant lastOnline;

    // Activity counters
    private int userEventsCount;
    private int totalVotes;
    private int publicationsCount;

    // Ban information
    private String banReason;
    private Instant banDate;
    private Instant banEndDate;
    private String bannedBy;

    // Notifications
    private List<Long> notification;

    public AdminUserViewDTO() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Instant getCreated() { return created; }
    public void setCreated(Instant created) { this.created = created; }

    public Instant getModified() { return modified; }
    public void setModified(Instant modified) { this.modified = modified; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getRealName() { return realName; }
    public void setRealName(String realName) { this.realName = realName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public Locations getLocation() { return location; }
    public void setLocation(Locations location) { this.location = location; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public UserStatusEnum getStatus() { return status; }
    public void setStatus(UserStatusEnum status) { this.status = status; }

    public int getOnlineStatus() { return onlineStatus; }
    public void setOnlineStatus(int onlineStatus) { this.onlineStatus = onlineStatus; }

    public Instant getLastOnline() { return lastOnline; }
    public void setLastOnline(Instant lastOnline) { this.lastOnline = lastOnline; }

    public int getUserEventsCount() { return userEventsCount; }
    public void setUserEventsCount(int userEventsCount) { this.userEventsCount = userEventsCount; }

    public int getTotalVotes() { return totalVotes; }
    public void setTotalVotes(int totalVotes) { this.totalVotes = totalVotes; }

    public int getPublicationsCount() { return publicationsCount; }
    public void setPublicationsCount(int publicationsCount) { this.publicationsCount = publicationsCount; }

    public String getBanReason() { return banReason; }
    public void setBanReason(String banReason) { this.banReason = banReason; }

    public Instant getBanDate() { return banDate; }
    public void setBanDate(Instant banDate) { this.banDate = banDate; }

    public Instant getBanEndDate() { return banEndDate; }
    public void setBanEndDate(Instant banEndDate) { this.banEndDate = banEndDate; }

    public String getBannedBy() { return bannedBy; }
    public void setBannedBy(String bannedBy) { this.bannedBy = bannedBy; }

    public List<Long> getNotification() { return notification; }
    public void setNotification(List<Long> notification) { this.notification = notification; }
}