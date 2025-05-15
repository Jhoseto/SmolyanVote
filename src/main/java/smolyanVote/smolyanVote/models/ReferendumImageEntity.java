package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;

@Entity
@Table(name = "referendum_images")
public class ReferendumImageEntity extends BaseEventEntity {


    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referendum_id")
    private ReferendumEntity referendum;

    public ReferendumImageEntity() {
    }

    public ReferendumImageEntity(Long id, String imageUrl, ReferendumEntity referendum) {
        this.id = id;
        this.imageUrl = imageUrl;
        this.referendum = referendum;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public ReferendumEntity getReferendum() {
        return referendum;
    }

    public void setReferendum(ReferendumEntity event) {
        this.referendum = event;
    }
}
