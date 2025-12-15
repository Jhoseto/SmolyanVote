package smolyanVote.smolyanVote.models.mobile;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import smolyanVote.smolyanVote.models.BaseEntity;
import smolyanVote.smolyanVote.models.UserEntity;

import java.time.Instant;

/**
 * Entity за mobile device tokens (FCM/APNs)
 * За push notifications
 */
@Entity
@Table(name = "mobile_device_tokens", indexes = {
        @Index(name = "idx_mobile_device_user", columnList = "user_id"),
        @Index(name = "idx_mobile_device_token", columnList = "device_token"),
        @Index(name = "idx_mobile_device_platform", columnList = "platform")
})
@Getter
@Setter
@NoArgsConstructor
public class MobileDeviceTokenEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "device_token", nullable = false, length = 500)
    private String deviceToken;

    @Column(name = "platform", nullable = false, length = 20)
    private String platform; // "ios" или "android"

    @Column(name = "device_id", length = 255)
    private String deviceId; // Unique device identifier

    @Column(name = "app_version", length = 50)
    private String appVersion;

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @PrePersist
    protected void onCreate() {
        super.onCreate();
        if (lastUsedAt == null) {
            lastUsedAt = Instant.now();
        }
        if (isActive == null) {
            isActive = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        super.onUpdate();
        lastUsedAt = Instant.now();
    }

    public MobileDeviceTokenEntity(UserEntity user, String deviceToken, String platform) {
        this.user = user;
        this.deviceToken = deviceToken;
        this.platform = platform;
        this.isActive = true;
        this.lastUsedAt = Instant.now();
    }
}

