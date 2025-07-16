package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.models.enums.ReportableEntityType;
import smolyanVote.smolyanVote.services.interfaces.*;
import smolyanVote.smolyanVote.viewsAndDTO.CreateEventView;
import smolyanVote.smolyanVote.viewsAndDTO.SimpleEventDetailViewDTO;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
public class SimpleEventController {

    private final SimpleEventService simpleEventService;
    private final CommentsService commentsService;
    private final UserService userService;
    private final DeleteService deleteService;
    private final ReportsService reportsService;


    @Autowired
    public SimpleEventController(SimpleEventService simpleEventService,
                                 CommentsService commentsService,
                                 UserService userService,
                                 DeleteService deleteService,
                                 ReportsService reportsService) {
        this.simpleEventService = simpleEventService;
        this.commentsService = commentsService;
        this.userService = userService;
        this.deleteService = deleteService;
        this.reportsService = reportsService;
    }






    @GetMapping("/event/{id}")
    public String eventDetail(@PathVariable Long id, Model model) {
        try {
            SimpleEventDetailViewDTO pageData = simpleEventService.getSimpleEventDetails(id);
            UserEntity currentUser = userService.getCurrentUser();


            model.addAttribute("userVote", pageData.getCurrentUserVote());
            model.addAttribute("eventDetail", pageData);
            model.addAttribute("currentUser", currentUser);

            return "simpleEventDetailView";
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
    @PreAuthorize("hasRole('ADMIN')")
    public String deleteEvent(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        deleteService.deleteEvent(id);
        redirectAttributes.addFlashAttribute("successMessage", "Събитието беше изтрито успешно.");
        return "redirect:/mainEvents";
    }

}
