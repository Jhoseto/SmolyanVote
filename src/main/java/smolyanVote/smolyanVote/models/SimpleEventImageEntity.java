package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;

@Entity
@Table(name = "simple_event_images")
public class SimpleEventImageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private SimpleEventEntity event;

    public SimpleEventImageEntity() {
    }

    public SimpleEventImageEntity(String imageUrl, SimpleEventEntity event) {
        this.imageUrl = imageUrl;
        this.event = event;
    }

    public Long getId() {
        return id;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public SimpleEventEntity getEvent() {
        return event;
    }

    public void setEvent(SimpleEventEntity event) {
        this.event = event;
    }
}
