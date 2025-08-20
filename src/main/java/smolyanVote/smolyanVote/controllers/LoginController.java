package smolyanVote.smolyanVote.controllers;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.UserService;
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

    @GetMapping("/viewLogin")
    public String showLogin(Model model) {
        if (!model.containsAttribute("userModel")) {
            model.addAttribute("userModel", new UserLoginViewModel());
        }
        return "login_page";
    }

    @PostMapping("/login")
    public String login(@Valid @ModelAttribute("userModel") UserLoginViewModel userModel,
                        RedirectAttributes redirectAttributes,
                        HttpServletResponse response,
                        HttpServletRequest request) {

        Optional<UserEntity> userOptional = userService.findUserByEmail(userModel.getEmail());

        if (userOptional.isEmpty()) {
            redirectAttributes.addFlashAttribute("error", "Невалиден имейл адрес: " + userModel.getEmail());
            return "redirect:/viewLogin";
        }

        UserEntity user = userOptional.get();

        if (user.getStatus().equals(UserStatusEnum.PENDING_ACTIVATION)) {
            redirectAttributes.addFlashAttribute("error", "Вашият акаунт не е активен. Моля, активирайте го чрез изпратения имейл.");
            return "redirect:/viewLogin";
        }

        if (!userService.checkPassword(user, userModel.getPassword())) {
            redirectAttributes.addFlashAttribute("error", "Грешна парола!");
            return "redirect:/viewLogin";
        }

        Authentication authentication = userService.authenticateUser(userModel.getEmail(), userModel.getPassword());

        if (authentication != null) {
            // 1. Set в SecurityContextHolder
            SecurityContextHolder.getContext().setAuthentication(authentication);

            request.getSession().setAttribute(
                    HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                    SecurityContextHolder.getContext()
            );

            // 3. Обновяване на последно влизане
            user.setLastOnline(Instant.now());
            user.setOnlineStatus(1);
            userRepository.save(user);

            // 4. Remember Me
            if (userModel.isRememberMe()) {
                rememberMeServices.loginSuccess(request, response, authentication);
            }

            return "redirect:/";
        }

        redirectAttributes.addFlashAttribute("error", "Възникна неочаквана грешка. Моля, опитайте отново.");
        return "redirect:/viewLogin";
    }


}
