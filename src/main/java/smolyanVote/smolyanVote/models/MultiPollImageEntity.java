package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;

@Entity
@Table(name = "multi_poll_images")
public class MultiPollImageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "multi_poll_id")
    private MultiPollEntity multiPoll;

    public MultiPollImageEntity() {
    }

    public MultiPollImageEntity(Long id, String imageUrl, MultiPollEntity multiPoll) {
        this.id = id;
        this.imageUrl = imageUrl;
        this.multiPoll = multiPoll;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public MultiPollEntity getMultiPoll() {
        return multiPoll;
    }

    public void setMultiPoll(MultiPollEntity multiPoll) {
        this.multiPoll = multiPoll;
    }
}
