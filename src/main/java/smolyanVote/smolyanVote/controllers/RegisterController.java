package smolyanVote.smolyanVote.controllers;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.serviceImpl.UserServiceImpl;
import smolyanVote.smolyanVote.viewsAndDTO.UserRegistrationViewModel;

import java.time.Instant;
import java.util.Optional;

@Controller
public class RegisterController {

    private final UserRepository userRepository;
    private final UserServiceImpl userService;

    @Autowired
    public RegisterController(UserRepository userRepository,
                              UserServiceImpl userService) {
        this.userRepository = userRepository;
        this.userService = userService;
    }

    // Показване на регистрационната форма
    @GetMapping("/register")
    public String showRegistrationForm(Model model) {
        model.addAttribute("userFields", new UserRegistrationViewModel());

        return "registration";
    }

    @PostMapping("/user/registration")
    public String register(
            @Valid UserRegistrationViewModel userRegistrationViewModel,
            BindingResult result,
            RedirectAttributes redirectAttributes,

            // 👇 Honeypot и timestamp полетата от HTML формата
            @RequestParam(name = "middleName", required = false) String honeypot,
            @RequestParam(name = "formRenderedAt", required = false) Long formRenderedAt
    ) {
        StringBuilder errorMessages = new StringBuilder();

        // ✅ HONEYPOT ПРОВЕРКА (ако бот е попълнил скритото поле)
        if (honeypot != null && !honeypot.trim().isEmpty()) {
            redirectAttributes.addFlashAttribute("error", "Бот регистрация засечена.");
            return "redirect:/register";
        }

        // ✅ TIMESTAMP ПРОВЕРКА (ако формата е пратена твърде бързо - < 5 сек)
        if (formRenderedAt != null) {
            long now = Instant.now().toEpochMilli();
            if (now - formRenderedAt < 5000) {
                redirectAttributes.addFlashAttribute("error", "Подозрително попълване. Опитайте отново.");
                return "redirect:/register";
            }
        }

        // Валидационни грешки
        if (result.hasErrors()) {
            for (FieldError error : result.getFieldErrors()) {
                errorMessages.append(error.getDefaultMessage()).append("\n");
            }

            if (!userRegistrationViewModel.isPasswordsMatch()) {
                errorMessages.append("Паролите не съвпадат. ");
            }

            redirectAttributes.addFlashAttribute("error", errorMessages.toString());
            return "redirect:/register";
        }

        // Проверка за съществуващ имейл
        Optional<UserEntity> existingUserByEmail = userRepository.findByEmail(userRegistrationViewModel.getEmail());
        if (existingUserByEmail.isPresent()) {
            redirectAttributes.addFlashAttribute("error", "Потребител с този имейл адрес вече съществува!");
            return "redirect:/register";
        }

        // Проверка за съществуващо потребителско име
        Optional<UserEntity> existingUserByUsername = userRepository.findByUsername(userRegistrationViewModel.getUsername());
        if (existingUserByUsername.isPresent()) {
            redirectAttributes.addFlashAttribute("error", "Потребител с това потребителско име вече съществува!");
            return "redirect:/register";
        }

        // Създаване на потребител
        userService.createNewUser(userRegistrationViewModel);

        redirectAttributes.addFlashAttribute("successMessage",
                "Регистрацията е успешна!\nМоля проверете вашия имейл за активация.\nПогледнете и спам папката.");

        return "redirect:/register";
    }
}
