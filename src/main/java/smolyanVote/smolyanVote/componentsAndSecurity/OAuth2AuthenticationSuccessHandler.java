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
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import jakarta.servlet.http.Cookie;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.services.jwt.JwtTokenService;

/**
 * Custom success handler for OAuth2 authentication.
 * Handles redirect after successful OAuth2 login (Google/Facebook).
 */
@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenService jwtTokenService;
    private final UserService userService;

    public OAuth2AuthenticationSuccessHandler(JwtTokenService jwtTokenService, UserService userService) {
        super();
        this.jwtTokenService = jwtTokenService;
        this.userService = userService;
        setDefaultTargetUrl("/");
        setAlwaysUseDefaultTargetUrl(false);
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        // Проверка за мобилен login (cookie)
        boolean isMobile = false;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("MOBILE_REDIRECT".equals(cookie.getName())) {
                    isMobile = true;
                    // Clear cookie
                    cookie.setValue("");
                    cookie.setPath("/");
                    cookie.setMaxAge(0);
                    response.addCookie(cookie);
                    break;
                }
            }
        }

        if (isMobile) {
            OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
            String email = oauthUser.getAttribute("email");

            if (email != null) {
                Optional<UserEntity> userOpt = userService.findUserByEmail(email);
                if (userOpt.isPresent()) {
                    UserEntity user = userOpt.get();
                    String accessToken = jwtTokenService.generateAccessToken(user);
                    String refreshToken = jwtTokenService.generateRefreshToken(user);

                    // Redirect към мобилното приложение (JWT в query трябва да са URL-encoded)
                    String deepLink = "svmessenger://oauth/callback?accessToken="
                            + URLEncoder.encode(accessToken, StandardCharsets.UTF_8)
                            + "&refreshToken="
                            + URLEncoder.encode(refreshToken, StandardCharsets.UTF_8);
                    getRedirectStrategy().sendRedirect(request, response, deepLink);
                    return;
                }
            }
        }

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
