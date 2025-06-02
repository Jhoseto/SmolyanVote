package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.enums.Locations;

import jakarta.validation.Valid;
import smolyanVote.smolyanVote.services.interfaces.MultiPollService;
import smolyanVote.smolyanVote.viewsAndDTO.CreateMultiPollView;

@Controller
@RequestMapping("/multipoll")
public class MultiPollController {

    private final MultiPollService multiPollService;

    @Autowired
    public MultiPollController(MultiPollService multiPollService) {
        this.multiPollService = multiPollService;
    }

    @GetMapping("/create")
    public String showCreateForm(Model model) {
        model.addAttribute("locations", Locations.values());

        return "createMultiPollPage";
    }


    @PostMapping("/create")
    public String createMultiPoll(@Valid @ModelAttribute CreateMultiPollView createMultiPollView,
                                  BindingResult bindingResult,
                                  @RequestParam("image1") MultipartFile image1,
                                  @RequestParam("image2") MultipartFile image2,
                                  @RequestParam("image3") MultipartFile image3,
                                  Model model) {

        if (bindingResult.hasErrors() || createMultiPollView.getImage1().isEmpty()) {
            model.addAttribute("locations", Locations.values());
            model.addAttribute("errorMessage", "Попълнете всички задължителни полета и въведете поне две опции.");
            return "createMultiPollPage";
        }

        multiPollService.createMultiPoll(createMultiPollView);
        model.addAttribute("successMessage", "Анкетата беше създадена успешно!");
        return "redirect:/multipoll/create";
    }
}
