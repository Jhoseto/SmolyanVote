package smolyanVote.smolyanVote.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MainController {


    @GetMapping("/")
    public String redirectToIndex() {
        return "redirect:/index";
    }

    @GetMapping("/index")
    public String homePage(Model model) {

        return "index";
    }

    @GetMapping("/about")
    public String aboutUsPage(Model model) {

        return "aboutUs";
    }
}
