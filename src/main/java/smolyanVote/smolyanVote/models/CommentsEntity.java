package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
public class CommentsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String author;
    @Column(length = 1000)
    private String authorImage;

    @Column(length = 2000)
    @NotBlank
    private String text;

    private Instant createdAt;

    @OneToMany(mappedBy = "comment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CommentVoteEntity> votes = new ArrayList<>();


    @Column(name = "is_edited")
    private boolean edited;

    @ManyToOne
    @JoinColumn(name = "event_id", nullable = true)
    private SimpleEventEntity event;

    @ManyToOne
    @JoinColumn(name = "referendum_id", nullable = true)
    private ReferendumEntity referendum;

    @ManyToOne
    @JoinColumn(name = "multi_poll_id", nullable = true)
    private MultiPollEntity multiPoll;

    @ManyToOne
    @JoinColumn(name = "publication_id", nullable = true)
    private PublicationEntity publication;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    private CommentsEntity parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    private List<CommentsEntity> replies = new ArrayList<>();

    private int likeCount;

    private int unlikeCount;




    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public String getAuthorImage() {
        return authorImage;
    }

    public void setAuthorImage(String authorImage) {
        this.authorImage = authorImage;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isEdited() {return edited;}

    public void setEdited(boolean edited) {this.edited = edited;}

    public SimpleEventEntity getEvent() {
        return event;
    }

    public void setEvent(SimpleEventEntity event) {
        this.event = event;
    }

    public ReferendumEntity getReferendum() {return referendum;}

    public void setReferendum(ReferendumEntity referendum) {this.referendum = referendum;}

    public List<CommentVoteEntity> getVotes() {return votes;}

    public void setVotes(List<CommentVoteEntity> votes) {this.votes = votes;}

    public MultiPollEntity getMultiPoll() {
        return multiPoll;
    }

    public void setMultiPoll(MultiPollEntity multiPoll) {
        this.multiPoll = multiPoll;
    }

    public PublicationEntity getPublication() {
        return publication;
    }

    public void setPublication(PublicationEntity publication) {
        this.publication = publication;
    }

    public CommentsEntity getParent() {
        return parent;
    }

    public void setParent(CommentsEntity parent) {
        this.parent = parent;
    }

    public List<CommentsEntity> getReplies() {
        return replies;
    }

    public void setReplies(List<CommentsEntity> replies) {
        this.replies = replies;
    }

    public int getLikeCount() {
        return likeCount;
    }

    public void setLikeCount(int likeCount) {
        this.likeCount = likeCount;
    }

    public int getUnlikeCount() {
        return unlikeCount;
    }

    public void setUnlikeCount(int unlikeCount) {
        this.unlikeCount = unlikeCount;
    }
}
