package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.enums.Locations;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "events")
public class SimpleEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    private Locations location;

    private Instant createdAt;
    private String creatorName;
    private String creatorImage;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SimpleEventImageEntity> images = new ArrayList<>();

    private int yesVotes;
    private int noVotes;
    private int neutralVotes;
    private int totalVotes;

    private String positiveLabel;
    private String negativeLabel;
    private String neutralLabel;




    public List<SimpleEventImageEntity> getImages() {
        return images;
    }

    public void setImages(List<SimpleEventImageEntity> images) {
        this.images = images;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {this.description = description;}

    public Locations getLocation() {return location;}

    public void setLocation(Locations location) {this.location = location;}

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getCreatorName() {
        return creatorName;
    }

    public void setCreatorName(String creatorName) {
        this.creatorName = creatorName;
    }

    public String getCreatorImage() {
        return creatorImage;
    }

    public void setCreatorImage(String creatorImage) {
        this.creatorImage = creatorImage;
    }

    public int getYesVotes() {
        return yesVotes;
    }

    public void setYesVotes(int yesVotes) {
        this.yesVotes = yesVotes;
    }

    public int getNoVotes() {
        return noVotes;
    }

    public void setNoVotes(int noVotes) {
        this.noVotes = noVotes;
    }

    public int getNeutralVotes() {
        return neutralVotes;
    }

    public void setNeutralVotes(int neutralVotes) {
        this.neutralVotes = neutralVotes;
    }

    public int getTotalVotes() {
        return totalVotes;
    }

    public void setTotalVotes(int totalVotes) {
        this.totalVotes = totalVotes;
    }

    public String getPositiveLabel() {return positiveLabel;}

    public void setPositiveLabel(String positiveLabel) {this.positiveLabel = positiveLabel;}

    public String getNegativeLabel() {return negativeLabel;}

    public void setNegativeLabel(String negativeLabel) {this.negativeLabel = negativeLabel;}

    public String getNeutralLabel() {return neutralLabel;}

    public void setNeutralLabel(String neutralLabel) {this.neutralLabel = neutralLabel;}

}
