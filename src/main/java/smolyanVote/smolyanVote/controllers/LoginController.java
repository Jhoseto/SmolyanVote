package smolyanVote.smolyanVote.controllers;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repository.UserRepository;
import smolyanVote.smolyanVote.services.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.UserLoginViewModel;

import java.time.Instant;
import java.util.Optional;

@Controller
public class LoginController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final TokenBasedRememberMeServices rememberMeServices;

    @Autowired
    public LoginController(UserService userService, UserRepository userRepository, TokenBasedRememberMeServices rememberMeServices) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.rememberMeServices = rememberMeServices;
    }

    @GetMapping("/login")
    public String showLogin(Model model) {
        if (!model.containsAttribute("userModel")) {
            model.addAttribute("userModel", new UserLoginViewModel());
        }
        return "login";
    }

    @PostMapping("/login")
    public String login(@Valid @ModelAttribute("userModel") UserLoginViewModel userModel,
                        RedirectAttributes redirectAttributes,
                        HttpServletResponse response,
                        HttpServletRequest request) {

        Optional<UserEntity> userOptional = userService.findUserByEmail(userModel.getEmail());

        if (userOptional.isPresent()) {
            UserEntity user = userOptional.get();

            if (user.isActive()) {
                Authentication authentication = userService.authenticateUser(userModel.getEmail(), userModel.getPassword());

                if (authentication != null) {
                    // Актуализиране на последното време за активност
                    user.setLastOnline(Instant.now());
                    userRepository.save(user);

                    // Ако е избрана опцията "Запомни ме", се записва в cookies
                    if (userModel.isRememberMe()) {
                        rememberMeServices.loginSuccess(request, response, authentication);
                    }

                    return "redirect:/mainEvents";
                } else {
                    // Грешна парола
                    redirectAttributes.addFlashAttribute("error", "Грешна парола!");
                    return "redirect:/login";
                }
            } else {
                // Потребителят не е активиран
                redirectAttributes.addFlashAttribute("error", "Вашият акаунт не е активен. За да го активирате, кликнете на изпратения от нас ЛИНК за активация.");
                return "redirect:/login";
            }
        } else {
            // Потребител с този имейл не е намерен
            redirectAttributes.addFlashAttribute("error", "Потребител с Имейл -> " + userModel.getEmail() + " не е намерен в системата!");
            return "redirect:/login";
        }
    }
}
