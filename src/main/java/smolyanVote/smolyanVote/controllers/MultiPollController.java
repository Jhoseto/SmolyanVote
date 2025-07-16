package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.models.enums.ReportableEntityType;
import smolyanVote.smolyanVote.services.interfaces.*;
import smolyanVote.smolyanVote.viewsAndDTO.CreateMultiPollView;
import smolyanVote.smolyanVote.viewsAndDTO.MultiPollDetailViewDTO;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/multipoll")
public class MultiPollController {

    private final MultiPollService multiPollService;
    private final CommentsService commentsService;
    private final UserService userService;
    private final VoteService voteService;
    private final ReportsService reportsService;

    @Autowired
    public MultiPollController(MultiPollService multiPollService,
                               CommentsService commentsService,
                               UserService userService,
                               VoteService voteService,
                               ReportsService reportsService) {
        this.multiPollService = multiPollService;
        this.commentsService = commentsService;
        this.userService = userService;
        this.voteService = voteService;
        this.reportsService = reportsService;
    }

    @GetMapping("/createMultiPoll")
    public String showCreateForm(Model model) {
        if (!model.containsAttribute("createMultiPollView")) {
            CreateMultiPollView view = new CreateMultiPollView();
            view.setOptions(List.of("", ""));
            model.addAttribute("createMultiPollView", view);
        }
        model.addAttribute("locations", Locations.values());
        return "createMultiPoll";
    }



    @PostMapping("/create")
    public String createMultiPoll(@ModelAttribute CreateMultiPollView createMultiPollView,
                                  RedirectAttributes redirectAttributes) {

        boolean hasErrors = false;
        StringBuilder errorMessage = new StringBuilder();

        // Валидации
        if (createMultiPollView.getTitle() == null || createMultiPollView.getTitle().trim().isEmpty()) {
            errorMessage.append("Заглавието е задължително. ");
            hasErrors = true;
        }
        if (createMultiPollView.getDescription() == null || createMultiPollView.getDescription().trim().isEmpty()) {
            errorMessage.append("Описанието е задължително. ");
            hasErrors = true;
        }

        List<String> filteredOptions = createMultiPollView.getOptions().stream()
                .filter(opt -> opt != null && !opt.trim().isEmpty())
                .toList();

        if (filteredOptions.size() < 2) {
            errorMessage.append("Въведете поне две валидни опции.");
            hasErrors = true;
        } else if (filteredOptions.size() > 10) {
            errorMessage.append("Максимум 10 опции са разрешени.");
            hasErrors = true;
        }

        if (hasErrors) {
            redirectAttributes.addFlashAttribute("errorMessage", errorMessage.toString().trim());
            redirectAttributes.addFlashAttribute("createMultiPollView", createMultiPollView);
            return "redirect:/multipoll/createMultiPoll";
        }

        createMultiPollView.setOptions(filteredOptions);

        multiPollService.createMultiPoll(createMultiPollView);

        redirectAttributes.addFlashAttribute("successMessage", "Анкетата беше създадена успешно!");
        return "redirect:/multipoll/createMultiPoll";
    }


    @GetMapping("/{id}")
    public String showMultiPollDetail(@PathVariable Long id, Model model) {
        try {
            MultiPollDetailViewDTO multiPollDetail = multiPollService.getMultiPollDetail(id);
            UserEntity currentUser = userService.getCurrentUser();



            model.addAttribute("multiPoll", multiPollDetail);
            model.addAttribute("currentUser", currentUser);
            return "multiPollDetailView";
        } catch (IllegalArgumentException e) {
            return "error/404";
        }
    }



    @PostMapping("/vote")
    public String submitVote(
            @RequestParam("multiPollId") Long pollId,
            @RequestParam("userEmail") String userEmail,
            @RequestParam("selectedOptions") List<Integer> selectedOptions,
            RedirectAttributes redirectAttributes) {

        try {
            // Извикваме service метода за обработка на гласа
            voteService.recordMultiPollVote(pollId, userEmail, selectedOptions);

            redirectAttributes.addFlashAttribute("successMessage", "Гласът ви беше записан успешно!");
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Възникна грешка при записването на гласа.");
        }

        // Пренасочваме обратно към страницата с детайли за анкетата
        return "redirect:/multipoll/" + pollId;
    }


    @PostMapping(value = "/api/{id}/report", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> reportMultiPoll(
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

            // Предварителни проверки
            if (!reportsService.canUserReportEntity(ReportableEntityType.MULTI_POLL, id, user)) {
                return ResponseEntity.status(403).body(createErrorResponse("Не можете да докладвате тази анкета"));
            }

            if (reportsService.hasUserReportedEntity(ReportableEntityType.MULTI_POLL, id, user.getId())) {
                return ResponseEntity.status(409).body(createErrorResponse("Вече сте докладвали тази анкета"));
            }

            if (reportsService.hasUserExceededReportLimit(user)) {
                return ResponseEntity.status(429).body(createErrorResponse("Превишили сте лимита за доклади (максимум 5 на час, 20 на ден)"));
            }

            // Създаване на доклада
            reportsService.createEntityReport(ReportableEntityType.MULTI_POLL, id, user, reason, description);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Докладът е изпратен успешно. Благодарим ви!");

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            System.err.println("Unexpected error in reportMultiPoll: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(createErrorResponse("Възникна неочаквана грешка при докладването"));
        }
    }

    // Helper метод за error response (ако не съществува)
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", message);
        return response;
    }
}
