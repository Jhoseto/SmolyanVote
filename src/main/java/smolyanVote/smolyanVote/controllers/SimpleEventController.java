package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.services.interfaces.*;
import smolyanVote.smolyanVote.viewsAndDTO.CreateEventView;
import smolyanVote.smolyanVote.viewsAndDTO.SimpleEventDetailViewDTO;

import java.util.List;

@Controller
public class SimpleEventController {

    private final SimpleEventService simpleEventService;
    private final CommentsService commentsService;
    private final UserService userService;
    private final DeleteEventsService deleteEventsService;
    private final ReportsService reportsService;


    @Autowired
    public SimpleEventController(SimpleEventService simpleEventService,
                                 CommentsService commentsService,
                                 UserService userService,
                                 DeleteEventsService deleteEventsService,
                                 ReportsService reportsService) {
        this.simpleEventService = simpleEventService;
        this.commentsService = commentsService;
        this.userService = userService;
        this.deleteEventsService = deleteEventsService;
        this.reportsService = reportsService;
    }






    @GetMapping("/event/{id}")
    public String eventDetail(@PathVariable Long id, Model model, jakarta.servlet.http.HttpServletRequest request) {
        try {
            SimpleEventDetailViewDTO pageData = simpleEventService.getSimpleEventDetails(id);
            UserEntity currentUser = userService.getCurrentUser();

            // Проверка за Facebook bot
            String userAgent = request.getHeader("User-Agent");
            boolean isFacebookBot = userAgent != null && userAgent.contains("facebookexternalhit");

            if (isFacebookBot) {
                // ====== ЗА FACEBOOK BOT - ПОДГОТВИ OG ДАННИ ======
                String ogTitle = pageData.getTitle();
                if (ogTitle == null || ogTitle.trim().isEmpty()) {
                    ogTitle = "Събитие от SmolyanVote";
                }

                String ogDescription = pageData.getDescription();
                if (ogDescription != null && ogDescription.length() > 160) {
                    ogDescription = ogDescription.substring(0, 160) + "...";
                }
                if (ogDescription == null || ogDescription.trim().isEmpty()) {
                    ogDescription = "Участвайте в гласуването и споделете мнението си в SmolyanVote.";
                }

                String ogImage = null;
                if (pageData.getImages() != null && !pageData.getImages().isEmpty()) {
                    ogImage = pageData.getImages().get(0);
                }
                if (ogImage == null || ogImage.trim().isEmpty()) {
                    ogImage = "https://smolyanvote.com/images/logoNew.png";
                } else if (ogImage.startsWith("/")) {
                    ogImage = "https://smolyanvote.com" + ogImage;
                }

                String ogUrl = "https://smolyanvote.com/event/" + id;

                model.addAttribute("eventDetail", pageData);
                model.addAttribute("ogTitle", ogTitle);
                model.addAttribute("ogDescription", ogDescription);
                model.addAttribute("ogImage", ogImage);
                model.addAttribute("ogUrl", ogUrl);
                model.addAttribute("ogAuthor", pageData.getCreator().getUsername());

                return "simpleEvent-social";
            } else {
                // ====== ЗА НОРМАЛНИ ПОТРЕБИТЕЛИ ======
                model.addAttribute("userVote", pageData.getCurrentUserVote());
                model.addAttribute("eventDetail", pageData);
                model.addAttribute("currentUser", currentUser);

                return "simpleEventDetailView";
            }
        } catch (IllegalArgumentException e) {
            return "error/404";
        }
    }


    @GetMapping("/createNewEvent")
    public String showCreateEvent(Model model) {
        model.addAttribute("locations", Locations.values()); // enum стойности

        return "createSimpleEvent";
    }

    @PostMapping("/create")
    public String createEvent(@ModelAttribute CreateEventView createEventDto,
                              @RequestParam String positiveLabel,
                              @RequestParam String negativeLabel,
                              @RequestParam String neutralLabel,
                              RedirectAttributes redirectAttributes) {

        try {
            // Проверка за изображенията
            MultipartFile[] files = {createEventDto.getImage1(), createEventDto.getImage2(), createEventDto.getImage3()};

            // Логика за създаване на събитието и съхранение на изображенията
            List<String> imagePaths = simpleEventService.createEvent(createEventDto, files, positiveLabel, negativeLabel, neutralLabel);

            // Ако всичко е успешно, добавяме съобщение за успех
            redirectAttributes.addFlashAttribute("successMessage", "Събитието беше създадено успешно!");

        } catch (Exception e) {
            // В случай на грешка добавяме съобщение за грешка
            redirectAttributes.addFlashAttribute("errorMessage", "Грешка при създаване на събитието: " + e.getMessage());
        }

        return "redirect:/createNewEvent";
    }



    @PostMapping("/event/{id}/delete")
    public String deleteEvent(@PathVariable Long id,
                              RedirectAttributes redirectAttributes,
                              Authentication auth) {

        if (auth == null || !auth.isAuthenticated()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Необходима е автентикация за изтриване.");
            return "redirect:/event/" + id;
        }

        try {
            UserEntity currentUser = userService.getCurrentUser();

            if (!deleteEventsService.canUserDeleteEvent(id, currentUser)) {
                redirectAttributes.addFlashAttribute("errorMessage", "Нямате права за изтриване на това събитие.");
                return "redirect:/event/" + id;
            }

            deleteEventsService.deleteEvent(id);
            redirectAttributes.addFlashAttribute("successMessage", "Събитието беше изтрито успешно.");
            return "redirect:/mainEvents";

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Възникна грешка при изтриването: " + e.getMessage());
            return "redirect:/event/" + id;
        }
    }

}
