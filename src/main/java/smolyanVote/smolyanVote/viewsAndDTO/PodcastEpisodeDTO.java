package smolyanVote.smolyanVote.viewsAndDTO;

import smolyanVote.smolyanVote.models.PodcastEpisodeEntity;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public class PodcastEpisodeDTO {

    private Long id;
    private String title;
    private String description;
    private String audioUrl;
    private String imageUrl;
    private Instant publishDate;
    private String formattedPublishDate;
    private Integer durationSeconds;
    private String formattedDuration;
    private Integer episodeNumber;
    private Long listenCount;

    // Constructors
    public PodcastEpisodeDTO() {}

    public PodcastEpisodeDTO(PodcastEpisodeEntity episode) {
        this.id = episode.getId();
        this.title = episode.getTitle();
        this.description = episode.getDescription();
        this.audioUrl = episode.getAudioUrl();
        this.imageUrl = episode.getImageUrl();
        this.publishDate = episode.getPublishDate();
        this.durationSeconds = episode.getDurationSeconds();
        this.episodeNumber = episode.getEpisodeNumber();
        this.listenCount = episode.getListenCount();

        // Format date and duration
        this.formattedPublishDate = formatPublishDate();
        this.formattedDuration = formatDuration();
    }

    // Helper methods
    private String formatPublishDate() {
        if (publishDate == null) return "";

        // Convert Instant to LocalDateTime with Sofia timezone
        LocalDateTime localDateTime = LocalDateTime.ofInstant(publishDate, ZoneId.of("Europe/Sofia"));
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMMM yyyy", new Locale("bg", "BG"));
        return localDateTime.format(formatter);
    }

    private String formatDuration() {
        if (durationSeconds == null || durationSeconds <= 0) return "0:00";

        int minutes = durationSeconds / 60;
        int seconds = durationSeconds % 60;
        return String.format("%d:%02d", minutes, seconds);
    }

    // Getters and Setters
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

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAudioUrl() {
        return audioUrl;
    }

    public void setAudioUrl(String audioUrl) {
        this.audioUrl = audioUrl;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Instant getPublishDate() {
        return publishDate;
    }

    public void setPublishDate(Instant publishDate) {
        this.publishDate = publishDate;
        this.formattedPublishDate = formatPublishDate();
    }

    public String getFormattedPublishDate() {
        return formattedPublishDate;
    }

    public Integer getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(Integer durationSeconds) {
        this.durationSeconds = durationSeconds;
        this.formattedDuration = formatDuration();
    }

    public String getFormattedDuration() {
        return formattedDuration;
    }

    public Integer getEpisodeNumber() {
        return episodeNumber;
    }

    public void setEpisodeNumber(Integer episodeNumber) {
        this.episodeNumber = episodeNumber;
    }

    public Long getListenCount() {
        return listenCount;
    }

    public void setListenCount(Long listenCount) {
        this.listenCount = listenCount;
    }

    // Default image if no image provided
    public String getImageUrlOrDefault() {
        if (imageUrl != null && !imageUrl.isEmpty()) {
            return imageUrl;
        }
        // ПОПРАВЕНО - използва локален файл вместо external service
        return "/images/podcast-default.jpg";
    }
}