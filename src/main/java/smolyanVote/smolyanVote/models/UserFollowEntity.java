package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity за user following relationships
 * Оптимизирано за високи performance заявки
 */
@Entity
@Table(name = "user_follows")
public class UserFollowEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    /**
     * Потребителят който следва (follower)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follower_id", nullable = false, foreignKey = @ForeignKey(name = "fk_follow_follower"))
    private UserEntity follower;

    /**
     * Потребителят когото следват (being followed)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "following_id", nullable = false, foreignKey = @ForeignKey(name = "fk_follow_following"))
    private UserEntity following;

    /**
     * Кога е започнато следването
     */
    @Column(name = "followed_at", nullable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime followedAt;

    // ===== CONSTRUCTORS =====

    public UserFollowEntity() {
        this.followedAt = LocalDateTime.now();
    }

    public UserFollowEntity(UserEntity follower, UserEntity following) {
        this();
        this.follower = follower;
        this.following = following;
    }

    // ===== GETTERS AND SETTERS =====

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UserEntity getFollower() {
        return follower;
    }

    public void setFollower(UserEntity follower) {
        this.follower = follower;
    }

    public UserEntity getFollowing() {
        return following;
    }

    public void setFollowing(UserEntity following) {
        this.following = following;
    }

    public LocalDateTime getFollowedAt() {
        return followedAt;
    }

    public void setFollowedAt(LocalDateTime followedAt) {
        this.followedAt = followedAt;
    }

    // ===== UTILITY METHODS =====

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserFollowEntity that = (UserFollowEntity) o;
        return follower.getId().equals(that.follower.getId()) &&
                following.getId().equals(that.following.getId());
    }

    @Override
    public int hashCode() {
        return follower.getId().hashCode() + following.getId().hashCode();
    }

    @Override
    public String toString() {
        return "UserFollowEntity{" +
                "id=" + id +
                ", followerId=" + (follower != null ? follower.getId() : null) +
                ", followingId=" + (following != null ? following.getId() : null) +
                ", followedAt=" + followedAt +
                '}';
    }
}