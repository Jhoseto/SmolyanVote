package smolyanVote.smolyanVote.componentsAndSecurity;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.SimpleUrlLogoutSuccessHandler;
import org.springframework.stereotype.Component;
import smolyanVote.smolyanVote.annotations.LogActivity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.models.enums.ActivityTypeEnum;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.repositories.UserRepository;

import java.io.IOException;
import java.time.Instant;

@Component
public class CustomLogoutSuccessHandler extends SimpleUrlLogoutSuccessHandler {

    private final UserRepository userRepository;

    public CustomLogoutSuccessHandler(UserRepository userRepository) {
        this.userRepository = userRepository;
        setDefaultTargetUrl("/");
        setAlwaysUseDefaultTargetUrl(true); // Винаги използвай default target URL
    }

    @Override
    @LogActivity(action = ActivityActionEnum.USER_LOGOUT, entityType = ActivityTypeEnum.USER,
            details = "Username: {username}, Email: {email}")

    public void onLogoutSuccess(HttpServletRequest request,
                                HttpServletResponse response,
                                Authentication authentication) throws IOException, ServletException {
        if (authentication != null) {
            String email = null;
            
            // Проверка за OAuth2User (Google/Facebook login)
            if (authentication.getPrincipal() instanceof org.springframework.security.oauth2.core.user.OAuth2User) {
                org.springframework.security.oauth2.core.user.OAuth2User oAuth2User = 
                    (org.springframework.security.oauth2.core.user.OAuth2User) authentication.getPrincipal();
                // За OAuth2, извличаме email от атрибутите
                email = oAuth2User.getAttribute("email");
            } 
            // Проверка за традиционна автентикация
            else if (authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.User) {
                email = ((org.springframework.security.core.userdetails.User) authentication.getPrincipal()).getUsername();
            }
            // Fallback - опитай да извлечеш от getName()
            else if (authentication.getName() != null && !authentication.getName().isEmpty()) {
                email = authentication.getName();
            }
            
            if (email != null && !email.isEmpty()) {
                String normalizedEmail = email.toLowerCase().trim();
                UserEntity user = userRepository.findByEmail(normalizedEmail)
                        .or(() -> userRepository.findByUsername(normalizedEmail))
                        .orElse(null);
                if (user != null) {
                    user.setLastOnline(Instant.now());
                    user.setOnlineStatus(0);
                    userRepository.save(user);
                }
            }
        }

        // Използваме родителския метод, който правилно обработва redirect-а
        super.onLogoutSuccess(request, response, authentication);
    }
}
