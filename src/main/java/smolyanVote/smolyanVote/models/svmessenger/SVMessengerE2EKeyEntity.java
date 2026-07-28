package smolyanVote.smolyanVote.models.svmessenger;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import smolyanVote.smolyanVote.models.UserEntity;

import java.time.LocalDateTime;

/**
 * Публичен ECDH ключ за клиентска E2E криптация. Частният ключ никога не
 * напуска устройството на потребителя.
 */
@Entity
@Table(name = "sv_messenger_e2e_keys",
        uniqueConstraints = @UniqueConstraint(name = "uk_sv_e2e_user", columnNames = "user_id"))
@Getter
@Setter
@NoArgsConstructor
public class SVMessengerE2EKeyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    /** JSON JWK (EC P-256 public key). */
    @Column(name = "public_jwk", columnDefinition = "TEXT", nullable = false)
    private String publicJwk;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public SVMessengerE2EKeyEntity(UserEntity user, String publicJwk) {
        this.user = user;
        this.publicJwk = publicJwk;
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    @PreUpdate
    protected void touch() {
        updatedAt = LocalDateTime.now();
    }
}
