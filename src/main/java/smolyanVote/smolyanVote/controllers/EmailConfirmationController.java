package smolyanVote.smolyanVote.controllers;

import org.springframework.stereotype.Controller;
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

    @GetMapping("/confirm")
    public String confirmRegistration(@RequestParam("code") String code, RedirectAttributes redirectAttributes) {
        Optional<UserEntity> userOptional = userRepository.findByUserConfirmationCode(code);

        if (userOptional.isPresent()) {
            UserEntity user = userOptional.get();

            user.setActive(true);

            userRepository.save(user);
            redirectAttributes.addFlashAttribute(
                    "message", "Вашият Имейл е потвърден !\n Можете да влезнете във вашият профил");
            return "redirect:/login";
        }

        redirectAttributes.addFlashAttribute("error",
                "Неуспешна активация ! Моля опитайте отново по-късно.");
        return "redirect:/registration";
    }
}
