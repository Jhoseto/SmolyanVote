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


//    //Оправлява конкурентноста при гласувания
//    @Version
//    protected long version;

    @Column(nullable = false, columnDefinition = "TIMESTAMP")
    protected Instant created;

    @Column(nullable = false, columnDefinition = "TIMESTAMP")
    protected Instant modified;


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
