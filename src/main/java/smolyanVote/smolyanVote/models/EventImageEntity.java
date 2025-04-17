package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;

@Entity
@Table(name = "event_images")
public class EventImageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private EventEntity event;

    public EventImageEntity() {
    }

    public EventImageEntity(String imageUrl, EventEntity event) {
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

    public EventEntity getEvent() {
        return event;
    }

    public void setEvent(EventEntity event) {
        this.event = event;
    }
}
