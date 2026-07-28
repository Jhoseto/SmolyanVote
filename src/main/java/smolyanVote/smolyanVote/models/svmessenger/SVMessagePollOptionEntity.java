package smolyanVote.smolyanVote.models.svmessenger;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Един избор в бърза анкета, изпратена в разговор. */
@Entity
@Table(name = "sv_message_poll_options",
        indexes = @Index(name = "idx_sv_poll_option_message", columnList = "message_id"))
@Getter
@Setter
@NoArgsConstructor
public class SVMessagePollOptionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private SVMessageEntity message;

    @Column(name = "option_text", length = 120, nullable = false)
    private String optionText;

    @Column(name = "position", nullable = false)
    private Integer position;

    public SVMessagePollOptionEntity(SVMessageEntity message, String optionText, int position) {
        this.message = message;
        this.optionText = optionText;
        this.position = position;
    }
}
