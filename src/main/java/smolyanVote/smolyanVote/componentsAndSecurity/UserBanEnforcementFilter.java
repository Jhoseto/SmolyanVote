package smolyanVote.smolyanVote.componentsAndSecurity;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import smolyanVote.smolyanVote.exceptions.UserBannedException;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.services.interfaces.UserBanService;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Blocks mutating requests for read-only banned users (temporary or permanent).
 * GET/HEAD/OPTIONS remain allowed so banned users can browse the platform.
 */
@Component
public class UserBanEnforcementFilter extends OncePerRequestFilter {

    private final UserBanService userBanService;

    public UserBanEnforcementFilter(UserBanService userBanService) {
        this.userBanService = userBanService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (isMutatingMethod(request.getMethod()) && !isAllowedWhileBanned(request.getRequestURI())) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof UserEntity user) {
                user = userBanService.resolveBanState(user);
                if (userBanService.isReadOnlyBanned(user)) {
                    writeBannedResponse(response, user);
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private static boolean isMutatingMethod(String method) {
        return HttpMethod.POST.matches(method)
                || HttpMethod.PUT.matches(method)
                || HttpMethod.PATCH.matches(method)
                || HttpMethod.DELETE.matches(method);
    }

    private static boolean isAllowedWhileBanned(String uri) {
        if (uri == null) {
            return false;
        }
        return uri.equals("/api/mobile/auth/logout")
                || uri.startsWith("/api/mobile/auth/logout");
    }

    private void writeBannedResponse(HttpServletResponse response, UserEntity user) throws IOException {
        boolean permanent = userBanService.isPermanentlyBanned(user);
        UserBannedException ex = new UserBannedException(
                permanent
                        ? "Профилът ви е перманентно блокиран."
                        : "Профилът ви е временно ограничен. Можете само да разглеждате съдържание.",
                user.getBanEndDate(),
                user.getBanReason(),
                permanent);

        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        String banEnd = user.getBanEndDate() != null ? "\"" + user.getBanEndDate() + "\"" : "null";
        String banReason = user.getBanReason() != null
                ? "\"" + escapeJson(user.getBanReason()) + "\""
                : "null";

        response.getWriter().write("""
                {"message":"%s","status":403,"code":"USER_BANNED","readOnly":true,"permanent":%s,"banEndDate":%s,"banReason":%s}
                """.formatted(
                escapeJson(ex.getMessage()),
                permanent,
                banEnd,
                banReason));
    }

    private static String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
