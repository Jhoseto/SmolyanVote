package smolyanVote.smolyanVote.services.serviceImpl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.PodcastEpisodeEntity;
import smolyanVote.smolyanVote.repositories.PodcastEpisodeRepository;
import smolyanVote.smolyanVote.services.interfaces.ImageCloudinaryService;
import smolyanVote.smolyanVote.services.interfaces.PodcastService;

import java.time.Instant;

@Service
public class PodcastServiceImpl implements PodcastService {

    private static final Logger log = LoggerFactory.getLogger(PodcastServiceImpl.class);

    private final PodcastEpisodeRepository podcastEpisodeRepository;
    private final ImageCloudinaryService imageCloudinaryService;

    public PodcastServiceImpl(PodcastEpisodeRepository podcastEpisodeRepository,
                               ImageCloudinaryService imageCloudinaryService) {
        this.podcastEpisodeRepository = podcastEpisodeRepository;
        this.imageCloudinaryService = imageCloudinaryService;
    }

    @Override
    @Transactional
    public PodcastEpisodeEntity createEpisode(String title, String description, MultipartFile audioFile,
                                               String audioUrl, MultipartFile imageFile, Integer durationSeconds,
                                               boolean published) {

        boolean hasFile = audioFile != null && !audioFile.isEmpty();
        boolean hasUrl = audioUrl != null && !audioUrl.isBlank();
        if (!hasFile && !hasUrl) {
            throw new IllegalArgumentException("Качете аудио файл или въведете линк към аудиото.");
        }

        PodcastEpisodeEntity episode = new PodcastEpisodeEntity();
        episode.setTitle(title);
        episode.setDescription(description);
        episode.setDurationSeconds(durationSeconds);
        episode.setPublished(published);
        episode.setPublishDate(Instant.now());
        episode.setListenCount(0L);
        episode.setEpisodeNumber((int) podcastEpisodeRepository.count() + 1);

        // Legacy admin flow: external audio URL only — save once, optional cover upload.
        if (hasUrl) {
            episode.setAudioUrl(audioUrl.trim());
            podcastEpisodeRepository.save(episode);
            try {
                uploadCoverIfPresent(imageFile, episode);
            } catch (RuntimeException coverEx) {
                log.warn("Podcast cover upload failed for episode {}: {}", episode.getId(), coverEx.getMessage());
            }
            return episode;
        }

        // New flow: audio file → Cloudinary (needs episode id for folder path).
        episode.setAudioUrl("");
        podcastEpisodeRepository.save(episode);

        try {
            String uploadedAudioUrl = imageCloudinaryService.savePodcastAudio(audioFile, episode.getId());
            episode.setAudioUrl(uploadedAudioUrl);
            uploadCoverIfPresent(imageFile, episode);
            return podcastEpisodeRepository.save(episode);
        } catch (RuntimeException e) {
            podcastEpisodeRepository.delete(episode);
            throw e;
        }
    }

    private void uploadCoverIfPresent(MultipartFile imageFile, PodcastEpisodeEntity episode) {
        if (imageFile == null || imageFile.isEmpty()) {
            return;
        }
        String imageUrl = imageCloudinaryService.savePodcastImage(imageFile, episode.getId());
        episode.setImageUrl(imageUrl);
        podcastEpisodeRepository.save(episode);
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<PodcastEpisodeEntity> listAllEpisodesAdmin() {
        return podcastEpisodeRepository.findAllByOrderByPublishDateDesc();
    }

    @Override
    @Transactional
    public PodcastEpisodeEntity updateEpisode(Long id, String title, String description, String audioUrl,
                                              Integer durationSeconds, Boolean published, MultipartFile imageFile) {
        PodcastEpisodeEntity episode = podcastEpisodeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Епизодът не е намерен"));
        if (title != null && !title.isBlank()) {
            episode.setTitle(title.trim());
        }
        if (description != null) {
            episode.setDescription(description.trim());
        }
        if (audioUrl != null && !audioUrl.isBlank()) {
            episode.setAudioUrl(audioUrl.trim());
        }
        if (durationSeconds != null) {
            episode.setDurationSeconds(durationSeconds);
        }
        if (published != null) {
            episode.setPublished(published);
            if (published && episode.getPublishDate() == null) {
                episode.setPublishDate(Instant.now());
            }
        }
        if (imageFile != null && !imageFile.isEmpty()) {
            if (episode.getImageUrl() != null && !episode.getImageUrl().isBlank()) {
                try {
                    imageCloudinaryService.deleteImage(episode.getImageUrl());
                } catch (RuntimeException ignored) {
                    // keep update going if old asset cleanup fails
                }
            }
            String imageUrl = imageCloudinaryService.savePodcastImage(imageFile, episode.getId());
            episode.setImageUrl(imageUrl);
        }
        return podcastEpisodeRepository.save(episode);
    }

    @Override
    @Transactional
    public void deleteEpisode(Long id) {
        PodcastEpisodeEntity episode = podcastEpisodeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Епизодът не е намерен"));
        if (episode.getImageUrl() != null && !episode.getImageUrl().isBlank()) {
            try {
                imageCloudinaryService.deleteImage(episode.getImageUrl());
            } catch (RuntimeException ignored) {
            }
        }
        if (episode.getAudioUrl() != null && !episode.getAudioUrl().isBlank()) {
            try {
                imageCloudinaryService.deleteImage(episode.getAudioUrl());
            } catch (RuntimeException ignored) {
            }
        }
        try {
            imageCloudinaryService.deleteFolder("smolyanVote/podcasts/episode_" + id);
        } catch (RuntimeException ignored) {
        }
        podcastEpisodeRepository.delete(episode);
    }
}
