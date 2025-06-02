package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.models.enums.Locations;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "multi_poll")
public class MultiPollEntity extends BaseEventEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private final EventType eventType = EventType.MULTI_POLL;

    private String title;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    private Locations location;

    private int viewCounter;
    private Instant createdAt;
    private String creatorName;

    @OneToMany(mappedBy = "multiPoll", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MultiPollImageEntity> images = new ArrayList<>();

    private String option1;
    private String option2;
    private String option3;
    private String option4;
    private String option5;
    private String option6;
    private String option7;
    private String option8;
    private String option9;
    private String option10;

    private int votes1 = 0;
    private int votes2 = 0;
    private int votes3 = 0;
    private int votes4 = 0;
    private int votes5 = 0;
    private int votes6 = 0;
    private int votes7 = 0;
    private int votes8 = 0;
    private int votes9 = 0;
    private int votes10 = 0;
    private int totalVotes = 0;

    // ---------- Getters & Setters ----------

    public EventType getEventType() {
        return eventType;
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

    public String getCreatorName() {
        return creatorName;
    }

    public void setCreatorName(String creatorName) {
        this.creatorName = creatorName;
    }

    public List<MultiPollImageEntity> getImages() {
        return images;
    }

    public void setImages(List<MultiPollImageEntity> images) {
        this.images = images;
    }

    public String getOption1() {
        return option1;
    }

    public void setOption1(String option1) {
        this.option1 = option1;
    }

    public String getOption2() {
        return option2;
    }

    public void setOption2(String option2) {
        this.option2 = option2;
    }

    public String getOption3() {
        return option3;
    }

    public void setOption3(String option3) {
        this.option3 = option3;
    }

    public String getOption4() {
        return option4;
    }

    public void setOption4(String option4) {
        this.option4 = option4;
    }

    public String getOption5() {
        return option5;
    }

    public void setOption5(String option5) {
        this.option5 = option5;
    }

    public String getOption6() {
        return option6;
    }

    public void setOption6(String option6) {
        this.option6 = option6;
    }

    public String getOption7() {
        return option7;
    }

    public void setOption7(String option7) {
        this.option7 = option7;
    }

    public String getOption8() {
        return option8;
    }

    public void setOption8(String option8) {
        this.option8 = option8;
    }

    public String getOption9() {
        return option9;
    }

    public void setOption9(String option9) {
        this.option9 = option9;
    }

    public String getOption10() {
        return option10;
    }

    public void setOption10(String option10) {
        this.option10 = option10;
    }

    public int getVotes1() {
        return votes1;
    }

    public void setVotes1(int votes1) {
        this.votes1 = votes1;
    }

    public int getVotes2() {
        return votes2;
    }

    public void setVotes2(int votes2) {
        this.votes2 = votes2;
    }

    public int getVotes3() {
        return votes3;
    }

    public void setVotes3(int votes3) {
        this.votes3 = votes3;
    }

    public int getVotes4() {
        return votes4;
    }

    public void setVotes4(int votes4) {
        this.votes4 = votes4;
    }

    public int getVotes5() {
        return votes5;
    }

    public void setVotes5(int votes5) {
        this.votes5 = votes5;
    }

    public int getVotes6() {
        return votes6;
    }

    public void setVotes6(int votes6) {
        this.votes6 = votes6;
    }

    public int getVotes7() {
        return votes7;
    }

    public void setVotes7(int votes7) {
        this.votes7 = votes7;
    }

    public int getVotes8() {
        return votes8;
    }

    public void setVotes8(int votes8) {
        this.votes8 = votes8;
    }

    public int getVotes9() {
        return votes9;
    }

    public void setVotes9(int votes9) {
        this.votes9 = votes9;
    }

    public int getVotes10() {
        return votes10;
    }

    public void setVotes10(int votes10) {
        this.votes10 = votes10;
    }

    public int getTotalVotes() {
        return totalVotes;
    }

    public void setTotalVotes(int totalVotes) {
        this.totalVotes = totalVotes;
    }

    // ---------- Utility methods for working with options and votes as lists ----------

    @Transient
    public List<String> getOptions() {
        List<String> opts = new ArrayList<>();
        opts.add(option1);
        opts.add(option2);
        opts.add(option3);
        opts.add(option4);
        opts.add(option5);
        opts.add(option6);
        opts.add(option7);
        opts.add(option8);
        opts.add(option9);
        opts.add(option10);
        return opts;
    }

    @Transient
    public List<Integer> getVotes() {
        List<Integer> v = new ArrayList<>();
        v.add(votes1);
        v.add(votes2);
        v.add(votes3);
        v.add(votes4);
        v.add(votes5);
        v.add(votes6);
        v.add(votes7);
        v.add(votes8);
        v.add(votes9);
        v.add(votes10);
        return v;
    }

    @Transient
    public void initializeVotes(int optionCount) {
        // Запълва първите optionCount стойности с 0, останалите също със 0, за да има винаги 10 елемента
        this.votes1 = 0;
        this.votes2 = 0;
        this.votes3 = 0;
        this.votes4 = 0;
        this.votes5 = 0;
        this.votes6 = 0;
        this.votes7 = 0;
        this.votes8 = 0;
        this.votes9 = 0;
        this.votes10 = 0;
        this.totalVotes = 0;
    }
}
