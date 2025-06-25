package smolyanVote.smolyanVote.viewsAndDTO;

import smolyanVote.smolyanVote.models.enums.EventStatus;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.models.enums.Locations;

import java.time.Instant;
import java.util.List;

public class EventSimpleViewDTO {

    private Long id;
    private EventType eventType;
    private EventStatus eventStatus;
    private String title;
    private String description;
    private Locations location;
    private int viewCounter;
    private Instant createdAt;
    private String creatorName;
    private String creatorImage;
    private int creatorOnlineStatus;
    private List<String> images;
    private int totalVotes;



    // Getters and setters


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }
    public EventType getEventType() {
        return eventType;
    }
    public void setEventType(EventType eventType) {
        this.eventType = eventType;
    }
    public EventStatus getEventStatus() {return eventStatus;}
    public void setEventStatus(EventStatus eventStatus) {this.eventStatus = eventStatus;}

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Locations getLocation() {
        return location;
    }

    public void setLocation(Locations location) {
        this.location = location;
    }

    public int getViewCounter() {
        return viewCounter;
    }

    public void setViewCounter(int viewCounter) {
        this.viewCounter = viewCounter;
    }

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

    public int getCreatorOnlineStatus() {
        return creatorOnlineStatus;
    }

    public void setCreatorOnlineStatus(int creatorOnlineStatus) {
        this.creatorOnlineStatus = creatorOnlineStatus;
    }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }

    public int getTotalVotes() {
        return totalVotes;
    }

    public void setTotalVotes(int totalVotes) {
        this.totalVotes = totalVotes;
    }
}
