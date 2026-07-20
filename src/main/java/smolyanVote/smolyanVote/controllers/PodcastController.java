package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import smolyanVote.smolyanVote.models.PodcastEpisodeEntity;
import smolyanVote.smolyanVote.repositories.PodcastEpisodeRepository;
import smolyanVote.smolyanVote.viewsAndDTO.PodcastEpisodeDTO;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Podcast JSON API. Page UI + OG share HTML live in Next.js.
 */
@RestController
public class PodcastController {

    private final PodcastEpisodeRepository podcastEpisodeRepository;

    @Autowired
    public PodcastController(PodcastEpisodeRepository podcastEpisodeRepository) {
        this.podcastEpisodeRepository = podcastEpisodeRepository;
    }

    @GetMapping("/api/podcast/episodes")
    public List<PodcastEpisodeDTO> getAllEpisodes() {
        List<PodcastEpisodeEntity> episodes =
                podcastEpisodeRepository.findAllByIsPublishedTrueOrderByPublishDateDesc();
        return episodes.stream()
                .map(PodcastEpisodeDTO::new)
                .collect(Collectors.toList());
    }

    @PostMapping("/api/podcast/episodes/{id}/increment-listen")
    public PodcastEpisodeDTO incrementListenCount(@PathVariable Long id) {
        PodcastEpisodeEntity episode = podcastEpisodeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Епизодът не е намерен"));

        episode.setListenCount((episode.getListenCount() != null ? episode.getListenCount() : 0L) + 1);
        podcastEpisodeRepository.save(episode);

        return new PodcastEpisodeDTO(episode);
    }
}
