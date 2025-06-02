package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.services.interfaces.MultiPollService;
import smolyanVote.smolyanVote.viewsAndDTO.CreateMultiPollView;

import java.util.List;

@Controller
@RequestMapping("/multipoll")
public class MultiPollController {

    private final MultiPollService multiPollService;

    @Autowired
    public MultiPollController(MultiPollService multiPollService) {
        this.multiPollService = multiPollService;
    }

    @GetMapping("/createMultiPoll")
    public String showCreateForm(Model model) {
        if (!model.containsAttribute("createMultiPollView")) {
            CreateMultiPollView view = new CreateMultiPollView();
            view.setOptions(List.of("", ""));
            model.addAttribute("createMultiPollView", view);
        }
        model.addAttribute("locations", Locations.values());
        return "createMultiPollPage";
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


}
