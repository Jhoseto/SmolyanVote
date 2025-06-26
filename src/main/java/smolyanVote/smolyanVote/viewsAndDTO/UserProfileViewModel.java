package smolyanVote.smolyanVote.viewsAndDTO;

import smolyanVote.smolyanVote.models.enums.UserRole;

import java.time.Instant;
import java.util.List;


/**
 * View model representing user profile information.
 * <p>
 * This view model contains the following fields:
 * <ul>
 *     <li><b>id:</b> The unique identifier of the user.</li>
 *     <li><b>userName:</b> The username of the user.</li>
 *     <li><b>realName:</b> The real name of the user.</li>
 *     <li><b>profileImageUrl:</b> The URL of the user's profile image.</li>
 *     <li><b>email:</b> The email address of the user.</li>
 *     <li><b>phone:</b> The phone number of the user.</li>
 *     <li><b>city:</b> The city where the user is located.</li>
 *     <li><b>userOffers:</b> A list of offers created by the user.</li>
 *     <li><b>lastOnline:</b> The date and time when the user was last online.</li>
 * </ul>
 */
public class UserProfileViewModel {
    private Long id;
    private String userName;
    private String realName;
    private String profileImageUrl;
    private String email;
    private List<EventSimpleViewDTO> userEvents;
    private Instant lastOnline;
    private int onlineStatus;
    private Instant created;
    private int userOfferCount;
    private int userPublicationCount;
    private UserRole role;


    public Long getId() {
        return id;
    }

    public UserProfileViewModel setId(Long id) {
        this.id = id;
        return this;
    }

    public Instant getLastOnline() {
        return lastOnline;
    }

    public UserProfileViewModel setLastOnline(Instant lastOnline) {
        this.lastOnline = lastOnline;
        return this;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public UserProfileViewModel setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
        return this;
    }

    public String getUserName() {
        return userName;
    }

    public UserProfileViewModel setUserName(String userName) {
        this.userName = userName;
        return this;
    }

    public String getRealName() {
        return realName;
    }

    public UserProfileViewModel setRealName(String realName) {
        this.realName = realName;
        return this;
    }

    public String getEmail() {
        return email;
    }

    public UserProfileViewModel setEmail(String email) {
        this.email = email;
        return this;
    }

    public List<EventSimpleViewDTO> getUserEvents() {
        return userEvents;
    }

    public UserProfileViewModel setUserEvents(List<EventSimpleViewDTO> userEvents) {
        this.userEvents = userEvents;
        return this;
    }

    public int getOnlineStatus() {
        return onlineStatus;
    }

    public UserProfileViewModel setOnlineStatus(int onlineStatus) {
        this.onlineStatus = onlineStatus;
        return this;
    }

    public Instant getCreated() {
        return created;
    }

    public UserProfileViewModel setCreated(Instant created) {
        this.created = created;
        return this;
    }

    public int getUserOfferCount() {
        return userOfferCount;
    }

    public UserProfileViewModel setUserOfferCount(int userOfferCount) {
        this.userOfferCount = userOfferCount;
        return this;
    }

    public int getUserPublicationCount() {
        return userPublicationCount;
    }

    public void setUserPublicationCount(int userPublicationCount) {
        this.userPublicationCount = userPublicationCount;
    }

    public UserRole getRole() {
        return role;
    }

    public UserProfileViewModel setRole(UserRole role) {
        this.role = role;
        return this;
    }
}
