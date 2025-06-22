package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.enums.SubscriptionType;

import java.time.Instant;

@Entity
@Table(name = "email_subscriptions")
public class EmailSubscriptionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserEntity user; // Връзка с logged user

    @Column(name = "user_email", nullable = false)
    private String userEmail; // Email за лесно четене в таблицата

    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_type", nullable = false)
    private SubscriptionType type;

    @Column(name = "subscribed_at", nullable = false)
    private Instant subscribedAt;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "unsubscribe_token", unique = true)
    private String unsubscribeToken; // UUID за unsubscribe

    // Constructors
    public EmailSubscriptionEntity() {}

    public EmailSubscriptionEntity(UserEntity user, SubscriptionType type) {
        this.user = user;
        this.userEmail = user.getEmail(); // Автоматично задаване на email-а
        this.type = type;
        this.subscribedAt = Instant.now();
        this.isActive = true;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UserEntity getUser() {
        return user;
    }

    public void setUser(UserEntity user) {
        this.user = user;
        // Автоматично обновяване на email-а при промяна на user
        if (user != null) {
            this.userEmail = user.getEmail();
        }
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public SubscriptionType getType() {
        return type;
    }

    public void setType(SubscriptionType type) {
        this.type = type;
    }

    public Instant getSubscribedAt() {
        return subscribedAt;
    }

    public void setSubscribedAt(Instant subscribedAt) {
        this.subscribedAt = subscribedAt;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public String getUnsubscribeToken() {
        return unsubscribeToken;
    }

    public void setUnsubscribeToken(String unsubscribeToken) {
        this.unsubscribeToken = unsubscribeToken;
    }

    // Utility method за синхронизиране на email-а
    @PrePersist
    @PreUpdate
    public void syncEmail() {
        if (this.user != null) {
            this.userEmail = this.user.getEmail();
        }
    }

    @Override
    public String toString() {
        return "EmailSubscriptionEntity{" +
                "id=" + id +
                ", userEmail='" + userEmail + '\'' +
                ", type=" + type +
                ", isActive=" + isActive +
                ", subscribedAt=" + subscribedAt +
                '}';
    }
}