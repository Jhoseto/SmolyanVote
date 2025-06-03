package smolyanVote.smolyanVote.viewsAndDTO;

import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.models.enums.Locations;

import java.time.Instant;
import java.util.List;

public class SimpleEventDetailViewDTO {

    private Long id;
    private EventType eventType = EventType.SIMPLEEVENT;
    private String title;
    private String description;
    private Locations location;
    private int viewCounter;
    private Instant createdAt;
    private UserEntity creator;
    private List<String> images;
    private String currentUserVote;
    private int yesVotes;
    private int noVotes;
    private int neutralVotes;
    private int totalVotes;
    private String positiveLabel;
    private String negativeLabel;
    private String neutralLabel;
    private int yesPercent;
    private int noPercent;
    private int neutralPercent;




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

    public UserEntity getCreator() {
        return creator;
    }

    public void setCreator(UserEntity creator) {
        this.creator = creator;
    }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }

    public String getCurrentUserVote() {
        return currentUserVote;
    }

    public void setCurrentUserVote(String currentUserVote) {
        this.currentUserVote = currentUserVote;
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

    public String getPositiveLabel() {
        return positiveLabel;
    }

    public void setPositiveLabel(String positiveLabel) {
        this.positiveLabel = positiveLabel;
    }

    public String getNegativeLabel() {
        return negativeLabel;
    }

    public void setNegativeLabel(String negativeLabel) {
        this.negativeLabel = negativeLabel;
    }

    public String getNeutralLabel() {
        return neutralLabel;
    }

    public void setNeutralLabel(String neutralLabel) {
        this.neutralLabel = neutralLabel;
    }

    public int getYesPercent() {
        return yesPercent;
    }

    public void setYesPercent(int yesPercent) {
        this.yesPercent = yesPercent;
    }

    public int getNoPercent() {
        return noPercent;
    }

    public void setNoPercent(int noPercent) {
        this.noPercent = noPercent;
    }

    public int getNeutralPercent() {
        return neutralPercent;
    }

    public void setNeutralPercent(int neutralPercent) {
        this.neutralPercent = neutralPercent;
    }
}
