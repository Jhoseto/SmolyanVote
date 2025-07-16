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


    @PostMapping(value = "/api/{id}/report", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> reportSimpleEvent(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            UserEntity user = userService.getCurrentUser();
            String reason = request.get("reason");
            String description = request.get("description");

            if (reason == null || reason.trim().isEmpty()) {
                return ResponseEntity.status(400).body(createErrorResponse("Моля, посочете причина за докладването"));
            }

            if (!reportsService.canUserReportEntity(ReportableEntityType.SIMPLE_EVENT, id, user)) {
                return ResponseEntity.status(403).body(createErrorResponse("Не можете да докладвате това събитие"));
            }

            if (reportsService.hasUserReportedEntity(ReportableEntityType.SIMPLE_EVENT, id, user.getId())) {
                return ResponseEntity.status(409).body(createErrorResponse("Вече сте докладвали това събитие"));
            }

            if (reportsService.hasUserExceededReportLimit(user)) {
                return ResponseEntity.status(429).body(createErrorResponse("Превишили сте лимита за доклади (максимум 5 на час, 20 на ден)"));
            }

            reportsService.createEntityReport(ReportableEntityType.SIMPLE_EVENT, id, user, reason, description);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Докладът е изпратен успешно. Благодарим ви!");

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            System.err.println("Unexpected error in reportSimpleEvent: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(createErrorResponse("Възникна неочаквана грешка при докладването"));
        }
    }

    // HELPER МЕТОД (добави ако не съществува):
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", message);
        return response;
    }
}
