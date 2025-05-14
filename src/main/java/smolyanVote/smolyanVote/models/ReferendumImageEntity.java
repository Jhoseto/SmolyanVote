package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;

@Entity
@Table(name = "referendum_images")
public class ReferendumImageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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

    public ReferendumEntity getReferendum() {
        return referendum;
    }

    public void setReferendum(ReferendumEntity event) {
        this.referendum = event;
    }
}
