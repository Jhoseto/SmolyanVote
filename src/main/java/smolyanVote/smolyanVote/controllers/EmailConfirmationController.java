package smolyanVote.smolyanVote.controllers;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.models.enums.ActivityTypeEnum;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.ActivityLogService;

import java.util.Optional;

@Controller
public class EmailConfirmationController {
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;

    public EmailConfirmationController(UserRepository userRepository,
                                      ActivityLogService activityLogService) {
        this.userRepository = userRepository;
        this.activityLogService = activityLogService;
    }

    @Transactional
    @GetMapping("/confirm")
    public String confirmRegistration(@RequestParam("userId") Long userId,
                                      @RequestParam("code") String code,
                                      RedirectAttributes redirectAttributes) {

        Optional<UserEntity> userOptional = userRepository.findById(userId);

        if (userOptional.isPresent()) {
            UserEntity user = userOptional.get();

            if (user.getUserConfirmationCode().equals(code) && user.getStatus().equals(UserStatusEnum.PENDING_ACTIVATION)) {
                user.setStatus(UserStatusEnum.ACTIVE);
                userRepository.save(user);

                // ✅ ЛОГИРАНЕ НА USER_EMAIL_VERIFY
                try {
                    String ipAddress = extractIpAddress();
                    String userAgent = extractUserAgent();
                    String details = "Email verified successfully";
                    activityLogService.logActivity(ActivityActionEnum.USER_EMAIL_VERIFY, user,
                            ActivityTypeEnum.USER.name(), user.getId(), details, ipAddress, userAgent);
                } catch (Exception e) {
                    System.err.println("Failed to log USER_EMAIL_VERIFY activity: " + e.getMessage());
                }

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

    // ===== HELPER METHODS FOR ACTIVITY LOGGING =====

    private String extractIpAddress() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                if (request != null) {
                    String ip = request.getHeader("X-Forwarded-For");
                    if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                        ip = request.getHeader("X-Real-IP");
                    }
                    if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                        ip = request.getRemoteAddr();
                    }
                    if (ip != null && ip.contains(",")) {
                        ip = ip.split(",")[0].trim();
                    }
                    return ip != null ? ip : "unknown";
                }
            }
        } catch (Exception e) {
            // Ignore
        }
        return "unknown";
    }

    private String extractUserAgent() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                if (request != null) {
                    String userAgent = request.getHeader("User-Agent");
                    return userAgent != null ? userAgent : "unknown";
                }
            }
        } catch (Exception e) {
            // Ignore
        }
        return "unknown";
    }
}
