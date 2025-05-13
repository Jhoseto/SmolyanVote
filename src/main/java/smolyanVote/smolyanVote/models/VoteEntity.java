package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "votes", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "event_id"}) // Един потребител може да гласува само веднъж на събитие
})
public class VoteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private UserEntity user;

    @ManyToOne(optional = false)
    private SimpleEventEntity event;

    @Column(nullable = false)
    private String voteValue; // "1", "2", "3"

    private Instant votedAt = Instant.now();





    public Long getId() {return id;}

    public void setId(Long id) {this.id = id;}

    public UserEntity getUser() {return user;}

    public void setUser(UserEntity user) {this.user = user;}

    public SimpleEventEntity getEvent() {return event;}

    public void setEvent(SimpleEventEntity event) {this.event = event;}

    public String getVoteValue() {return voteValue;}

    public void setVoteValue(String voteValue) {this.voteValue = voteValue;}

    public Instant getVotedAt() {return votedAt;}

    public void setVotedAt(Instant votedAt) {this.votedAt = votedAt;}
}
