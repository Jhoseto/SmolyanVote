package smolyanVote.smolyanVote.componentsAndSecurity;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.jwt.JwtTokenService;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

/**
 * JWT Authentication Filter за мобилни заявки
 * Извлича JWT token от Authorization header и аутентицира user
 */
@Component
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenService jwtTokenService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtTokenService jwtTokenService, UserRepository userRepository) {
        this.jwtTokenService = jwtTokenService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Извличане на JWT token от Authorization header
        String token = extractTokenFromRequest(request);

        if (token != null && jwtTokenService.validateToken(token) && jwtTokenService.isAccessToken(token)) {
            try {
                // Извличане на user info от token
                String email = jwtTokenService.extractEmail(token);
                Long userId = jwtTokenService.extractUserId(token);

                if (email != null && userId != null) {
                    // Зареждане на user от database
                    Optional<UserEntity> userOptional = userRepository.findByEmail(email);

                    if (userOptional.isPresent()) {
                        UserEntity user = userOptional.get();

                        // Проверка дали user ID съвпада
                        if (user.getId().equals(userId)) {
                            // Създаване на authentication object
                            String role = user.getRole() != null ? user.getRole().name() : "USER";
                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(
                                            user,
                                            null,
                                            Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
                                    );

                            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                            // Set в SecurityContext
                            SecurityContextHolder.getContext().setAuthentication(authentication);

                            log.debug("JWT authentication successful for user: {}", email);
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Error setting JWT authentication: {}", e.getMessage());
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Извлича JWT token от Authorization header
     * Формат: "Bearer <token>"
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");

        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }

        return null;
    }

    /**
     * Прилага filter за мобилни API endpoints и за endpoints, ползвани от
     * новия Next.js frontend (MODERN_FRONTEND_PLAN.md), който е JWT-only и
     * няма Spring Session. Тези endpoints вече изискват .authenticated() в
     * {@link ApplicationSecurityConfiguration} — без JWT filter тук заявки
     * с Bearer token биха връщали 401.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();

        return !path.startsWith("/api/mobile/")
                && !path.startsWith("/api/svmessenger/")
                && !path.startsWith("/api/notifications/")
                && !path.startsWith("/api/v1/")
                && !path.startsWith("/api/comments/")
                && !path.startsWith("/api/reports/")
                && !path.startsWith("/api/follow/")
                && !path.startsWith("/admin/")
                && !path.equals("/heartbeat")
                && !path.startsWith("/subscription/");
    }
}

