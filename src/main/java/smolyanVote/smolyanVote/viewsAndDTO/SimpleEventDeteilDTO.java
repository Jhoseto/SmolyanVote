package smolyanVote.smolyanVote.viewsAndDTO;

import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.models.enums.Locations;

import java.time.Instant;
import java.util.List;

public class
SimpleEventDeteilDTO {

    private Long id;
    private EventType eventType;
    private String title;
    private String description;

    private Locations location;
    private int viewCounter;
    private String creatorName;
    private String creatorImage;
    private List<String> imageUrls; // 🔁 Списък с до 3 линка към снимки
    private Instant createdAt;
    private int yesVotes;
    private int noVotes;
    private int neutralVotes;
    private int totalVotes;
    private int yesPercent;
    private int noPercent;
    private int neutralPercent;
    private int creatorOnline;
    private String positiveLabel;
    private String negativeLabel;
    private String neutralLabel;





    // --- Гетъри и сетъри ---
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public EventType getEventType() {return eventType;}

    public void setEventType(EventType eventType) {this.eventType = eventType;}

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public Locations getLocation() {return location;}

    public void setLocation(Locations location) {this.location = location;}

    public int getViewCounter() {return viewCounter;}

    public void setViewCounter(int viewCounter) {this.viewCounter = viewCounter;}

    public void setDescription(String description) {
        this.description = description;
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

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
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

    public void setTotalVotes(int totalVotes) {
        this.totalVotes = totalVotes;
    }

    public int getTotalVotes() {
        return totalVotes;
    }

    public int getYesPercent() {return yesPercent;}

    public void setYesPercent(int yesPercent) {this.yesPercent = yesPercent;}

    public int getNoPercent() {return noPercent;}

    public void setNoPercent(int noPercent) {this.noPercent = noPercent;}

    public int getNeutralPercent() {return neutralPercent;}

    public void setNeutralPercent(int neutralPercent) {this.neutralPercent = neutralPercent;}

    public int getCreatorOnline() {return creatorOnline;}

    public void setCreatorOnline(int creatorOnline) {this.creatorOnline = creatorOnline;}

    public String getPositiveLabel() {return positiveLabel;}

    public void setPositiveLabel(String positiveLabel) {this.positiveLabel = positiveLabel;}

    public String getNegativeLabel() {return negativeLabel;}

    public void setNegativeLabel(String negativeLabel) {this.negativeLabel = negativeLabel;}

    public String getNeutralLabel() {return neutralLabel;}

    public void setNeutralLabel(String neutralLabel) {this.neutralLabel = neutralLabel;}


}
