package smolyanVote.smolyanVote.componentsAndSecurity;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.io.IOException;

/**
 * Custom success handler for OAuth2 authentication.
 * Handles redirect after successful OAuth2 login (Google/Facebook).
 */
@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    public OAuth2AuthenticationSuccessHandler() {
        super();
        setDefaultTargetUrl("/");
        setAlwaysUseDefaultTargetUrl(false);
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        
        // OAuth2 потребителите вече са обработени от CustomOAuth2UserService
        // Тук просто пренасочваме към главната страница
        String targetUrl = determineTargetUrl(request, response, authentication);
        
        if (response.isCommitted()) {
            return;
        }
        
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    protected String determineTargetUrl(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) {
        // Проверка за redirect параметър
        String redirectUrl = request.getParameter("redirectUrl");
        if (redirectUrl != null && redirectUrl.startsWith("/") && !redirectUrl.startsWith("//")) {
            return redirectUrl;
        }
        
        // По подразбиране пренасочване към главната страница
        return "/";
    }
}

