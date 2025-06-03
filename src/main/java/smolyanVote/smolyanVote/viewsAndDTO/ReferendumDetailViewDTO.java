package smolyanVote.smolyanVote.viewsAndDTO;

import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.models.CommentsEntity;

import java.time.Instant;
import java.util.List;

public class ReferendumDetailViewDTO {

    private Long id;
    private EventType eventType;
    private String title;
    private String description;
    private Locations location;
    private int viewCounter;
    private Instant createdAt;
    private UserEntity creator;
    private List<String> imageUrls;
    private List<String> options;
    private List<Integer> votes;
    private List<Integer> votePercentages;
    private int totalVotes;
    private Integer currentUserVote; // nullable, ако потребителят не е гласувал
    private List<CommentsEntity> comments;




    // Гетъри и сетъри


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

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }

    public List<Integer> getVotes() {
        return votes;
    }

    public void setVotes(List<Integer> votes) {
        this.votes = votes;
    }

    public List<Integer> getVotePercentages() {
        return votePercentages;
    }

    public void setVotePercentages(List<Integer> votePercentages) {
        this.votePercentages = votePercentages;
    }

    public int getTotalVotes() {
        return totalVotes;
    }

    public void setTotalVotes(int totalVotes) {
        this.totalVotes = totalVotes;
    }

    public Integer getCurrentUserVote() {
        return currentUserVote;
    }

    public void setCurrentUserVote(Integer currentUserVote) {
        this.currentUserVote = currentUserVote;
    }

    public List<CommentsEntity> getComments() {
        return comments;
    }

    public void setComments(List<CommentsEntity> comments) {
        this.comments = comments;
    }
}
