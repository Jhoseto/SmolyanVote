package smolyanVote.smolyanVote.controllers;

import jakarta.persistence.EntityNotFoundException;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import smolyanVote.smolyanVote.models.*;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.models.enums.ReportableEntityType;
import smolyanVote.smolyanVote.repositories.ReferendumRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.repositories.VoteReferendumRepository;
import smolyanVote.smolyanVote.services.interfaces.*;
import smolyanVote.smolyanVote.viewsAndDTO.ReferendumDetailViewDTO;

import java.util.*;

@Controller
public class ReferendumController {

    private final ReferendumService referendumService;
    private final UserService userService;
    private final DeleteEventsService deleteEventsService;


    @Autowired
    public ReferendumController(ReferendumService referendumService,
                                UserService userService,
                                DeleteEventsService deleteEventsService) {
        this.referendumService = referendumService;
        this.userService = userService;
        this.deleteEventsService = deleteEventsService;
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
    public String showReferendumDetail(@PathVariable Long id, Model model) {
        try {
            ReferendumDetailViewDTO detailDto = referendumService.getReferendumDetail(id);
            UserEntity currentUser = userService.getCurrentUser();

            List<CommentsEntity> comments = detailDto.getComments();

            model.addAttribute("referendumDetail", detailDto);
            model.addAttribute("currentUser", currentUser);
            model.addAttribute("comments", comments);
            model.addAttribute("currentUrl", "/referendum/" + id);

            return "referendumDetailView";
        } catch (EntityNotFoundException e) {
            return "redirect:/404";
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

}
