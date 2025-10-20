package smolyanVote.smolyanVote.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import smolyanVote.smolyanVote.services.interfaces.PasswordResetService;

@Controller
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    public PasswordResetController(PasswordResetService passwordResetService) {
        this.passwordResetService = passwordResetService;
    }

    @GetMapping("/forgotten_password")
    public String showForgottenPasswordPage() {
        return "forgotten_password";
    }

    @PostMapping("/forgotten_password")
    public String requestPasswordReset(@RequestParam("email") String email,
                                      RedirectAttributes redirectAttributes) {
        try {
            passwordResetService.requestPasswordReset(email);
            redirectAttributes.addFlashAttribute("message", 
                "Ако имейлът съществува в системата, ще получите линк за възстановяване на парола.");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", 
                "Възникна грешка при изпращане на имейла. Моля, опитайте отново.");
        }
        return "redirect:/forgotten_password";
    }

    @GetMapping("/reset-password")
    public String showResetPasswordPage(@RequestParam("token") String token, Model model) {
        model.addAttribute("token", token);
        return "reset_password";
    }

    @PostMapping("/reset-password")
    public String resetPassword(@RequestParam("token") String token,
                               @RequestParam("password") String password,
                               @RequestParam("confirmPassword") String confirmPassword,
                               RedirectAttributes redirectAttributes) {
        
        if (!password.equals(confirmPassword)) {
            redirectAttributes.addFlashAttribute("error", "Паролите не съвпадат.");
            return "redirect:/reset-password?token=" + token;
        }

        if (password.length() < 6) {
            redirectAttributes.addFlashAttribute("error", "Паролата трябва да бъде поне 6 символа.");
            return "redirect:/reset-password?token=" + token;
        }

        try {
            boolean success = passwordResetService.resetPassword(token, password);
            if (success) {
                redirectAttributes.addFlashAttribute("message", 
                    "Паролата е успешно обновена. Можете да влезете в системата.");
                return "redirect:/viewLogin";
            } else {
                redirectAttributes.addFlashAttribute("error", 
                    "Невалиден или изтекъл токен. Моля, заявете нов линк за възстановяване.");
                return "redirect:/forgotten_password";
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", 
                "Възникна грешка при обновяване на паролата. Моля, опитайте отново.");
            return "redirect:/reset-password?token=" + token;
        }
    }
}
