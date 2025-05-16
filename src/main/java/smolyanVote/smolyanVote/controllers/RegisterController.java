package smolyanVote.smolyanVote.controllers;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import smolyanVote.smolyanVote.models.BaseEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.ConfirmationLinkService;
import smolyanVote.smolyanVote.services.EmailService;
import smolyanVote.smolyanVote.services.serviceImpl.UserServiceImpl;
import smolyanVote.smolyanVote.viewsAndDTO.UserRegistrationViewModel;

import java.time.Instant;
import java.util.*;

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
        return "registration"; // връща registration.html с празна форма
    }


    @PostMapping("/user/registration")
    public String register(@Valid UserRegistrationViewModel userRegistrationViewModel,
                           BindingResult result,
                           RedirectAttributes redirectAttributes) {

        StringBuilder errorMessages = new StringBuilder();


        if (result.hasErrors()) {

            for (FieldError error : result.getFieldErrors()) {
                errorMessages.append(error.getDefaultMessage()).append("\n");
            }

            if (!userRegistrationViewModel.isPasswordsMatch()) {
                errorMessages.append("Паролите не съвпадат. ");
            }
            redirectAttributes.addFlashAttribute("error", errorMessages.toString());

            return "redirect:/register";
        } else {

            Optional<UserEntity> existingUserByEmail = userRepository.findByEmail(userRegistrationViewModel.getEmail());
            Optional<UserEntity> existingUserByUsername = userRepository.findByUsername(userRegistrationViewModel.getUsername());

            if (existingUserByEmail.isPresent()) {
                errorMessages.append("Потребител с този имейл адрес вече съществува! Изберете друг.");
                redirectAttributes.addFlashAttribute("error", errorMessages.toString());
                return "redirect:/register";

            }


            if (existingUserByUsername.isPresent()) {
                errorMessages.append("Потребител с това потребителско име вече съществува! Изберете друго.");
                redirectAttributes.addFlashAttribute("error", errorMessages.toString());
                return "redirect:/register";
            }

            redirectAttributes.addFlashAttribute("successMessage",
                    "Регистрацията е успешна!\nМоля проверете вашия Имейл за да активирате вашия профил.");


            userService.createNewUser(userRegistrationViewModel);

        }
        return "redirect:/register";
    }

}
