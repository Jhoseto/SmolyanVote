package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class CommentsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String author;

    @Column(length = 2000)
    private String text;

    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "event_id")
    private EventEntity event;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    private CommentsEntity parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    private List<CommentsEntity> replies = new ArrayList<>();




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

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public EventEntity getEvent() {
        return event;
    }

    public void setEvent(EventEntity event) {
        this.event = event;
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
}
