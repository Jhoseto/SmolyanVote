package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;
import lombok.Getter;

import java.time.Instant;

@Getter
@MappedSuperclass
public class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    protected Long id;

    @Column(nullable = false, columnDefinition = "TIMESTAMP")
    protected Instant created;

    @Column(nullable = false, columnDefinition = "TIMESTAMP")
    protected Instant modified;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        created = now;
        modified = now;
    }

    @PreUpdate
    protected void onUpdate() {
        modified = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Instant getCreated() {
        return created;
    }

    public void setCreated(Instant created) {
        this.created = created;
    }

    public Instant getModified() {
        return modified;
    }

    public void setModified(Instant modified) {
        this.modified = modified;
    }
}