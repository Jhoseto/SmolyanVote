package smolyanVote.smolyanVote.controllers;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.SubscriptionType;
import smolyanVote.smolyanVote.services.interfaces.SubscriptionService;
import smolyanVote.smolyanVote.services.interfaces.UserService;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Controller
@Slf4j
@RequestMapping("/subscription")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final UserService userService;

    @Autowired
    public SubscriptionController(SubscriptionService subscriptionService, UserService userService) {
        this.subscriptionService = subscriptionService;
        this.userService = userService;
    }

    @PostMapping("/update")
    public String updateSubscriptions(
            @RequestParam(value = "subscriptions", required = false) Set<String> subscriptionTypes,
            @RequestParam(value = "redirectUrl", defaultValue = "/") String redirectUrl,
            Authentication authentication,
            RedirectAttributes redirectAttributes) {

        try {
            // Проверка дали потребителят е влязъл
            if (authentication == null || !authentication.isAuthenticated()) {
                redirectAttributes.addFlashAttribute("subscriptionError", "Моля, влезте в профила си за да се абонирате");
                return "redirect:" + redirectUrl;
            }

            // Намиране на потребителя
            String userEmail = authentication.getName();
            UserEntity user = userService.findUserByEmail(userEmail)
                    .orElseThrow(() -> new IllegalArgumentException("Потребителят не е намерен"));

            // Конвертиране на избраните типове
            Set<SubscriptionType> types = subscriptionTypes != null ?
                    subscriptionTypes.stream()
                            .map(SubscriptionType::valueOf)
                            .collect(Collectors.toSet()) :
                    new HashSet<>();

            // Запазване в базата
            subscriptionService.updateUserSubscriptions(user, types);

            log.info("User {} updated subscriptions: {}", userEmail, types);

            // Success съобщение
            if (types.isEmpty()) {
                redirectAttributes.addFlashAttribute("subscriptionSuccess", "Успешно се отписахте от всички известия");
            } else {
                redirectAttributes.addFlashAttribute("subscriptionSuccess",
                        "Успешно се абонирахте и за напред ще получавате известия на вашата поща");
            }

        } catch (Exception e) {
            log.error("Error updating subscriptions for user", e);
            redirectAttributes.addFlashAttribute("subscriptionError", "Възникна грешка. Моля, опитайте отново.");
        }

        // Връщане към същата страница
        return "redirect:" + redirectUrl;
    }
}