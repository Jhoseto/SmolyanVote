package smolyanVote.smolyanVote.controllers;

import smolyanVote.smolyanVote.models.PodcastEpisodeEntity;
import smolyanVote.smolyanVote.repositories.PodcastEpisodeRepository;
import smolyanVote.smolyanVote.services.interfaces.ImageCloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.viewsAndDTO.PodcastEpisodeDTO;

import java.time.Instant;
import java.util.List;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.stream.Collectors;

@Controller
public class PodcastController {

    private final PodcastEpisodeRepository podcastEpisodeRepository;
    private final ImageCloudinaryService imageCloudinaryService;

    @Autowired
    public PodcastController(PodcastEpisodeRepository podcastEpisodeRepository,
                             ImageCloudinaryService imageCloudinaryService) {
        this.podcastEpisodeRepository = podcastEpisodeRepository;
        this.imageCloudinaryService = imageCloudinaryService;
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


    @PostMapping("/admin/podcast/upload")
    @PreAuthorize("hasRole('ADMIN')")
    public String uploadPodcastEpisode(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("audioUrl") String audioUrl,
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile,
            @RequestParam(value = "duration", required = false) String duration,
            @RequestParam(value = "isPublished", defaultValue = "false") boolean isPublished,
            RedirectAttributes redirectAttributes) {

        try {
            PodcastEpisodeEntity episode = new PodcastEpisodeEntity();
            episode.setTitle(title);
            episode.setDescription(description);
            episode.setAudioUrl(audioUrl);

            long totalEpisodes = podcastEpisodeRepository.count();
            episode.setEpisodeNumber((int) totalEpisodes + 1);

            // Конвертиране на продължителността от мм:сс в секунди
            if (duration != null && !duration.isEmpty()) {
                try {
                    String[] parts = duration.split(":");
                    int minutes = Integer.parseInt(parts[0]);
                    int seconds = parts.length > 1 ? Integer.parseInt(parts[1]) : 0;
                    episode.setDurationSeconds(minutes * 60 + seconds);
                } catch (Exception e) {
                    // Ако има грешка в парсирането, просто игнорираме
                }
            }

            episode.setPublished(isPublished);
            episode.setPublishDate(Instant.now());
            episode.setListenCount(0L);

            // Първо записваме в базата за да получим ID
            episode = podcastEpisodeRepository.save(episode);

            // След това качваме изображението със знанието за ID-то
            if (imageFile != null && !imageFile.isEmpty()) {
                String imageUrl = imageCloudinaryService.savePodcastImage(imageFile, episode.getId());
                episode.setImageUrl(imageUrl);
                // Запазваме отново с URL-а на изображението
                podcastEpisodeRepository.save(episode);
            }

            redirectAttributes.addFlashAttribute("successMessage", "Епизодът е качен успешно!");

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Грешка при качване: " + e.getMessage());
        }

        return "redirect:/podcast";
    }
}