package smolyanVote.smolyanVote.controllers;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MainController {



    @GetMapping("/")
    public String homePage(Model model) {

        return "index";
    }

    @GetMapping("/about")
    public String aboutUsPage(Model model) {

        return "aboutUs";
    }

    @GetMapping("/error/general")
    public String showGeneralError(HttpServletRequest request, Model model) {
        String message = (String) request.getAttribute("errorMessage");
        if (message == null) {
            message = "Възникна неочаквана грешка.";
        }
        model.addAttribute("errorMessage", message);
        return "error/general_error";
    }

    @GetMapping("/error/404")
    public String showNotFoundErrorPage() {
        return "error/404";
    }

    @GetMapping("/error/403")
    public String showAccessDeniedPage() {
        return "error/403";
    }
}
