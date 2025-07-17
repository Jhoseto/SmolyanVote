package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    private final UserService userService;
    private final VoteService voteService;
    private final DeleteEventsService deleteEventsService;

    @Autowired
    public MultiPollController(MultiPollService multiPollService,
                               UserService userService,
                               VoteService voteService,
                               DeleteEventsService deleteEventsService) {
        this.multiPollService = multiPollService;
        this.userService = userService;
        this.voteService = voteService;
        this.deleteEventsService = deleteEventsService;
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

    @PostMapping("/multipoll/{id}/delete")
    public String deleteMultiPoll(@PathVariable Long id,
                                  RedirectAttributes redirectAttributes,
                                  Authentication auth) {

        if (auth == null || !auth.isAuthenticated()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Необходима е автентикация за изтриване.");
            return "redirect:/multipoll/" + id;
        }

        try {
            UserEntity currentUser = userService.getCurrentUser();

            if (!deleteEventsService.canUserDeleteEvent(id, currentUser)) {
                redirectAttributes.addFlashAttribute("errorMessage", "Нямате права за изтриване на тази анкета.");
                return "redirect:/multipoll/" + id;
            }

            deleteEventsService.deleteEvent(id);
            redirectAttributes.addFlashAttribute("successMessage", "Анкетата беше изтрита успешно.");
            return "redirect:/mainEvents";

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Възникна грешка при изтриването: " + e.getMessage());
            return "redirect:/multipoll/" + id;
        }
    }
}
