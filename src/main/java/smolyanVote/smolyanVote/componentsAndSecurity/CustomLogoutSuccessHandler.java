package smolyanVote.smolyanVote.componentsAndSecurity;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.stereotype.Component;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;

import java.io.IOException;
import java.time.Instant;

@Component
public class CustomLogoutSuccessHandler implements LogoutSuccessHandler {

    private final UserRepository userRepository;

    public CustomLogoutSuccessHandler(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void onLogoutSuccess(HttpServletRequest request,
                                HttpServletResponse response,
                                Authentication authentication) throws IOException, ServletException {
        if (authentication != null && authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.User) {
            String email = ((org.springframework.security.core.userdetails.User) authentication.getPrincipal()).getUsername();
            UserEntity user = userRepository.findByEmail(email).orElse(null);
            if (user != null) {
                user.setLastOnline(Instant.now());
                user.setOnlineStatus(0);
                userRepository.save(user);
            }
        }

        response.sendRedirect("/");
    }
}
