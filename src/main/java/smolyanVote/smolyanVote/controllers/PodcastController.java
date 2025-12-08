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
import jakarta.servlet.http.HttpServletRequest;

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
    public String showPodcastPage(
            @RequestParam(required = false) Long episode,
            Model model) {

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
        
        // Ако има episode параметър, добавяме го за автоматично отваряне
        if (episode != null) {
            PodcastEpisodeEntity episodeEntity = podcastEpisodeRepository.findById(episode).orElse(null);
            if (episodeEntity != null && episodeEntity.getPublished()) {
                PodcastEpisodeDTO episodeDTO = new PodcastEpisodeDTO(episodeEntity);
                model.addAttribute("autoPlayEpisodeId", episode);
                model.addAttribute("autoPlayEpisode", episodeDTO);
            }
        }

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

    @GetMapping("/api/podcast/episodes")
    @ResponseBody
    public List<PodcastEpisodeDTO> getAllEpisodes() {
        List<PodcastEpisodeEntity> episodes = podcastEpisodeRepository.findAllByIsPublishedTrueOrderByPublishDateDesc();
        return episodes.stream()
                .map(PodcastEpisodeDTO::new)
                .collect(Collectors.toList());
    }

    @PostMapping("/api/podcast/episodes/{id}/increment-listen")
    @ResponseBody
    public PodcastEpisodeDTO incrementListenCount(@PathVariable Long id) {
        PodcastEpisodeEntity episode = podcastEpisodeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Епизодът не е намерен"));
        
        episode.setListenCount((episode.getListenCount() != null ? episode.getListenCount() : 0L) + 1);
        podcastEpisodeRepository.save(episode);
        
        return new PodcastEpisodeDTO(episode);
    }

    /**
     * Endpoint за споделяне на подкаст епизод във Facebook и други социални мрежи
     * Връща специален template с Open Graph meta tags за Facebook bot
     */
    @GetMapping("/podcast/episode/{id}")
    public String sharePodcastEpisode(
            @PathVariable Long id,
            Model model,
            HttpServletRequest request) {

        PodcastEpisodeEntity episode = podcastEpisodeRepository.findById(id)
                .orElse(null);

        if (episode == null || !episode.getPublished()) {
            return "redirect:/podcast";
        }

        String userAgent = request.getHeader("User-Agent");
        boolean isSocialBot = userAgent != null && (
                userAgent.contains("facebookexternalhit") ||
                userAgent.contains("Twitterbot") ||
                userAgent.contains("LinkedInBot") ||
                userAgent.contains("WhatsApp") ||
                userAgent.contains("TelegramBot")
        );

        if (isSocialBot) {
            // Подготвяме данни за Open Graph
            PodcastEpisodeDTO episodeDTO = new PodcastEpisodeDTO(episode);
            
            String ogTitle = episode.getTitle();
            if (ogTitle == null || ogTitle.trim().isEmpty()) {
                ogTitle = "Епизод " + episode.getEpisodeNumber() + " - SmolyanVote Подкаст";
            } else {
                ogTitle = ogTitle + " - SmolyanVote Подкаст";
            }

            String ogDescription = episode.getDescription();
            if (ogDescription != null && ogDescription.length() > 200) {
                ogDescription = ogDescription.substring(0, 200) + "...";
            }
            if (ogDescription == null || ogDescription.trim().isEmpty()) {
                ogDescription = "Слушайте епизод " + episode.getEpisodeNumber() + " от подкаста на SmolyanVote - истории, новини и разговори за Смолян.";
            }

            // Използваме точната снимка от епизода
            String ogImage = episode.getImageUrl();
            if (ogImage != null && !ogImage.trim().isEmpty()) {
                // Ако е относителен път, добавяме домейна
                if (ogImage.startsWith("/")) {
                    ogImage = "https://smolyanvote.com" + ogImage;
                }
                // Ако вече е пълен URL, използваме го директно
            } else {
                // Само ако няма снимка, използваме default
                ogImage = "https://smolyanvote.com/images/web/podcast1.png";
            }

            String ogUrl = "https://smolyanvote.com/podcast/episode/" + id;

            model.addAttribute("episode", episodeDTO);
            model.addAttribute("ogTitle", ogTitle);
            model.addAttribute("ogDescription", ogDescription);
            model.addAttribute("ogImage", ogImage);
            model.addAttribute("ogUrl", ogUrl);
            model.addAttribute("ogAudio", episode.getAudioUrl());

            return "podcast-episode-social";
        }

        // За нормални потребители - редирект към главната страница за подкасти
        return "redirect:/podcast";
    }
}