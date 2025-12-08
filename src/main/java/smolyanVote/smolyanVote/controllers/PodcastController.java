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

        Long totalListens = podcastEpisodeRepository.getTotalListens();
        Long episodeCount = podcastEpisodeRepository.countByIsPublishedTrue();

        model.addAttribute("episodes", episodeDTOs);
        model.addAttribute("totalListens", totalListens != null ? totalListens : 0);
        model.addAttribute("episodeCount", episodeCount != null ? episodeCount : 0);
        
        if (episode != null) {
            PodcastEpisodeEntity episodeEntity = podcastEpisodeRepository.findById(episode).orElse(null);
            if (episodeEntity != null && episodeEntity.getPublished()) {
                PodcastEpisodeDTO episodeDTO = new PodcastEpisodeDTO(episodeEntity);
                model.addAttribute("autoPlayEpisodeId", episode);
                model.addAttribute("autoPlayEpisode", episodeDTO);
            }
        }

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

            if (duration != null && !duration.isEmpty()) {
                try {
                    String[] parts = duration.split(":");
                    int minutes = Integer.parseInt(parts[0]);
                    int seconds = parts.length > 1 ? Integer.parseInt(parts[1]) : 0;
                    episode.setDurationSeconds(minutes * 60 + seconds);
                } catch (Exception e) {
                }
            }

            episode.setPublished(isPublished);
            episode.setPublishDate(Instant.now());
            episode.setListenCount(0L);

            episode = podcastEpisodeRepository.save(episode);

            if (imageFile != null && !imageFile.isEmpty()) {
                String imageUrl = imageCloudinaryService.savePodcastImage(imageFile, episode.getId());
                episode.setImageUrl(imageUrl);
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

    @GetMapping("/podcast/episode/{id}")
    public String sharePodcastEpisode(
            @PathVariable Long id,
            Model model,
            HttpServletRequest request) {
        
        try {
            if (id == null || id <= 0) {
                return "redirect:/podcast";
            }

            PodcastEpisodeEntity episode = podcastEpisodeRepository.findById(id)
                    .orElse(null);

            if (episode == null) {
                return "redirect:/podcast";
            }

            if (episode.getPublished() == null || !episode.getPublished()) {
                return "redirect:/podcast";
            }

            String userAgent = request.getHeader("User-Agent");
            boolean isSocialBot = userAgent != null && (
                    userAgent.toLowerCase().contains("facebookexternalhit") ||
                    userAgent.toLowerCase().contains("facebot") ||
                    userAgent.toLowerCase().contains("facebookcrawler") ||
                    userAgent.toLowerCase().contains("twitterbot") ||
                    userAgent.toLowerCase().contains("linkedinbot") ||
                    userAgent.toLowerCase().contains("whatsapp") ||
                    userAgent.toLowerCase().contains("telegrambot") ||
                    userAgent.toLowerCase().contains("slackbot") ||
                    userAgent.toLowerCase().contains("skypeuripreview")
            );

            PodcastEpisodeDTO episodeDTO = new PodcastEpisodeDTO(episode);
            
            String ogTitle = episode.getTitle();
            if (ogTitle == null || ogTitle.trim().isEmpty()) {
                Integer episodeNum = episode.getEpisodeNumber();
                ogTitle = "Епизод " + (episodeNum != null ? episodeNum : "") + " - SmolyanVote Подкаст";
            }

            String ogDescription = episode.getDescription();
            if (ogDescription != null && ogDescription.length() > 200) {
                ogDescription = ogDescription.substring(0, 200) + "...";
            }
            if (ogDescription == null || ogDescription.trim().isEmpty()) {
                Integer episodeNum = episode.getEpisodeNumber();
                ogDescription = "Слушайте епизод " + (episodeNum != null ? episodeNum : "") + " от подкаста на SmolyanVote - истории, новини и разговори за Смолян.";
            }

            String ogImage = episode.getImageUrl();
            
            if (ogImage == null || ogImage.trim().isEmpty()) {
                ogImage = episodeDTO.getImageUrl();
            }
            
            if (ogImage != null && !ogImage.trim().isEmpty()) {
                ogImage = ogImage.trim();
                
                if (ogImage.startsWith("/")) {
                    ogImage = "https://smolyanvote.com" + ogImage;
                } else if (!ogImage.startsWith("http://") && !ogImage.startsWith("https://")) {
                    ogImage = "https://smolyanvote.com/" + ogImage;
                }
            } else {
                ogImage = "https://smolyanvote.com/images/web/podcast1.png";
            }

            String ogUrl = "https://smolyanvote.com/podcast/episode/" + id;

            String ogAudio = episode.getAudioUrl();
            if (ogAudio != null && !ogAudio.trim().isEmpty()) {
                if (ogAudio.startsWith("/")) {
                    ogAudio = "https://smolyanvote.com" + ogAudio;
                } else if (!ogAudio.startsWith("http")) {
                    ogAudio = "https://smolyanvote.com/" + ogAudio;
                }
            } else {
                ogAudio = "";
            }
            
            episodeDTO.setImageUrl(ogImage);
            
            String formattedPublishDate = "";
            if (episode.getPublishDate() != null) {
                try {
                    java.time.format.DateTimeFormatter formatter = 
                        java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX");
                    formattedPublishDate = episode.getPublishDate()
                        .atZone(java.time.ZoneId.of("UTC"))
                        .format(formatter);
                } catch (Exception e) {
                    try {
                        formattedPublishDate = episode.getPublishDate().toString();
                        if (formattedPublishDate.endsWith("Z")) {
                            formattedPublishDate = formattedPublishDate.replace("Z", "+00:00");
                        }
                    } catch (Exception e2) {
                        formattedPublishDate = "";
                    }
                }
            }
            
            model.addAttribute("episode", episodeDTO);
            model.addAttribute("ogTitle", ogTitle);
            model.addAttribute("ogDescription", ogDescription);
            model.addAttribute("ogImage", ogImage);
            model.addAttribute("ogUrl", ogUrl);
            model.addAttribute("ogAudio", ogAudio);
            model.addAttribute("isSocialBot", isSocialBot);
            model.addAttribute("formattedPublishDate", formattedPublishDate);

            return "podcast-episode-social";
            
        } catch (Exception e) {
            System.err.println("Error in sharePodcastEpisode for episode ID " + id + ": " + e.getMessage());
            e.printStackTrace();
            return "redirect:/podcast";
        }
    }
}
