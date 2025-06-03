package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "multi_poll_votes", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "multi_poll_id", "option_text"})
})
public class VoteMultiPollEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "multi_poll_id")
    private MultiPollEntity multiPoll;

    @Column(name = "option_text", nullable = false)
    private String optionText; // Избраната опция (например "Yes", "Maybe")

    @Column(nullable = false)
    private Instant votedAt = Instant.now();

    // --- Getters и Setters ---

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
    }

    public MultiPollEntity getMultiPoll() {
        return multiPoll;
    }

    public void setMultiPoll(MultiPollEntity multiPoll) {
        this.multiPoll = multiPoll;
    }

    public String getOptionText() {
        return optionText;
    }

    public void setOptionText(String optionText) {
        this.optionText = optionText;
    }

    public Instant getVotedAt() {
        return votedAt;
    }

    public void setVotedAt(Instant votedAt) {
        this.votedAt = votedAt;
    }
}
