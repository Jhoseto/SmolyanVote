package smolyanVote.smolyanVote.componentsAndSecurity;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import smolyanVote.smolyanVote.config.FrontendProperties;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.services.jwt.JwtTokenService;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

/**
 * OAuth2 success handler.
 * <ul>
 *   <li>Mobile ({@code MOBILE_REDIRECT} cookie) → {@code svmessenger://} deep-link with JWT</li>
 *   <li>Web (default for browser OAuth / Next.js) → {@code /oauth-callback} with JWT</li>
 * </ul>
 * Web no longer depends on {@code WEB_OAUTH_REDIRECT} surviving the Google/Facebook
 * round-trip — that cookie was easy to lose and left users on Next without a session.
 */
@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2AuthenticationSuccessHandler.class);

    public static final String WEB_OAUTH_SESSION_ATTR = "WEB_OAUTH_REDIRECT";
    public static final String WEB_OAUTH_COOKIE = "WEB_OAUTH_REDIRECT";
    public static final String MOBILE_OAUTH_COOKIE = "MOBILE_REDIRECT";

    private final JwtTokenService jwtTokenService;
    private final UserService userService;
    private final FrontendProperties frontendProperties;

    public OAuth2AuthenticationSuccessHandler(
            JwtTokenService jwtTokenService,
            UserService userService,
            FrontendProperties frontendProperties) {
        super();
        this.jwtTokenService = jwtTokenService;
        this.userService = userService;
        this.frontendProperties = frontendProperties;
        setDefaultTargetUrl("/");
        setAlwaysUseDefaultTargetUrl(false);
    }

    private String frontendUrl() {
        return frontendProperties.origin();
    }

    private static boolean hasCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return false;
        for (Cookie cookie : request.getCookies()) {
            if (name.equals(cookie.getName())) return true;
        }
        return false;
    }

    private static void clearCookie(HttpServletResponse response, String name) {
        Cookie cookie = new Cookie(name, "");
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    private static void clearWebOAuthMarkers(HttpServletRequest request, HttpServletResponse response) {
        clearCookie(response, WEB_OAUTH_COOKIE);
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.removeAttribute(WEB_OAUTH_SESSION_ATTR);
        }
    }

    private Optional<UserEntity> resolveUser(OAuth2User oauthUser) {
        String email = oauthUser.getAttribute("email");
        if (email != null && !email.isBlank()) {
            return userService.findUserByEmail(email);
        }
        return Optional.empty();
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        boolean isMobile = hasCookie(request, MOBILE_OAUTH_COOKIE);

        if (isMobile) {
            clearCookie(response, MOBILE_OAUTH_COOKIE);
        } else {
            clearWebOAuthMarkers(request, response);
        }

        if (!(authentication.getPrincipal() instanceof OAuth2User oauthUser)) {
            getRedirectStrategy().sendRedirect(request, response,
                    frontendUrl() + "/oauth-callback?error=" + encode("oauth2_invalid_principal"));
            return;
        }

        Optional<UserEntity> userOpt = resolveUser(oauthUser);
        if (userOpt.isEmpty()) {
            log.warn("OAuth success but user not found for email={}", String.valueOf(oauthUser.getAttribute("email")));
            String target = isMobile
                    ? "svmessenger://oauth/callback?error=user_not_found"
                    : frontendUrl() + "/oauth-callback?error=" + encode("user_not_found");
            getRedirectStrategy().sendRedirect(request, response, target);
            return;
        }

        UserEntity user = userOpt.get();

        if (UserStatusEnum.PERMANENTLY_BANNED.equals(user.getStatus())) {
            String reason = user.getBanReason() != null && !user.getBanReason().isBlank()
                    ? user.getBanReason()
                    : "Профилът ви е перманентно блокиран.";
            String target = isMobile
                    ? "svmessenger://oauth/callback?error=permanent_ban"
                    : frontendUrl() + "/oauth-callback?error=permanent_ban&banReason=" + encode(reason);
            getRedirectStrategy().sendRedirect(request, response, target);
            return;
        }

        String accessToken = jwtTokenService.generateAccessToken(user);
        String refreshToken = jwtTokenService.generateRefreshToken(user);
        String encodedAccess = URLEncoder.encode(accessToken, StandardCharsets.UTF_8);
        String encodedRefresh = URLEncoder.encode(refreshToken, StandardCharsets.UTF_8);

        String redirectUrl = isMobile
                ? "svmessenger://oauth/callback?accessToken=" + encodedAccess + "&refreshToken=" + encodedRefresh
                : frontendUrl() + "/oauth-callback?accessToken=" + encodedAccess + "&refreshToken=" + encodedRefresh;

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

    private static String encode(String message) {
        return URLEncoder.encode(message, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
