package smolyanVote.smolyanVote.controllers;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import smolyanVote.smolyanVote.config.FrontendProperties;
import smolyanVote.smolyanVote.services.interfaces.UserService;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Legacy {@code /confirm} entry — confirms on Spring, then sends the browser to Next.
 * Preferred path: email links already point at Next {@code /confirm} → API.
 */
@Controller
public class EmailConfirmationController {

    private final UserService userService;
    private final FrontendProperties frontendProperties;

    public EmailConfirmationController(UserService userService, FrontendProperties frontendProperties) {
        this.userService = userService;
        this.frontendProperties = frontendProperties;
    }

    @GetMapping("/confirm")
    public void confirmRegistration(@RequestParam("userId") Long userId,
                                    @RequestParam("code") String code,
                                    HttpServletResponse response) throws IOException {
        boolean confirmed = userService.confirmEmail(userId, code);
        String target = confirmed
                ? frontendProperties.origin() + "/login?confirmed=1"
                : frontendProperties.origin() + "/register?error="
                        + URLEncoder.encode("Невалиден код или акаунтът вече е активиран.", StandardCharsets.UTF_8);
        response.setHeader("Cache-Control", "no-store");
        response.sendRedirect(target);
    }
}
