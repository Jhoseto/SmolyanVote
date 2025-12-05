package smolyanVote.smolyanVote.componentsAndSecurity;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Custom failure handler for OAuth2 authentication.
 * Handles errors during OAuth2 login (Google/Facebook).
 */
@Component
public class OAuth2AuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    public OAuth2AuthenticationFailureHandler() {
        super();
        setDefaultFailureUrl("/viewLogin");
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                       HttpServletResponse response,
                                       AuthenticationException exception) throws IOException, ServletException {
        
        // Извличане на съобщението за грешка
        String errorMessage = exception.getMessage();
        
        // Пренасочване към login страницата с параметър за грешка
        String redirectUrl = "/viewLogin?error=" + encodeErrorMessage(errorMessage);
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

    private String encodeErrorMessage(String message) {
        if (message == null || message.isEmpty()) {
            return "oauth2_error";
        }
        
        // Кодиране на специални символи за URL
        return java.net.URLEncoder.encode(message, java.nio.charset.StandardCharsets.UTF_8)
            .replace("+", "%20");
    }
}

