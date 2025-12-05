package smolyanVote.smolyanVote.controllers;

import jakarta.persistence.EntityNotFoundException;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import jakarta.servlet.http.HttpServletRequest;
import smolyanVote.smolyanVote.models.*;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.models.enums.ActivityTypeEnum;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.repositories.ReferendumRepository;
import smolyanVote.smolyanVote.services.interfaces.*;
import smolyanVote.smolyanVote.viewsAndDTO.ReferendumDetailViewDTO;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.*;

@Controller
public class ReferendumController {

    private final ReferendumService referendumService;
    private final UserService userService;
    private final DeleteEventsService deleteEventsService;
    private final ReferendumRepository referendumRepository;
    private final ActivityLogService activityLogService;


    @Autowired
    public ReferendumController(ReferendumService referendumService,
                                UserService userService,
                                DeleteEventsService deleteEventsService,
                                ReferendumRepository referendumRepository,
                                ActivityLogService activityLogService) {
        this.referendumService = referendumService;
        this.userService = userService;
        this.deleteEventsService = deleteEventsService;
        this.referendumRepository = referendumRepository;
        this.activityLogService = activityLogService;
    }

    @GetMapping("/referendum")
    public String showCreateForm(Model model) {
        model.addAttribute("locations", Locations.values());
        return "createReferendum";
    }

    @PostMapping("/referendum/create")
    public String handleCreateReferendum(@RequestParam String topic,
                                         @RequestParam String description,
                                         @RequestParam Locations location,
                                         @RequestParam("options") List<String> options,
                                         @RequestParam(value = "image1", required = false) MultipartFile image1,
                                         @RequestParam(value = "image2", required = false) MultipartFile image2,
                                         @RequestParam(value = "image3", required = false) MultipartFile image3,
                                         RedirectAttributes redirectAttributes) {

        List<MultipartFile> images = List.of(image1, image2, image3);

        List<String> allowedMimeTypes = List.of("image/jpeg", "image/png", "image/gif", "image/webp");
        List<String> allowedExtensions = List.of(".jpg", ".jpeg", ".png", ".gif", ".webp");
        Tika tika = new Tika();

        for (MultipartFile image : images) {
            if (image != null && !image.isEmpty()) {
                String originalFilename = Objects.requireNonNull(image.getOriginalFilename()).toLowerCase();
                String extension = originalFilename.substring(originalFilename.lastIndexOf("."));

                // MIME тип от браузъра
                String browserType = image.getContentType();
                if (browserType == null || !allowedMimeTypes.contains(browserType)) {
                    redirectAttributes.addFlashAttribute("errorMessage", "Разрешени са само JPEG, PNG и GIF файлове!");
                    return "redirect:/referendum";
                }

                // Разширение на името
                if (allowedExtensions.stream().noneMatch(originalFilename::endsWith)) {
                    redirectAttributes.addFlashAttribute("errorMessage", "Файлът трябва да е .jpg, .jpeg, .png или .gif!");
                    return "redirect:/referendum";
                }

                // Проверка със съдържанието (Apache Tika)
                try {
                    String detectedType = tika.detect(image.getInputStream());
                    if (!allowedMimeTypes.contains(detectedType)) {
                        redirectAttributes.addFlashAttribute("errorMessage", "Файлът не е валидно изображение (по съдържание)!");
                        return "redirect:/referendum";
                    }
                } catch (Exception e) {
                    redirectAttributes.addFlashAttribute("errorMessage", "Проблем при валидиране на файл: " + e.getMessage());
                    return "redirect:/referendum";
                }

                // Размер (проверява се автоматично от Spring Boot, но може и ръчно)
                if (image.getSize() > 8 * 1024 * 1024) {
                    redirectAttributes.addFlashAttribute("errorMessage", "Файлът не трябва да надвишава 8MB!");
                    return "redirect:/referendum";
                }
            }
        }

        // Всички проверки са минали — създаване
        try {
            UserEntity user = userService.getCurrentUser();
            referendumService.createReferendum(topic, description, location, options, images, user);
            redirectAttributes.addFlashAttribute("successMessage", "Референдумът беше създаден успешно!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Грешка при създаване на референдум: " + e.getMessage());
        }

        return "redirect:/referendum";
    }




    @GetMapping("/referendum/{id}")
    public String showReferendumDetail(@PathVariable Long id, Model model, jakarta.servlet.http.HttpServletRequest request) {
        try {
            ReferendumDetailViewDTO detailDto = referendumService.getReferendumDetail(id);
            UserEntity currentUser = userService.getCurrentUser();

            // Проверка за Facebook bot
            String userAgent = request.getHeader("User-Agent");
            boolean isFacebookBot = userAgent != null && userAgent.contains("facebookexternalhit");

            if (isFacebookBot) {
                // ====== ЗА FACEBOOK BOT - ПОДГОТВИ OG ДАННИ ======
                String ogTitle = detailDto.getTitle();
                if (ogTitle == null || ogTitle.trim().isEmpty()) {
                    ogTitle = "Референдум от SmolyanVote";
                }

                String ogDescription = detailDto.getDescription();
                if (ogDescription != null && ogDescription.length() > 160) {
                    ogDescription = ogDescription.substring(0, 160) + "...";
                }
                if (ogDescription == null || ogDescription.trim().isEmpty()) {
                    ogDescription = "Участвайте в референдума и споделете мнението си в SmolyanVote.";
                }

                String ogImage = null;
                if (detailDto.getImageUrls() != null && !detailDto.getImageUrls().isEmpty()) {
                    ogImage = detailDto.getImageUrls().get(0);
                }
                if (ogImage == null || ogImage.trim().isEmpty()) {
                    ogImage = "https://smolyanvote.com/images/logoNew.png";
                } else if (ogImage.startsWith("/")) {
                    ogImage = "https://smolyanvote.com" + ogImage;
                }

                String ogUrl = "https://smolyanvote.com/referendum/" + id;

                model.addAttribute("referendumDetail", detailDto);
                model.addAttribute("ogTitle", ogTitle);
                model.addAttribute("ogDescription", ogDescription);
                model.addAttribute("ogImage", ogImage);
                model.addAttribute("ogUrl", ogUrl);
                model.addAttribute("ogAuthor", detailDto.getCreator().getUsername());

                return "referendum-social";
            } else {
                // ====== ЗА НОРМАЛНИ ПОТРЕБИТЕЛИ ======
                List<CommentsEntity> comments = detailDto.getComments();

                model.addAttribute("referendumDetail", detailDto);
                model.addAttribute("currentUser", currentUser);
                model.addAttribute("comments", comments);
                model.addAttribute("currentUrl", "/referendum/" + id);

                return "referendumDetailView";
            }
        } catch (EntityNotFoundException e) {
            return "redirect:/404";
        }
    }



    @GetMapping("/referendum/{id}/edit")
    @PreAuthorize("hasRole('ADMIN')")
    public String showEditReferendum(@PathVariable Long id, Model model, RedirectAttributes redirectAttributes) {
        try {
            ReferendumDetailViewDTO referendumDetail = referendumService.getReferendumDetail(id);
            model.addAttribute("referendum", referendumDetail);
            model.addAttribute("referendumId", id);
            model.addAttribute("locations", Locations.values());
            model.addAttribute("isEdit", true);
            model.addAttribute("existingImages", referendumDetail.getImageUrls());
            
            return "createReferendum";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Референдумът не е намерен.");
            return "redirect:/mainEvents";
        }
    }

    @PostMapping("/referendum/{id}/edit")
    @PreAuthorize("hasRole('ADMIN')")
    public String updateReferendum(@PathVariable Long id,
                                   @RequestParam String topic,
                                   @RequestParam String description,
                                   @RequestParam Locations location,
                                   @RequestParam("options") List<String> options,
                                   @RequestParam(value = "image1", required = false) MultipartFile image1,
                                   @RequestParam(value = "image2", required = false) MultipartFile image2,
                                   @RequestParam(value = "image3", required = false) MultipartFile image3,
                                   RedirectAttributes redirectAttributes) {
        try {
            ReferendumEntity referendum = referendumRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Референдумът не е намерен"));

            // Обновяване на данните
            referendum.setTitle(topic);
            referendum.setDescription(description);
            referendum.setLocation(location);

            // Обновяване на опциите (ако има такива в ентитета)
            // Референдумите обикновено имат опции в отделна таблица, но за сега ще запазим само основните данни

            // Обработка на нови изображения
            List<MultipartFile> images = List.of(image1, image2, image3);
            if (images != null && !images.isEmpty()) {
                for (MultipartFile file : images) {
                    if (file != null && !file.isEmpty()) {
                        // Тук трябва да се добави логика за запазване на изображенията
                        // За сега ще пропуснем, тъй като изисква допълнителни зависимости
                    }
                }
            }

            referendumRepository.save(referendum);

            // ✅ ЛОГИРАНЕ НА EDIT_REFERENDUM
            try {
                UserEntity currentUser = userService.getCurrentUser();
                if (currentUser != null) {
                    String details = String.format("Edited referendum: \"%s\" (ID: %d)", 
                            referendum.getTitle() != null && referendum.getTitle().length() > 100 
                                    ? referendum.getTitle().substring(0, 100) + "..." 
                                    : referendum.getTitle(), id);
                    activityLogService.logActivity(ActivityActionEnum.EDIT_REFERENDUM, currentUser,
                            ActivityTypeEnum.REFERENDUM.name(), id, details, null, null);
                }
            } catch (Exception e) {
                System.err.println("Failed to log EDIT_REFERENDUM activity: " + e.getMessage());
            }

            redirectAttributes.addFlashAttribute("successMessage", "Референдумът беше редактиран успешно!");
            return "redirect:/referendum/" + id;

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Грешка при редактиране на референдума: " + e.getMessage());
            return "redirect:/referendum/" + id;
        }
    }

    @PostMapping("/referendum/{id}/delete")
    public String deleteReferendum(@PathVariable Long id,
                                   RedirectAttributes redirectAttributes,
                                   Authentication auth) {

        if (auth == null || !auth.isAuthenticated()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Необходима е автентикация за изтриване.");
            return "redirect:/referendum/" + id;
        }

        try {
            UserEntity currentUser = userService.getCurrentUser();

            if (!deleteEventsService.canUserDeleteEvent(id, currentUser)) {
                redirectAttributes.addFlashAttribute("errorMessage", "Нямате права за изтриване на този референдум.");
                return "redirect:/referendum/" + id;
            }

            deleteEventsService.deleteEvent(id);
            redirectAttributes.addFlashAttribute("successMessage", "Референдумът беше изтрит успешно.");
            return "redirect:/mainEvents";

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Възникна грешка при изтриването: " + e.getMessage());
            return "redirect:/referendum/" + id;
        }
    }

    // ====== SHARE API ENDPOINT ======

    @PostMapping(value = "/api/referendum/{id}/share", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> shareReferendum(@PathVariable Long id, Authentication auth) {
        try {
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
            }

            ReferendumEntity referendum = referendumRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Референдумът не е намерен"));

            UserEntity currentUser = userService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(401).body(createErrorResponse("Потребителят не е намерен"));
            }

            // ✅ ЛОГИРАНЕ НА SHARE_REFERENDUM
            try {
                String ipAddress = extractIpAddress();
                String userAgent = extractUserAgent();
                String details = String.format("Shared referendum: \"%s\" (ID: %d)", 
                        referendum.getTitle() != null && referendum.getTitle().length() > 100 
                                ? referendum.getTitle().substring(0, 100) + "..." 
                                : referendum.getTitle(), id);
                activityLogService.logActivity(ActivityActionEnum.SHARE_REFERENDUM, currentUser,
                        ActivityTypeEnum.REFERENDUM.name(), id, details, ipAddress, userAgent);
            } catch (Exception e) {
                System.err.println("Failed to log SHARE_REFERENDUM activity: " + e.getMessage());
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Референдумът е споделен успешно");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при споделянето"));
        }
    }

    // ===== HELPER METHODS =====

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", message);
        return response;
    }

    private String extractIpAddress() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                if (request != null) {
                    String ip = request.getHeader("X-Forwarded-For");
                    if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                        ip = request.getHeader("X-Real-IP");
                    }
                    if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                        ip = request.getRemoteAddr();
                    }
                    if (ip != null && ip.contains(",")) {
                        ip = ip.split(",")[0].trim();
                    }
                    return ip != null ? ip : "unknown";
                }
            }
        } catch (Exception e) {
            // Ignore
        }
        return "unknown";
    }

    private String extractUserAgent() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                if (request != null) {
                    String userAgent = request.getHeader("User-Agent");
                    return userAgent != null ? userAgent : "unknown";
                }
            }
        } catch (Exception e) {
            // Ignore
        }
        return "unknown";
    }


}
