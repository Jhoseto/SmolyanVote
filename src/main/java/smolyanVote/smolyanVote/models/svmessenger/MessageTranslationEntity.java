package smolyanVote.smolyanVote.models.svmessenger;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import smolyanVote.smolyanVote.models.UserEntity;

import java.time.LocalDateTime;

@Entity
@Table(name = "message_translations", uniqueConstraints = {
        @UniqueConstraint(name = "uk_message_user_language", columnNames = { "message_id", "user_id",
                "target_language" })
}, indexes = {
        @Index(name = "idx_translation_message_user", columnList = "message_id, user_id")
})
@Getter
@Setter
@NoArgsConstructor
public class MessageTranslationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private SVMessageEntity message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "target_language", length = 10, nullable = false)
    private String targetLanguage;

    @Column(name = "translated_text", columnDefinition = "TEXT", nullable = false)
    private String translatedText;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public MessageTranslationEntity(SVMessageEntity message, UserEntity user, String targetLanguage,
            String translatedText) {
        this.message = message;
        this.user = user;
        this.targetLanguage = targetLanguage;
        this.translatedText = translatedText;
        this.createdAt = LocalDateTime.now();
    }
}
