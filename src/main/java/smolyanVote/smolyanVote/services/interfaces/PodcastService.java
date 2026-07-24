package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.PodcastEpisodeEntity;

public interface PodcastService {

    /**
     * Creates and publishes a new podcast episode. The audio file is required;
     * the cover image is optional (falls back to the default artwork).
     */
    PodcastEpisodeEntity createEpisode(String title, String description, MultipartFile audioFile,
                                        String audioUrl, MultipartFile imageFile, Integer durationSeconds,
                                        boolean published);

    java.util.List<PodcastEpisodeEntity> listAllEpisodesAdmin();

    PodcastEpisodeEntity updateEpisode(Long id, String title, String description, String audioUrl,
                                       Integer durationSeconds, Boolean published, MultipartFile imageFile);

    void deleteEpisode(Long id);
}
