package smolyanVote.smolyanVote.componentsAndSecurity;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import smolyanVote.smolyanVote.config.FrontendProperties;

import java.io.IOException;

/**
 * Custom failure handler for OAuth2 authentication.
 * Redirects to the Next.js login page (not legacy Thymeleaf /viewLogin).
 */
@Component
public class OAuth2AuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    private final FrontendProperties frontendProperties;

    public OAuth2AuthenticationFailureHandler(FrontendProperties frontendProperties) {
        super();
        this.frontendProperties = frontendProperties;
        setDefaultFailureUrl(frontendProperties.origin() + "/login");
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                       HttpServletResponse response,
                                       AuthenticationException exception) throws IOException, ServletException {
        // Clear web OAuth markers so a retry starts clean.
        jakarta.servlet.http.Cookie clear = new jakarta.servlet.http.Cookie(
                OAuth2AuthenticationSuccessHandler.WEB_OAUTH_COOKIE, "");
        clear.setPath("/");
        clear.setMaxAge(0);
        response.addCookie(clear);
        jakarta.servlet.http.HttpSession session = request.getSession(false);
        if (session != null) {
            session.removeAttribute(OAuth2AuthenticationSuccessHandler.WEB_OAUTH_SESSION_ATTR);
        }

        String errorMessage = exception.getMessage();
        String redirectUrl = frontendProperties.originForOAuth(request)
                + "/oauth-callback?error=" + encodeErrorMessage(errorMessage);
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

    private String encodeErrorMessage(String message) {
        if (message == null || message.isEmpty()) {
            return "oauth2_error";
        }

        return java.net.URLEncoder.encode(message, java.nio.charset.StandardCharsets.UTF_8)
            .replace("+", "%20");
    }
}
