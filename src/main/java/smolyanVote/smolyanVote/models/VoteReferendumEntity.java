package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "referendum_votes", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "referendum_id"}) // Един потребител може да гласува само веднъж на събитие
})
public class VoteReferendumEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "referendum_id")
    private ReferendumEntity referendum;


    @Column(nullable = false)
    private Integer voteValue; // "1", "2", "3"

    private Instant votedAt = Instant.now();





    public Long getId() {return id;}

    public void setId(Long id) {this.id = id;}

    public UserEntity getUser() {return user;}

    public void setUser(UserEntity user) {this.user = user;}

    public ReferendumEntity getReferendum() {return referendum;}

    public void setReferendum(ReferendumEntity referendum) {this.referendum = referendum;}

    public Integer getVoteValue() {return voteValue;}

    public void setVoteValue(Integer voteValue) {this.voteValue = voteValue;}

    public Instant getVotedAt() {return votedAt;}

    public void setVotedAt(Instant votedAt) {this.votedAt = votedAt;}
}
