package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.services.interfaces.CommentsService;
import smolyanVote.smolyanVote.services.interfaces.MultiPollService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.services.interfaces.VoteService;
import smolyanVote.smolyanVote.viewsAndDTO.CreateMultiPollView;
import smolyanVote.smolyanVote.viewsAndDTO.MultiPollDetailViewDTO;
import smolyanVote.smolyanVote.viewsAndDTO.commentsDTO.ReactionCountDto;

import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/multipoll")
public class MultiPollController {

    private final MultiPollService multiPollService;
    private final CommentsService commentsService;
    private final UserService userService;
    private final VoteService voteService;

    @Autowired
    public MultiPollController(MultiPollService multiPollService,
                               CommentsService commentsService, UserService userService, VoteService voteService) {
        this.multiPollService = multiPollService;
        this.commentsService = commentsService;
        this.userService = userService;
        this.voteService = voteService;
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

            // Коментари и реакции
            List<CommentsEntity> comments = commentsService.getCommentsForTarget(id, EventType.MULTI_POLL);
            Map<Long, ReactionCountDto> reactionsMap = commentsService.getReactionsForAllCommentsWithReplies(comments, currentUser.getUsername());


            model.addAttribute("multiPoll", multiPollDetail);
            model.addAttribute("currentUser", currentUser);
            model.addAttribute("comments", comments);
            model.addAttribute("reactionsMap", reactionsMap);
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
}
