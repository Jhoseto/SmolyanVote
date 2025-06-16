package smolyanVote.smolyanVote.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;

import java.util.Optional;

@Controller
public class EmailConfirmationController {
    private final UserRepository userRepository;

    public EmailConfirmationController(UserRepository userRepository) {
        this.userRepository = userRepository;

    }

    @Transactional
    @GetMapping("/confirm")
    public String confirmRegistration(@RequestParam("userId") Long userId,
                                      @RequestParam("code") String code,
                                      RedirectAttributes redirectAttributes) {

        Optional<UserEntity> userOptional = userRepository.findById(userId);

        if (userOptional.isPresent()) {
            UserEntity user = userOptional.get();

            if (user.getUserConfirmationCode().equals(code) && !user.isActive()) {
                user.setActive(true);
                userRepository.save(user);

                redirectAttributes.addFlashAttribute(
                        "message", "Вашият Имейл е потвърден! Можете да влезнете във вашият профил.");
                return "redirect:/viewLogin";
            } else {
                redirectAttributes.addFlashAttribute("error",
                        "Невалиден код или акаунт вече е активиран.");
                return "redirect:/registration";
            }
        }

        redirectAttributes.addFlashAttribute("error",
                "Потребителят не е намерен. Опитайте отново.");
        return "redirect:/registration";
    }
}
