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

    @Version
    protected Long version;

    @Column(nullable = false, columnDefinition = "TIMESTAMP")
    protected Instant created;

    @Column(nullable = false, columnDefinition = "TIMESTAMP")
    protected Instant modified;




    public long getId() {
        return id;
    }

    public void setId(long id) {this.id = id;
    }

    //Оправлява конкурентноста при гласувания
    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
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
