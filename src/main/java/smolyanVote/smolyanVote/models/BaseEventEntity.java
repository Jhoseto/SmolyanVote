package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;
import lombok.Getter;

import java.time.Instant;


@Getter
@MappedSuperclass
public class BaseEventEntity {


    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    protected Long id;

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }


}
