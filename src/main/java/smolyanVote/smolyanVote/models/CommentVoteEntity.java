package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.enums.CommentReactionType;

@Entity
@Table(name = "comment_votes", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"comment_id", "username"})
})
public class CommentVoteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "comment_id", nullable = false)
    private CommentsEntity comment;

    @Column(nullable = false)
    private String username;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CommentReactionType reaction; // LIKE or DISLIKE

    // Getters and setters

    public Long getId() { return id; }

    public void setId(Long id) { this.id = id; }

    public CommentsEntity getComment() { return comment; }

    public void setComment(CommentsEntity comment) { this.comment = comment; }

    public String getUsername() { return username; }

    public void setUsername(String username) { this.username = username; }

    public CommentReactionType getReaction() { return reaction; }

    public void setReaction(CommentReactionType reaction) { this.reaction = reaction; }
}
