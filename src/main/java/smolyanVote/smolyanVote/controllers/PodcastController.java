package smolyanVote.smolyanVote.controllers;

import smolyanVote.smolyanVote.models.PodcastEpisodeEntity;
import smolyanVote.smolyanVote.repositories.PodcastEpisodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import smolyanVote.smolyanVote.viewsAndDTO.PodcastEpisodeDTO;

import java.util.List;
import java.util.stream.Collectors;

@Controller
public class PodcastController {


    private final PodcastEpisodeRepository podcastEpisodeRepository;

    @Autowired
    public PodcastController(PodcastEpisodeRepository podcastEpisodeRepository) {
        this.podcastEpisodeRepository = podcastEpisodeRepository;
    }

    @GetMapping("/podcast")
    public String showPodcastPage(Model model) {

        List<PodcastEpisodeEntity> episodes = podcastEpisodeRepository.findAllByIsPublishedTrueOrderByPublishDateDesc();

        List<PodcastEpisodeDTO> episodeDTOs = episodes.stream()
                .map(PodcastEpisodeDTO::new)
                .collect(Collectors.toList());

        // Статистики
        Long totalListens = podcastEpisodeRepository.getTotalListens();
        Long episodeCount = podcastEpisodeRepository.countByIsPublishedTrue();

        model.addAttribute("episodes", episodeDTOs);
        model.addAttribute("totalListens", totalListens != null ? totalListens : 0);
        model.addAttribute("episodeCount", episodeCount != null ? episodeCount : 0);

        // SEO
        model.addAttribute("pageTitle", "Подкаст SmolyanVote - Гласът на Смолян");
        model.addAttribute("pageDescription", "Слушайте подкаста на SmolyanVote - истории, новини и разговори за нашия град");

        return "podcast";
    }



    @GetMapping("/podcast/search")
    public String searchEpisodes(@RequestParam("q") String searchTerm, Model model) {

        List<PodcastEpisodeEntity> episodes = podcastEpisodeRepository.searchEpisodes(searchTerm);

        List<PodcastEpisodeDTO> episodeDTOs = episodes.stream()
                .map(PodcastEpisodeDTO::new)
                .collect(Collectors.toList());

        model.addAttribute("episodes", episodeDTOs);
        model.addAttribute("searchTerm", searchTerm);
        model.addAttribute("episodeCount", (long) episodes.size());

        return "podcast";
    }



    @GetMapping("/podcast/sort")
    public String sortEpisodes(@RequestParam("sortBy") String sortBy, Model model) {

        List<PodcastEpisodeEntity> episodes;

        switch (sortBy) {
            case "oldest":
                episodes = podcastEpisodeRepository.findAllByIsPublishedTrueOrderByPublishDateDesc();
                // Reverse order for oldest first
                episodes = episodes.stream()
                        .sorted((e1, e2) -> e1.getPublishDate().compareTo(e2.getPublishDate()))
                        .collect(Collectors.toList());
                break;
            case "duration_desc":
                episodes = podcastEpisodeRepository.findAllByIsPublishedTrueOrderByDurationSecondsDesc();
                break;
            case "duration_asc":
                episodes = podcastEpisodeRepository.findAllByIsPublishedTrueOrderByDurationSecondsAsc();
                break;
            case "newest":
            default:
                episodes = podcastEpisodeRepository.findAllByIsPublishedTrueOrderByPublishDateDesc();
                break;
        }

        List<PodcastEpisodeDTO> episodeDTOs = episodes.stream()
                .map(PodcastEpisodeDTO::new)
                .collect(Collectors.toList());

        model.addAttribute("episodes", episodeDTOs);
        model.addAttribute("sortBy", sortBy);
        model.addAttribute("episodeCount", (long) episodes.size());

        return "podcast";
    }
}