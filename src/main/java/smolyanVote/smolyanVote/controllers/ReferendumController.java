package smolyanVote.smolyanVote.controllers;

import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.ReferendumEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.CommentsService;
import smolyanVote.smolyanVote.services.ReferendumService;
import smolyanVote.smolyanVote.services.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.ReferendumDetailDTO;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Controller
public class ReferendumController {

    private final ReferendumService referendumService;
    private final UserService userService;
    private final UserRepository userRepository;
    private final CommentsService commentsService;

    @Autowired
    public ReferendumController(ReferendumService referendumService,
                                UserService userService, UserRepository userRepository,
                                CommentsService commentsService) {
        this.referendumService = referendumService;
        this.userService = userService;
        this.userRepository = userRepository;
        this.commentsService = commentsService;
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

        Optional<ReferendumEntity> referendumOpt = referendumService.findById(id);
        if (referendumOpt.isEmpty()) {
            return "redirect:/404";
        }

        ReferendumEntity referendum = referendumOpt.get();

        Optional<UserEntity> userOpt = userRepository.findByUsername(referendum.getCreatorName());
        if (userOpt.isEmpty()) {
            return "redirect:/404";
        }

        UserEntity user = userOpt.get();
        ReferendumDetailDTO referendumDetail = referendumService.getReferendumDetail(id, user.getUsername());

        if (referendumDetail == null) {
            return "redirect:/404";
        }

        model.addAttribute("user", user);
        model.addAttribute("referendum", referendum);
        model.addAttribute("referendumDetail", referendumDetail);
        model.addAttribute("comments", referendumDetail.getComments());
        model.addAttribute("locations", Locations.values());

        return "referendumDetailView";
    }

}
