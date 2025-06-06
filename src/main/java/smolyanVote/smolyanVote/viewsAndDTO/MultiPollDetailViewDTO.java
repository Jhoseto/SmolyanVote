package smolyanVote.smolyanVote.viewsAndDTO;

import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.models.enums.Locations;

import java.time.Instant;
import java.util.List;

public class MultiPollDetailViewDTO {

    private Long id;
    private EventType eventType;
    private String title;
    private String description;
    private Instant createdAt;
    private Locations location;
    private UserEntity creator;
    private List<String> imageUrls;
    private List<String> currentUserVotes;
    private List<String> optionsText;
    private List<Integer> votesForOptions; // брой гласове за всяка опция
    private List<Integer> votePercentages; // проценти за всяка опция
    private int totalVotes;
    private int totalUsersVotes; // Колко човека са гласували
    private Integer currentUserVote; // индекс на избраната опция (1-based)
    private int viewCounter;

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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Locations getLocation() {
        return location;
    }

    public void setLocation(Locations location) {
        this.location = location;
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

    public List<String> getCurrentUserVotes() {
        return currentUserVotes;
    }

    public void setCurrentUserVotes(List<String> currentUserVotes) {
        this.currentUserVotes = currentUserVotes;
    }

    public List<String> getOptionsText() {
        return optionsText;
    }

    public void setOptionsText(List<String> options) {
        this.optionsText = options;
    }

    public List<Integer> getVotesForOptions() {
        return votesForOptions;
    }

    public void setVotesForOptions(List<Integer> votesForOptions) {
        this.votesForOptions = votesForOptions;
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

    public int getTotalUsersVotes() {
        return totalUsersVotes;
    }

    public void setTotalUsersVotes(int totalUsersVotes) {
        this.totalUsersVotes = totalUsersVotes;
    }

    public Integer getCurrentUserVote() {
        return currentUserVote;
    }

    public void setCurrentUserVote(Integer currentUserVote) {
        this.currentUserVote = currentUserVote;
    }

    public int getViewCounter() {
        return viewCounter;
    }

    public void setViewCounter(int viewCounter) {
        this.viewCounter = viewCounter;
    }
}
